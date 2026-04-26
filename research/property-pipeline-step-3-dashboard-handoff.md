# Property Pipeline — Step 3 Handoff (Dashboard UI)

**Date written:** 2026-04-26 (end of step 2)
**For:** Next session, fresh context
**Skill to invoke:** `/property-pipeline-build`
**Estimated effort:** ~3 hours Claude + 5 min Hannah for visual review

---

## Read these first (in this order)

1. **`decisions/property-pipeline-mvp-source-of-truth.md`** ← **THE source of truth.** 7-step MVP checklist + cut list + non-negotiables. Everything else is supporting.
2. **`supabase/086_property_pipeline_schema.sql`** ← live schema. Tables, columns, RLS, helper functions all live here. Read fully.
3. `.tmp/property-pipeline/README.md` — provenance of the 28,920 candidate rows
4. This file
5. `decisions/property-pipeline-round4-and-simplifications.md` — supporting context on the M1–M11 cuts (the source-of-truth doc summarizes; this has rationale)

**Do NOT read** `research/property-pipeline-build-plan-2026-04-26.md` or `research/property-pipeline-handoff-2026-04-26.md`. Those are the ARCHIVED 35-day plan — not what we're building. Both have ARCHIVED banners at the top now. They are preserved as a fallback only.

---

## State at handoff (what's already done)

- ✅ Step 1 — Universe data acquired. 28,920 in-market homes for Manatee County in `.tmp/property-pipeline/mvp_candidate_universe_FINAL.csv`
- ✅ Step 2 — Schema + RLS applied to live Supabase. 28,920 rows loaded into `property_pipeline_candidates`. Validated.
- ✅ MVP Checklist sections 1, 2, 6 (legal floor wiring) — done
- ✅ Skill update: `supabase-postgres-best-practices` now has `security-rls-array-helpers.md` + `schema-migration-statement-order.md` covering the gotchas hit during step 2

**Verify before starting step 3:**

```bash
# DB sanity
# (Use mcp__supabase__execute_sql)
SELECT count(*) FROM property_pipeline_candidates;       -- should = 28920
SELECT count(*) FROM property_pipeline_candidates
 WHERE status = 'active' AND contractor_id IS NULL;      -- should = 28920
```

```bash
# Local sanity
git status                                                # branch = feature/direct-mail-nfc
ls supabase/086_property_pipeline_schema.sql              # exists, ~280 lines
ls scripts/load-pp-universe.mjs                           # exists
```

---

## What this session ships

**One new dashboard tab — "Property Pipeline" — that shows the candidate universe scoped to the contractor's ZIPs.**

That is the entire scope. Nothing else.

- ✅ New tab in dashboard nav
- ✅ Table view: address, year built, ZIP, status
- ✅ "Send postcard" button per row — STUBBED (logs intent, returns "Coming soon"). The real send route is step 4.
- ✅ Row count + ZIP filter chip strip at top
- ✅ Empty state when contractor has no `service_area_zips` populated yet

**Out of scope (do NOT build):**

- ❌ The actual Lob send (`/api/pipeline/send`) — step 4
- ❌ Settings UI for ZIP selection — step 3.5 if time permits, otherwise step 4
- ❌ Approval screen, batch flow, multi-touch cadence (per simplification M5/M7)
- ❌ Any Riley landing changes — step 5
- ❌ Marketing site / ridgeline-v2 (locked rule, never from this skill)

---

## Pre-requisite: seed a service area on a test contractor

The dashboard tab uses RLS to filter by `contractor.service_area_zips`. **A contractor with NULL zips will see ZERO rows** — that's the empty state path. To verify the *populated* path, seed at least one contractor with a real ZIP set.

Suggested approach (run via `mcp__supabase__execute_sql`):

```sql
-- Pick the test contractor (replace email with whichever account you'll log into)
-- Top 3 ZIPs cover ~10K homes — plenty to see in the table
UPDATE contractors
   SET service_area_zips = ARRAY['34209','34205','34221']
 WHERE email = 'waldo12397@gmail.com'  -- or design partner once recruited
 RETURNING id, email, service_area_zips;
```

Then verify RLS works as expected (run while authenticated as that user — use the Next.js dashboard, not the SQL editor):

