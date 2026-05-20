-- ============================================================
-- UAE Anglers Hub — Profile privacy columns
--
-- Adds two privacy controls to profiles:
--
--   appear_offline  boolean
--     When true, CommunityPresence skips channel.track() so other
--     users see the angler as offline. The viewer still gets the
--     live online count themselves (one-way invisibility).
--
--   dm_policy       text  'open' | 'followers_only' | 'closed'
--     Who can start a DM with this user. Enforced inside the
--     get_or_create_dm RPC (gap 3).
--       open            → anyone signed-in (current behaviour)
--       followers_only  → only users this angler follows back, or
--                         users who follow this angler? Decision:
--                         only people the recipient FOLLOWS, so
--                         the recipient explicitly opts-in to who
--                         can reach them.
--       closed          → nobody (DM-free mode)
--
-- Both default to permissive so existing accounts keep working.
-- ============================================================

alter table public.profiles
  add column if not exists appear_offline boolean not null default false;

alter table public.profiles
  add column if not exists dm_policy text not null default 'open';

alter table public.profiles
  drop constraint if exists profiles_dm_policy_check;
alter table public.profiles
  add constraint profiles_dm_policy_check
  check (dm_policy in ('open', 'followers_only', 'closed'));

notify pgrst, 'reload schema';
