# Property Pipeline — Round 4 leaves + simplification cuts (decision memo)

**Date:** 2026-04-26
**Status:** DRAFT — Hannah marks up bullet-by-bullet
**Companion to:** `research/property-pipeline-build-plan-2026-04-26.md` §7
**Outcome target:** Resolve all opens before Phase 1 sniff test fires; convert this doc to LOCKED at end of decision session.

> **How to use this doc**
> - Each item = ID + question + advisor rec + why + alternatives + Hannah pick checkbox
> - Mark `[x]` on your pick OR write `OVERRIDE: <rationale>` if going custom
> - Don't re-litigate Rounds 1–3 (build plan §1 is locked)

---

## Part A — Round 4 leaves (the 7 from build plan §7)

### A1. Cron timing
- **Q:** Sun 2am ET scrape / Sun 6am ET batch / Mon 9am ET dispatch?
- **Rec:** ✅ Accept defaults. Sun-night low-traffic on Accela; Mon morning is when roofers check email + USPS first-pickup window.
- **Alts:** (a) Sat scrape (gives 36h buffer for retries) (b) Different time zones if any roofer outside ET
- **Pick:**
  - [ ] Accept defaults (rec)
  - [ ] Sat scrape variant
  - [ ] OVERRIDE: ___

### A2. Monitoring + alert thresholds
- **Q:** What thresholds trigger Sentry/Slack `#automation-alerts`?
- **Rec:** Tier-1 = page-Hannah: scrape returns 0 rows, NCOA reject rate >5%, Lob send error rate >2%, weekly cron skipped. Tier-2 = log-only: QR scan rate <8% per touch (tune later), Riley first-message latency p95 >3s.
- **Why:** Tier-1 = revenue/legal-impacting. Tier-2 = optimization signals.
- **Alts:** (a) Single tier (everything pages) — noisy (b) No alerts at MVP — risky
- **Pick:**
  - [ ] Two-tier as specified (rec)
  - [ ] Single-tier
  - [ ] OVERRIDE: ___

### A3. No-auth ZIP marketing demo
- **Q:** Build for MVP or defer?
- **Rec:** ✅ **DEFER to v1.1.** Different surface (marketing site), needs anti-abuse (rate limit per IP), needs CTA copy alignment with ridgeline-v2 — adds ~0.5d build + ongoing maintenance. The Lead-Spy clone is nice, not load-bearing.
- **Alts:** (a) Build cached static-JSON version (universe count per ZIP refreshed annually) ~0.25d (b) Build full dynamic version ~0.5d
- **Pick:**
  - [ ] Defer to v1.1 (rec)
  - [ ] Static cached version at MVP
  - [ ] Full dynamic at MVP
  - [ ] OVERRIDE: ___

### A4. Universe-count caching
- **Q:** How is per-ZIP universe size computed for the dashboard / settings ZIP picker?
- **Rec:** Materialized view refreshed weekly post-scrape. SQL aggregate on `property_pipeline_candidates` GROUP BY ZIP. Cheap, fresh enough.
- **Alts:** (a) On-demand SQL each render — fine at one-roofer scale, scales poorly (b) Static JSON refreshed annually — too stale post-Milton tail
- **Pick:**
  - [ ] Materialized view weekly (rec)
  - [ ] On-demand SQL
  - [ ] OVERRIDE: ___

### A5. Creative production ownership
- **Q:** Who designs the postcard HTML?
- **Rec:** **Claude generates HTML, Hannah reviews in Lob `/previews`.** Iteration speed > pixel polish at MVP. Three angles (or one conditional template per simplification M1) takes Claude ~2h vs Hannah-Figma ~1d.
- **Why:** Lob renders any valid HTML; CSS print constraints are well-documented; iteration loop is preview→tweak→re-preview, well-suited to Claude.
- **Alts:** (a) Hannah Figma → export → Claude HTML conversion (b) Hire Fiverr/Dribbble designer ($150–500, 3–5 days) (c) Lob template marketplace
- **Pick:**
  - [ ] Claude HTML, Hannah review (rec)
  - [ ] Hannah Figma → Claude HTML
  - [ ] External designer
  - [ ] OVERRIDE: ___

