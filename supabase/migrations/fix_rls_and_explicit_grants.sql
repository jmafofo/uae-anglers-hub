-- ============================================================
-- UAE Anglers Hub — Fix RLS gaps + explicit schema grants
--
-- 1. Enables RLS on moderation_keywords (was missing — flagged
--    by Supabase Security Advisor as "Table publicly accessible")
-- 2. Adds admin-only SELECT policy on moderation_keywords
-- 3. Adds explicit GRANTs on the public schema so existing
--    behaviour is preserved after Supabase's May 30 2026 change
--    (new tables will no longer auto-expose to PostgREST)
-- ============================================================

-- ── 1. moderation_keywords ────────────────────────────────────

alter table if exists public.moderation_keywords enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'moderation_keywords'
      and policyname  = 'Admin-only read moderation_keywords'
  ) then
    create policy "Admin-only read moderation_keywords"
      on public.moderation_keywords for select
      using (exists (
        select 1 from public.profiles
        where id = auth.uid() and is_admin = true
      ));
  end if;
end $$;

-- ── 2. Explicit schema grants (future-proof for Supabase change) ──

-- Grant schema usage
grant usage on schema public to anon, authenticated, service_role;

-- Existing tables / sequences / routines
grant all privileges on all tables    in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all routines  in schema public to anon, authenticated, service_role;

-- Default privileges for future objects created in public
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to anon, authenticated, service_role;
