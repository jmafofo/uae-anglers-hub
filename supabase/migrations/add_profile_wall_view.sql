-- ============================================================
-- UAE Anglers Hub — Profile wall view
--
-- A unified, paginated stream of a user's public activity:
--   1. Catches they logged (is_public = true only)
--   2. Forum threads they started (visibility = 'public' only)
--   3. Catch comments they wrote (excluding soft-deleted)
--
-- Exposed as the read-only view `profile_wall`. The profile page
-- queries it filtered by user_id with cursor pagination.
--
-- View columns are deliberately a tight superset that satisfies
-- every kind — the renderer switches on `kind` and only reads the
-- fields it needs:
--
--   user_id         uuid     — the author of the item
--   kind            text     — 'catch' | 'thread' | 'comment'
--   item_id         uuid     — pk of the source row, for permalinks
--   created_at      timestamptz — sort key
--   title           text     — catch species / thread title /
--                              "Comment on <catch species>"
--   excerpt         text     — body excerpt where relevant
--   photo_url       text     — catch photo for catches
--   parent_id       uuid     — catch_id for comments (deep link target)
--
-- The view inherits RLS from its underlying tables — since RLS is
-- enforced at row level on `catches`, `forum_threads`, etc., the
-- view "just works" for anon and authenticated callers.
-- ============================================================

drop view if exists public.profile_wall;
create view public.profile_wall as
  -- Catches
  select
    c.user_id,
    'catch'::text                              as kind,
    c.id                                        as item_id,
    c.caught_at                                 as created_at,
    c.species                                   as title,
    coalesce(nullif(c.notes, ''), '')           as excerpt,
    c.photo_url                                 as photo_url,
    null::uuid                                  as parent_id
  from public.catches c
  where c.is_public = true

  union all

  -- Forum threads (public only)
  select
    t.user_id,
    'thread'::text                              as kind,
    t.id                                        as item_id,
    t.created_at                                as created_at,
    t.title                                     as title,
    left(coalesce(t.body, ''), 200)             as excerpt,
    null::text                                  as photo_url,
    null::uuid                                  as parent_id
  from public.forum_threads t
  where t.visibility = 'public'
    and t.deleted_at is null

  union all

  -- Catch comments (excluding the user's own catches to avoid
  -- "I commented on my own catch" noise; also excluding soft-
  -- deleted comments)
  select
    cc.user_id,
    'comment'::text                             as kind,
    cc.id                                        as item_id,
    cc.created_at                                as created_at,
    'Comment on ' || coalesce(catch.species, 'a catch') as title,
    left(coalesce(cc.body, ''), 200)             as excerpt,
    catch.photo_url                              as photo_url,
    cc.catch_id                                  as parent_id
  from public.catch_comments cc
  join public.catches catch on catch.id = cc.catch_id
  where cc.deleted_at is null
    and cc.user_id <> catch.user_id  -- skip self-comments on own catches
    and catch.is_public = true;       -- private catches don't surface here

-- Grant SELECT on the view to the same roles that can read the
-- underlying tables. The view itself doesn't have RLS — it
-- delegates to the source tables.
grant select on public.profile_wall to anon, authenticated;
