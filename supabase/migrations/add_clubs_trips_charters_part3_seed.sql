-- ============================================================
-- Part 3: Seed Charters
-- Run this AFTER Part 1 succeeds.
-- ============================================================

insert into public.charters (slug, name, location, emirate, coast, charter_type, target_species, duration, capacity, price_aed, highlights, rating, is_verified)
values
  ('fujairah-marine-club', 'Fujairah Marine Club Charters', 'Fujairah Marine Club, Fujairah', 'Fujairah', 'Gulf of Oman', array['Offshore','Deep Sea','Trolling'], array['Dorado (Mahi-Mahi)','Sailfish','Yellowfin Tuna','Amberjack','Kingfish','Striped Marlin'], 'Half-day (5h) · Full day (10h)', 8, 1200, array['Gulf of Oman — cleaner, richer water than the Gulf','Dorado aggregations from October–March','Experienced bilingual captains','All gear and bait provided'], 4.8, true),
  ('al-hamra-rak', 'Al Hamra Marina Big-Game Charters', 'Al Hamra Marina, Ras Al Khaimah', 'Ras Al Khaimah', 'Persian Gulf', array['Offshore','Big Game','Trolling','Jigging'], array['Kingfish','Cobia','Amberjack','Barracuda','Sailfish','Yellowfin Tuna'], 'Half-day (4h) · Full day (8h) · Overnight', 10, 900, array['Deep water access within 30 minutes','RAK offshore known for giant Amberjack','Modern vessels with live bait tanks','Overnight trips available for serious anglers'], 4.7, true),
  ('dubai-marina-charters', 'Dubai Marina Fishing Trips', 'Dubai Marina, Dubai', 'Dubai', 'Persian Gulf', array['Inshore','Offshore','Family Trips'], array['Barracuda','Queenfish','Trevally','Kingfish','Hammour'], '3h · 6h · Full day', 12, 700, array['Easy access from central Dubai','Family-friendly inshore options','Sunset and night fishing trips available','Multiple operators to choose from'], 4.5, true),
  ('abu-dhabi-offshore', 'Abu Dhabi Offshore Fishing', 'Mina Zayed / Al Bateen, Abu Dhabi', 'Abu Dhabi', 'Persian Gulf', array['Offshore','Reef Fishing','Bottom Fishing'], array['Hammour','Shari (Spangled Emperor)','Golden Trevally','Cobia','Zubaidi'], 'Half-day (5h) · Full day (10h)', 8, 1000, array['Access to Abu Dhabi''s rich reef systems','Expert knowledge of local fishing grounds','Traditional and modern fishing methods','Halal catering available on request'], 4.6, true),
  ('khor-fakkan', 'Khor Fakkan Rock Fishing & Reef Trips', 'Khor Fakkan Harbour, Sharjah (East Coast)', 'Sharjah (East Coast)', 'Gulf of Oman', array['Reef Fishing','Rock Hopping','Inshore'], array['Hammour','Spangled Emperor','Snapper','Trevally','Barracuda'], '4h · 6h', 6, 600, array['Stunning Hajar Mountain backdrop','Access to virgin rock marks','Best for demersal and reef species','Short drives to multiple launch sites'], 4.6, true),
  ('dibba-charter', 'Dibba Blue Water Charters', 'Dibba Al Fujairah', 'Fujairah', 'Gulf of Oman', array['Pelagic','Big Game','Trolling','Live Bait'], array['Dorado','Yellowfin Tuna','Wahoo','Sailfish','Giant Trevally','Longtail Tuna'], 'Full day (8–10h)', 8, 1400, array['Dibba is rated one of the best pelagic grounds in UAE','Wahoo and GT available throughout the year','Deep drop-offs within easy reach','Experienced crew with live bait expertise'], 4.9, true)
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  emirate = excluded.emirate,
  coast = excluded.coast,
  charter_type = excluded.charter_type,
  target_species = excluded.target_species,
  duration = excluded.duration,
  capacity = excluded.capacity,
  price_aed = excluded.price_aed,
  highlights = excluded.highlights,
  rating = excluded.rating,
  is_verified = excluded.is_verified;
