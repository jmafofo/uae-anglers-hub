-- ============================================================
-- UAE Anglers Hub — Harden profile_wall view
--
-- Closes the "Security Definer View" advisor error on
-- public.profile_wall.
--
-- By default, Postgres views execute SELECTs as the view's owner
-- (here: postgres / supabase_admin), not as the caller. That
-- means RLS on the underlying tables — catches, forum_threads,
-- catch_comments — is bypassed when reading via the view. A
-- private catch (`is_public = false`) would still show up in
-- another angler's wall if it were selected through the view.
--
-- Postgres 15+ supports `WITH (security_invoker = true)`, which
-- flips the view to use the caller's privileges. RLS on each
-- source table is then honoured exactly as a direct SELECT would.
-- Supabase is on PG 15+ so this is safe.
--
-- The view's body is unchanged — we just rebuild it with the
-- new attribute so the security model is correct.
-- ============================================================

drop view if exists public.profile_wall;

create view public.profile_wall
  with (security_invoker = true)
as
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

  -- Catch comments (excluding self-comments + soft-deleted)
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
    and cc.user_id <> catch.user_id
    and catch.is_public = true;

grant select on public.profile_wall to anon, authenticated;
