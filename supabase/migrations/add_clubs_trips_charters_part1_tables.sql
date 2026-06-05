-- ============================================================
-- Part 1: Tables, Indexes, and RLS Policies
-- Run this first.
--
-- NOTE: trip_posts.post_id does NOT have a foreign key to
-- public.posts because that table may not exist yet. The FK
-- is added separately in Part 4 (after posts is confirmed).
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- A. CREATE ALL TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ── 3. TRIP POSTS ───────────────────────────────────────────
-- post_id is plain uuid (no FK yet) so this works even if
-- public.posts doesn't exist. FK added later in Part 4.
create table if not exists public.trip_posts (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null,
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


-- ═══════════════════════════════════════════════════════════
-- B. CREATE ALL INDEXES
-- ═══════════════════════════════════════════════════════════

create index if not exists clubs_slug_ix on public.clubs (slug);
create index if not exists clubs_created_by_ix on public.clubs (created_by);
create index if not exists clubs_visibility_ix on public.clubs (visibility, created_at desc);

create index if not exists club_members_club_ix on public.club_members (club_id, status, role);
create index if not exists club_members_user_ix on public.club_members (user_id, status);

create index if not exists trip_posts_club_ix on public.trip_posts (club_id, status, start_date);
create index if not exists trip_posts_post_ix on public.trip_posts (post_id);

create index if not exists trip_rsvps_trip_ix on public.trip_rsvps (trip_post_id, status);
create index if not exists trip_rsvps_user_ix on public.trip_rsvps (user_id, created_at desc);

create index if not exists charters_slug_ix on public.charters (slug);
create index if not exists charters_country_ix on public.charters (country, emirate);
create index if not exists charters_verified_ix on public.charters (is_verified, rating desc nulls last);


-- ═══════════════════════════════════════════════════════════
-- C. ENABLE RLS ON ALL TABLES
-- ═══════════════════════════════════════════════════════════

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.trip_posts enable row level security;
alter table public.trip_rsvps enable row level security;
alter table public.charters enable row level security;


-- ═══════════════════════════════════════════════════════════
-- D. CREATE ALL RLS POLICIES
-- ═══════════════════════════════════════════════════════════

-- ── clubs policies ──────────────────────────────────────────
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

-- ── club_members policies ───────────────────────────────────
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

create policy "Users can update own membership"
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
    or auth.uid() = user_id
  );

-- ── trip_posts policies (no references to public.posts) ─────
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

-- NOTE: author-based update/delete policies for trip_posts are
-- added in Part 4 after the public.posts table is confirmed.

-- ── trip_rsvps policies ─────────────────────────────────────
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

-- ── charters policies ───────────────────────────────────────
create policy "Charters viewable by all"
  on public.charters for select using (true);

create policy "Authenticated users can create charters"
  on public.charters for insert with check (auth.role() = 'authenticated');
