> # 🗄️ ARCHIVED — research input only
>
> **Status as of 2026-04-26 PM:** Original research drop. Useful for *context* on the
> market, competitor landscape, and FL legal background. Strategic recommendations and
> implementation specifics here have been **superseded** by the simplified MVP path.
>
> **Active spec:** [`decisions/property-pipeline-mvp-source-of-truth.md`](../decisions/property-pipeline-mvp-source-of-truth.md)
>
> Read this doc only when you need market context, competitor (Lead-Spy) detail, or
> FL §489.119/§489.147 background. Do NOT enforce its "Locked decisions" or
> "MVP destination" sections — those are obsolete.

---

# Property Pipeline — Research → Planning Handoff [ARCHIVED]

**Date:** 2026-04-26
**Status:** ARCHIVED — superseded by MVP source-of-truth same day
**Original purpose:** Research input for planning agent

> **AMENDMENT 2026-04-26:** First-county MVP pivoted from Sarasota to **Manatee**. Sarasota deferred to Week 2 expansion. Reasoning + cascading implications: see `decisions/property-pipeline-geography-pivot.md`. The Sarasota references throughout this doc are preserved for reasoning context but **superseded** for the MVP build.

---

## What this doc is

A self-contained handoff. The planning agent will read this cold (no prior conversation context) and have everything needed to design the implementation plan for **Property Pipeline** — a new RuufPro feature that delivers in-market homeowner leads (homes with no roofing permit in 20+ years) and orchestrates direct-mail outreach to them.

This is the result of a deep research session: competitor audit, codebase audit, FL market dynamics, permit-portal scrape capability, match-rate methodology, pricing model.

---

## The opportunity (1 paragraph)

FL roofers are bleeding on Angi/HomeAdvisor ($100+/lead, sold 5x, recycled). The closest direct competitor (Lead-Spy) covers FL+CO with ~28 jurisdictions but has thin moat (no founders, no testimonials, single-signal data, no CRM follow-up, no Sarasota coverage). Florida is in a re-roof boom driven by Hurricane Milton (Oct 2024) tail demand, insurance non-renewals (FL up 280% since 2018), and the $600M My Safe FL Home grant program clearing a 45,000-homeowner backlog. Critical timing: SB 808 (introduced, not passed) would ban age-only insurance non-renewals on July 1, 2026, neutering the strongest direct-mail copy angle. **The next 90-120 days are the highest-leverage launch window of the next 24 months.**

---

## Locked decisions (Hannah-confirmed in research session — do not re-litigate)

