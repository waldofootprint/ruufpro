# Onboarding Rebuild — Scoping Doc

**Date:** 2026-04-27
**Status:** SCOPING — no code yet. Hannah ratifies before /onboarding-build session opens.
**Why now:** Current `app/onboarding/page.tsx` (980 lines) is a leftover "build your website" flow that violates RuufPro's hard rule (we do NOT offer websites). Riley URL-crawl session 4 surfaced it — URL-crawl Screens 1.5/1.6/1.7 were bolted ONTO the website-builder onboarding instead of replacing it. Cannot ship URL-crawl until the host flow is clean.
**Branch plan:** new branch `feature/onboarding-rebuild` cut from `feature/direct-mail-nfc` HEAD `ffa2c49` (live prod). Riley URL-crawl branch waits — its commits get cherry-picked or merged in once the rebuild lands.

---

## §1 — Hard rules (do not relitigate)

| # | Rule |
|---|---|
| 1 | We do NOT build, sell, or host websites. NEVER. |
| 2 | Single tier: Pro $149/mo, 14-day trial, no credit card. |
| 3 | Onboarding output is a configured Riley + an embed snippet + a standalone Riley URL (`ruufpro.com/chat/[id]`). Nothing else. |
| 4 | Visually match the dashboard: `.neu-dashboard` cream + orange + DM Sans. |
| 5 | URL-crawl Screens 1.5/1.6/1.7 + `CrawlReview.tsx` are KEEPABLE unchanged. They are the core Riley pre-fill mechanic. |
| 6 | Owner_name nudge on Riley fine-tune screen — top conversion signal per memory `project_riley_training_gaps_2026-04-27.md`. Suggested-only, never auto-filled. |
| 7 | Stripe trial handoff stays at flow-end. Remove the "your website is published" celebration. |

---

## §2 — Current state audit

### What `app/onboarding/page.tsx` does today (980 lines)

| Screen | Purpose | Verdict |
|---|---|---|
| 1 | "Let's build your website" — businessName + phone + city + state | **REPHRASE.** Keep the form, change the headline + subhead + CTA copy. |
| 1.5 / 1.6 / 1.7 | URL-crawl: paste URL → SSE scan → CrawlReview | **KEEP unchanged.** Session 3's work. |
| 2 | LoadingScreen animation ("Building your site…") | **DELETE.** New flow has no website to build. |
| 3 | Full editor — template picker, hero editor, services editor, about editor, cities, trust badges, LivePreview side-panel | **DELETE entirely.** All 7 sub-modules are website-product. |
| 4 | "Your website is published" celebration with public URL | **REPLACE** with embed-snippet payoff screen. |

### Schema & writes

- Today onboarding writes to BOTH `sites` (template, services, about_text, hero_*, hero_cta_text) AND `chatbot_config` (URL-crawl Stash-A merge).
- New flow writes to `contractors` + `chatbot_config` ONLY.
- `sites` row stays — but minimal: `{ id, contractor_id, slug, published: true }`. The slug powers the standalone Riley URL `ruufpro.com/chat/[slug]` and the embed snippet's contractor lookup.
- **AUDIT REQUIRED before delete:** grep every read of `sites.template`, `sites.services`, `sites.about_text`, `sites.hero_*`, `sites.cities`, `sites.trust_badges` across the codebase. If any code (dashboard, prospect demo, marketing site, widget) crashes when those columns are null, fix or migrate first. **Open the audit BEFORE writing any rebuild code.**

### Visual reference

`.neu-dashboard` tokens (from `app/globals.css`):
- bg `#e0e2e6` (warm cream, light neumorphic)
- accent `#f97316` (orange) — primary CTA + progress + accents
- text `#2d2d2d` main, `#6b7280` muted
- font DM Sans (var `--font-dm-sans` already wired in `app/layout.tsx`)
- radii 12–16px
- `.neu-raised` (6px outer shadow + light inset) for cards
- `.neu-flat` (3px subtle) for secondary surfaces
- `.neu-inset` (pressed) for input wells
- `.neu-accent-btn` for primary buttons (orange fill, raised, translateY on hover)
- Dark mode auto-supported when `<div className="neu-dashboard dark">` — onboarding can mirror dashboard's dark-mode toggle if desired.

---

## §3 — Proposed new flow (4 screens)

### Screen 1 — Basics
- **Headline:** *"Let's get Riley ready for your site."*
- **Subhead:** *"Two minutes. Riley starts answering homeowner questions on your existing site as soon as we're done."*
- **Fields:** business_name · phone · city · state (existing form, copy-only swap)
- **CTA:** "Continue → Scan my site"
- **Style:** centered card on neu-dashboard bg, max-width ~640px, `.neu-raised`, DM Sans display 32px headline / 18px body / 14px label.

