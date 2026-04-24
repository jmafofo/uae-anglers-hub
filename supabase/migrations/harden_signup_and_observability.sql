-- ============================================================
-- UAE Anglers Hub — Post-launch signup hardening + observability
--
-- 1. `handle_new_user` trigger is collision-resistant. Previously
--    two emails that slugified to the same string (alice@x.com /
--    alice-writes@y.com → both "alice") would cause the second
--    signup's profile INSERT to fail on UNIQUE(username), leaving
--    a zombie auth.users row with no profile. Now appends a short
--    random suffix on collision.
--
-- 2. Backfills profiles for any zombie auth.users that were
--    created before this migration.
--
-- 3. `signup_errors` — lightweight log of client-side signup
--    failures posted from the signup page, so we can see error
--    patterns without reading Supabase Auth logs.
--
-- NOTE: The PostGIS `public.spatial_ref_sys` RLS advisor warning
-- is NOT fixable from the SQL editor — the table is owned by the
-- `postgres` superuser, not `supabase_admin`. It's a harmless
-- public EPSG catalog; safe to ignore. If you really want it
-- silenced, click Fix in the Supabase advisor UI (which runs as
-- superuser), or lodge a support ticket.
-- ============================================================

-- ── 1. Collision-resistant signup trigger ───────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate text;
  suffix    text;
  tries     int := 0;
  name_source text;
begin
  name_source := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  candidate := lower(regexp_replace(name_source, '[^a-z0-9]', '', 'g'));
  if candidate = '' then candidate := 'angler'; end if;

  -- Retry with a random suffix on UNIQUE(username) collisions.
  -- 6 attempts with 6 hex chars → 16^6 = 16.7M combinations;
  -- collision still possible but vanishingly unlikely.
  loop
    begin
      insert into public.profiles (id, username, display_name)
      values (
        new.id,
        candidate,
        coalesce(new.raw_user_meta_data->>'display_name', name_source)
      );
      return new;
    exception when unique_violation then
      tries := tries + 1;
      if tries >= 6 then
        -- Absolute last-ditch: just use the uuid as username.
        insert into public.profiles (id, username, display_name)
        values (new.id, 'angler_' || substr(new.id::text, 1, 8), name_source)
        on conflict (id) do nothing;
        return new;
      end if;
      suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      candidate := lower(regexp_replace(name_source, '[^a-z0-9]', '', 'g')) || '_' || suffix;
    end;
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger itself doesn't need re-creation — it already calls this function.

-- ── 2. Backfill zombie auth users that never got a profile ──
-- One-time rescue: any auth.users row without a corresponding
-- profiles row gets one. Uses the same slugify rule + random
-- suffix as the trigger so no further collisions can happen.
do $$
declare
  u record;
  candidate text;
  suffix text;
  inserted boolean;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    candidate := lower(regexp_replace(
      coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
      '[^a-z0-9]', '', 'g'));
    if candidate = '' then candidate := 'angler'; end if;

    inserted := false;
    for i in 1..6 loop
      begin
        insert into public.profiles (id, username, display_name)
        values (
          u.id,
          candidate,
          coalesce(u.raw_user_meta_data->>'display_name',
                   split_part(u.email, '@', 1))
        );
        inserted := true;
        exit;
      exception when unique_violation then
        suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
        candidate := lower(regexp_replace(
          coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
          '[^a-z0-9]', '', 'g')) || '_' || suffix;
      end;
    end loop;

    if not inserted then
      insert into public.profiles (id, username, display_name)
      values (u.id, 'angler_' || substr(u.id::text, 1, 8),
              coalesce(u.raw_user_meta_data->>'display_name',
                       split_part(u.email, '@', 1)))
      on conflict (id) do nothing;
    end if;
  end loop;
end $$;

-- ── 3. Signup error log ─────────────────────────────────────
create table if not exists public.signup_errors (
  id            uuid primary key default gen_random_uuid(),
  error_message text not null,
  email_domain  text,
  user_agent    text,
  path          text,
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index if not exists signup_errors_created_ix
  on public.signup_errors (created_at desc);

alter table public.signup_errors enable row level security;

-- Writes come from the service-role endpoint. Reads are admin-only
-- so we don't leak the error stream to public.
create policy "Admins read signup errors"
  on public.signup_errors for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

