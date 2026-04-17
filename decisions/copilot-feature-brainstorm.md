# Copilot Feature Brainstorm — Approved List

> Source of truth for all Copilot features. Referenced by `/copilot-build` skill and `workflows/build_copilot_feature.md`.
> Last updated: 2026-04-17 (Session — #314 shipped)

## Approved Features (14)

### High Priority (P1)

| # | Feature | Status | Data Source | Example Output |
|---|---------|--------|-------------|----------------|
| 312 | Calculator Replay Count | **SHIPPED** `896852d` | `widget_events` (widget_view, living_estimate_view) | "Garcia checked their estimate 4 times — last visit 2 hours ago." |
| 313 | Material Switcher Detection | **SHIPPED** `b70fde0` | `widget_events` (material_switch) | "Garcia toggled between asphalt and metal 4 times." |
| 314 | Price Bracket / Adjustment Detection | **SHIPPED** `932bf85` | `widget_events` (material_switch + price_adjustment) | "Garcia made 5 changes. Compared asphalt ($8K–$12K) and metal ($14K–$20K). Last selection: metal." |
| 315 | Riley Chat Depth Score | Not started | `chat_conversations` (Riley messages) | "Garcia sent 15 messages — asked about warranties, timeline, and financing. High intent." |
| 316 | Storm Surge Detector | Not started | NWS alerts API + Inngest cron | "Hailstorm in 33609 two days ago. 4 of your leads are in that area." |
| 317 | Permit Data Intelligence (8a-c) | **SHIPPED** `e566a5c` | property_data_cache (year_built derived) | "Garcia's home was built in 1998. If original roof, that's 28 years." |
| 318 | Referral Chain Mapping | Not started | `leads` table (address proximity) | "Two leads from Maple Drive this week." |
| 319 | Win Pattern Recognition | Not started | `leads` table (needs ~50+ leads) | "Leads who asked about warranties AND financing closed higher for you." |

### Medium Priority (P2)

| # | Feature | Status | Data Source | Example Output |
|---|---------|--------|-------------|----------------|
| 320 | Budget Mismatch Alert | Not started | Estimate vs property value API | "This estimate is significant relative to this property's value." |
| 321 | Speed-to-Lead Coaching | Not started | `leads` (created_at vs contacted_at) | "Your close rate is stronger on leads where you responded within an hour." |
| 322 | Loss Autopsy | Not started | `leads` (status=lost patterns) | "3 recent losses had similar patterns — all quoted over $15K with no financing discussion." |

### Lower Priority (P3)

| # | Feature | Status | Data Source | Example Output |
|---|---------|--------|-------------|----------------|
| 323 | Return Visit Velocity | Not started | `widget_events` (view timestamps) | "Lisa visited 3x this week, each visit closer together." |
| 324 | Google Review Momentum | Not started | Google Places API or manual | "You just hit 4.8 stars!" |
| 325 | Seasonal Urgency Scoring | Not started | Date-based multiplier | Hurricane season / winter boost on existing scoring. |

---

## Rejected Ideas (4)

| # | Feature | Reason |
|---|---------|--------|
| 4 | Time-of-Day Stress Detection | Violates rule #2 — projects emotional state from browsing time |
| 11 | Ghosting Detector | Rejected by Hannah |
| 13 | Decision-Maker Detection | Not a fit for this product |
| 16 | Best Day/Time to Close | Rejected by Hannah |

---

## Tone Rules (6) — Non-Negotiable

Full checklist with fail/pass examples in `workflows/copilot_tone_checklist.md`. Summary:

1. **No fake expertise** — Data observations, not roofing advice
2. **No emotional assumptions** — Behaviors, not feelings
3. **No fabricated statistics** — Only numbers from THIS roofer's data
4. **Coach, don't command** — Suggestions, not orders
5. **Never condescend** — Partner-to-partner
6. **Inform, don't script** — What to KNOW, not what to SAY

---

## Feature Detail: #317 Permit Data Intelligence (8a-e)

Five sub-features, all sourced from FL public records:

| Sub | Feature | What It Surfaces |
|-----|---------|-----------------|
| 8a | Roof Age Auto-Lookup | Last roofing permit date + age. "Last permit: 2003. That's a 23-year-old roof." |
| 8b | No-Permit Flag | No permit ever + home built year = likely original roof. "No permits on file. Original roof likely (28 years)." |
| 8c | Replacement Cycle Alert | Permit 18-20+ years ago = end-of-life window. "Last roof 2006. At 20 years, they're in replacement window." |
| 8d | Post-Storm Permit Spike | Permit dates + weather data correlation. Identifies likely insurance jobs. |
| 8e | Permit Type Intelligence | Scope of work from permit type — full replacement vs repair vs re-roof over existing. |

**Key decision (Session I):** Original idea used permits for neighborhood-level scoring. Hannah pushed back — "more permits = better" isn't proven. Pivoted to individual lead enrichment instead.

---

## Build System

- **Skill:** `/copilot-build` — one feature per session
- **Workflow:** `workflows/build_copilot_feature.md` — 10-step pattern
- **Tone checklist:** `workflows/copilot_tone_checklist.md` — run on ALL new text
- **Key files:** `lib/copilot-tools.ts`, `lib/copilot-system-prompt.ts`, `app/api/dashboard/copilot/route.ts`

---

## Dashboard UI Integration (Pending)

Features ship as Copilot chat tools first. Dashboard cards/panels are a separate session. See memory: `project_copilot_features_built.md` for the running list.
