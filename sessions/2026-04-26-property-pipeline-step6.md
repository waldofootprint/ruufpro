# Property Pipeline — Step 6 Session Log

**Date:** 2026-04-26 (PM, fresh session after step 5 creative-direction session)
**Branch:** `feature/direct-mail-nfc`
**Skill:** `/property-pipeline-build`
**Outcome:** ✅ Step 6 closed end-to-end. Two atomic commits, neither deployed yet.

---

## What shipped

### Commit `212337b` — SB 76 §489.147(1)(a) verbatim disclosure + half-rule font cap

- Replaced step-4 PLACEHOLDER in `lib/property-pipeline/postcard-template.tsx` with the three numbered statements verbatim from FL §489.147(1)(a).
- Added `DISCLOSURE_FONT_PX = 16` (12pt floor) and `MAX_OTHER_FONT_PX = 32` (ceiling) so the half-rule holds.
- Front + back fonts brought under the 32px cap.
- Compliance invariant locked in module header.

### Commit `b78ecd0` — License # + service ZIPs + DM authorization clickwrap

Single PP opt-in setup flow at `/dashboard/pipeline/setup`. Roofer is redirected here from the PP tab on first visit; PP tab loads normally once setup is complete.

Files added:
- `lib/property-pipeline/auth-text.ts` — verbatim authorization text + sha256 hash. Versioned (`v1-2026-04-26`).
- `app/api/pipeline/setup/route.ts` — POST. Validates FL DBPR license regex (`^(CCC|CGC|CRC|CB|RR|RC)\d{6,7}$`), validates ZIPs against the 20-ZIP Manatee whitelist, upserts auth version row, writes contractor fields + IP/user-agent for ESIGN audit trail.
- `app/dashboard/pipeline/setup/page.tsx` — server component. Loads contractor, redirects to `/dashboard/pipeline` if already complete.
- `app/dashboard/pipeline/setup/setup-form.tsx` — client form: license input, 20-ZIP multi-select sorted by candidate-row count, clickwrap checkbox showing exact auth text.

Files edited:
- `app/dashboard/pipeline/page.tsx` — converted from `"use client"` to async server component. Gates on `license_number`, `service_area_zips.length > 0`, `direct_mail_authorization_version_hash`. Bounces to `/setup` if any missing.

### Vercel env

Pushed `LOB_API_KEY_TEST` + `LOB_ENV` to production env. `LOB_API_KEY_LIVE` deliberately NOT pushed yet (sandbox blocked it correctly — that key enables real-money mailings; gate it on Hannah's explicit OK when step 7 is ready to run with real mail).

### Audited (no code change needed)

- `/api/stop/[code]/route.ts` writes per-contractor row always; if `scope=global` also writes `contractor_id=null` row.
- `/api/pipeline/send/route.ts` checks `mail_suppressions` BEFORE Lob fires, matches on `address_hash` AND (`contractor_id == self` OR `IS NULL`).
- Hash function (sha256 of `address_normalized`) is identical on both routes.
- Form supports both contractor/global scopes.

---

## What's next

- **Step 5 (creative)** — still parked. 12 tones rejected by Hannah. Closest unrejected synthesis = #8 Florida Sun + dynamic summers count + scan-to-find-out mechanic. Step-5-continuation handoff still applies; nothing changed creative-side this session.
- **Step 7 (smoke test)** — unblocked from a wiring perspective. Two paths:
  1. Pick a step-5 creative, run smoke test with it.
  2. Smoke-test the pipeline only with the step-4 placeholder front (legally-correct disclosure footer is now live), prove Lob → QR → Riley → suppression flow E2E, then iterate creative.

---

## Deploy state

Two commits NOT live on ruufpro.com:
- `212337b` PP step 6 — SB 76 disclosure
- `b78ecd0` PP step 6 — license # + ZIPs + DM auth

Hannah declined to deploy at session end (chose to bundle with step 5 or 7 ship).

---

## Memory entries to refresh

- `project_pp_step_6_progress` → flip from "in-flight" to ✅ done with both commit hashes; remove "outstanding tasks" list.
- Source-of-truth doc updated in working tree (commit pending — bundle with next deploy or commit standalone next session).
