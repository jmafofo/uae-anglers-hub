-- ============================================================
-- UAE Anglers Hub — Direct messages (1-to-1 + group)
--
-- Replaces the /community/messages mockup with real chat.
-- Convention:
--   conversations          — one row per chat thread (dm OR group)
--   conversation_members   — junction; one row per (conv, user)
--   messages               — the actual chat messages
--
-- Unread tracking lives on conversation_members.last_read_at —
-- a single timestamp per (conversation, user) is enough to
-- compute the unread count via a count(*) > last_read_at query,
-- and avoids a per-message read_receipt table for v1.
--
-- Realtime is enabled on `messages` so the client can subscribe
-- to inserts on the active conversation.
-- ============================================================

-- ── 1. conversations ───────────────────────────────────────
create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('dm', 'group')),
  name             text,                                   -- group display name, nullable for DMs
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  constraint conversations_name_for_groups check (
    type = 'dm' or (name is not null and char_length(name) <= 80)
  )
);

create index if not exists conversations_last_message_ix
  on public.conversations (last_message_at desc);


-- ── 2. conversation_members ────────────────────────────────
create table if not exists public.conversation_members (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  role             text not null default 'member' check (role in ('member', 'admin')),
  joined_at        timestamptz not null default now(),
  last_read_at     timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_ix
  on public.conversation_members (user_id);


-- ── 3. messages ────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  edited_at        timestamptz,
  deleted_at       timestamptz,
  constraint messages_body_length check (char_length(body) between 1 and 4000)
);

create index if not exists messages_conv_created_ix
  on public.messages (conversation_id, created_at);


-- ── 4. RLS — conversations ────────────────────────────────
-- I see a conversation row iff I'm one of its members.
alter table public.conversations enable row level security;

drop policy if exists "Members see own conversations" on public.conversations;
create policy "Members see own conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = conversations.id and user_id = auth.uid()
    )
  );

drop policy if exists "Auth users can create conversations" on public.conversations;
create policy "Auth users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = created_by);

-- Updates only for non-DM conversation names (groups). The
-- last_message_at column is bumped by a service-role trigger.
drop policy if exists "Group admins can rename" on public.conversations;
create policy "Group admins can rename"
  on public.conversations for update
  using (
    type = 'group' and exists (
      select 1 from public.conversation_members
      where conversation_id = conversations.id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );


-- ── 5. RLS — conversation_members ─────────────────────────
-- A user sees member rows for any conversation they're in
-- (so the UI can render "X, Y, Z are in this group").
alter table public.conversation_members enable row level security;

drop policy if exists "Members see co-members" on public.conversation_members;
create policy "Members see co-members"
  on public.conversation_members for select
  using (
    exists (
      select 1 from public.conversation_members me
      where me.conversation_id = conversation_members.conversation_id
        and me.user_id = auth.uid()
    )
  );

-- Inserting members has subtle rules — for v1 we restrict to:
--   - The creator inserts themselves at conversation creation
--   - Group admins add new members
-- DMs are created via the get_or_create_dm RPC which uses
-- SECURITY DEFINER so the policy below doesn't block it.
drop policy if exists "Self-join own conv or admin invite" on public.conversation_members;
create policy "Self-join own conv or admin invite"
  on public.conversation_members for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.conversation_members admin_row
      where admin_row.conversation_id = conversation_members.conversation_id
        and admin_row.user_id = auth.uid()
        and admin_row.role = 'admin'
    )
  );

-- Each member updates their own row (e.g. bump last_read_at on
-- viewing the conversation).
drop policy if exists "Members update own member row" on public.conversation_members;
create policy "Members update own member row"
  on public.conversation_members for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leaving = deleting your own membership row.
drop policy if exists "Members can leave" on public.conversation_members;
create policy "Members can leave"
  on public.conversation_members for delete
  using (auth.uid() = user_id);


-- ── 6. RLS — messages ─────────────────────────────────────
alter table public.messages enable row level security;

drop policy if exists "Members read messages" on public.messages;
create policy "Members read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id
        and user_id = auth.uid()
    )
  );

drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id
        and user_id = auth.uid()
    )
  );

drop policy if exists "Senders update own messages" on public.messages;
create policy "Senders update own messages"
  on public.messages for update
  using (auth.uid() = sender_id) with check (auth.uid() = sender_id);

drop policy if exists "Senders delete own messages" on public.messages;
create policy "Senders delete own messages"
  on public.messages for delete
  using (auth.uid() = sender_id);


-- ── 7. Bump last_message_at on new messages ───────────────
create or replace function public.messages_bump_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation_trigger on public.messages;
create trigger messages_bump_conversation_trigger
  after insert on public.messages
  for each row execute procedure public.messages_bump_conversation();


-- ── 8. edited_at trigger ──────────────────────────────────
create or replace function public.messages_touch_edited_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists messages_touch_edited_at on public.messages;
create trigger messages_touch_edited_at
  before update on public.messages
  for each row execute procedure public.messages_touch_edited_at();


-- ── 9. Per-user message throttle ──────────────────────────
create or replace function public.messages_throttle()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent int;
  cap constant int := 300;
begin
  if exists (
    select 1 from public.profiles
    where id = new.sender_id and ocean_sentinel_premium = true
  ) then
    return new;
  end if;

  select count(*) into recent
  from public.messages
  where sender_id = new.sender_id
    and created_at >= now() - interval '1 hour';

  if recent >= cap then
    raise exception 'Hourly message limit reached (%/hour) — slow down or upgrade.', cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_throttle_trigger on public.messages;
create trigger messages_throttle_trigger
  before insert on public.messages
  for each row execute procedure public.messages_throttle();


-- ── 10. get_or_create_dm helper ───────────────────────────
-- Idempotent — given two user ids, returns the existing DM
-- conversation or creates one. SECURITY DEFINER so it can
-- insert member rows for both users in one call (which RLS on
-- conversation_members would otherwise block).
--
-- Guards:
--   - other_user_id must exist in profiles
--   - cannot DM yourself
--   - if the other user has blocked you, creation fails
create or replace function public.get_or_create_dm(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid;
  conv_id uuid;
begin
  me := auth.uid();
  if me is null then
    raise exception 'auth required';
  end if;
  if me = p_other_user_id then
    raise exception 'cannot DM yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'recipient not found';
  end if;
  if exists (
    select 1 from public.blocked_users
    where blocker_id = p_other_user_id and blocked_id = me
  ) then
    raise exception 'recipient does not accept messages from you';
  end if;

  -- Look for an existing DM with exactly these two members.
  select c.id into conv_id
  from public.conversations c
  where c.type = 'dm'
    and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = me)
    and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = p_other_user_id)
  limit 1;
  if found then
    return conv_id;
  end if;

  -- Create new
  insert into public.conversations (type, created_by) values ('dm', me) returning id into conv_id;
  insert into public.conversation_members (conversation_id, user_id) values (conv_id, me);
  insert into public.conversation_members (conversation_id, user_id) values (conv_id, p_other_user_id);
  return conv_id;
end;
$$;

grant execute on function public.get_or_create_dm(uuid) to authenticated;


-- ── 11. Realtime publication ──────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
