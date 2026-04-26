# 2026-04-26 — Property Pipeline step 3 (Dashboard UI) — full session

**Branch:** `feature/direct-mail-nfc`
**Live deploy:** `dpl_BH1xGkAttAZUWkieGXWAxXKYAVv1` → ruufpro.com (final state of session)
**Step status:** ✅ DONE (all 7 acceptance criteria met + extended)

## Commit log

| Hash | Title |
|---|---|
| `b06fd16` | PP planning docs + steps 1-2 (schema + universe load) — clean base before code |
| `4e02e8d` | Step 3 — dashboard tab + Service Area picker (initial v1) |
| `e93f7eb` | Step 3 close-out — first session log + checklist tick |
| `5c7d82a` | Step 3 — Lead-Spy column parity (last sale year + last permit date) |
| `67f6a51` | Step 3 — sort/filter v1.1 fix (no-permit-first + hide recent-permit bug rows) |
| `adec005` | Lock postcard pricing model (bundle + at-cost overage) |
| **First deploy** | `dpl_CFHQCdpTh3WC2fUhtHiigKBPEh3b` (after `5c7d82a`) |
| **Final deploy** | `dpl_BH1xGkAttAZUWkieGXWAxXKYAVv1` (after `67f6a51`) |

## What shipped

### Code
- New `/dashboard/pipeline` tab — table, ZIP chip filter, pagination, 2-step confirm dialog, empty state
- `/dashboard/settings?tab=service-area` — minimal ZIP picker w/ 25-cap, 5-digit validation
- 6 file paths (page, components, lib, API stub, settings tab, sidebar nav)

### Database
- Migration 088 — `last_sale_year` + `last_roof_permit_date` columns
- `pp_apply_signals(jsonb)` RPC — batched UPDATE-only writes
- Backfill: 28,738/28,920 sale years (99.4%) + 408/28,920 permit dates (1.4% by construction)

### Dashboard table — final state
| Column | Source |
|---|---|
| Address (+ city subline) | `address_raw` |
| Roof age (primary number, "Built YYYY" subline) | derived `current_year - year_built` |
| Last sale | `last_sale_year` |
| Last permit (or italic "None on file") | `last_roof_permit_date` |
| ZIP | `zip` |
| Send postcard → confirm dialog | calls `/api/pipeline/send` (501 stub) |

### Sort + filter — final state
- ORDER: `last_roof_permit_date NULLS FIRST, year_built DESC` — no-permit homes lead, then ~2010 sweet-spot
- FILTER: hide rows w/ permit ≤ 10 years old (defensive — masks normalizer bug)

## Five research agents informed the build

1. **Initial v1 review (3 agents in parallel):**
   - Competitive (LeadSpy/SalesRabbit etc.) — "no load-bearing gaps, ship as-is"
   - Master-plan reconciliation — flagged D5 (empty-state dead-end) + D6 (no narrative) + pre-send confirm gap
   - Roofer-CX — "I'd bounce 80% confidence" — drove the confirm dialog + assessed-value column + subtitle reframe
2. **Lead-Spy.com deep dive (after Hannah pointed at correct URL):**
   - Confirmed direct competitor in Manatee FL ($150 Pro / $1.70/postcard / 20yr threshold)
   - Their 4 cols: Address · Owner · Permit Date · Roof Age
   - Validated our cuts (no owner name, no CSV export, no à-la-carte, no map polygon in MVP)
3. **Diagnostic + UX agents (after Hannah spotted row-1 anomaly):**
   - Diagnostic: traced 1920+2020-permit anomaly to address-normalizer mismatch between `load-pp-universe.mjs` and `backfill-pp-signals.mjs`
   - UX: revealed Lead-Spy's polygon-gate UX (no list shown until polygon drawn) — saved as v1.2 backlog item

## Locked decisions this session

### Pricing model (added to source-of-truth)
- **Pattern:** bundled small + at-cost overage (NOT pure metered, NOT tiered)
- **$149/mo Pro = 50-75 postcards bundled** (final number locks after step 4 Lob quote)
- **Overage:** Lob actual cost + $0.10/card processing fee
- **Soft cap:** 500/mo at-cost
- **Marketing anchor:** "We don't markup your mail" (Lead-Spy can't structurally copy)
- Saved as `project_pp_pricing_model_2026-04-26` memory + locked in source-of-truth

### Cuts that survived after Lead-Spy head-to-head
- Owner name (legal + brand exposure)
- CSV export (kills QR→Riley loop)
- À la carte pricing (anchors as "list product")
- 20yr permit threshold (FL storm cycle makes 7yr correct for now)
- Map polygon UI in MVP (1.5-2 day build, defer to v1.2)

## Outstanding debt → step 4 pre-reqs

1. **Address normalizer unification** — root cause of 52 false-positive permit rows. Defensive UI filter masks today; want canonical `lib/property-pipeline/address.ts` next session.
2. **Defensive filter removal** — once normalizers unified, drop the `last_roof_permit_date >= NOW() - 10 years` exclusion in `queries.ts`.

## Open questions for next session

- Lob first-piece quote → locks final bundle number
- Sort direction for the 408 with-permit rows: currently oldest-permit-first within that group — verify with design partner
- Whether to bump permit threshold to 15-20yr (Lead-Spy parity, ~10-15K universe)
- Whether to add Mapbox polygon entry UX (1.5-2 day v1.2 build)

## Acceptance criteria — all verified

1. ✅ `/dashboard/pipeline` returns 200, loads RLS-scoped rows
2. ✅ Empty state renders if `service_area_zips` NULL, links to working Settings tab
3. ✅ ZIP chip filter + pagination + total count work
4. ✅ Send button → confirm dialog → 501 stub toast
5. ✅ Sort hides 1850s farmhouses; ~2010 sweet-spot leads
6. ✅ Recent-permit rows hidden from view
7. ✅ Visual fit matches `.neu-dashboard` warm-cream theme
8. ✅ Settings → Service Area picker writes `service_area_zips` correctly

## What's NOT done (deferred per simplification)

- Real Lob send (step 4)
- Postcard template (step 5)
- Riley QR-scan landing tweaks (step 5)
- SB 76 disclosure on actual postcard (step 6)
- Smoke test (step 7)

## Next session

→ **Step 4 — see `research/property-pipeline-step-4-handoff.md`**
