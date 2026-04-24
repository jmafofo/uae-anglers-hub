-- ============================================================
-- UAE Anglers Hub — Spots + community waypoints
--
-- Promotes the hardcoded lib/spots.ts list into a real `spots`
-- table, and adds `spot_waypoints` so anglers can drop pins
-- anywhere along a stretch (e.g. Al Aryam ~9.87 km) with a
-- kind (productive/rocky/snag/dead/launch/parking/mixed),
-- optional photo, label and target species.
--
-- `waypoint_votes` lets the community curate: pins auto-promote
-- to `verified=true` after 3 confirms with no majority 'wrong'.
-- ============================================================

create extension if not exists postgis;

-- ── SPOTS ───────────────────────────────────────────────────
create table if not exists public.spots (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  emirate       text,
  center_lat    numeric(9,6) not null,
  center_lon    numeric(9,6) not null,
  geometry      geography(Geometry, 4326),
  length_m      integer,
  access_type   text,
  default_species text[] default '{}',
  default_access  text,
  best_time       text,
  facilities      text[] default '{}',
  verified      boolean not null default true,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create index if not exists spots_geometry_gix on public.spots using gist (geometry);
create index if not exists spots_emirate_ix on public.spots (emirate);

alter table public.spots enable row level security;

create policy "Verified spots are public"
  on public.spots for select using (verified = true);

create policy "Authors see own pending spots"
  on public.spots for select using (auth.uid() = created_by);

-- No INSERT/UPDATE policies — writes are service-role only
-- (new-spot proposals go through spot_contributions, not direct inserts).

-- ── SPOT WAYPOINTS ──────────────────────────────────────────
create table if not exists public.spot_waypoints (
  id             uuid primary key default gen_random_uuid(),
  spot_id        uuid not null references public.spots(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  latitude       numeric(9,6) not null,
  longitude      numeric(9,6) not null,
  kind           text not null check (kind in
    ('productive','rocky','snag','dead','launch','parking','mixed')),
  label          text,
  photo_url      text,
  target_species text[] default '{}',
  precision      text not null default 'exact' check (precision in ('exact','100m','500m')),
  is_private     boolean not null default false,
  verified       boolean not null default false,
  confirm_count  int not null default 0,
  stale_count    int not null default 0,
  wrong_count    int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists spot_waypoints_spot_ix on public.spot_waypoints (spot_id);
create index if not exists spot_waypoints_user_ix on public.spot_waypoints (user_id);
create index if not exists spot_waypoints_kind_ix on public.spot_waypoints (kind);

alter table public.spot_waypoints enable row level security;

create policy "Public sees verified non-private waypoints"
  on public.spot_waypoints for select
  using (verified = true and is_private = false);

create policy "Users see own waypoints"
  on public.spot_waypoints for select
  using (auth.uid() = user_id);

create policy "Users insert own waypoints"
  on public.spot_waypoints for insert
  with check (auth.uid() = user_id);

create policy "Users update own waypoints"
  on public.spot_waypoints for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own waypoints"
  on public.spot_waypoints for delete
  using (auth.uid() = user_id);

-- ── WAYPOINT VOTES ──────────────────────────────────────────
create table if not exists public.waypoint_votes (
  waypoint_id uuid not null references public.spot_waypoints(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  vote        text not null check (vote in ('confirmed','stale','wrong')),
  created_at  timestamptz not null default now(),
  primary key (waypoint_id, user_id)
);

alter table public.waypoint_votes enable row level security;

create policy "Votes viewable by all"
  on public.waypoint_votes for select using (true);

create policy "Users cast own votes"
  on public.waypoint_votes for insert
  with check (auth.uid() = user_id);

create policy "Users change own vote"
  on public.waypoint_votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users retract own vote"
  on public.waypoint_votes for delete
  using (auth.uid() = user_id);

-- Self-voting is not prevented at SQL level on purpose:
-- the trigger below excludes it from tallies.

-- ── Tally + auto-verify trigger ─────────────────────────────
create or replace function public.recount_waypoint_votes()
returns trigger as $$
declare
  target_id uuid := coalesce(new.waypoint_id, old.waypoint_id);
  owner_id  uuid;
  c int; s int; w int;
begin
  select user_id into owner_id from public.spot_waypoints where id = target_id;

  select
    count(*) filter (where v.vote = 'confirmed'),
    count(*) filter (where v.vote = 'stale'),
    count(*) filter (where v.vote = 'wrong')
    into c, s, w
  from public.waypoint_votes v
  where v.waypoint_id = target_id
    and v.user_id <> owner_id;

  update public.spot_waypoints
    set confirm_count = c,
        stale_count   = s,
        wrong_count   = w,
        verified      = (c >= 3 and w < c),
        updated_at    = now()
    where id = target_id;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_waypoint_vote_change on public.waypoint_votes;
create trigger on_waypoint_vote_change
  after insert or update or delete on public.waypoint_votes
  for each row execute procedure public.recount_waypoint_votes();

-- ── Catches → nearest spot resolver ─────────────────────────
-- Adds `spot_id` / `waypoint_id` to catches (nullable — existing rows untouched)
-- and a trigger that resolves them on insert/update when lat/lon are present.
alter table public.catches
  add column if not exists spot_id     uuid references public.spots(id),
  add column if not exists waypoint_id uuid references public.spot_waypoints(id);

create or replace function public.resolve_catch_spot()
returns trigger as $$
declare
  pt geography;
begin
  if new.latitude is null or new.longitude is null then
    return new;
  end if;

  pt := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;

  -- Prefer a spot whose geometry contains the point (or is within 150m of its line).
  -- Fall back to the nearest spot within 2km of its centre landmark.
  select s.id into new.spot_id
  from public.spots s
  where s.verified = true
    and (
      (s.geometry is not null and st_dwithin(s.geometry, pt, 150))
      or st_dwithin(
           st_setsrid(st_makepoint(s.center_lon, s.center_lat), 4326)::geography,
           pt, 2000)
    )
  order by
    case when s.geometry is not null and st_dwithin(s.geometry, pt, 150) then 0 else 1 end,
    st_distance(
      coalesce(s.geometry, st_setsrid(st_makepoint(s.center_lon, s.center_lat), 4326)::geography),
      pt)
  limit 1;

  if new.spot_id is not null then
    select w.id into new.waypoint_id
    from public.spot_waypoints w
    where w.spot_id = new.spot_id
      and w.verified = true
      and st_dwithin(
            st_setsrid(st_makepoint(w.longitude, w.latitude), 4326)::geography,
            pt, 75)
    order by st_distance(
      st_setsrid(st_makepoint(w.longitude, w.latitude), 4326)::geography, pt)
    limit 1;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_catch_resolve_spot on public.catches;
create trigger on_catch_resolve_spot
  before insert or update of latitude, longitude on public.catches
  for each row execute procedure public.resolve_catch_spot();

-- ── RPC: is this point within range of a spot? ─────────────
-- Used by the /api/spots/[slug]/waypoints POST to reject pins
-- dropped far from the spot they claim to belong to. Honours
-- the spot's geometry if set, else falls back to a radius
-- around the centre landmark.
create or replace function public.waypoint_within_spot(
  p_spot_id  uuid,
  p_lat      numeric,
  p_lon      numeric,
  p_radius_m int default 7000
) returns boolean as $$
declare
  hit boolean;
  pt  geography := st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography;
begin
  select exists (
    select 1 from public.spots s
    where s.id = p_spot_id
      and (
        (s.geometry is not null and st_dwithin(s.geometry, pt, 150))
        or st_dwithin(
             st_setsrid(st_makepoint(s.center_lon, s.center_lat), 4326)::geography,
             pt, p_radius_m)
      )
  ) into hit;
  return coalesce(hit, false);
end;
$$ language plpgsql stable security definer;

-- ── Seed: promote curated spots from lib/spots.ts ───────────
-- Insert-only; editing seeded data after the fact must go through
-- spot_contributions (follow-up migration). Run via service role.
insert into public.spots (slug, name, emirate, center_lat, center_lon, access_type, default_species, default_access, best_time, facilities)
values
  ('al-garhoud-bridge','Al Garhoud Bridge','Dubai',25.2524,55.3425,'Shore/Bridge',array['Barracuda','Milkfish','Tilapia','Striped Bass','Grouper','Sea Bream'],'Public - Under bridge','Early morning, late evening',array['Parking','nearby restaurants']),
  ('al-maktoum-bridge','Al Maktoum Bridge','Dubai',25.266,55.314,'Shore/Bridge',array['Catfish','Carp','Barracuda','Grouper'],'Public - Dedicated pier','Early morning, late evening',array['Parking','dedicated fishing pier']),
  ('dubai-creek','Dubai Creek','Dubai',25.2631,55.3289,'Shore/Boat',array['Barracuda','Bream','Sherri'],'Public','Early morning, late afternoon, high tide',array['Multiple access points','boat rentals']),
  ('jumeirah-beach','Jumeirah Beach','Dubai',25.2048,55.2708,'Shore/Kayak',array['Kingfish','Queenfish','Hammour','Barracuda','Sultan Ibrahim','Trevally'],'Public beach','All day',array['Beach facilities','restaurants','water sports']),
  ('the-palm-jumeirah','The Palm Jumeirah','Dubai',25.1124,55.139,'Shore/Boat',array['Snapper','Grouper','Trevally'],'Various points','Night fishing recommended',array['Multiple access points']),
  ('jebel-ali-beach','Jebel Ali Beach','Dubai',25.0157,55.0207,'Shore',array['Kingfish','Barracuda','Snappers'],'Public','All day, good for camping',array['Camping allowed','water sports']),
  ('dubai-marina','Dubai Marina','Dubai',25.0804,55.1398,'Shore/Boat',array['Small fish','Barracuda'],'Public walkways','Evening',array['Restaurants','yacht charters']),
  ('safa-park-lake','Safa Park Lake','Dubai',25.1893,55.2572,'Freshwater',array['Tilapia','Carp','Catfish','Bream'],'Public park (entry fee AED 4)','All day',array['Park amenities','boat rentals']),
  ('al-seef-district','Al Seef District','Dubai',25.264,55.297,'Shore/Marina',array['Tilapia','Kingfish','Sea Bass'],'Marina berths','All day',array['Marina facilities','restaurants','heritage area']),
  ('umm-suqeim-beach','Umm Suqeim Beach','Dubai',25.1426,55.1876,'Shore',array['Various species'],'Public','Various',array['Beach amenities']),
  ('al-aryam-island','Al Aryam Island','Abu Dhabi',24.3068,54.2266,'Shore/Camping',array['Small fish','Hamour','Poison fish','Puffer fish'],'Public - Good for camping','Overnight/daytime',array['Camping area','good for families']),
  ('mina-breakwater','Mina Breakwater','Abu Dhabi',24.5,54.37,'Shore/Breakwater',array['Small fish'],'Public','10AM onwards',array['Breakwater access']),
  ('marina-mall-island','Marina Mall Island','Abu Dhabi',24.4764,54.3219,'Shore',array['Shari (Ray fish)'],'Public','All day',array['Mall nearby']),
  ('salam-corniche','Salam Corniche','Abu Dhabi',24.49,54.36,'Shore',array['Mixed catches'],'Public - No tents allowed','Day fishing',array['Corniche facilities']),
  ('mussafah-bridge','Mussafah Bridge','Abu Dhabi',24.36,54.51,'Shore',array['Various'],'Check for restrictions','Various',array['Limited']),
  ('al-bateen','Al Bateen','Abu Dhabi',24.46,54.32,'Shore/Beach',array['Various'],'Public','Evening',array['Beach area']),
  ('mina-zayed','Mina Zayed','Abu Dhabi',24.52,54.39,'Shore/Port',array['Various'],'Port area','Various',array['Port facilities','fish market']),
  ('al-khan-lagoon','Al Khan Lagoon','Sharjah',25.3211,55.3831,'Shore/Lagoon',array['Kingfish','Queenfish','Trevally','Cobia'],'Public - Very accessible','All day',array['Natural surroundings']),
  ('al-hamriyah-port','Al Hamriyah Port','Sharjah',25.42,55.51,'Shore/Boat',array['Groupers','Kingfish','Snapper'],'Public','All day',array['Port access','boat launches']),
  ('khor-kalba','Khor Kalba','Sharjah',25.055,56.355,'Tidal Inlet',array['Snapper','Barracuda','Catfish'],'Public - Check tide charts','Incoming tide',array['Mangrove area']),
  ('marbella-resort-area','Marbella Resort Area','Sharjah',25.29,55.3,'Shore/Boat Charter',array['Kingfish','Deep sea species'],'Charter boats available','September to April',array['Charter services','resort facilities']),
  ('sharjah-corniche','Sharjah Corniche','Sharjah',25.35,55.39,'Shore',array['Various'],'Public','Evening',array['Corniche walkway']),
  ('ajman-marina','Ajman Marina','Ajman',25.405,55.435,'Marina/Shore',array['Various'],'Public - Luxury waterfront','All day',array['Yacht club','dining','recreational activities']),
  ('ajman-corniche','Ajman Corniche','Ajman',25.41,55.44,'Shore',array['Small to medium fish'],'Public','Various',array['Corniche facilities']),
  ('ajman-beach','Ajman Beach','Ajman',25.405,55.445,'Shore',array['Various coastal species'],'Public','Early morning, evening',array['Beach access']),
  ('uaq-coastline','UAQ Coastline','Umm Al Quwain',25.5644,55.555,'Shore',array['Good variety'],'Public - No ban','All day',array['Multiple access points']),
  ('uaq-lagoons','UAQ Lagoons','Umm Al Quwain',25.55,55.53,'Lagoon/Mangrove',array['Various'],'Public','Various',array['Natural areas']),
  ('al-hamra-marina','Al Hamra Marina','Ras Al Khaimah',25.68,55.77,'Marina/Deep Sea',array['Kingfish','Barracuda','Snapper','Cobia','Amberjack','Sailfish','Yellowfin Tuna'],'Charter boats','All year (peak: winter)',array['Professional charters','safety equipment']),
  ('al-marjan-island','Al Marjan Island','Ras Al Khaimah',25.685,55.795,'Shore/Artificial Island',array['Various reef species'],'Public','Night fishing excellent',array['Hotels','beaches','turquoise waters']),
  ('al-jazeera-al-hamra-beach','Al Jazeera Al Hamra Beach','Ras Al Khaimah',25.695,55.815,'Shore/Historical',array['Grouper','Trevally','Queenfish','Snapper','Cobia'],'Public - Historic fishing village','All day',array['Shallow waters','nearby reefs']),
  ('al-rams-beach','Al Rams Beach','Ras Al Khaimah',25.86,56.04,'Shore',array['Various'],'Public','Night fishing popular',array['Peaceful location']),
  ('mina-al-arab-lagoon','Mina Al Arab Lagoon','Ras Al Khaimah',25.67,55.76,'Lagoon/Family',array['Rabbitfish','Small Barracuda','Emperor Fish'],'Public - Beginner friendly','All day',array['Safe waters','mangroves']),
  ('dhayah-bay','Dhayah Bay','Ras Al Khaimah',25.75,55.9,'Deep Sea',array['Deep sea species'],'Charter boats','Various',array['Deep sea access']),
  ('khor-al-beidah','Khor Al Beidah','Ras Al Khaimah',25.7,55.85,'Mangrove/Flats',array['Trevally','Mullet','Small Reef Fish'],'Public','Various',array['Mangroves','shallow flats']),
  ('rak-offshore','RAK Offshore','Ras Al Khaimah',25.8,56.2,'Deep Sea/Offshore',array['Sailfish','Tuna','Dorado','Giant Trevally','Sharks'],'Full-day charters only','All year',array['Big-game fishing']),
  ('flamingo-beach','Flamingo Beach','Ras Al Khaimah',25.65,55.73,'Shore',array['Various coastal species'],'Public','Various',array['Beach access']),
  ('fujairah-marine-club','Fujairah Marine Club','Fujairah',25.115,56.3456,'Marina/Deep Sea',array['Dorado','Sailfish','Amberjack','Yellowfin Tuna','Trevally','Striped Marlin'],'Charter boats','October to March',array['Full charter services']),
  ('fujairah-port-area','Fujairah Port Area','Fujairah',25.125,56.355,'Shore/Port',array['Various'],'Public areas','Various',array['Port access']),
  ('dibba','Dibba','Fujairah',25.62,56.27,'Shore/Fishing Village',array['Various'],'Public - Major fishing hub','Early morning (market opens 5 AM)',array['Live fish auctions','fishing village']),
  ('khor-fakkan','Khor Fakkan','Fujairah',25.335,56.342,'Shore/Bay',array['Various Gulf of Oman species'],'Public','Various',array['Bay area','scenic location']),
  ('fujairah-beaches','Fujairah Beaches','Fujairah',25.12,56.325,'Shore',array['Various'],'Multiple public beaches','Various',array['Beach access along coast']),
  ('hameem-beach','Hameem Beach','Abu Dhabi',24.240377,54.306735,'Shore/Camping',array['Hammour','Kingfish','Barracuda','Emperor Fish','Trevally','Spangled Emperor','Queen Fish','Cobia','Grouper','Bream'],'Public - Remote pristine beach on the Abu Dhabi coast. No restrictions. Camping permitted overnight.','Early morning, evening, and overnight — one of the best night fishing beaches in Abu Dhabi',array['Camping allowed','fire pits','crystal clear shallow water','pristine unspoiled shoreline','very low fishing pressure']),
  ('mangrove-village','Mangrove Village','Abu Dhabi',24.435,54.442,'Mangrove/Flats',array['Mullet','Trevally','Barracuda','Grouper','Sea Bass'],'Public - Kayak and paddleboard launch area','Early morning, incoming tide',array['Kayak rentals nearby','mangrove boardwalks','sheltered water']),
  ('al-mamzah-beach','Al Mamzah Beach','Dubai',25.326,55.407,'Shore',array['Kingfish','Queenfish','Trevally','Barracuda','Bream','Sultan Ibrahim'],'Public beach park (small entry fee)','Early morning, evening, good year-round',array['Beach park','parking','showers','nearby cafes','calm sheltered water']),
  ('al-zorah-nature-reserve','Al Zorah Nature Reserve','Ajman',25.422,55.472,'Mangrove/Flats',array['Mullet','Trevally','Barracuda','Grouper','Sea Bass','Rabbitfish'],'Public - Kayak rentals available at reserve entrance','Early morning, high tide for best results',array['Kayak rental','nature trails','flamingo colony','mangrove boardwalk'])
on conflict (slug) do nothing;
