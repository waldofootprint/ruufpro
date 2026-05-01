-- Migration 096: storm_events table
--
-- First storm-signal layer for Property Pipeline statewide expansion (Phase 1).
-- Source: Iowa Environmental Mesonet (IEM) Local Storm Reports — fresh, free,
-- 5-min refresh, statewide FL coverage from day one.
--
-- Plan ref: research/handoff-2026-05-01-property-pipeline-statewide-expansion.md
--
-- Why MAIN DB (not geospatial): table is small (~50K rows for 5yr FL backfill,
-- ~5K/yr ongoing). Cross-project ETL not worth it at this size. Geospatial DB
-- reserved for the eventual 10M-row NAL parcel base layer (Phase 2/3).
--
-- Idempotent. Reversible (rollback at bottom).
-- Read-only for authenticated users (any roofer can see storm events in their ZIPs).

CREATE TABLE IF NOT EXISTS storm_events (
  -- IEM event_id is unique per (wfo, valid, typecode, lat, lon). Use it as PK
  -- to make daily upserts idempotent — re-pulling the same day = no dupes.
  event_id      text PRIMARY KEY,

  valid_at      timestamptz NOT NULL,
  typecode      text NOT NULL,         -- HAIL, TSTM WND DMG, TORNADO, etc.
  magnitude     numeric NULL,          -- hail size in inches, wind in mph (typecode-dependent)
  lat           double precision NOT NULL,
  lng           double precision NOT NULL,

  -- Geocoded server-side at ingest from lat/lng. NULL until backfilled.
  zip           text NULL,
  county        text NULL,             -- e.g. "Manatee"
  state         text NOT NULL DEFAULT 'FL',

  ugc           text NULL,             -- IEM zone code (e.g. FLZ149)
  city          text NULL,             -- IEM-provided nearest city
  remark        text NULL,             -- free-text damage description from spotter

  source        text NOT NULL DEFAULT 'iem_lsr',
  ingested_at   timestamptz NOT NULL DEFAULT now()
);

-- Hot path: "give me storm events in these ZIPs in the last 90 days"
CREATE INDEX IF NOT EXISTS storm_events_zip_valid_at_idx
  ON storm_events (zip, valid_at DESC) WHERE zip IS NOT NULL;

-- For ZIP backfill jobs and county-level reporting
CREATE INDEX IF NOT EXISTS storm_events_county_valid_at_idx
  ON storm_events (county, valid_at DESC) WHERE county IS NOT NULL;

-- For freshness queries / cron sanity checks
CREATE INDEX IF NOT EXISTS storm_events_valid_at_idx
  ON storm_events (valid_at DESC);

COMMENT ON TABLE storm_events IS
  'IEM Local Storm Reports — fresh storm signal layer for Property Pipeline. Refreshed daily by tools/ingest-iem-lsr.mjs. 5-yr backfill on first run.';

COMMENT ON COLUMN storm_events.event_id IS
  'Unique event id from IEM. Used as PK so daily re-pulls are idempotent (ON CONFLICT DO NOTHING).';

COMMENT ON COLUMN storm_events.zip IS
  'Geocoded from lat/lng at ingest time. NULL until reverse-geocode backfill runs. Indexed (partial) for hot dashboard query.';

COMMENT ON COLUMN storm_events.magnitude IS
  'Typecode-dependent: hail = inches, wind = mph, tornado = EF rating. NULL if IEM did not report.';

ALTER TABLE storm_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read storm events" ON storm_events;
CREATE POLICY "Authenticated read storm events"
  ON storm_events FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- ROLLBACK (commented; uncomment + run if needed)
-- =============================================================================
-- /*
-- DROP POLICY IF EXISTS "Authenticated read storm events" ON storm_events;
-- DROP INDEX IF EXISTS storm_events_valid_at_idx;
-- DROP INDEX IF EXISTS storm_events_county_valid_at_idx;
-- DROP INDEX IF EXISTS storm_events_zip_valid_at_idx;
-- DROP TABLE IF EXISTS storm_events;
-- */
