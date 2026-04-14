-- Add photo URLs, raw Google reviews, and extracted services to prospect_pipeline.
-- Used by the auto-website-builder to generate contractor sites from scraped data.

ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_reviews jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extracted_services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS facebook_about text,
  ADD COLUMN IF NOT EXISTS facebook_photos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS photos_enriched_at timestamptz;
