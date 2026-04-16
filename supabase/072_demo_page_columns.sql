-- Migration 072: Add columns for demo page pivot
-- Stores website scrape data for Riley AI training + competitor detection

-- Website content extraction (for Riley training)
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS website_services jsonb DEFAULT NULL;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS website_faq jsonb DEFAULT NULL;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS website_about text DEFAULT NULL;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS website_service_areas text[] DEFAULT NULL;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS website_testimonials jsonb DEFAULT NULL;

-- Competitor detection
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS competitor_tools text[] DEFAULT NULL;

-- Identity signals
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS is_franchise boolean DEFAULT false;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS is_multi_state boolean DEFAULT false;

-- Data richness score (computed from website content)
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS data_richness_score integer DEFAULT NULL;

-- Scrape timestamp
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS website_scraped_at timestamptz DEFAULT NULL;

-- Demo page URL (replaces preview_site_url for demo flow)
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS demo_page_url text DEFAULT NULL;
