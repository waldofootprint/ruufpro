#!/usr/bin/env bash
# Phase B / Session BK — MS FL Footprints bulk load via psql \copy.
#
# Three transactions (per Hannah's BK spec — resume-from-failed-step granularity):
#   1. DROP INDEX building_footprints_geom_gist         (fast; removes GIST maintenance cost during COPY)
#   2. \copy building_footprints FROM <tsv>             (single bulk load; SET LOCAL statement_timeout = 0)
#   3. CREATE INDEX + ANALYZE                           (tier-fallback maintenance_work_mem 256→128→64)
#
# Gate 2 of two (load-stage reconciliation):
#   tsv_rows (excl header) == SELECT COUNT(*) FROM building_footprints
# Non-zero exit on mismatch.
#
# Post-load hygiene (all fail-loud):
#   - GIST index present post-rebuild (pg_indexes assertion)
#   - ANALYZE completed (implicit on COMMIT of txn 3)
#   - SUCCESS banner prints: row count, GIST confirmed, mwm tier applied, per-phase wall-clock
#
# Usage:
#   scripts/phase_b/ms_load_copy.sh <tsv-path> <conn-string>
#
# Example:
#   scripts/phase_b/ms_load_copy.sh \
#     .cache/ms_footprints/florida.tsv \
#     'postgresql://postgres.<ref>:<pw>@aws-1-us-east-1.pooler.supabase.com:5432/postgres'

set -euo pipefail

PSQL=/opt/homebrew/opt/libpq/bin/psql
TSV="${1:?usage: ms_load_copy.sh <tsv-path> <conn-string>}"
CONN="${2:?usage: ms_load_copy.sh <tsv-path> <conn-string>}"

if [[ ! -x "$PSQL" ]]; then
  echo "FAILURE: psql not found at $PSQL" >&2
  exit 2
fi
if [[ ! -f "$TSV" ]]; then
  echo "FAILURE: TSV not found at $TSV" >&2
  exit 2
fi

echo "=== ms_load_copy.sh ==="
echo "  psql: $PSQL"
echo "  tsv:  $TSV ($(du -h "$TSV" | cut -f1))"
echo

TSV_ROWS=$(awk 'END{print NR-1}' "$TSV")
echo "  tsv rows (excl header): $TSV_ROWS"
echo

# === Phase 1: DROP GIST (txn 1) ===
echo "=== phase 1: DROP INDEX building_footprints_geom_gist (txn 1) ==="
T1_START=$(date +%s)
"$PSQL" "$CONN" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
DROP INDEX IF EXISTS building_footprints_geom_gist;
COMMIT;
SQL
T1_END=$(date +%s)
T1=$((T1_END - T1_START))
echo "  phase 1 wall-clock: ${T1}s"
echo

# === Phase 2: COPY (txn 2) ===
echo "=== phase 2: \\copy building_footprints FROM '$TSV' (txn 2) ==="
T2_START=$(date +%s)
# psql heredoc + \copy: the \copy meta-command streams the file client-side to the server
# as a COPY FROM STDIN; SET LOCAL statement_timeout=0 disables pooler default timeout.
# Escape: double-backslash \\copy → \copy in shell-expanded heredoc; \\t → \t for DELIMITER.
"$PSQL" "$CONN" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SET LOCAL statement_timeout = 0;
\\copy building_footprints (geom, state_code, source, vintage_year) FROM '$TSV' WITH (FORMAT csv, DELIMITER E'\\t', HEADER true)
COMMIT;
SQL
T2_END=$(date +%s)
T2=$((T2_END - T2_START))
echo "  phase 2 wall-clock: ${T2}s"
echo

# === Phase 3: CREATE INDEX + ANALYZE (txn 3) — mwm tier fallback 256→128→64 ===
echo "=== phase 3: CREATE INDEX + ANALYZE (txn 3) ==="
T3_START=$(date +%s)
MWM_APPLIED=""
for TIER in "256MB" "128MB" "64MB"; do
  echo "  attempting maintenance_work_mem = $TIER"
  if "$PSQL" "$CONN" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SET LOCAL statement_timeout = 0;
SET LOCAL maintenance_work_mem = '$TIER';
CREATE INDEX building_footprints_geom_gist ON building_footprints USING gist (geom);
ANALYZE building_footprints;
COMMIT;
SQL
  then
    MWM_APPLIED="$TIER"
    echo "  ✓ tier $TIER accepted"
    break
  else
    echo "  ✗ tier $TIER rejected (or txn errored); trying next"
  fi
done
T3_END=$(date +%s)
T3=$((T3_END - T3_START))

if [[ -z "$MWM_APPLIED" ]]; then
  echo "FAILURE: all maintenance_work_mem tiers rejected (256/128/64MB)" >&2
  exit 3
fi
echo "  phase 3 wall-clock: ${T3}s  (mwm tier applied: $MWM_APPLIED)"
echo

# === Verification + Gate 2 (load reconciliation) ===
echo "=== post-load verification ==="
DB_COUNT=$("$PSQL" "$CONN" -Atc "SELECT COUNT(*) FROM building_footprints;")
echo "  rows in building_footprints: $DB_COUNT"

GIST_ROW=$("$PSQL" "$CONN" -Atc "SELECT indexname FROM pg_indexes WHERE tablename='building_footprints' AND indexname='building_footprints_geom_gist';")
if [[ "$GIST_ROW" != "building_footprints_geom_gist" ]]; then
  echo "FAILURE: GIST index missing post-rebuild. pg_indexes returned: '$GIST_ROW'" >&2
  exit 4
fi
echo "  GIST index post-rebuild: $GIST_ROW ✓"

LAST_ANALYZE=$("$PSQL" "$CONN" -Atc "SELECT COALESCE(last_analyze::text, 'NEVER') FROM pg_stat_user_tables WHERE relname='building_footprints';")
echo "  last_analyze: $LAST_ANALYZE"

# Gate 2: load reconciliation
if [[ "$DB_COUNT" -ne "$TSV_ROWS" ]]; then
  echo "FAILURE: load gate mismatch. tsv_rows=$TSV_ROWS db_count=$DB_COUNT (gap=$((TSV_ROWS - DB_COUNT)))" >&2
  exit 5
fi
echo "  load gate: tsv_rows=$TSV_ROWS == db_count=$DB_COUNT ✓"
echo

# === SUCCESS banner ===
echo "=== SUCCESS ==="
echo "  rows loaded:                       $DB_COUNT"
echo "  prep gate:                         passed (in ms_prep.py)"
echo "  load gate:                         passed ($DB_COUNT == $TSV_ROWS)"
echo "  GIST index post-rebuild:           $GIST_ROW present"
echo "  ANALYZE completed:                 yes ($LAST_ANALYZE)"
echo "  maintenance_work_mem tier applied: $MWM_APPLIED"
echo "  phase 1 wall-clock (DROP):         ${T1}s"
echo "  phase 2 wall-clock (COPY):         ${T2}s"
echo "  phase 3 wall-clock (IDX+ANALYZE):  ${T3}s"
echo "  total wall-clock:                  $((T1 + T2 + T3))s"
