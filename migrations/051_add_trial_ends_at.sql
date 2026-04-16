-- Migration 051: Add trial_ends_at for outreach Pro trials (Flow B)
-- Run in Supabase SQL Editor

ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- Index for the expiry cron (finds all active trials efficiently)
CREATE INDEX IF NOT EXISTS idx_contractors_trial_ends_at
ON contractors (trial_ends_at)
WHERE trial_ends_at IS NOT NULL;

COMMENT ON COLUMN contractors.trial_ends_at IS 'Outreach trial expiry. Pro features active until this date. NULL = no trial.';
