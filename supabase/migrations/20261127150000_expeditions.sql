-- ============================================================
-- Expeditions — group fishing trips planned inside chat.
--
-- An event belongs to a conversation (lounge, group, or dm) and has
-- a meeting point: either a known fishing spot (spot_slug, matching
-- lib/spots.ts) or a dropped pin (latitude/longitude + name).
-- RSVPs are one row per user with going/maybe/declined.
--
-- Read access mirrors the parent conversation: lounges are public to
-- all authenticated users; dm/group events require membership.
-- ============================================================

-- ── 1. events ──────────────────────────────────────────────
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 120),
  description      text check (description is null or char_length(description) <= 2000),
  spot_slug        text,
  location_name    text,
  latitude         double precision check (latitude between -90 and 90),
  longitude        double precision check (longitude between -180 and 180),
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  created_by       uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  cancelled_at     timestamptz,
  constraint events_meeting_point check (
    spot_slug is not null or (latitude is not null and longitude is not null)
  ),
  constraint events_time_order check (ends_at is null or ends_at > starts_at)
);

create index if not exists events_conversation_ix on public.events (conversation_id, starts_at);
create index if not exists events_starts_at_ix on public.events (starts_at) where cancelled_at is null;

-- ── 2. event_rsvps ─────────────────────────────────────────
create table if not exists public.event_rsvps (
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null check (status in ('going', 'maybe', 'declined')),
  updated_at  timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_rsvps_user_ix on public.event_rsvps (user_id);

-- ── 3. RLS ─────────────────────────────────────────────────
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- Read: lounge events are public to authenticated users;
-- dm/group events require membership (non-recursive helper).
drop policy if exists "Read events of accessible conversations" on public.events;
create policy "Read events of accessible conversations"
  on public.events for select
  using (
    (
      exists (
        select 1 from public.conversations c
        where c.id = events.conversation_id and c.type = 'lounge'
      )
      and auth.role() = 'authenticated'
    )
    or public.is_conversation_member(conversation_id, auth.uid())
  );

-- Create: as yourself, in a conversation you can read.
drop policy if exists "Members create events" on public.events;
create policy "Members create events"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and (
      exists (
        select 1 from public.conversations c
        where c.id = events.conversation_id and c.type = 'lounge'
      )
      or public.is_conversation_member(conversation_id, auth.uid())
    )
  );

-- Update/cancel: only the organizer.
drop policy if exists "Organizers update own events" on public.events;
create policy "Organizers update own events"
  on public.events for update
  using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "Organizers delete own events" on public.events;
create policy "Organizers delete own events"
  on public.events for delete
  using (auth.uid() = created_by);

-- RSVPs: readable with the event; write only your own row.
drop policy if exists "Read rsvps of accessible events" on public.event_rsvps;
create policy "Read rsvps of accessible events"
  on public.event_rsvps for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_rsvps.event_id
        and (
          exists (
            select 1 from public.conversations c
            where c.id = e.conversation_id and c.type = 'lounge'
          )
          or public.is_conversation_member(e.conversation_id, auth.uid())
        )
    )
  );

drop policy if exists "Users set own rsvp" on public.event_rsvps;
create policy "Users set own rsvp"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own rsvp" on public.event_rsvps;
create policy "Users update own rsvp"
  on public.event_rsvps for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own rsvp" on public.event_rsvps;
create policy "Users delete own rsvp"
  on public.event_rsvps for delete
  using (auth.uid() = user_id);

-- ── 4. Realtime ────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'event_rsvps'
  ) then
    alter publication supabase_realtime add table public.event_rsvps;
  end if;
end $$;
