-- ============================================================
-- UAE Anglers Hub — Lock down ad-recording functions
--
-- The advisor flagged record_ad_impression and record_ad_click
-- as "Public Can Execute SECURITY DEFINER Function" — and it's
-- right. I granted EXECUTE to anon + authenticated so the picker
-- could call them. But the picker only ever runs from the
-- server-side service-role client (lib/ads.ts), so there's no
-- legitimate reason for the public-key client to call them.
--
-- Without this fix, anyone with the (public) anon key could:
--   supabase.rpc('record_ad_impression', { p_campaign_id: '<any>', ... })
-- … and drain a sponsor's budget by spamming impressions
-- without ever rendering an ad. The functions stay SECURITY
-- DEFINER (they need to bypass the admin-only RLS on
-- ad_campaigns to update counters); we just close off the
-- grants so only service_role can invoke them.
--
-- pick_next_ad stays publicly callable — it's read-only and
-- exposing it doesn't enable abuse.
-- ============================================================

revoke execute on function public.record_ad_impression(uuid, text, uuid, jsonb)
  from public, anon, authenticated;
grant  execute on function public.record_ad_impression(uuid, text, uuid, jsonb)
  to   service_role;

revoke execute on function public.record_ad_click(uuid, uuid, uuid)
  from public, anon, authenticated;
grant  execute on function public.record_ad_click(uuid, uuid, uuid)
  to   service_role;

-- The three st_estimatedextent variants are PostGIS catalog
-- functions, owned by the postgres superuser. ALTER on them
-- fails from the SQL editor with "must be owner" — same wall
-- as spatial_ref_sys. Click "Fix" in Supabase Studio's advisor
-- if visual tidiness matters; harmless to leave otherwise.
