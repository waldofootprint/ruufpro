# Property Pipeline — Step 4 Handoff (Real Lob send + Riley QR landing + /stop)

**Date written:** 2026-04-26 (end of step 3 session)
**Updated:** 2026-04-26 (post Tier-2 prereq commit `474385a` + deploy `dpl_DeycaLNRT8xe7nxzAM8mkfAxogCo`)
**For:** Next session, fresh context
**Skill to invoke:** `/property-pipeline-build`
**Estimated effort:** ~5-6 hours Claude + ~3 business days wall-clock (Lob first-piece approval is the only true blocker)

---

## ⚡ What changed since this handoff was first written

**Tier-2 prereqs are DONE** (committed `474385a`, deployed `dpl_DeycaLNRT8xe7nxzAM8mkfAxogCo`):

- ✅ Canonical address normalizer at `lib/property-pipeline/address.mjs` — both scripts import it
- ✅ Migration `089_property_pipeline_excluded_recent_permit.sql` applied — added `excluded_recent_permit` to status enum
- ✅ 52 real recent-permit rows flipped from `active` → `excluded_recent_permit` (NOT a normalizer artifact — they were genuine matches the upstream universe-build CSV missed)
- ✅ Defensive UI filter in `lib/property-pipeline/queries.ts` removed; rows excluded by `status='active'`
- ✅ DB state verified: 28,868 active candidates (zero w/ permit in last 7yr) + 52 excluded
- ✅ Prod smoke: `/dashboard/pipeline` returns 200

**Skip the Pre-requisite section below** — it's preserved for audit only. Jump straight to "What this session ships."

---

## 🛑 Hannah-blocker before any code

**Question to ask Hannah at session start:** "Do you have a Lob account already (sandbox + production keys), or do we need to spin one up?"

- If account exists → wire env vars + start coding immediately
- If not → 5 min sign up at lob.com, capture sandbox + production keys to `.env.local`, then code

Either way: submit the first piece for Lob ops review **as early in the session as possible** since approval is ~3 business days wall-clock and is the only true blocker on smoke-testing (step 7).

---

## Read these first (in this order)

1. **`decisions/property-pipeline-mvp-source-of-truth.md`** ← THE source of truth. 7-step MVP checklist + cut list + non-negotiables + the **pricing model** (locked 2026-04-26 — bundled + at-cost overage).
2. **Memory files (load via the auto-memory system):**
   - `project_pp_pricing_model_2026-04-26` — postcard pricing scenario math + step-4 implementation requirements
   - `project_lead_spy_competitive_read_2026-04-26` — competitor positioning + traps to avoid
3. **`supabase/086_property_pipeline_schema.sql`** — live schema. Note especially:
   - `mailing_history` table (one row per postcard sent — already provisioned)
   - `mail_suppressions` table (per-roofer + global opt-out)
   - `direct_mail_authorization_versions` (versioned ESIGN auth)
   - `pp_current_contractor_id()` + `pp_current_service_zips()` RLS helpers
4. **`supabase/088_property_pipeline_signal_columns.sql`** — `last_sale_year` + `last_roof_permit_date` columns added in step 3
5. **`scripts/load-pp-universe.mjs`** + **`scripts/backfill-pp-signals.mjs`** — root cause for v1.1 normalizer fix (see Tier-2 below)
6. **`sessions/2026-04-26-property-pipeline-step3.md`** — full step-3 close-out

**Do NOT read** `research/property-pipeline-build-plan-2026-04-26.md` (ARCHIVED 35-day plan) unless explicitly needed for legacy-decision context.

---

## State at handoff (what's done)

- ✅ Step 1 — Universe acquired (28,920 Manatee in-market homes)
- ✅ Step 2 — Schema + 28,920 rows loaded + RLS applied + helper functions
- ✅ Step 3 — Dashboard UI live on ruufpro.com (`dpl_BH1xGkAttAZUWkieGXWAxXKYAVv1`)
  - New `/dashboard/pipeline` tab w/ Lead-Spy-parity columns (Address · Roof age · Last sale · Last permit · ZIP · Send)
  - Service Area picker at `/dashboard/settings?tab=service-area`
  - 2-step confirm dialog on Send (currently calls 501 stub)
  - Sort: `last_roof_permit_date NULLS FIRST, year_built DESC` (no-permit homes lead, then ~2010 sweet-spot)
  - Defensive UI filter hides rows with permit ≤ 10 years old (bug-protection)

