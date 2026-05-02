# Handoff — RuufPro Marketing Site Rebuild
**Date:** 2026-05-02 · **From:** Hannah (with Claude in design partner mode) · **For:** Next session, Claude (or human dev)

---

## TL;DR

- The current production site `ruufpro.com` (powered by `components/ridgeline-v2/`) feels mismatched with Hannah's outreach letter and underwhelming for a "premium dev expert" brand.
- We spent this session rebuilding from scratch as a **standalone HTML preview** at `.tmp/site-v3-letter-aligned/full-site.html`. **2,201 lines. 9 sections. Approved by Hannah at this stage.**
- Next session: review the preview, finalize a small list of open items, **then port the design into real Next.js components** under `components/ridgeline-v3/` (or evolve `ridgeline-v2/` in place — TBD with Hannah).

**Open the preview:** `cd /Users/hannahwaldo/RoofReady/.tmp/site-v3-letter-aligned && python3 -m http.server 4488` then visit `http://localhost:4488/full-site.html`

---

## Why we rebuilt

Hannah's outreach letter (`.tmp/direct-mail-letter-J-google-filter.html`) is warm, personal, first-person, with a specific Google-filter hook ("Late last year Google rolled out an Online Estimates filter"). The current `ridgeline-v2/` site is editorial-brutalist — cold all-caps Barlow Condensed, generic "Stop missing leads" headline, lots of mono uppercase, ink-block sections. Roofers who scan the QR after reading the letter land on a site that feels like a different person made it.

We rebuilt to feel like an extension of the letter — premium, modern, dev-expert energy, but warm and first-person.

---

## Design system (locked)

### Palette (Hannah's, with one adjacent extension)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F5F1E8` | warm bone — primary background |
| `--bg-2` | `#ECE6D8` | sand — alternating sections |
| `--bg-3` | `#FAF6EC` | lighter sand |
| `--bg-deep` | `#E4DCC8` | deeper sand for "marketing-everywhere" section |
| `--ink` | `#0E0E11` | near-black for type + dark sections |
| `--ink-2` | `#1A1A1F` | gradient companion to ink |
| `--rust` | `#C2562A` | accent / CTA |
| `--coral` | `#E2855A` | gradient companion to rust + dark-mode accent |
| `--slate` | `#5A5048` | warm gray for body text |
| `--slate-2` | `#82786C` | softer warm gray for meta |
| `--mint` | `#6B8763` | live-status indicator only |

