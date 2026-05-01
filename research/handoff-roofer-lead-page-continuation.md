# Roofer Lead Page Continuation

**Last session:** 2026-05-01
**Branch:** `main` (committed + deployed)
**Status:** Phase 1 SHIPPED to ruufpro.com. Ready for Phase 2 whenever Hannah picks it back up.

---

## Quick resume

> "Read `research/handoff-roofer-lead-page-continuation.md` and tell me the 3 fastest next moves. We shipped Phase 1 of PP statewide expansion (storm signals + signal-led tags). Ready for Phase 2."

---

## What just shipped (Phase 1) — verified live on ruufpro.com

**Backend:**
- `storm_events` table on main DB (migration 096)
- 18,238 FL storm events backfilled (5yr from IEM Local Storm Reports)
- Daily cron `/api/cron/ingest-iem-lsr` at 06:30 UTC (status 🟡 until first run validates tomorrow morning)
- Read API `/api/pipeline/storm-signals` returns most-recent roof-relevant storm per county (90d window)

**Dashboard `/dashboard/pipeline`:**
- New "Signals" column with chips
  - 🔨 OLD_PERMIT (or "No permit on file") — high-intent, prominent
  - 🏠 RECENT_SALE (≤2y) — high-intent, prominent
  - Older sale years render as faint "Sold 2018" text (info preserved, no sort weight)
- Storm context now in a **county-scoped banner above the table** — not per-row
  - Last-30d window
  - Filtered to roof-relevant typecodes only (HAIL, TSTM WND, TORNADO, HURRICANE — wildfire/waterspout/flood/snow excluded)
  - Scoped to counties of the visible rows (Manatee-only roofer never sees Miami-Dade events)
- Rows sort by latest hot signal first

**Locked architectural decisions:**
- ❌ Killed the score model. Verifiable facts only — no invented 0-100 numbers.
- ❌ Killed Hillsborough D-file sales feed for now. Sales-data parity must match permit-data parity county-by-county. All-or-none rule.
- ✅ Geospatial Supabase project (`vfmnjwpjxamtbuehmtrv`) reserved for future 10M-row NAL parcel base layer. Not used yet.
- ✅ Lazy-load NAL by county when first paying customer in a new county lands. No statewide pre-ingest.
- ✅ Storm signal at county level for Phase 1. Parcel-radius spatial join is a Phase 3 task (needs NAL coords).

**Operational infrastructure built this session:**
- `tools/run-migration-mgmt.mjs` — applies SQL via Supabase Management API. No more dashboard pasting.
- `tools/lib/supabase-sql.mjs` — reusable raw-SQL helper.
- `automations/README.md` — single source of truth for all crons. Read it when Hannah asks "what's running?"
- Vercel auto-alias verified working 2026-05-01 (Hannah fixed it 2026-04-30). `git push origin main` is now the deploy command.

---

## Phase 2 — Permit precision: Miami-Dade unincorporated (NEXT)

**Why first:** Smallest, most contained build. Verifies the whole "add a permit-data adapter" pattern before doing the bigger Accela ACA scraper in Phase 3.

**Eng estimate:** 1 day.

**Tasks:**
1. New table `roof_permits` on main DB (or extend `property_pipeline_candidates.last_roof_permit_date` — decide first)
2. Build `tools/permit-feeds/miami-dade.mjs` against ArcGIS REST endpoint:
   - `https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/BuildingPermit_gdb/FeatureServer/0/query`
   - No auth, free, weekly refresh (Fridays)
   - Roof DESC1 values: `TILE ROOF`, `ASPHALT (FIBERGLASS) SHINGLE ROOFS`, `METAL, WOOD SHINGLES & SHAKES`, `STRUCTURAL ROOF PANELS`
   - Solar suppression: `SOLAR PHOTOVOLTAIC`, `SOLAR`
   - **Gotcha:** `CURRENT_TIMESTAMP - INTERVAL 'N' DAY` is misinterpreted by ArcGIS — use explicit `DATE 'YYYY-MM-DD'` literal
   - **Gotcha:** Covers UNINCORPORATED Miami-Dade only. 34 munis run their own portals (City of Miami, Coral Gables, Hialeah, etc.) — those are Phase 4
