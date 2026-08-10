-- ── Fix: enable RLS on PostGIS spatial_ref_sys ───────────────────────────────
--
-- spatial_ref_sys is a PostGIS reference table (EPSG coordinate definitions).
-- It lives in the public schema and is exposed to PostgREST, which triggers the
-- Security Advisor "RLS Disabled in Public" error.
--
-- The table is owned by the PostGIS extension, so ordinary migrations cannot
-- enable RLS on it. Restrict the API-facing roles here; enabling RLS itself must
-- be performed through Supabase's privileged Security Advisor action.
-- ─────────────────────────────────────────────────────────────────────────────

-- Block direct access from API-facing roles without altering extension ownership.
revoke all on table public.spatial_ref_sys from anon, authenticated;
