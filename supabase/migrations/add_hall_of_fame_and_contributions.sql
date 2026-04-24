-- ============================================================
-- UAE Anglers Hub — Hall of Fame, new-spot proposals, admin flag
--
-- Depends on: add_spots_and_waypoints.sql
-- ============================================================

-- ── Admin flag on profiles ──────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Prevent self-promotion: users cannot flip their own is_admin
-- via the anon client. The existing "Users can update their own
-- profile" policy on profiles is USING-only (no WITH CHECK), so
-- add a stricter check.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users update own profile without elevating"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );

-- ── New-spot proposals ──────────────────────────────────────
-- Used when a waypoint is dropped far from any existing spot,
-- or when a user explicitly suggests a new fishing location.
create table if not exists public.spot_contributions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  emirate       text,
  latitude      numeric(9,6) not null,
  longitude     numeric(9,6) not null,
  access_type   text,
  description   text,
  photo_url     text,
  target_species text[] default '{}',
  status        text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  admin_notes   text,
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  approved_spot_id uuid references public.spots(id),
  created_at    timestamptz not null default now()
);

create index if not exists spot_contributions_status_ix on public.spot_contributions (status);
create index if not exists spot_contributions_user_ix on public.spot_contributions (user_id);

alter table public.spot_contributions enable row level security;

create policy "Users see own contributions"
  on public.spot_contributions for select
  using (auth.uid() = user_id);

create policy "Admins see all contributions"
  on public.spot_contributions for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

create policy "Users submit own contributions"
  on public.spot_contributions for insert
  with check (auth.uid() = user_id);

create policy "Admins review contributions"
  on public.spot_contributions for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

-- ── Hall of Fame view ───────────────────────────────────────
-- Ranks catches eligible for leaderboards. Only public,
-- identified catches with a positive weight count — an
-- "unnamed giant" shouldn't top the board.
create or replace view public.hall_of_fame_entries
with (security_invoker = on) as
select
  c.id             as catch_id,
  c.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.emirate        as angler_emirate,
  c.species,
  c.scientific_name,
  c.weight_kg,
  c.length_cm,
  c.photo_url,
  c.emirate        as catch_emirate,
  c.location_name,
  c.spot_id,
  c.caught_at,
  date_trunc('week',  c.caught_at) as week_start,
  date_trunc('month', c.caught_at) as month_start,
  date_trunc('year',  c.caught_at) as year_start
from public.catches c
join public.profiles p on p.id = c.user_id
where c.is_public = true
  and c.weight_kg is not null
  and c.weight_kg > 0
  and coalesce(c.identification_status, 'identified') = 'identified';

grant select on public.hall_of_fame_entries to anon, authenticated;

-- ── Hall of Fame RPC: heaviest-per-period with optional filters ──
create or replace function public.hall_of_fame(
  p_period  text default 'week',      -- week | month | year | all
  p_metric  text default 'weight',    -- weight | length
  p_species text default null,
  p_emirate text default null,
  p_limit   int  default 10
) returns table (
  rank           int,
  catch_id       uuid,
  user_id        uuid,
  username       text,
  display_name   text,
  avatar_url     text,
  species        text,
  scientific_name text,
  weight_kg      numeric,
  length_cm      numeric,
  photo_url      text,
  catch_emirate  text,
  location_name  text,
  caught_at      timestamptz
) language sql stable as $$
  with filtered as (
    select *
    from public.hall_of_fame_entries e
    where (
      p_period = 'all'
      or (p_period = 'week'  and e.caught_at >= date_trunc('week',  now()))
      or (p_period = 'month' and e.caught_at >= date_trunc('month', now()))
      or (p_period = 'year'  and e.caught_at >= date_trunc('year',  now()))
    )
      and (p_species is null or e.species ilike p_species)
      and (p_emirate is null or e.catch_emirate = p_emirate
                             or e.angler_emirate = p_emirate)
      and (p_metric <> 'length' or e.length_cm is not null)
  ),
  ranked as (
    select
      row_number() over (
        order by case when p_metric = 'length' then length_cm else weight_kg end desc,
                 caught_at asc
      )::int as rank,
      catch_id, user_id, username, display_name, avatar_url,
      species, scientific_name, weight_kg, length_cm, photo_url,
      catch_emirate, location_name, caught_at
    from filtered
  )
  select * from ranked where rank <= greatest(1, p_limit);
$$;

grant execute on function public.hall_of_fame(text, text, text, text, int) to anon, authenticated;
