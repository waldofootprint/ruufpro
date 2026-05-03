# RuufPro Calculator — Roofr-Superiority Handoff Plan

**Date**: 2026-05-03
**Author**: Audit session
**For**: Next session(s) executing the build
**Goal**: Ship a calculator that is **demonstrably superior to Roofr in every measurable surface** (UX polish, configuration richness, accuracy, coverage, lead conversion) without sacrificing the math/measurement edge we've already invested in.

---

## TL;DR

- **Winner widget**: V4. V3 is dead code (zero imports). V1 is the production iframe entry but feature-inferior. Migrate `/widget/[contractorId]` to render V4. Delete V3.
- **Winner config**: keep current `EstimatesTab` skeleton, extend with rep-profile, brand-color, rich-material-content, optional-questions sections. Kill weather-surge entirely.
- **Winner measurement chain**: LiDAR (when 3DEP covers) → Google Solar (when imagery good) → MS Footprints + homeowner-pitch fallback → Mode B (true outliers only). **No paid vendor needed** — MS Footprints free + 98.5% precision + Florida coverage of 7.2M buildings is enough.
- **3 milestones**: M1 demo-parity (visible polish), M2 always-return-a-number measurement layer + bench validation, M3 config richness + consolidation.
- **"Superior" defined**: side-by-side demo Hannah judges as winning + accuracy bench median |estimate−closed_job_price| ≤ 10% on N≥30 closed FL jobs (target tighter than Roofr's structural ceiling of ~15-25% on pitched roofs).

---

## What "superior to Roofr in every measurable way" means here

Locking the bar so the next session knows when it's done.

### Measurable surfaces

| Surface | Roofr's bar | Our target | How we measure |
|---|---|---|---|
| Demo polish | Multi-material cards + rep card + calendar CTA + satellite thumb on result | Same + roof-overlay polygon + confidence flag + signed PDF in 1 click | Hannah's side-by-side judgment |
| Config richness | Per-material name/desc/images + 3 pitch-tier prices + brand colors + rep profile + calendar URL + 6 optional Q toggles | All of theirs + custom add-on upsells + per-roofer accent color + minimum-job-price floor (we already have last) | Field-by-field gap table (see M3) |
| Coverage (always-return-a-number) | Always quotes via flat $/sqft × homeowner pitch | Always quotes via best-available chain → footprint+homeowner-pitch fallback → only Mode B for commercial/unrecognized | % of valid residential addresses returning a number; target ≥ 99% |
| Accuracy | Footprint × $/sqft × ±5% theatre. Structural ceiling ~15-25% off on pitched roofs because they don't measure pitch | Pitch-aware (Solar/LiDAR or homeowner-reported), waste, tear-off, shape, size. Median ≤ 10% off on closed-job bench | `bench-v4.mjs` against ground-truth closed jobs (need to GROW fixture, see M2) |
| Lead conversion | Contact gate AFTER price reveal, sales-rep card + calendar on result | Same + 1-tap "Book Tuesday at 10" via embedded Calendly/Cal.com | Funnel completion rate post-launch (instrument in M1) |
| Speed | ~1-2 sec to result | ≤ 3 sec end-to-end p95 | API latency log |

### NOT a measure of superiority (do not rabbit-hole)

- "Use more sophisticated tools than Roofr" — irrelevant if homeowner doesn't perceive accuracy
- "Match every Roofr question" — we can win with fewer, better questions
- "Match Roofr's exact card layout" — V4 already exceeds it; ship V4

---

## Pre-flight reading (the next session reads these FIRST)

In this order:

1. This document (the plan)
2. [research/handoff-2026-05-03-calculator-superiority-plan.md](research/handoff-2026-05-03-calculator-superiority-plan.md) — this file
3. [decisions/calculator-ship-bar-revised.md](../../RuufPro-Vault/RuufPro-Vault/decisions/calculator-ship-bar-revised.md) — accuracy ship bar context
4. [decisions/calculator-parity-plan.md](../../RuufPro-Vault/RuufPro-Vault/decisions/calculator-parity-plan.md) — prior parity scoping
5. [decisions/calculator-recovery-plan-amendment-roofle-roofr-gt.md](../../RuufPro-Vault/RuufPro-Vault/decisions/calculator-recovery-plan-amendment-roofle-roofr-gt.md) — Roofle/Roofr ground-truth methodology
6. [lib/estimate.ts](lib/estimate.ts) — full pricing math (PRICING.1c)
7. [lib/measurement-pipeline.ts](lib/measurement-pipeline.ts) — LiDAR → Solar → Footprints chain
8. [components/estimate-widget-v4.tsx](components/estimate-widget-v4.tsx) — winner widget
9. [app/dashboard/settings/tabs/EstimatesTab.tsx](app/dashboard/settings/tabs/EstimatesTab.tsx) — current config UI
10. [scripts/bench-v4.mjs](scripts/bench-v4.mjs) + [scripts/bench-addresses.json](scripts/bench-addresses.json) — bench harness

Do not start building until you've read 1, 2, 6, 8, and 9. The others are reference for specific tickets.

---

## Confirmed facts the plan is built on (from this session's audit)

### Codebase state

- **V4 is the only widget with multi-material Good/Better/Best display** (lines 234-250, 251-567 in `estimate-widget-v4.tsx`), satellite overlay (line 18), shape-class selector, Places autocomplete, confidence flags. **Polish score 8/10.**
- **V3 is completely unused.** Zero imports across the codebase. Dead code. Delete in M1.
- **V1 is the live `/widget/[contractorId]` iframe** but lacks multi-material display, has placeholder satellite ("Satellite view will appear here", line 340), no confidence signals, no shape class. **Migrate to V4 in M1.**
- **5 themed estimate-sections** (`classic`, `forge`, `chalkboard`, `blueprint`, base) all already wrap V4. Keep them — they're thin layout wrappers, not duplication.
- **EstimatesTab** has 10 sections currently. Storm Surge (~62 lines, lines 487-548) gets ripped in M1. Everything else stays.
- **Mode B has zero telemetry.** No counter, no widget event, no dashboard metric. We don't know how often it fires today. M2 must add it before tuning.
- **LiDAR Pipeline A is deployed** to Modal (`LIDAR_MEASURE_URL`), warm-pooled, $20/mo cost ceiling. Outcome codes wired. **3DEP coverage % not documented in code or docs** — M2 must establish FL coverage empirically.
- **Bench harness exists and runs** (`bench-v4.mjs`), 9-address FL fixture with Roofle + Roofr reference prices, ±15% Gate-2 policy. Not enough addresses for accuracy claim — M2 grows to ≥30.

### Pricing math (current PRICING.1c, will be preserved)

Final price formula in [lib/estimate.ts:292-396](lib/estimate.ts#L292-L396):

```
price_mid = roof_sqft
          × waste_factor (1.10–1.22 by complexity, or 1.18 for ms_footprints)
          × rate_mid (= avg(low_$/sqft, high_$/sqft))
          × size_shape_multiplier (1.00–1.32 by sqft + simple_gable/hip/complex_multiplane)
          × pitch_multiplier (1.0–1.5 by degrees)
        + ridge × $3.25/lf + hip × $4.0/lf + valley × $5.0/lf + perim × $2.0/lf
        + tear_off (sqft × $1.25 if 2 layers, × 0.5 if "not_sure", 0 if 1)
        + penetrations ($400–$800 by sqft band)
        × weather_surge ← REMOVED IN M1
price_mid = max(price_mid, minimum_job_price_floor)
price_low  = price_mid × (1 − buffer% / 100)
price_high = price_mid × (1 + buffer% / 100)
```

Bundled-vs-itemized auto-detect: `(rate_high / rate_low) < 1.15` → contractor itemized → apply waste + pitch + accessories. Else → bundled regional default → skip multipliers (already in rate).

**Do not change this formula in M1 or M2.** It's calibrated against Roofle bench. Touch only in M3 if bench evidence demands.

### Schema state (estimate_settings)

Current columns ([001_initial_schema.sql:111-130](supabase/001_initial_schema.sql#L111-L130) + later migrations):

`id, contractor_id, asphalt_low/high, metal_low/high, tile_low/high, flat_low/high, service_zips, created_at, updated_at, buffer_percent, minimum_job_price, financing_enabled/provider/term_months/apr/note, weather_surge_* (5 cols, KILL), asphalt_label/metal_label/tile_label/flat_label, show_roof_details`

Will add (across M1-M3):
- M1: `rep_name, rep_title, rep_email, rep_phone, rep_photo_url, rep_bio, calendar_url, brand_primary_hex, brand_accent_hex, coverage_check_enabled`
- M3: separate `estimate_materials` table (per-material rich content with images), `enabled_optional_questions` (jsonb array), `campaign_links` table

### Roofr deltas to close (the gap inventory)

| # | Roofr has | We have | Closed in |
|---|---|---|---|
| 1 | Multi-material result cards | V4 has it; V1 (production) doesn't | **M1** (just route swap) |
| 2 | Sales-rep profile + calendar CTA on result | None | **M1** |
| 3 | Per-roofer brand primary/secondary hex | Theme-level only | **M1** |
| 4 | Coverage check before funnel | service_zips column exists, no UI gate | **M1** |
| 5 | Per-material rich text desc + images | Single label override | **M3** |
| 6 | 3 prices per material per pitch tier | Algorithmic pitch multiplier (more accurate) | **DO NOT downgrade** |
| 7 | 6 optional toggleable questions | Fixed funnel | **M3** |
| 8 | Showcase/testimonials block on result | None | **M3** |
| 9 | Unlimited campaign share-links | Single embed URL | **M3** |
| 10 | Always-returns-a-number consistency | Mode B refuses on guardrail | **M2** |

### Vendor research outcome

- **No paid measurement vendor recommended.** MS Footprints free, 98.5% polygon precision, Florida 7.2M buildings, vintage 2019-2020 in focal areas. Overture Maps (free, 2026-04-15 release) is a fresher conflated version we can swap to in M2 if MS data feels stale.
- Hover ($29-69/report), EagleView ($5+/report), Ecopia/Nearmap (enterprise sales only) — out for our $149/mo unit economics.
- The "always return a number" play uses **homeowner-reported pitch × footprint area** as the floor — this is exactly what Roofr does, at zero per-property cost.

---

## MILESTONE 1 — Demo Parity (visible polish, ~1 sprint)

**Goal**: side-by-side demo of RuufPro vs Roofr where Hannah judges RuufPro to win on visible polish.

**Scope**: surface-level changes only. No measurement-pipeline changes. No pricing-math changes.

### M1.1 — Kill weather surge (cleanup precondition)

Reason first: this is dead-on-arrival and removing it simplifies every other M1 ticket.

- New migration `099_drop_weather_surge.sql`:
  ```sql
  ALTER TABLE estimate_settings
    DROP COLUMN IF EXISTS weather_surge_enabled,
    DROP COLUMN IF EXISTS weather_surge_multiplier,
    DROP COLUMN IF EXISTS weather_surge_duration_days,
    DROP COLUMN IF EXISTS weather_surge_expires_at,
    DROP COLUMN IF EXISTS weather_surge_auto_expire;
  ```
- Strip from [EstimatesTab.tsx](app/dashboard/settings/tabs/EstimatesTab.tsx): constants (lines 38, 90-94), state (5 vars lines 90-94), load (152-156), save (262-265), JSX section (487-548).
- Strip from [lib/estimate.ts](lib/estimate.ts): `weatherSurgeMultiplier` field (line 77), `weatherSurge` const (line 296). Replace `subtotal * weatherSurge` with just `subtotal` and remove the variable.
- Strip from [app/api/estimate/route.ts](app/api/estimate/route.ts): import (line 35), call (line 252), application logic (lines 530-537).
- Delete `lib/weather-surge.ts` if it exists.
- `grep -ri "surge\|storm.pricing\|weather.*multiplier" components/ app/ research/ docs/` — kill any marketing-copy mentions.

**Acceptance**: bench-v4.mjs still runs; estimate API returns same numbers; EstimatesTab renders without surge section; `grep "surge"` returns zero hits in non-archive files.

### M1.2 — Migrate `/widget/[contractorId]` from V1 to V4

- [app/widget/[contractorId]/page.tsx:9](app/widget/%5BcontractorId%5D/page.tsx#L9): swap import from `EstimateWidget` to `EstimateWidgetV4`. Pass through any required props (contractorId).
- Remove `components/estimate-widget.tsx` (V1) AFTER verifying no other route uses it. Audit found `components/marketing/demo.tsx` also imports V1 — swap that too or delete the demo file.
- Test: load `/widget/{any_real_contractor_id}` in iframe, verify multi-material cards render, satellite overlay loads, address autocomplete works, contact gate behaves correctly.

**Acceptance**: production iframe shows V4 UI. V1 file deleted. Build passes.

### M1.3 — Delete V3 (dead code)

- `git rm components/estimate-widget-v3.tsx` (zero imports verified by audit)
- One-line commit. Done.

**Acceptance**: file is gone, build passes.

### M1.4 — Sales-rep profile card on result page

This is the highest-conversion-impact item per the role-play roofer's verdict.

- Add columns to `estimate_settings`:
  ```sql
  ALTER TABLE estimate_settings
    ADD COLUMN rep_name text,
    ADD COLUMN rep_title text,
    ADD COLUMN rep_email text,
    ADD COLUMN rep_phone text,
    ADD COLUMN rep_photo_url text,
    ADD COLUMN rep_bio text,
    ADD COLUMN calendar_url text;
  ```
- New section in EstimatesTab "Sales Contact" with: photo upload (re-use existing avatar uploader if any, else Supabase storage), name, title, email, phone, bio (textarea), calendar URL (text input with placeholder `https://calendly.com/yourname/intro` or `https://cal.com/yourname/30min`).
- Validate `calendar_url`: optional, but if present must be a Calendly/Cal.com/SavvyCal/Google Calendar URL (regex check, not whitelist).
- Render block on V4 result screen below the material cards: photo + name + title + bio (≤ 200 char preview) + email-link + tel-link + **"Book a meeting" button → opens calendar_url in new tab if present, else hides button**.
- Result screen layout reference: Roofr survey response shows their `lead_form_profile` shape — we don't need to copy 1:1 but the photo+title+bio+CTA hierarchy is the proven layout.

**Acceptance**: roofer fills the form in dashboard, end-to-end test homeowner sees rep card on result, calendar link opens to a working booking page.

### M1.5 — Per-roofer brand color override

- Add columns:
  ```sql
  ALTER TABLE estimate_settings
    ADD COLUMN brand_primary_hex text,
    ADD COLUMN brand_accent_hex text;
  ```
- New section in EstimatesTab "Branding": two color pickers (use any decent React color-picker; `react-colorful` is small/zero-dep). Accept hex input alongside the picker.
- In V4 widget, on mount, fetch settings and inject CSS variables: `--ruuf-primary: <hex>; --ruuf-accent: <hex>;`. Wire existing primary buttons + tier-card accent borders to these variables. **Do NOT** touch all 50 elements — pick the 5 highest-impact (CTA button bg, selected-card border, progress bar, link color, header underline).
- Default to existing theme defaults if both hex fields are null.

**Acceptance**: roofer sets brand_primary_hex to e.g. `#FF6A00`, widget renders with that as the CTA color. Roofr does this; we now do too.

### M1.6 — Coverage check upfront

This is the biggest UX leak in the current flow — homeowners answer 8 questions before being told they're out of zone.

- New question step in V4 widget, runs on address-confirm: client-side check `address.zip ∈ settings.service_zips`.
- If out-of-zone: redirect to in-line "We don't service [zip] yet — leave us your email and we'll let you know when we do" (write to leads with `status: 'out_of_zone'`, `source: 'estimate_widget'`).
- If in-zone: continue funnel as today.
- Add toggle in EstimatesTab "Service Area" section: `coverage_check_enabled` (boolean, default `true` if service_zips populated, `false` if not).

**Acceptance**: with service_zips = `["33580", "34211"]`, an out-of-zone address gets bounced; an in-zone address proceeds normally.

### M1.7 — Mode B telemetry

Foundation for M2's "always-return-a-number" tuning. Need to know baseline rate before changing behavior.

- In [/app/api/estimate/route.ts](app/api/estimate/route.ts), every Mode B trip → `await widgetEvents.log({contractor_id, event: 'mode_b_fired', error_code, address})`.
- Add a daily roll-up to dashboard: `/api/dashboard/insights/mode-b-rate` → `{fires_today, fires_7d, total_estimates_today, rate_pct}`.
- New tile on contractor dashboard "Estimates refused (last 7 days): N (X% of attempts)".

**Acceptance**: a Mode B trip in a test estimate writes a widget_events row; dashboard tile shows the count.

### M1 cumulative acceptance gate

- Visual demo: side-by-side video of V4 (post-M1) vs Roofr's instant estimator on the same address.
- Hannah's judgment: which one would she rather pay $149/mo for?
- If yes, M1 ships. If no, course-correct before M2.

**Estimated effort**: 1 build session if everything goes smoothly, 2 if Calendly/photo upload fights us.

---

## MILESTONE 2 — Always-Return-a-Number Measurement Layer (~1.5 sprints)

**Goal**: cover ≥ 99% of valid residential addresses with a confidence-flagged estimate. Mode B fires only on commercial misclassification + truly unrecognized addresses.

**Scope**: measurement-pipeline changes, fallback chain refinement, bench expansion, accuracy validation.

### M2.1 — Establish 3DEP coverage empirically

- Script `scripts/probe-lidar-coverage.mjs`: take a sample of 200 random FL residential addresses (sample from the Manatee/FL DBPR roster we already have), run `services/lidar-measure` against each, log outcome codes.
- Output: `% ok / % no_class_6 / % laz_download_failed / % no_footprint_lidar / % tnm_5xx`. This gives us the real LiDAR coverage number for FL.
- Document in [services/lidar-measure/README.md](services/lidar-measure/README.md): "FL LiDAR coverage: X% of residential addresses as of 2026-Y."
- This kills the role-play roofer's "30-40% gap" worry with data.

**Acceptance**: documented coverage number in repo. If <70%, we know to lean harder on the Solar+Footprints fallback. If >85%, we can over-claim LiDAR in marketing.

### M2.2 — Refactor `Mode B` to "low-confidence fallback" path

This is the central M2 change.

Current behavior (in [app/api/estimate/route.ts](app/api/estimate/route.ts) and [lib/measurement-pipeline.ts](lib/measurement-pipeline.ts)):
- Geocoding non-residential → Mode B
- Geocoding unrecognized → Mode B
- LiDAR + Solar both fail + footprint area exists → Mode B
- Footprint also missing → Mode B
- Sanity guardrail (sqft <600 or >10K or neighbor-grab) → Mode B

New behavior:
- Geocoding non-residential → **stays Mode B** (correctness — don't quote a strip mall)
- Geocoding unrecognized → **stays Mode B** (we can't price what we can't find)
- LiDAR + Solar both fail + footprint exists → **NEW: low-confidence path** (see below)
- Footprint also missing → **stays Mode B** (we have nothing to multiply)
- Sanity guardrail → **stays Mode B** (correctness)

The low-confidence path:
- Use `footprint_area_sqft × pitch_multiplier_from_homeowner_answer × material_$/sqft × ±buffer%`.
- Pitch multiplier from homeowner answer: `low → 1.0, moderate → 1.15, steep → 1.30`. (These are slightly compressed from the degree-based table to reflect homeowner uncertainty.)
- Waste factor: `1.18` (the existing ms_footprints default, neutral).
- Render result with `confidence: 'low'` flag.
- V4 widget shows a visible badge on the result: "Estimate based on satellite footprint. We'll verify exact measurements on-site." Roofr ships zero confidence signal — we ship one and turn it into trust copy.

Implementation:
- New function `computeLowConfidenceEstimate()` in `lib/estimate.ts` taking `(footprint_sqft, homeowner_pitch_tier, material, rates, buffer%)`.
- In `lib/measurement-pipeline.ts`, when Solar + LiDAR both null AND footprint exists, return `{source: 'ms_footprints_homeowner_pitch', confidence: 'low', ...}`.
- In `/api/estimate/route.ts`, branch on `confidence` to call appropriate calc.
- V4 widget already has confidence display wired (line 269) — verify the "low" branch shows the badge copy correctly.

**Acceptance**:
- Mode B fire rate drops from baseline (M1.7 instrumentation) to ≤ 5% of valid residential addresses on a 200-address probe.
- Low-confidence flag renders correctly on V4 result screen.
- Spot-check 10 low-confidence estimates against ground truth — median delta ≤ 25% (worse than our Solar/LiDAR 10%, better than nothing).

### M2.3 — Optional: refresh Building Footprints data with Overture Maps

- MS Footprints in our PostGIS DB is 2019-2020 vintage in focal areas, 2012 average elsewhere.
- Overture (free, 2026-04-15 release) conflates MS + OSM + Google Open Buildings. Often fresher.
- Script: download Overture FL GeoParquet (`s3://overturemaps-us-west-2/release/2026-04-15.0/theme=buildings/...`), filter to FL bounding box, ingest into `building_footprints` table.
- Compare row count and spot-check 20 known addresses. If Overture significantly improves freshness/coverage, swap.
- **Optional and low-priority** — only do this if M2.2 reveals footprint-quality issues.

**Acceptance**: documented decision (swap or skip) with evidence. If swap, building_footprints table re-ingested and `find_building_footprint_area` RPC unchanged at the interface level.

### M2.4 — Bench harness expansion + accuracy validation

The current 9-address fixture is too small to make accuracy claims.

- Grow `scripts/bench-addresses.json` to ≥ 30 FL addresses, ideally **50** spread across:
  - 15 Manatee/Sarasota single-family residential (we have plenty from the DBPR roster)
  - 10 mixed metros (Orlando, Tampa, Jax)
  - 5 known-edge cases (large estate, very small home, complex hip multiplane, mobile home, attached townhome)
- For each: capture Roofle + Roofr reference prices via existing capture flow; if available, **also capture closed-job final price** from any roofers we have data with (Hannah may have 5-10 historical jobs in CRM exports — these are gold).
- Run bench: median |our_estimate − closed_job_price| / closed_job_price.
- **Ship gate**: median ≤ 10%, p90 ≤ 20%, no individual estimate > 50% off ground truth.
- If we don't hit the gate, M2 is not done — debug pricing math against bench data, NOT against Roofle (Roofle is a peer, not ground truth).

**Acceptance**: 30+ address fixture, bench output checked into `.tmp/calculator-bench/v4-bench-M2.csv`, summary stats in handoff doc, ship-gate met or root-cause documented.

### M2.5 — LiDAR pipeline production hardening

- Verify `keep_warm=1` is actually preventing 22s cold starts (Track A.8). Sample 20 prod calls during off-hours, log latency p50/p95.
- If p95 > 5s, increase warm pool or revisit Modal config.
- Add error-budget alerting: `>10% pipeline_crash rate over 1 hour` → Sentry alert. We already use Sentry.
- Document the runtime cost (audit said ~$20/mo, verify by checking Modal billing).

**Acceptance**: p95 LiDAR call latency < 5s, error rate documented, monthly cost projection updated.

### M2 cumulative acceptance gate

- Run the 200-address probe from M2.1.
- ≥ 99% of valid residential addresses return a number (not Mode B).
- 30+ address bench shows median accuracy ≤ 10% off ground truth.
- LiDAR + Solar + Footprints fallback chain works end-to-end with confidence flags.

**Estimated effort**: 1.5 build sessions. The bench growth + closed-job ground truth collection is the long pole.

---

## MILESTONE 3 — Config Richness + Polish (~1 sprint)

**Goal**: roofer-facing config matches or exceeds Roofr field-for-field on what matters; result page has all the brochure-level richness Roofr ships.

**Scope**: dashboard config UI, V4 widget result-page extensions, optional questions, campaign share-links.

### M3.1 — Per-material rich content

Roofr lets roofers attach a name + rich-text description + image gallery to each material. We have `*_label` only.

- New table:
  ```sql
  CREATE TABLE estimate_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id uuid NOT NULL REFERENCES contractors(id),
    material_key text NOT NULL CHECK (material_key IN ('asphalt', 'metal', 'tile', 'flat', 'repair')),
    display_name text,
    description_html text,
    image_urls text[],
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (contractor_id, material_key)
  );
  ```
- New EstimatesTab section "Material Cards": for each enabled material, expandable card with display_name, rich-text editor (tiptap or lexical, lightweight), image upload (≤ 3 images).
- Migrate existing `*_label` values into `display_name` on first read; deprecate label columns in M3.4 cleanup.
- V4 result cards: render image + display_name (fallback to default) + description_html (sanitized) + price range. **Roofr's literal layout, our richer math underneath.**

**Acceptance**: roofer fills 4 cards in dashboard; homeowner sees 4 cards with photos, descriptions, and prices on result page. Reads visually like Roofr's result.

### M3.2 — Optional question toggles

Roofer wants to enable solar interest, roof damage, insurance claim, multi-story, roof age, referral source as needed.

- New column: `enabled_optional_questions jsonb DEFAULT '[]'::jsonb` on `estimate_settings`. Array of question slugs.
- New section in EstimatesTab "Lead Quality Questions": six toggles, each with a short description of what it asks and why a roofer might want it.
- V4 widget reads the array, inserts those question steps into the funnel before the contact gate.
- Each optional question's answer goes into `leads` as `optional_answers jsonb`.

Question definitions:
- `roof_damage`: "Is there visible damage to your roof? (Yes / No / Not sure)"
- `insurance_claim`: "Are you filing an insurance claim? (Yes / No / Maybe)"
- `roof_age`: "How old is your current roof? (<5y / 5-10y / 10-20y / 20+y / Not sure)"
- `multi_story`: "How many stories is the building? (1 / 2 / 3+)"
- `interested_in_solar`: "Interested in solar panels with the new roof? (Yes / No / Maybe)"
- `referral_source`: "How did you hear about [Contractor Name]? (Google / Facebook / Friend / Other)"

**Acceptance**: roofer enables `roof_damage` + `insurance_claim`, those two steps appear in funnel, answers persist on lead row.

### M3.3 — Unlimited campaign share-links

- New table:
  ```sql
  CREATE TABLE estimate_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (contractor_id, slug)
  );
  ```
- New widget URL pattern: `/widget/[contractorId]/c/[campaign_slug]` — slug propagates to leads as `campaign_slug` column.
- New EstimatesTab section "Campaigns": list + "Create campaign" form (name + auto-generated slug). Each row shows shareable URL + copy button + lead count.
- Default `/widget/[contractorId]` (no campaign) writes `campaign_slug: 'default'`.

**Acceptance**: roofer creates "spring-promo" campaign, gets shareable URL, leads from that URL show campaign attribution in dashboard.

### M3.4 — Result-page testimonials block (optional toggleable)

- New column: `is_showcase_enabled boolean DEFAULT false`, `showcase_heading text`, `showcase_testimonials jsonb` (array of `{quote, author, location, photo_url}`).
- EstimatesTab "Testimonials" section: enable toggle, heading text, list of up to 5 testimonials.
- V4 result page renders block below rep card if enabled.

**Acceptance**: roofer adds 3 testimonials, homeowner sees them on result.

### M3.5 — Cleanup deprecated `*_label` columns

After M3.1 migrates labels into `estimate_materials.display_name`:
- Drop `asphalt_label, metal_label, tile_label, flat_label` from `estimate_settings`.
- Strip from EstimatesTab + estimate.ts + route.ts.

**Acceptance**: `grep -r "_label" lib/ app/ components/` returns zero estimator-related hits.

### M3.6 — Final widget consolidation

By end of M3, the codebase has:
- One widget version: V4
- Five themed wrappers (kept — thin layout)
- Zero legacy V1/V2/V3 references

Final pass:
- Search for any remaining `EstimateWidget` (V1) or `EstimateWidgetV3` imports anywhere — should be zero.
- Delete `components/archive/estimate-widget-v2.tsx`.
- Update any documentation in `research/` or `docs/` referring to V1/V2/V3 to point at V4.
- Add a comment block at the top of `estimate-widget-v4.tsx`: "**Source of truth widget. Do not create V5 — extend this file.**"

**Acceptance**: one widget, one truth.

### M3 cumulative acceptance gate

- Field-by-field comparison vs Roofr's `/survey` schema: every Roofr config field has a RuufPro equivalent, except those we explicitly chose not to (per-pitch-tier prices — replaced by our pitch multiplier).
- Result page demo: Hannah judges visually as winning vs Roofr.
- All optional questions toggleable and persistent.

**Estimated effort**: 1 build session, plus 0.5 if the rich-text editor fights us.

---

## Cross-cutting concerns

### Marketing-site updates (separate session, not in this plan)

Per Hannah, marketing copy + screenshots come in a separate session AFTER M3 ships. The estimator landing page (currently at the marketing site v3/v4 hero) will need:
- New screenshots reflecting V4 result with rep card + multi-material display
- Copy update reflecting the "always returns a number" coverage promise
- Removal of any weather-surge-related claim
- Calendar booking demo (record one)

Do not gate M1/M2/M3 ship on marketing. Marketing follows the product.

### Roofer-facing onboarding update

After M1 ships, EstimatesTab grows several sections. The first-time roofer setup currently is "fill 4 material rates." Post-M1, it's also "upload your photo, add calendar URL, set brand color." Add a 60-second "complete your estimator" wizard on first dashboard visit if `rep_name IS NULL`.

Suggest doing this in M3 as a polish item, but if conversion data shows roofers skipping M1's new fields, fast-track it.

### Riley copilot integration (out of scope)

Estimator and Riley share a contractor's data. Riley should know about new estimator fields (rep contact, calendar URL) so it can answer "When can I get a quote?" with the calendar link. Track in Riley sprint, not here.

### Auth + roles

Nothing in this plan changes auth or roles. EstimatesTab is owner-only — keep that.

---

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| LiDAR coverage in FL turns out <50% | Medium | M2.1 measures empirically; if low, lean on Solar+Footprints fallback (M2.2) which already covers everything |
| Bench accuracy ≤10% target unattainable on closed-job ground truth | Medium | M2.4 ship gate is conditional — if we hit 12-15% median we ship anyway and document; ground-truth data will improve calibration over time |
| Storm-surge marketing copy already public — pulling it draws attention | Low | M1.1 grep covers this; if any external link found, redirect to "removed pricing feature" not 404 |
| Roofers don't fill new rep-card fields → result page looks empty | Medium | First-time wizard nudge in M3, plus default to a graceful "Want a quote? [Contractor name] will reach out within 24 hrs" copy if rep_name null |
| V4 → V1 route swap breaks an external roofer's iframe embed | Low | V4 is a superset of V1 features; same iframe-friendly props. Ship M1.2 to staging first, test 3 contractor sites |
| Per-material rich-text editor adds a heavy dep | Low | Use `tiptap-pro/extension-text-style` (~30KB) or skip rich text for plain markdown rendering — degrade gracefully |
| Optional questions inflate funnel length, kill conversion | Medium | They're opt-in by default. Contractor enables only what they actually need. Bench conversion before/after if any contractor enables 3+ |

---

## Definition of done

The calculator is **shippable as superior to Roofr** when:

1. ✅ M1.1–M1.7 cumulative acceptance gates met (demo polish wins side-by-side)
2. ✅ M2.1–M2.5 cumulative acceptance gates met (≥99% address coverage with confidence-flagged numbers, ≤10% median bench accuracy on 30+ closed-job ground truth)
3. ✅ M3.1–M3.6 cumulative acceptance gates met (config field parity except deliberately-better differences)
4. ✅ Every Roofr feature in the gap inventory above is closed or explicitly chosen-not-to-do
5. ✅ Hannah's eyeball verdict: yes, this is better
6. ✅ At least one paying roofer onboarded end-to-end with the new flow without intervention
7. ✅ `bench-v4.mjs` checked into CI as a regression gate (no future PR can land if it breaks bench by >2%)

---

## What this plan deliberately does NOT do

- Does not add a paid measurement vendor. Math + free MS Footprints + Overture + homeowner-pitch = enough.
- Does not match Roofr's 3-prices-per-material grid. Our pitch multiplier is more accurate; downgrading would reduce accuracy.
- Does not promise weather-surge or any promotional pricing feature. Killed for legal reasons.
- Does not rebuild the pricing math. PRICING.1c stays — touch only on bench evidence.
- Does not build a custom calendar — wires existing Calendly/Cal.com URLs.
- Does not include marketing-site changes — separate session.
- Does not commit to "every measurable way" without measurement criteria — see "What 'superior' means" up top.

---

## Open questions for Hannah (answer before M1 starts)

1. **Default brand colors**: when a new roofer has null `brand_primary_hex`, what default? (Suggest the current RuufPro orange/dark unless you have a reason.)
2. **Calendar URL examples in placeholder text**: Calendly + Cal.com? Add SavvyCal? (Suggest Calendly + Cal.com only — fewer is clearer.)
3. **Closed-job ground truth source**: do you have CRM/ServiceTitan/JobNimbus exports from any historical RuufPro roofer with paired estimate-vs-final-price? This is the bottleneck for M2.4 accuracy claims. If not, are you OK shipping with Roofle/Roofr peer-bench only?
4. **Out-of-zone capture default**: if `service_zips` is empty, should the coverage check be off (default today implicit) or on (forces roofers to set zips)? (Suggest off-by-default; new roofers shouldn't be blocked by an empty list.)
5. **Optional questions: which 2-3 should we recommend by default?** (Suggest `roof_damage` + `insurance_claim` + `referral_source` — they're the highest-impact lead-quality signals for FL roofers.)

Lock these answers in a comment-block at the top of this file before kicking off M1.

---

## Session handoff metadata

- **Branch to start from**: main (clean as of `20c13dc`)
- **First task**: M1.1 (kill weather surge) — small, low-risk, unblocks everything else
- **Suggested branch naming**: `calc-m1-weather-surge-kill`, `calc-m1-v4-route-swap`, etc. (one branch per ticket if it helps; one branch per milestone if Hannah prefers fewer reviews)
- **Don't touch**: `lib/estimate.ts` core formula, `services/lidar-measure/app.py`, `lib/footprints-api.ts` RPC interface — these are calibrated/deployed and changing them invalidates the bench.
- **Read this file first.** Then `lib/estimate.ts`. Then `components/estimate-widget-v4.tsx`. Then `app/dashboard/settings/tabs/EstimatesTab.tsx`. Then start M1.1.

---

*End of handoff plan. Total milestones: 3. Estimated total build sessions: 3.5–4.*
