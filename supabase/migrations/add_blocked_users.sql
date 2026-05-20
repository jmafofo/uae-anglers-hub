-- ============================================================
-- UAE Anglers Hub — User block list
--
-- Lets a user mute another user's content. Initial enforcement is
-- client-side on the thread reply list — block-filtering on server
-- components (category list, all-threads list) is a follow-up.
--
-- A "block" is one-directional: A blocks B → A no longer sees B's
-- replies. B can still see A's. Mutual blocks are two rows.
-- ============================================================

create table if not exists public.blocked_users (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  -- Stop "block yourself" being inserted.
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

create index if not exists blocked_users_blocker_ix
  on public.blocked_users (blocker_id);

alter table public.blocked_users enable row level security;

-- Block lists are private — only the blocker reads their own.
drop policy if exists "Users read own blocks" on public.blocked_users;
create policy "Users read own blocks"
  on public.blocked_users for select
  using (auth.uid() = blocker_id);

drop policy if exists "Users insert own blocks" on public.blocked_users;
create policy "Users insert own blocks"
  on public.blocked_users for insert
  with check (auth.uid() = blocker_id);

drop policy if exists "Users delete own blocks" on public.blocked_users;
create policy "Users delete own blocks"
  on public.blocked_users for delete
  using (auth.uid() = blocker_id);

-- No UPDATE policy — block rows are immutable; toggle = delete + re-insert.
