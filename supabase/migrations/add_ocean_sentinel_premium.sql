-- Add Ocean Sentinel premium flag to profiles
-- Users with ocean_sentinel_premium = true get an ad-free experience in the app

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ocean_sentinel_premium        boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ocean_sentinel_premium_until  timestamptz;

-- Index for fast lookup from mobile auth checks
CREATE INDEX IF NOT EXISTS idx_profiles_ocean_sentinel_premium
  ON profiles (id)
  WHERE ocean_sentinel_premium = true;
