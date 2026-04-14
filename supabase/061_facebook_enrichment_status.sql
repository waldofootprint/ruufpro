-- Migration 061: Add facebook_enrichment_status to prospect_pipeline
-- Tracks whether Facebook enrichment succeeded, found no match, or errored.
-- Used in triage panel as a data richness signal.

ALTER TABLE prospect_pipeline
  ADD COLUMN IF NOT EXISTS facebook_enrichment_status text
    CHECK (facebook_enrichment_status IN ('success', 'no_match', 'error'));