### A6. Riley first-message latency budget
- **Q:** What's acceptable Riley first-message render time on `/chat/[id]?p=<code>` landing?
- **Rec:** **p95 ≤ 2.5s.** Includes mailing_history join + property cache lookup + LLM first-token. Below 1.5s = bonus, >3.5s = degraded experience that bleeds scan→engagement.
- **Why:** Lead-Spy / Angi land in <2s. Cellular 4G adds ~500ms. p95 2.5s = competitive.
- **Alts:** (a) p95 ≤ 2.0s (tighter, may need pre-warm) (b) p95 ≤ 4.0s (lax, real risk of bounce)
- **Pick:**
  - [ ] p95 ≤ 2.5s (rec)
  - [ ] p95 ≤ 2.0s
  - [ ] OVERRIDE: ___

### A7. Internal test mail design
- **Q:** What does the Days 8–30 "PRODUCT DEVELOPMENT — NOT A SOLICITATION" piece look like?
- **Rec:** **Skip if M10 accepted (design partner signed by Day 20–25).** If kept: minimal layout — RuufPro logo top, "PRODUCT DEVELOPMENT — NOT A SOLICITATION" 24pt, body copy = lorem-ipsum-style placeholder explaining "this card validates our pipeline," QR → ruufpro.com/test-landing. Zero roofing depiction.
- **Alts:** (a) Skip entirely if design partner fast (b) Build full minimal piece as bridge insurance (c) Real letter envelope instead of postcard (more obviously non-solicitation)
- **Pick:**
  - [ ] Skip if M10 accepted (rec)
  - [ ] Build minimal bridge piece
  - [ ] OVERRIDE: ___

---

## Part B — Simplification cuts (M1–M11)

### M1. Single Lob template w/ conditional Handlebars blocks for 3 angles 🟢
- **Q:** One template, three merge-variable angles (insurance/MSFH/hurricane) → one Lob first-piece approval?
- **Rec:** ✅ **YES if Lob policy permits.** Saves up to 6 business days off critical path. **Day-1 verification:** confirm with Lob support whether conditional templates count as one or three first-piece approvals.
- **Risk:** Lob may treat each angle as separate creative → verify before betting on it.
- **Pick:**
  - [ ] Yes, verify Day-1 (rec)
  - [ ] No, three separate templates
  - [ ] OVERRIDE: ___

### M2. Defer DMAchoice to v1.1 🟢
- **Q:** Skip the $3–5K/yr ANA subscription at MVP?
- **Rec:** ✅ **YES, with attorney sign-off.** DMAchoice is industry self-reg, not statutory. Per-roofer + global opt-out form + STOP keyword + DBPR-complaint-feed covers statutory floor. Saves cash + 2–4 wks.
- **Risk:** Reduces defensibility if challenged. Mitigation: attorney explicit memo blessing the deferral.
- **Open:** This question MUST be in the §489.147 attorney engagement scope of work.
- **Pick:**
  - [ ] Defer to v1.1 pending attorney sign-off (rec)
  - [ ] Subscribe Day 1
  - [ ] OVERRIDE: ___

### M3. Skip license-verify API for ONE design partner 🟢
- **Q:** Drop P3 (Apify / contractor-verify.com) at MVP?
- **Rec:** ✅ **YES.** Hannah eyeballs DBPR portal once for the one design-partner roofer. Add API integration when customer #2 signs. Kills $20–100/mo + a vendor + an integration day.
- **Risk:** Manual process doesn't scale. Mitigation: only one roofer at MVP; trigger API integration on customer #2 signed.
- **Pick:**
  - [ ] Skip at MVP, add at customer #2 (rec)
  - [ ] Integrate Day 1
  - [ ] OVERRIDE: ___

