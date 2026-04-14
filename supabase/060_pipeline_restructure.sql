-- Migration 060: Pipeline restructure for v2 flow
-- Adds new stages (google_enriched, awaiting_triage, parked, contact_lookup, contact_ready)
-- Adds triage + Facebook + LinkedIn columns
-- SAFE: existing data untouched, old stages still valid

-- Step 1: Drop the inline CHECK constraint on stage
-- The constraint is unnamed, so we need to find and drop it by table
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'prospect_pipeline'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%stage%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE prospect_pipeline DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Step 2: Re-add with all stages (old + new)
ALTER TABLE prospect_pipeline ADD CONSTRAINT prospect_pipeline_stage_check
  CHECK (stage IN (
    -- v2 flow: acquisition & enrichment
    'scraped',
    'google_enriched',
    'awaiting_triage',
    'parked',
    -- Legacy (kept for existing batches)
    'enriched',
    -- Site building & review
    'site_built',
    'site_approved',
    -- Contact lookup (Apollo runs here now)
    'contact_lookup',
    'contact_ready',
    'outreach_approved',
    -- Sending & monitoring
    'sent',
    'awaiting_reply',
    'replied',
    'draft_ready',
    'responded',
    -- Terminal states
    'interested',
    'not_now',
    'objection',
    'unsubscribed',
    'free_signup',
    'paid'
  ));

-- Step 3: Add new columns for triage flow
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS triage_decision text
    CHECK (triage_decision IN ('selected', 'parked', 'skipped')),
  ADD COLUMN IF NOT EXISTS triage_decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS parked_until date,
  ADD COLUMN IF NOT EXISTS parked_reason text;

-- Step 4: Add new timestamp columns
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS google_enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_lookup_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_ready_at timestamptz;

-- Step 5: Add Facebook + LinkedIn columns
ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS facebook_page_url text,
  ADD COLUMN IF NOT EXISTS facebook_about text,
  ADD COLUMN IF NOT EXISTS facebook_photos jsonb,
  ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Step 6: Index parked leads for revival queries
CREATE INDEX IF NOT EXISTS idx_pipeline_parked_until
  ON prospect_pipeline(parked_until)
  WHERE stage = 'parked';

-- Step 7: Index awaiting_triage for dashboard queries
CREATE INDEX IF NOT EXISTS idx_pipeline_awaiting_triage
  ON prospect_pipeline(batch_id)
  WHERE stage = 'awaiting_triage';

-- Step 8: Add triage_review to pipeline_gates gate_type check (if constrained)
-- pipeline_gates.gate_type is text with no CHECK, so no constraint to update.
