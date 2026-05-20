-- ============================================================
-- UAE Anglers Hub — PostGIS function grants hardening
--
-- Mirrors fix_spatial_ref_sys.sql for PostGIS' SECURITY DEFINER
-- functions. st_estimatedextent is a spatial-statistics helper
-- that the app never calls — no reason for anon/authenticated to
-- reach it via /rest/v1/rpc/.
--
-- We can't alter the function definitions (owned by the postgis
-- extension's role) but we can revoke role-level EXECUTE grants
-- — same approach the existing fix_spatial_ref_sys.sql migration
-- uses for spatial_ref_sys.
--
-- The advisor warnings on these 6 entries should clear after
-- running this + re-running the linter.
-- ============================================================

revoke execute on function public.st_estimatedextent(text, text)                   from anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text)             from anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean)    from anon, authenticated;
