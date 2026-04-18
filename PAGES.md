# PAGES.md — Source of Truth for Routes

> **READ THIS BEFORE TOUCHING ANY ROUTE.** Updated 2026-04-18 (Session AO).
> If a folder isn't listed here, it shouldn't exist. If you add a route, add a row.

## Dashboard (roofer's app — LOCKED to 3 nav destinations)

| Route | File | Status | Description |
|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | ✅ LIVE | **Polished Leads page (home).** Neumorphic list + lead-row accordion with Copilot AI draft + Ask Copilot chat. |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | ✅ LIVE | 6-tab settings: Profile, Riley, Estimates, Reviews, Integrations, Billing. Deep-linked via `?tab=X`. |
| `/dashboard/insights` | — | 🚧 NOT BUILT | Riley analytics + review stats. Sidebar shows "Soon" pill. |

**Dashboard internals (not routes):**
- `app/dashboard/layout.tsx` — sidebar + theme shell
- `app/dashboard/DashboardContext.tsx` — client-side data provider

**DEAD — do not recreate:** `/dashboard/leads` (old kanban), `/dashboard/copilot` (Copilot is an accordion, not a page), `/dashboard/weekly`, `/dashboard/my-site`, `/dashboard/domains`, `/dashboard/billing`, `/dashboard/chatbot`, `/dashboard/reviews`, `/dashboard/estimates`, `/dashboard/addons`, `/dashboard/sms`, `/dashboard/chatbot-analytics`.

## Marketing Site (sells RuufPro to roofers)

| Route | File | Status | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | ✅ LIVE | Marketing home. Ridgeline hero. |
| `/signup` | `app/signup/page.tsx` | ✅ LIVE | Roofer signup. |
| `/login` | `app/login/page.tsx` | ✅ LIVE | Login. |
| `/onboarding` | `app/onboarding/page.tsx` | ✅ LIVE | Post-signup onboarding flow. |
| `/welcome` | `app/welcome/page.tsx` | ✅ LIVE | Welcome page. |
| `/resources` | `app/resources/page.tsx` | ✅ LIVE | Resources hub. |
| `/resources/*` | `app/resources/<slug>/page.tsx` | ✅ LIVE | SEO content: best-website-builder-roofers, do-roofing-websites-generate-leads, free-roofing-website, roofing-website-cost, roofle-alternatives. |
| `/privacy` | `app/privacy/page.tsx` | ✅ LIVE | Termly. |
| `/terms` | `app/terms/page.tsx` | ✅ LIVE | Termly. |
| `/cookies` | `app/cookies/page.tsx` | ✅ LIVE | Termly. |

## Homeowner / Prospect Facing

| Route | File | Status | Description |
|---|---|---|---|
| `/chat/[identifier]` | `app/chat/[identifier]/page.tsx` | ✅ LIVE | Riley standalone chat. Slug or UUID. |
| `/demo-preview/[id]` | `app/demo-preview/[id]/page.tsx` | ✅ LIVE | Per-prospect demo page (direct mail funnel). |
| `/claim/[slug]` | `app/claim/[slug]/page.tsx` | ✅ LIVE | Claim flow (prospect → account). |
| `/estimate/[token]` | `app/estimate/[token]/page.tsx` | ✅ LIVE | Living estimate page. |
| `/widget/[contractorId]` | `app/widget/[contractorId]/page.tsx` | ✅ LIVE | V1 iframe embed of estimate widget. |
| `/site/[slug]` | `app/site/[slug]/page.tsx` | ✅ LIVE | Roofer client website (V4 templates). |
| `/site/[slug]/[city]` | `app/site/[slug]/[city]/page.tsx` | ✅ LIVE | City landing pages (Growth tier). |
| `/site/[slug]/services` | `app/site/[slug]/services/page.tsx` | ✅ LIVE | Services index. |
| `/site/[slug]/services/[service]` | `app/site/[slug]/services/[service]/page.tsx` | ✅ LIVE | Service detail. |

## Demo / Preview (marketing demos of contractor templates)

| Route | File | Status | Description |
|---|---|---|---|
| `/demo` | `app/demo/page.tsx` | ✅ LIVE | Demo index. |
| `/demo/blueprint`, `/demo/chalkboard`, `/demo/classic`, `/demo/forge`, `/demo/summit` | `app/demo/<template>/page.tsx` | ✅ LIVE | Template previews. |
| `/demo/[city]` | `app/demo/[city]/page.tsx` | ✅ LIVE | City demo variant. |
| `/demo/services`, `/demo/services/[service]` | `app/demo/services/*` | ✅ LIVE | Demo services pages. |
| `/preview/[slug]` | `app/preview/[slug]/page.tsx` | ✅ LIVE | Site preview. |
| `/preview-components`, `/preview-components/apple-hero` | `app/preview-components/*` | 🧪 DEV ONLY | Component sandbox. |
| `/widget-preview` | `app/widget-preview/page.tsx` | 🧪 DEV ONLY | Widget sandbox. |
| `/ridgeline` | `app/ridgeline/page.tsx` | 🧪 DEV ONLY | Ridgeline sandbox. |
| `/calculator` | `app/calculator/page.tsx` | 🧪 DEV ONLY | Calculator sandbox. |

## Internal / Ops (Hannah only)

| Route | File | Status | Description |
|---|---|---|---|
| `/ops` | `app/ops/page.tsx` | ✅ LIVE | Ops dashboard. |
| `/ops/direct-mail` | `app/ops/direct-mail/page.tsx` | ✅ LIVE | Direct mail pipeline. |
| `/ops/revenue` | `app/ops/revenue/page.tsx` | ✅ LIVE | Revenue tracker. |
| `/ops/settings` | `app/ops/settings/page.tsx` | ✅ LIVE | Ops settings. |
| `/ops/sms` | `app/ops/sms/page.tsx` | ✅ LIVE | SMS ops (parked). |
| `/hq` | `app/hq/page.tsx` | ✅ LIVE | Internal HQ. |
| `/mission-control` | `app/mission-control/page.tsx` | ✅ LIVE | Mission control. |
| `/command-center` | `app/command-center/page.tsx` | ✅ LIVE | Feature/research/vault command center. |
| `/command-center/feature/[slug]`, `/command-center/research/[slug]`, `/command-center/vault/[entry]` | `app/command-center/<type>/[slug]/page.tsx` | ✅ LIVE | Command center detail routes. |

## Notes

- The dashboard sidebar is locked. Before editing `components/dashboard/sidebar.tsx`, read `memory/feedback_dashboard_nav_locked.md`.
- Roofer client websites (`/site/[slug]/*`) use `components/contractor-sections/` + `components/templates/`. Don't confuse with marketing site at `/`.
- If you find a `page.tsx` that isn't in this file, it's either new (add it) or leftover (kill it).