### M4. Email-only approval reminder cadence 🟢
- **Q:** Drop SMS/Twilio/10DLC from Batch 1 reminder cadence?
- **Rec:** ✅ **YES.** T+0/24h/72h/5d/7d via email only. Removes Twilio + 10DLC + per-message cost. Roofers check email more than SMS for vendor comms anyway.
- **Risk:** Lower urgency. Mitigation: T+5d Hannah-personal-email + Calendly link still escalates.
- **Pick:**
  - [ ] Email-only at MVP, SMS in v1.1 (rec)
  - [ ] Keep SMS path
  - [ ] OVERRIDE: ___

### M5. Drop carve-out segments at MVP 🟢
- **Q:** Drop snowbirds + 12–24mo test segment + 2010+ Tier-2 cadence at MVP?
- **Rec:** ✅ **YES.** Single universe = SFH-detached + homestead-Y + 24+mo since sale + year-built ≤2010 + Manatee. One creative path. Each carve-out adds a separate creative variant + Lob approval + attorney review.
- **Trade:** Smaller universe; reactivate carve-outs in v1.1 once primary path proves.
- **Pick:**
  - [ ] Drop all 3 carve-outs at MVP (rec)
  - [ ] Keep 12–24mo test segment only
  - [ ] Keep snowbird only
  - [ ] Keep all
  - [ ] OVERRIDE: ___

### M6. Switch QR/mention code to base32-Crockford 🟢
- **Q:** Use base32-Crockford (no 0/O/1/I/L) instead of base62?
- **Rec:** ✅ **YES.** 6-char base32-Crockford = 32^6 = 1.07B IDs (still collision-safe at MVP). Typo-resistant on phone-attribution mention codes. One-line change in code-gen util.
- **Pick:**
  - [ ] base32-Crockford (rec)
  - [ ] base62
  - [ ] OVERRIDE: ___

### M7. Drop "intentional friction" click-into-tier gate on approval screen 🟢
- **Q:** Remove the must-click-≥1-tier-proof-before-Approve UX?
- **Rec:** ✅ **YES.** Real friction = 2-step Stripe-style confirm on Approve button (kept). The click-into-tier gate is theater.
- **Pick:**
  - [ ] Drop friction gate (rec)
  - [ ] Keep
  - [ ] OVERRIDE: ___

### M8. Drop tier-toggle creative chip row 🟡
- **Q:** Show creatives stacked instead of tier-toggle?
- **Rec:** **Keep at MVP.** Tier-toggle is fast UX and the shared template-engine lift is small. Marginal.
- **Pick:**
  - [ ] Keep tier-toggle (rec)
  - [ ] Stack creatives, drop toggle
  - [ ] OVERRIDE: ___

### M9. Drop "→ View as Lead" cross-tab link 🟡
- **Q:** Skip the deep-link from Property Pipeline tab to Leads tab on engaged candidates?
- **Rec:** **Keep.** It's ~0.25d and signals "lazy promotion worked." Removing makes lead-lifecycle confusing.
- **Pick:**
  - [ ] Keep link (rec)
  - [ ] Drop, two tabs separate
  - [ ] OVERRIDE: ___

### M10. Skip internal test mail Days 8–30 if design partner fast 🟡
- **Q:** Drop the bridge piece if design partner signs by Day 20–25?
- **Rec:** ✅ **YES — design intent is "skip if recruitment closes fast."** Keep code path so we can fire it if recruitment slips past Day 25.
- **Pick:**
  - [ ] Skip-if-fast (rec)
  - [ ] Always run bridge mail
  - [ ] Never run bridge mail
  - [ ] OVERRIDE: ___

### M11. Defer no-auth ZIP marketing demo to v1.1 🟡
- **Same as A3** — see Part A.

---

## Part C — Engineering-around moves (E1–E5, recommend accept all)

These are de-risking moves, not cuts. Mark `[x] ACCEPT` or override.

