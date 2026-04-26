# 2026-04-26 — Property Pipeline step 3 (Dashboard UI)

**Branch:** `feature/direct-mail-nfc`
**Commits:** `b06fd16` (planning base) + `4e02e8d` (step 3 code)
**Live status:** NOT deployed to ruufpro.com — pending Hannah approval to run `vercel --prod --force`

## What shipped

1. **`b06fd16` — planning base.** Migrations 086 + 087, loader script, source-of-truth doc, round-4 simplifications memo, step-3 handoff, ARCHIVED banners on the 35-day plan + research drop.
2. **`4e02e8d` — step 3 code.** New "Property Pipeline" dashboard tab listing in-market homes scoped to the contractor's `service_area_zips` via RLS. Service Area picker added to Settings to unblock self-serve.

### Files (step 3)
- `app/dashboard/pipeline/page.tsx` (new)
- `components/dashboard/property-pipeline-tab.tsx` (new)
- `lib/property-pipeline/queries.ts` + `types.ts` (new)
- `app/api/pipeline/send/route.ts` (new — 501 stub)
- `app/dashboard/settings/tabs/ServiceAreaTab.tsx` (new)
- `app/dashboard/settings/page.tsx` (added Service Area tab)
- `components/dashboard/sidebar.tsx` (added Property Pipeline nav item)

### Database state
- `property_pipeline_candidates`: 28,920 active rows (Manatee universe)
- Both contractor rows under `waldo12397@gmail.com` seeded with `service_area_zips = ['34209','34205','34221']` (~10,859 homes total)

## Three parallel agent reviews informed the build

1. **Competitive (LeadSpy / SalesRabbit / PropertyRadar / BatchLeads):** zero load-bearing gaps. Ship as-is.
2. **Master plan reconciliation:** v1 faithful to simplified spec. Two real fixes — D5 (empty-state dead-end → fixed via Service Area tab) + D6 (no narrative → fixed via subtitle). Pre-send confirm flagged for step 4 (applied early).
3. **Roofer CX:** initial verdict "would bounce 80%." Fixes adopted: confirm modal with license + disclosure mention, assessed value + derived roof-age column, narrative subtitle, deep-link empty state.

## Open question for Hannah

**Default sort direction.** Roofer-CX agent argued ASC (1850→2010) shows shacks first; the universe is already filtered to ≤2010 so DESC would put 15-25 yr roofs (sweet spot) first. Master-plan + handoff doc both say ASC. Currently shipped ASC. **Decision deferred to Hannah.** ~5-line change.

## Acceptance criteria — verified locally

- ✅ `/dashboard/pipeline` returns 200, loads without error
- ✅ With ZIPs seeded → table renders rows from RLS-scoped query
- ✅ Send button → confirm dialog → 501 stub toast
- ✅ ZIP chip filter resets pagination, updates total
- ✅ `/dashboard/settings?tab=service-area` returns 200, renders ZIP picker
- ✅ `npx tsc --noEmit` passes clean

Visual approval from Hannah: pending (auto-mode commit per session direction).

## What's NOT done (deferred per simplification)

- Real Lob send (step 4)
- Postcard template + first-piece approval (step 5)
- Riley QR-scan landing tweaks (step 5)
- SB 76 disclosure on the actual postcard (step 6 — currently mentioned in confirm dialog only)
- Smoke test mailing one to Hannah's address (step 7)

## Watch-list for step 4

From master-plan agent:
- **Pre-send confirm dialog already in place** ✅ — step 4 just swaps the API call from stub to Lob.
- **`mailing_history` row insert + Lob webhook** — still needed.
- **Pricing copy** — confirm dialog says "TBD at step 4." Replace with real per-postcard cost once Lob first-piece quote lands.
- **Returned-mail suppression button** on rows where `mailing_history.status='returned'` — punch-list, step 7 candidate.
- **`engaged → View as Lead` link** — step 5, when QR scan creates a lead row.

## Next session

**Step 4 — Send + landing routes (real Lob + Riley QR landing + /stop).**
- Wire `app/api/pipeline/send/route.ts` to Lob SDK
- 6-char base32-Crockford QR/mention code generation
- `mailing_history` insert + Lob webhook handler at `/api/lob/webhook`
- Riley QR landing route + `/stop/[code]` opt-out route
- Update confirm dialog with real per-postcard cost from Lob first-piece quote
