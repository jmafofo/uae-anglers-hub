-- ============================================================
-- Community lounges — public chat channels on the existing
-- conversations/messages infrastructure.
--
-- A lounge is a conversations row with type = 'lounge' and a slug.
-- Unlike DMs/groups, no membership rows are required: any
-- authenticated user can read and post. The hourly send throttle
-- and realtime publication from add_direct_messages.sql apply
-- unchanged.
-- ============================================================

-- ── 1. Allow the 'lounge' type ─────────────────────────────
alter table public.conversations
  drop constraint if exists conversations_type_check;
alter table public.conversations
  add constraint conversations_type_check
  check (type in ('dm', 'group', 'lounge'));

-- ── 2. Lounge metadata ─────────────────────────────────────
alter table public.conversations add column if not exists slug text;
alter table public.conversations add column if not exists description text;

create unique index if not exists conversations_slug_uq
  on public.conversations (slug) where slug is not null;

-- ── 3. RLS — lounges are public squares ────────────────────
-- Browse lounges: any signed-in user (existing member-select
-- policy remains for dm/group conversations).
drop policy if exists "Authenticated users see lounges" on public.conversations;
create policy "Authenticated users see lounges"
  on public.conversations for select
  using (type = 'lounge' and auth.role() = 'authenticated');

-- Read lounge history without membership.
drop policy if exists "Authenticated users read lounge messages" on public.messages;
create policy "Authenticated users read lounge messages"
  on public.messages for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.type = 'lounge'
    )
  );

-- Post to lounges as yourself. Tombstoning/moderation columns are
-- unchanged — senders can still edit/delete their own messages via
-- the existing dm/group policies only; lounge messages are moderated
-- server-side.
drop policy if exists "Authenticated users send lounge messages" on public.messages;
create policy "Authenticated users send lounge messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.type = 'lounge'
    )
  );

-- ── 4. Seed lounges ────────────────────────────────────────
insert into public.conversations (type, name, slug, description) values
  ('lounge', 'Today''s Conditions', 'todays-conditions', 'Live water, wind, and bite reports from across the UAE. What are you seeing out there?'),
  ('lounge', 'Catch & Brag', 'catch-and-brag', 'Show off today''s catch — photos, stories, and the ones that didn''t get away.'),
  ('lounge', 'Abu Dhabi', 'abu-dhabi', 'Shore and boat talk for the capital — from Hameem to the Corniche.'),
  ('lounge', 'Dubai', 'dubai', 'Creek, marina, and coastline fishing chat for Dubai anglers.'),
  ('lounge', 'Sharjah', 'sharjah', 'Lagoons, ports, and the east-coast run — Sharjah and Kalba talk.'),
  ('lounge', 'Ajman', 'ajman', 'Compact coast, big results — Ajman marina, corniche, and Al Zorah.'),
  ('lounge', 'Umm Al Quwain', 'umm-al-quwain', 'Laid-back lagoon and mangrove fishing in UAQ.'),
  ('lounge', 'Ras Al Khaimah', 'ras-al-khaimah', 'From Al Rams to offshore charters — RAK''s fishing hub.'),
  ('lounge', 'Fujairah', 'fujairah', 'Gulf of Oman currents — Dibba, Khor Fakkan, and big-game talk.')
on conflict do nothing;
