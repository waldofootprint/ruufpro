-- Add years_in_business and founded_year to prospect_pipeline.
-- Extracted from prospect websites during scraping.

ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS years_in_business integer,
  ADD COLUMN IF NOT EXISTS founded_year integer;
