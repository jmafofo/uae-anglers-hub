-- ── Creator fields migration ─────────────────────────────────────────────────
-- Adds social media links to profiles (YouTube, TikTok, Instagram, Facebook)
-- Adds video_url to catches (any platform — YouTube, TikTok, Reels, etc.)
-- Adds source tracking so we can tell Ocean Sentinel catches from web catches
--
-- Applies to UAE Angler Supabase only.
-- All fields are optional — 98% of users are recreational anglers who fill none of them.

-- Profiles: multi-platform social links + creator flag
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_creator        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_bio       text,
  ADD COLUMN IF NOT EXISTS youtube_channel   text,   -- https://youtube.com/@channel
  ADD COLUMN IF NOT EXISTS tiktok_handle     text,   -- https://tiktok.com/@handle
  ADD COLUMN IF NOT EXISTS instagram_handle  text,   -- https://instagram.com/handle
  ADD COLUMN IF NOT EXISTS facebook_page     text;   -- https://facebook.com/page

-- Catches: generic video link (any platform) + source tracking
ALTER TABLE catches
  ADD COLUMN IF NOT EXISTS video_url  text,                          -- YouTube / TikTok / Reels / Facebook
  ADD COLUMN IF NOT EXISTS source     text NOT NULL DEFAULT 'web';   -- 'web' | 'app' | 'ocean_sentinel'

-- Indexes
CREATE INDEX IF NOT EXISTS idx_catches_source   ON catches(source);
CREATE INDEX IF NOT EXISTS idx_catches_video    ON catches(video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_creator ON profiles(is_creator) WHERE is_creator = true;
