# Property Pipeline — MVP Source of Truth

**Status:** ✅ ACTIVE — this is the spec being built
**Date:** 2026-04-26
**Supersedes:** `research/property-pipeline-build-plan-2026-04-26.md` (35-day plan, now ARCHIVED)

> **For any Claude session loading this project:** This file is the load-bearing spec.
> The 35-day build plan in `research/` is preserved for reference but is NOT what we're building.
> Do NOT enforce sniff-test gates, Phase 1/2/3 discipline, Track A–I framework, Round 4 leaf
> decisions, or the 19 R1.x/R2.x/R3.x locked decisions wholesale. Use the simplified path below.

---

## What we're actually building

**Send-one-at-a-time direct mail to in-market homeowners, surfaced through a new dashboard tab.** That is the entire MVP.

Roofer flow:
1. Signs up, enters license # + ZIPs they serve + checks "I authorize RuufPro to mail postcards on my behalf"
2. Opens new **Property Pipeline** tab → sees list of homes in their ZIPs
3. Clicks **Send postcard** on any row → Lob mails it w/ QR code
4. Homeowner scans QR → Riley chat → lead row appears in Leads tab
5. Homeowner can opt out via URL printed on postcard

No batch. No multi-touch cadence. No approval screen. No DMAchoice. No SMS. One creative. One county.

---

## The 7-step build checklist

