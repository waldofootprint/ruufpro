# Session 15 Handoff — PP Step 5 copy iteration + visual style polish

**Continues from:** Session 14 (PP step 5 production HTML + 3D-Discovery v6 pivot + Lead-Spy competitive refinements)
**Branch:** `main` (working tree dirty — session 14 changes UNCOMMITTED, see "deploy state" below)
**Type:** Creative iteration — copy tightening + visual polish on the postcard template
**Estimated effort:** ~2-3 hr Claude (one focused session)

---

## ▶️ COPY-PASTE PROMPT FOR NEXT SESSION

```
Pick up RuufPro session 15. Read first:
1. research/handoff-2026-04-28-session-15-pp-step5-copy-and-style.md (this file)
2. decisions/property-pipeline-mvp-source-of-truth.md (lines 79-108 — locked v6 direction + relaxed rules)
3. decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md (full pivot context + Lead-Spy refinements)
4. MEMORY.md

Today's focus: PP step 5 copy iteration + visual style polish.

The structure shipped in session 14 (4 headline variants, FREE ROOF INSPECTION
stamp, public-records framing). Hannah wants to keep iterating on:
  (1) wording for each of the 4 variants
  (2) visual style improvements — the postcard reads as too plain / not
      polished enough vs. the Lead-Spy competitive gallery

Direction is locked at the conceptual level (3D-Discovery v6). Don't re-debate
the concept. The work is craft — sharper copy, better typographic hierarchy,
better stamp design, tighter spacing, possibly one photo variant for A/B.

Auto mode: ask Hannah at start.

Invoke /property-pipeline-build skill to load the rest.
```

---

## Where session 14 ended

### Locked decisions (do NOT re-debate)

- **3D-Discovery v6** is the postcard creative direction. Insurer-flags v5 archived in git history.
- **4 headline variants** ship: A · Storm-led, B · Public-records-led, C · Block-comparison, D · Permit-honesty
- **D is the primary** — `app/api/pipeline/send/route.ts` defaults to it. All 4 still ship; round-robin logic deferred.
- **Per-home rule relaxed** — attributed claims OK ("public records show...", "we couldn't find a permit..."). Bare assertions still banned ("your roof is 23 years old").
- **"Free roof inspection" approved** as standard CTA. "Free estimate" still banned.
- **No photo on the postcard** — the 3D landing page is the visual asset. *Open question for session 15: should one variant have a photo for A/B testing? Hannah hasn't decided. Mike-agent input optional.*
- **All compliance invariants intact:** SB 76 verbatim disclosure, half-rule font cap (32px max / 16px floor), license # both sides, opt-out URL footer.

### Current copy (verbatim, from `lib/property-pipeline/postcard-template.tsx`)

**A · Storm-led**
- Headline: *"47 named storms have hit Florida since 2009."*
- Sub: *"Most pre-2010 roofs have weathered every one of them. Scan for a free roof inspection — and a 3D look at your home, your roof's age, and how it stacks up on your block."*

**B · Public-records-led**
- Headline: *"Public records suggest your roof hasn't been replaced in 20+ years."*
- Sub: *"That's when most Florida roofs start showing problems beneath the shingles. Scan for a free inspection — your home in 3D, your block's roof history, and storms survived."*

**C · Block-comparison**
- Headline: *"Three roofs on your block were replaced last year. Was yours?"*
- Sub: *"Scan for a free roof inspection — see your home in 3D, your roof's likely age, and where you land on your block."*

**D · Permit-honesty (PRIMARY)**
- Headline: *"We couldn't find a roof permit on your address."*
- Sub: *"Records this far back usually mean it's been 20+ years since the last replacement. Scan for a free roof inspection — your home in 3D, your roof's likely age, and how your block compares."*

