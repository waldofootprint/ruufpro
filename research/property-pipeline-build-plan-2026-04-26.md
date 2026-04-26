> # 🗄️ ARCHIVED — DO NOT FOLLOW
>
> **Status as of 2026-04-26 PM:** This 35-day plan is **NO LONGER THE SOURCE OF TRUTH.**
> Hannah explicitly chose the simplified MVP path. This doc is preserved as backup
> in case the simplified path proves insufficient.
>
> **Active spec:** [`decisions/property-pipeline-mvp-source-of-truth.md`](../decisions/property-pipeline-mvp-source-of-truth.md)
> **Active checklist (Notion):** https://www.notion.so/34ed45a63c798106a579c098e627442f
>
> **Do NOT enforce from this doc:** sniff-test gate, Phase 1/2/3 discipline, Track A–I,
> Round 4 leaves, the 19 R1.x/R2.x/R3.x locked decisions wholesale, the 3-touch cadence,
> the trust-ramp approval screen, DMAchoice, the design-partner Common Paper agreement,
> attorney pre-launch review, sniff test, multi-creative angle production, etc.
>
> See the source-of-truth doc for the full diff (what survived vs what was cut).

---

# Property Pipeline — Build Plan (Synthesis) [ARCHIVED]

**Date:** 2026-04-26
**Status:** ARCHIVED — superseded by MVP source-of-truth same day
**Original purpose:** Planning Rounds 1–3 synthesis, Round 4 leaves pending
**Source rounds:** Conversation transcript 2026-04-26 (Hannah + Claude planning session)

> **How to read this doc**
> This is the load-bearing planning artifact for Property Pipeline. It supersedes the discussion-shape of `research/property-pipeline-handoff-2026-04-26.md` — the handoff is research input; this is the build spec output. Three companion docs:
> - `research/property-pipeline-handoff-2026-04-26.md` — strategic research, competitor audit, market context (input)
> - `decisions/property-pipeline-geography-pivot.md` — Manatee-vs-Sarasota MVP pivot (load-bearing)
> - `decisions/property-pipeline-sniff-test-result-manatee-<date>.md` — to be written after sniff test runs (Phase 1 gate)

---

## 1 — Locked decisions index (all 7 rounds)

### 1.1 — Spine decisions (Round 1)

| # | Decision | Detail |
|---|----------|--------|
| R1.1 | **Mailing flow** | Hybrid trust-ramp. Batch 1 manual approval; Batch 2 pre-staged 7 days early w/ default=SEND + pause/suppress; Batch 3+ full auto with always-on pause/suppress/edit. Credits never hard-expire — system mails unless paused. |
| R1.2 | **Touch cadence** | 3-touch sequence over 90 days w/ angle rotation. T1 (day 0) insurance threat, T2 (day 45 if no scan) MSFH grant, T3 (day 90 if no scan) hurricane prep. Max 3 touches per home per rolling 12 mo. Min 30-day window between touches. 18-mo cooldown after 3-touch exhaustion. |
| R1.3 | **QR architecture** | Lazy promotion. 6-char base62 short code on each postcard → `mailing_history` row. Riley landing creates `leads` row only on first scan/engagement. Two-table separation: `property_pipeline_candidates` (universe), `mailing_history` (per-postcard), `leads` (engaged only). |
| R1.4 | **Lead lifecycle** | Two-surface dashboard. "Property Pipeline" tab queries `property_pipeline_candidates` joined to `mailing_history` (full universe + mail status). "Leads" tab queries `leads` (real engagement only). Engaged candidates show "→ View as Lead" link. |
| R1.5 | **Backlog handling** | Show full universe count + paced mailing. "8,432 in-market homes in your service area, mailing 100/week" — full transparency, paced execution. |

### 1.2 — Universe + scoring (Round 2)

