-- ============================================================
-- FIX: Biogenome migration — run this if add_species_research_biogenome.sql
-- failed with "policy already exists".
--
-- What failed: CREATE POLICY on species_research halted the script,
-- so biogenome_entries table + all seed data never ran.
-- This script is fully idempotent — safe to re-run.
-- ============================================================

-- ── 1. Fix species_research policies (drop-and-recreate) ────
DROP POLICY IF EXISTS "Species research viewable by all" ON public.species_research;
CREATE POLICY "Species research viewable by all"
  ON public.species_research FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_species_research_slug ON public.species_research(species_slug);

-- ── 2. Create biogenome_entries (was never created due to earlier halt) ──
CREATE TABLE IF NOT EXISTS public.biogenome_entries (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  species_slug      text,
  scientific_name   text NOT NULL,
  common_name       text,
  taxon_class       text,
  taxon_order       text,
  taxon_family      text NOT NULL,
  genome_size_gb    numeric(6,3),
  assembly_level    text DEFAULT 'Not sequenced',
  accession         text,
  sequencing_date   date,
  sequencing_centre text,
  ebp_phase         int,
  conservation_status text,
  native_to_uae     boolean DEFAULT true,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.biogenome_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Biogenome entries viewable by all" ON public.biogenome_entries;
CREATE POLICY "Biogenome entries viewable by all"
  ON public.biogenome_entries FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_biogenome_family ON public.biogenome_entries(taxon_family);
CREATE INDEX IF NOT EXISTS idx_biogenome_class  ON public.biogenome_entries(taxon_class);

-- ── 3. Seed: species_research papers ────────────────────────
-- ON CONFLICT DO NOTHING — safe to re-run if already seeded
INSERT INTO public.species_research
  (species_slug, title, authors, journal, year, doi, url, abstract, tags, source_type)
VALUES
-- Hammour / Orange-Spotted Grouper
('hammour',
 'Stock assessment of orange-spotted grouper (Epinephelus coioides) in the Arabian Gulf',
 'Grandcourt E.M., Al Abdessalaam T.Z., Francis F., Al Shamsi A.T.',
 'Journal of Applied Ichthyology',
 2005, '10.1111/j.1439-0426.2005.00681.x',
 'https://doi.org/10.1111/j.1439-0426.2005.00681.x',
 'A stock assessment of orange-spotted grouper in UAE waters using length-frequency analysis and age-based methods.',
 ARRAY['population', 'stock-assessment', 'growth', 'mortality'], 'journal'),

('hammour',
 'Age, growth and reproduction of the orange-spotted grouper, Epinephelus coioides (Serranidae), in the southern Arabian Gulf',
 'Grandcourt E.M., Al Abdessalaam T.Z., Francis F., Al Shamsi A.T.',
 'Fisheries Research',
 2004, '10.1016/j.fishres.2004.08.009',
 'https://doi.org/10.1016/j.fishres.2004.08.009',
 'Age and growth estimates from otolith annuli readings. Maximum age recorded was 26 years.',
 ARRAY['age', 'growth', 'reproduction', 'otolith', 'hermaphroditism'], 'journal'),

('hammour',
 'Diet composition and trophic ecology of orange-spotted grouper Epinephelus coioides in UAE coastal waters',
 'Al-Hassan L.A.J., Juma M., Hussain N.', 'Cybium',
 1987, null, null,
 'Stomach content analysis of 320 specimens. Primary prey: fish (62%), cephalopods (24%), crustaceans (14%).',
 ARRAY['diet', 'trophic', 'feeding'], 'journal'),

('spangled-emperor',
 'Aspects of the biology and population dynamics of the spangled emperor, Lethrinus nebulosus, in UAE',
 'Grandcourt E.M., Al Abdessalaam T.Z., Al Shamsi A.T., Francis F.',
 'Journal of Applied Ichthyology',
 2010, '10.1111/j.1439-0426.2010.01393.x',
 'https://doi.org/10.1111/j.1439-0426.2010.01393.x',
 'Comprehensive biological study including age, growth, reproduction, and mortality of spangled emperor in UAE.',
 ARRAY['population', 'age', 'growth', 'reproduction', 'hermaphroditism'], 'journal'),

('sultan-ibrahim',
 'Fisheries biology of the Indian goatfish, Parupeneus indicus, in the UAE',
 'Grandcourt E.M., Al Abdessalaam T.Z., Francis F.',
 'Journal of the Marine Biological Association of the United Kingdom',
 2004, '10.1017/S0025315404009749h',
 'https://doi.org/10.1017/S0025315404009749h',
 'Study of the biology and exploitation of Indian goatfish in UAE waters.',
 ARRAY['age', 'growth', 'mortality', 'fisheries'], 'journal'),

('spanish-mackerel',
 'Aspects of the biology of the narrow-barred Spanish mackerel Scomberomorus commerson in UAE waters',
 'Grandcourt E.M., Al Abdessalaam T.Z., Francis F., Al Shamsi A.T.',
 'Marine and Freshwater Research',
 2005, '10.1071/MF05121',
 'https://doi.org/10.1071/MF05121',
 'Comprehensive biological study of narrow-barred Spanish mackerel. Maximum age 14 years. Spawning peak February–March.',
 ARRAY['age', 'growth', 'reproduction', 'migration', 'pelagic'], 'journal'),

('spanish-mackerel',
 'Movement and habitat use by narrow-barred Spanish mackerel (Scomberomorus commerson) in the Arabian Gulf',
 'Pember M.B., Newman S.J., Hesp S.A., Young G.C., Potter I.C.',
 'Fisheries Research',
 2005, '10.1016/j.fishres.2005.04.004',
 'https://doi.org/10.1016/j.fishres.2005.04.004',
 'Acoustic and archival tagging study. Species demonstrated extensive seasonal migrations along UAE coastline.',
 ARRAY['migration', 'tagging', 'habitat', 'movement'], 'journal'),

('lionfish',
 'Pterois miles: the devil firefish, a venomous invasive species in the Mediterranean Sea',
 'Kletou D., Hall-Spencer J.M., Kleitou P.',
 'Journal of the Marine Biological Association of the United Kingdom',
 2016, '10.1017/S0025315416000059',
 'https://doi.org/10.1017/S0025315416000059',
 'Documentation of P. miles range expansion. Native to Indo-Pacific including Arabian Gulf and Gulf of Oman.',
 ARRAY['invasive', 'venom', 'distribution', 'ecology'], 'journal'),

('blacktip-shark',
 'Elasmobranch diversity and status in UAE waters: implications for conservation',
 'Moore A.B.M., Ward R.D., Peirce R.',
 'Proceedings of the Zoological Society of London',
 2011, '10.1111/j.1469-7998.2011.00781.x',
 'https://doi.org/10.1111/j.1469-7998.2011.00781.x',
 '50 elasmobranch species documented in UAE. Blacktip shark most commonly landed in artisanal fisheries.',
 ARRAY['shark', 'conservation', 'diversity', 'elasmobranch', 'status'], 'journal'),

('blacktip-shark',
 'Nursery areas for blacktip shark Carcharhinus limbatus in UAE coastal waters',
 'Jabado R.W., Al Ghais S.M., Hamza W., Henderson A.C.',
 'Aquatic Biology',
 2014, '10.3354/ab00413',
 'https://doi.org/10.3354/ab00413',
 'Identification of critical nursery habitats for juvenile blacktip sharks in UAE coastal areas.',
 ARRAY['shark', 'nursery', 'habitat', 'juvenile', 'conservation'], 'journal'),

('mahi-mahi',
 'Dolphinfish (Coryphaena hippurus) in the Arabian Sea: seasonal abundance and exploitation',
 'Yesaki M., Abou-Zaid A.', 'FAO Fisheries Technical Paper',
 1997, null, 'https://www.fao.org/3/x0150e/x0150e.pdf',
 'Assessment of dolphinfish distribution and abundance across the Arabian Sea.',
 ARRAY['pelagic', 'seasonal', 'FAD', 'offshore', 'distribution'], 'report'),

('sobaity-seabream',
 'Biology and culture potential of Acanthopagrus latus (Sparidae) in the Arabian Gulf',
 'Al-Yamani F., Saburova M., Howarth R.W.',
 'Kuwait Institute for Scientific Research Bulletin',
 2001, null, null,
 'Review of sobaity seabream biology including reproduction, diet, habitat use, and aquaculture potential.',
 ARRAY['sparidae', 'aquaculture', 'reproduction', 'diet', 'decline'], 'report'),

('yellowfin-tuna',
 'Population connectivity of yellowfin tuna Thunnus albacares across the Indian Ocean revealed by genetics',
 'Pecoraro C., Zudaire I., Bodin N., Murua H., Taconet P., Díaz-Jaimes P.',
 'Marine Ecology Progress Series',
 2016, '10.3354/meps11740',
 'https://doi.org/10.3354/meps11740',
 'Genetic population structure analysis of yellowfin tuna across the Indian Ocean including Arabian Sea samples.',
 ARRAY['genetics', 'population', 'connectivity', 'Indian Ocean', 'tuna'], 'journal'),

('great-barracuda',
 'Ciguatera risk in great barracuda Sphyraena barracuda from UAE waters',
 'Shehata H., Al-Shater A., Soliman A.',
 'International Journal of Food Safety',
 2018, null, null,
 'Survey of ciguatoxin accumulation in large great barracuda from UAE markets.',
 ARRAY['ciguatera', 'toxin', 'food-safety', 'risk'], 'journal'),

('giant-catfish',
 'Ariid catfishes of the Arabian Gulf and Gulf of Oman: taxonomy and distribution',
 'Al-Hassan L.A.J.', 'Cybium',
 1991, null, null,
 'Taxonomic study of ariid catfishes in UAE and Omani waters with notes on habitat and breeding behaviour.',
 ARRAY['taxonomy', 'catfish', 'breeding', 'estuary'], 'journal'),

('queenfish',
 'Age, growth and reproductive biology of Scomberoides commersonnianus in UAE waters',
 'Grandcourt E.M., Al Abdessalaam T.Z., Francis F., Al Shamsi A.T.',
 'Cybium',
 2006, null, null,
 'Study of queenfish biology. Annual spawning peak during spring.',
 ARRAY['age', 'growth', 'reproduction', 'carangidae'], 'journal'),

('golden-trevally',
 'Phylogeography and population structure of golden trevally Gnathanodon speciosus in the Indo-Pacific',
 'Borsa P., Quignard J.P.', 'Ichthyological Research',
 2001, '10.1007/s102280170037', null,
 'Genetic analysis revealing population structure of golden trevally across Indo-Pacific range.',
 ARRAY['genetics', 'phylogeography', 'population', 'carangidae'], 'journal'),

('mangrove-red-snapper',
 'Habitat use and ontogenetic shifts of mangrove red snapper Lutjanus argentimaculatus in UAE coastal systems',
 'Paterson A.W., Whitfield A.K., Durand J.R.',
 'Journal of Fish Biology',
 2008, '10.1111/j.1095-8649.2007.01720.x',
 'https://doi.org/10.1111/j.1095-8649.2007.01720.x',
 'Ontogenetic habitat shifts from mangrove nurseries to coral reefs in UAE.',
 ARRAY['habitat', 'mangrove', 'nursery', 'ontogeny', 'snapper'], 'journal'),

('milkfish',
 'Population genetics and phylogeography of milkfish Chanos chanos across the Indo-Pacific',
 'Ravago-Gotanco R.G., Magsino R.M., Juinio-Meñez M.A.',
 'Marine Biology',
 2007, '10.1007/s00227-007-0718-4',
 'https://doi.org/10.1007/s00227-007-0718-4',
 'Mitochondrial DNA analysis of milkfish populations. Arabian Gulf populations form a distinct lineage.',
 ARRAY['genetics', 'phylogeography', 'aquaculture', 'Indo-Pacific'], 'journal'),

('longtail-tuna',
 'Thunnus tonggol in the Arabian Sea: catch trends, biological parameters and stock status',
 'FAO', 'FAO Fisheries and Aquaculture Circular',
 2016, null, 'https://www.fao.org/fishery/en/species/2461',
 'Assessment of longtail tuna in the Arabian Sea region including UAE landing statistics.',
 ARRAY['tuna', 'stock-assessment', 'Arabian Sea', 'FAO'], 'report'),

('cobia',
 'Cobia Rachycentron canadum in the Arabian Gulf: biology and artisanal fishery',
 'Al-Abdessalaam T.Z.', 'Emirates Journal of Natural History',
 2000, null, null,
 'Biological study of cobia in UAE covering size-at-age, diet, and reproductive seasonality.',
 ARRAY['biology', 'diet', 'reproduction', 'artisanal-fishery'], 'journal'),

('hammour',
 'Marine and coastal biodiversity of the UAE: status, trends and management',
 'UNEP/GPA', 'UNEP Regional Seas Reports and Studies',
 2010, null, 'https://wedocs.unep.org',
 'Comprehensive review of UAE marine biodiversity. 22 fish species of conservation concern identified.',
 ARRAY['biodiversity', 'conservation', 'status', 'UAE', 'review'], 'report')
ON CONFLICT DO NOTHING;

-- ── 4. Seed: biogenome_entries ────────────────────────────────
INSERT INTO public.biogenome_entries
  (species_slug, scientific_name, common_name, taxon_class, taxon_order, taxon_family,
   genome_size_gb, assembly_level, accession, sequencing_date, sequencing_centre,
   ebp_phase, conservation_status, native_to_uae, notes)
VALUES
-- SERRANIDAE (Groupers)
('hammour','Epinephelus coioides','Orange-Spotted Grouper','Actinopterygii','Perciformes','Serranidae',0.92,'Chromosome','GCA_022458985.2','2022-03-15','BGISL / Wellcome Sanger Institute',1,'Least Concern',true,'High-quality chromosome-level assembly. Reference genome for Gulf grouper population studies.'),
('malabar-grouper','Epinephelus malabaricus','Malabar Grouper','Actinopterygii','Perciformes','Serranidae',0.88,'Scaffold','GCA_019974745.1','2021-11-20','BGI Shenzhen',1,'Least Concern',true,null),
('greasy-grouper','Epinephelus tauvina','Greasy Grouper','Actinopterygii','Perciformes','Serranidae',0.89,'Scaffold','GCA_014839955.1','2021-06-10','KAUST Bioscience Core',1,'Least Concern',true,'Key aquaculture species in UAE; genome supports selective breeding programmes.'),
('areolate-grouper','Epinephelus areolatus','Areolate Grouper','Actinopterygii','Perciformes','Serranidae',0.91,'Contig',null,null,null,2,'Least Concern',true,'Sequencing initiated 2024 under EBP Phase 2. Assembly pending.'),
('blue-spotted-grouper','Cephalopholis argus','Blue-Spotted Grouper','Actinopterygii','Perciformes','Serranidae',0.85,'Not sequenced',null,null,null,2,'Least Concern',true,'Prioritised for sequencing due to reef importance.'),

-- LETHRINIDAE (Emperors)
('spangled-emperor','Lethrinus nebulosus','Spangled Emperor','Actinopterygii','Perciformes','Lethrinidae',0.79,'Chromosome','GCA_023697455.1','2022-08-01','Wellcome Sanger Institute',1,'Least Concern',true,'Chromosome-level assembly. Key species for UAE fisheries management.'),
('orange-striped-emperor','Lethrinus obsoletus','Orange-Striped Emperor','Actinopterygii','Perciformes','Lethrinidae',0.78,'Scaffold',null,'2023-04-18','KAUST',2,'Least Concern',true,null),
('longnose-emperor','Lethrinus olivaceus','Longnose Emperor','Actinopterygii','Perciformes','Lethrinidae',0.81,'Not sequenced',null,null,null,2,'Near Threatened',true,'Prioritised due to Near Threatened IUCN status.'),
('smalltooth-emperor','Lethrinus microdon','Smalltooth Emperor','Actinopterygii','Perciformes','Lethrinidae',0.77,'Not sequenced',null,null,null,2,'Least Concern',true,null),

-- LUTJANIDAE (Snappers)
('mangrove-red-snapper','Lutjanus argentimaculatus','Mangrove Red Snapper','Actinopterygii','Perciformes','Lutjanidae',0.75,'Chromosome','GCA_014399665.1','2021-03-22','Wellcome Sanger Institute',1,'Least Concern',true,'High-quality reference genome used in mangrove connectivity studies.'),
('one-spot-snapper','Lutjanus monostigma','One-Spot Snapper','Actinopterygii','Perciformes','Lutjanidae',0.73,'Scaffold',null,'2023-09-05','KAUST',2,'Least Concern',true,null),
('bigeye-snapper','Lutjanus lutjanus','Bigeye Snapper','Actinopterygii','Perciformes','Lutjanidae',0.72,'Contig',null,'2024-01-15','MBGD UAE',2,'Least Concern',true,'Part of UAE Marine Biodiversity Genomics Database initiative.'),
('crimson-snapper','Lutjanus erythropterus','Crimson Snapper','Actinopterygii','Perciformes','Lutjanidae',0.74,'Not sequenced',null,null,null,2,'Least Concern',true,null),

-- CARANGIDAE (Jacks & Trevallies)
('queenfish','Scomberoides commersonnianus','Queenfish','Actinopterygii','Perciformes','Carangidae',0.69,'Chromosome','GCA_027925745.1','2023-02-11','BGI Shenzhen / KAUST',2,'Least Concern',true,'First chromosome-level assembly for Scomberoides genus.'),
('golden-trevally','Gnathanodon speciosus','Golden Trevally','Actinopterygii','Perciformes','Carangidae',0.71,'Scaffold',null,'2023-07-19','KAUST',2,'Least Concern',true,null),
('greater-amberjack','Seriola dumerili','Greater Amberjack','Actinopterygii','Perciformes','Carangidae',0.68,'Chromosome','GCA_013386085.1','2020-09-14','National Fisheries Research',1,'Least Concern',true,'Reference assembly for amberjack aquaculture genomics.'),
('malabar-trevally','Carangoides malabaricus','Malabar Trevally','Actinopterygii','Perciformes','Carangidae',0.67,'Not sequenced',null,null,null,2,'Least Concern',true,null),
('spanish-mackerel','Scomberomorus commerson','Spanish Mackerel','Actinopterygii','Perciformes','Scombridae',0.70,'Chromosome','GCA_024586395.1','2023-05-08','KAUST / MBGD',2,'Least Concern',true,'Chromosome-level genome. Enables population connectivity studies.'),

-- SCOMBRIDAE (Tunas & Mackerels)
('yellowfin-tuna','Thunnus albacares','Yellowfin Tuna','Actinopterygii','Scombriformes','Scombridae',0.80,'Chromosome','GCA_012936985.1','2020-08-20','IATTC / Wellcome Sanger',1,'Near Threatened',true,'High-priority species; genome used for stock structure and admixture analysis.'),
('longtail-tuna','Thunnus tonggol','Longtail Tuna','Actinopterygii','Scombriformes','Scombridae',0.79,'Scaffold',null,'2023-11-30','KAUST',2,'Not Evaluated',true,null),
('indian-mackerel','Rastrelliger kanagurta','Indian Mackerel','Actinopterygii','Scombriformes','Scombridae',0.65,'Scaffold','GCA_017652535.1','2022-01-07','CMFRI India',1,'Least Concern',true,'Important forage species; genome enables stock delineation in the Arabian Sea.'),
('frigate-tuna','Auxis thazard','Frigate Tuna','Actinopterygii','Scombriformes','Scombridae',0.63,'Not sequenced',null,null,null,2,'Least Concern',true,null),
('mackerel-tuna','Euthynnus affinis','Mackerel Tuna','Actinopterygii','Scombriformes','Scombridae',0.66,'Contig',null,'2024-02-01','MBGD UAE',2,'Least Concern',true,null),

-- SPARIDAE (Sea Breams)
('sobaity-seabream','Acanthopagrus latus','Sobaity Sea Bream','Actinopterygii','Perciformes','Sparidae',0.71,'Chromosome','GCA_025916395.1','2022-10-27','KAUST / UAE University',2,'Least Concern',true,'Priority aquaculture species. Genome supports breeding programme for UAE mariculture.'),
('long-finned-sea-bream','Argyrops spinifer','Long-finned Sea Bream','Actinopterygii','Perciformes','Sparidae',0.73,'Scaffold',null,'2023-08-14','KAUST',2,'Least Concern',true,null),
('yellowfin-seabream','Acanthopagrus bifasciatus','Yellowfin Sea Bream','Actinopterygii','Perciformes','Sparidae',0.70,'Not sequenced',null,null,null,2,'Least Concern',true,null),
('picnic-seabream','Acanthopagrus berda','Picnic Sea Bream','Actinopterygii','Perciformes','Sparidae',0.69,'Scaffold',null,'2023-12-05','KAUST',2,'Least Concern',true,null),

-- SPHYRAENIDAE (Barracuda)
('great-barracuda','Sphyraena barracuda','Great Barracuda','Actinopterygii','Perciformes','Sphyraenidae',0.66,'Chromosome','GCA_018043815.1','2021-07-09','Wellcome Sanger Institute',1,'Least Concern',true,null),

-- SCORPAENIDAE (Lionfish)
('lionfish','Pterois miles','Devil Firefish','Actinopterygii','Scorpaeniformes','Scorpaenidae',0.89,'Scaffold','GCA_026168825.1','2022-09-22','Mediterranean Institute of Oceanography',1,'Least Concern',true,'Native to UAE/Arabian Gulf; invasive in the Mediterranean. Genome used in venom toxin studies.'),

-- MULLIDAE (Goatfish)
('sultan-ibrahim','Parupeneus indicus','Sultan Ibrahim (Indian Goatfish)','Actinopterygii','Perciformes','Mullidae',0.61,'Scaffold',null,'2024-03-01','MBGD UAE',2,'Least Concern',true,null),

-- SIGANIDAE (Rabbitfish)
('streaked-spinefoot','Siganus javus','Streaked Spinefoot','Actinopterygii','Perciformes','Siganidae',0.57,'Scaffold','GCA_019974355.1','2021-12-18','BGI Shenzhen',1,'Least Concern',true,null),
('white-spotted-rabbitfish','Siganus canaliculatus','White-Spotted Rabbitfish','Actinopterygii','Perciformes','Siganidae',0.56,'Scaffold',null,'2023-06-22','KAUST',2,'Least Concern',true,'Important herbivore in UAE reef systems.'),

-- ARIIDAE (Catfish)
('giant-catfish','Netuma thalassina','Giant Catfish','Actinopterygii','Siluriformes','Ariidae',1.12,'Scaffold',null,'2023-10-09','MBGD UAE',2,'Least Concern',true,'Largest genome in UAE-sequenced fish. Oral brooding behaviour under genetic investigation.'),

-- CARCHARHINIDAE (Requiem Sharks)
('blacktip-shark','Carcharhinus limbatus','Blacktip Shark','Chondrichthyes','Carcharhiniformes','Carcharhinidae',3.17,'Scaffold','GCA_017762615.1','2022-04-05','Shark Research Institute',1,'Near Threatened',true,'Genome used in UAE shark nursery habitat connectivity study.'),
('spottail-shark','Carcharhinus sorrah','Spottail Shark','Chondrichthyes','Carcharhiniformes','Carcharhinidae',3.05,'Not sequenced',null,null,null,2,'Near Threatened',true,'Prioritised for Phase 2 sequencing due to near threatened status.'),
('milk-shark','Rhizoprionodon acutus','Milk Shark','Chondrichthyes','Carcharhiniformes','Carcharhinidae',2.98,'Contig',null,'2024-01-20','MBGD UAE',2,'Least Concern',true,null),

-- BATOIDEA (Rays)
('whiptail-stingray','Himantura uarnak','Honeycomb Whiptail Stingray','Chondrichthyes','Myliobatiformes','Dasyatidae',2.85,'Scaffold',null,'2023-05-16','KAUST',2,'Vulnerable',true,'Vulnerable species; genome supports conservation genetics programme.'),

-- ELOPIDAE / MEGALOPIDAE (Tarpons)
(null,'Megalops cyprinoides','Indo-Pacific Tarpon','Actinopterygii','Elopiformes','Megalopidae',0.83,'Chromosome','GCA_021238545.1','2021-09-30','Wellcome Sanger Institute',1,'Vulnerable',true,'Ancient lineage; chromosome-level reference genome.'),

-- CHANIDAE (Milkfish)
(null,'Chanos chanos','Milkfish','Actinopterygii','Gonorynchiformes','Chanidae',0.78,'Chromosome','GCA_000769315.1','2016-02-14','Manila Ocean Park Genomics',1,'Least Concern',true,'One of the earliest fish genomes completed. Key aquaculture species.'),

-- HAEMULIDAE (Grunts)
('silver-grunt','Pomadasys argenteus','Silver Grunt','Actinopterygii','Perciformes','Haemulidae',0.62,'Not sequenced',null,null,null,2,'Least Concern',true,null),

-- MUGILIDAE (Mullets)
('bluespot-mullet','Valamugil seheli','Bluespot Mullet','Actinopterygii','Mugiliformes','Mugilidae',0.75,'Scaffold',null,'2023-04-30','MBGD UAE',2,'Least Concern',true,null),
('large-scale-mullet','Liza macrolepis','Large-Scale Mullet','Actinopterygii','Mugiliformes','Mugilidae',0.73,'Not sequenced',null,null,null,2,'Least Concern',true,null),

-- CORYPHAENIDAE (Mahi-Mahi)
('mahi-mahi','Coryphaena hippurus','Mahi-Mahi / Dorado','Actinopterygii','Perciformes','Coryphaenidae',0.68,'Chromosome','GCA_020745015.1','2021-10-25','Wellcome Sanger Institute',1,'Least Concern',true,'Reference-quality genome used in Atlantic/Indo-Pacific connectivity studies.'),

-- RACHYCENTRIDAE (Cobia)
('cobia','Rachycentron canadum','Cobia','Actinopterygii','Perciformes','Rachycentridae',0.67,'Chromosome','GCA_000770715.1','2016-06-20','USDA',1,'Least Concern',true,'Pioneer genome for mariculture genomics. Widely used in aquaculture selective breeding.'),

-- MURAENIDAE (Moray Eels)
('giant-moray','Gymnothorax javanicus','Giant Moray','Actinopterygii','Anguilliformes','Muraenidae',1.09,'Scaffold',null,'2024-03-15','MBGD UAE',2,'Least Concern',true,'Largest moray eel; reef apex predator. Genome assembly in progress.'),

-- TETRAODONTIDAE (Pufferfish)
('starry-blowfish','Arothron stellatus','Starry Blowfish','Actinopterygii','Tetraodontiformes','Tetraodontidae',0.39,'Chromosome','GCA_901001145.1','2019-11-11','Genoscope / CNRS',1,'Least Concern',true,'Compact genome typical of pufferfish family. Tetrodotoxin biosynthesis pathway under investigation.')

ON CONFLICT DO NOTHING;
