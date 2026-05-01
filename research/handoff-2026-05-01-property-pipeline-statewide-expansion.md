# Property Pipeline — Statewide Expansion Handoff

**Date:** 2026-05-01
**Session goal:** Plan the redesign of the Property Pipeline dashboard page from "Manatee-only roof permit leads" to a statewide FL multi-signal feed without sacrificing data quality.
**Branch:** plan only — no code yet

---

## The decision (locked)

We are going **Path 1 + Path 4** — permit-led where we have data + universal verifiable signals (recent sales, recent storms) everywhere else.

**Hard rules — non-negotiable:**
1. **Every signal shown to a roofer must be a verifiable fact.** No proxies dressed up as data. No `eff_yr_blt` (resets on kitchen remodels too — not roof-specific). No "year built ≥ 18 yrs ago therefore old roof."
2. **The page is reframed from "homes likely needing roofs" → "high-intent homeowners in your service area."** Each lead carries one or more verifiable tags: 🏠 sold recently, ⛈️ in recent storm path, 🔨 last roof permit Y years ago. Roofer judges from real facts.
3. **No upfront data spend.** Bootstrapped — every data source must be free or pay-as-you-go.

---

## Verified data sources

### A. FL Statewide property base layer (FREE)
**FL DOR Tax Roll Data — NAL + SDF + NAP**
- **Portal:** https://floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx
- **Files:** Per-county zipped CSVs in `NAL/`, `SDF/`, `NAP/` subfolders. Pattern: `{County} {N} Final NAL 2025.zip`
- **Fields (NAL):** `PARCEL_ID`, `ACT_YR_BLT`, `EFF_YR_BLT`, `JV`, `LND_VAL`, `OWN_NAME`, `OWN_ADDR1/2`, `PHY_ADDR1/2` (situs), `SALE_PRC1`, `SALE_YR1`, `SALE_MO1` (most recent 2 sales inline)
- **Refresh:** Annual (preliminary July, Final October). Sale data lags 6-12 months — **NOT usable for fresh sales.**
- **Size:** ~10M FL parcels; full statewide ~5GB CSV / ~700MB-1.5GB zipped
- **License:** FL §119 public record, commercial use OK. No DOR ToS restriction. (FL §501.171 owner-name marketing concern is a separate legal-review item — already on Hannah's radar.)
- **Use:** Property base layer — addresses, parcels, value, situs. NOT used for roof age.
- **Reference docs:**
  - [2025 NAL/SDF/NAP User's Guide PDF](https://floridarevenue.com/property/dataportal/Documents/PTO%20Data%20Portal/User%20Guides/2025%20Users%20guide%20and%20quick%20reference/2025_NAL_SDF_NAP_Users_Guide.pdf)
  - [2018 NAL Field Reference (schema stable)](https://floridarevenue.com/property/Documents/2018NALfields.pdf)

### B. Fresh sales (FREE — Hillsborough only; scrape/paid elsewhere)
**Hillsborough County Clerk daily bulk D-files** — the gold standard
- **URL:** https://publicrec.hillsclerk.com/OfficialRecords/DailyIndexes/
- **Files:** Daily `D` (all docs), `P` (party index), `M` (FACC doc-code map). YYYYMMDD-named, ~2 months retention.
- **Filter:** Doc-type code for Warranty Deed → join to property address by parcel.
- **Refresh:** Daily.
- **Cost:** Free.
- **Verdict: WIRE FIRST.**

**Manatee Clerk** — https://records.manateeclerk.com/OfficialRecords/Search
- Web search only, no API, no bulk download. Doc-type filter (WD, SWD, QCD) supported.
- **Verdict:** Scrape with Playwright. Eyeball captcha behavior with first run.

**Miami-Dade Clerk** — paid Commercial Data Services
- Bulk Official Records folder: $110/mo. API: $0.20/req (too expensive for our volumes).
- https://www.miamidadeclerk.gov/clerk/commercial-data-services.page
- **Verdict:** Defer until paying customers in Miami-Dade.

**Other 64 FL county clerks:** mix of free scrapeable + paid. Do per-county discovery as we expand.

### C. Storm signal (FREE)
**Iowa Environmental Mesonet (IEM) Local Storm Reports**
- **API:** https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py
- **Example (FL last 90d, CSV):** `?state=FL&recent=7776000&fmt=csv`
- **Fields:** VALID, MAG, TYPECODE (HAIL, TSTM WND DMG, TORNADO, etc.), CITY, COUNTY, STATE, LAT, LON, UGC, REMARK
- **Refresh:** Every 5 minutes
- **License:** Free, attribution requested
- **Verdict: WIRE — replaces NCEI Storm Events for "last 90 days" freshness.**

We also have HURDAT2 + FEMA already wired in `lib/property-pipeline/storm-stats.ts` (per memory `reference_storm_stats_module.md`) — that stays as the historical 20-yr layer.

### D. Roof permit precision (county-by-county)

#### D.1 Miami-Dade unincorporated — ArcGIS REST (FREE)
- **Endpoint:** `https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/BuildingPermit_gdb/FeatureServer/0/query`
- **Auth:** None
- **Refresh:** Weekly (Fridays)
- **Roof DESC1 values:** `TILE ROOF`, `ASPHALT (FIBERGLASS) SHINGLE ROOFS`, `METAL, WOOD SHINGLES & SHAKES`, `STRUCTURAL ROOF PANELS`
- **Solar suppression DESC1:** `SOLAR PHOTOVOLTAIC`, `SOLAR`
- **Smoke test (verified 2026-05-01):** 1,176 roof permits last 90 days countywide. 99 solar permits last 90 days.
- **Critical gotcha:** Covers **unincorporated Miami-Dade only.** 34 munis run their own portals (City of Miami uses Accela `iBuild`; Miami Beach, Coral Gables, Hialeah all separate). ZIP 33133 (Coconut Grove / City of Miami) returned **0 hits** in smoke test.
- **Critical gotcha #2:** Do NOT use `CURRENT_TIMESTAMP - INTERVAL 'N' DAY` in WHERE — ArcGIS misinterprets it. Always pass explicit `DATE 'YYYY-MM-DD'` literal.
- **Eng estimate:** 0.5 day adapter.

#### D.2 Generic Accela ACA scraper (covers ~55 of 67 FL counties)
- **Tenants confirmed on ACA platform:** Hillsborough (`/hcfl/`), Lee (`/LEECO/`), Sarasota, Pinellas, Pasco, Charlotte (`/BOCC/`), Brevard, Citrus, Polk, Volusia (verify each before scraping)
- **DOM is templated:** Same ASP.NET WebForms (`__VIEWSTATE`, `__EVENTVALIDATION`, `__doPostBack`), same `Cap/CapHome.aspx?module=Building` URL pattern, same `ctl00$PlaceHolderMain$ddlPermitType` field IDs across all ACA tenants.
- **Per-county tweaks:** (a) URL slug, (b) permit-type dropdown values vary ("Roof", "Roofover", "Re-Roof", "RES ROOF"), (c) which sub-modules are enabled.
- **Cloudflare risk:** Some tenants started rolling Cloudflare bot challenges on heavy paths in 2025. Plan for **Playwright + residential proxies** in production, not vanilla `fetch`.
- **Robots.txt:** `aca-prod.accela.com/robots.txt` returns 404. No explicit disallow on `/Cap/`.
- **Accela Construct API:** Exists but requires per-agency OAuth + business deal. Effectively unusable for our use case. Stick with ACA scraping.
- **Eng estimate:** 3-5 days for first-county build. +0.5 day per additional county for dropdown-value mapping.

#### D.3 Custom-portal counties (deferred)
- **Orange (FastTrack):** Custom ASP.NET app at `https://fasttrack.ocfl.net/OnlineServices/PermitsAllTypes.aspx`. Search inputs limited (Address / File# / Parcel only — no permit-type or date-range filter exposed). Likely needs address-by-address iteration from parcel list. **Eng: 2-3 days.** Defer until paying customer demand.
- **Duval (JaxEPICS):** Custom, login-gated for full search. Hash-based detail URLs. Engineered for human browsing. **Eng: 3-5 days + risk of auth wall.** Defer.
- **Broward + Palm Beach:** 30+ municipal portals each. Defer until paying customer demand.

#### D.4 Manatee — already wired ✅
- Existing scraper. (Note: agent flagged Manatee may be on CDPlus not ACA — verify.)

---

## Phased build plan

### Phase 0 — Plan handoff (this doc)
✅ Complete

### Phase 1 — Statewide base + universal signals (3-5 days eng)
**Goal:** Every FL ZIP has at least sale + storm signals on day one.

1. **Ingest FL DOR NAL** (statewide) → Postgres `properties` table
   - Schema: `parcel_id`, `county_fips`, `situs_addr`, `zip`, `lat`, `lng`, `act_yr_blt`, `eff_yr_blt`, `jv`, `last_sale_yr`, `last_sale_price`
   - One-shot annual refresh script (`tools/ingest-fl-dor-nal.mjs`)
   - ~10M rows. Indexed by ZIP, parcel_id, county_fips.
2. **Wire IEM LSR storm feed** → Postgres `storm_events` table
   - Daily cron pulls last 7 days of FL events. Backfill 5 years on first run.
   - Schema: `event_id`, `valid_at`, `mag`, `typecode`, `lat`, `lng`, `county`, `ugc`, `remark`
   - Geocode lat/lng → ZIP via internal lookup (we already have ZIP polygons for NOAA module).
3. **Wire Hillsborough Clerk daily D-file ingest** → `recent_sales` table
   - Daily cron parses yesterday's D-file, filters Warranty Deeds, joins to parcel by address.
   - Schema: `parcel_id`, `recorded_at`, `doc_type`, `grantee_name`, `grantor_name`
4. **Wire Manatee Clerk scrape** (Playwright) → same `recent_sales` table
5. **Build scoring + tagging service** (`lib/property-pipeline/scoring.ts`)
   - Outputs per-property: tags array (`['recent_sale', 'storm_path']`), score 0-100
   - Score formula (verified inputs only):
     ```
     score =
       60 × (years_since_last_roof_permit / 25, capped)   if permit data
     + 25 × storm_exposure_score (0-1)                    NOAA + IEM
     + 15 × (months_since_last_sale / 6, inverse, capped) recent sale boost
     - 50 × has_solar_permit_last_24mo                     suppression
     - 40 × already_mailed_this_year                       suppression
     ```
   - **Properties with no roof permit data + no recent sale + no recent storm get a "low signal" tag and a score floor — they don't surface.**

### Phase 2 — Permit precision: Miami-Dade unincorporated (1 day eng)
1. Add Miami-Dade ArcGIS REST adapter (`tools/permit-feeds/miami-dade.mjs`)
2. Daily cron pulls last 30 days of permits, upserts into `roof_permits` table.
3. Joins on FOLIO → parcel.
4. Page now shows 🔨 tag for properties in unincorporated Miami-Dade.

### Phase 3 — Generic Accela ACA scraper (3-5 days eng)
1. Build single scraper module (`tools/permit-feeds/accela-aca.mjs`) with per-county config map
2. Launch counties in this order (population × ease of scraping):
   - Hillsborough → Pinellas → Lee → Pasco → Polk → Volusia → Sarasota → Brevard
3. Each new county = 0.5 day for dropdown mapping + smoke test
4. Use Playwright (not fetch) from day one to dodge Cloudflare risk
5. Add residential proxy pool (Bright Data or similar) ONLY if Cloudflare blocks emerge

### Phase 4 — Custom portals (deferred to paying-customer demand)
- Orange (FastTrack), Duval (JaxEPICS), Broward munis, Palm Beach munis
- Trigger: 3+ paying roofers in that county requesting permit precision

### Phase 5 — Optional paid PAYG fallback
- BatchData (~$0.01/call PAYG) for fresh sales in counties without free clerk feeds
- Only wire when a paying roofer in that county explicitly asks for permit/sale precision we can't deliver free

---

## Page UX spec

### Header
- Title: **"Property Pipeline — High-Intent Homeowners"**
- Service-area selector (ZIPs): typeahead + paste-textarea modal
- Coverage indicator: `[N] of your ZIPs covered for permit data · [M] sale + storm only · [vote a county up the queue]`

### Empty state (zero ZIPs)
- "Add the ZIPs you serve to see homeowner intent signals in your area."

### Empty-coverage state (ZIPs with no signals this week)
- "No new high-intent homeowners in your ZIPs this week. We check daily."
- DO NOT pad the list with low-confidence properties.

### Filters (left rail)
- Tag filter (multi-select): 🔨 Roof permit ≥ 7yr · 🏠 Sold last 90d · ⛈️ Recent storm
- Property value floor (filters mobile homes, default $150k)
- Hide already-mailed (default on)
- Hide properties with solar permit in last 24mo (default on)
- Score floor (default 50)

### Candidate list (center)
- Default: Table. Toggle: Map (defer map to v2).
- Cols: Address · ZIP · **Tags** · **Score** · Status
- **Tags column shows verifiable facts only:**
  - 🔨 "Last roof permit: 2014" (if permit data exists)
  - 🏠 "Sold Mar 2026" (if recent sale)
  - ⛈️ "Hurricane Helene path Sept 2024" (if recent storm)
  - 🚫 (hidden — solar suppression filtered out by default)
- Score badge: 🟢 80+ / 🟡 60-79 / ⚪ <60
- Score tooltip: "Built from: roof permit 2014 (60pts) + Hurricane Helene path (25pts) + sold Mar 2026 (12pts)" — shows the receipts.
- Row click → renders the actual postcard preview for that home (3D Tiles + storm stats, already built per memory).

### This week's batch (right rail)
- Top 25-50 unmailed properties by score in roofer's ZIPs
- "Send all" one-click within bundle, or "Send + cover overage at $X"

### Mailing history & outcomes (bottom)
- Sortable: home · sent date · QR scanned · lead created · revenue tagged
- This is the proof loop justifying $149/mo

### Outreach implications (separate from page UX but locked)
- **Property Pipeline is NOT the headline value prop in cold email** for roofers in counties without permit precision yet.
- Headline pitch: Riley + widget + review automation + lead dashboard.
- Property Pipeline = closer, with honest framing: "feed of high-intent homeowners (recent sales + storm path) — counties where we have permit data add the precision layer of homes 7+ years past last roof permit."

---

## Data quality guardrails (enforce in code)

1. **Never invent a roof age.** Only show 🔨 tag when actual permit data exists for that parcel.
2. **Never claim "old roof" in copy.** Postcard copy adapts based on tags present:
   - Permit-led: "Public records show your last roof permit was [year]..."
   - Storm-led: "Your home was in the path of [storm name] on [date]..."
   - Sale-led: "We noticed you recently moved into [address]..."
3. **Show the receipts.** Every score has a breakdown tooltip.
4. **Honest empty states.** No padding with weak signals to fill space.
5. **Solar suppression default on.** Don't mail homes that just got solar (they reroofed first).

---

## Open questions for the build session

1. **Confirm Manatee permit scraper platform** — agent flagged it might be CDPlus not ACA. Read `tools/` for current Manatee scraper before generic ACA build.
2. **Verify NAL field names against the 2025 user guide PDF** — agent couldn't parse the binary. Download and grep before ingest.
3. **Decide map view priority** — ship table-only first, defer map?
4. **County voting UX** — modal? sidebar? Where do uncovered roofers click "request my county"?
5. **Postcard copy variants** — three new templates needed (storm-led, sale-led, permit-led). Existing 7 variants per memory `project_pp_step5_7_variants_wired_2026-04-28.md` are permit-led only.
6. **Cloudflare residential-proxy budget** — wait until first block, or pre-emptively wire Bright Data?
7. **NAL refresh cadence** — annual is OK for the base layer (addresses don't change). When DOR posts 2026 NAL in July 2026, what's the upgrade workflow?

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Accela rolls out Cloudflare bot challenge mid-build | Use Playwright from day 1, budget for residential proxies |
| Hillsborough Clerk D-file format changes | Daily smoke test alarms on parse failure |
| Miami-Dade ArcGIS endpoint moves or schema changes | Pin to FeatureServer URL + DESC1 values; wrap in adapter with error budget |
| FL DOR NAL 5GB ingest blows up Postgres | Stream-parse + COPY FROM, partition by county_fips, target 30-min ingest |
| Roofer mails a home that just sold to someone who reroofed | Suppression list joins permit + clerk data; never rely on sale alone |
| Score formula gives false confidence | Always show breakdown tooltip; allow roofer to filter by individual tags |
| Legal: FL §501.171 owner-name marketing | Already addressed — postcard never names the owner. Confirm with attorney before live send. |

---

## Files this build will touch / create

**New:**
- `tools/ingest-fl-dor-nal.mjs` — annual statewide property base
- `tools/ingest-iem-lsr.mjs` — daily storm feed
- `tools/clerk-feeds/hillsborough-daily.mjs` — daily Hillsborough sales
- `tools/clerk-feeds/manatee-scrape.mjs` — Manatee scraper
- `tools/permit-feeds/miami-dade.mjs` — ArcGIS REST adapter
- `tools/permit-feeds/accela-aca.mjs` — generic ACA scraper
- `lib/property-pipeline/scoring.ts` — score + tag formula
- `lib/property-pipeline/coverage.ts` — county-coverage registry
- DB migrations: `properties`, `storm_events`, `recent_sales`, `roof_permits` tables

**Existing (modify):**
- `app/dashboard/pipeline/*` — page redesign per UX spec above
- `lib/property-pipeline/storm-stats.ts` — keep, add LSR layer
- `lib/property-pipeline/postcard-template.tsx` — add 3 new copy variants (storm-led, sale-led, permit-led)
- `app/dashboard/pipeline/setup/*` — extend service-area picker for ZIPs

**Reference:**
- Memory: `project_pp_step5_7_variants_wired_2026-04-28.md` (existing postcard variants A-G)
- Memory: `reference_storm_stats_module.md` (existing storm stats)
- Memory: `project_pp_postcard_landing_roof_card_locked_2026-04-28.md` (existing landing page)

---

## Suggested next-session opening prompt

> Read `research/handoff-2026-05-01-property-pipeline-statewide-expansion.md`. We're expanding Property Pipeline from Manatee-only to FL-statewide using verified-only signals (no proxies). Start with Phase 1: ingest FL DOR NAL + IEM LSR storm feed + Hillsborough Clerk daily D-file. Build the scoring service. Don't touch the dashboard UI yet — get the data layer right first. Confirm Manatee scraper platform before we reuse it for the generic Accela build.

---

## Sources cited (all verified 2026-05-01)

- [FL DOR Data Portal](https://floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx)
- [Miami-Dade Building Permit dataset metadata](https://opendata.miamidade.gov/datasets/building-permit/about)
- [Miami-Dade Feature Service REST](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/BuildingPermit_gdb/FeatureServer/0)
- [Hillsborough Clerk daily files](https://publicrec.hillsclerk.com/OfficialRecords/DailyIndexes/)
- [Manatee Clerk Official Records](https://records.manateeclerk.com/OfficialRecords/Search)
- [IEM Local Storm Reports API](https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py)
- [HillsGovHub Accela Citizen Access](https://aca-prod.accela.com/hcfl/Default.aspx)
- [OC FastTrack](https://fasttrack.ocfl.net/OnlineServices/PermitsAllTypes.aspx)
- [JaxEPICS](https://jaxepics.coj.net/)
- [Accela Construct API docs](https://developer.accela.com/docs/api_reference/v4.get.records.html)