Companion: Notion page `🏠 Property Pipeline — MVP Checklist (strict minimum)`
(URL: https://www.notion.so/34ed45a63c798106a579c098e627442f)

| # | Step | Status |
|---|---|---|
| 1 | External setup (Manatee parcel + Accela permit data) | ✅ DONE 2026-04-26 |
| 2 | Database migrations + 28,920-row data load | ✅ DONE 2026-04-26 |
| 3 | Dashboard UI (one new tab, table, "Send postcard" button) | ✅ DONE 2026-04-26 — `4e02e8d` (after planning base `b06fd16`) |
| 4 | Send + landing routes (real Lob + Riley QR landing + /stop) | ✅ DONE 2026-04-26 — `cf7f031` + preview `2893b85` · deploy `dpl_7oXYhWtM8GjfAi41ZPCCUjyyTPUJ` |
| 5 | Postcard template (single creative, production HTML built) | ⬜ PARKED — 12 tones in `.tmp/postcard-mockup/index.html`, none locked. Insurer-flags v5 direction decided 2026-04-26 PM but production HTML not yet built. |
| 6 | Legal floor wiring (SB 76 disclosure, license #, opt-out URL, signup checkbox) | ✅ DONE 2026-04-26 — `212337b` (SB 76) + `b78ecd0` (license # + ZIPs + DM auth clickwrap) |
| 7 | Smoke test (mail one to your own address) | ⬜ unblocks once step 5 picks a creative OR we smoke-test pipeline only |

**Estimate:** ~2 days Claude build. NO Lob review wall-clock — verified 2026-04-28: API postcards require no pre-approval (only Informed Delivery campaigns do; we don't use those). Critical path is now: step 5 creative locked → real FL roofer license # signed → `LOB_API_KEY_LIVE` set → smoke send same day.

---

## What we're explicitly NOT building (cut from old 35-day plan)

If a session proposes any of these, push back — they were explicitly cut.

| Cut | Why we can skip |
|---|---|
| Phase 1 sniff test (100 stratified parcels) | One-time data load done; roofer manually picks who to mail = self-validating |
| Multi-touch cadence (T1/T2/T3 over 90 days) | Roofer chooses when to mail. v1.1 |
| Batch approval screen / trust-ramp UX | One-at-a-time send means no batch to approve |
| Weekly cron scrape | One-time data load. Refresh manually monthly until customer #2 |
| mymanatee.org legacy archive 2005–2018 | Accela 2018+ is enough, "no permit in 7+ years" is useful signal. **Verified during step 1: Accela goes back to 2005 anyway** |
| DMAchoice subscription ($3–5K/yr) | Industry self-reg, not statutory. Per-roofer + global opt-out covers floor |
| License-verify API (Apify / contractor-verify) | Hannah eyeballs DBPR once for the one design partner |
| Twilio / SMS / 10DLC | No batch reminders needed = no SMS needed |
| NCOA pre-scrub job | Lob runs NCOA per piece automatically on send |
| Marketing demo (no-auth ZIP form) | Can ship later. Not gating revenue |
| 3 creative angles (insurance / MSFH / hurricane) | One generic creative. Iterate copy after first 50 mailings |
| Glossy / premium paper upgrade | Defer to v1.1. Standard 6×11 stock for all postcards at MVP. Different Lob SKU; separate bundle math when added. |
| Cross-contractor 180-day lockout | Only one contractor. Add when customer #2 lands |
| 5-year audit-trail tables (full R3.14 set) | `mailing_history` + `direct_mail_authorization_versions` alone is sufficient at one-customer scale |
| Common Paper Design Partner Agreement | Roofer signs ToS w/ direct-mail clause. Same legal cover |
| Pre-launch §489.147 attorney review | Disclosure is verbatim from statute = self-protecting. Get attorney review when revenue is in |
| Internal test mail ("PRODUCT DEVELOPMENT") Days 8–30 | Skip the bridge. Send one to your own address as smoke test (step 7) |
| Sentry alerts + monitoring | One customer, Hannah eyeballs the dashboard. Add automation when scale demands |
| Postcard credit metering / Stripe entitlements | Manually count sends in admin view until customer #5 |
| Trust-ramp Batch 1/2/3 progression | One-at-a-time send removes the concept entirely |
| Tier-toggle creative chips on approval screen | No approval screen = no chips |
| Hurricane cone overlay scoring | Score = year_built only at MVP. Add inputs when proving signal |

---

## Postcard creative — Insurer-flags v5 + roof-evidence photo (decided 2026-04-26 PM)

**Headline (locked):** *"Florida insurers are looking harder at roofs built before 2010."*
**Lede (locked):** *"Three things they're flagging on homes from this era — and what we'd check before your next renewal."*

**The three flags (locked, sourced, on the back of every card):**
1. **Remaining roof life under 5 years** — FL UV ages shingles 5-7 yrs faster than warranty assumes; carriers rarely renew past year 15 (Citizens 4-Point form + SB 4-D §627.7011)
2. **No secondary water barrier (SWR)** — required by FBC only after 2009; pre-2009 roofs miss the OIR-B1-1802 wind-mit discount worth hundreds-thousands/yr (FBC R4402.7)
3. **Roof-deck nail pattern** — pre-2002 6"/12" nailing gets the lowest wind-mit rating unless verified (FBC §1606 + OIR-B1-1802 §2)

**Why this beat earlier directions** (Curiosity v2 + Civic-calm v1 + Data-position v3 + MSFH v4): Curiosity was passive, no FL-coded urgency, didn't survive trash-bin reflex. Insurance-education frame is the only one a research-agent role-playing as a 14-yr Bradenton roofer (Mike Calloway) said he'd put his license # on. Citizens already created the urgency; we don't have to manufacture it.

**Legal defensibility verified by unbiased research agent 2026-04-26:**
- Headline says *"looking harder"* not *"dropping you"* → clears FL §627.7011 (25-yr rule barring age-only refusal). A 2010 roof is still 9 yrs from the cliff.
- Footer microcopy carries `"We're a licensed roofer, not your insurer — final policy decisions are theirs."` → clears FL §626.854 implied-insurance-expertise line
- All three flags are on the actual Citizens 4-Point form + OIR-B1-1802 → defensible under §501.171 deceptive trade
- §489.147 storm-chaser line not crossed (no storm names, no claim inducement)

**Production rules:**
- **Per-contractor branded** — roofer logo + license # + phone + mailing address pulled from `contractors` table at send time
- **Format:** 6×11 standard-class on standard stock. Lob's cheapest tier; $0.646/card at Growth volume tier
- **Photo direction: roof-mid-inspection** (NOT team headshot). "Evidence over identity" — boots/shingles/tape-measure reads as work, team headshot reads as ad. Cheaper too — contractor uploads one job photo of their own work vs branded headshot session.
- **Photo upload required at signup** (used to be optional team photo). Roofer must supply ≥1 inspection photo before first send. Ships with a stock fallback if the design partner doesn't have one ready.
- **Two creative variants:** `with-photo` and `no-photo`. No Lob pre-approval required (verified 2026-04-28).
- **Image validation at upload:** min resolution 1800×3300 (300 DPI × 6×11), JPEG/PNG only, ≤10MB. Hannah eyeballs photo once per contractor at signup until volume forces automation.
- **Per-home facts rule (clarified 2026-04-26):** *anti-creepy-granularity, not zero per-home facts.* Cohort/decade-level OK ("homes from the 2000s", "pre-2009 roofs"). Neighborhood/city/area-name OK (already on address block). BANNED: "your roof is 23 years old", "last permit pulled 2003", "your home built in 1998". The three flags themselves ARE per-home-relevant because the universe filter (year_built ≤ 2010) makes them cohort-true.
- **Banned phrases on the postcard** (per Mike-agent + legal): "free estimate", "limited time", "act now", "storm damage specialist", "we work with all insurance companies", "100% financing available", any exclamation point, "your insurer is dropping you", "FL law requires roof replacement at 15 years", any specific premium-savings dollar figure
- **Roofer-uploaded full designs:** ❌ NOT supported at MVP. Forces compliance review on every upload, breaks "we handle compliance for you" story. Defer to v1.1.

**Differentiation vs Lead-Spy:** their creative is publicly opaque (no samples on lead-spy.com). Ours will be shown on the marketing site as proof. Compliance moat: we print SB 76 verbatim + license # by default + carry sourced insurer-flag claims; Lead-Spy reportedly doesn't.

---

## Two things genuinely cannot be skipped

These survived the simplification and are non-negotiable:

1. **SB 76 disclosure verbatim on every postcard** — §489.147(2)(a). Up to **$10K/violation**. Statute text is public; copy it as-is. Don't paraphrase.
2. **Roofer's license # on every postcard** — §489.119. Same penalty exposure. Pull from `contractors.license_number`.

Plus three more legal-floor items that are cheap and worth keeping:

3. Opt-out URL on every postcard
4. Signed roofer authorization captured before send (clickwrap checkbox + version-hashed text in `direct_mail_authorization_versions` table)
5. Manatee-only at MVP (no expansion until proven)

---

## Pricing model (locked 2026-04-26 after Lead-Spy head-to-head)

**Pattern:** bundled small + at-cost overage. NOT pure metered, NOT tiered.

- $149/mo Pro = **50-75 postcards bundled/mo** (final number locks after step 4 Lob first-piece quote — see below)
- Overage: **Lob actual cost + $0.10/card processing fee** (covers Stripe 2.9%, no postage profit)
- Soft cap: **500/mo at-cost**, manual-override convo above
- Marketing anchor: **"We don't markup your mail"**

**Bundle number lookup (after Lob quote):**

| Lob first-piece quote | Bundle in $149 |
|---|---|
| ≤ $1.05 | 75/mo |
| $1.06 – $1.29 | 60/mo |
| ≥ $1.30 | 50/mo |
| ≥ $1.50 | revisit — raise Pro to $169 OR drop bundle to 30 |

**Step 4 implementation requirements:**
- Replace `Pricing per postcard: TBD at step 4` line in confirm dialog with bundle-aware copy
- Track per-roofer per-month bundle usage (aggregate `mailing_history` by month)
- Stripe metered billing on top of $149 base subscription
- TOS clause: pass-through pricing at Lob rates, with 30-day notice on rate hikes
- Homepage / pricing page must surface "75 postcards/mo included · additional at our cost"

**Why this beats Lead-Spy's $1.70-flat model:**
- Their $1.70 = $0.85 Lob cost + ~$0.85 markup = ~50% of their revenue. They cannot copy at-cost overage without gutting their P&L.
- Our $149 SaaS is the margin engine — postage is a feature, not a product line.
- Per-send friction (their model) kills SaaS engagement; our model removes it past the bundle.
- Hormozi Value Equation lens: ↓↓↓ effort, ↑ dream outcome, ↑ perceived likelihood, ↓ time delay vs Lead-Spy.

Full rationale + scenario math + risk-watch in `project_pp_pricing_model_2026-04-26` memory.

---

## Storm-data integration — parking lot (decided 2026-04-26 PM)

**Status:** scoped, NOT yet built. Build as a separate step after step 7 ships.

**MVP scope (own session, ~1 day):**
- Ingest NOAA Storm Events Database (free, county-level + lat/long, monthly bulk CSV) for Manatee FIPS 12081 + 6 adjacent counties, last 10 yrs
- Ingest NOAA HURDAT2 hurricane best-track (free, 6-hr fixes, 1851-present) for last 20 yrs Atlantic
- Ingest FEMA OpenFEMA Disaster Declarations (free REST API) for FL state, last 10 yrs
- Materialize `parcel_storm_exposure` view: parcel_id → last_hurricane_within_50mi, storm_event_count_10yr, fema_declared_disasters_10yr, storm_score 0-100
- Surface as **internal "Sort by storm exposure" filter only** in PP dashboard. NOT on postcard creative.

**Why NOT on the postcard at MVP:** §489.147 prohibits inducing claim filing. Public NOAA data on a postcard ≠ inducement, BUT the optics ("your home was hit by [storm]") cross into storm-chaser territory, and one-contractor MVP scale doesn't justify FL counsel review (~$500 one-time) needed to thread that needle safely.

**v2 (post-counsel-review):** factual storm context on Riley landing — *"Hurricane Ian's eye passed within 35 miles of this address on Sep 28, 2022 (NOAA HURDAT2). Roofs from this era often show wind-related issues we can inspect."* Homeowner-initiated, not solicitation surface.

**Skip:** paid hail-swath APIs (HailTrace, CoreLogic, LiveEYE — $500-5K/mo). Manatee = hurricane country, not hail country. Reopen at customer #20+ if expanding to TX/CO/OK.

**Why this matters:** unlocks Mike-agent's *"timing is the offer"* insight without legal exposure. Surfacing storm-touched homes first in the dashboard = the contractor naturally picks them = the postcard arrives in the renewal-anxiety window without us claiming insurance expertise. Same effect, defensible mechanism.

---

## Decisions from the old plan that DO still apply

These survived the simplification, mostly because they're cheap:

- **Manatee County MVP** (was R3.5)
- **SFH + homestead=Y + year_built ≤ 2010** universe (was R2.1b/c/e)
- **Lazy QR promotion** — leads row only on engagement, not on send (was R2.5, simpler implementation)
- **6-char base32-Crockford QR/mention code** (was R2.5 + simplification M6)
- **Per-roofer + global opt-out** in `mail_suppressions` (was R3.11, simpler implementation)
- **Versioned authorization text** in `direct_mail_authorization_versions` for ESIGN reproducibility (was R3.13 minus the S3 object-lock)
- **`contractors.service_area_zips`** drives dashboard scope (was R2.4)

---

## Cross-contractor lockout (designed 2026-04-26, build at customer #2)

Two distinct locks. Design now, ship 5-line stub in step 4 (always returns "not locked" at N=1), build full enforcement when second contractor onboards.

| Lock type | Trigger | Duration | Rationale |
|---|---|---|---|
| **Mail-lock** | Contractor A sends postcard to property | **180 days** | Cooldown — protects homeowner UX (no double-mailing same address from different RuufPro-mailed roofers within 6 months). Brand protection for RuufPro, not just contractor. |
| **Lead-lock** | Homeowner scans QR → becomes lead in A's CRM | **Permanent** (until A archives the lead) | That's A's customer. No one else on RuufPro can target an actively-engaged homeowner. |

**Implementation outline (for customer #2 build):**
- `/api/pipeline/send` queries `mailing_history` for any row matching `candidate_id` from ANY contractor where `sent_at >= NOW() - INTERVAL '180 days'`. If found → reject with "Available [date]"
- Lead-lock check joins `mailing_history` → `leads` where `leads.contractor_id != current` AND lead is not archived
- Dashboard row shows lock icon + tooltip "Locked until [date]" or "Engaged with another contractor"
- Optional filter: "Hide locked properties" (default ON)
- Schema sufficient — no new tables needed

**Step-4 stub:** add `isPropertyLocked(candidateId, contractorId)` helper that returns `{ locked: false }` always. Wire into `/api/pipeline/send` so the call site exists. Real implementation drops in at customer #2 without route refactor.

**Reopen trigger:** when 2nd paying contractor signs up OR when first contractor flags a "another roofer mailed this lead" complaint.

---

## Decisions from the old plan that were CUT (do not enforce)

- ❌ R1.1 trust-ramp manual approval — cut (one-at-a-time send)
- ❌ R1.2 3-touch cadence — cut (single send)
- ❌ R1.5 paced backlog — cut (roofer picks each home)
- ❌ R2.1a 3-tier sale-date — cut (no tier carve-outs)
- ❌ R2.1d permit-type taxonomy — N/A (we already filtered against permits in step 1)
- ❌ R2.2 0–100 scoring + tiering — cut (year_built sort only)
- ❌ R2.3 cross-contractor lockout — cut (N=1 contractor)
- ❌ R3.6 weekly Sunday cron + dual-source — cut (one-time load)
- ❌ R3.7 fail-mode ladder — cut (no cron)
- ❌ R3.9 license-verify API — cut (manual eyeball once)
- ❌ R3.12 DMAchoice — cut
- ❌ R3.14 5-year audit-trail full table set — cut (mailing_history + auth versions only)
- ❌ R3.15 hero proof viewer + tier-toggle approval UX — cut (no approval screen)
- ❌ R3.16 T+0/24/72h/5d/7d cadence — cut (no batch)
- ❌ R3.17 touch-aware Riley opener — cut (single-touch only at MVP; standard Riley landing)
- ❌ R3.18 sniff test — cut
- ❌ R3.19 Common Paper Design Partner Agreement — cut (ToS checkbox covers it)

---

## Pointers

- **MVP build checklist (Notion):** https://www.notion.so/34ed45a63c798106a579c098e627442f
- **Step 3 handoff (next session):** `research/property-pipeline-step-3-dashboard-handoff.md`
- **Live schema:** `supabase/086_property_pipeline_schema.sql` (applied 2026-04-26)
- **Loader:** `scripts/load-pp-universe.mjs` (28,920 rows loaded 2026-04-26)
- **Step 1 data + README:** `.tmp/property-pipeline/README.md`
- **Reference only (do not enforce):** `research/property-pipeline-build-plan-2026-04-26.md` ← ARCHIVED 35-day plan
- **Reference only (do not enforce):** `research/property-pipeline-handoff-2026-04-26.md` ← ARCHIVED research drop
- **Geography pivot reasoning (still valid):** `decisions/property-pipeline-geography-pivot.md`
- **Round 4 simplifications memo (informed this MVP):** `decisions/property-pipeline-round4-and-simplifications.md`

---

## How to handle "but the old plan said..." friction

If a future session keeps citing the 35-day plan:

1. Point at this file. It's the source of truth.
2. The 35-day plan is **preserved as backup** in case the simplified path proves insufficient — but the simplified path is what we're shipping.
3. If something specific from the old plan needs to come back (e.g., a real attorney review before customer #2), that's a fresh decision to discuss — not a default to enforce.
