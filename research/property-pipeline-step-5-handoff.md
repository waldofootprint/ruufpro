# Property Pipeline — Step 5 Handoff (Postcard creative + with-photo variant + Lob first-piece submission)

**Date written:** 2026-04-26 (end of step 4 session)
**For:** Next session, fresh context
**Skill to invoke:** `/property-pipeline-build`
**Companion skills to load mid-session:** `/frontend-design` + `/marketing-psychology`
**Estimated effort:** ~4-6 hours Claude + ~3-6 day wall-clock (Lob first-piece reviews two templates)

---

## State at handoff (what's done)

- ✅ Step 1 — Universe (28,920 Manatee in-market homes) loaded
- ✅ Step 2 — Schema + RLS + helper functions
- ✅ Step 3 — Dashboard UI (`/dashboard/pipeline` w/ Lead-Spy parity columns)
- ✅ Step 4 — Real Lob send + QR landing + `/stop` opt-out + Lob webhook + bundle-aware confirm dialog + minimal postcard template + preview route
  - Last commit: `2893b85` (preview route)
  - Live: [`dpl_7oXYhWtM8GjfAi41ZPCCUjyyTPUJ`](https://vercel.com/waldo12397-7433s-projects/ruufpro/7oXYhWtM8GjfAi41ZPCCUjyyTPUJ) → ruufpro.com
  - Sandbox key wired in `.env.local` (`LOB_API_KEY_TEST=test_d02f...`)

**Step-4 outstanding env-var task (Hannah-side, not blocking step 5):**
- `LOB_API_KEY_TEST` + `LOB_ENV=test` not yet pushed to Vercel project env. Sends in prod will throw "LOB_API_KEY_TEST not set" until added. Step 5 dev mostly happens locally so this can wait until step 7 smoke test.

---

## What this session ships

**The real postcard creative — both with-photo and no-photo variants — submitted to Lob for first-piece approval.**

Replaces the minimal step-4 template (currently functional but generic) with a designed postcard that:
- Reflects per-contractor branding (logo + business name + license # + photo)
- Uses marketing psychology to drive QR scans (loss aversion + peak-end + reciprocity + social proof)
- Renders crisply at 6×11 standard-class print (1125×625 px @ 100 dpi bleed)
- Variants: with team photo (default if uploaded) + without (clean fallback)

Plus:
- Photo upload UI in contractor settings
- "Preview postcard" link wired into the Property Pipeline tab header (currently the preview route is hidden — type-the-URL only)
- Both templates submitted to Lob for first-piece review (kicks the 3-6 day wall-clock)

---

## Read these first (in this order)

1. **`decisions/property-pipeline-mvp-source-of-truth.md`** — particularly the "Postcard creative" section (locked 2026-04-26): single creative + per-contractor branding + free team photo + glossy deferred to v1.1
2. **`lib/property-pipeline/postcard-template.tsx`** — the step-4 minimal template that step 5 replaces. Note signature: `renderPostcardFront(data) → string` + `renderPostcardBack(data) → string`. Keep the signature stable so the send route doesn't need to change.
3. **`app/dashboard/pipeline/preview/page.tsx`** — the preview route. Iframes the rendered HTML at 78% scale. Will need to add a variant toggle (with-photo / no-photo) once both templates exist.
4. **`sessions/2026-04-26-property-pipeline-step4.md`** — full step-4 close-out (will exist once written end-of-session)
5. **`project_lead_spy_competitive_read_2026-04-26` memory** — what we know about Lead-Spy creative (basically: nothing public). Their lack of postcard samples online IS our marketing-site moat.

**Do NOT read** `research/property-pipeline-build-plan-2026-04-26.md` (ARCHIVED) unless explicitly needed.

---

## Mid-session: load these skills

**Load `/frontend-design` first.** Pick a bold aesthetic direction for the postcard. Default-thinking-mode in this skill = AI slop. The skill specifically pushes against generic Inter + purple-gradient defaults. Roofing contractors are blue-collar, FL, hurricane-shaped — the design should feel grounded, durable, almost field-built. Possible directions:

- **Editorial / magazine-grade** — Archivo + JetBrains Mono + paper/ink/rust palette (already RuufPro brand tokens — use them)
- **Industrial / utilitarian** — heavy condensed sans (Barlow Condensed?), high-contrast B&W with single accent
- **Warm/local** — softer serif headline + handwritten signature touch — feels like the contractor wrote it personally

Hannah's likely lean: editorial, matches the v2 RuufPro homepage direction (`cea9f8c`). But push back if a different direction lifts response more.

**Then load `/marketing-psychology`.** The card has ~3 seconds before homeowner trashes it. Models that matter most for postcards:

| Model | Postcard application |
|---|---|
| **Peak-end rule** | Headline = the peak. Final QR-scan CTA = the end. Both must be memorable; middle copy is irrelevant. |
| **Loss aversion** | "Don't wait until the next storm" beats "Get a free assessment" by ~2× on FL roofing direct mail. Frame around what they'll lose by not scanning. |
| **Social proof** | "147 Manatee homes inspected by [contractor] this year" — specific local number. NOT generic "trusted by thousands." |
| **Reciprocity** | The free 10-min roof check is the gift. Lead with the gift, not the company name. |
| **Mere exposure** | First touch won't convert most. Postcard is one node in eventual multi-touch. v1.1 cadence rebuilds this. |
| **Authority** | License # + years-in-business prominently — beats logos for trust on a 3-second scan. |
| **Pratfall effect** | "We're not the cheapest" or "We turn down 30% of jobs" can outperform "best-in-class" — counterintuitive but tested. |
| **Curse of knowledge** | The contractor knows roofing. The homeowner doesn't. Copy must read like a neighbor explaining, not a contractor selling. |

**Anti-patterns:**
- ❌ Stock-photo houses (every roofing postcard does this; instant pattern-match-to-junk)
- ❌ Storm imagery before storm season (paranoia overlap → distrust)
- ❌ "BEST ROOFER IN MANATEE!" (superlatives = reflexive eye-roll)
- ❌ Phone number bigger than QR (defeats the QR-to-Riley moat — every offline call kills attribution)
- ❌ Multi-CTA (call OR scan OR text) — pick one. We pick QR.

---

## In scope this session

1. **Design the postcard creative** (front + back, both variants):
   - Bold aesthetic direction picked + executed (`/frontend-design`)
   - Marketing psychology applied throughout (`/marketing-psychology`)
   - Front: one strong headline + (optional) team photo + roofer business name + license #
   - Back: hi-personalized greeting + value-prop micro-copy + QR (large) + 6-char shortcode + opt-out URL + return address indicia + SB 76 placeholder (still flagged for step 6 — DO NOT replace with real text yet)

2. **Build two template variants** in `lib/property-pipeline/postcard-template.tsx`:
   - `renderPostcardFront(data, { variant: "with-photo" | "no-photo" })`
   - `renderPostcardBack(data)` (no variant on back)
   - Default variant inferred from `data.teamPhotoUrl` presence (with-photo if non-null, otherwise no-photo)

3. **Photo upload UI** — `app/dashboard/settings/team-photo/page.tsx`:
   - Image upload (JPEG/PNG, min 1800×3300, ≤10MB) → Supabase Storage bucket `team-photos/`
   - Writes URL to `contractors.team_photo_url` (NEW column — migration `090_contractor_team_photo.sql`)
   - Shows preview after upload + "Replace" button
   - Hannah-review badge: status enum `pending_review` / `approved` / `rejected`. New uploads enter `pending_review`; she manually approves via admin UI (defer admin UI — Hannah can update via Supabase studio for first 5 customers)
   - **Sends are blocked** if `team_photo_url IS NOT NULL AND review_status != 'approved'` — fall back to no-photo variant in the send route until approved

4. **"Preview postcard" link in dashboard:**
   - Add `<Link>` to header of Property Pipeline tab (`components/dashboard/property-pipeline-tab.tsx`)
   - Updates the preview route to support `?variant=with-photo|no-photo` query param + toggle UI

5. **Lob first-piece submission:**
   - Submit BOTH templates to Lob (sandbox postcards.create with the rendered HTML, captures the printable PDF for human review)
   - Save the Lob postcard IDs to a new `lob_first_piece_submissions` audit row OR put in a session log — pick whichever is faster
   - **Hannah submits BOTH at the same time** — they review serially but starting both at once minimizes wall-clock

### Out of scope (defer)

- ❌ SB 76 verbatim text wiring — step 6 (the placeholder stays visible in step 5 to reinforce we can't go live yet)
- ❌ Riley landing touch-aware copy — v1.1 (standard Riley at MVP per source-of-truth)
- ❌ Engaged-row "→ View as Lead" cross-tab link — step 6 or 7 (nothing to engage with until first real send)
- ❌ Glossy/premium paper variant — v1.1
- ❌ Real cross-contractor lockout enforcement — customer #2
- ❌ Stripe metered billing — customer #5
- ❌ Marketing-site homepage update showcasing the postcard — separate task after step 7 ships

---

## Files to touch (estimated)

| File | Action | Why |
|---|---|---|
| `lib/property-pipeline/postcard-template.tsx` | REWRITE | Designed creative + variant param |
| `supabase/090_contractor_team_photo.sql` | NEW | `team_photo_url text` + `team_photo_review_status text default 'pending_review'` + check constraint enum |
| `app/dashboard/settings/team-photo/page.tsx` | NEW | Upload UI |
| `app/api/contractor/team-photo/route.ts` | NEW | POST to upload to Supabase Storage + write contractor row |
| `components/dashboard/property-pipeline-tab.tsx` | EDIT | Add "Preview postcard" link in header |
| `app/dashboard/pipeline/preview/page.tsx` | EDIT | Add `?variant=` toggle UI; default = whichever variant the contractor's photo state would resolve to on a real send |
| `app/api/pipeline/send/route.ts` | EDIT | Pass `variant` to template render based on photo state + review status; block real send if photo uploaded but pending review (fall back to no-photo silently to keep send working) |
| `lib/property-pipeline/types.ts` | EDIT | Add `teamPhotoUrl` + `teamPhotoReviewStatus` to fetch shape |
| `scripts/lob-first-piece-submit.mjs` | NEW (optional) | Helper script to fire both templates at Lob's first-piece API + log results |

**Do NOT touch:**
- `components/ridgeline-v2/` or any marketing site
- Existing dashboard tabs (Leads, Insights, Riley, Copilot)
- The Lob webhook handler, send route auth chain, or QR-shortcode generator (all working — change only the variant routing)

---

## Acceptance criteria (verify before declaring step 5 done)

1. ✅ Both postcard variants render in `/dashboard/pipeline/preview?variant=with-photo` and `?variant=no-photo`
2. ✅ Variant toggle UI on the preview route works
3. ✅ Photo upload route accepts JPEG/PNG, validates min res, rejects >10MB
4. ✅ Photo upload writes to `contractors.team_photo_url` + sets `team_photo_review_status='pending_review'`
5. ✅ "Preview postcard" link visible in Property Pipeline tab header
6. ✅ Send route resolves variant based on photo state + review status; falls back to no-photo if photo pending or rejected
7. ✅ Both templates submitted to Lob first-piece review; postcard IDs captured
8. ✅ TypeScript clean
9. ✅ Production smoke: `/dashboard/pipeline/preview?variant=with-photo` returns 200 (logged in)
10. ✅ Marketing-psychology lens has been visibly applied — copy reflects loss aversion + reciprocity, not generic "free estimate" framing

---

## Risks to watch this session

- **Curse of knowledge** — Hannah understands roofing. Copy must read like a neighbor, not a contractor. Read it aloud before committing. If it sounds like a contractor wrote it, rewrite.
- **AI-slop creative** — `/frontend-design` skill explicitly pushes against this. Pick a BOLD aesthetic direction up front and commit. Refining a generic design later costs more than picking distinctive from start.
- **Photo review burden growing** — At 5+ customers a manual photo-approval queue gets old. If we're still at customer #1 by step 5 ship, defer the admin approval UI; Hannah approves via Supabase Studio. If we're at #3+ by then, build a tiny admin page (1-2 hours).
- **Lob HTML quirks** — Lob renders HTML in their own engine which may handle web fonts, CSS variables, or `@font-face` differently than browsers. Use their `/previews` API mid-session to validate render before declaring template done.
- **Photo aspect ratio** — landscape vs portrait crops differently in 6×11. Lock the layout to expect a 4:3 or 3:2 landscape photo at upload time, reject portraits with a friendly "needs to be wider than tall" message.

---

## Pricing-model lock-in (only if Lob first-piece returns the live quote)

If Lob returns the actual per-card cost during first-piece review, lock the bundle number per source-of-truth lookup:

| Lob first-piece quote | Bundle in $149 |
|---|---|
| ≤ $1.05 | 75/mo |
| $1.06 – $1.29 | 60/mo |
| ≥ $1.30 | 50/mo |
| ≥ $1.50 | revisit — raise Pro to $169 OR drop bundle to 30 |

Update `MONTHLY_BUNDLE` constant in `lib/property-pipeline/bundle-usage.ts` + the source-of-truth pricing section + step-6 handoff. **If first-piece review hasn't returned a quote by end of session, leave 75/mo as-is.**

---

## End-of-session ritual

When step 5 wraps:

1. Write `sessions/YYYY-MM-DD-property-pipeline-step5.md`
2. Mark step 5 ✅ in `decisions/property-pipeline-mvp-source-of-truth.md` checklist
3. **Ask before deploying** — "Committed as `<hash>`. NOT live until deployed. Want me to deploy?"
4. Capture the two Lob first-piece postcard IDs in the session log
5. Write `research/property-pipeline-step-6-handoff.md` (legal floor wiring)
6. Update vault `00-Dashboard.md` summary

---

## Step 6 preview (NOT for step 5)

After step 5 wraps:

- Verbatim FL §489.147(2)(a) text replacing the `[PLACEHOLDER]` on the back (12pt+, ≥½ largest font — design constraint)
- License # validation gate at signup (Hannah eyeballs DBPR once for design partner; no API at MVP)
- Direct-mail authorization clickwrap at signup → versioned text written to `direct_mail_authorization_versions` table → contractor row stamps `direct_mail_authorization_version_hash`
- Re-prompt clickwrap on text-version change

---

## Step 7 preview (NOT for step 5)

After step 6 wraps:

- Provision Lob LIVE key (post-Lob-onboarding-verification)
- Add to Vercel env: `LOB_API_KEY_LIVE` + flip `LOB_ENV=live`
- Send ONE postcard to Hannah's own home address (smoke test)
- Capture Lob ID + delivery date + scan-test result in session log
- Lock bundle number from real quote
- Mark MVP complete; recruit design partner
