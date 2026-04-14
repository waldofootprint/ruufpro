-- Add prospect-specific fields to prospect_pipeline.
-- Prospects aren't contractors yet — we need to store their business data
-- directly on the pipeline row instead of requiring a contractors FK.

-- Make contractor_id optional (prospects don't have a contractor record yet)
ALTER TABLE prospect_pipeline ALTER COLUMN contractor_id DROP NOT NULL;

-- Add business info columns for raw prospects
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text DEFAULT 'FL',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS reviews_count integer,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS google_place_id text;

-- Index for dedup by business name + city
CREATE INDEX IF NOT EXISTS idx_prospect_business_city
  ON prospect_pipeline (business_name, city)
  WHERE business_name IS NOT NULL;
