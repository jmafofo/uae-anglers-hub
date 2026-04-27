-- ── Fix: spatial_ref_sys exposed to anon/authenticated ───────────────────────
--
-- spatial_ref_sys is a PostGIS reference table (EPSG coordinate definitions).
-- It lives in public (API-exposed schema) with RLS disabled, which the
-- Security Advisor flags as an error.
--
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY fails — table is owned by the
-- PostGIS extension (supabase_admin), not postgres. We can't change ownership.
--
-- Alternative: revoke all direct table grants from anon and authenticated.
-- PostGIS functions that need the table run as postgres (superuser) and
-- access it via the extension's own privileges — not via the role grants we
-- are revoking here.
-- ─────────────────────────────────────────────────────────────────────────────

-- Block all direct REST API access to spatial_ref_sys
revoke all on table public.spatial_ref_sys from anon, authenticated;
