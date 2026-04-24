-- ── Creator fields migration ─────────────────────────────────────────────────
-- Adds YouTube channel link to profiles (for content creator attribution)
-- Adds youtube_url to catches (so a logged catch can link to the video it appeared in)
-- Adds source tracking so we can tell Ocean Sentinel catches apart from web catches

-- Profiles: creator fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS youtube_channel   text,          -- e.g. https://youtube.com/@josephfishes
  ADD COLUMN IF NOT EXISTS is_creator        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_bio       text;          -- short "about my channel" text

-- Catches: YouTube video link + source tracking
ALTER TABLE catches
  ADD COLUMN IF NOT EXISTS youtube_url text,                -- link to video where this catch appears
  ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'web';  -- 'web' | 'app' | 'ocean_sentinel'

-- Index for fast creator feed queries
CREATE INDEX IF NOT EXISTS idx_catches_source     ON catches(source);
CREATE INDEX IF NOT EXISTS idx_catches_youtube    ON catches(youtube_url) WHERE youtube_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_creator   ON profiles(is_creator) WHERE is_creator = true;
