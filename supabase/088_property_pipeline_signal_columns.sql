-- Property Pipeline — add signal columns surfaced in the dashboard table
--
-- Adds two nullable columns to property_pipeline_candidates:
--   last_sale_year         — proxy for owner tenure (long-tenured = better convert)
--   last_roof_permit_date  — most recent roof permit on Accela for the address
--                            (NULL means "no permit on file at all")
--
-- Both backfilled by scripts/load-pp-universe.mjs from existing source CSVs.
-- No RLS change. No constraint change beyond range checks.

ALTER TABLE property_pipeline_candidates
  ADD COLUMN IF NOT EXISTS last_sale_year         integer,
  ADD COLUMN IF NOT EXISTS last_roof_permit_date  date;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ppc_last_sale_year_check') THEN
    ALTER TABLE property_pipeline_candidates ADD CONSTRAINT ppc_last_sale_year_check
      CHECK (last_sale_year IS NULL OR last_sale_year BETWEEN 1900 AND 2100);
  END IF;
END $$;

COMMENT ON COLUMN property_pipeline_candidates.last_sale_year IS
  'Year of most recent qualified sale on the parcel. Proxy for owner tenure (we deliberately do NOT surface owner name — see decisions/property-pipeline-mvp-source-of-truth.md and the Lead-Spy comparison memo).';

COMMENT ON COLUMN property_pipeline_candidates.last_roof_permit_date IS
  'Most recent roof permit on Accela for the address. NULL = no permit on file at all (strongest in-market signal). All values are >7yr old by construction (the universe filters out homes with <=7yr permits).';
