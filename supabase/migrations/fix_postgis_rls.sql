-- ── Fix: spatial_ref_sys RLS disabled (Security Advisor error) ───────────────
--
-- spatial_ref_sys is a PostGIS reference table (EPSG coordinate system
-- definitions). It lives in the public schema which is exposed via PostgREST,
-- so Supabase flags it as an error when RLS is off.
--
-- Our app never queries spatial_ref_sys directly from the client — PostGIS
-- functions access it internally as the postgres superuser and bypass RLS
-- regardless. So we enable RLS and add NO permissive policies, which
-- effectively blocks anon/authenticated from reading it via the REST API
-- while leaving all server-side PostGIS operations completely unaffected.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.spatial_ref_sys enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies → default-deny for anon + authenticated.
-- PostGIS internal calls run as postgres (superuser) and are not subject to RLS.