**Verify before starting step 4 (post Tier-2):**

```bash
# DB sanity
SELECT status, count(*) FROM property_pipeline_candidates GROUP BY status;
-- expect: active=28868 · excluded_recent_permit=52

SELECT count(*) FROM property_pipeline_candidates
 WHERE status='active' AND last_roof_permit_date >= (CURRENT_DATE - INTERVAL '7 years');
-- expect: 0

# Production smoke
curl -s -o /dev/null -w "%{http_code}\n" https://ruufpro.com/dashboard/pipeline   # 200
```

---

## What this session ships

**Real Lob postcard send + Riley QR-scan landing route + opt-out route, billed against the locked pricing model.**

The Send button currently calls `/api/pipeline/send` which returns 501 "Coming soon." Replace that with a real Lob send. Wire the QR landing. Wire the /stop opt-out. Replace the "TBD at step 4" line in the confirm dialog with bundle-aware pricing copy.

### In scope this session

1. **Lob client setup** — install SDK, env vars, server-side client
2. **`POST /api/pipeline/send`** — real implementation:
   - Look up candidate
   - Check global `mail_suppressions` (block if matched)
   - **Cross-contractor lockout stub** (added 2026-04-26): call `isPropertyLocked(candidateId, contractorId)` helper. At N=1 contractor, stub always returns `{ locked: false }`. Real implementation drops in at customer #2 without route refactor. See source-of-truth doc "Cross-contractor lockout" section for full design (180-day mail-lock + permanent lead-lock).
   - Check per-roofer monthly bundle usage (free or overage?)
   - Generate 6-char base32-Crockford QR/mention code
   - Render postcard via Lob API (HTML template — see step 5 for full template; for step 4, ship a minimal but legally-compliant template)
   - Insert `mailing_history` row with status `sent`, the QR code, contractor_id, candidate_id, lob_id, score-at-send hash
   - Increment Stripe metered usage if overage
   - Return `{success: true, lob_id, qr_code, cost_cents}` to UI
3. **`GET /m/[code]`** — QR landing route. Decode 6-char code → look up `mailing_history` → log scan event → redirect to roofer's Riley chat with attribution params
4. **`GET /stop/[code]`** — opt-out route. Decode → write to `mail_suppressions` (both per-roofer scoped and global flag) → render simple "you're unsubscribed" page
5. **`POST /api/lob/webhook`** — Lob status callbacks (printing, in_transit, delivered, returned). Update `mailing_history.status` accordingly.
6. **Confirm dialog copy update** — replace "Pricing per postcard: TBD at step 4" with:
   - "Free — included in your monthly Pro plan ({remaining} of {bundle} this month)" if bundle remaining
   - "${cost} — at our cost + $0.10 processing (Pro bundle exhausted this month)" if overage
7. **Stripe metered billing wiring** — set up usage record on top of existing $149 base subscription per `project_pp_pricing_model_2026-04-26` memory

### Out of scope (defer to later steps)

- ❌ Full postcard template w/ branding, photos, multi-creative variants — step 5 (ships TWO templates: with-photo + no-photo)
- ❌ Team photo upload UI — step 5 or 6
- ❌ SB 76 disclosure verbatim styling pass — step 6
- ❌ Riley landing page tweaks (touch-aware copy, etc.) — step 5+
- ❌ Returned-mail suppression UI button on the row — step 7 punch list
- ❌ Engaged-row "→ View as Lead" cross-tab link — fires when QR scan creates lead row, but the link itself is step 5+
- ❌ Marketing site / pricing-page copy update — separate task
- ❌ Real cross-contractor lockout enforcement — stub only at step 4; full build at customer #2

---

## Pre-requisite work — ✅ DONE 2026-04-26 (preserved for audit)

Tier-2 prereq landed in commit `474385a` + deploy `dpl_DeycaLNRT8xe7nxzAM8mkfAxogCo`. Original investigation:

### A. Unify address normalizers — ✅ DONE

**Original diagnosis (incorrect):** "load-pp-universe.mjs does AVENUE→AVE; backfill-pp-signals.mjs doesn't. 52 false-positive permit rows."

**Actual finding:** Backfill never reads loader's stored normalized address — both sides of the join inside backfill used the same function, so no divergence. The 52 rows are real permit-candidate matches that upstream universe-build CSV missed (likely because the scrape ran before those Accela permits existed, or used a coarser address-match scheme).

