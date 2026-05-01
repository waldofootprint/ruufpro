# Phase 1 — Shippable Calculator

**Date:** 2026-05-01
**Owner:** Hannah
**Status:** Approved by Hannah across 7 step-by-step decisions on 2026-05-01. Ready for execution in a fresh session.

## Goal

Raise FL residential coverage on `/api/estimate` from ~55% (5 of 11 test addresses fail today) to ≥90%. Math engine (`calculateEstimate`) untouched except for the buffer/band collapse. Pre-revenue, no clients — no backwards-compat constraints.

## Acceptance criteria

After deploy, re-run the 11-address test (addresses below). Pass criteria:
- ≥9/11 return 200 OK with an `estimates` array
- The 2 expected refusals (Brickell Bay high-rise, University Pkwy commercial corridor) return `error_code: "commercial_or_high_rise"`
- Every API response includes a `confidence: "high" | "low"` field
- Every API call writes a row to `leads` (status varies by outcome — full estimate, address-only follow-up, etc.)

## Pre-execution checks (DO FIRST, before writing any code)

1. **Schema inspection.** Connect to the geospatial Supabase project (env vars `SUPABASE_GEOSPATIAL_URL`, `SUPABASE_GEOSPATIAL_ANON_KEY`). Inspect the `building_footprints` table:
   - Column names (especially the geometry column name and the primary key)
   - Geometry column type (Geometry vs Geography, SRID — likely 4326)
   - Existing indexes on the geometry column (need GIST for `ST_Contains` performance)
   - Pull one sample row to understand the provenance fields

2. **Leads table nullability.** Check `leads.name` and `leads.email` — if NOT NULL, write migration:
   ```sql
   ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;
   ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;
   ```

3. **Vercel env confirmation.** Verify these env vars exist in production:
   - `SUPABASE_GEOSPATIAL_URL`
   - `SUPABASE_GEOSPATIAL_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_API_KEY`

## Approved decisions (locked in)

| Step | Decision | Hannah's call |
|------|----------|---------------|
| 1 | Delete stale imagery check entirely | Approved as-is |
| 2 | Collapse `bufferPercent` + `bandPercent` into ONE roofer-set range. Symmetric ±. Keep DB column name `buffer_percent` for now, rename later. | Option A: collapse into one |
| 3 | Soften LOW imagery quality and ≥12 segments to `confidence: "low"` flags, do NOT auto-widen the range | Option A: flag only, no auto-widen |
| 4 | Fix `segment_heuristic` threshold from 1.75× to 2.5×, do NOT delete the block | Modified: fix threshold |
| 5 | Three error codes: `address_unrecognized`, `commercial_or_high_rise`, `measurement_unavailable` | Approved |
| 6 | Drop contact-info gate on lead writes; always insert | Approved |
| 7 | Add Footprints-direct fallback in route when Solar returns null | Approved |

## File changes

### `app/api/estimate/route.ts`

Multiple coordinated edits.

**A. Track confidence separately from trip.** Introduce a `confidence: "high" | "low"` variable near where `trip` is declared. Default `"high"`. Set to `"low"` when LOW imagery quality OR ≥12 segments. Pass `confidence` through to the response.

**B. Delete stale imagery check (Step 1).** Lines 500-505 — remove the `else if (roofData.imageryProcessedDate)` block that sets `trip = stale_imagery:...`.

**C. Soften LOW imagery to confidence flag (Step 3).** Lines 498-499 — instead of `trip = low_imagery_quality`, set `confidence = "low"`. Do not refuse.

**D. Soften ≥12 segments to confidence flag (Step 3).** Line 486 — remove `else if (segs >= 12) trip = ...`. Add separate check: `if (segs >= 12) confidence = "low";` (do not refuse).

**E. Fix segment_heuristic threshold (Step 4).** Line 489 — change `sqft > living * 1.75` to `sqft > living * 2.5`. Keep rest of block intact.

**F. Differentiated error codes in geocode-invalid path (Step 5).** Lines 323-340 — read `roofResult.invalid` string and map to specific code:
- Starts with `non_residential_place:` AND contains any of `park|natural_feature|airport|cemetery|church|school|university|hospital|shopping_mall|stadium` → `error_code: "commercial_or_high_rise"`
- Starts with `non_residential_place:intersection` OR `no_street_number:` → `error_code: "address_unrecognized"`
- Default → `error_code: "address_unrecognized"`

**G. Differentiated error code for over_10k_sqft (Step 5).** Line 485 trip — when triggered with no fallback available, return `error_code: "commercial_or_high_rise"` not `couldnt_measure_accurately`.