### Screen 2 — Riley URL crawl (UNCHANGED from session 3)
- Reuse existing Screens 1.5 + 1.6 + 1.7 verbatim. Path: paste URL → SSE crawl → CrawlReview.
- Fix: re-skin the surrounding chrome (header, progress dots) to neu-* tokens. The CrawlReview component itself can keep its current styling for now if it's already neutral; flag if not.
- Skip path: "I don't have a website / skip" → goes to Screen 3 with empty crawl_state.

### Screen 3 — Riley fine-tune
- **Headline:** *"Sound check."*
- **Subhead:** *"This is what Riley will say. Tweak anything that's off."*
- **Inline editable fields** (each prefilled from crawl_state when available, blank otherwise):
  - Owner name (suggested-only, NOT auto-filled even when crawled — flag with copy *"Riley converts 2× more leads when she can introduce the owner by name."*)
  - Warranty description
  - Financing options
  - Top differentiators (3 bullets)
  - Team description (1-2 sentences)
- **Layout:** `.neu-raised` card per section, accordion/expandable if needed. Orange "From your site" pill on prefilled fields. Confidence indicator carries through.
- **CTA:** "Continue → Get my embed code"

### Screen 4 — Ship it
- **Headline:** *"Riley's live."*
- **Two-card payoff:**
  1. **Embed snippet card** (`.neu-inset` code block, monospace, 12px radius, copy button) — *"Paste this anywhere on your site (between `<body>` tags). Works on Wix, GoDaddy, Squarespace, WordPress, anything."*
  2. **Standalone link card** — *"Or share Riley directly: `ruufpro.com/chat/[slug]`"* with copy button + a "Test Riley" button that opens the standalone URL in a new tab.
- **Below:** "Open dashboard →" primary CTA (orange neu-accent-btn).
- **Stripe trial start** fires on this screen's "Open dashboard" click (or earlier — TBD see §5 Q1).

---

## §4 — Reuse map (what code lives where)

| Asset | Current location | New role |
|---|---|---|
| Business basics form | `app/onboarding/page.tsx` lines 462-555 | Screen 1 (copy-only swap) |
| URL-crawl screens 1.5/1.6/1.7 | `app/onboarding/page.tsx` lines 557-650 | Screen 2 (extract into `<OnboardingCrawlScreens>` component) |
| CrawlReview component | `components/onboarding/CrawlReview.tsx` | Screen 2 (used as-is) |
| handleCrawlReviewSave | `app/onboarding/page.tsx` lines 261-284 | Screen 2/3 bridge (used as-is) |
| handlePublish chatbot_config merge | `app/onboarding/page.tsx` lines 362-392 | Screen 4 publish action — strip `sites` writes, keep chatbot_config writes |
| Stripe trial integration | `app/onboarding/page.tsx` lines 394-406, 440-445 | Screen 4 "Open dashboard" handler |
| Slack notify on signup | already wired | unchanged |
| Onboarding email sequence | already wired (commit `d879fa2`) | unchanged |

| Asset | DELETE entirely |
|---|---|
| Template picker (3 design styles) | lines 22-47, 651-675 |
| LivePreview side panel | lines 863-881 |
| HeroEditor + SectionToggle | lines 14, 678-685, 814-826 |
| Services editor | lines 687-707 |
| About text editor | lines 814-826 |
| Cities/service-area editor | lines 829-834 |
| Trust badges editor | lines 761-810 |
| LoadingScreen animation | screen 2 |
| "Your website is published" screen | screen 4 |
| `sites.template` / `sites.services` / `sites.about_text` / `sites.hero_*` / `sites.cities` writes | line 351-360 |

---

## §5 — Open questions for Hannah (decide before build)

