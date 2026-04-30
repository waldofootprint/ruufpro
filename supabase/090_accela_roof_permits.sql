-- 090_accela_roof_permits.sql
--
-- Full Manatee County Accela "Residential Roof Express" permit dataset, keyed by
-- normalized address. Powers roof-age lookup for the postcard landing demo and
-- (eventually) any address-driven roof-age display.
--
-- Source: tools-scraped Accela CSV (.tmp/property-pipeline/accela_residential_roof_express.csv).
-- Loader: scripts/load-accela-permits.mjs
--
-- Distinction from property_pipeline_candidates.last_roof_permit_date:
--   - PP table only has the 28,920 in-market candidate homes (no recent permit).
--   - This table has every roof permit issued (~51k rows) so we can answer
--     "did this exact address get a reroof?" for ANY home — including ones the
--     PP universe filtered out.

CREATE TABLE IF NOT EXISTS accela_roof_permits (
  id                  bigserial PRIMARY KEY,
  county              text NOT NULL DEFAULT 'manatee',
  record_number       text NOT NULL,
  record_type         text,
  permit_date         date NOT NULL,
  status              text,
  address_raw         text NOT NULL,
  address_normalized  text NOT NULL,
  zip                 text,
  description         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accela_roof_permits_addr_idx
  ON accela_roof_permits (address_normalized, permit_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS accela_roof_permits_record_uniq
  ON accela_roof_permits (county, record_number);

ALTER TABLE accela_roof_permits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'accela_roof_permits' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON accela_roof_permits
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE accela_roof_permits IS
  'Full Manatee County Accela roof-permit dataset. Lookup by address_normalized for roof-age computation.';