**Front footer stamp:** `FREE ROOF INSPECTION` / `NO CALL · NO PITCH · LICENSED FL ROOFER`
**Back QR scan-line:** *"Scan for a free roof inspection."*
**Back tease lead:** *"Three things you'll see when you scan:"*
**Back question trio:**
1. *How old is your roof, really?*
2. *How many storms has it been through?*
3. *Whose roofs on your block have already been replaced?*

---

## What session 15 should work on

### 1. Copy tightening — known weak spots

These are the lines I'd attack first based on a re-read after session 14 closed:

- **A sub is overstuffed.** Three promises in one sentence ("home in 3D / roof's age / how it stacks up on your block"). Pick two.
- **D sub is wordy.** "Records this far back usually mean it's been 20+ years since the last replacement" → could tighten to "That usually means 20+ years since the last replacement." or similar.
- **B headline is the longest of the four** at 64 chars. May feel heavy next to D's punchy 49 chars.
- **C is the strongest as-written.** Probably leave it. Use it as the bar for the others.
- **Back tease lead** ("Three things you'll see when you scan:") may be redundant — the question trio carries the same job. Either kill the lead or make it earn its slot.
- **Question trio:** all three are well-formed but #2 ("How many storms has it been through?") is the weakest — feels generic. Sharper: *"What storms has your roof outlived?"* or *"How many named storms is your roof on the receiving end of?"*

### 2. Visual style improvements — known weak spots

After looking at Lead-Spy's gallery, our postcard is editorial but **plain**. Specific things that need craft:

- **Front top-rule** is currently `[stripe] FL · D [stripe]` — the variant code in production output is meaningless to the homeowner. Either drop the code (keep `FL ·` mark) or replace with something like `FLORIDA HOMEOWNER NOTICE · 2026` or a date stamp.
- **FREE ROOF INSPECTION stamp** — currently a 2px terracotta border with mono small caps. Reads OK but lacks craft. Options:
  - Diagonal stamp angle (-3°) to feel hand-stamped vs. printed
  - Add a "VALID THIS WEEK" or date sub-line for urgency without using "limited time"
  - Two-tone: terracotta border + cream fill
  - Or scrap the box entirely and use a typographic mark (like a serif "Free roof inspection" with a small terracotta dot)
- **Headline-to-lede rhythm** — currently 36px gap. Headlines vary in length; spacing should adapt. Headline B (longest) feels cramped; headline D (shortest) feels lonely.
- **Back question trio** — the "01 / 02 / 03" terracotta serif numerals are decent but could be more interesting. Try: large outline numerals behind the text, or numerals as little circles, or kill numerals entirely and use serif drop-caps on the first letter of each question.
- **Back QR block hierarchy** — currently 4 vertical layers (scan-line / scan-sub / code / url). Visually noisy. Probably collapse scan-sub + code into one line.
- **Indicia / return-address spatial relationship** — currently indicia is `position:absolute` top-right and return-addr is in normal flow with padding. They sit close. Verify in Lob's HTML→PDF render that there's no overlap on long business names.
- **Color discipline** — terracotta is used on hairlines, numerals, meta strip, AND stamp border. Possibly too many places. Pick 2-3 anchors and pull terracotta from the rest.

### 3. Maybe-add-a-photo-variant question

Open from session 14: should ONE of the 4 variants be photo-led (roof-evidence photo bleeds right 45%)?

- **For:** Lead-Spy's photo-first cards survive the 0.3-second trash-can sort better than text-only. We may be losing scans by being 100% editorial.
- **Against:** The 3D landing page IS the visual reveal. A stock roof photo on the postcard cheapens the surprise. Also: an extra variant complicates testing.
- **Decision needed:** Hannah pick at the start of session 15. If yes, B is the natural slot to swap (currently weakest). Stock photo: search Pexels/Unsplash for a CC-licensed roof-mid-inspection (boots/shingles/tape-measure, NOT team headshot). Place at `public/postcard/stock-roof-inspection.jpg` and document the license source.

### 4. Pre-deploy validation (carry over from session 14 handoff, still applicable)