1. **Pricing:** Bundle inside existing Pro $149/mo. No new tier.
2. **Universe definition:** Homes with NO roofing permit in 20+ years (matches Lead-Spy's threshold).
3. **First geography:** ~~Sarasota County~~ **Manatee County** (single-county MVP, pivoted 2026-04-26 — see `decisions/property-pipeline-geography-pivot.md`). Standard Accela harness reusable across most of FL by population. Sarasota deferred to Week 2 expansion (custom Blazor SPA, ~+1.5 days, conditional on Manatee scraper stability). Pinellas/Hillsborough later via same Accela harness. The "novel territory" wedge is dropped — wedge is now product depth (multi-signal + Riley + multi-touch + Lead Dashboard).
4. **MVP destination:** ~~Internal validation only. No external roofer customer until product is shipped and proven.~~ **Amended 2026-04-26 (planning Round 3 Q7):** Internal validation runs in parallel with **one DESIGN PARTNER (not customer)** for legal cover under FL §489.119/§489.127 + the ~70% of validation that internal-only cannot prove (homeowner response, conversion, roofer workflow). Common Paper Design Partner Agreement, 90 days fixed, free during pilot, Lob costs at-cost, locked $99/mo for 12 months post-pilot, no exclusivity, 7-day termination either side. Indemnity split: roofer for advertising content compliance (license # accuracy, §489.147), RuufPro for delivery + data + opt-out. This is structurally distinct from a paying customer and is the only legal path — §489.119 has no test/research/internal-development exemption; trigger is content (offer/depict roofing services), not intent or recipient. Internal test mail with NO roofing offer/depiction (explicit "PRODUCT DEVELOPMENT — NOT A SOLICITATION" framing) is permitted in parallel for pipeline QA (Days 8–30) before design partner is onboarded.
5. **UX shape (3 surfaces):**
   - **Service-area picker (one-time at signup, editable in Settings):** roofer draws their service area on a map → saved → all weekly scans hit only that area
   - **Push delivery (recurring):** every Monday, fresh in-market homes auto-drop into the Lead Dashboard, no roofer action required
   - **No-auth ZIP demo on ruufpro.com marketing site:** prospect types ZIP → sees live count of in-market homes in their area → conversion hook (copy Lead-Spy's #1 activation pattern). Same plumbing as the product, different surface.
6. **Recurring revenue model = metered postcard credits** (Option A, mirrors Lead-Spy):
   - Pro $149/mo includes ~75-100 Property Pipeline postcard credits/month
   - Lob fulfillment cost (~$65/mo at 100 postcards) built into bundle
   - "Use it or lose it" — credits do NOT roll over
   - Roofer can choose: mail through us (Lob) OR pull leads to CSV for their own outreach
   - Caps protect $149 unit economics; Pro Plus tier is a v2 problem
7. **Ad-hoc polygon scans inside the product:** DEFERRED to v2. Subscription pricing makes them unnecessary at MVP.
8. **Cross-contractor dedup:** two roofers in same ZIP cannot mail the same homeowner same week — required in MVP.

---

## Competitor reality (Lead-Spy is the only one that matters)

**Lead-Spy** (lead-spy.com) — closest direct competitor, deeply audited.

- **Stack:** Render.com + Cloudflare + Python FastAPI backend + hand-rolled HTML/Leaflet frontend. Bootstrap, small team, no QA (pricing page contradicts homepage by 50%).
- **Mail vendor:** Lob (confirmed in privacy policy). They charge $1.60-1.90/postcard on ~$0.65 Lob cost = 145-190% markup.
- **Data sources:** County permit portal scraping (Accela, OpenGov, eTrakit) + free FL parcel shapefiles (Sunshine Law). NOT ATTOM/BuildFax/CoreLogic — the math doesn't work at $150/mo plans.
- **The entire IP is one PostGIS query:** `parcels LEFT JOIN permits WHERE no_roof_permit_20yr`.
- **Pricing:** Pro $150/mo = 100 postcards OR 250-300 lead credits. Growth $300/mo = 200 postcards OR 500-700 leads. Credits don't roll over.
- **Coverage:** 24 FL counties + 4 CO. Manatee IS covered (positive demand signal — buyers exist). Sarasota NOT covered (originally framed as wedge — dropped 2026-04-26 in favor of Manatee-first reusable Accela harness).
- **Trust holes:** No founder names, no LinkedIn, no testimonials, no case studies, no G2/Capterra. "By contractors for contractors" with zero faces.

**The 5 wedges to exploit (each maps to RuufPro's existing strengths):**
1. Real founder + face + 3 real FL roofer testimonials → trust beat
2. Multi-signal scoring (permit absence + FEMA exposure + roof age estimate) → fewer false positives
3. Riley + Lead Dashboard wiring → QR scan becomes a conversation, not a missed call
4. ~~Sarasota coverage from day one → no head-to-head with Lead-Spy~~ **DROPPED 2026-04-26.** Wedge moved from territory to product depth: multi-signal scoring + Riley QR-to-conversation + 3-touch angle rotation + integrated Lead Dashboard. Manatee competes head-to-head with Lead-Spy on product, not coverage gap.
5. My Safe FL Home grant copy angle → "FL pays $2 for every $1 you spend, up to $10K" — competitors use insurance threat almost exclusively, MSFH is the biggest copy whitespace right now

**Other competitors (researched, not direct threats):** RoofPredict (door-knock-first, enterprise), Datazapp (cheap data only, no workflow), PropertyRadar/BatchLeads (REI-first generalists), EagleView (enterprise, $100K+ marketing budget customers), BuildZoom/Dataman (adjacent, not competitive).

---

## What already exists in the RuufPro codebase

Property Pipeline is **70% built before we start** because RuufPro's Property Intel infrastructure is reusable.

| Component | File | Status |
|---|---|---|
| Property data cache (owner, address, year built, value) | `supabase/017_property_data_cache.sql` | EXISTS |
| RentCast API wrapper (returns current owner inline) | `lib/rentcast-api.ts` | EXISTS |
| Property intel API endpoints | `app/api/property-intel/route.ts` | EXISTS |
| Leads table with `property_data_id` FK | `supabase/001_initial_schema.sql:85` | EXISTS |
| Lead Dashboard renders owner/age/value | `components/dashboard/lead-list.tsx` | EXISTS |
| Heat scoring infra | `lib/heat-score.ts` | EXISTS — extend |
| Riley/chatbot ↔ lead linkage | `supabase/048_ai_chatbot.sql:14` (`chat_conversations.lead_id`) | EXISTS — QR → `/chat/[id]?lead=X` works today |
| Cron template for weekly batch | `app/api/cron/weekly-scrape/route.ts` | EXISTS — copy-paste-able |
| FEMA flood + disaster data | `lib/fema-api.ts` | EXISTS |
| Direct mail copy research | `research/direct-mail-letter-research.md` | EXISTS |
| Direct mail prospect-side flow (different surface — DO NOT confuse) | `app/ops/direct-mail/page.tsx` | EXISTS but for roofer-prospects, not homeowners |
| Permit / parcel / Regrid / ATTOM / Lob references | — | **ZERO. Greenfield.** |

**Key insight:** the hardest "is this even possible" question (match permits to current owners) is solved by RentCast — which RuufPro already pays for and already stores results in `property_data_cache`.

---

## What's greenfield (must build)

1. **Manatee** permit scraper — dual-source: Accela ACA (`aca-prod.accela.com/MANATEE/`, 2018→today) + mymanatee.org legacy archive (2005→2018-Feb-28). Standard Accela harness reusable across Pinellas/Hillsborough/Lee/Polk/Brevard/Volusia. Sarasota deferred to Week 2 (custom Blazor SPA + SignalR, separate component).
2. `roof_permits` storage table + new migration
3. `property_pipeline_candidates` table + scoring/dedup logic
4. Service-area map UI (signup + Settings) — Mapbox GL JS + draw plugin
5. Weekly cron route (copy-paste from `weekly-scrape/route.ts`)
6. Lead Dashboard "Property Pipeline" filter chip
7. Lob client + postcard template + send route + webhook handler
8. Postcard credit metering (Stripe entitlement check or Supabase counter)
9. Cross-contractor weekly dedup logic
10. No-auth ZIP demo on marketing site (separate page on ridgeline-v2)

---

## Effort estimate (Hannah-days, Claude-paired)

| Component | Days |
|---|---|
| Manatee permit scraper (dual-source: Accela + mymanatee.org legacy) | 1.5 |
| Permit storage + normalization migration | 0.25 |
| Owner match (extend RentCast) | 0.5 |
| Scoring + dedup | 0.5 |
| Weekly cron + leads insert + source CHECK constraint patch | 0.5 |
| Service-area map UI (signup + Settings) | 1.0-1.5 |
| Dashboard "Property Pipeline" filter chip | 0.5-0.75 |
| Lob integration + letter template + webhook | 1.5-2.0 |
| Postcard credit metering (cap enforcement) | 0.5 |
| Cross-contractor dedup | 0.25 |
| No-auth ZIP demo on marketing site | 0.75-1.0 |
| Riley QR landing param wiring | 0.25 |
| QA + 1-county dry run + dedup tuning | 1.0 |
| **Total v1 (Manatee)** | **8.5-11.0 days** |
| Sarasota Week 2 expansion (Blazor SPA scraper, conditional on Manatee stable) | +1.5 |

**Pre-build gate (must run before any code):** 100-row sniff test = 1 day. Validates that aged-roof permit data → current owner → actually-aged roof has ≥50% net good-lead rate. Tools: county appraiser sites + Google Earth Pro historical imagery + Street View. Decision threshold:
- ≥95% have resolvable current owner + mailable address (should be near-trivial)
- ≥60% pass aerial + Street View "actually aged" check
- ≥50% net good-lead rate after sale-date filter
- Yellow light (50-60%): build but tighten filters
- Red light (<50%): kill it

---

## Critical risks (ranked)

1. **Permit-portal scraping fragility.** Accela DOM can change monthly. Plan for re-scrapes. Build with rotating headers + polite delays from day 1. Consider Firecrawl MCP wrapper as fallback.
2. **Un-permitted re-roof false positives (5-15% of FL re-roofs).** A homeowner who replaced their roof without a permit is wasted mail. Lead-Spy's disclaimer is CYA but the issue is real. Mitigation: aerial validation layer (Google Earth Pro change-detection for v1; CAPE Analytics / ZestyAI for v2 if scale demands).
3. **RentCast cost at scale.** ~$0.10-0.20/lookup, 50/mo free tier. 1,000 permits/mo/roofer = $100-200/mo data cost. Margin pressure on $149 tier. Cache aggressively (already cache-first); evaluate Regrid for bulk owner data if RentCast becomes the bottleneck.
4. **Lob first-letter approval.** 1-3 business day vendor review. Start the clock when planning starts; build in parallel.
5. **`leads.source` CHECK constraint** must be migrated to add `'property_pipeline'` BEFORE first insert. Silent 400s otherwise (Hannah was burned by this exact pattern recently — see `dc82bd4` post-mortem).
6. **Cross-contractor dedup window.** Two roofers in same ZIP both mailing the same homeowner same week = bad UX. Required in MVP; not a v2 add.
7. **SB 808 timing risk.** If FL bans age-only insurance non-renewals on July 1, 2026, the dominant copy angle weakens. Launch by June 1 or pivot to MSFH-grant frame.
8. **Recurring-revenue framing.** This is NOT a "fresh leads every week" product (universe is mostly static, ~5-15K homes per service area). It IS a "managed direct-mail campaign on your aged-roof universe" — the postcard credit metering + suppression + multi-touch cadence + response capture is what recurs. Marketing copy must reflect this honestly or roofers will churn at month 6.

---

## Open questions for planning (these need decisions, not more research)

1. **Direct-mail copy angle for MVP postcard.** Options ranked: (a) insurance threat — "Your insurer is watching your roof's birthday"; (b) hurricane urgency — "Hurricane season starts June 1"; (c) My Safe FL Home grant — "$2-for-$1 match up to $10K, 45,000-person waitlist." MVP needs ONE primary angle for first send. Lean: (a) for May-June launch, swap to (c) if SB 808 passes.
2. **Postcard creative production.** Who designs the postcard? Hannah, Claude+Figma, or template marketplace? Lob accepts HTML or PDF; HTML iterates faster.
3. **Service-area picker — county-level dropdown vs polygon-draw at MVP?** Polygon is more flexible but costs ~1 extra day. County-level is faster to ship, less flexible.
4. **Sniff test data source.** RentCast (paid, in-tree) or county appraiser sites (free, manual)? RentCast is faster but burns ~$15-20 for 100 lookups. Appraiser sites are free but slow.
5. **How does the postcard credit cap surface to the roofer?** Hard stop at 100? Soft warning at 80? Email warning at 90?
6. **Cross-contractor dedup window.** 7 days? 14 days? 30 days?
7. **Marketing site no-auth demo — ship with MVP or after?** Recommended with MVP since it's the #1 activation pattern. Adds ~1 day.

---

## Recommended MVP scope (planning starting point)

**MVP = Manatee County, 1 internal Hannah-controlled test "roofer," end-to-end shipped.** (Sarasota Week 2 conditional — see geography pivot doc.)

Phase 1 — Validate (1 day, gate)
- 100-row sniff test before any code
- Decision: green/yellow/red light

Phase 2 — Build (8.5-11 days assuming green light)
- Manatee dual-source scraper (Accela + mymanatee.org legacy) → `roof_permits` table → cross-ref via RentCast → `property_pipeline_candidates` → scoring → weekly cron → leads insert → dashboard filter chip → service-area ZIP multi-select (Settings) → Lob client + template + webhook → postcard credit metering → cross-contractor dedup
- No-auth ZIP demo on marketing site (parallel)

Phase 3 — Ship (Hannah-internal validation)
- Hannah signs up as test contractor → selects Manatee service area ZIPs → first Monday drop arrives → mails 50 postcards via Lob → tracks QR scans → measures actually-good-lead rate
- Two-week observation window before pitching to first real roofer

**Hard out-of-scope for MVP:**
- Pinellas, Hillsborough, any non-Manatee county (Sarasota Week 2 expansion is in-scope but conditional, not MVP-critical)
- Polygon-draw scans inside the product (deferred to v2)
- Pro Plus tier / postcard credit upgrades (v2)
- LiDAR roof-age validation layer (v2 — uses CAPE/ZestyAI, costs money)
- SMS / email follow-up sequences from the dashboard (Riley + email already in product, sufficient)
- Multi-state expansion

---

## Timing constraints

- **Launch window: May-August 2026** = highest-leverage 4 months of the next 24
- **Hard deadline: July 1, 2026** = SB 808 risk (kills insurance-threat copy if passed)
- **Lob first-letter approval: 1-3 business days** = start clock at planning kickoff
- **Hurricane season: starts June 1** = mailings landing late May / early June ride the urgency wave

---

## Source research files (read these for depth)

All inline in this conversation's research; key external sources captured below for planning agent reference.

**Lead-Spy (most-audited competitor):**
- https://www.lead-spy.com (homepage, pricing, coverage, our-story, privacy, terms — all inspected)
- Privacy policy confirms: Stripe + Lob + GA4 + MS Clarity + FB Pixel
- Headers confirm: Render.com + Cloudflare + Python FastAPI + uvicorn

**FL permit portals:**
- Sarasota: https://building.scgov.net/ (Accela-backed, EASY scrape)
- Manatee: https://aca-prod.accela.com/MANATEE/ (MEDIUM, dual 2018 cutoff)
- Pinellas: https://aca-prod.accela.com/PINELLAS/ (MEDIUM-HARD, 24 city sub-systems)
- No FL central permit registry exists. DBPR tracks contractor licenses only.

**FL market dynamics:**
- SB 4-D / 25% Rule (relaxed 2022, further relaxed Dec 2026 9th Edition FBC): https://www.flsenate.gov/Session/Bill/2022D/4D
- §627.7011(5) insurance roof-age statute: https://law.justia.com/codes/florida/title-xxxvii/chapter-627/part-x/section-627-7011/
- SB 808 (introduced, not passed) would ban age-only non-renewals July 2026
- My Safe FL Home: $600M proposed for FY 2026-27, 45K backlog: https://www.insurancejournal.com/news/southeast/2026/03/19/862504.htm
- Milton (Oct 2024) repair tail still active in Sarasota/Manatee

**Match rate methodology:**
- NAR 2025 Profile: median seller tenure 11 years
- ATTOM Q4 2025 homeowner tenure data
- FL Building Code §553.844 enforcement (post-2002)
- CAPE Analytics + ZestyAI roof-age models (production-grade aerial validation)

**Codebase audit:**
- See "What already exists" table above for file paths
- All file paths verified by codebase audit subagent in this research session

---

## Final note for the planning agent

This research session was deep — 6 parallel subagents, 4 rounds of investigation. The strategic decisions are locked. Your job is **implementation planning**, not strategy re-litigation. If you find yourself wanting to re-open any locked decision in the "Locked decisions" section above, surface it as a flag rather than silently reversing.

The single highest-leverage move on day 1 of planning: **schedule the 100-row sniff test.** Everything downstream depends on that gate.