```sql
SELECT count(*) FROM property_pipeline_candidates;
-- should = 10,859 (3792 + 3659 + 3408 from the top-ZIPs validation)
```

---

## Files to touch (full list, no scope creep)

| File | Action | Why |
|---|---|---|
| `app/dashboard/pipeline/page.tsx` | NEW | Server component, fetches initial candidate list, renders the tab |
| `components/dashboard/property-pipeline-tab.tsx` | NEW | Client component, table + filter chips + Send button + empty state |
| `lib/property-pipeline/queries.ts` | NEW | One function: `fetchPipelineCandidates(supabase, opts)` returning typed rows |
| `lib/property-pipeline/types.ts` | NEW | Shared `PipelineCandidate` TypeScript type matching the table schema |
| `app/dashboard/layout.tsx` (or wherever the nav lives) | EDIT | Add "Property Pipeline" nav item |
| `app/api/pipeline/send/route.ts` | NEW (stub) | Returns `{success: false, message: "Coming soon"}` for now — the button has somewhere to call |

**Do not touch:**

- Existing dashboard tabs (Leads, Insights, Riley, Copilot, Settings)
- `components/ridgeline-v2/` or marketing site
- Any other API route

---

## Reference patterns from the existing codebase

- **Dashboard tab pattern:** look at `components/dashboard/lead-list.tsx` — same shape (table of contractor-scoped rows with row actions). Match its visual idiom (the warm-cream `.neu-dashboard` theme is already global).
- **Server-component data fetch:** look at `app/dashboard/page.tsx` — uses `createServerClient` from `@/lib/supabase/server` (or whatever the existing helper is) and queries directly. RLS handles the contractor scoping automatically; no manual `.eq('contractor_id', ...)` needed (helper functions in 086 already filter by `auth.uid()`).
- **Existing dashboard styling:** `.neu-dashboard` scope (warm-cream + orange + DM Sans). Don't introduce new tokens.

---

## Query you'll write in `lib/property-pipeline/queries.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PipelineCandidate } from './types';

export async function fetchPipelineCandidates(
  supabase: SupabaseClient,
  { limit = 100, offset = 0, zipFilter }: { limit?: number; offset?: number; zipFilter?: string } = {}
): Promise<{ rows: PipelineCandidate[]; total: number }> {
  let query = supabase
    .from('property_pipeline_candidates')
    .select('id, parcel_id, address_raw, city, zip, year_built, status, score, tier, score_factors', { count: 'exact' })
    .eq('status', 'active')                  // hits ppc_zip_status_idx
    .order('year_built', { ascending: true }) // oldest = best lead
    .range(offset, offset + limit - 1);

  if (zipFilter) query = query.eq('zip', zipFilter);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as PipelineCandidate[], total: count ?? 0 };
}
```

RLS does the contractor-scoping for you (via `pp_current_service_zips()`). You DO NOT need a `.contains()` or `.in()` on `zip` — the policy already restricts the rowset.

---

## UX spec (one screen, no modals at MVP)

```
┌─ DASHBOARD NAV ─────────────────────────────────────────────────┐
│  Leads · Riley · Copilot · Property Pipeline ·  Insights · ...  │
└─────────────────────────────────────────────────────────────────┘

┌─ PROPERTY PIPELINE ─────────────────────────────────────────────┐
│                                                                  │
│   In-market homes in your service area                           │
│   Showing 100 of 10,859 · ZIPs: 34209 (3,792) 34205 (3,659) ...  │
│                                                                  │
│   [All] [34209] [34205] [34221]   ← chip filter (top 5 ZIPs)     │
│                                                                  │
│   ┌───────────────────────────┬──────────┬───────┬───────────┐  │
│   │ Address                    │ Built    │ ZIP   │ Action    │  │
│   ├───────────────────────────┼──────────┼───────┼───────────┤  │
│   │ 4816 33RD ST W            │ 1965     │ 34207 │ [Send]    │  │
│   │ 4040 3RD AVE NW           │ 1972     │ 34209 │ [Send]    │  │
│   │ ...                        │          │       │           │  │
│   └───────────────────────────┴──────────┴───────┴───────────┘  │
│                                                                  │
│   ← Prev · Page 1 of 109 · Next →                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Empty state** (when contractor has no ZIPs configured):

