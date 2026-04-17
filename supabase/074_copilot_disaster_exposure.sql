-- Copilot #317b: Disaster Exposure Intel
-- Adds FEMA disaster history + flood zone + geocoding columns to property_data_cache

ALTER TABLE property_data_cache
  ADD COLUMN IF NOT EXISTS fema_flood_zone text,
  ADD COLUMN IF NOT EXISTS fema_sfha boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fema_disasters jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS disaster_exposure_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disaster_exposure_level text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS county_fips text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- Index for county-level disaster cache lookups
CREATE INDEX IF NOT EXISTS idx_property_data_cache_county_fips
  ON property_data_cache (county_fips)
  WHERE county_fips IS NOT NULL;
