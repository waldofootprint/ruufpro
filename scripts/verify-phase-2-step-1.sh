#!/usr/bin/env bash
# Phase 2 step 1 acceptance test (2026-05-01).
# Runs the 11-address suite and inspects each response for the new fields.
#
# Prerequisites (manual, do BEFORE running this):
#   1. Migration 098 applied to GEOSPATIAL Supabase project
#      (vfmnjwpjxamtbuehmtrv) via dashboard SQL editor.
#   2. MAPBOX_TOKEN added to Vercel (Production env at minimum).
#   3. Branch feat/phase-2-step-1-polygon-overlay deployed (or merged
#      to main) so https://ruufpro.com/api/estimate serves the new code.
#
# Usage:
#   ./scripts/verify-phase-2-step-1.sh
#   ./scripts/verify-phase-2-step-1.sh https://ruufpro-pr-123.vercel.app  # preview deploy

set -euo pipefail

BASE_URL="${1:-https://ruufpro.com}"
CONTRACTOR_ID="c2a1286d-4faa-444a-b5b7-99f592359f80"

echo "=== Phase 2 step 1 verification ==="
echo "Base URL:     $BASE_URL"
echo "Contractor:   $CONTRACTOR_ID"
echo ""

addresses=(
  "8734 54th Ave E, Bradenton, FL 34211"
  "6510 Lake Forest Glen, Lakewood Ranch, FL 34202"
  "4108 W San Miguel St, Tampa, FL 33629"
  "2500 N Orange Ave, Orlando, FL 32804"
  "1450 Brickell Bay Dr, Miami, FL 33131"
  "1500 W Kennedy Blvd, Tampa, FL 33606"
  "4321 Higel Ave, Sarasota, FL 34242"
  "3567 St Johns Ave, Jacksonville, FL 32205"
  "7234 University Pkwy, Sarasota, FL 34243"
  "11506 Old Mission Dr, Lakewood Ranch, FL 34211"
  "1620 SW 12th St, Miami, FL 33135"
)

pass=0
fail=0
overlay_yes=0
polygon_yes=0
low_confidence=0

for addr in "${addresses[@]}"; do
  echo "--- $addr ---"
  resp=$(curl -s -X POST "$BASE_URL/api/estimate" \
    -H "Content-Type: application/json" \
    -d "{\"contractor_id\":\"$CONTRACTOR_ID\",\"address\":\"$addr\",\"pitch_category\":\"moderate\",\"current_material\":\"asphalt\",\"shingle_layers\":\"not_sure\"}")

  status_ok=$(echo "$resp" | jq -r 'if .estimates then "OK" elif .error_code then "ERR:\(.error_code)" else "UNKNOWN" end')
  confidence=$(echo "$resp" | jq -r '.confidence // "none"')
  has_overlay=$(echo "$resp" | jq -r 'if .roof_overlay then "yes" else "no" end')
  has_polygon=$(echo "$resp" | jq -r 'if .roof_overlay.has_polygon == true then "yes" else "no" end')
  url_set=$(echo "$resp" | jq -r 'if (.roof_overlay.url // "") != "" then "yes" else "no" end')

  echo "  status: $status_ok"
  echo "  confidence: $confidence"
  echo "  roof_overlay present: $has_overlay  url-set: $url_set  has_polygon: $has_polygon"

  if [[ "$status_ok" == "OK" ]]; then ((pass++)); fi
  if [[ "$status_ok" == "ERR:"* ]]; then ((fail++)); fi
  if [[ "$has_overlay" == "yes" ]]; then ((overlay_yes++)); fi
  if [[ "$has_polygon" == "yes" ]]; then ((polygon_yes++)); fi
  if [[ "$confidence" == "low" ]]; then ((low_confidence++)); fi
done

echo ""
echo "=== Summary ==="
echo "Successful estimates:    $pass / 11   (target: >=9)"
echo "Errored (with code):     $fail / 11   (target: 2 — Brickell Bay + University Pkwy)"
echo "Responses with overlay:  $overlay_yes / 11"
echo "Responses with polygon:  $polygon_yes / 11"
echo "Low-confidence flags:    $low_confidence / 11"
echo ""
echo "Manual checks remaining:"
echo "  [ ] Open 2-3 roof_overlay.url values in a browser. Polygon should be navy outline on aerial."
echo "  [ ] Walk the widget UI (https://ruufpro.com/widget/$CONTRACTOR_ID) for at least one"
echo "      success + one commercial-error case. Confirm:"
echo "        - Polygon overlay visible at top of step 8 on success"
echo "        - 'Approximate measurement' pill shows when confidence === 'low'"
echo "        - Commercial address shows 'This looks like a commercial property' headline"
echo "        - Manual-quote screen revived for measurement_unavailable case"
echo "  [ ] view-source: confirm MAPBOX_TOKEN is NOT in the page HTML (only in img src URLs)."
