-- Migration 067: Pipeline v3 — AI rewrite + FL license columns
-- New columns for the v3 pipeline: AI-polished copy, FL license verification

-- AI rewrite output
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS ai_about_text text;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS ai_services text[];
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS ai_hero_headline text;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS ai_email_subject text;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS ai_email_body text;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS ai_rewritten_at timestamptz;

-- FL license verification
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS fl_license_type text;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS fl_license_number text;
ALTER TABLE prospect_pipeline ADD COLUMN IF NOT EXISTS fl_license_verified_at timestamptz;