3. Daily cron `/api/cron/ingest-mdc-permits` pulls last 30 days → upserts into `roof_permits`
4. Wire FOLIO → parcel join on `property_pipeline_candidates`
5. Add 🔨 chip rendering for Miami-Dade rows
6. Add to `automations/README.md` as cron #10

**Smoke test verified 2026-05-01:** 1,176 roof permits in last 90d countywide unincorporated. Endpoint healthy.

---

## Phase 3 — Generic Accela ACA scraper (~55 FL counties)

**Eng estimate:** 3-5 days for first county build. +0.5 day per additional county.

**Confirmed ACA tenants (verify each before scraping):**
- Hillsborough (`/hcfl/`)
- Lee (`/LEECO/`)
- Sarasota
- Pinellas
- Pasco
- Charlotte (`/BOCC/`)
- Brevard, Citrus, Polk, Volusia

**Per-county tweaks needed:**
1. URL slug
2. Permit-type dropdown values vary ("Roof", "Roofover", "Re-Roof", "RES ROOF")
3. Which sub-modules are enabled

**Build approach:**
- Single scraper module `tools/permit-feeds/accela-aca.mjs` with per-county config map
- **Use Playwright from day 1** (NOT vanilla fetch) — Cloudflare bot challenges are creeping in on Accela tenants in 2025
- Launch order by population × ease: Hillsborough → Pinellas → Lee → Pasco → Polk → Volusia → Sarasota → Brevard
- Residential proxy pool (Bright Data or similar) only if Cloudflare blocks emerge — don't pre-budget

**Skip Accela Construct API:** Exists but requires per-agency OAuth + business deal. Effectively unusable.

---

## Phase 4 — Custom portals (deferred to paying-customer demand)

Don't touch unless 3+ paying roofers in that county explicitly ask:
- **Orange (FastTrack):** Custom ASP.NET, no permit-type/date filter exposed. Likely needs address-by-address iteration. ~2-3 days.
- **Duval (JaxEPICS):** Login-gated for full search, hash-based detail URLs. ~3-5 days + auth wall risk.
- **Broward + Palm Beach:** 30+ municipal portals each. Defer.

---

## Phase 5 — Optional paid PAYG fallback

- BatchData (~$0.01/call PAYG) for fresh sales in counties without free clerk feeds
- Only wire when a paying roofer in that county explicitly asks for sale precision we can't deliver free

---

## Phase 6 — Sales feeds (parked indefinitely per Hannah's all-or-none rule)

Do NOT wire until permit-data footprint reaches matching parity. Re-evaluate after Phase 3 is live in 5-8 counties.

When ready:
- **Hillsborough:** Free daily D-file at `https://publicrec.hillsclerk.com/OfficialRecords/DailyIndexes/`. Doc-type filter for Warranty Deed. ~1 day eng.
- **Manatee:** Playwright scrape of `https://records.manateeclerk.com/OfficialRecords/Search` (captcha — Hannah will click during first run). ~1 day eng.
- **Miami-Dade:** Paid Commercial Data Services ($110/mo bulk OR $0.20/req API). Defer until paying customer.

---

## Storm signal future improvements (post Phase 2)

Current state: **county-level join.** Every candidate in a county shares the same storm tag. Honest but not differentiating within a county.

When NAL parcel base layer ingests (during Phase 2-3 lazy-load), enable parcel-radius spatial join:
- Pull `lat/lng` from NAL `PHY_ADDR` geocoded
- "Storm events within X miles of THIS parcel" = differentiating
- Banner stays for county-level summary; rows get parcel-specific ⛈️ chip back, but only when truly relevant

