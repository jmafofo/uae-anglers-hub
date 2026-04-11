-- ============================================================
-- Mobile API Fields Migration
-- Adds RFID, identification status, environmental observation
-- fields to catches, and creates the fish_tags lookup table.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ── Extend catches table ─────────────────────────────────────

ALTER TABLE public.catches
  ADD COLUMN IF NOT EXISTS rfid_tag            text,
  ADD COLUMN IF NOT EXISTS identification_status text
    DEFAULT 'identified'
    CHECK (identification_status IN ('identified', 'unnamed', 'pending_curation')),
  ADD COLUMN IF NOT EXISTS unnamed_key         text,
  ADD COLUMN IF NOT EXISTS water_colour        text
    CHECK (water_colour IN ('clear', 'green', 'blue', 'brown', 'murky', 'red_tide', 'other')),
  ADD COLUMN IF NOT EXISTS pollution_type      text
    CHECK (pollution_type IN ('none', 'plastic', 'oil_sheen', 'foam', 'sewage', 'algae_bloom', 'other')),
  ADD COLUMN IF NOT EXISTS pollution_severity  text
    CHECK (pollution_severity IN ('none', 'low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS water_temp_c        numeric(4,1),
  ADD COLUMN IF NOT EXISTS visibility_m        numeric(5,1),
  ADD COLUMN IF NOT EXISTS source              text
    DEFAULT 'web'
    CHECK (source IN ('web', 'app', 'api'));

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_catches_rfid
  ON public.catches(rfid_tag)
  WHERE rfid_tag IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_catches_unnamed_key
  ON public.catches(unnamed_key)
  WHERE unnamed_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catches_identification_status
  ON public.catches(identification_status)
  WHERE identification_status <> 'identified';

-- ── fish_tags — RFID tag registry ────────────────────────────

CREATE TABLE IF NOT EXISTS public.fish_tags (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  rfid_tag        text    UNIQUE NOT NULL,
  species         text,
  scientific_name text,
  first_catch_id  uuid    REFERENCES public.catches(id) ON DELETE SET NULL,
  registered_by   uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  registered_at   timestamptz DEFAULT now(),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.fish_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fish tags viewable by authenticated users"
  ON public.fish_tags FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can register tags"
  ON public.fish_tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tag owner can update"
  ON public.fish_tags FOR UPDATE
  USING (auth.uid() = registered_by);

-- ── Curator queue view (convenience) ─────────────────────────

CREATE OR REPLACE VIEW public.unnamed_catches AS
  SELECT c.*, p.username, p.display_name
  FROM public.catches c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.identification_status IN ('unnamed', 'pending_curation')
  ORDER BY c.created_at DESC;
