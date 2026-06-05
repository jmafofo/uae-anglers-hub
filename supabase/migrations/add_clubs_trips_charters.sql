-- ============================================================
-- UAE Anglers Hub — Clubs, Trip Posts & Charter Directory
--
-- Phase 1 MVP: Private/invite-only clubs, trip posts with RSVP,
-- and charter directory promoted from static to database.
--
-- Tables:
--   clubs            — private fishing clubs / groups
--   club_members     — membership with roles
--   trip_posts       — extends posts with trip metadata
--   trip_rsvps       — RSVP tracking for trip posts
--   charters         — charter operator directory (DB-backed)
--
-- IDEMPOTENT: safe to re-run.
-- ============================================================

-- ── 1. CLUBS ────────────────────────────────────────────────
create table if not exists public.clubs (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  logo_url      text,
  created_by    uuid references public.profiles(id) on delete cascade not null,
  visibility    text not null default 'private' check (visibility in ('private', 'public')),
  member_count  int not null default 0,
  created_at    timestamptz default now()
);

create index if not exists clubs_slug_ix on public.clubs (slug);
create index if not exists clubs_created_by_ix on public.clubs (created_by);
create index if not exists clubs_visibility_ix on public.clubs (visibility, created_at desc);

alter table public.clubs enable row level security;

-- Anyone can see public clubs
-- Private clubs: only active members can see
create policy "Clubs viewable by members or if public"
  on public.clubs for select
  using (
    visibility = 'public'
    or auth.uid() in (
      select user_id from public.club_members
      where club_id = id and status = 'active'
    )
  );

create policy "Authenticated users can create clubs"
  on public.clubs for insert
  with check (auth.uid() = created_by);

create policy "Club owners can update their clubs"
  on public.clubs for update
  using (auth.uid() = created_by);

create policy "Club owners can delete their clubs"
  on public.clubs for delete
  using (auth.uid() = created_by);


