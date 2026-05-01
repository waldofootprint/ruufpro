# Handoff: Phase 2 step 1 — verify ready to ship

**Created:** 2026-05-01 (end of session that shipped the code).
**For:** A fresh Claude Code session that picks up here.
**Goal:** Determine whether the RuufPro estimate calculator is ready to ship to clients/prospects, and fix anything that's blocking. Below is the prompt to paste verbatim into a new session.

---

## Prompt to paste into the new session

```
You are picking up where the previous session left off on RuufPro's estimate calculator. Phase 2 step 1 (polygon overlay + frontend error_code/confidence handling) shipped to production today (2026-05-01). I need you to verify whether it's actually ready for me to start sending prospects to.

## What shipped (already deployed to https://ruufpro.com)

Two squash commits on main:
- `3943f29` — Phase 2 step 1 feature work (PR #8)
- `8ee6992` — fix: solar-api populates geocoded coords on cache hit (PR #9)

The full plan is `decisions/2026-05-01-phase-2-step-1-polygon-overlay-and-frontend-error-handling.md`.

Branches still on remote (preserved for reference, both merged):
- `feat/phase-2-step-1-polygon-overlay`
- `fix/solar-api-cache-geocoded`

## State at handoff (verified by curl)

The 11-address verification at the end of last session showed:
- 11/11 responses include `roof_overlay` field (good — fix #9 worked)
- 0/11 had `roof_overlay.url` set (MAPBOX_TOKEN was added to Vercel but not yet picked up by a redeploy)
- 0/11 had `has_polygon: true` (likely migration 098 didn't actually apply, or addresses didn't match MS Footprints — needs investigation)
- Successful estimates: 8/11 (target ≥9). The 9th (11506 Old Mission Dr) returns `address_unrecognized` — pre-existing baseline failure noted in Phase 1 retro.

## What I need you to do (in order)

### 1. Trigger a redeploy to pick up MAPBOX_TOKEN

Vercel reads env vars at deploy time. I added MAPBOX_TOKEN after `8ee6992` was already built, so the live function doesn't see it. Push an empty commit:
```
git checkout main && git pull && git commit --allow-empty -m "chore: redeploy to pick up MAPBOX_TOKEN env var" && git push
```
Wait for the Vercel build to land via `gh api repos/waldofootprint/ruufpro/commits/HEAD/status`.

### 2. Confirm migration 098 actually applied

Run this curl after redeploy:
```bash
curl -s -X POST https://ruufpro.com/api/estimate \
  -H "Content-Type: application/json" \
  -d '{"contractor_id":"c2a1286d-4faa-444a-b5b7-99f592359f80","address":"8734 54th Ave E, Bradenton, FL 34211","pitch_category":"moderate","current_material":"asphalt","shingle_layers":"not_sure","lat":27.4459,"lng":-82.4146}' \
  | jq '.roof_overlay'
