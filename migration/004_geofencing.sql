-- Migration 004: Geo-fencing support for DIPR ad campaign compliance
-- Run: psql $DATABASE_URL -f migration/004_geofencing.sql

-- Add geo-fencing fields to ox_advt
ALTER TABLE ox_advt
  ADD COLUMN IF NOT EXISTS geo_enabled   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS geo_regions   TEXT DEFAULT 'punjab',   -- comma-separated region slugs
  ADD COLUMN IF NOT EXISTS start_date    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- Ad impressions tracking table
CREATE TABLE IF NOT EXISTS advt_impressions (
  id            BIGSERIAL PRIMARY KEY,
  advt_code     INTEGER NOT NULL REFERENCES ox_advt(advt_code) ON DELETE CASCADE,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    TEXT,
  country       TEXT,
  region        TEXT,       -- state / province from IP lookup
  city          TEXT,
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  is_in_fence   BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if within Punjab geo-fence
  user_agent    TEXT,
  page_url      TEXT        -- which page on the site showed this ad
);

CREATE INDEX IF NOT EXISTS idx_impressions_advt    ON advt_impressions(advt_code, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_impressions_date    ON advt_impressions(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_impressions_region  ON advt_impressions(region);
CREATE INDEX IF NOT EXISTS idx_impressions_fence   ON advt_impressions(is_in_fence, advt_code);