**H. Footprints fallback when Solar returns null (Step 7).** After line 234 (`roofData = roofResult.data`), add: if `roofData == null && lat != null && lng != null && !roofResult.invalid`, call new `getBuildingFootprintArea(lat, lng)`. If it returns area, synthesize a `RoofData` shape:
```ts
const PITCH_MULT = { flat: 1.02, low: 1.10, moderate: 1.20, steep: 1.35 };
const pitchFactor = PITCH_MULT[pitch_category] || 1.20;
const synthSqft = Math.round(footprintAreaSqft * pitchFactor);
roofData = {
  roofAreaSqft: synthSqft,
  pitchDegrees: PITCH_CATEGORY_DEGREES[pitch_category] || 22,
  numSegments: 2,
  segments: [],
  source: "ms_footprints" as const,  // extend RoofData source type
};
confidence = "low";
```
Use waste factor middle value (1.18) when `source === "ms_footprints"` to avoid systematic under-pricing of complex roofs. This may require a small change in `lib/estimate.ts:213-218` `getWasteFactor` to accept a flag.

**I. Updated final error response (Step 5 + Step 7).** Lines 575-583 — when guardrail trips with no fallback path available, return `error_code: "measurement_unavailable"` not `couldnt_measure_accurately`. Same for `under_600_sqft`. Same when Footprints fallback also returns null.

**J. Add confidence to response (Step 3).** In the JSON response object near line 597-637, add `confidence: confidence` alongside `roof_data` and `pipeline`.

**K. Drop contact-info gate on lead writes (Step 6).** Line 98 — delete `if (!fields.name || !fields.email) return;`. Update insert to allow `name: fields.name || null, email: fields.email || null`. When name+email missing, set `status: 'address_only_followup'`. Call `writeManualQuoteLead` (or equivalent) for every error path so a lead row is written for every estimate request.

### `lib/estimate.ts`

**L. Collapse buffer + band (Step 2).**
- Lines 244-245 — delete `DEFAULT_BAND_PERCENT` and `CONTRACTOR_BAND_PERCENT` constants
- Line 316 — delete the `bandPercent` derivation that uses `isContractorConfigured`. Keep the `isContractorConfigured` heuristic for the bundled/itemized branch at lines 323-324 (Tier 2 work to replace later).
- Lines 402-403 — change to:
  ```ts
  const range = input.bufferPercent ?? 10;
  const priceLow = Math.round(midEstimate * (1 - range / 100));
  const priceHigh = Math.round(midEstimate * (1 + range / 100));
  ```
- Line 417 — change breakdown to actually echo input.bufferPercent (currently echoes bandPercent which is now gone): `bufferPercent: range`

### `app/dashboard/settings/tabs/EstimatesTab.tsx`

**M. Rename "Estimate Buffer" → "Estimate Range" (Step 2).**
- Line 420 — change `title="Estimate Buffer"` to `title="Estimate Range"`
- Line 421 — change description: `"How tight your homeowner-facing range is. ±10% is industry standard."`
- Line 424 — change pill labels from `"+10%"` to `"±10%"`, `"+15%"` to `"±15%"`, etc.
- Lines 428-430 — update example: `"With ±10%, a $20,000 base estimate displays as $18,000–$22,000."`

### `lib/footprints-api.ts` (new file, ~80 lines)

**N. New module exports `getBuildingFootprintArea(lat: number, lng: number)`.**

Returns `Promise<{ areaSqft: number; source: string; buildingId?: number } | null>`.