-- ── 2. CLUB MEMBERS ─────────────────────────────────────────
create table if not exists public.club_members (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid references public.clubs(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  role       text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status     text not null default 'invited' check (status in ('invited', 'active')),
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at  timestamptz,
  created_at timestamptz default now(),
  unique (club_id, user_id)
);

create index if not exists club_members_club_ix on public.club_members (club_id, status, role);
create index if not exists club_members_user_ix on public.club_members (user_id, status);

alter table public.club_members enable row level security;

-- Members can see other members of their clubs
create policy "Club members viewable by club members"
  on public.club_members for select
  using (
    auth.uid() in (
      select user_id from public.club_members
      where club_id = club_members.club_id and status = 'active'
    )
  );

create policy "Club owners and admins can invite members"
  on public.club_members for insert
  with check (
    auth.uid() in (
      select user_id from public.club_members
      where club_id = club_members.club_id
        and status = 'active'
        and role in ('owner', 'admin')
    )
  );

create policy "Users can update own membership (accept invite, leave)"
  on public.club_members for update
  using (auth.uid() = user_id);

create policy "Club owners can remove members"
  on public.club_members for delete
  using (
    auth.uid() in (
      select user_id from public.club_members
      where club_id = club_members.club_id
        and status = 'active'
        and role = 'owner'
    )
    or auth.uid() = user_id  -- users can leave on their own
  );


-- ── 3. TRIP POSTS ───────────────────────────────────────────
-- Extends the existing posts table with trip metadata.
-- A trip post is still a normal post (likes, comments, media all work).
create table if not exists public.trip_posts (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid references public.posts(id) on delete cascade not null,
  club_id          uuid references public.clubs(id) on delete cascade not null,
  destination      text not null,
  country          text not null default 'UAE',
  start_date       date,
  end_date         date,
  max_participants int,
  price_estimate   text,
  status           text not null default 'open' check (status in ('open', 'full', 'cancelled', 'completed')),
  rsvp_count       int not null default 0,
  created_at       timestamptz default now(),
  unique (post_id)
);

create index if not exists trip_posts_club_ix on public.trip_posts (club_id, status, start_date);
create index if not exists trip_posts_post_ix on public.trip_posts (post_id);

alter table public.trip_posts enable row level security;

-- Trip posts visible to club members
create policy "Trip posts viewable by club members"
  on public.trip_posts for select
  using (
    auth.uid() in (
      select user_id from public.club_members
      where club_id = trip_posts.club_id and status = 'active'
    )
  );

create policy "Club members can create trip posts"
  on public.trip_posts for insert
  with check (
    auth.uid() in (
      select user_id from public.club_members
      where club_id = trip_posts.club_id and status = 'active'
    )
  );

create policy "Post authors can update their trip posts"
  on public.trip_posts for update
  using (
    auth.uid() = (
      select user_id from public.posts where id = trip_posts.post_id
    )
  );

create policy "Post authors can delete their trip posts"
  on public.trip_posts for delete
  using (
    auth.uid() = (
      select user_id from public.posts where id = trip_posts.post_id
    )
  );


-- ── 4. TRIP RSVPs ───────────────────────────────────────────
create table if not exists public.trip_rsvps (
  id           uuid primary key default gen_random_uuid(),
  trip_post_id uuid references public.trip_posts(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  status       text not null default 'interested' check (status in ('interested', 'confirmed', 'declined')),
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (trip_post_id, user_id)
);

create index if not exists trip_rsvps_trip_ix on public.trip_rsvps (trip_post_id, status);
create index if not exists trip_rsvps_user_ix on public.trip_rsvps (user_id, created_at desc);

alter table public.trip_rsvps enable row level security;

create policy "Trip RSVPs viewable by club members"
  on public.trip_rsvps for select
  using (
    auth.uid() in (
      select user_id from public.club_members cm
      join public.trip_posts tp on tp.club_id = cm.club_id
      where tp.id = trip_rsvps.trip_post_id and cm.status = 'active'
    )
  );

create policy "Users can RSVP to trips"
  on public.trip_rsvps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own RSVP"
  on public.trip_rsvps for update
  using (auth.uid() = user_id);

create policy "Users can delete own RSVP"
  on public.trip_rsvps for delete
  using (auth.uid() = user_id);


-- ── 5. CHARTERS ─────────────────────────────────────────────
create table if not exists public.charters (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  location        text not null,
  country         text not null default 'UAE',
  emirate         text,
  coast           text,
  target_species  text[] default '{}',
  charter_type    text[] default '{}',
  duration        text,
  capacity        int,
  price_aed       int,
  highlights      text[] default '{}',
  contact_email   text,
  website         text,
  phone           text,
  rating          numeric(2,1),
  photo_urls      text[] default '{}',
  is_verified     boolean default false,
  created_at      timestamptz default now()
);

create index if not exists charters_slug_ix on public.charters (slug);
create index if not exists charters_country_ix on public.charters (country, emirate);
create index if not exists charters_verified_ix on public.charters (is_verified, rating desc nulls last);

alter table public.charters enable row level security;

-- Charters are public read
create policy "Charters viewable by all"
  on public.charters for select using (true);

-- Only admins can manage charters (manual for now)
create policy "Authenticated users can create charters"
  on public.charters for insert with check (auth.role() = 'authenticated');


-- ── 6. TRIGGERS ─────────────────────────────────────────────

-- Auto-update club member_count
-- On member status change to 'active', increment
-- On member delete or status change from 'active', decrement
create or replace function public.update_club_member_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    update public.clubs set member_count = member_count + 1 where id = new.club_id;
    return new;
  elsif tg_op = 'DELETE' and old.status = 'active' then
    update public.clubs set member_count = member_count - 1 where id = old.club_id;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.status != 'active' and new.status = 'active' then
      update public.clubs set member_count = member_count + 1 where id = new.club_id;
    elsif old.status = 'active' and new.status != 'active' then
      update public.clubs set member_count = member_count - 1 where id = new.club_id;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists club_member_count on public.club_members;
create trigger club_member_count
  after insert or delete or update on public.club_members
  for each row execute procedure public.update_club_member_count();


-- Auto-set joined_at when a member's status becomes 'active'
create or replace function public.set_club_member_joined_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'active' and old.status != 'active' then
    new.joined_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists club_member_joined on public.club_members;
create trigger club_member_joined
  before update on public.club_members
  for each row execute procedure public.set_club_member_joined_at();


-- Auto-update trip_posts.rsvp_count
create or replace function public.update_trip_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.status != 'declined' then
    update public.trip_posts set rsvp_count = rsvp_count + 1 where id = new.trip_post_id;
    return new;
  elsif tg_op = 'DELETE' and old.status != 'declined' then
    update public.trip_posts set rsvp_count = rsvp_count - 1 where id = old.trip_post_id;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.status = 'declined' and new.status != 'declined' then
      update public.trip_posts set rsvp_count = rsvp_count + 1 where id = new.trip_post_id;
    elsif old.status != 'declined' and new.status = 'declined' then
      update public.trip_posts set rsvp_count = rsvp_count - 1 where id = new.trip_post_id;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists trip_rsvp_count on public.trip_rsvps;
create trigger trip_rsvp_count
  after insert or delete or update on public.trip_rsvps
  for each row execute procedure public.update_trip_rsvp_count();


-- Auto-mark trip as 'full' when max_participants reached
create or replace function public.check_trip_full()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tp record;
begin
  select max_participants, rsvp_count into tp
  from public.trip_posts where id = new.trip_post_id;

  if tp.max_participants is not null
     and tp.rsvp_count >= tp.max_participants
     and tp.status = 'open' then
    update public.trip_posts set status = 'full' where id = new.trip_post_id;
  elsif tp.max_participants is not null
     and tp.rsvp_count < tp.max_participants
     and tp.status = 'full' then
    update public.trip_posts set status = 'open' where id = new.trip_post_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trip_check_full on public.trip_rsvps;
create trigger trip_check_full
  after insert or update on public.trip_rsvps
  for each row execute procedure public.check_trip_full();


-- ── 7. NOTIFICATIONS TYPE EXPANSION ─────────────────────────
-- Expand the notifications type check to include club events.
-- This is done via a DO block so it fails gracefully.
do $$
begin
  -- Only run if the notifications table exists
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'notifications'
  ) then
    -- Drop old check and add new one with club types
    alter table public.notifications
      drop constraint if exists notifications_type_check;

    alter table public.notifications
      add constraint notifications_type_check
      check (type in (
        'new_thread', 'new_reply', 'mention', 'catch_comment', 'new_message',
        'club_invite', 'club_join', 'trip_rsvp'
      ));
  end if;
end $$;


-- ── 8. NOTIFICATION TRIGGER: club invite ────────────────────
create or replace function public.notify_on_club_invite()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  club_name text;
  inviter_name text;
begin
  select c.name into club_name
  from public.clubs c where c.id = new.club_id;

  select p.display_name into inviter_name
  from public.profiles p where p.id = new.invited_by;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.user_id,
    'club_invite',
    'You\'ve been invited to ' || coalesce(club_name, 'a club'),
    coalesce(inviter_name, 'Someone') || ' invited you to join ' || coalesce(club_name, 'a club'),
    '/clubs/' || (select slug from public.clubs where id = new.club_id)
  );

  return new;
