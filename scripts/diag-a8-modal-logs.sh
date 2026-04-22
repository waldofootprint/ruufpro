#!/usr/bin/env bash
# Track A.8-diag — Modal log puller for Probe 3 (Modal log phase breakdown).
# Scoping doc: decisions/track-a8-diag-scoping.md §3.4 Probe 3.
#
# Usage:
#   ./scripts/diag-a8-modal-logs.sh [minutes]    # default 60
#
# Emits raw Modal logs for the lidar-measure app over the recent window to
# .tmp/a8-diag/modal-logs-<iso>.txt. Greps for phase markers + stack traces.
#
# Modal's `modal app logs` streams real-time; we tee into a capture file.
set -euo pipefail

MIN=${1:-60}
STAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
OUT_DIR=".tmp/a8-diag"
mkdir -p "$OUT_DIR"
RAW="$OUT_DIR/modal-logs-$STAMP.txt"
ANALYSIS="$OUT_DIR/modal-logs-$STAMP-analysis.txt"

echo "[diag-a8-modal-logs] app=lidar-measure  window=${MIN}m  out=$RAW"
echo ""

# `modal app logs` streams and does not auto-exit. We run it with a timeout
# and capture everything to RAW. Modal stores logs on the container side so
# re-running will keep producing fresh output as new calls fire.
#
# Timeout controls how long we listen before returning. We capture what's
# available then immediately run grep-analysis.
timeout "${MIN}m" modal app logs lidar-measure 2>&1 | tee "$RAW" || true

echo ""
echo "[diag-a8-modal-logs] analysis -> $ANALYSIS"

{
  echo "===== container starts ====="
  grep -nE "container.*start|Container start|start.*cold|runner.*start" "$RAW" || echo "(no matches)"
  echo ""
  echo "===== fetch phase markers ====="
  grep -nE "ept_fetch|tnm|fetch_dispatch|fetch_path|laz_download" "$RAW" || echo "(no matches)"
  echo ""
  echo "===== tier3 markers ====="
  grep -nE "tier3|RANSAC|inlierRatio|residual|segments|roof_horiz|fetch_footprint|structure footprint" "$RAW" || echo "(no matches)"
  echo ""
  echo "===== python exceptions / tracebacks ====="
  grep -nE "Traceback|SystemExit|raise |exception|OOM|Killed|exit code" "$RAW" || echo "(no matches)"
  echo ""
  echo "===== subprocess timeouts ====="
  grep -nE "TimeoutExpired|subprocess.*timeout|tier3 fail" "$RAW" || echo "(no matches)"
  echo ""
  echo "===== HTTP 500/502/504 ====="
  grep -nE "50[0234]|Internal Server Error|Bad Gateway|Gateway Time" "$RAW" || echo "(no matches)"
} > "$ANALYSIS"

echo ""
echo "=========================================================="
echo "Raw:      $RAW"
echo "Analysis: $ANALYSIS"
echo "Line count: $(wc -l < "$RAW")"
