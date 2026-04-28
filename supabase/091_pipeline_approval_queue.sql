-- =============================================================================
-- 091 — Approval queue + per-roofer mail prefs
-- =============================================================================
-- Adds the two preference toggles that drive the new dashboard UX
-- (auto-approve on/off + daily send cap), plus a `requested_at` priority
-- column so a roofer can push a specific address to the front of the queue.
-- =============================================================================

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS pipeline_auto_approve boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pipeline_daily_cap    integer NOT NULL DEFAULT 5;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contractors_daily_cap_range_check') THEN
    ALTER TABLE contractors ADD CONSTRAINT contractors_daily_cap_range_check
      CHECK (pipeline_daily_cap BETWEEN 1 AND 50);
  END IF;
END $$;

ALTER TABLE property_pipeline_candidates
  ADD COLUMN IF NOT EXISTS requested_at timestamptz NULL;

COMMENT ON COLUMN property_pipeline_candidates.requested_at IS
  'When set, this candidate jumps to the front of the approval queue. Set by roofer via /api/pipeline/request-address.';

CREATE INDEX IF NOT EXISTS ppc_requested_at_idx
  ON property_pipeline_candidates (requested_at DESC NULLS LAST)
  WHERE status = 'active';