### Type
- **Display + body:** `Geist` (Vercel's font, free Google Fonts) — weights 400/500/600. **No 700-800.** Hannah explicitly said "not bold."
- **Mono labels:** `Geist Mono` (eyebrows, status pills, captions, FAQ structure)
- **Critical rule:** headlines are `font-weight: 500`. Don't bump to bold.

### Voice
- **First-person Hannah** in two places: hero eyebrow ("From Hannah · A developer in Bradenton" — currently dropped, see open items), and the "Why I built this" section near the bottom.
- **Brand voice** elsewhere ("we", "RuufPro").
- **Drop "Riley" by name** on the marketing site. Use "AI assistant" / "your AI assistant" / "an AI trained on your business." Hannah may rename the product internally; don't let the marketing site lock in a name. Internal product UI can keep "Riley." (See "Naming" memory in `feedback_no_unobservable_outcome_features.md`-adjacent notes.)

### Animation rules
**Tasteful, not maximalist.** Hannah explicitly: "elegant and not overdone animation, tasteful."
- Faint background grid panning over 60s (almost imperceptible)
- Two soft drifting orbs behind hero (rust + coral, 26-32s loops)
- Staggered fade-in on hero load (6 elements, 0.7s ease, 130ms delay between)
- Shimmer sweep across primary CTA buttons (6s loop)
- Live-dot pulses at 1.8s
- Truck rocks gently 6s loop
- Balloons bob (4s, staggered 0.6s offset)
- Sticky-stack toolkit cards (top: 90/110/130px)
- Marquee strips (40s loop)

---

## Section-by-section state of `full-site.html`

| # | Section | Status | Key copy |
|---|---|---|---|
| 1 | **Hero** (split-frame) | ✅ approved | H1: *"The lead engine for crews under ten."* Sub: satellite calculator + AI assistant + review automation. CTAs: *Start 30 days free →* / *See live demo ⌘D*. Right side = floating dashboard preview card with live lead, AI reply, review push, monthly stats. |
| 2 | **Marquee** strip | ✅ | "One flat price · Unlimited leads · No per-lead fees · Built in Bradenton · For crews under ten · 14-day free trial" |
| 3 | **Google Update** | ✅ approved (spacing audited + tightened) | H2: *"Google now hides roofers without instant pricing."* + Google search mock with "Online estimates" filter active + 3 simple bordered points + 4 source citations (Footbridge, Altavista, Priceguide, Demand-iq) |
| 4 | **The Toolkit** (3 sticky cards) | ✅ approved | **Tool 01 Calculator** — uses `3d-roof.jpg` (real Google 3D Tiles screenshot). **Tool 02 AI assistant** — uses `phone-cutout.png` with SMS thread inside the screen (missed-call autoreply message). **Tool 03 Review automation** — phone notification mock with "Send →" button. Cards stack on scroll. |
| 5 | **Use your calculator anywhere** | ✅ approved | Top: "Dead simple setup" full-width card with 3-step list + dashboard mock showing "Email Embed Code" feature with shimmer Send button. Bento below: **Trucks** (real `truck-cutout.png` photo, transparent bg), **Door hangers** (CSS), **Business cards** (CSS), **Balloons** (CSS, with bob animation, "Yes, balloons. We're not making it up."). |
| 6 | **Missed-call recovery** | 🟡 needs phone-image swap | Dark section. H2: *"You're on a roof. Your AI's not."* 3 phones (currently CSS-built — **see open items, swap to `phone-cutout.png` × 3**). 3 reassurance points: no new phone number, no AI pretending to be you, 5-minute setup. |
| 7 | **Pricing** | ✅ approved | $149/mo, 7-bullet inclusion list (calculator, AI assistant, missed-call recovery, lead dashboard, review push + automated email reviews, branding, unlimited leads). "Close one extra replacement and you're up $6,000+." Footnote: first 5 roofers get 30 days free. |
| 8 | **Hannah's note + FAQ** | ✅ approved | Dark. Personal note signed "— Hannah · hannah@ruufpro.com" + 4 FAQs (no phone numbers / not an AI receptionist / 5-min setup / what happens after trial). |
| 9 | **Footer** | ✅ approved | 4-col: brand, Product, Company, Legal. Meta bar: "© 2026 Feedback Footprint LLC · DBA RuufPro" + "Built in Bradenton · v1.0" |

---

## Open items (in priority order)

### 1. (TODO) Replace 3 CSS phones in Missed-Call section with real iPhone image
Use `phone-cutout.png` (already saved) — same one used in Tool 02. Should be straightforward: rip the `.phone` / `.phone-screen` CSS-built phones in `#missed-call`, replace each with `.tv-phone` instance per the existing pattern. Adjust the SMS thread copy per phone:
- **Phone 1:** missed call screen — `(941) 555-0123 · Just now`
- **Phone 2:** SMS exchange — incoming "Hi, looking for a roofer for a leak repair" → outgoing autoreply (same copy as Tool 02 phone)
- **Phone 3:** AI chat — homeowner asking "Active leak in the kitchen ceiling" / "742 Evergreen Terrace" / AI scheduling tomorrow morning

The phone container scales to `360px max-width`. The screen overlay rect is `top: 11.5% / left: 30% / right: 30% / bottom: 8.5%` per the geometry of `phone-cutout.png` (740×740, screen at exactly that rect).

### 2. (TODO) Re-grab the 3D screenshot at the angle Hannah likes
She wants to pick the framing herself. Process:
1. `cd /Users/hannahwaldo/RoofReady-postcard-3d && PORT=3001 npm run dev`
2. Visit `http://localhost:3001/postcard-landing-mockup`
3. Hannah drags the 3D scene to her preferred angle
4. Capture via Playwright (use `mcp__playwright__browser_take_screenshot`) at 1400×900 viewport
5. Process: `python3` → resize to 1600px wide, JPEG quality 88 → save to `.tmp/site-v3-letter-aligned/3d-roof.jpg`
6. Refresh full-site.html — image is wired in via the `.tv-3d` element

The current `3d-roof.jpg` is a placeholder Hannah hasn't approved.

### 3. (DESIGN DEBT) Hero eyebrow is missing the "From Hannah" line
We removed it during iteration. Hannah's letter voice is first-person and the "From Hannah · A developer in Bradenton" eyebrow on the hero ties the site to the letter. Recommend re-adding above the H1 in the hero. Style:
```
font-family: "Geist Mono", monospace; font-size: 11px; color: var(--rust);
letter-spacing: 0.06em; text-transform: uppercase;
```
Currently the hero pill says "v1.0 · Built in Bradenton · 2026" — could stack "From Hannah" eyebrow above the pill, or replace the pill text.

### 4. (PRODUCT DECISION still open) Do we wire the live 3D tiles into the actual Calculator widget?
This session's recommendation: **YES, in Phase 2 — after first paying customer.** Do not block the marketing-site ship on it. The screenshot in Tool 01 is enough proof for the homepage today. Live integration into `EstimateWidgetV4` is a 1-2 day spike, lazy-loaded, with per-roofer usage cap to control Google Maps API costs (~$0.005 per tile request). Code base for the integration is all in worktree `/Users/hannahwaldo/RoofReady-postcard-3d/` at branch `feature/postcard-3d` (commit `3c485ef`). Hannah needs to OK API cost pass-through model before you ship live.

### 5. (PORT TO REAL CODE) Migrate the HTML preview to Next.js components
This is the actual work after design approval. Plan:
- Create `components/ridgeline-v3/` (or evolve `ridgeline-v2/` — Hannah's call)
- Component split:
  - `nav.tsx`, `hero.tsx`, `marquee.tsx`, `google-update.tsx`, `toolkit.tsx`, `marketing-everywhere.tsx`, `missed-call.tsx`, `pricing.tsx`, `note-faq.tsx`, `footer.tsx`
- Move the inline `<style>` to a single `globals.css` block with the design tokens, OR Tailwind `@layer` extensions, OR scoped CSS modules — Hannah hasn't decided
- Replace mock dashboard panels with **live `EstimateWidgetV4`** in the hero (currently the right column is a static visual mock). Sample contractor: `c2a1286d-4faa-444a-b5b7-99f592359f80` (Demo Roofing Co)
- Real photos / mocks:
  - `truck.webp` is real (saved from her Desktop)
  - `phone-cutout.png` is real (transparent iPhone)
  - `3d-roof.jpg` is from her postcard demo (TBD final angle)
  - All other visuals (door hanger, business cards, balloons, dashboard "Email Embed Code" mock) are CSS — keep as is or upgrade

### 6. (BACKEND TODO referenced from the site) "Email Embed Code" feature in the dashboard
The marketing site shows a feature where a roofer can email the embed snippet to their developer with one click. **This feature does NOT exist in the dashboard yet.** Currently `app/dashboard/settings/tabs/EstimatesTab.tsx` (lines ~698-731) only has a Copy button.

Two paths:
- **(a)** Mock-only: keep it on the marketing site as aspirational; build it before site goes live so the site doesn't lie
- **(b)** Drop the email feature from the marketing site and replace with the real Copy-to-clipboard story

Hannah's call. Her instinct seemed to be "build it" since the messaging is so good. Estimated effort: ~2 hours for a real `Resend`/`SendGrid` send + a small modal in the dashboard.

### 7. (CONTENT) Real source citations for the Google update stats
Currently citing 4 industry sources by name. Each citation is verified (per Hannah's outreach letter footnote, May 2 2026). When the site goes live, each citation should link to a real URL. Hannah will need to provide the URLs from her research notes.

### 8. (OPTIONAL) Hero dashboard preview — make it the LIVE widget, not a mock
The hero's right side is currently a static "dashboard" showing fake leads. Stronger move: replace with the real `EstimateWidgetV4` (matches what's on `ridgeline-v2/hero.tsx` today). Marketing wins: visitors can play with the calculator as their first interaction with the site.

---

## Files index

```
.tmp/site-v3-letter-aligned/
├── full-site.html          ← THE DESIGN. 2,201 lines. Approved baseline.
├── 3d-roof.jpg             ← 1600×1028 JPG, 440KB, from postcard-landing-mockup screenshot. Placeholder until Hannah picks angle.
├── 3d-roof-landing.png     ← original 1400×900 PNG screenshot (source for the JPG)
├── phone.png               ← original supplied iPhone mockup (740×740, gray bg)
├── phone-cutout.png        ← processed: gray bg removed, white screen preserved, shadow feathered
├── truck.webp              ← original supplied truck photo (with white bg)
├── truck-cutout.png        ← processed: white bg removed for transparent placement on cream cards
├── hero-split.html         ← isolated hero preview (used during iteration, kept for reference)
├── directions.html         ← round 1 design exploration (4 directions: refined minimal / Swiss / craftsman / tradesman tech)
├── directions-2.html       ← round 2 (4 premium dev-tool directions: aurora / bento / spotlight / editorial)
├── directions-3.html       ← round 3 ($10K dev expert with loosened palette)
├── directions-4.html       ← round 4 (21st.dev hero archetypes: lamp / beams / grid / retro grid)
├── options.html            ← palette + font comparison page
└── index.html              ← v1 attempt before Hannah pushed for premium direction (kept for reference, not active)
```

---

## Companion docs to read

- **`.tmp/direct-mail-letter-J-google-filter.html`** — the canonical outreach letter (Letter J, locked May 2 2026). The marketing site is the digital extension of this voice.
- **`.tmp/missed-call-recovery-website-guide.md`** — Hannah's brief on the missed-call feature. **Critical:** site must NOT imply we provide phone numbers or run an AI voice receptionist. We provide a smart link the roofer drops into their phone's auto-reply. Read before touching the missed-call section.
- **`.tmp/outreach/roofer-pitch-landing.html`** — the existing landing page that pairs with the outreach letter (different from this main marketing site). Has its own design DNA.
- **`workflows/build_website.md`** — RuufPro's standard website-build workflow.
- **`research/go-to-market-plan.md`** — positioning + messaging context.

---

## Marketing copy to honor (don't lose this)

The "Use your calculator anywhere" section has specific Hormozi-style copy that Hannah pulled from Roofr's pitch and approved:

> **UPGRADE YOUR MARKETING EFFORTS — Lead capture made easy**
>
> Use your Instant Estimator in all your marketing materials to capture more leads.
>
> Use it on your website, in ads, door hangers, business cards, or anywhere else. **One Roofr customer put QR codes on balloons!**

The current preview honors this with: a 4-card bento (trucks / door hangers / business cards / balloons) and a header section with the dashboard "Email Embed Code" feature. Keep the **balloons callout** verbatim — "Yes, balloons. We're not making it up." It's a branded line for RuufPro now.

---

## Memory entries to update

After this handoff, the next session should:
- Update or add memory: `project_marketing_site_v3_handoff_2026-05-02.md` pointing here
- Mark `~/.claude/projects/-Users-hannahwaldo-RoofReady/memory/MEMORY.md` with a top-line entry: "Marketing site rebuild — preview at `.tmp/site-v3-letter-aligned/full-site.html`, handoff at `research/handoff-2026-05-02-marketing-site-rebuild.md`. Approved baseline; needs missed-call phone-image swap + 3D screenshot reframe before port."

---

## How to resume in next session

1. **Read this doc top-to-bottom.**
2. **Re-open the preview:**
   ```bash
   cd /Users/hannahwaldo/RoofReady/.tmp/site-v3-letter-aligned && python3 -m http.server 4488
   ```
   Then visit `http://localhost:4488/full-site.html`.
3. **Walk Hannah through it** to confirm the baseline is still right (she may want tweaks).
4. **Knock out the priority list** in order:
   - (1) Phone-image swap in missed-call section
   - (2) Re-shoot 3D angle
   - (3) Hero "From Hannah" eyebrow
5. **Get explicit OK** before porting to `components/ridgeline-v3/`. The port is the bigger commitment and Hannah will want to talk through tooling (Tailwind vs vanilla CSS, component split, where Riley name lives in product UI vs marketing).
6. **Don't deploy to ruufpro.com** without Hannah's eyeball. Verify on Vercel preview first.

---

## Things explicitly NOT to do

- Don't re-add the "Riley" name to user-facing marketing site copy. Internal product UI is fine.
- Don't bring back Barlow Condensed or any all-caps display headlines. Geist mid-weight only.
- Don't use stock illustrations — Hannah cares about real photos and SVG cutouts. Truck and phone are real.
- Don't claim "we provide phone numbers" or "AI receptionist" anywhere — both contradict the missed-call feature reality (see guide doc).
- Don't add unsourced stats. Hannah is meticulous about evidence (the letter has 4 named industry sources).
- Don't deploy `vercel --prod --force` from the worktree. Push to main, let Vercel auto-deploy + auto-alias (verified 2026-04-30).
