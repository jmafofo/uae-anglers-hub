-- ============================================================
-- UAE Anglers Hub — Supabase advisor fixes
--
-- Addresses:
--
-- 1. SECURITY (warning) — public.waitlist_emails has RLS
--    policies with USING/WITH CHECK = true for UPDATE/DELETE.
--    Means anonymous users can modify or delete waitlist rows.
--    Replaces with: public INSERT, admin-only SELECT/UPDATE/DELETE.
--
-- 2. PERFORMANCE (60+ warnings) — "Auth RLS Initialization Plan":
--    Postgres re-evaluates `auth.uid()` per row. Wrapping in
--    (select auth.uid()) turns it into an InitPlan — evaluated
--    once per query. Big win at scale.
--
-- How section 2 works:
--   - Scans pg_policies for any policy in the public schema
--     whose USING or WITH CHECK expression contains a bare
--     `auth.uid()` (not already wrapped in `(select …)`).
--   - For each match, rewrites the expression via regex and
--     recreates the policy with the SAME name so app code
--     doesn't have to change.
--   - Skips anything that's already rewritten — safe to re-run.
--   - Emits a NOTICE per policy so the SQL editor output shows
--     exactly what changed.
-- ============================================================

-- ── 1. waitlist_emails — tighten write policies ─────────────
-- Whole block is conditional on the table existing so the
-- migration runs cleanly in environments without a waitlist.
do $$
declare
  r record;
begin
  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'waitlist_emails'
  ) then
    raise notice 'waitlist_emails table does not exist — skipping section 1';
    return;
  end if;

  execute 'alter table public.waitlist_emails enable row level security';

  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'waitlist_emails'
  loop
    execute format('drop policy if exists %I on public.waitlist_emails', r.policyname);
  end loop;

  execute $q$
    create policy "Anyone can join waitlist"
      on public.waitlist_emails for insert
      with check (true)
  $q$;

  execute $q$
    create policy "Admins read waitlist"
      on public.waitlist_emails for select
      using (exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and is_admin = true
      ))
  $q$;

  execute $q$
    create policy "Admins update waitlist"
      on public.waitlist_emails for update
      using (exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and is_admin = true
      ))
  $q$;

  execute $q$
    create policy "Admins delete waitlist"
      on public.waitlist_emails for delete
      using (exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and is_admin = true
      ))
  $q$;
end $$;

-- ── 2. Rewrite every auth.uid() reference to (select auth.uid()) ──
do $$
declare
  pol record;
  new_using text;
  new_check text;
  roles_clause text;
  cmd_upper text;
  rewritten int := 0;
  skipped   int := 0;
begin
  for pol in
    select
      p.policyname,
      p.tablename,
      p.cmd,
      p.qual,
      p.with_check,
      p.roles,
      p.permissive
    from pg_policies p
    where p.schemaname = 'public'
      and (p.qual ~ 'auth\.uid\s*\(\s*\)'
           or p.with_check ~ 'auth\.uid\s*\(\s*\)')
  loop
    -- Idempotent two-pass normalize: first unwrap any existing
    -- `(select auth.uid())`, then wrap all bare `auth.uid()`.
    -- Re-running this migration produces no change.
    new_using := regexp_replace(
      regexp_replace(
        coalesce(pol.qual, ''),
        '\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)',
        'auth.uid()',
        'gi'),
      'auth\.uid\s*\(\s*\)',
      '(select auth.uid())',
      'g');
    new_check := regexp_replace(
      regexp_replace(
        coalesce(pol.with_check, ''),
        '\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)',
        'auth.uid()',
        'gi'),
      'auth\.uid\s*\(\s*\)',
      '(select auth.uid())',
      'g');

    -- If no actual change, skip (keeps the policy untouched).
    if coalesce(new_using, '') = coalesce(pol.qual, '')
       and coalesce(new_check, '') = coalesce(pol.with_check, '') then
      skipped := skipped + 1;
      continue;
    end if;

    -- Rebuild the TO clause exactly as it was. pg_policies.roles is
    -- name[]; default is {public} which we drop (no TO clause needed).
    if pol.roles is null
       or pol.roles = '{public}'::name[]
       or array_length(pol.roles, 1) is null then
      roles_clause := '';
    else
      roles_clause := ' to ' || (
        select string_agg(quote_ident(r), ',')
        from unnest(pol.roles) r
      );
    end if;

    cmd_upper := upper(pol.cmd);

    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname, pol.tablename);

    if cmd_upper = 'INSERT' then
      execute format(
        'create policy %I on public.%I as %s for insert%s with check (%s)',
        pol.policyname, pol.tablename,
        case when pol.permissive = 'RESTRICTIVE' then 'restrictive' else 'permissive' end,
        roles_clause, new_check);

    elsif cmd_upper = 'SELECT' or cmd_upper = 'DELETE' then
      execute format(
        'create policy %I on public.%I as %s for %s%s using (%s)',
        pol.policyname, pol.tablename,
        case when pol.permissive = 'RESTRICTIVE' then 'restrictive' else 'permissive' end,
        lower(cmd_upper), roles_clause, new_using);

    else -- UPDATE or ALL
      execute format(
        'create policy %I on public.%I as %s for %s%s using (%s)%s',
        pol.policyname, pol.tablename,
        case when pol.permissive = 'RESTRICTIVE' then 'restrictive' else 'permissive' end,
        lower(cmd_upper), roles_clause, new_using,
        case when coalesce(pol.with_check, '') <> ''
             then ' with check (' || new_check || ')'
             else ''
        end);
    end if;

    rewritten := rewritten + 1;
    raise notice 'rewrote % policy on %.% (cmd=%)', pol.policyname, 'public', pol.tablename, cmd_upper;
  end loop;

  raise notice 'auth.uid() rewrite complete: % rewritten, % skipped', rewritten, skipped;
end $$;