| # | Decision | Detail |
|---|----------|--------|
| R2.1a | **Sale-date filter** | 3-tier: 0–12mo SUPPRESS (FL 4-point inspection forces re-roof at sale); 12–24mo INCLUDE as test segment with separate creative ("Year 2 — your insurer will be back"); 24+ mo STANDARD. |
| R2.1b | **Property types** | SFH detached ONLY at MVP. OUT: townhomes, condos, mobile/manufactured, 2-4 unit small multi. |
| R2.1c | **Owner type filter** | Filter on FL homestead exemption (Y/N), NOT owner-name regex. Individual+homestead-Y INCLUDE; LLC+homestead-N EXCLUDE; Corp/Inc/Holdings/Estate/Bank/REO EXCLUDE; Snowbirds (out-of-state mailing) INCLUDE w/ separate creative timed Sept-Nov. |
| R2.1d | **Permit-type taxonomy** | Only FULL RE-ROOF / REPLACEMENT / RECOVER excludes. Description regex match: `\b(re-?roof\|replac(e\|ement)\|tear-?off\|recover\|full roof\|new roof\|complete roof)\b` AND (squares > 5 OR cost > $4,000). Repairs/patches IGNORE. Bias toward INCLUSION (false-negative > false-positive cost). |
| R2.1e | **Year-built rule** | Hard filter `year_built ≤ 2010` (15+ yrs); soft scoring boost at ≤ 2005 (20+ yrs). Carve-outs: hurricane-impact override (Ian/Milton damage cone), tile roofs push hard filter to ≤ 1995, newer-than-2010 = separate Tier-2 cadence (don't pollute primary list). |
| R2.2 | **Scoring** | 0–100 numeric internal → tier (Hot ≥70 / Warm 40–69 / Cool 20–39) + binary confidence (High/Low). Inputs: year-built (0–35), insurance-pressure boost (0–20), hurricane-cone overlay (0–15), FEMA flood (0–10), property value (0–10), owner-equity proxy (0–10), multi-touch decay (−20/touch). Confidence drops on data-quality + targeting flags. Score factors stored as JSONB live-state (NOT journaled — see legal R3.6). |
| R2.3 | **Cross-contractor lockout** | 180-day lockout from FIRST touch (= ~90d after Roofer A's full cadence ends). Pre-assigned at scrape time by subscription seniority + service-area centroid distance. Soft pity-counter prevents senior-contractor monopoly. Transparency reasoning: "We never deliver same homeowner to two RuufPro contractors in same 6-month window" is a stated feature. |
| R2.4 | **Service-area picker** | ZIP multi-select for MVP (polygon deferred to v2). Default-county = roofer's home county. Min 1 / max 25 ZIPs. Each ZIP chip shows estimated SFH count. Saves to `contractor.service_area_zips` JSONB. Editable in Settings. Cross-contractor overlap shown ("X other RuufPro contractors also serve this ZIP"). |
| R2.5 | **QR/lead architecture** | Lazy confirmed. URL: `/chat/[contractor_id]?p=<6-char short_code>`. Same short code prints both as QR-encoded URL AND as human-readable mention code on postcard ("Mention RUUF-7K when you call") for offline call attribution. Promotion triggers: QR scan, Riley message, future inbound phone/email. NOT: postcard mailed. |

### 1.3 — Operations + legal (Round 3)

| # | Decision | Detail |
|---|----------|--------|
| R3.1 | **Postcard size** | 6×9 First-Class. USPS postcard rate (≤0.016" thick, extended 2021). Lock at MVP — no A/B size testing. Locked design font cap: ≤24pt (so SB 76 disclosure stays at statutory 12pt minimum AND ≥½ largest). |
| R3.2 | **Postcard format** | HTML template via Lob's Handlebars engine (`engine: "handlebars"` on /v1/templates POST). Per-recipient `merge_variables`. QR rendered server-side via `<img>`. Mandatory CI preview render via Lob /previews endpoint. Web fonts via `@font-face` full URLs. |
| R3.3 | **Return address** | Roofer's branded business address, per-postcard via Lob `from_address`. Lob NCOA pre-scrub on every send (~$0.01/addr) solves return-mail rot. Skip USPS endorsements (NCOA covers 90%; remaining 5% returning to roofer = useful signal). |
| R3.4 | **Tracking phone** | QR-only on postcard. NO phone provisioning (rules out CallRail/Twilio tracked-forwarding even). Mention-code hack: print `Mention RUUF-7K` next to roofer's own phone for rough offline attribution. v2: integrate w/ roofer's own CallRail account if requested. |
| R3.5 | **Geography MVP** | Manatee County (pivoted from Sarasota — see geography-pivot decision doc). Dual-source scrape: Accela ACA 2018→today + mymanatee.org legacy archive 2005→2018-Feb-28. Unified into `roof_permits` table w/ `source` enum. Sarasota Week 2 conditional. |
| R3.6 | **Permit scrape mechanics** | One-shot 2005→today backfill. Weekly Sunday 2am ET ongoing refresh, 7-day overlap window. Vendor split: Firecrawl Standard $99/mo for backfill (cancel after); DIY Playwright for weekly delta. Firecrawl as one-toggle manual fallback for portal updates (not auto-failover). |
| R3.7 | **Scrape failure mode** | Layered fallback ladder: Sun 2am primary → 3 retries → Mon 6am 3 retries → Mon 9am proceed w/ prior-week universe + Slack alert + Hannah override button. Never miss a Monday drop. Scrape-staleness risk is ~2.5%, well within direct-mail tolerance. |
| R3.8 | **Politeness** | UA: `RuufPro Permit Bot/1.0 (+https://ruufpro.com/bot; ops@ruufpro.com)`. Backfill 3-sec spacing nights/weekends only. Weekly 5-sec spacing. 429 = hard-stop + backoff + Hannah alert. Robots.txt respected. NO proactive county outreach. |
| R3.9 | **License # verify** | Hybrid: signup-time inline DBPR check via paid wrapper API (Apify "dbpr-myfloridalicense" actor OR contractor-verify.com), ~$20–100/mo. Green checkmark on success; soft block + manual review within 24h on edge cases (business name mismatch, multiple qualifiers, recent expiration). NO direct DBPR portal scraping at MVP. |
| R3.10 | **SB 76 disclosure** | Verbatim §489.147(2)(a) text, 12pt+, ≥½ largest font. Postcard back footer band + landing page footer (defense-in-depth). Caps largest design font at 24pt (binding design constraint). Penalty up to $10K/violation. |
| R3.11 | **Opt-out** | Two-tier suppression. Default = per-roofer (homeowner opting out of Roofer A doesn't affect Roofer B). Global toggle on /stop page + DMAchoice + NCOA flags + DBPR complaints all add to global. Footer: `ruufpro.com/stop/[8-char]` + text STOP. SLA: write immediately, suppress next Lob queue cycle (within 24h). Public commitment: "Removed within 7 days" (beats DMAchoice 30-day standard). |
| R3.12 | **DMAchoice scrub** | Monthly file ingestion (no real-time API exists). $2,850–$5K/yr at projected volume. Pre-batch scrub Sunday before Lob queue. Belt-and-suspenders: also upload as Lob "Suppression List" feature. NO daily refresh (file only updates monthly). |
| R3.13 | **Signed authorization** | Standalone clickwrap "Direct Mail Authorization" step at signup (NOT ToS checkbox, NOT DocuSign). Affirmative action + checkbox + click button. Audit trail: full text snapshot, version hash, timestamp, IP, user-agent, account ID. Postgres row + S3 immutable archive (object-lock from day 1). Re-prompt on text change. |
| R3.14 | **Audit trail (5-year retention)** | KEEP: `mailing_history`, `opt_out_log`, `creative_versions` w/ which-version-to-whom join, `license_verification_log`, `ncoa_runs`, `roofer_authorizations`. SKIP `scoring_snapshots` (expands discovery surface, no defensive value). Per-send hash via `mailing_history.score_at_send` + `tier_at_send` columns. |
| R3.15 | **Approval UX** | Hero proof viewer (60% of screen) + tier-toggle chip row above ("Hot 32 · Warm 45 · Cool 23"). Click chip swaps creative without page change. Recipient panel (right rail), tier-grouped collapsed-by-default w/ 3 factor chips per row. Trust-ramp banner: "First batch only — we show you everything once." Sticky footer: PRIMARY "Approve & send N — $XX" w/ 2-step Stripe-style confirm; SECONDARY "Suppress N selected"; TERTIARY "Reject batch & rebuild". Intentional friction: must click into ≥1 tier proof before Approve enables. |
| R3.16 | **Approval timeout** | Auto-cancel cadence: T+0 email+SMS+banner; T+24h SMS only; T+72h escalated email+SMS; T+5d Hannah personal-style email + Calendly link; T+7d auto-cancel. Credits PRESERVED (not burned). Regenerate is one click. Trial → paid mid-cycle: fresh 7-day window. SMS-heavy because roofer reality. 7-day cap (NOT 14) because trial-clock math (7 approval + 3-5 mail + 2 response = 14). |
| R3.17 | **Riley personalization** | Touch-aware opener, address used naturally, postcard NEVER named (scent-match without surveillance signal). Per-fact playbook: year-built proactive in opener; FEMA in 2nd-3rd msg w/ discount-reframe; permit absence as "county records" framing; first name once in greeting then drop; estimated value + sale price NEVER (deflect if asked). Creepy-threshold runtime rule: roof-relevance × public-knowledge feel × adversarial frame. Anti-storm-chaser hardening: lead w/ stated concern not data, "public records" language, no price-first, off-ramp offered. |
| R3.18 | **Sniff test** | Claude solo + Hannah 10-min spot-check. Stratified 100 (20/decade from 1960s–2000s), Manatee SFH-detached only, no permit-absence filter (tests universe filters too). RentCast paid (~$15–20). Visual via Google Maps Static API + Street View Static API (~$1 total) — NOT WebFetch (won't return imagery). Output CSV in `.tmp/sniff-test/` (Hannah imports to Sheet). Decision doc in `decisions/`. Thresholds: GREEN ≥60% / YELLOW 50–59% (build w/ tightened filters) / RED <50% (kill or pivot). |
| R3.19 | **Test contractor** | Design partner path (NOT Hannah-licensed, NOT qualifier, NOT test-disclaimer-mail). Common Paper Design Partner Agreement, 90 days fixed, free during pilot, Lob at-cost, locked $99/mo for 12 mo post-pilot, no exclusivity, 7-day termination either side. Indemnity split: roofer = content compliance (license # + §489.147), RuufPro = delivery + data + opt-out. Internal test mail (no roofing offer/depiction, "PRODUCT DEVELOPMENT — NOT A SOLICITATION") for Days 8–30 pipeline QA bridge. §489.147 prohibited-advertisement review by FL construction attorney before first commercial drop. |

---

## 2 — Functional architecture

### 2.1 — Database schema (new + amended)

**New tables**

```
roof_permits
  id UUID PK
  county TEXT (MVP: 'manatee')
  source ENUM('accela_aca', 'mymanatee_legacy', 'firecrawl_failover')
  permit_id TEXT
  parcel_id TEXT
  application_date DATE
  permit_type TEXT (raw)
  description TEXT
  contractor_name TEXT NULL
  permit_value NUMERIC NULL
  squares NUMERIC NULL
  status TEXT
  is_full_reroof BOOLEAN (computed via R2.1d regex + heuristic)
  raw_html TEXT (audit/debug)
  scraped_at TIMESTAMP
  UNIQUE (source, permit_id)
  INDEX (parcel_id, application_date DESC)

property_pipeline_candidates
  id UUID PK
  parcel_id TEXT
  contractor_id UUID FK (assigned via R2.3 tiebreak at scrape time)
  score INT (0-100)
  tier ENUM('hot', 'warm', 'cool')
  confidence ENUM('high', 'low')
  score_factors JSONB (live state, NOT journaled)
  confidence_flags JSONB
  contractor_override ENUM(NULL, 'bump', 'demote', 'suppress')
  override_reason TEXT NULL
  status ENUM('active', 'engaged', 'suppressed', 'cooled')
  score_computed_at TIMESTAMP
  created_at TIMESTAMP
  INDEX (contractor_id, status, score DESC)
  INDEX (parcel_id)

mailing_history
  id UUID PK
  candidate_id UUID FK
  contractor_id UUID FK
  parcel_id TEXT
  touch_number INT (1, 2, 3)
  creative_variant_id UUID FK
  qr_short_code TEXT UNIQUE INDEX (6-char base62, doubles as mention code)
  sent_at TIMESTAMP
  qr_scanned_at TIMESTAMP NULL
  lead_id UUID FK NULL (populated on lazy promotion)
  status ENUM('pending', 'sent', 'returned', 'scanned', 'engaged')
  score_at_send INT (audit hash)
  tier_at_send TEXT
  credits_consumed NUMERIC DEFAULT 1.0 (storm-trigger forward-compat)
  INDEX (contractor_id, parcel_id, sent_at DESC) -- suppression window
  INDEX (parcel_id, sent_at DESC) -- cross-contractor dedup

mail_suppressions
  id UUID PK
  address_hash TEXT
  roofer_id UUID FK NULL (NULL = global)
  source ENUM('postcard_qr', 'web_form', 'text', 'phone', 'dmachoice', 'ncoa', 'dbpr_complaint')
  suppressed_at TIMESTAMP
  reason TEXT
  INDEX (address_hash, roofer_id)

creative_variants
  id UUID PK
  touch_number INT
  angle ENUM('insurance_threat', 'msfh_grant', 'hurricane_prep', 'snowbird', 'test_segment_y2')
  lob_template_id TEXT
  copy_html TEXT
  version INT
  active BOOLEAN
  created_at TIMESTAMP

license_verification_log
  id UUID PK
  contractor_id UUID FK
  license_number TEXT
  vendor ENUM('apify_dbpr', 'contractor_verify')
  result JSONB (full vendor response)
  verified BOOLEAN
  verified_at TIMESTAMP

ncoa_runs
  id UUID PK
  batch_id UUID
  ran_at TIMESTAMP
  records_in INT
  records_out INT
  flags_applied JSONB

roofer_authorizations
  id UUID PK
  contractor_id UUID FK
  agreement_version_hash TEXT
  agreement_text_snapshot TEXT
  signed_at TIMESTAMP
  ip_address TEXT
  user_agent TEXT
  s3_archive_key TEXT (object-locked)

opt_out_log
  id UUID PK
  address_hash TEXT
  roofer_id UUID FK NULL
  source ENUM (matches mail_suppressions.source)
  channel TEXT (e.g., 'web_form_8char_code', 'twilio_sms_stop')
  received_at TIMESTAMP
  suppression_id UUID FK
```

**Amended tables**

```
leads
  + source CHECK constraint includes 'property_pipeline'
  + pipeline_candidate_id UUID FK NULL
  + first_touch_mailing_history_id UUID FK NULL
  + first_touch_number INT NULL
  + first_touch_creative_variant_id UUID FK NULL
  + scan_count INT DEFAULT 1
  + last_scanned_at TIMESTAMP

chat_conversations
  + mailing_history_id UUID FK NULL

contractors
  + service_area_zips JSONB (array of ZIP strings)
  + license_number TEXT
  + license_verified_at TIMESTAMP NULL
  + design_partner BOOLEAN DEFAULT FALSE
```

### 2.2 — Routes

**Public**
- `GET /chat/[contractor_id]?p=<short_code>` — Riley landing w/ touch-aware opener (lazy promotion fires here)
- `GET /stop/[8-char-code]` — opt-out form (per-roofer default, global toggle)
- `GET /pipeline-demo` — no-auth ZIP demo on marketing site (universe count + signup CTA) — Round 4 leaf

**Authenticated dashboard**
- `GET /dashboard/pipeline` — Property Pipeline tab (candidates view)
- `GET /dashboard/pipeline/approval/[batch_id]` — Batch 1 manual approval screen
- `POST /dashboard/pipeline/approve` — approve/suppress/reject batch
- `POST /dashboard/pipeline/candidates/[id]/override` — bump/demote/suppress
- `GET /dashboard/settings/service-area` — ZIP multi-select editor

**Internal API + cron**
- `POST /api/cron/permit-scrape-weekly` — Sun 2am Manatee scrape
- `POST /api/cron/build-monday-batch` — Sun ~6am candidate scoring + batch assembly
- `POST /api/cron/dispatch-monday-batch` — Mon ~9am Lob send (after approval gate for Batch 1, after preview-cancel-window for Batch 2+)
- `POST /api/lob/webhook` — postcard status callbacks
- `POST /api/twilio/sms-webhook` — STOP keyword + approval reminders
- `POST /api/internal/scrape-failover` — Hannah-triggered Firecrawl toggle

### 2.3 — Component additions

- `components/dashboard/property-pipeline-tab.tsx` — main candidates view
- `components/dashboard/property-pipeline-approval-screen.tsx` — Batch 1 trust-ramp UX
- `components/dashboard/zip-multi-select.tsx` — service-area picker
- `components/marketing/zip-pipeline-demo.tsx` — no-auth marketing demo
- `lib/property-pipeline/scoring.ts` — scoring engine + creepy-threshold logic
- `lib/property-pipeline/candidate-builder.ts` — universe filter + assignment
- `lib/property-pipeline/scrapers/manatee-accela.ts` + `manatee-legacy.ts`
- `lib/lob/postcard-client.ts`
- `lib/lob/template-engine.ts` — Handlebars merge variables
- `lib/riley-personalization.ts` — shared module (Round 3 Q5 architectural note)

---

## 3 — Build phases

### Phase 1 — Validate (1–2 days, gate)

**Day 0–1 (parallel work):**
- **Sniff test (Claude solo, ~3-4h):** stratified 100-row Manatee universe → CSV in `.tmp/sniff-test/` → decision doc in `decisions/property-pipeline-sniff-test-result-manatee-<date>.md`
- **Pre-scrape feasibility check (~1h):** verify Manatee Accela earliest `application_date`, confirm mymanatee.org legacy back to 2005, test 10 Accela pages via Firecrawl MCP
- **Hannah spot-check (10 min):** 10 random rows, sign off on sniff-test verdict
- **GO/NO-GO call:** GREEN ≥60% / YELLOW 50–59% / RED <50%

### Phase 2 — Build (8.5–12.5 days, parallel tracks)

**Track A — Procurement (Hannah / ops, calendar lead time)**
- Lob first-piece approval submission (1–3 business days)
- Firecrawl Standard $99/mo signup
- License-verify wrapper API account (Apify or contractor-verify.com)
- Google Cloud project + Maps Static API + Street View API + billing
- DMAchoice annual subscription
- FL construction attorney engagement (§489.147 review)
- Common Paper Design Partner Agreement customization
- Design partner roofer recruitment (Hannah, ~2-3h, target signed by Day 30)

**Track B — Data layer (~2.5 days)**
- Migration: `roof_permits`, `property_pipeline_candidates`, `mailing_history`, `mail_suppressions`, `creative_variants`, audit tables
- Migration: amend `leads` CHECK constraint + add columns
- Manatee Accela scraper + mymanatee.org legacy scraper (1.5 days)
- Backfill weekend run via Firecrawl rotation
- Weekly Sunday cron + 7-day overlap + Sentry/Slack alerts
- Idempotent loader keyed on `permit_id` + dead-letter table

**Track C — Candidate generation (~1.5 days)**
- Universe filter SQL (R2.1a–e)
- Scoring engine (R2.2) + score-factors JSONB
- Cross-contractor pre-assignment (R2.3) at scrape time
- Confidence-flag computation
- RentCast cache extension (already exists; bulk fetch path)

**Track D — UX (~3.5 days)**
- ZIP multi-select component (~0.5 day)
- Property Pipeline dashboard tab (~1 day)
- Trust-ramp Batch 1 approval screen (~1 day)
- Tier-toggle creative swap (~0.25 day)
- Settings → service area edit (~0.25 day)
- "→ View as Lead" link wiring (~0.25 day)
- No-auth ZIP marketing demo (~0.5 day) — depends on Round 4 leaf decision

**Track E — Mailing (~3 days)**
- Lob client + Handlebars template engine (~1 day)
- Postcard creative production (HTML × 3 angles) — Round 4 leaf
- NCOA pre-scrub wiring (~0.25 day)
- Lob `/previews` CI render (~0.25 day)
- Lob webhook handler (status callbacks) (~0.5 day)
- Postcard credit metering (Stripe entitlement OR Supabase counter) (~0.5 day)
- Storm-trigger forward-compat fields (`credits_consumed`) (~0.25 day)

**Track F — Riley + landing (~1 day)**
- Touch-aware opener template engine (~0.5 day)
- Property-fact whitelist + creepy-threshold runtime guard (~0.25 day)
- Anti-storm-chaser system prompt updates + audit current Riley prompts (~0.25 day)
- `/chat/[contractor_id]?p=<code>` landing route + parallel context loading

**Track G — Legal + opt-out (~1.5 days)**
- License verify wrapper integration (~0.25 day)
- Clickwrap "Direct Mail Authorization" + S3 object-lock archive (~0.5 day)
- `/stop/[8-char]` opt-out form + per-roofer default + global toggle (~0.5 day)
- DMAchoice ingestion job (~0.25 day)
- 5-year retention audit-trail tables (already in migration)

**Track H — Approval cadence + SMS (~0.75 day)**
- Inngest events for T+24h, T+72h, T+5d, T+7d (~0.5 day)
- Twilio SMS reminders (~0.25 day)
- Calendly embed in T+5d email
- Auto-cancel + credit-preservation logic
- Regenerate flow

**Track I — QA + dry run (~1 day)**
- 1-county dry run end-to-end
- Dedup tuning + edge-case verification
- Internal test mail (Hannah + 3-5 RuufPro team — NO roofing offer/depiction, "PRODUCT DEVELOPMENT — NOT A SOLICITATION")
- Print/NCOA/USPS/QR/Riley pipeline QA

### Phase 3 — Ship (Day 30+)

- **Day 30:** Design partner roofer onboarded. License # + name configured. Custom return address set.
- **Day 30–35:** Final pre-flight — §489.147 attorney review of postcard copy. Lob first-piece approval should already be cleared from Phase 2.
- **Day 35:** First commercial Monday drop. Batch 1 trust-ramp manual approval screen fires. Real homeowners. Real conversion data.
- **Day 35–45:** Batch 2 ships with 7-day pre-stage preview. Batch 3+ goes auto. Multi-touch cadence (T1) lands.
- **Day 45–90:** T2 (day 45) + T3 (day 90) cadence completes. Pilot ends with case-study material.
- **Day 90:** Pilot retrospective. Decide on geographic expansion (Sarasota Week 2 if not already added) + first paying customer onboarding.

---

## 4 — Procurement stack (Day-1 ops, all calendar-leading)

| # | Item | Lead time | Cost | Owner |
|---|------|-----------|------|-------|
| P1 | Lob account + first-piece approval (per creative × 3 angles, possibly serialized) | 1–3 bus days × 3 | $0 setup, $0.673/postcard | Hannah |
| P2 | Firecrawl Standard one-month | Same-day | $99 (cancel after) | Hannah |
| P3 | License-verify wrapper API (Apify or contractor-verify.com) | 1–2 days | $20–100/mo | Hannah |
| P4 | Google Cloud project + Maps/Street View Static APIs | 1 day | ~$1 sniff-test + ongoing minimal | Hannah |
| P5 | DMAchoice annual subscription | 1–2 weeks | $2,850–$5,000/yr | Hannah |
| P6 | FL construction attorney (§489.147 review) | 1–2 weeks | $500–1,500 one-time | Hannah |
| P7 | Common Paper Design Partner Agreement template customization | 30–60 min | $0 | Claude prep + Hannah review |
| P8 | Design partner roofer recruitment | 7–10 days | $0 (free pilot, Lob at-cost) | Hannah ~2–3h total |
| P9 | Twilio number for SMS reminders | Same-day | ~$1/mo + per-message | Existing infra |
| P10 | S3 bucket w/ object-lock for authorization archive | Same-day | Negligible | Claude |

**Cost stack (recurring monthly, customer-zero):**
- Lob platform fee: $75/mo (Startup tier)
- DMAchoice amortized: ~$237–$417/mo
- License verify: ~$60/mo
- RentCast: variable, ~$15/roofer/mo at full universe
- **Total fixed cost ~$370/mo before customer #1.** First 5 customers all carry the fixed-cost dilution. Worth budgeting explicitly.

**One-time / amortized:**
- Firecrawl backfill: $99 (one-shot)
- Attorney review: $500–1,500
- Hannah-internal validation budget runway: ~$1,100/mo for ~2 months = ~$2,200 burn before commercial drop

---

## 5 — Critical path (today → first postcard in mailbox)

```
DAY 1 ───────────────────────────────────────
  KICKOFF (Hannah + Claude paired session)
  ├── Submit Lob app + first-piece approval clock starts
  ├── Sign up Firecrawl Standard
  ├── Create GCP project + enable Maps/Street View Static APIs
  ├── Sign up license-verify wrapper (Apify or contractor-verify)
  ├── Engage FL construction attorney (§489.147 scope of work)
  ├── Subscribe DMAchoice (start file ingest setup)
  └── Hannah picks 5–10 design-partner candidates from prospect list

DAY 1–2 ─────────────────────────────────────
  Phase 1 sniff test
  ├── Claude pulls 100 stratified Manatee parcels
  ├── RentCast + Maps Static + Street View Static API per row
  ├── CSV output + decision doc draft
  └── Hannah 10-min spot-check + GO/NO-GO call

DAY 2–3 ─────────────────────────────────────
  Pre-scrape feasibility verification (1h)
  ├── Verify Accela earliest application_date
  ├── Verify mymanatee.org legacy depth to 2005
  └── Test 10 pages via Firecrawl MCP

DAY 3–10 ────────────────────────────────────
  Track A procurement closing in parallel:
  ├── Lob first-piece approvals returning (3 creatives, possibly serialized)
  ├── Attorney engagement letter signed
  ├── DMAchoice account provisioned + first file received
  └── Design partner outreach ongoing

DAY 3–17 ────────────────────────────────────
  Build tracks B–I run in parallel where dependencies allow:
  ├── Track B (data layer + scrape backfill weekend)
  ├── Track C (candidate generation)
  ├── Track G (legal + opt-out)
  ├── Track D (UX)
  ├── Track E (mailing)
  ├── Track F (Riley)
  └── Track H (SMS cadence)

DAY 17–25 ───────────────────────────────────
  Track I QA + internal test mail pipeline run
  ├── Hannah + RuufPro team receive "PRODUCT DEVELOPMENT" pieces
  ├── Validate print, NCOA, USPS delivery, QR, Riley load
  └── Tune dedup + edge cases

DAY 25–30 ───────────────────────────────────
  Design partner roofer signs Common Paper agreement
  License # configured in test contractor account
  Service area ZIPs selected
  Custom return address set

DAY 30–34 ───────────────────────────────────
  §489.147 attorney review of final postcard copy (×3 angles)
  Final Lob proof previews validated
  Batch 1 candidates assembled

DAY 35 ──────────────────────────────────────
  ⭐ FIRST COMMERCIAL MONDAY DROP
  Batch 1 trust-ramp approval screen fires
  Roofer reviews + clicks Approve
  Lob send executes
  Postcards in mailbox: ~Day 38–40
```

**Total: ~35 days from KICKOFF to first commercial postcard mailed.**
**Hannah-day budget: ~10 days of focused build work + ~3 hours design-partner recruitment + ~1 hour ongoing ops/procurement check-ins.**

---

## 6 — Risks + mitigations

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| RK1 | Manatee Accela DOM changes mid-cycle | Med | Firecrawl one-toggle fallback; Sentry alerts; weekly delta is small + recoverable |
| RK2 | Sniff test returns YELLOW or RED | High | Phase 1 gate is exactly designed to catch this; YELLOW path has concrete filter-tightening already specified; RED kills cleanly w/ postmortem in `decisions/` |
| RK3 | Design partner can't be recruited in 7–10 days | Med | Build proceeds in parallel — Days 8–30 internal test mail covers pipeline QA without design partner. Compresses recruitment window without blocking. |
| RK4 | §489.147 attorney flags copy that Hannah/Claude wrote | Med | Engage attorney Week 1 (not pre-launch) so feedback loops are cheap; build copy iteration into Week 3–4 |
| RK5 | Lob first-piece approval rejected on disclosure formatting | Low-Med | 12pt + ≥½ largest font is a hard rule we know in advance — design constraint baked in (≤24pt max design font) |
| RK6 | RentCast cost balloons at full universe scale | Med | Cache aggressively (already cache-first); 70K Manatee parcels × $0.10–0.20 first-pull = $7–14K one-time then steady-state low; evaluate Regrid bulk if hot |
| RK7 | Cross-contractor dedup race condition at scale | Low (1 contractor at MVP) | Pre-assign at scrape time, not first-click-wins; tiebreak by subscription seniority + service-area centroid |
| RK8 | SB 808 passes July 2026 → kills insurance-threat angle | High (timing) | T1 angle has insurance frame. T2/T3 don't. If SB 808 advances, swap T1 to MSFH grant frame within 1 day. Loose-coupling between cadence and angle is the architectural insurance. |
| RK9 | First-N-customers underwater on fixed costs | Med | $370/mo fixed cost stack documented (§4). Hannah-internal validation runway ~$1,100/mo × 2 mo. Plan for first 5 customers to dilute fixed overhead. |
| RK10 | Storm-trigger requests during pilot (hurricane mid-pilot) | Low | Architecture supports it via `credits_consumed` field even though feature is v1.5. Manual override possible. |

---

## 7 — Round 4 leaf decisions (still pending)

These are smaller decisions that don't reshape architecture but need answers before the relevant build track fires. Round 4 should resolve them in a single batched session:

1. **Cron timing** — Sun 2am ET scrape, Sun 6am ET batch build, Mon 9am ET dispatch (default if no objection)
2. **Monitoring + alerting** — Sentry + Slack `#automation-alerts` (existing). Specific alert thresholds (scrape fail, NCOA reject rate, Lob send error rate, QR scan rate per touch)
3. **No-auth ZIP marketing demo specifics** — what does it show? ZIP-input form → universe-count headline + sample anonymized signals + signup CTA + email capture? Caching strategy? Anti-abuse (rate limit per IP)?
4. **Universe-count caching** — pre-compute per-ZIP universe size (refreshed weekly post-scrape) vs. on-demand SQL? Static JSON refreshed annually for Manatee + projected counties?
5. **Creative production ownership** — Hannah designs in Figma / Claude generates HTML / template marketplace / agency? Three creatives needed at MVP (insurance, MSFH, hurricane). Lob accepts HTML; iteration speed matters.
6. **Riley first-message latency budget** — touch-aware opener requires `mailing_history` join + property-data fetch. Acceptable Riley first-message render time is ?
7. **Internal test mail design** — what does the "PRODUCT DEVELOPMENT — NOT A SOLICITATION" piece actually look like? Layout-only template? Generic placeholder copy? Hannah's call.

---

## 8 — Open architectural notes worth promoting beyond this feature

Two things surfaced in planning that probably deserve their own scope:

1. **Riley personalization framework** (R3.17 creepy-threshold rule + per-fact playbook + anti-storm-chaser hardening) is bigger than Property Pipeline. Should govern all Riley surfaces (embed widget, standalone chat, post-form). Worth a dedicated `decisions/riley-trust-principles.md` doc and a shared `lib/riley-personalization.ts` module.
2. **Indemnity split architecture** (R3.19 — roofer = content compliance, RuufPro = delivery/data/opt-out) is load-bearing for the eventual paying-customer ToS, not just the design-partner pilot. Worth designing the production contractor agreement around this from day 1.

---

## 9 — What this doc is NOT

- Not a pricing decision (deferred per Hannah)
- Not a calculator decision (deferred per Hannah)
- Not a Round 4 resolution (those leaves remain open)
- Not a final go-live date (depends on Phase 1 GO/NO-GO + design-partner recruitment + Lob/attorney calendars)

The plan is ~85% complete. Round 4 closes the remaining leaves. After Round 4, Phase 1 can fire.
