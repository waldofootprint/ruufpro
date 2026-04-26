-- Migration 087: Property Pipeline universe one-time data load
--
-- This file is the migration RECORD. The actual bulk load runs via:
--   node scripts/load-pp-universe.mjs
--
-- Why a Node loader instead of pure SQL:
--   1. Supabase SQL Editor cannot COPY FROM a local file (would need a
--      managed staging area or REST API upload).
--   2. We need to compute SHA256(address_normalized) per row. Doable in
--      Postgres via pgcrypto, but that adds an extension dependency.
--   3. Streaming the 17MB CSV row-by-row keeps memory bounded.
--
-- Source CSV: .tmp/property-pipeline/mvp_candidate_universe_FINAL.csv
-- Source provenance: .tmp/property-pipeline/README.md
-- Expected row count: 28,920 (Manatee SFH + homestead=Y + year_built ≤ 2010
--                              ANTI-JOIN against Accela roof permits 2018+)
--
-- Idempotent: ON CONFLICT (parcel_id) DO NOTHING.
-- Re-run safe: deleting all PP rows and re-running gives the same universe.

-- ============================================================================
-- Pre-load assertions (run interactively if you want to validate before load)
-- ============================================================================

-- Verify schema is in place:
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_name = 'property_pipeline_candidates';
--   -- should return 1

-- Verify table is empty (or contains only previously-loaded rows):
--   SELECT count(*) FROM property_pipeline_candidates WHERE county = 'manatee';

-- ============================================================================
-- Run the loader
-- ============================================================================
--
--   # Dry run first (no DB writes — confirms parsing + normalization works):
--   node scripts/load-pp-universe.mjs --dry-run
--
--   # Real load:
--   node scripts/load-pp-universe.mjs
--
-- Expected output:
--   Parsed:   28,920
--   Inserted: 28,920  (or fewer if re-running)
--   Skipped:  0
--   Errors:   0

-- ============================================================================
-- Post-load validation queries
-- ============================================================================

-- Total candidates loaded:
--   SELECT count(*) FROM property_pipeline_candidates WHERE county = 'manatee';
--
-- Universe by ZIP (sanity-check the top 5):
--   SELECT zip, count(*) FROM property_pipeline_candidates
--    WHERE county = 'manatee' AND status = 'active'
--    GROUP BY zip ORDER BY count(*) DESC LIMIT 5;
--   -- expected: 34209 ≈ 3792, 34205 ≈ 3659, 34221 ≈ 3408, 34208 ≈ 3077, 34203 ≈ 2512
--
-- Year-built distribution:
--   SELECT (year_built / 10) * 10 AS decade, count(*)
--     FROM property_pipeline_candidates GROUP BY decade ORDER BY decade;
--
-- Address-hash uniqueness (should equal row count if every row is unique):
--   SELECT count(DISTINCT address_hash), count(*) FROM property_pipeline_candidates;
--
-- Index health (after load completes, ANALYZE updates planner stats):
--   ANALYZE property_pipeline_candidates;

-- ============================================================================
-- Rollback (if you need to start over)
-- ============================================================================
-- DELETE FROM property_pipeline_candidates WHERE county = 'manatee';
-- -- then re-run loader

-- This file intentionally contains no DDL/DML — it is documentation of the
-- one-time data-load operation. The migration runner records that 087 ran;
-- the loader script does the actual work.
SELECT 1 AS migration_087_property_pipeline_universe_load_recorded;