| # | Question | Recommendation |
|---|---|---|
| Q1 | When does Stripe trial start? On screen 1 submit (current) or screen 4 "Open dashboard"? | **Screen 4.** Lets Hannah see the full Riley payoff before any payment friction. Conversion lift likely. |
| Q2 | Keep dark-mode toggle on onboarding? | **No.** Light only on first run. Dashboard dark-mode is a returning-user feature. |
| Q3 | Does the standalone Riley URL stay at `ruufpro.com/chat/[slug]` or change? | **Keep.** That URL is already live + indexed + shareable. Don't break it. |
| Q4 | Skip-URL-crawl path: empty Screen 3 (manual fill) or "we'll generate sensible defaults" (Haiku)? | **Manual fill.** Keep the trust signal that Riley reflects THEIR business — not a generic template. |
| Q5 | Embed snippet contents: just `<script>` tag, or full `<script>` + positioning hint + theme? | **Just `<script>` + a one-line comment.** Roofers paste it; we render the floating button at default position. Customization lives in dashboard later. |
| Q6 | Should onboarding redirect logged-in users with no contractor row to a "you already have an account, log in" instead of duplicate-insert error? | **Yes.** Quick win. Detect existing user → redirect to `/dashboard` if contractor exists, else continue onboarding. |

---

## §6 — Build order (one PR per beat, recommended)

1. **§6.0 Audit pass** — grep every read of `sites.template/services/about_text/hero_*/cities/trust_badges` codebase-wide. Output: kill-list or migrate-list. **HARD GATE** — no code work until this lands. Estimated 30 min.
2. **§6.1 Shell + Screen 1** — new `app/onboarding/page.tsx` skeleton wrapped in `<div className="neu-dashboard">`. Screen 1 form working, copy swapped, neu-raised card. No template picker. No state for designStyle. ~1.5 hr.
3. **§6.2 Screen 2 wiring** — extract URL-crawl screens into `<OnboardingCrawlScreens>` component, wire into new shell. Re-skin chrome to neu-* tokens. Verify SSE auth path still works. ~1 hr.
4. **§6.3 Screen 3 fine-tune** — new "Sound check" screen with inline-editable warranty/financing/differentiators/team_description/owner_name. CrawlReview Stash-A pattern. ~2 hr.
5. **§6.4 Screen 4 ship** — embed snippet card + standalone link card + "Open dashboard." Strip `sites.*` writes from `handlePublish`. Move Stripe trial start here per Q1. ~1.5 hr.
6. **§6.5 Q6 quick win** — duplicate-account redirect. ~20 min.
7. **§6.6 Build verify + park `lib/chat-request-inspection.ts` + preview deploy** — Hannah eyeballs. ~30 min.
8. **§6.7 Cherry-pick or merge `feature/riley-url-crawl`** — bring in any session 3 code that wasn't already absorbed. Likely zero conflicts since URL-crawl screens were lifted into the new shell. ~30 min.
9. **§6.8 Prod deploy gate** — verify branch contains all live-prod work, preview eyeballed, Hannah explicit approval, then `vercel --prod --force`. ~15 min.
10. **§6.9 E2E test** with `waldo12397+riley-test@gmail.com` (per memory `project_riley_test_account.md`). ~30 min.

**Total estimate: 8–10 hr across 2-3 sessions.** Could be 1 long day if no audit blockers surface in §6.0.

---

## §7 — Out of scope

- Marketing site updates (already shipped editorial v2)
- `/signup` flow refactor (its own beat — onboarding rebuild assumes signup still works as-is)
- Riley scheduling feature (parked — see memory `project_chat_request_inspection_blocks_deploy.md`)
- Dashboard restyles (already shipped on prod)
- Multi-language onboarding
- Onboarding analytics events (existing tracking continues; no new events)
- Owner_name auto-fill (decided NO — suggested-only stays per locked decision #3)

---

## §8 — Risks

| Risk | Mitigation |
|---|---|
| Downstream `sites.*` reads crash when columns null | §6.0 audit gate |
| Standalone Riley URL breaks when slug-only `sites` row insufficient | Verify `app/chat/[identifier]/page.tsx` only needs `sites.slug` + contractor_id |
| URL-crawl SSE auth (loosened to user-only in session 3) collides with new shell | Test on preview before §6.4 |
| `lib/chat-request-inspection.ts` blocks build | Standard park-and-restore ritual per memory |
| Existing Stripe trial wiring breaks when moved from screen 1 to screen 4 | Keep the same callback — just defer the trigger |
| Branch parity vs prod (the session 3 mistake) | §6.8 explicit gate per memory `feedback_verify_branch_vs_live_prod_before_deploy.md` |

---

## §9 — Approval checklist

Before /onboarding-build session opens, Hannah confirms:
- [ ] §3 4-screen flow approved (or counter-proposes)
- [ ] §5 Q1-Q6 decisions
- [ ] Branch name `feature/onboarding-rebuild` cut from `feature/direct-mail-nfc` HEAD `ffa2c49`
- [ ] §6.0 audit kicks off first, no code until results land
- [ ] Estimate 8-10 hr / 2-3 sessions accepted
