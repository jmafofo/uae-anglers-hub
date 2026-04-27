-- ── Fix: SECURITY DEFINER functions exposed to anon / authenticated ──────────
--
-- ROOT CAUSE: PostgreSQL grants EXECUTE to the special PUBLIC pseudo-role by
-- default when any function is created. Revoking from specific roles (anon,
-- authenticated) has no effect while PUBLIC still holds the grant — those
-- roles inherit through PUBLIC. The correct fix is:
--
--   REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC;
--
-- For RPC helpers that authenticated users legitimately need to call, we
-- revoke from PUBLIC then explicitly grant back to authenticated.
--
-- Functions in scope (complete list from Security Advisor export)
-- ──────────────────────────────────────────────────────────────
--   Full lockdown — revoke PUBLIC (trigger / Stripe / PostGIS internal):
--     handle_new_user, resolve_catch_spot, recount_waypoint_votes,
--     sync_listing_slot_count, update_catch_count, increment_reply_count,
--     apply_slot_purchase, apply_tier_slot_defaults, expire_boosts,
--     st_estimatedextent (×3)
--
--   Revoke PUBLIC, re-grant to authenticated (RPC helpers):
--     listing_slots_available(profile_id uuid)
--     waypoint_within_spot(uuid, numeric, numeric, integer)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Trigger-only functions ────────────────────────────────────────────────

-- Fires on auth.users INSERT to create a profile row
revoke execute on function public.handle_new_user() from public;

-- Fires on catches INSERT to resolve nearest spot
revoke execute on function public.resolve_catch_spot() from public;

-- Fires on waypoint_votes changes to maintain denormalised vote count
revoke execute on function public.recount_waypoint_votes() from public;

-- Fires on listing_slots changes to keep slot count denormalised
revoke execute on function public.sync_listing_slot_count() from public;

-- Fires on catches changes to keep per-user catch count denormalised
revoke execute on function public.update_catch_count() from public;

-- Fires on spot_replies INSERT/DELETE to maintain reply_count
revoke execute on function public.increment_reply_count() from public;


-- ── 2. Stripe / server-side functions ───────────────────────────────────────
-- Called only by webhook handler / subscription code via service_role key.

revoke execute on function public.apply_slot_purchase()        from public;
revoke execute on function public.apply_tier_slot_defaults()   from public;
revoke execute on function public.expire_boosts()              from public;


-- ── 3. RPC helpers — lock PUBLIC, re-grant to authenticated only ─────────────

-- Called by the app to check how many listing slots a creator has left
revoke execute on function public.listing_slots_available(uuid) from public;
grant  execute on function public.listing_slots_available(uuid) to authenticated;

-- Called by the app for geo-proximity checks (is a GPS point inside a spot?)
revoke execute on function public.waypoint_within_spot(uuid, numeric, numeric, integer) from public;
grant  execute on function public.waypoint_within_spot(uuid, numeric, numeric, integer) to authenticated;


-- ── 4. PostGIS st_estimatedextent — planner-internal, never REST-callable ────

revoke execute on function public.st_estimatedextent(text, text)           from public;
revoke execute on function public.st_estimatedextent(text, text, text)     from public;
revoke execute on function public.st_estimatedextent(text, text, text, boolean) from public;
