-- ============================================================
-- UAE Anglers Hub — Fishing Regulations Table
-- Tracks MOCCAE seasonal bans, size limits, and fishing rules
-- ============================================================

create table if not exists public.fishing_regulations (
  id              uuid default gen_random_uuid() primary key,

  -- Species linkage (can apply to one species, multiple via array, or all species)
  species_slugs   text[] default '{}',       -- e.g. {'silver-bream', 'long-finned-sea-bream'}
  species_names   text[] default '{}',       -- human-readable, for display without a JOIN

  -- Regulation details
  title           text not null,             -- Short title
  regulation_type text not null,             -- seasonal_ban | size_limit | quota | gear_restriction | protected_species | general
  description     text,                      -- Full description of the rule

  -- Seasonal ban fields
  ban_start_month  int,                      -- 1-12 (month the ban starts, recurring annually)
  ban_start_day    int,                      -- day of month
  ban_end_month    int,                      -- 1-12 (month the ban ends)
  ban_end_day      int,                      -- day of month
  ban_scope        text default 'fishing',   -- fishing | trade | import | export | all

  -- Size/weight limits
  min_size_cm      numeric(5,1),             -- minimum landing size in cm
  min_weight_kg    numeric(6,3),             -- minimum landing weight in kg

  -- Source
  authority        text default 'MOCCAE',   -- MOCCAE | FANR | Local Authority
  legal_ref        text,                     -- Ministerial Decision / Federal Law reference
  source_url       text,                     -- Official source URL
  effective_from   date,                     -- When the regulation came into force
  effective_until  date,                     -- NULL = indefinite / rolling annual

  -- Status
  is_active        boolean default true,
  applies_to_coast text default 'Both',      -- 'Persian Gulf' | 'Gulf of Oman' | 'Both'
  applies_to_all_species boolean default false, -- true for rules that apply to all UAE fish

  created_at       timestamptz default now()
);

alter table public.fishing_regulations enable row level security;
create policy "Regulations viewable by all" on public.fishing_regulations for select using (true);

create index if not exists idx_regulations_type on public.fishing_regulations(regulation_type);
create index if not exists idx_regulations_species on public.fishing_regulations using gin(species_slugs);

-- ============================================================
-- SEED: MOCCAE FISHING REGULATIONS
-- Sources: MOCCAE official press releases and Federal Law No. 23 of 1999
-- ============================================================

insert into public.fishing_regulations (
  species_slugs, species_names, title, regulation_type, description,
  ban_start_month, ban_start_day, ban_end_month, ban_end_day, ban_scope,
  authority, legal_ref, source_url, effective_from, effective_until,
  is_active, applies_to_coast
) values

-- ── Goldlined Seabream & Long-finned Sea Bream: February Breeding Ban ──
(
  ARRAY['silver-bream', 'long-finned-sea-bream'],
  ARRAY['Silver Bream (Goldlined Seabream)', 'Long-finned Sea Bream (King Soldier Bream)'],
  'February Breeding Season Ban — Goldlined Seabream & King Soldier Bream',
  'seasonal_ban',
  'MOCCAE bans the fishing AND trade (including sales at fish markets and retail outlets) of Goldlined Seabream (Rhabdosargus sarba) and King Soldier Bream (Argyrops spinifer) throughout the month of February each year. Any fish of these species caught accidentally during the ban period must be immediately released back into the water. The ban applies regardless of the origin of the fish — imported stock is also prohibited from sale during this period. Purpose: to protect both species during their spawning aggregation season, replenish UAE stocks, and align with globally accepted conservation methods. Part of a multi-year programme under Ministerial Decision No. 1 of 2021 covering the 2021–2023 seasons.',
  2, 1, 2, 28,
  'all',
  'MOCCAE',
  'Ministerial Decision No. 1 of 2021',
  'https://moccae.gov.ae/en/media-center/news/1/2/2022/ministry-of-climate-change-and-environment-to-commence-seasonal-ban-on-fishing-trade-of-goldlined-se',
  '2021-02-01',
  NULL,
  true,
  'Both'
),