Before any push:
1. Render all variants on `/dashboard/pipeline/preview` — visual side-by-side
2. Verify SB 76 disclosure still renders at 16px on the back; verify nothing on either side exceeds 32px
3. `npx tsc --noEmit` clean
4. Send a test-mode postcard via the dashboard, inspect Lob's preview PDF — confirm at least the primary variant (D) renders correctly through Lob's HTML→PDF
5. Eyeball indicia + return-address with a long contractor business name to verify no overlap

---

## Deploy state at end of session 14

**Nothing committed. Nothing deployed. Working tree dirty.**

Modified files (uncommitted):
- `lib/property-pipeline/postcard-template.tsx`
- `app/dashboard/pipeline/preview/page.tsx`
- `app/api/pipeline/send/route.ts`
- `decisions/property-pipeline-mvp-source-of-truth.md`

New files (untracked):
- `decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md`
- `research/handoff-2026-04-28-session-15-pp-step5-copy-and-style.md` (this file)

`main` HEAD remains at `e363261`. Live deploy on ruufpro.com is unaffected. The PP postcard preview at `/dashboard/pipeline/preview` shows session 14's output ONLY when running locally (`npm run dev` was active at session end on port 3000).

**Recommendation for session 15 start:** decide whether to commit the session 14 work as a checkpoint before iterating, or keep iterating on top of the dirty tree and commit once at the end. Either is fine; checkpoint is safer if any iteration goes badly.

---

## Things NOT to do in session 15

- ❌ Don't re-debate the 3D-Discovery v6 direction. Locked.
- ❌ Don't re-debate the per-home rule relaxation or free-inspection CTA. Locked.
- ❌ Don't touch SB 76 disclosure constants or the verbatim text.
- ❌ Don't auto-deploy. Always ask.
- ❌ Don't add `LOB_API_KEY_LIVE` to Vercel — still gated on Hannah + signed FL roofer.
- ❌ Don't try to ship PP.7 smoke test. Still blocked on signed FL roofer license #.
- ❌ Don't get pulled into rebuilding the QR landing page mid-session — that's a separate multi-session beat. The postcard's promises must be POSSIBLE on the eventual landing page; don't promise things we can't deliver.

---

## Open carryovers (not blocking session 15)

- [ ] Lob account verification (email + payment) — 5 min Hannah action, before LIVE key is added in a future session
- [ ] Calloway design partner signature — needed for any LIVE postcard
- [ ] QR landing page build — separate multi-session beat. Currently a stub at `/m/[code]`.
- [ ] **Verify the "47 named storms" number** against NOAA Storm Events Database before first live send (headline A). If wrong, swap the number — it's still cohort-level, still compliant.
- [ ] Round-robin variant selection logic in `app/api/pipeline/send/route.ts` (currently hardcoded to D)
- [ ] Re-evaluate after first 100 sends — performance-driven variant winnowing
- [ ] Vercel auto-alias still broken — every push to main needs manual `vercel alias set` for ruufpro.com + www
- [ ] Lob TEST key leaked in commit `d762bb4` (sessions log) — still needs rotation per session 11 handoff

---

## Quick reference

| | |
|---|---|
| `main` HEAD | `e363261` (UNCHANGED — session 14 work uncommitted) |
| Live deploy | `dpl_*cwlh3nxjr*` on ruufpro.com + www (UNCHANGED from session 13) |
| PP source-of-truth | `decisions/property-pipeline-mvp-source-of-truth.md` lines 79-108 |
| PP pivot decision log | `decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md` |
| PP.5 file to edit | `lib/property-pipeline/postcard-template.tsx` |
| Send route | `app/api/pipeline/send/route.ts` (default variant D) |
| Preview page | `app/dashboard/pipeline/preview/page.tsx` (D listed first) |
| Skill to invoke | `/property-pipeline-build` |
| Local preview URL | `http://localhost:3000/dashboard/pipeline/preview` (note: http, not https) |
| Ship ritual | push to main → wait for build → manual `vercel alias set` for ruufpro.com + www |