**What shipped:**
- New `lib/property-pipeline/address.mjs` with `normalizeAddressLine()` + `normalizeAddressFull()` — single source of truth (suffix-replace + aggressive non-alphanumeric strip)
- Both scripts refactored to import (−46 LOC net)
- Migration `089` widened `ppc_status_check` enum with `excluded_recent_permit` + flipped the 52 rows in same transaction
- Defensive UI filter in `queries.ts` removed
- TS type-check clean

### B. Optional: bump permit threshold for v1.2 (NOT this session)

Lead-Spy uses 20-yr "no permit" threshold. We use ~7-yr. Bumping to 15-20yr would shrink universe to ~10-15K but improve quality dramatically. Do this only if step 4 ships smoothly and we have appetite — otherwise defer to v1.2 with the design partner's feedback.

### C. Optional: Mapbox polygon entry UX (NOT this session)

Lead-Spy's headline UX is map-first. 1.5-2 day build. Genuinely defer to v1.2.

---

## Files to touch (estimated)

| File | Action | Why |
|---|---|---|
| ~~`lib/property-pipeline/address.ts`~~ | ~~NEW~~ | ✅ DONE as `address.mjs` in `474385a` |
| ~~`scripts/load-pp-universe.mjs`~~ | ~~EDIT~~ | ✅ DONE in `474385a` |
| ~~`scripts/backfill-pp-signals.mjs`~~ | ~~EDIT~~ | ✅ DONE in `474385a` |
| ~~`lib/property-pipeline/queries.ts`~~ | ~~EDIT~~ | ✅ DONE in `474385a` (defensive filter removed; rows now excluded by status='active') |
| `lib/lob/client.ts` | NEW | Lob SDK client wrapper |
| `lib/property-pipeline/qr-code.ts` | NEW | 6-char base32-Crockford generator + decoder (regex match `mh_qr_short_code_format_check` constraint) |
| `lib/property-pipeline/postcard-template.tsx` | NEW (minimal) | HTML postcard template — minimal but legal-compliant for step 4; full design in step 5. **Note:** step 5 ships TWO templates (with-photo + no-photo); both submitted to Lob for first-piece approval in parallel. Photo upload UI lands in step 5 or 6. |
| `lib/property-pipeline/locks.ts` | NEW (stub) | `isPropertyLocked(candidateId, contractorId)` always returns `{ locked: false }` at MVP. Real impl at customer #2. |
| `lib/property-pipeline/bundle-usage.ts` | NEW | `getMonthlyUsage(contractorId)` → `{ used, bundled, overage }` |
| `app/api/pipeline/send/route.ts` | REWRITE | Real Lob send + bundle/overage logic + mailing_history insert |
| `app/m/[code]/route.ts` | NEW | QR scan landing — decode + log + redirect to Riley chat |
| `app/stop/[code]/page.tsx` | NEW | Opt-out page (form to confirm + writes to mail_suppressions) |
| `app/stop/[code]/route.ts` | NEW | Opt-out POST handler |
| `app/api/lob/webhook/route.ts` | NEW | Lob status callback handler |
| `components/dashboard/property-pipeline-tab.tsx` | EDIT | Confirm dialog copy: bundle-aware pricing line + post-send success toast w/ tracking |
| `lib/stripe/metered-postcards.ts` | NEW | Stripe metered usage record creation |

**Do NOT touch:**
- Existing dashboard tabs (Leads, Insights, Riley, Copilot, Settings)
- `components/ridgeline-v2/` or any marketing site
- Any other API route

---

## Lob first-piece approval — the wall-clock blocker

Lob requires manual approval of the first postcard sent on a new account. This takes **~3 business days**. Plan for it:

1. Sign up / log in to Lob → get production API key + sandbox key (use sandbox for all dev)
2. Submit a **first piece** with the minimal template
3. Wait for Lob ops review (3 business days)
4. Once approved, production sends unblock

**While waiting,** the rest of step 4 can land against the Lob sandbox (sandbox returns mock IDs and never mails). Switch sandbox→production in env after approval.

