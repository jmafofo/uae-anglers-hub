-- ============================================================
-- UAE Anglers Hub — remaining advisor fixes
--
-- Clears 10 of the 12 warnings. The two left intentionally:
--
--   • "Extension in Public" (postgis) — moving PostGIS out of
--     public requires re-creating every geometry column and
--     rewriting every function that references the types. High
--     risk on a live DB for no security gain. Advisory only.
--
--   • "Leaked Password Protection Disabled" — not SQL. Toggle
--     it in Supabase Dashboard → Authentication → Providers →
--     Email → enable "Check against HIBP leaked passwords".
--
-- What this migration fixes:
--
--   1. Function Search Path Mutable (8 functions)
--      Without an explicit search_path, a function's schema
--      resolution depends on the caller's session, which opens
--      a sneak-attack surface for SECURITY DEFINER functions.
--      Pinning to `public, pg_temp` eliminates the risk without
--      requiring body changes.
--
--   2. genomics_submissions — open INSERT policy (WITH CHECK true)
--      The original policy allowed anonymous submissions "with
--      email collected instead." Open to spam with no friction.
--      Tightened to require an authenticated session. If you
--      want to keep anonymous submissions later, swap in a
--      captcha-gated edge function instead of a blanket RLS open.
--
--   3. storage.catches — public bucket allows listing
--      Direct URL access (GET /object/public/catches/<path>) is
--      preserved via the public bucket flag. The SELECT policy
--      on storage.objects is tightened so anonymous clients
--      can't call storage.from('catches').list() and enumerate
--      every uploaded photo.
-- ============================================================

-- ── 1. Function search_path hardening ───────────────────────
alter function public.identify_count_today(uuid)
  set search_path = public, pg_temp;

alter function public.waypoint_within_spot(uuid, numeric, numeric, int)
  set search_path = public, pg_temp;

alter function public.recount_waypoint_votes()
  set search_path = public, pg_temp;

alter function public.current_seasonal_bans()
  set search_path = public, pg_temp;

alter function public.is_ban_active(int, int, int, int, date)
  set search_path = public, pg_temp;

alter function public.hall_of_fame(text, text, text, text, int)
  set search_path = public, pg_temp;

alter function public.resolve_catch_spot()
  set search_path = public, pg_temp;

alter function public.handle_new_user()
  set search_path = public, pg_temp;

-- ── 2. genomics_submissions — require auth on INSERT ────────
drop policy if exists "Authenticated insert submissions" on public.genomics_submissions;
create policy "Authenticated insert submissions"
  on public.genomics_submissions for insert
  with check ((select auth.role()) = 'authenticated');

-- ── 3. storage.catches — block anonymous listing ────────────
-- The existing "Anyone can view catch photos" policy uses
-- `using (bucket_id = 'catches')` which permits both individual
-- reads AND bucket listing for anon clients. We swap it for a
-- policy that requires authentication to use the API, while
-- leaving the public bucket flag in place so direct
-- `/object/public/catches/...` URLs continue to work unauthed
-- (public buckets bypass RLS for direct fetches).
drop policy if exists "Anyone can view catch photos" on storage.objects;
create policy "Authed users can list catch photos"
  on storage.objects for select
  using (
    bucket_id = 'catches'
    and (select auth.role()) = 'authenticated'
  );
