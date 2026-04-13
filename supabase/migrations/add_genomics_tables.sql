-- ============================================================
-- Earth BioGenome — UAE Marine Fish Genomics
-- Tables for genome assemblies, DNA barcodes, and community
-- sample submissions.
-- ============================================================

-- ── Genome assemblies ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.genome_assemblies (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_slug         text NOT NULL,           -- FK hint to species catalogue
  species_name         text NOT NULL,
  scientific_name      text NOT NULL,
  family               text,
  "order"              text,
  habitat_category     text,                    -- Reef | Pelagic | Demersal | Coastal | Open Ocean
  coast                text,                    -- Persian Gulf | Gulf of Oman | Both

  -- Assembly identity
  assembly_accession   text UNIQUE,             -- GCA_XXXXXXXXX or null if pending
  assembly_level       text NOT NULL DEFAULT 'pending',
                        -- chromosome | scaffold | contig | pending
  source               text NOT NULL DEFAULT 'community',
                        -- EBP | NCBI | Community | Pending

  -- Size metrics (stored as integers / real for precision)
  total_length_mb      real,                    -- genome size in Mb
  n50_kb               real,                    -- scaffold N50 in kb
  scaffold_count       integer,
  chromosome_count     integer,                 -- null unless chromosome-level
  gc_content_pct       real,                    -- GC % (e.g. 42.3)

  -- Quality
  busco_complete_pct   real,                    -- BUSCO complete %
  busco_fragmented_pct real,
  busco_missing_pct    real,
  busco_lineage        text DEFAULT 'actinopterygii_odb10',

  -- Methodology
  sequencing_tech      text[],                  -- ['PacBio HiFi', 'Hi-C']
  annotation_status    text DEFAULT 'unannotated',
                        -- annotated | unannotated | pending

  -- Meta
  year_published       integer,
  submitted_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status               text NOT NULL DEFAULT 'pending',
                        -- pending | approved | published
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_genome_assemblies_species ON public.genome_assemblies(species_slug);
CREATE INDEX idx_genome_assemblies_habitat ON public.genome_assemblies(habitat_category);
CREATE INDEX idx_genome_assemblies_status  ON public.genome_assemblies(status);

ALTER TABLE public.genome_assemblies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published assemblies"
  ON public.genome_assemblies FOR SELECT
  USING (status = 'published');
CREATE POLICY "Authenticated insert"
  ON public.genome_assemblies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── DNA barcodes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dna_barcodes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_slug         text,
  species_name         text NOT NULL,
  scientific_name      text NOT NULL,
  family               text,
  habitat_category     text,
  coast                text,

  -- Sequence data
  marker_type          text NOT NULL,           -- COI | 16S | 12S | cytb | ITS2 | NADH
  sequence             text NOT NULL,           -- raw nucleotide sequence
  sequence_length      integer GENERATED ALWAYS AS (length(sequence)) STORED,
  genbank_accession    text,

  -- Collection metadata
  collection_location  text,
  latitude             real,
  longitude            real,
  collection_date      date,
  depth_m              real,
  voucher_id           text,

  -- Provenance
  submitted_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source               text DEFAULT 'community',
  status               text NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dna_barcodes_species  ON public.dna_barcodes(species_slug);
CREATE INDEX idx_dna_barcodes_marker   ON public.dna_barcodes(marker_type);
CREATE INDEX idx_dna_barcodes_status   ON public.dna_barcodes(status);

ALTER TABLE public.dna_barcodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved barcodes"
  ON public.dna_barcodes FOR SELECT
  USING (status IN ('approved', 'published'));
CREATE POLICY "Authenticated insert barcodes"
  ON public.dna_barcodes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── Community sample submissions ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.genomics_submissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name       text NOT NULL,
  submitter_email      text NOT NULL,
  institution          text,

  -- Sample
  species_name         text NOT NULL,
  scientific_name      text,
  sample_type          text NOT NULL,           -- tissue | eDNA | blood | scale | fin_clip | water
  tissue_type          text,                    -- liver | muscle | fin | blood | other
  preservation         text,                    -- ethanol_95 | RNAlater | frozen | DMSO | dried
  collection_location  text,
  latitude             real,
  longitude            real,
  collection_date      date,
  depth_m              real,
  habitat_description  text,

  -- Data
  data_type            text[],                  -- whole_genome | barcode | SNP_panel | transcriptome
  file_urls            jsonb DEFAULT '[]',      -- [{name, url, size_mb, type}]
  sequencing_platform  text,
  coverage_depth       text,

  -- Review
  metadata             jsonb DEFAULT '{}',
  status               text NOT NULL DEFAULT 'pending',
                        -- pending | under_review | accepted | rejected | published
  reviewer_notes       text,
  submitted_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_genomics_submissions_status ON public.genomics_submissions(status);
CREATE INDEX idx_genomics_submissions_email  ON public.genomics_submissions(submitter_email);

ALTER TABLE public.genomics_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own submissions"
  ON public.genomics_submissions FOR SELECT
  USING (submitted_by = auth.uid() OR auth.role() = 'service_role');
CREATE POLICY "Authenticated insert submissions"
  ON public.genomics_submissions FOR INSERT
  WITH CHECK (true); -- allow anonymous submissions (email collected instead)

-- ── Seed data — published genome assemblies ──────────────────
-- Representative UAE fish with real or estimated genome data
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

  ('sobaity-seabream','Sobaity Seabream','Sparidentex hasta','Sparidae','Perciformes',
   'Reef','Persian Gulf',NULL,'pending','Community',
   NULL,NULL,NULL,NULL,NULL,
   NULL,NULL,NULL,
   ARRAY[],'pending',NULL,'pending'),

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
