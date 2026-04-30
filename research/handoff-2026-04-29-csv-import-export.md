# Handoff — Next Session (Review Push Recap + CSV Import/Export Plan)

**Date written:** 2026-04-29
**Branch at handoff:** `feature/review-push-flow` (1 new commit `13b927d` ahead of main, NOT deployed)
**Prior session log:** `research/handoff-2026-04-28-review-push-flow.md`

---

## Step 1 — Recap (do this FIRST, before anything else)

Before touching any code or asking Hannah what she wants to work on, **explain in plain language what was accomplished in the prior session (review push flow Phase 1)**. Keep it tight — bullets only, no jargon, no file paths in the recap.

Cover:
- What the feature does end-to-end (lead → won → push → tap → Messages opens)
- That nothing is deployed yet (commit `13b927d` on `feature/review-push-flow`, main untouched)
- That the 3 open questions in the prior handoff were answered with recommendations (push opt-in scoped to existing subscribers, copy = "Tap to text {firstName} a review request", Skip = permanent)
- One sentence on what was NOT built (Phase 2 install prompt, channel toggle, JobNimbus webhook)

**Then stop. Wait for Hannah's response.** Don't auto-launch into the CSV work.

---

## Step 2 — After Hannah responds, propose CSV import/export plan

Goal: roofers can **import** their existing leads/clients from a CSV (e.g. exported from a CRM, spreadsheet, or contact list) AND **export** their current leads to CSV.

### Before writing any code, write a plan and show it to Hannah for approval.

The plan must cover:

**Import**
- Where in the dashboard the import lives (Settings tab? Dedicated /dashboard/import route? Button on Leads page?)
- File upload UX (drag-drop? click-to-browse? file size limit?)
- Column mapping flow (auto-detect by header name? manual mapper UI? what if columns are missing?)
- Required vs optional fields — at minimum we need *something* (name? phone? email?). Decide which is the hard floor.
- Validation rules (phone format normalization, email validation, dedupe against existing leads)
- Preview screen before commit (show first 5-10 rows + flagged issues)
- Error handling — what happens to bad rows? skip + report? abort all? partial commit?
- Default `status` for imported leads (`new`? configurable?)
- Source attribution — set `source = "csv_import"` so they're distinguishable from form-captured leads
- Performance ceiling — what's the row cap? (rough rule: 1000 rows is fine sync, beyond needs a job queue)

**Export**
- Where the export button lives (Leads page header? Settings?)
- Which columns export (all DB fields? curated subset? user-selectable?)
- Filter scope (all leads? currently-filtered view? date range?)
- Format details (CSV with header row, escape commas/quotes, UTF-8 BOM for Excel?)

**Schema check**
- Confirm what columns currently exist on `leads` so the plan maps to real fields. Don't assume — read `supabase/` migrations or query the DB.

**Out of scope to flag explicitly**
- Excel/.xlsx upload (CSV only for v1)
- Recurring/scheduled imports
- Two-way sync with external CRMs
- Bulk edit after import (user can edit individually post-import)

### Plan format
- Bullets, not paragraphs (Hannah scans)
- One section per bullet group above
- End with: "Approve this plan or tell me what to change before I touch code."

### Then wait for approval. Do not start coding until Hannah says go.

---

## Context the next session will need

### Lead model (verify — don't trust this snapshot)
- Table: `leads`
- Known columns (from this session's reads): `id`, `name`, `email`, `phone`, `status`, `contractor_id`, `created_at`, `contacted_at`, `estimate_high` (numeric), `source`
- Status enum likely includes: `new`, `contacted`, `quoted`, `appointment_set`, `won`, `completed` (and others — verify via migration files or DB)
- Multi-tenant: every row scoped by `contractor_id`. Auth check + ownership filter on every write.

### Existing patterns to mirror
- Dashboard pages: `app/dashboard/*` — neumorphic style (`neu-flat`, `neu-inset` from `app/globals.css`)
- Server-side mutations through `app/api/*/route.ts` with cookie-aware Supabase client + service-role client for DB writes — see `app/api/leads/status/route.ts` from this session as a reference shape
- Lead list lives in `components/dashboard/lead-list.tsx`
- Dashboard root: `app/dashboard/page.tsx` (loads leads, owns `handleStatusChange`)

### Stack constraints
- Next.js App Router, deployed on Vercel
- Supabase (Postgres) — RLS exists; service-role client bypasses for trusted server operations
- No file-storage step needed for CSV — parse in-memory, never persist the upload
- For parsing, prefer `papaparse` (already common in Next.js ecosystem; verify if installed before assuming)

### Dashboard rules to honor
- Bullets only in any UI copy / instructions
- Don't break existing leads display or filters
- Don't add Excel support — explicitly out of scope

---

## Pre-flight checks for Step 2 (after plan is approved)

- `git branch --show-current` — confirm we're on a feature branch (NOT main)
- If currently on `feature/review-push-flow`, branch off main: `git checkout main && git checkout -b feature/csv-import-export`
- `git log --oneline -3` — confirm `c5b5b99` is HEAD of main (the review-push branch is `13b927d` and stays unmerged)
- Read `app/dashboard/page.tsx` lines 1-50 + 230-260 — understand how leads load and how status updates work today
- Read `components/dashboard/lead-list.tsx` lines 1-50 — understand prop shape

---

## Deploy reminders (when CSV work eventually ships)

- After commits land: `vercel --prod --force`
- Then **manually alias** ruufpro.com + www (auto-alias still broken per memory `feedback_vercel_deploy_then_alias.md`)
- The review-push branch is still uncommitted to main — **do not** sweep it into the CSV deploy. Keep branches isolated.

---

## What NOT to do

- ❌ Don't merge `feature/review-push-flow` into main as part of CSV work — separate branches, separate deploys
- ❌ Don't skip the recap step (Hannah needs the context refresh after time away)
- ❌ Don't start coding the CSV feature before Hannah approves the plan
- ❌ Don't add Excel support, recurring imports, or CRM two-way sync
- ❌ Don't introduce a new file upload service (Supabase Storage etc.) — parse in-memory, throw the file away