-- ── Hammour (Orange-Spotted Grouper): Size Limit ──
(
  ARRAY['hammour'],
  ARRAY['Hammour (Orange-Spotted Grouper)'],
  'Minimum Landing Size — Hammour',
  'size_limit',
  'MOCCAE sets a minimum landing size of 30 cm total length for Hammour (Epinephelus coioides) across all UAE waters. Fish below this size must be returned to the sea alive. This applies to recreational and commercial fishers.',
  NULL, NULL, NULL, NULL,
  'fishing',
  'MOCCAE',
  'Federal Law No. 23 of 1999 — Fisheries Regulations',
  'https://moccae.gov.ae/en/services/aquatic-monitoring.aspx',
  '1999-01-01',
  NULL,
  true,
  'Both'
),

-- ── Whiptail Stingray: Protected Species ──
(
  ARRAY['whiptail-stingray'],
  ARRAY['Honeycomb Whiptail Stingray'],
  'Protected Species — Honeycomb Whiptail Stingray',
  'protected_species',
  'Himantura uarnak (Honeycomb Whiptail Stingray) is listed as Vulnerable by IUCN and is subject to increased protection under UAE Federal Law. Commercial targeting is discouraged and reporting of catches is requested by MOCCAE. Accidentally caught specimens should be released unharmed.',
  NULL, NULL, NULL, NULL,
  'all',
  'MOCCAE',
  'CITES Appendix II; Federal Law No. 23 of 1999',
  'https://moccae.gov.ae/en/services/aquatic-monitoring.aspx',
  '2010-01-01',
  NULL,
  true,
  'Both'
),

-- ── Sharks: General Protection ──
(
  ARRAY['blacktip-shark', 'spottail-shark', 'milk-shark'],
  ARRAY['Blacktip Shark', 'Spottail Shark', 'Milk Shark'],
  'Shark Catch Restrictions — MOCCAE',
  'protected_species',
  'UAE Federal Law prohibits the finning of sharks (removing fins and discarding the body at sea). Shark fins may not be exported without the whole body. MOCCAE encourages catch-and-release of all sharks by recreational anglers. Commercial catches must be reported. Sharks listed on CITES Appendix II require export permits.',
  NULL, NULL, NULL, NULL,
  'all',
  'MOCCAE',
  'Federal Law No. 23 of 1999; CITES Resolution Conf. 12.6',
  'https://moccae.gov.ae/en/services/aquatic-monitoring.aspx',
  '2010-01-01',
  NULL,
  true,
  'Both'
),

-- ── Sobaity Seabream: Minimum Size ──
(
  ARRAY['sobaity-seabream'],
  ARRAY['Sobaity (Yellowfin Seabream)'],
  'Minimum Landing Size — Sobaity (Yellowfin Seabream)',
  'size_limit',
  'MOCCAE sets a minimum landing size of 25 cm total length for Sobaity (Acanthopagrus latus). Undersized specimens must be released immediately. The sobaity is one of the most commercially important sparids in UAE waters and a key target of size-limit regulations.',
  NULL, NULL, NULL, NULL,
  'fishing',
  'MOCCAE',
  'Federal Law No. 23 of 1999 — Fisheries Regulations',
  'https://moccae.gov.ae/en/services/aquatic-monitoring.aspx',
  '1999-01-01',
  NULL,
  true,
  'Persian Gulf'
),

-- ── Spangled Emperor: Size Limit ──
(
  ARRAY['spangled-emperor'],
  ARRAY['Spangled Emperor'],
  'Minimum Landing Size — Spangled Emperor',
  'size_limit',
  'MOCCAE sets a minimum landing size of 30 cm total length for Spangled Emperor (Lethrinus nebulosus). One of the most heavily targeted reef fish in UAE, this size limit aims to ensure fish reach reproductive maturity before landing.',
  NULL, NULL, NULL, NULL,
  'fishing',
  'MOCCAE',
  'Federal Law No. 23 of 1999 — Fisheries Regulations',
  'https://moccae.gov.ae/en/services/aquatic-monitoring.aspx',
  '1999-01-01',
  NULL,
  true,
  'Both'
),

