-- ============================================================
-- Security hardening: revoke public execute on SECURITY DEFINER
-- functions that should only be called server-side.
--
-- The app uses API routes with service-role keys; these functions
-- do NOT need to be exposed via PostgREST (REST API).
--
-- PostGIS built-ins (st_estimatedextent, spatial_ref_sys) are
-- system objects and are intentionally left untouched.
-- ============================================================

-- Banner bidding
do $$
begin
  revoke execute on function public.get_active_banner(text)       from public, authenticated, anon;
  revoke execute on function public.expire_old_banner_bids()        from public, authenticated, anon;
exception when undefined_function then null;
end $$;

-- Messaging / moderation
do $$
begin
  revoke execute on function public.messages_moderate()             from public, authenticated, anon;
  revoke execute on function public.get_or_create_dm(uuid)          from public, authenticated, anon;
exception when undefined_function then null;
end $$;

-- Suggestions
do $$
begin
  revoke execute on function public.suggestion_vote_sync()          from public, authenticated, anon;
exception when undefined_function then null;
end $$;

-- Additional hardening: revoke on other internal-only SECURITY DEFINER helpers
-- (These are all called via API routes, never directly from the client)
do $$
begin
  revoke execute on function public.is_conversation_member(uuid, uuid) from public, authenticated, anon;
  revoke execute on function public.is_conversation_admin(uuid, uuid)  from public, authenticated, anon;
  revoke execute on function public.increment_posts_count()            from public, authenticated, anon;
  revoke execute on function public.decrement_posts_count()            from public, authenticated, anon;
  revoke execute on function public.handle_new_user()                  from public, authenticated, anon;
  revoke execute on function public.identify_count_today(uuid)         from public, authenticated, anon;
  revoke execute on function public.forum_auto_hide_on_reports()       from public, authenticated, anon;
  revoke execute on function public.moderation_reports_throttle()      from public, authenticated, anon;
  revoke execute on function public.is_ban_active(uuid)                from public, authenticated, anon;
  revoke execute on function public.current_seasonal_bans()            from public, authenticated, anon;
  revoke execute on function public.auto_subscribe_to_categories()     from public, authenticated, anon;
  revoke execute on function public.notify_on_new_thread()             from public, authenticated, anon;
  revoke execute on function public.notify_on_new_message()            from public, authenticated, anon;
  revoke execute on function public.messages_bump_conversation()       from public, authenticated, anon;
  revoke execute on function public.messages_touch_edited_at()         from public, authenticated, anon;
  revoke execute on function public.messages_throttle()                from public, authenticated, anon;
  revoke execute on function public.forum_votes_recount()              from public, authenticated, anon;
  revoke execute on function public.recount_waypoint_votes()           from public, authenticated, anon;
  revoke execute on function public.resolve_catch_spot()               from public, authenticated, anon;
  revoke execute on function public.waypoint_within_spot(uuid, numeric, numeric) from public, authenticated, anon;
  revoke execute on function public.pick_next_ad(text[])               from public, authenticated, anon;
  revoke execute on function public.record_ad_impression(uuid)         from public, authenticated, anon;
  revoke execute on function public.record_ad_click(uuid)              from public, authenticated, anon;
  revoke execute on function public.catch_comment_count_recount()      from public, authenticated, anon;
  revoke execute on function public.catch_comments_throttle()          from public, authenticated, anon;
  revoke execute on function public.notify_on_catch_comment()          from public, authenticated, anon;
  revoke execute on function public.touch_edited_at()                  from public, authenticated, anon;
  revoke execute on function public.forum_tags_valid(text[])           from public, authenticated, anon;
  revoke execute on function public.forum_throttle_threads()           from public, authenticated, anon;
  revoke execute on function public.forum_throttle_replies()           from public, authenticated, anon;
  revoke execute on function public.notify_on_new_reply()              from public, authenticated, anon;
  revoke execute on function public.notify_on_thread_mentions()        from public, authenticated, anon;
  revoke execute on function public.listing_slots_available(uuid)      from public, authenticated, anon;
  revoke execute on function public.sync_listing_slot_count()          from public, authenticated, anon;
  revoke execute on function public.apply_tier_slot_defaults()         from public, authenticated, anon;
  revoke execute on function public.apply_slot_purchase()              from public, authenticated, anon;
  revoke execute on function public.set_boost_until()                  from public, authenticated, anon;
  revoke execute on function public.expire_boosts()                    from public, authenticated, anon;
  revoke execute on function public.assistant_count_today(uuid)        from public, authenticated, anon;
exception when undefined_function then null;
end $$;

-- Note: spatial_ref_sys is a PostGIS system table owned by the postgres user.
-- RLS is intentionally disabled on it (read-only reference data).
-- The Supabase Security Advisor flags this, but it is expected and safe.
