# Property Pipeline — Step 7 Smoke Test Handoff

**Date written:** 2026-04-26 PM
**Updated:** 2026-04-28 — Lob first-piece approval claim removed (verified via Lob docs + Lob support bot: API postcards do NOT require pre-approval; only Informed Delivery campaigns do, and we don't use Informed Delivery)
**For:** Next session, fresh context
**Skill to invoke:** `/property-pipeline-build`
**Prior session log:** `sessions/2026-04-26-property-pipeline-step6.md`
**Estimated effort:** ~30 min Claude wiring. NO Lob review wall-clock — single API postcards mail same-day once `LOB_API_KEY_LIVE` is set + email/payment verified.

---

## Pre-reqs (check before starting)

- ✅ Step 6 fully shipped — commits `212337b` (SB 76 disclosure) + `b78ecd0` (setup flow)
- ✅ `LOB_API_KEY_TEST` + `LOB_ENV` on Vercel production env
- ⬜ **Step 5 creative locked** — currently PARKED. Smoke test can proceed with step-4 placeholder front (disclosure footer is correct), but the postcard going to Hannah's address won't be the final creative
- ⬜ **`LOB_API_KEY_LIVE` NOT YET on Vercel** — only push this when ready to mail real-money. Sandbox blocked it last session deliberately
- ✅ Step 6 commits LIVE on main as of session 11 (`3c8e027`)
- ⬜ Lob account: email verified + payment method added (Hannah dashboard action, ~5 min)
- ⬜ Real FL roofer license # (Calloway or other signed design partner) before any LIVE send

---

## Lob approval — verified NOT required for our flow

**Verified 2026-04-28** via Lob support bot + Lob's public docs. Sources:
- `help.lob.com/print-and-mail/ready-to-get-started.md` — describes test→live transition (verify email + add payment); explicitly states *"Lob does not perform legal approval of mail content. You bear responsibility for ensuring compliance."*
- Lob support bot confirmed: single postcards sent via the Postcards API (not Campaigns, not Informed Delivery) require no pre-approval.

**What this means:**
- No 3-6 day wall-clock blocker
- No template submission to Lob's compliance team
- We are SOLELY responsible for SB 76 disclosure verbatim, license #, opt-out URL — Lob will not catch our errors
- $10K/violation under §489.147(2)(a) is entirely on us. The disclosure constants in `postcard-template.tsx` (DISCLOSURE_FONT_PX=16, MAX_OTHER_FONT_PX=32, SB76_DISCLOSURE_LINES) are the compliance floor

**What Lob DOES gate before live mail:**
1. Email verified on Lob account
2. Payment method on file
3. Automated security review on new accounts — only suspends if fraud-flagged. Most accounts pass silently.

**What requires Lob approval (and we don't use):**
- Informed Delivery campaigns (USPS-side approval, 3-5 days) — we don't bolt this on
- Lob "Campaigns" (their batch UI product) — we use the Postcards API directly

## Smoke test path

Single combined path now that there's no Lob review queue:

1. Hannah completes `/dashboard/pipeline/setup` with a real FL roofer license # (Calloway or other signed design partner)
2. Set the contractor's `address` to a real return address
3. Add `LOB_API_KEY_LIVE` to Vercel prod (with explicit Hannah OK)
4. Pick a candidate row, override its `address_raw` to Hannah's home address (or add Hannah's parcel as a one-off row), click "Send postcard"
5. Confirm Lob webhook fires + `mailing_history` row writes
6. When card arrives (~5 business days standard-class):
   - Scan QR → confirm Riley landing renders + lead row appears
   - Visit printed opt-out URL → confirm address suppressed
   - Re-attempt send to same address → confirm 409 response

---

## Files in play

- `app/api/pipeline/send/route.ts` — the send route. Already wired with all gates. No code changes expected.
- `lib/property-pipeline/postcard-template.tsx` — front + back HTML. Only changes if step 5 lands new creative.
- `app/m/[code]/page.tsx` — QR landing → Riley. Verify it pre-loads the correct contractor + candidate context from `mailing_history`.
- `app/stop/[code]/` — opt-out flow. Audited last session, works.
- Lob dashboard (web UI, not in repo) — for verifying email/payment + monitoring sent postcards. NOT a compliance review queue.

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
