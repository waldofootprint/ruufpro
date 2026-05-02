# Handoff — Audit `/v3` ridgeline-v3 Full-Page Port

**Date:** 2026-05-02 · **Status at handoff:** entire HTML preview at `.tmp/site-v3-letter-aligned/full-site.html` ported into Next.js components on branch `ridgeline-v3` and live at `/v3`. Hannah wants a fresh-eyes audit of the assembled page before iterating.

---

## Where things stand

- **Branch:** `ridgeline-v3` (up-to-date with `origin/ridgeline-v3`). Do NOT touch `main` or merge.
- **Route:** `/v3` is the full assembled preview. `app/page.tsx` still serves `ridgeline-v2` in prod — the swap to v3 is **not done** and must not happen without Hannah's explicit OK.
- **Calculator work:** lives on `origin/main` (7 commits ahead of local `main`). Local main is also 1 ahead of origin (the original handoff-doc commit `45a70ab`). Do not pull, rebase, or merge `main` from this branch.
- **Two unrelated files** in working tree (`app/demo-preview/[id]/demo-page-client.tsx` + `tsconfig.tsbuildinfo`) — leave alone. Hannah modified them at start of the prior session.

## How to start

1. Read this doc top-to-bottom.
2. Read `research/handoff-2026-05-03-port-marketing-site-v3.md` (the prior handoff with locks Hannah committed to — don't relitigate them).
3. Read `research/site-audit-2026-05-02.md` (senior design audit; P0/P1/P2 punch list — most P1s are already folded into the port, but verify).
4. Open both side-by-side:
   - **Reference (the design contract):** http://localhost:4488/full-site.html (run from `.tmp/site-v3-letter-aligned/` via `python3 -m http.server 4488` if needed)
   - **Ported v3:** http://localhost:3000/v3 (run via `npm run dev` if needed)
5. Look at the rendered page top-to-bottom on desktop AND at 390px mobile. Compare to the HTML preview.

## What's actually shipped at /v3

Render order on the page:

| # | Component | File | Surface | Notes |
|---|---|---|---|---|
| 1 | `HeroStage` | `components/ridgeline-v3/hero.tsx` | bone (animated grid + orbs) | Right column = static dashboard mock. Live `EstimateWidgetV4` hero is the **deferred 1-2 day spike** — do NOT attempt to wire it without Hannah's OK. |
| 2 | `MetaStrip` | `marquee.tsx` | ink strip | Static one-line per audit P2 (replaces the scrolling 6-item loop). |
| 3 | `GoogleUpdate` | `google-update.tsx` | sand | Side-by-side filter OFF/ON mocks. 4 citation cards with link icons. **URLs are `#` placeholders.** |
| 4 | `Toolkit` | `toolkit.tsx` | bone (sticky-stack on desktop) | 3 cards with differentiated surfaces (white / bone-3+rust hairline / sand-tinted edge). |
| 5 | `MarketingEverywhere` | `marketing-everywhere.tsx` | bg-deep | Setup card + bento. **Email Embed Code mock kept as-is — Hannah hasn't decided build vs strip.** |
| 6 | `MissedCall` | `missed-call.tsx` | bone-3 | Stage-stack pattern: 3 full-bleed cards stacked vertically (01 The miss / 02 The auto-reply / 03 The qualified lead). Light surface — earlier dark version was rejected. |
| 7 | `Pricing` | `pricing.tsx` | sand | Gradient border (ink/rust/ink, NOT coral — Hannah said less pink). "THE ONLY PLAN" outline ribbon. $6K ROI callout pulled out next to $149. Coral-bordered scarcity card promoted above price card. |
| 8 | `NoteFAQ` | `note-faq.tsx` | **DARK (the only dark moment on the page)** | 56px rust-gradient circle with "H" initial = **placeholder for Hannah's real headshot.** FAQ as accordion (`<details>`), first item open by default. |
| 9 | `Footer` | `footer.tsx` | ink | Infra strip (Stripe · Supabase · Vercel · Anthropic). Status link wired to `/api/health`. Address line + email surfaced. |

## Style architecture

- **Tokens** at `components/ridgeline-v3/_tokens.css` — `.rv3`-scoped CSS vars + section/eyebrow/display/lede/button primitives. Zero global leakage; v2 + roofer templates unaffected.
- **Primitives** at `components/ridgeline-v3/_primitives.tsx` — `Section` / `Wrap` / `Eyebrow` / `Display` / `Lede`.
- **CSS Modules per component** (`*.module.css`). Inner content classes that need to stay terse in JSX (phone screens, dashboard internals) use `:global(.classname)` selectors inside scoped roots.
- **Geist Sans + Geist Mono** loaded via `geist/font/{sans,mono}` directly in `app/v3/page.tsx` so v2 layout is untouched.

## Locked decisions (don't relitigate without checking with Hannah)

- **Component path:** `components/ridgeline-v3/` (clean break, NOT v2 in place).
- **Page-level color rhythm:** bone hero → ink marquee → sand Google → bone Toolkit → deep MarketingEverywhere → bone-3 MissedCall → sand Pricing → **dark NoteFAQ (only dark moment)** → ink Footer.
- **Riley naming:** never appears in marketing copy. Internal product UI keeps "Riley." Marketing says "AI assistant."
- **Type system:** Geist 400/500/600 only. No bold (700+). No Barlow Condensed. No all-caps display.
- **Pricing pink levels:** ink/rust/ink gradient border, outline ribbon, bone-on-bone scarcity card. Hannah explicitly dialed back from coral-saturated. Don't re-saturate.
- **Missed-call layout:** stage-stack (3 vertical cards), NOT the original 3-phones-in-a-row. Light surface, NOT dark. Both prior attempts (3-phones row + dark stage stack) were rejected.
- **Hero "From Hannah · A developer in Bradenton" eyebrow:** rejected twice. Don't add it.
- **No phone numbers / no AI voice receptionist** in any copy.

## Known placeholders (need Hannah inputs)

1. **Citation URLs** in `google-update.tsx` `CITATIONS` array — currently `#`. Need real Footbridge / Altavista / Priceguide / Demand-iq URLs.
2. **Hannah headshot** in `note-faq.tsx` — currently rust-gradient circle with "H" initial. Replace with a real circular photo (drop into `public/ridgeline-v3/hannah.jpg` or similar).
3. **Email Embed Code feature** at `marketing-everywhere.tsx` — the dashboard mock claims a feature that doesn't exist in `app/dashboard/settings/tabs/EstimatesTab.tsx`. Two paths from prior handoff: (a) build it (~2hr), (b) strip the mock and replace with real Copy-snippet UX. Hannah's instinct = build. Confirm before scoping.

## Deferred / explicitly off-limits

- **Live `EstimateWidgetV4` hero.** Replacing the static dashboard mock with the real interactive widget is a 1-2 day spike. Branch `feature/postcard-3d` at `~/RoofReady-postcard-3d/` has integration code for the 3D tiles part. Do NOT attempt without Hannah's explicit OK — she'll authorize when ready.
- **Mounting v3 at `app/page.tsx`.** That single-line swap is the moment of truth. Do NOT do it without explicit OK.
- **`vercel --prod --force` deploy.** Verified workflow is `git push origin main` → Vercel auto-deploys + auto-aliases. The CLI direct-deploy bypasses Git integration. (Note: branch pushes auto-create Vercel preview deploys; those are fine — they don't touch prod.)
- **Vercel preview env vars.** Branch preview deploys currently fail at build because Preview scope is missing 35 prod-only vars (Supabase URL, etc). Hannah needs to copy them via Vercel dashboard. Until then, only **localhost** previews work — `npm run dev` then `/v3`.

## Audit suggestions (priority order for fresh eyes)

1. **Whole-page rhythm pass.** Walk top to bottom on desktop. Does the surface alternation feel intentional or arbitrary? Does the dark NoteFAQ moment land as the climax? Are there two adjacent sections that look too similar?
2. **Mobile pass at 390px.** Nav hamburger swap, hero stack, sticky-stack release on Toolkit, balloon row wrap, FAQ accordion, footer wrap. Look for overflow + crowding.
3. **Compare to HTML reference.** Anything that drifted from the design contract? Specifically:
   - Hero pill + h1 + lede spacing
   - Toolkit card transitions (sticky stack on desktop)
   - Bento truck animation + door hanger / business cards / balloons proportions
   - Pricing gradient border subtlety
   - NoteFAQ avatar + signature treatment
4. **Type hierarchy.** Audit flagged the page has no true display tier (everything is body/lede/H3/H2 capped at 56px). Should `$149` break the scale ceiling at 72-96px? Do other H2s read at the same weight as H3s?
5. **Color earning rate.** Audit said rust/coral show up too decoratively. Does the page have at least one "rust-saturated load-bearing moment" that isn't a button or accent?
6. **Trust scaffolding.** Hannah's voice + 4 source cards + infra strip + Hannah note signature carry the credibility load. Is there a missing piece?
7. **Mobile nav hamburger** has no functional menu yet — it's a static button. Either wire it to an open/close state or note as a follow-up.
8. **Inner CSS Module `:global()` selectors.** Lots of `<span className="bubble them">`-style markup inside `:global()` blocks. Verify nothing leaked styles to other components.

## Open follow-ups to raise with Hannah after audit

- Citation URLs (4)
- Headshot photo
- Email Embed Code feature build vs strip decision
- Live calculator hero spike — when?
- Vercel Preview env var copy (35 vars) so branch previews build
- Mobile hamburger menu — functional or scope-cut for v3 launch?

## What NOT to do this session

- Don't merge `ridgeline-v3` into `main`.
- Don't change `app/page.tsx`.
- Don't touch `components/ridgeline-v2/` or `components/templates/` or `app/site/[slug]/` (roofer-template stuff is NOT part of the offer).
- Don't add Riley to marketing copy.
- Don't introduce Barlow Condensed or 700+ weights.
- Don't restage the 3-phones-in-a-row Missed-call layout.
- Don't darken the Missed-call section.
- Don't re-saturate the Pricing pink.
- Don't add the "From Hannah · A developer in Bradenton" eyebrow.
- Don't deploy `vercel --prod --force`.
- Don't commit the 2 unrelated modified files in the working tree.

## Files written this session (last commit `4611fcb`)

```
components/ridgeline-v3/
├── _tokens.css
├── _primitives.tsx
├── nav.tsx + nav.module.css
├── hero.tsx + hero.module.css
├── marquee.tsx + marquee.module.css
├── google-update.tsx + google-update.module.css
├── toolkit.tsx + toolkit.module.css
├── marketing-everywhere.tsx + marketing-everywhere.module.css
├── missed-call.tsx + missed-call.module.css
├── pricing.tsx + pricing.module.css
├── note-faq.tsx + note-faq.module.css
└── footer.tsx + footer.module.css

app/v3/page.tsx (mount point, noindex)

public/ridgeline-v3/
├── phone-cutout.png
├── 3d-roof-landing.png
└── truck-cutout.png
```

Total: 6 commits on `ridgeline-v3` from `89ea318` to `4611fcb`.
