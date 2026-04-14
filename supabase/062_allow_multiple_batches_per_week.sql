-- Migration 062: Allow multiple batches per week
-- Drops the unique constraint so Hannah can scrape multiple city groups in the same week.
ALTER TABLE prospect_batches DROP CONSTRAINT IF EXISTS prospect_batches_week_number_week_year_key;
