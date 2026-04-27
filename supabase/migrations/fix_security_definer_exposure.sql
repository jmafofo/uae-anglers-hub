-- ── Fix: SECURITY DEFINER functions exposed to anon / authenticated ──────────
--
-- Supabase Security Advisor flags two categories:
--
--   "Public Can Execute SECURITY DEFINER Function"
--     → anon role can call internal functions directly via PostgREST
--
--   "Signed-In Users Can Execute SECURITY DEFINER Function"
--     → authenticated role can call internal trigger / helper functions
--       that were never meant to be user-invokable
--
-- Fix strategy
-- ─────────────
--   • Trigger functions (called only by DB triggers, never by the app
--     via RPC): revoke EXECUTE from BOTH anon AND authenticated.
--
--   • RPC helper functions (legitimately called by the app via
--     supabase.rpc()):  revoke EXECUTE from anon only.
--     Authenticated users keep access.
--
--   • PostGIS st_estimatedextent: internal planner function.
--     Revoke from anon and authenticated — app never calls it directly.
--
-- Functions in scope
-- ──────────────────
--   Trigger-only (revoke anon + authenticated):
--     handle_new_user, resolve_catch_spot, recount_waypoint_votes,
--     sync_listing_slot_count, update_catch_count, increment_reply_count
--
--   RPC helpers (revoke anon only):
--     listing_slots_available(profile_id uuid)
--     waypoint_within_spot(uuid, numeric, numeric, integer)
--
--   PostGIS internal (revoke anon + authenticated):
--     st_estimatedextent(text,text)
--     st_estimatedextent(text,text,text)
--     st_estimatedextent(text,text,text,boolean)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Trigger-only functions — revoke all direct user access ────────────────

-- Fires on auth.users INSERT to create a profile row
revoke execute on function public.handle_new_user()
  from anon, authenticated;

-- Fires on catches INSERT to resolve nearest spot
revoke execute on function public.resolve_catch_spot()
  from anon, authenticated;

-- Fires on waypoint_votes changes to maintain denormalised vote count
revoke execute on function public.recount_waypoint_votes()
  from anon, authenticated;

-- Fires on listing_slots changes to keep slot count denormalised
revoke execute on function public.sync_listing_slot_count()
  from anon, authenticated;

-- Fires on catches changes to keep per-user catch count denormalised
revoke execute on function public.update_catch_count()
  from anon, authenticated;

-- Fires on spot_replies INSERT/DELETE to maintain reply_count
revoke execute on function public.increment_reply_count()
  from anon, authenticated;


-- ── 2. RPC helpers — revoke anon, keep authenticated ────────────────────────

-- Called by the app to check how many listing slots a creator has left
revoke execute on function public.listing_slots_available(uuid)
  from anon;

-- Called by the app for geo-proximity checks (is a GPS point inside a spot?)
revoke execute on function public.waypoint_within_spot(uuid, numeric, numeric, integer)
  from anon;


-- ── 3. PostGIS st_estimatedextent — revoke all direct user access ────────────
--
-- These are PostGIS planner-support functions installed in public schema.
-- They should never be called directly through the REST API.

revoke execute on function public.st_estimatedextent(text, text)
  from anon, authenticated;

revoke execute on function public.st_estimatedextent(text, text, text)
  from anon, authenticated;

revoke execute on function public.st_estimatedextent(text, text, text, boolean)
  from anon, authenticated;
