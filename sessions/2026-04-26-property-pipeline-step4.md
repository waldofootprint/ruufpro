# Property Pipeline — Step 4 Session Log

**Date:** 2026-04-26
**Branch:** `feature/direct-mail-nfc`
**Skill:** `/property-pipeline-build`
**Outcome:** ✅ Step 4 SHIPPED + deployed

## What shipped

**Real Lob direct-mail send + QR-scan landing + opt-out + Lob webhook + bundle-aware confirm dialog + postcard preview route.**

Replaced the 501 stub at `/api/pipeline/send` with full end-to-end Lob integration (sandbox via test_ key). All step-4 acceptance criteria met except Stripe metered billing (deferred to customer #5 era per source-of-truth) and live-mail smoke test (step 7).

### Commits (in order)

1. `9574e96` — PP step 4 prereq: lock postcard creative + cross-contractor lockout design (planning docs only)
2. `cf7f031` — PP step 4: real Lob send + QR landing + /stop opt-out + Lob webhook (12 files, +1071/-34)
3. `2893b85` — PP step 4: postcard template preview route

### Deployment

- `dpl_7oXYhWtM8GjfAi41ZPCCUjyyTPUJ` → ruufpro.com
- Prod smoke test passed: `/m/INVALID` 302 · `/stop/CODE` 200 · `/api/pipeline/usage` 401 · `/dashboard/pipeline` 200 · `/dashboard/pipeline/preview` 200

## Files added

- `lib/lob/client.ts` (SDK wrapper, env-aware key selection)
- `lib/lob/types.d.ts` (ambient declaration shim — SDK exports map gap)
- `lib/property-pipeline/qr-code.ts` (6-char base32-Crockford gen + decode)
- `lib/property-pipeline/locks.ts` (cross-contractor lockout stub)
- `lib/property-pipeline/bundle-usage.ts` (monthly send counter, 75/mo default bundle)
- `lib/property-pipeline/postcard-template.tsx` (minimal 6×11 standard template — front + back)
- `app/api/pipeline/usage/route.ts` (GET monthly usage)
- `app/m/[code]/route.ts` (QR landing → Riley redirect)
- `app/stop/[code]/page.tsx` + `form.tsx` (homeowner opt-out UI)
- `app/api/stop/[code]/route.ts` (opt-out POST handler)
- `app/api/lob/webhook/route.ts` (HMAC-verified lifecycle callbacks)
- `app/dashboard/pipeline/preview/page.tsx` (postcard preview, contractor data injection)

## Files modified

- `app/api/pipeline/send/route.ts` (REWRITE — real Lob integration)
- `components/dashboard/property-pipeline-tab.tsx` (bundle-aware confirm dialog + post-send toast)
- `decisions/property-pipeline-mvp-source-of-truth.md` (cross-contractor lockout design + postcard creative section + team-photo decision)
- `research/property-pipeline-step-4-handoff.md` (added lockout stub + photo template scope)
- `package.json` + `package-lock.json` (added `@lob/lob-typescript-sdk@1.3.5`)

## Decisions captured this session

- **Team photo on postcard = FREE for all customers, MVP onward.** Verified via Lob pricing docs: 6×11 standard-class is identical cost regardless of photo vs text. "We don't markup your mail" anchor stays clean.
- **Glossy/premium paper deferred to v1.1.** Different Lob SKU; separate bundle math.
- **Cross-contractor lockout designed: mail-lock 180d + permanent lead-lock.** Stub shipped in step 4; full enforcement at customer #2.
- **No roofer-uploaded full designs at MVP.** Forces compliance review on every upload, breaks "we handle compliance for you" story. Defer to v1.1.
- **SB 76 disclosure left as flagged `[PLACEHOLDER]`** in step-4 template. Fails closed (visible in any pre-prod render) so we can't accidentally mail before step 6.

## Outstanding (NOT blocking step 5)

- ⏳ Hannah needs to add Lob env vars to Vercel project before prod sends work:
  - `LOB_API_KEY_TEST=test_d02f0347a0971354c705c1d9b4f4db171ec`
  - `LOB_ENV=test`
  - `LOB_API_KEY_LIVE=` (empty until live key provisioned)
  - `LOB_WEBHOOK_SECRET=` (set when webhook subscription created in Lob dashboard)
- ⏳ Webhook subscription not yet created in Lob dashboard (won't fire callbacks until done — defer to step 7)

## What was deliberately NOT done

- Stripe metered billing → deferred to customer #5 era (manual count for first 4)
- Full creative + branded design → step 5
- SB 76 verbatim text → step 6
- Smoke mail to Hannah's address → step 7
- Roofer-uploaded full custom designs → v1.1
- Glossy/premium paper variant → v1.1
- Cross-contractor lockout enforcement → customer #2

## Lessons / observations

- **Lob test_ keys do NOT require first-piece approval.** That's only for live_ keys. Means step-4 dev unblocked end-to-end; first-piece-review wall-clock collapses into step 7 onboarding.
- **Lob TS SDK exports field has a gap** — types declared under `node` condition only, default export resolves to .mjs without types under bundler-mode resolution. Worked around with ambient declaration shim at `lib/lob/types.d.ts`. Could file an upstream issue but not blocking.
- **`/stop/[code]` route conflict** — Next.js can't have both `page.tsx` and `route.ts` at the same segment. Moved POST handler to `/api/stop/[code]/route.ts` after first smoke test caught the 405. Form fetch URL updated to match.
- **Lead-Spy creative recon:** their public site has zero postcard samples. That's a marketing-site moat for us — publishing our actual creative on ruufpro.com would be unique trust signal.

## Next session

→ **Step 5** = postcard creative redesign + with-photo variant + Lob first-piece submission

Handoff: `research/property-pipeline-step-5-handoff.md` (written this session)

Load mid-session: `/frontend-design` + `/marketing-psychology` skills