```
   You haven't picked your service area yet.
   Set ZIPs in Settings → Service Area to start seeing in-market homes.
   [Go to Settings]   ← link is dead at MVP, that's fine; step 3.5 wires it
```

---

## Send button stub behavior (until step 4 ships)

```typescript
// app/api/pipeline/send/route.ts
export async function POST(req: Request) {
  const { candidateId } = await req.json();
  console.log('[pipeline/send] STUB invoked for candidate', candidateId);
  return Response.json({
    success: false,
    message: 'Postcard sending lands in step 4. Stay tuned.'
  }, { status: 501 });
}
```

The button shows a toast with the message. Don't disable the button — clicking it should give clear feedback that it's not wired yet, not look broken.

---

## Acceptance criteria (verify before declaring done)

1. `/dashboard/pipeline` loads without error for an authenticated contractor
2. With ZIPs seeded → table shows real rows; row count matches the live SQL count
3. With no ZIPs → empty state renders, no error, no console noise
4. Switching ZIP chip filters the table, total count updates
5. "Send" button click → toast appears with the "step 4" message
6. Network tab shows ONE query to `property_pipeline_candidates` per page render (no N+1)
7. Visual fit: matches the warm-cream `.neu-dashboard` theme of existing tabs
8. RLS verified: a different contractor logged in sees a different (or empty) rowset

---

## Constraints to honor

Pulled from `decisions/property-pipeline-mvp-source-of-truth.md` — that doc is the source of truth, this is just the relevant subset for this step:

- **ZIP multi-select max 25** — already enforced by `contractors_service_area_zips_size_check` in migration 086. Just respect it in any picker UI.
- **Don't filter by `contractor_id IS NULL`** — the RLS helper functions handle scoping. Trust the policy.
- **Single universe, no tier toggles, no carve-out segments** — table view shows whatever RLS hands back, sorted by year_built ascending.
- **No "intentional friction" gate before "Send" click** — Stripe-style 2-step confirm only (and even that lives in step 4, not step 3).
- **If you modify RLS policies**, use the existing helpers (`pp_current_contractor_id`, `pp_current_service_zips`) — don't inline subqueries. See `.claude/skills/supabase-postgres-best-practices/references/security-rls-array-helpers.md`.

**Do NOT enforce** anything from the archived 35-day plan (R1.x/R2.x/R3.x decisions, Phase 1/2/3 framework, Track A–I, sniff test, batch approval, multi-touch cadence). All cut. Source-of-truth doc has the full list of what was cut + why.

---

## End-of-session ritual (per skill)

When this session wraps:

1. Write `sessions/YYYY-MM-DD-property-pipeline-step3.md` summarizing what shipped + any deferred items
2. Update `02-Sprint.md` checking off step 3 of the MVP checklist
3. **Ask before deploying** — "Committed as `<hash>`. NOT live on ruufpro.com until deployed. Want me to deploy via `vercel --prod --force`?"
4. If anything new locked (e.g., chip filter design, table sort order), prompt: "This is a new locked decision — should I write `decisions/property-pipeline-step3-ux.md`?"

---

## Risks to watch this session

- **Test-contractor RLS:** if you log in as a contractor whose `user_id` doesn't match a `contractors` row, the helper fns return NULL/empty array → empty state. That's correct behavior; just don't get confused.
- **Pagination at 28K rows:** `range(offset, offset + limit - 1)` with `.select('*', {count: 'exact'})` is fine at this scale. Don't try to pre-render the full 10K row set in DOM.
- **SSR vs CSR:** the candidate list is contractor-scoped + cheap to refetch. Server-component is the right default. Hydrate the chip-filter as a client component.
- **No Lob credentials needed yet.** Step 4 is when Lob's API key matters.

---

## Step 4 preview (NOT for this session)

Just so future-you knows what's next — do not start it now:

- Real `POST /api/pipeline/send` route that calls Lob
- 6-char base32-Crockford QR code generation (use the regex from `mh_qr_short_code_format_check`)
- Postcard HTML template w/ verbatim §489.147 disclosure
- Lob first-piece approval flow (Hannah ops, ~3 bus days lead time)
- `mailing_history` row insert + Lob webhook handler

Step 4 is the single biggest remaining body of work. Step 3 makes that possible by giving the roofer a UI to trigger from.
