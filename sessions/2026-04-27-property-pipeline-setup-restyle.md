# Property Pipeline — Setup page restyle

**Date:** 2026-04-27
**Branch:** `feature/direct-mail-nfc`
**Skill:** `/property-pipeline-build` + `/frontend-design`
**Handoff executed:** `research/property-pipeline-step6-restyle-handoff.md` → archived to `research/_archive/`

---

## What shipped (uncommitted)

Restyled the `/dashboard/pipeline/setup` page so it matches the rest of the dashboard exactly. Behavior-only files (validation, submit, redirects, server-side gates) untouched.

**Files changed:**
- `app/dashboard/pipeline/setup/page.tsx` — dropped `<main className="bg-gray-50">` wrapper that was fighting the `.neu-dashboard` warm-cream surface from the dashboard layout. Replaced with the editorial heading pattern from `app/dashboard/settings/page.tsx`: `max-w-[880px]` container, `neu-glow-orange` ambient blur, `neu-eyebrow` label, 44px `font-bold` heading with `letterSpacing: -0.04em` + `<em className="neu-em">setup</em>.` accent, 15px muted description.
- `app/dashboard/pipeline/setup/setup-form.tsx` — full rewrite to use the canonical dashboard form primitives instead of generic Tailwind:
  - 3 section cards now use `<SettingsSection>` directly (20px radius, dual 6px/16px shadow, p-6/md:p-7, 18px bold title, 13px muted description)
  - License input uses `<NeuInput>` (auto-renders `neu-eyebrow` label, `neu-inset-deep` field, error state)
  - ZIP grid pills: `neu-flat` (inactive) / `neu-inset-deep` (active) with `var(--neu-accent)` orange — same pattern as ServiceAreaTab ZIP chips. Counter ("X / 25 selected") moved into the SettingsSection `action` slot using `neu-eyebrow`.
  - Auth `<pre>` clickwrap: `neu-inset-deep` 14px radius, transparent fill so the inset shadow reads against the card surface. Auth text content unchanged (load-bearing for the version hash).
  - Submit: `<NeuButton variant="accent">` — same orange pill CTA as Settings save buttons.
  - Format-valid checkmark: `text-green-600` → `var(--neu-accent)` w/ `<Check>` icon (matches dashboard accent-as-success pattern).

## What did NOT change

- `/api/pipeline/setup/route.ts` — untouched
- License regex `^(CCC|CGC|CRC|CB|RR|RC)\d{6,7}$` — untouched
- ZIP whitelist (20 Manatee ZIPs sorted by candidate count) — untouched
- Authorization text + version hash — byte-identical (legally load-bearing)
- Server-side redirect gates in `app/dashboard/pipeline/page.tsx` — untouched

## QA

- TypeScript clean (`tsc --noEmit` no errors on touched files)
- Local dev server compiled and was confirmed reachable at `http://localhost:3000/dashboard/pipeline/setup`. Killed at session end.

## Status

- ✅ Committed as `66d5ac8`
- ✅ Deployed `dpl_8axEsi4Qjbn1QsKsSJ3tYQNPxBuA` → ruufpro.com
- ✅ Handoff doc archived to `research/_archive/property-pipeline-step6-restyle-handoff.md`

## Next step

PP MVP status unchanged — step 5 (creative) still parked, step 7 (smoke test) still unblocked from a wiring perspective. This was a polish pass on already-shipped step-6 surface; doesn't change MVP critical path.