-- ── General: Trawling Ban in UAE Territorial Waters ──
(
  ARRAY[]::text[],
  ARRAY[]::text[],
  'Trawl Fishing Prohibited in UAE Territorial Waters',
  'gear_restriction',
  'Bottom trawling is prohibited within UAE territorial waters (12 nautical miles from the coast) under Federal Law No. 23 of 1999. This applies year-round. Exemptions require a specific MOCCAE licence. The ban aims to protect seagrass beds, coral reefs, and benthic habitats critical to juvenile fish development.',
  NULL, NULL, NULL, NULL,
  'fishing',
  'MOCCAE',
  'Federal Law No. 23 of 1999, Article 14',
  'https://moccae.gov.ae/en/services/aquatic-monitoring.aspx',
  '1999-01-01',
  NULL,
  true,
  'Both'
),

-- ── General: Fishing Licence Requirement ──
(
  ARRAY[]::text[],
  ARRAY[]::text[],
  'Fishing Licence Required — All UAE Waters',
  'general',
  'All recreational and commercial fishing in UAE waters requires a valid fishing licence issued by MOCCAE or the relevant emirate authority. Fishing without a licence is an offence under Federal Law No. 23 of 1999. Licences can be obtained via the MOCCAE app or authorised service centres.',
  NULL, NULL, NULL, NULL,
  'fishing',
  'MOCCAE',
  'Federal Law No. 23 of 1999, Article 5',
  'https://moccae.gov.ae/en/services/fishing-license.aspx',
  '1999-01-01',
  NULL,
  true,
  'Both'
);

-- Also add the MOCCAE regulation as a research entry for both species
insert into public.species_research (species_slug, title, authors, journal, year, doi, url, abstract, tags, source_type) values
(
  'silver-bream',
  'MOCCAE Ministerial Decision No. 1 of 2021 — Seasonal Fishing and Trade Ban: Goldlined Seabream',
  'UAE Ministry of Climate Change and Environment (MOCCAE)',
  'Official Ministerial Decision',
  2021,
  NULL,
  'https://moccae.gov.ae/en/media-center/news/1/2/2022/ministry-of-climate-change-and-environment-to-commence-seasonal-ban-on-fishing-trade-of-goldlined-se',
  'Ministerial Decision No. 1 of 2021 bans the fishing and trade of Goldlined Seabream (Rhabdosargus sarba) throughout February each year to protect spawning aggregations. Sales are prohibited regardless of fish origin. Accidental catches must be returned to the water immediately. The regulation covers the 2021–2023 seasons as part of a rolling conservation programme aligned with UAE 2030 fisheries sustainability targets.',
  ARRAY['seasonal-ban', 'breeding-season', 'conservation', 'MOCCAE', 'trade-restriction'],
  'report'
),
(
  'long-finned-sea-bream',
  'MOCCAE Ministerial Decision No. 1 of 2021 — Seasonal Fishing and Trade Ban: King Soldier Bream',
  'UAE Ministry of Climate Change and Environment (MOCCAE)',
  'Official Ministerial Decision',
  2021,
  NULL,
  'https://moccae.gov.ae/en/media-center/news/1/2/2022/ministry-of-climate-change-and-environment-to-commence-seasonal-ban-on-fishing-trade-of-goldlined-se',
  'Ministerial Decision No. 1 of 2021 bans the fishing and trade of King Soldier Bream (Argyrops spinifer) throughout February each year to protect spawning aggregations. Sales are prohibited regardless of fish origin. Accidental catches must be returned to the water immediately. The regulation covers the 2021–2023 seasons as part of a rolling conservation programme aligned with UAE 2030 fisheries sustainability targets.',
  ARRAY['seasonal-ban', 'breeding-season', 'conservation', 'MOCCAE', 'trade-restriction'],
  'report'
);