```
Expect: `{ "url": "https://api.mapbox.com/...", "has_polygon": true }`.

If `has_polygon: false`, migration 098 isn't applied. The migration SQL is at `supabase/098_find_building_footprint_area_with_geom.sql`. Apply it via the Supabase dashboard SQL editor on the GEOSPATIAL project (`vfmnjwpjxamtbuehmtrv`). The file uses `BEGIN; DROP; CREATE; COMMIT;` (it has to — Postgres rejects `CREATE OR REPLACE` across return-shape changes). Smoke test in the editor:
```sql
select area_sqm, building_id, jsonb_typeof(geom_geojson) as polygon_type
from public.find_building_footprint_area(27.4459, -82.4146);
```
Expect `polygon_type = 'object'`.

### 3. Re-run the 11-address verification

```bash
./scripts/verify-phase-2-step-1.sh https://ruufpro.com
```

Acceptance: ≥10/11 with `roof_overlay present: yes` AND `url-set: yes`. ≥7/11 with `has_polygon: yes` (some addresses won't have MS data; that's fine for shipping).

### 4. Visual test in browser (the most important step)

Open https://ruufpro.com/widget/c2a1286d-4faa-444a-b5b7-99f592359f80 in a browser. Walk through the widget end-to-end with these test addresses:

**Test A — happy path with polygon**
- Address: `8734 54th Ave E, Bradenton, FL 34211`
- Pitch: Moderate, Material: Asphalt, Layers: Not sure, Timeline/Financing: any, Contact: fake but valid format
- On step 8 (results), verify:
  - [ ] Mapbox aerial visible at the top of the results card
  - [ ] Navy polygon outlined around the building
  - [ ] "Measured area outlined in navy" caption visible
  - [ ] If `confidence: low`, an amber pill says "Approximate measurement — confirm on-site"
  - [ ] G/B/B material cards render below
  - [ ] No console errors (open DevTools)
  - [ ] view-source on the page → `MAPBOX_TOKEN` value (your `pk.eyJ...` string) does NOT appear in the HTML, only in `<img src>` URLs

**Test B — commercial address error**
- Address: `1450 Brickell Bay Dr, Miami, FL 33131`
- Walk through, on step 8 verify:
  - [ ] Headline reads "This looks like a commercial property"
  - [ ] Body mentions the contractor name + "by phone"
  - [ ] A "Call [contractor]" button appears (links to tel:)
  - [ ] Aerial visible (no polygon expected — commercial buildings often aren't in MS data)

**Test C — measurement_unavailable / manual-quote**
- Hard to force without a known-failing address. Try: `1234 fake street, nowhere, FL 99999` to force `address_unrecognized`. To test `measurement_unavailable` specifically, you'd need an address where Solar AND Footprints both fail — rare. If you can find one, verify the manual-quote screen ("Request Received" / "1-2 business days") renders. Otherwise note this branch as "not visually verified, but spec-tested via subagent reviews."

**Test D — mobile rendering**
- Open the widget on a phone (or use DevTools mobile emulation)
- Walk through one happy-path address
- Confirm the overlay image scales, the polygon is visible, the pill renders, the button targets are at least 44px tall

**Test E — a contractor site (real use case)**
- Find a deployed contractor site that has the V4 widget (e.g., one of the 5 themes). Check `app/site/[slug]/page.tsx` for the routing. Walk through one estimate end-to-end on the contractor site, not the standalone widget.
- Confirm the overlay renders inside the theme's container without breaking the layout.

### 5. Report findings

Write a short summary in this format and paste it back to me:

```
## Phase 2 step 1 ship-readiness

API verification: PASS / FAIL (X/11 success, Y/11 with polygon)
Browser test A (happy path): PASS / FAIL [notes]
Browser test B (commercial): PASS / FAIL [notes]
Browser test C (manual-quote): PASS / SKIP [notes]
Browser test D (mobile): PASS / FAIL [notes]
Browser test E (theme site): PASS / FAIL [notes]
Token leak check: PASS / FAIL

Recommendation: SHIP / FIX FIRST [specific blockers]
```

If anything fails: investigate root cause, fix, deploy, re-verify. Don't paper over issues. The previous session caught one real bug (cache-hit dropped geocoded coords) during verification — expect 1-2 more.

## Reference

- Plan: `decisions/2026-05-01-phase-2-step-1-polygon-overlay-and-frontend-error-handling.md`
- Phase 1 plan (for context on what was already shipped): `decisions/2026-05-01-phase-1-shippable-calculator.md`
- Verification script: `scripts/verify-phase-2-step-1.sh`
- Geospatial migration: `supabase/098_find_building_footprint_area_with_geom.sql`
- Local dev setup note: there's no `.env.local` on this machine — `npm run dev` will fail without setting one up. Verify on production directly.
- Vercel dashboard: https://vercel.com/waldo12397-7433s-projects/ruufpro
- GitHub repo: https://github.com/waldofootprint/ruufpro
- Geospatial Supabase project: `vfmnjwpjxamtbuehmtrv`

## What "ready to ship" means

The bar is: I'm comfortable sending prospects to a contractor's site and having them walk through the calculator. Specifically:
1. Polygon overlay renders for typical FL residential addresses
2. Commercial / unrecognized addresses get clear, on-brand error messages
3. Low-confidence cases show the pill so homeowners know it's approximate
4. No regressions vs Phase 1 (still ≥8/11 successful estimates on the test suite)
5. Mobile rendering doesn't break
6. No console errors in production browsers
7. No Mapbox token leaked into client HTML

When all 7 are green, recommend SHIP. If any are red, fix and re-verify before the recommendation.
```