Until then: storm in banner only, county-scoped.

---

## Open questions to revisit

1. **Where does `roof_permits` table live?** New table on main DB OR extend `property_pipeline_candidates.last_roof_permit_date` with a join table for full permit history? Lean: separate table for history; keep the denormalized "last permit date" column on candidates for fast reads.
2. **Storm sort weight.** Currently storm doesn't drive row sort. Once we have parcel-radius matching, should it? Depends on how often a parcel-specific storm is more recent than its 🔨/🏠 signals.
3. **Postcard copy variants.** Three needed for Phase 2+: storm-led, sale-led, permit-led. Existing 7 variants are permit-led only (memory `project_pp_step5_7_variants_wired_2026-04-28.md`). Separate beat.
4. **Service-area ZIP picker UX** — handoff plan called for typeahead + paste-textarea. Currently 1-25 ZIPs hard-cap exists in DB constraint. UI overhaul deferred until Phase 3 brings non-Manatee counties live.
5. **Manatee Clerk scraper revisit** — only matters when we re-enable sales feeds (Phase 6). Hannah will click captcha during first run.
6. **Wildfire allowlist edge case.** If a roofer specifically wants wildfire signal (smoke damage, ember-induced damage), we'd need a tenant-level setting. For now: hard exclude. Re-evaluate if a roofer asks.

---

## Files created/modified this session

**New:**
- `app/api/cron/ingest-iem-lsr/route.ts`
- `app/api/pipeline/storm-signals/route.ts`
- `automations/README.md`
- `lib/property-pipeline/signals.ts`
- `supabase/096_storm_events.sql`
- `tools/dryrun-pp-signals.mjs`
- `tools/ingest-iem-lsr.mjs`
- `tools/lib/supabase-sql.mjs`
- `tools/run-migration-mgmt.mjs`

**Modified:**
- `components/dashboard/property-pipeline-tab.tsx` — Signals column + storm banner
- `lib/property-pipeline/queries.ts` — added `county` to SELECT
- `lib/property-pipeline/types.ts` — added `county` to `PipelineCandidate`
- `vercel.json` — registered new cron at 06:30 UTC

**Stale memory corrected:**
- `reference_storm_stats_module.md` — was claiming HURDAT2/FEMA module shipped; verified 2026-05-01 it never did. Replaced with corrected entry.
- `feedback_vercel_deploy_then_alias.md` — was claiming auto-alias broken; verified 2026-05-01 fixed. Replaced.

---

## Commits shipped

- `ebfc7c1` feat(pp): wire IEM storm signals + tag column on Property Pipeline dashboard
- `e9a4e8b` fix(pp): demote storm chip to county banner + restore older sale years as faint text
- `0ddf798` fix(pp): scope storm banner to visible counties + drop non-roof typecodes

---

## How to verify state on resume

```bash
# Confirm cron is registered
grep -A1 "ingest-iem-lsr" vercel.json

# Check storm event count + most recent
node -e "
import('./tools/lib/supabase-admin.mjs').then(async ({supabase}) => {
  const {count} = await supabase.from('storm_events').select('*', {count:'exact', head:true});
  const {data} = await supabase.from('storm_events').select('valid_at, typecode, county').order('valid_at', {ascending:false}).limit(3);
  console.log('total:', count); console.log('recent:', data);
});
"

# Confirm dashboard endpoint live
curl -s -o /dev/null -w "%{http_code}\n" https://ruufpro.com/api/pipeline/storm-signals
# Expect 401 (auth required = code is live)

# Eyeball production
open https://ruufpro.com/dashboard/pipeline
```

---

## Master plan reference

Original full plan with Phase 0-5 + risk table + UX spec:
[`research/handoff-2026-05-01-property-pipeline-statewide-expansion.md`](handoff-2026-05-01-property-pipeline-statewide-expansion.md)

This handoff is the *delta* — what shipped and what to do next. The plan is still the strategy doc.
