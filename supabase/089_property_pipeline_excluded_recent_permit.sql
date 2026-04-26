-- 089_property_pipeline_excluded_recent_permit.sql
--
-- Add 'excluded_recent_permit' to property_pipeline_candidates.status enum and
-- backfill candidates that have a roof permit within the last 7 years (FL storm
-- cycle) into that status. Replaces the defensive UI-side filter previously in
-- lib/property-pipeline/queries.ts (see step-3 handoff Tier-2 punch list).
--
-- Background: ~52 rows landed in the universe with a recent permit because the
-- upstream universe-build CSV was scraped before the latest Accela permits
-- existed (or used a coarser address-match scheme than backfill-pp-signals.mjs).
-- These are real permit-candidate matches, not normalizer artifacts. Flipping
-- their status excludes them from the dashboard via the existing status='active'
-- filter and keeps them queryable for audit.
--
-- Idempotent: safe to re-run.

BEGIN;

-- 1) Widen the status check constraint
ALTER TABLE property_pipeline_candidates
  DROP CONSTRAINT IF EXISTS ppc_status_check;

ALTER TABLE property_pipeline_candidates
  ADD CONSTRAINT ppc_status_check
  CHECK (status = ANY (ARRAY[
    'active',
    'engaged',
    'suppressed',
    'cooled',
    'excluded_recent_permit'
  ]));

-- 2) Flip rows with a permit within 7 years to the new status
UPDATE property_pipeline_candidates
   SET status = 'excluded_recent_permit'
 WHERE status = 'active'
   AND last_roof_permit_date IS NOT NULL
   AND last_roof_permit_date >= (CURRENT_DATE - INTERVAL '7 years');

COMMIT;
