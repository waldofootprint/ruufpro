# Property Pipeline — Setup Page Restyle Handoff

**Date written:** 2026-04-27
**For:** Next session, fresh context
**Skill to load FIRST:** `/frontend-design` — then `/property-pipeline-build` for context if needed
**Estimated effort:** ~30-45 min

---

## What needs to happen

The PP opt-in setup page shipped working but is stylistically out of band with the rest of the dashboard. It uses generic Tailwind tokens (`bg-gray-50`, `bg-white rounded-xl border border-gray-200`) instead of the dashboard's `neu-` design system.

**Goal:** restyle the setup page so it matches the existing dashboard surfaces *exactly* — same surface treatment, same type ramp, same spacing rhythm, same accent colors.

**Do NOT change behavior.** Form fields, validation, submit flow, redirects, server-side gates are all working in production (`dpl_2GuVmmWMZRfMgrJ6j22PyvBygU1C` → ruufpro.com). This is purely visual.

---

## Files to restyle

| File | What it is |
|---|---|
| [app/dashboard/pipeline/setup/page.tsx](app/dashboard/pipeline/setup/page.tsx) | Server component shell — `<main>` background, header, max-width container |
| [app/dashboard/pipeline/setup/setup-form.tsx](app/dashboard/pipeline/setup/setup-form.tsx) | Client form — three `<section>` cards, license input, ZIP multi-select grid, clickwrap with scrollable text block, submit button, error banner |

---

## Reference — dashboard design system

The dashboard uses a custom `neu-` system on top of Tailwind. Crib styles from these:

- [components/dashboard/property-pipeline-tab.tsx](components/dashboard/property-pipeline-tab.tsx) — same feature surface; closest match for the setup page. Uses `neu-flat`, `neu-muted`, `tabular-nums`, `text-[11px] font-semibold uppercase tracking-wider`, etc.
- [components/dashboard/lead-list.tsx](components/dashboard/lead-list.tsx) — table + filter chip patterns
- [components/dashboard/stat-cards.tsx](components/dashboard/stat-cards.tsx) — card surface treatment
- [components/dashboard/sidebar.tsx](components/dashboard/sidebar.tsx) — nav/active states
- Global CSS where `neu-` classes are defined — grep for `neu-flat`, `neu-muted`, `neu-dashboard` to find the source of truth file

The dashboard v2 was shipped 2026-04-24 with a "warm cream + orange + DM Sans" palette (commit `2fe33f3`, deploy `dpl_27M1RcoVcaFYcoDWXVC3QbYGtx3v`). The setup page should drop into that aesthetic without looking like a separate sub-app.

---

## Specific elements that need attention

1. **Page background** — currently `bg-gray-50`. Dashboard uses the warm-cream surface. Match it.
2. **Section cards** — currently `bg-white rounded-xl border border-gray-200 p-5`. Replace with `neu-flat` (or whatever the dashboard equivalent is).
3. **Header type** — currently `text-2xl font-bold text-gray-900`. PP tab uses `text-2xl font-bold mb-1` paired with `neu-muted text-sm max-w-3xl` for the description. Mirror that.
4. **License input** — uses generic `border-gray-300`. Dashboard form fields likely have a different treatment.
5. **ZIP multi-select** — the checkbox-card grid style is fine in concept, but the active state (`border-indigo-500 bg-indigo-50`) is wrong color — the dashboard's accent is orange/cream, not indigo.
6. **Authorization clickwrap `<pre>` block** — currently `bg-gray-50 border-gray-200`. Should use the same surface treatment as dashboard scroll regions.
7. **Submit button** — currently `bg-gray-900`. Dashboard primary button is likely the orange/dark accent. Match the existing primary CTA style.
8. **Error banner** — `bg-red-50 text-red-700`. Probably fine but check against dashboard error states for consistency.
9. **Format-valid checkmark** (`✓ Format valid.`) — currently `text-green-600`. Match dashboard success-state color.

---

## Working pattern

1. Open ruufpro.com/dashboard/pipeline (need a contractor without PP setup) and ruufpro.com/dashboard/pipeline/setup side-by-side in browser
2. Open the live PP tab next to it for visual reference
3. Find the `neu-` class definitions in the global CSS
4. Restyle section by section — page shell first, then each of the 3 form sections, then the submit button + error banner
5. After each section, refresh both pages and visually compare. The setup page should feel like a sibling to the PP tab, not a different product.

---

## After restyling

1. **Visual QA on prod-like preview** — `npm run dev` or push to a Vercel preview branch. Test on mobile breakpoint too (the form needs to be usable on phone).
2. **Commit** as `PP step 6 — restyle setup page to match dashboard design system`
3. **Ask Hannah about deploying** — never auto-deploy. Standing rule.
4. **Update session log** at `sessions/YYYY-MM-DD-property-pipeline-setup-restyle.md`
5. **Mark this handoff done** — delete this file or move to `research/_archive/` once landed

---

## Things NOT to touch

- ❌ Form validation logic — license regex, ZIP whitelist, clickwrap requirement all work and are legally load-bearing
- ❌ The authorization text or its hash — those are versioned and an audit trail. Visual styling of the `<pre>` block is fine; the *content* must stay byte-identical
- ❌ Server-side gates in [app/dashboard/pipeline/page.tsx](app/dashboard/pipeline/page.tsx) — those redirect logic is working
- ❌ The MVP source-of-truth doc — step 6 is closed. This is a polish pass, not a step re-open
- ❌ Backend `/api/pipeline/setup/route.ts` — purely a UI restyle

---

## Context the next session needs

- Step 6 closed and deployed yesterday (2026-04-26): commits `212337b` + `b78ecd0` + `78651a1`, deploy `dpl_2GuVmmWMZRfMgrJ6j22PyvBygU1C`
- Step 5 (postcard creative) is parked — 12 tones rejected, none locked. Don't touch creative this session.
- Step 7 (smoke test) is unblocked from a wiring perspective; this restyle is independent of either step 5 or 7
- Branch: `feature/direct-mail-nfc`. Main is for promoted ship-ready work; PP lives on this branch until MVP closes
- Hannah has ADD — bullets only, show progress every 15-20 min, no "let me restyle the whole dashboard while I'm at it" scope creep

---

## How to start the next session

> Load `/frontend-design` skill. Then read this handoff: `research/property-pipeline-step6-restyle-handoff.md`. Then audit the two target files + 2-3 dashboard reference files to extract the design tokens. Show Hannah a before/after screenshot of one section first to confirm the direction before restyling all three sections.
