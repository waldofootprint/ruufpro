# Property Pipeline — Step 7 Smoke Test Handoff

**Date written:** 2026-04-26 PM
**For:** Next session, fresh context
**Skill to invoke:** `/property-pipeline-build`
**Prior session log:** `sessions/2026-04-26-property-pipeline-step6.md`
**Estimated effort:** ~30 min Claude wiring + ~3-6 day wall-clock (Lob first-piece review IS the critical-path blocker)

---

## Pre-reqs (check before starting)

- ✅ Step 6 fully shipped — commits `212337b` (SB 76 disclosure) + `b78ecd0` (setup flow)
- ✅ `LOB_API_KEY_TEST` + `LOB_ENV` on Vercel production env
- ⬜ **Step 5 creative locked** — currently PARKED. Smoke test can proceed with step-4 placeholder front (disclosure footer is correct), but the postcard going to Hannah's address won't be the final creative
- ⬜ **`LOB_API_KEY_LIVE` NOT YET on Vercel** — only push this when ready to mail real-money. Sandbox blocked it last session deliberately
- ⬜ Two commits from step 6 NOT YET deployed — `vercel --prod --force` from `feature/direct-mail-nfc`

---

## Two smoke-test paths

### Path A: Pipeline-only smoke (recommended if creative still parked)

Goal: prove Lob send → postcard arrives → QR scan → Riley → opt-out works E2E. Don't wait on creative.

1. Hannah completes the new `/dashboard/pipeline/setup` flow with her real FL license # and a Manatee ZIP she doesn't live in (no point mailing herself a property she owns — pick any candidate row in the dashboard for a smoke).
2. Update the contractor's `address` to Hannah's home address temporarily so Lob has a return address
3. Click "Send postcard" on a candidate row in the new ZIP. Lob test-mode renders a PDF preview without actually mailing. Inspect the PDF.
4. Switch `LOB_ENV=live` (after first-piece approval lands — see Path B), pick a candidate, mail it to Hannah's actual home (override the candidate `address_raw` to her address temporarily for the test, OR add Hannah's parcel to `property_pipeline_candidates` for one row)
5. When card arrives, scan QR → confirm Riley landing renders → submit a chat → confirm lead row appears in Leads tab
6. Visit the printed opt-out URL → confirm it suppresses the address → re-attempt send to same address → confirm 409 from `/api/pipeline/send`

### Path B: First-piece approval gate

Lob requires first-piece approval before live mailings on any new template. This is wall-clock-blocking (3-6 days). Submit the current postcard template (with placeholder creative or final, doesn't matter for compliance review) via Lob dashboard. Compliance review checks the SB 76 disclosure renders correctly + opt-out URL is present. They don't care about the marketing creative.

**Submit early.** Even if step 5 isn't locked, Lob's review is checking the legal floor (which IS locked). If creative changes after approval, Lob requires re-submission — but that's only an issue if the layout / fonts change in a way that breaks the half-rule. The DISCLOSURE_FONT_PX + MAX_OTHER_FONT_PX constants in the template enforce that doesn't happen accidentally.

---

## Files in play

- `app/api/pipeline/send/route.ts` — the send route. Already wired with all gates. No code changes expected.
- `lib/property-pipeline/postcard-template.tsx` — front + back HTML. Only changes if step 5 lands new creative.
- `app/m/[code]/page.tsx` — QR landing → Riley. Verify it pre-loads the correct contractor + candidate context from `mailing_history`.
- `app/stop/[code]/` — opt-out flow. Audited last session, works.
- Lob dashboard (web UI, not in repo) — first-piece approval queue.

---

## Things NOT to redo this session

- DO NOT re-audit opt-out routing. It's correct.
- DO NOT re-do license # / DM auth wiring. Setup flow is shipped.
- DO NOT push `LOB_API_KEY_LIVE` to Vercel without Hannah's explicit OK on that specific action.
- DO NOT auto-deploy after committing. Always ask.
- DO NOT touch step 5 creative tones unless Hannah specifically asks.

---

## End-of-step ritual when step 7 lands

When the smoke test passes E2E:
1. Mark step 7 ✅ in `decisions/property-pipeline-mvp-source-of-truth.md`
2. Write session log
3. Update memory: PP MVP shipped end-to-end; remove "step 6 in-flight" / "step 7 unblocked" entries
4. Decide: ship to design partner (Calloway) OR iterate creative first
