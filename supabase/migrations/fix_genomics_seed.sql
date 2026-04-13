-- ============================================================
-- FIX: Genomics tables seed — run this if add_genomics_tables.sql
-- failed with "cannot determine type of empty array".
--
-- The tables, indexes, and policies were all created successfully.
-- Only the INSERT failed (at the Sobaity Seabream row with ARRAY[]).
-- This script re-runs just the INSERT with ARRAY[]::text[] fixed.
-- ON CONFLICT DO NOTHING — fully idempotent / safe to re-run.
-- ============================================================

INSERT INTO public.genome_assemblies
  (species_slug, species_name, scientific_name, family, "order",
   habitat_category, coast, assembly_accession, assembly_level, source,
   total_length_mb, n50_kb, scaffold_count, chromosome_count, gc_content_pct,
   busco_complete_pct, busco_fragmented_pct, busco_missing_pct,
   sequencing_tech, annotation_status, year_published, status)
VALUES
  ('yellowfin-tuna','Yellowfin Tuna','Thunnus albacares','Scombridae','Scombriformes',
   'Pelagic','Both','GCA_003969575.1','scaffold','NCBI',
   866.0,165.4,4521,NULL,40.7,
   94.2,2.1,3.7,
   ARRAY['Illumina HiSeq'],'annotated',2019,'published'),

  -- FIXED: ARRAY[]::text[] instead of bare ARRAY[]
  ('sobaity-seabream','Sobaity Seabream','Sparidentex hasta','Sparidae','Perciformes',
   'Reef','Persian Gulf',NULL,'pending','Community',
   NULL,NULL,NULL,NULL,NULL,
   NULL,NULL,NULL,
   ARRAY[]::text[],'pending',NULL,'pending'),

  ('spangled-emperor','Spangled Emperor','Lethrinus nebulosus','Lethrinidae','Perciformes',
   'Reef','Both','GCA_014529365.1','scaffold','NCBI',
   710.5,89.2,9847,NULL,41.3,
   91.6,3.2,5.2,
   ARRAY['Illumina NovaSeq'],'unannotated',2021,'published'),

  ('spanish-mackerel','Spanish Mackerel','Scomberomorus commerson','Scombridae','Scombriformes',
   'Pelagic','Both',NULL,'contig','Community',
   798.0,12.4,84310,NULL,42.1,
   78.3,8.4,13.3,
   ARRAY['Illumina MiSeq'],'unannotated',NULL,'published'),

  ('common-lionfish','Common Lionfish','Pterois miles','Scorpaenidae','Scorpaeniformes',
   'Reef','Persian Gulf',NULL,'scaffold','EBP',
   640.0,310.7,2104,NULL,39.8,
   96.1,1.4,2.5,
   ARRAY['PacBio HiFi','Hi-C'],'annotated',2023,'published'),

  ('golden-trevally','Golden Trevally','Gnathanodon speciosus','Carangidae','Perciformes',
   'Coastal','Both',NULL,'scaffold','Community',
   722.0,45.8,21340,NULL,41.6,
   85.4,5.2,9.4,
   ARRAY['Illumina HiSeq'],'unannotated',NULL,'published'),

  ('silver-grunt','Silver Grunt','Pomadasys argenteus','Haemulidae','Perciformes',
   'Demersal','Persian Gulf',NULL,'contig','Community',
   590.0,8.7,102460,NULL,40.5,
   72.1,9.3,18.6,
   ARRAY['Illumina MiSeq'],'unannotated',NULL,'published'),

  ('blue-spotted-stingray','Blue-spotted Stingray','Neotrygon kuhlii','Dasyatidae','Myliobatiformes',
   'Demersal','Both',NULL,'scaffold','EBP',
   2840.0,524.3,1842,NULL,42.9,
   88.7,4.1,7.2,
   ARRAY['PacBio HiFi','Hi-C'],'pending',2024,'published')

ON CONFLICT (assembly_accession) DO NOTHING;
