-- ============================================================
-- UAE Anglers Hub — Function permission hardening
--
-- Closes two classes of Supabase Security Advisor warnings:
--
--   1. "Function Search Path Mutable" — SECURITY DEFINER functions
--      without a fixed search_path are vulnerable to search-path
--      hijacking. Fix: pin to public, pg_temp.
--
--   2. "Public/Signed-In Users Can Execute SECURITY DEFINER Function" —
--      Postgres grants EXECUTE on new functions to PUBLIC by default.
--      For SECURITY DEFINER trigger helpers, that means any caller
--      could invoke them via /rest/v1/rpc/<fn> and bypass RLS.
--      Triggers don't need ANY user to hold EXECUTE — they fire on
--      table events regardless — so revoking from public/anon/
--      authenticated has no functional impact, just closes the hole.
--
-- The single legitimate RPC (get_or_create_dm) keeps its
-- `authenticated` grant; we only revoke `public` and `anon`.
-- ============================================================

-- ── 1. Pin search_path on the two preflight functions ─────
-- Both came from schema.sql which predates the project's
-- "set search_path" hardening convention.
alter function public.notify_on_new_thread()
  set search_path = public, pg_temp;

alter function public.auto_subscribe_to_categories()
  set search_path = public, pg_temp;


-- ── 2. Revoke EXECUTE from trigger-only functions ─────────
-- These are wired to BEFORE/AFTER triggers in their respective
-- tables. Revoking EXECUTE prevents direct invocation via SQL
-- or PostgREST. Trigger execution itself is unaffected.
do $$
declare
  fn text;
  trigger_fns text[] := array[
    -- Preflight (originally from schema.sql)
    'auto_subscribe_to_categories()',
    'notify_on_new_thread()',
    -- add_forum_ugc_moderation_and_quotas.sql
    'forum_throttle_threads()',
    'forum_throttle_replies()',
    'notify_on_new_reply()',
    'notify_on_thread_mentions()',
    -- add_forum_moderation.sql (re-defined in add_catch_comments.sql)
    'forum_auto_hide_on_reports()',
    'moderation_reports_throttle()',
    -- add_forum_votes.sql / add_dislike_votes.sql
    'forum_votes_recount()',
    -- add_catch_comments.sql
    'catch_comment_count_recount()',
    'catch_comments_throttle()',
    'notify_on_catch_comment()',
    -- add_direct_messages.sql
    'messages_bump_conversation()',
    'messages_throttle()'
  ];
begin
  foreach fn in array trigger_fns loop
    execute format('revoke execute on function public.%s from public',        fn);
    execute format('revoke execute on function public.%s from anon',          fn);
    execute format('revoke execute on function public.%s from authenticated', fn);
  end loop;
end $$;


-- ── 3. Tighten the one real RPC ───────────────────────────
-- get_or_create_dm is intentionally callable by signed-in
-- users (from the messages page). Strip public + anon access;
-- keep authenticated.
revoke execute on function public.get_or_create_dm(uuid) from public;
revoke execute on function public.get_or_create_dm(uuid) from anon;
grant  execute on function public.get_or_create_dm(uuid) to   authenticated;


-- ── 4. Same treatment for assistant_count_today ───────────
-- It's SECURITY INVOKER (not flagged by the SECURITY DEFINER
-- advisor) but it's a server-only helper — no reason for anon
-- to reach it via /rest/v1/rpc.
revoke execute on function public.assistant_count_today(uuid) from public;
revoke execute on function public.assistant_count_today(uuid) from anon;
grant  execute on function public.assistant_count_today(uuid) to   authenticated;