- **E1.** Day-1 ordering: (a) Lob signup + submit single conditional template, (b) Playwright probe Manatee Accela 5 lines, (c) verify mymanatee.org legacy depth, (d) FL Bar attorney referral search, (e) design partner pitch list draft. → [ ] ACCEPT
- **E2.** CI guard for postcard font ratio. Lint creative HTML, assert disclosure ≥ max/2 AND ≥ 12pt. Prevents R3.10 regression. → [ ] ACCEPT
- **E3.** Address normalization at ingest via Lob `/v1/us_verifications` ($0.0075/call). Guarantees `address_hash` consistency for dedup + suppression. → [ ] ACCEPT
- **E4.** Returned-mail opt-out path: 1-button "Mark returned & suppress" on dashboard candidate row. Closes the R3.3 leak. → [ ] ACCEPT
- **E5.** Manatee parcel ingest as Phase 1.5: free download from manateepao.com → one-time load into `parcels_manatee` table. Becomes universe source. → [ ] ACCEPT

---

## Part D — Day-1 external verifications (must complete before Phase 1 fires)

These are existence-unverified or capability-unverified assumptions in the plan. None are decisions — they're checks.

- **V1.** **Lob first-piece approval policy on conditional templates** — does ONE template w/ Handlebars `{{#if angle == "insurance"}}` blocks count as one approval or three? Email Lob support Day 1.
- **V2.** **Apify "dbpr-myfloridalicense" actor existence** — moot if M3 accepted (skip license-verify at MVP). Re-check at customer #2.
- **V3.** **Manatee Accela scrape feasibility** — 5-min Playwright probe on `aca-prod.accela.com/MANATEE/`. Confirm: (a) public access (no login wall), (b) no aggressive bot detection, (c) earliest `application_date` available, (d) HTML-parseable result list.
- **V4.** **mymanatee.org legacy archive depth** — confirm 2005–2018-Feb-28 coverage exists and is reachable. If broken, R3.5 dual-source breaks → universe shrinks to 2018+ only → **kills the 20+yr-no-permit definition for many homes**. Critical.
- **V5.** **ManateePAO parcel data availability** — confirm free GIS shapefile + year-built field present.
- **V6.** **RentCast snowbird detection** — moot if M5 accepted (drop snowbirds at MVP).
- **V7.** **Twilio 10DLC status** — moot if M4 accepted (email-only reminders).
- **V8.** **Hurricane cone overlay data source** — NOAA NHC shapefile? Manual? If unanswered, drop hurricane-cone scoring factor (0–15) at MVP.

---

## Part E — Honest schedule re-projection

If Hannah accepts M1+M2+M3+M4+M5+M10:
- **Day 35 first commercial drop = plausible** (vs Day 50–60 as written)
- Calendar-leading items reduce to: Lob first-piece (≤5 bus days w/ M1), attorney engagement (1–2 wks), design partner recruitment (7–10 days)
- DMAchoice + license-verify API + Twilio 10DLC all deferred to v1.1

If Hannah rejects all simplifications:
- **Day 50–60 first commercial drop is honest projection**
- DMAchoice monthly-file cadence may add another +14 days

---

## Part F — Locking ritual

When Hannah finishes marking up:
1. Claude updates this doc — strikes alternatives, removes checkboxes, marks `LOCKED` with date
2. Build plan §7 (Round 4 leaves) gets pointer to this doc + status "RESOLVED"
3. Build plan §3 phase ordering gets updated for the simplifications (drop carve-out tracks, drop SMS cadence, drop license-verify integration day)
4. Risk table §6 updated (DMAchoice deferral risk added if M2 accepted)
5. Phase 1 sniff test fires next session

---

## What this doc is NOT

- Not a re-litigation of Rounds 1–3 (those are LOCKED in build plan §1)
- Not a pricing decision (deferred per Hannah)
- Not a design-partner-recruitment plan (P8 procurement, separate)
- Not the §489.147 attorney scope of work (separate doc when attorney engaged)
