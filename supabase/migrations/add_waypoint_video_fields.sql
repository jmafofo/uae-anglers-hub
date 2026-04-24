-- ============================================================
-- UAE Anglers Hub — Video + source on spot_waypoints
--
-- Catches already have `video_url` and `source` from
-- `add_creator_fields.sql`. This migration extends the same two
-- fields to `spot_waypoints` so a creator can attribute a pin to
-- a specific video (e.g. "the rocks I tested at 02:14 in the
-- Al Aryam walkthrough"). It also tightens the profiles update
-- policy to block self-elevation of `is_creator`.
-- ============================================================

-- ── Waypoints gain video + source ───────────────────────────
alter table public.spot_waypoints
  add column if not exists video_url text
    check (video_url is null or video_url ~* '^https?://'),
  add column if not exists source text not null default 'web'
    check (source in ('web', 'app', 'ocean_sentinel'));

create index if not exists spot_waypoints_video_url_ix
  on public.spot_waypoints (video_url)
  where video_url is not null;

-- ── Guard `is_creator` + social handles via RLS ─────────────
-- `add_creator_fields.sql` introduced these columns but no RLS
-- update — so a user could self-promote to "verified creator"
-- by calling supabase.from('profiles').update({ is_creator: true }).
-- Here we extend the existing "without elevating" update policy
-- to also lock those fields down. Admin endpoints bypass RLS
-- via the service role.
drop policy if exists "Users update own profile without elevating" on public.profiles;
create policy "Users update own profile without elevating"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and is_admin           = (select p.is_admin           from public.profiles p where p.id = (select auth.uid()))
    and stripe_customer_id is not distinct from
                             (select p.stripe_customer_id from public.profiles p where p.id = (select auth.uid()))
    and is_creator         = (select p.is_creator         from public.profiles p where p.id = (select auth.uid()))
  );
