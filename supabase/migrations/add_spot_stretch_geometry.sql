-- ============================================================
-- UAE Anglers Hub — LineString geometry for stretch spots
--
-- Anglers at places like Al Aryam Island fish anywhere along a
-- ~9.87 km stretch of coastline. Storing a single centre pin
-- means `waypoint_within_spot()` rejects legitimate pins at the
-- far ends of the stretch. Here we paint LineStrings through
-- the productive shoreline so st_dwithin(geometry, pt, 150m)
-- accepts the full usable run.
--
-- Coordinates are approximations of the shoreline track pulled
-- from satellite imagery — good to ~100m, which is inside the
-- 150m tolerance used by the resolver.
-- ============================================================

-- ── Al Aryam Island — ~9.87 km shoreline stretch ────────────
-- Pin is at 24.3068, 54.2266; anglers spread east-west along
-- the island's south-facing shore.
update public.spots
  set geometry = st_setsrid(
    st_geogfromtext('LINESTRING(
      54.1760 24.3115,
      54.2000 24.3090,
      54.2266 24.3068,
      54.2540 24.3050,
      54.2810 24.3032
    )')::geometry, 4326
  )::geography,
  length_m = 9870
  where slug = 'al-aryam-island';

-- ── Jebel Ali Beach — ~7 km open-shore run ──────────────────
update public.spots
  set geometry = st_setsrid(
    st_geogfromtext('LINESTRING(
      54.9850 25.0270,
      55.0050 25.0200,
      55.0207 25.0157,
      55.0400 25.0095,
      55.0560 25.0030
    )')::geometry, 4326
  )::geography,
  length_m = 7200
  where slug = 'jebel-ali-beach';

-- ── Hameem Beach — ~5 km remote camping shoreline ───────────
update public.spots
  set geometry = st_setsrid(
    st_geogfromtext('LINESTRING(
      54.2820 24.2470,
      54.3000 24.2430,
      54.3067 24.2404,
      54.3200 24.2370,
      54.3340 24.2340
    )')::geometry, 4326
  )::geography,
  length_m = 5100
  where slug = 'hameem-beach';

-- ── Fujairah Beaches — ~12 km east-coast stretch ────────────
update public.spots
  set geometry = st_setsrid(
    st_geogfromtext('LINESTRING(
      56.3250 25.1200,
      56.3390 25.1600,
      56.3480 25.2000,
      56.3540 25.2400,
      56.3580 25.2800
    )')::geometry, 4326
  )::geography,
  length_m = 11800
  where slug = 'fujairah-beaches';

-- ── UAQ Coastline — ~8 km northern stretch ──────────────────
update public.spots
  set geometry = st_setsrid(
    st_geogfromtext('LINESTRING(
      55.5300 25.5400,
      55.5450 25.5500,
      55.5550 25.5644,
      55.5700 25.5790,
      55.5830 25.5920
    )')::geometry, 4326
  )::geography,
  length_m = 8000
  where slug = 'uaq-coastline';

-- ── Dibba — ~4 km fishing village shoreline ─────────────────
update public.spots
  set geometry = st_setsrid(
    st_geogfromtext('LINESTRING(
      56.2600 25.6080,
      56.2700 25.6200,
      56.2780 25.6320,
      56.2830 25.6420
    )')::geometry, 4326
  )::geography,
  length_m = 4200
  where slug = 'dibba';
