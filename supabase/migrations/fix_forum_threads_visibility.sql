-- ============================================================
-- UAE Anglers Hub — Add forum_threads.visibility (schema patch)
--
-- The database was set up from an older snapshot of schema.sql
-- that didn't include the `visibility` column on forum_threads.
-- The /forum/new page passes visibility='public' (or 'followers'
-- /'private'), which fails with:
--   "Could not find the 'visibility' column of 'forum_threads'
--    in the schema cache"
--
-- This migration:
--   1. Adds the column with a sensible default.
--   2. Backfills any existing rows to 'public'.
--   3. Re-asserts the visibility-related RLS policies in case
--      they were also missed in the original schema apply.
--
-- Safe to re-run.
-- ============================================================

-- ── 1. Add the column ──────────────────────────────────────
alter table public.forum_threads
  add column if not exists visibility text not null default 'public';

-- Add the check constraint separately so it works whether or
-- not the column already existed.
alter table public.forum_threads
  drop constraint if exists forum_threads_visibility_check;
alter table public.forum_threads
  add constraint forum_threads_visibility_check
  check (visibility in ('public', 'followers', 'private'));


-- ── 2. RLS policies that depend on the column ─────────────
-- Drop + recreate so the migration is idempotent regardless of
-- which policies (if any) already exist.

drop policy if exists "Public threads viewable by all" on public.forum_threads;
create policy "Public threads viewable by all"
  on public.forum_threads for select
  using (visibility = 'public');

drop policy if exists "Followers-only threads viewable by followers" on public.forum_threads;
create policy "Followers-only threads viewable by followers"
  on public.forum_threads for select
  using (
    visibility = 'followers'
    and exists (
      select 1 from public.follows
      where follower_id = auth.uid() and following_id = forum_threads.user_id
    )
  );

drop policy if exists "Followers-only threads viewable by author" on public.forum_threads;
create policy "Followers-only threads viewable by author"
  on public.forum_threads for select
  using (visibility = 'followers' and auth.uid() = user_id);

drop policy if exists "Private threads viewable by author" on public.forum_threads;
create policy "Private threads viewable by author"
  on public.forum_threads for select
  using (visibility = 'private' and auth.uid() = user_id);


-- ── 3. Force PostgREST to reload its schema cache ─────────
-- Otherwise the running API connection keeps the stale view
-- and the "could not find column" error persists until the
-- next deploy.
notify pgrst, 'reload schema';