end;
$$;

drop trigger if exists club_invite_notify on public.club_members;
create trigger club_invite_notify
  after insert on public.club_members
  for each row
  when (new.status = 'invited')
  execute procedure public.notify_on_club_invite();


-- ── 9. SEED CHARTERS ────────────────────────────────────────
-- Promote the 6 static UAE charters into the database.
insert into public.charters (slug, name, location, emirate, coast, charter_type, target_species, duration, capacity, price_aed, highlights, rating, is_verified)
values
  ('fujairah-marine-club', 'Fujairah Marine Club Charters', 'Fujairah Marine Club, Fujairah', 'Fujairah', 'Gulf of Oman', array['Offshore','Deep Sea','Trolling'], array['Dorado (Mahi-Mahi)','Sailfish','Yellowfin Tuna','Amberjack','Kingfish','Striped Marlin'], 'Half-day (5h) · Full day (10h)', 8, 1200, array['Gulf of Oman — cleaner, richer water than the Gulf','Dorado aggregations from October–March','Experienced bilingual captains','All gear and bait provided'], 4.8, true),
  ('al-hamra-rak', 'Al Hamra Marina Big-Game Charters', 'Al Hamra Marina, Ras Al Khaimah', 'Ras Al Khaimah', 'Persian Gulf', array['Offshore','Big Game','Trolling','Jigging'], array['Kingfish','Cobia','Amberjack','Barracuda','Sailfish','Yellowfin Tuna'], 'Half-day (4h) · Full day (8h) · Overnight', 10, 900, array['Deep water access within 30 minutes','RAK offshore known for giant Amberjack','Modern vessels with live bait tanks','Overnight trips available for serious anglers'], 4.7, true),
  ('dubai-marina-charters', 'Dubai Marina Fishing Trips', 'Dubai Marina, Dubai', 'Dubai', 'Persian Gulf', array['Inshore','Offshore','Family Trips'], array['Barracuda','Queenfish','Trevally','Kingfish','Hammour'], '3h · 6h · Full day', 12, 700, array['Easy access from central Dubai','Family-friendly inshore options','Sunset and night fishing trips available','Multiple operators to choose from'], 4.5, true),
  ('abu-dhabi-offshore', 'Abu Dhabi Offshore Fishing', 'Mina Zayed / Al Bateen, Abu Dhabi', 'Abu Dhabi', 'Persian Gulf', array['Offshore','Reef Fishing','Bottom Fishing'], array['Hammour','Shari (Spangled Emperor)','Golden Trevally','Cobia','Zubaidi'], 'Half-day (5h) · Full day (10h)', 8, 1000, array['Access to Abu Dhabi''s rich reef systems','Expert knowledge of local fishing grounds','Traditional and modern fishing methods','Halal catering available on request'], 4.6, true),
  ('khor-fakkan', 'Khor Fakkan Rock Fishing & Reef Trips', 'Khor Fakkan Harbour, Sharjah (East Coast)', 'Sharjah (East Coast)', 'Gulf of Oman', array['Reef Fishing','Rock Hopping','Inshore'], array['Hammour','Spangled Emperor','Snapper','Trevally','Barracuda'], '4h · 6h', 6, 600, array['Stunning Hajar Mountain backdrop','Access to virgin rock marks','Best for demersal and reef species','Short drives to multiple launch sites'], 4.6, true),
  ('dibba-charter', 'Dibba Blue Water Charters', 'Dibba Al Fujairah', 'Fujairah', 'Gulf of Oman', array['Pelagic','Big Game','Trolling','Live Bait'], array['Dorado','Yellowfin Tuna','Wahoo','Sailfish','Giant Trevally','Longtail Tuna'], 'Full day (8–10h)', 8, 1400, array['Dibba is rated one of the best pelagic grounds in UAE','Wahoo and GT available throughout the year','Deep drop-offs within easy reach','Experienced crew with live bait expertise'], 4.9, true)
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  emirate = excluded.emirate,
  coast = excluded.coast,
  charter_type = excluded.charter_type,
  target_species = excluded.target_species,
  duration = excluded.duration,
  capacity = excluded.capacity,
  price_aed = excluded.price_aed,
  highlights = excluded.highlights,
  rating = excluded.rating,
  is_verified = excluded.is_verified;