The first-piece quote (Lob's actual all-in cost per postcard) is the input to the pricing-model lookup table:

| Lob first-piece quote | Bundle in $149 |
|---|---|
| ≤ $1.05 | 75/mo |
| $1.06 – $1.29 | 60/mo |
| ≥ $1.30 | 50/mo |
| ≥ $1.50 | revisit — raise Pro to $169 OR drop bundle to 30 |

**Lock the bundle number once you have the quote**, write it into source-of-truth doc + confirm dialog + pricing page.

---

## QR code spec

- **6-char base32-Crockford** (omits I, L, O, U → no ambiguity for OCR or hand-typing)
- Format constraint already in DB: `mh_qr_short_code_format_check`
- URL: `https://ruufpro.com/m/{code}` (printed on postcard as both QR and human-readable)
- Decode → `mailing_history.qr_short_code` lookup → 302 redirect to roofer's Riley chat URL with attribution params (`?src=pp&card={code}`)

---

## Stripe metered billing setup

Per pricing-model memo, need metered usage on top of existing $149 base subscription.

1. In Stripe Dashboard → Products → existing Pro product → add a **second price** with `usage_type: metered`, `aggregate_usage: sum`, billing_scheme: per_unit
2. On overage send: `stripe.subscriptionItems.createUsageRecord(subItemId, { quantity: 1, timestamp })` — quantity always 1 per overage card
3. Cost passes through automatically at month-end

See `claude-api` skill or `stripe-best-practices` skill for current SDK syntax.

---

## Confirm dialog updates (the visible UX change)

Today's amber "step 4 stub" warning gets replaced. Two states:

**State 1 — within bundle:**
> ✓ Free — included in your Pro plan
> 47 of 75 postcards remaining this month

**State 2 — overage:**
> $1.10 — at our cost + $0.10 processing
> Bundle of 75 used this month. We make $0 profit on extras.

The "$0 profit on extras" line is intentional — it's the Lead-Spy moat phrase ("we don't markup your mail") in microcopy form.

---

## Acceptance criteria (verify before declaring step 4 done)

1. ✅ Real Lob send fires when "Confirm send" clicked (sandbox in dev, production once approved)
2. ✅ `mailing_history` row inserts with full provenance (lob_id, qr_code, contractor_id, candidate_id, sent_at, score_at_send_hash)
3. ✅ Bundle counter accurate — sending 1 decrements remaining; overage at 76+ kicks in
4. ✅ Stripe metered usage record creates correctly on overage
5. ✅ QR scan at `/m/{code}` redirects to roofer's Riley with attribution params
6. ✅ Opt-out at `/stop/{code}` writes to `mail_suppressions` and shows confirmation page
7. ✅ Lob webhook updates `mailing_history.status` on lifecycle events
8. ✅ Confirm dialog shows bundle vs overage state correctly
9. ✅ Send blocked when address is in `mail_suppressions` (per-roofer or global)
10. ✅ Smoke test: send one postcard from your own account to your own address (Hannah)

---

## Risks to watch this session

- **Lob first-piece approval timing.** If approval slips past 3 days, the smoke-test step bleeds into next session. Plan for it; don't block other step-4 work on it.
- **Stripe metered timing.** First overage charges show on next invoice cycle, not immediately. Test with a manual usage record + invoice preview.
- **Webhook race conditions.** Lob may fire `printing` before our DB has the row in some edge cases. Use `mailing_history.lob_id` as the dedup key + idempotent upsert.
- **QR shortcode collisions.** 6-char base32-Crockford = ~1B values; collision rare but possible. On insert collision, retry-generate. Bake a uniqueness check into the generator.
- **The 52 bug rows.** If you implement Tier-2 normalizer fix BEFORE step 4 wiring, those rows will stop showing — verify nothing breaks. If you don't, defensive filter stays in place and the rows never reach the UI anyway.

---

## End-of-session ritual

When step 4 wraps:

1. Write `sessions/YYYY-MM-DD-property-pipeline-step4.md`
2. Mark step 4 ✅ in `decisions/property-pipeline-mvp-source-of-truth.md` checklist
3. Lock the bundle number from the Lob quote into source-of-truth + memory + confirm dialog + pricing page
4. **Ask before deploying** — "Committed as `<hash>`. NOT live until deployed. Want me to deploy?"
5. If you smoke-tested the send to your own address, capture the Lob ID + delivery date in the session log

---

## Step 5 preview (NOT for step 4)

After step 4 wraps:

- Full postcard template w/ branding, the actual creative copy, photo (or no-photo treatment)
- Lob first-piece approval w/ FINAL design (not the minimal step-4 template)
- Riley landing tweaks for touch-aware copy
- Engaged-row "→ View as Lead" link in the dashboard tab once a QR scan creates a lead row