Implementation:
- Create Supabase client with `SUPABASE_GEOSPATIAL_URL` + `SUPABASE_GEOSPATIAL_ANON_KEY`
- Call a Postgres RPC function (define in geospatial DB):
  ```sql
  CREATE OR REPLACE FUNCTION public.find_building_footprint(p_lat double precision, p_lng double precision)
  RETURNS TABLE(area_sqm double precision, building_id bigint)
  LANGUAGE sql STABLE AS $$
    SELECT
      ST_Area(geometry::geography) AS area_sqm,
      id AS building_id
    FROM building_footprints
    WHERE ST_Contains(geometry, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
    ORDER BY ST_Area(geometry::geography) DESC
    LIMIT 1;
  $$;
  ```
  (Adjust column names per actual schema — verify in pre-execution check #1.)
- If `ST_Contains` returns no row, fall back to `ST_DWithin` nearest-neighbor within 50m for edge cases (lat/lng falls between buildings):
  ```sql
  -- second function or extended function
  SELECT ST_Area(geometry::geography), id
  FROM building_footprints
  WHERE ST_DWithin(geometry::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, 50)
  ORDER BY ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
  LIMIT 1;
  ```
- Convert sqm → sqft (× 10.764)
- Cache results to avoid repeated lookups (extend `roof_data_cache` table with a `footprint_area_sqft` column, or add a new `footprints_cache` table)

## Verification

After deploy, run the 11-address test:

```bash
for addr in \
  "8734 54th Ave E, Bradenton, FL 34211" \
  "6510 Lake Forest Glen, Lakewood Ranch, FL 34202" \
  "4108 W San Miguel St, Tampa, FL 33629" \
  "2500 N Orange Ave, Orlando, FL 32804" \
  "1450 Brickell Bay Dr, Miami, FL 33131" \
  "1500 W Kennedy Blvd, Tampa, FL 33606" \
  "4321 Higel Ave, Sarasota, FL 34242" \
  "3567 St Johns Ave, Jacksonville, FL 32205" \
  "7234 University Pkwy, Sarasota, FL 34243" \
  "11506 Old Mission Dr, Lakewood Ranch, FL 34211" \
  "1620 SW 12th St, Miami, FL 33135"; do
  echo "=== $addr ==="
  curl -s -X POST https://ruufpro.com/api/estimate \
    -H "Content-Type: application/json" \
    -d "{\"contractor_id\":\"c2a1286d-4faa-444a-b5b7-99f592359f80\",\"address\":\"$addr\",\"pitch_category\":\"moderate\",\"current_material\":\"asphalt\",\"shingle_layers\":\"not_sure\"}" \
    | head -c 200
  echo ""
done
```

**Pass criteria:**
- ≥9/11 return 200 with prices (the `estimates` array present)
- Address #5 (Brickell Bay) and #9 (University Pkwy) return `error_code: "commercial_or_high_rise"`
- Every successful response has `confidence: "high"` or `confidence: "low"`
- Address #1 (Hannah's home) and #10 (LWR Old Mission) — these are the stale-imagery suspects — should now succeed with `confidence` likely `"high"`

**Show diffs to Hannah before pushing.** Do not push to main without explicit approval.

## Pre-execution gotchas (verify before pushing)

1. `leads` table — `name` and `email` column nullability (Step 6)
2. `building_footprints` schema — column names, geometry type, GIST index (Step 7)
3. Vercel env vars set: `SUPABASE_GEOSPATIAL_URL`, `SUPABASE_GEOSPATIAL_ANON_KEY` (Step 7)
4. `RoofData` type in `lib/solar-api.ts:26-40` — `source` field needs `"ms_footprints"` added to the union type
5. `getWasteFactor` in `lib/estimate.ts:213-218` — accept a flag to use middle value (1.18) when source is footprints (Step 7 gotcha 4)

## Phase 2 deferred (do NOT include in this PR)

- Wire `alphaAreaSqft` from Modal LiDAR service. Shape class auto-classifier defaults to hip (1.20×) when alpha-area isn't plumbed, overpricing simple gables ~20%.
- Frontend updates to read new `error_code` values and `confidence` flag, show appropriate per-state copy. (No active website templates per Hannah; whoever consumes the API needs this.)
- `outside_service_area` error code using `service_zips` from `EstimatesTab.tsx:144` — FL-only enforcement.
- Replace `segment_heuristic` with Footprints-based over-capture detection: compare Solar reported area vs Footprints polygon × pitch factor.
- Lead deduplication: don't insert duplicate `address-only` lead within 24h for same `(contractor_id, address)`.
- Polygon overlay on results page (show-only, NOT editable). Mapbox + static tile, ~4-8 hours, $0/mo at scale. Addresses Step 7 multi-building parcel gotcha.
- Replace `isContractorConfigured` heuristic at `lib/estimate.ts:315` with explicit `pricing_mode` setting on `estimate_settings`.
- Auto-widen range when `confidence: "low"` — only as a roofer-controlled toggle, not hardcoded. Roofr-aligned default is no auto-widen.
- Lower or remove `under_600_sqft` guardrail if real legit tiny homes (mobile, ADU, beach cottage) get blocked.
- Rename DB column `buffer_percent` → `range_percent` for clarity.

## Source-of-truth references

- Bench validation: `scripts/bench-addresses.json` — D.2 green band `1.3–2.0×` (justifies Step 4 threshold of 2.5× being above the band)
- Dashboard config UI: `app/dashboard/settings/tabs/EstimatesTab.tsx`
- LiDAR service: `services/lidar-measure/app.py` — Modal-deployed, talks to geospatial Supabase via psycopg2 for `phase_b.footprint_lookup`
- Geospatial Supabase project: env vars `SUPABASE_GEOSPATIAL_URL` + `SUPABASE_GEOSPATIAL_ANON_KEY`, table `building_footprints`
- 11-address baseline test results from 2026-05-01: 5 fail (8734, 4108, 1450, 7234, 11506), 6 succeed (6510, 2500, 1500, 4321, 3567, 1620). Generic `couldnt_measure_accurately` returned for all 5 failures (the bug we're fixing).
