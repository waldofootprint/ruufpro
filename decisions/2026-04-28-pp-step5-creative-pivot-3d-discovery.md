# PP Step 5 creative pivot — Insurer-flags v5 → 3D-Discovery v6

**Date:** 2026-04-28
**Decision-maker:** Hannah
**Supersedes:** `decisions/property-pipeline-mvp-source-of-truth.md` lines 79-108 (prior version)
**Status:** Locked. All future PP step 5 work uses this direction.

---

## What changed

Mid-session 14 (PP step 5 production HTML), Hannah pivoted the postcard creative from **Insurer-flags v5** to **3D-Discovery v6** based on a separate spitball about the QR landing page concept (a 3D render of the homeowner's house + neighborhood with floating age cards + NOAA storm-survival count + roofer branding).

## Why

The locked Insurer-flags direction and the new QR landing page concept fight each other:

- Insurer-flags primes the homeowner to expect "here's what they're flagging" — a buy-now emotional pitch.
- The 3D landing page promises "here's something cool to look at" — a discovery / curiosity intent.
- A postcard pitching the insurer angle and a landing page delivering a 3D house render is a bait-and-switch — the homeowner expects insurer documents and gets a video-game render. Conversion would suffer.

Pivoting the postcard to **also** be discovery-led aligns the two surfaces. The insurer pressure can still surface as a footnote on the landing page itself — not on the postcard.

## What's locked in v6

- **4 front headline variants** — all four ship and round-robin in production until performance data picks the winner. (See source-of-truth lines 79-108 for verbatim copy.)
- **Back trio (questions):** roof age · storm count · neighbors' replacements
- **Front footer microcopy:** *"We're a licensed Florida roofer. No call. No pitch. Just a look at your roof."*
- **No eyebrow / meta strip.** Headline carries.
- **No photo.** `with-photo` variant killed. The 3D render is the visual asset.

## What's unchanged from v5

- Compliance: SB 76 verbatim disclosure on back, half-rule font cap (`MAX_OTHER_FONT_PX = 32`, `DISCLOSURE_FONT_PX = 16`), license # both sides, opt-out URL
- Per-home facts rule: cohort/decade-level OK; specific roof age / permit / year-built BANNED on the postcard
- Banned phrases list
- Per-contractor branding from `contractors` at send time
- 6×11 standard-class format (1125×625 px @ 100dpi bleed)
- No roofer-uploaded full designs

## Files affected

- `decisions/property-pipeline-mvp-source-of-truth.md` — lines 79-108 rewritten in place
- `lib/property-pipeline/postcard-template.tsx` — copy + back structure rewritten; `withPhoto` option removed; `inspectionPhotoUrl` field removed; new `variant` parameter for headline A/B/C/D
- `app/dashboard/pipeline/preview/page.tsx` — renders all 4 front variants side-by-side + 1 back
- `app/api/pipeline/send/route.ts` — picks variant per send (round-robin or random until data picks a winner)

## Insurer-flags v5 archive

Preserved in git history. If 3D-Discovery v6 underperforms in production we have a tested fallback to revert to. **Trip-wire to revert:** if landing-page scan-to-lead conversion is below 2% after 500+ sends across 3+ contractors, run an A/B between v5 and v6 instead of dropping v5 entirely.

## Mid-session refinements (2026-04-28 PM, after Lead-Spy competitive read)

After looking at Lead-Spy's actual postcard gallery (their 11 templates spanning Classic / Customer Incentive / Dark / Flashy / Old aesthetic registers), Hannah pulled three changes back into v6:

1. **Lifted "free inspection" CTA from Lead-Spy.** It's their visual anchor across most templates and works. We never actually banned it — the banned phrase is "free *estimate*" (which implies pricing commitment). "Free inspection" is just a look. Now standard on all variants. Source-of-truth rule clarified.

2. **Relaxed the per-home granularity rule.** Lead-Spy's "PUBLIC RECORDS SHOW YOUR ROOF MAY BE OVER 20 YEARS OLD" line is more honest than our prior posture, which banned all per-home framing. The original goal was to avoid stating things as fact we don't know. Attributed framing ("public records show...", "we couldn't find a permit...") solves that without losing personalization. Still banned: bare assertions ("your roof is 23 years old"). Source-of-truth rule rewritten.

3. **Variant D ("We couldn't find a roof permit on your address.") promoted to primary.** Hannah's pick after seeing all 4 rendered. It's the clearest articulation of the new public-records framing. Default in `app/api/pipeline/send/route.ts`. All 4 variants still ship.

**Variant copy after refinements** (replaces what's listed in source-of-truth lines 79-108 — keep them in sync):
- **A · Storm-led:** "47 named storms have hit Florida since 2009." → sub: "Most pre-2010 roofs have weathered every one of them. Scan for a free roof inspection — and a 3D look at your home, your roof's age, and how it stacks up on your block."
- **B · Public-records-led:** "Public records suggest your roof hasn't been replaced in 20+ years." → sub: "That's when most Florida roofs start showing problems beneath the shingles. Scan for a free inspection — your home in 3D, your block's roof history, and storms survived."
- **C · Block-comparison:** "Three roofs on your block were replaced last year. Was yours?" → sub: "Scan for a free roof inspection — see your home in 3D, your roof's likely age, and where you land on your block."
- **D · Permit-honesty (PRIMARY):** "We couldn't find a roof permit on your address." → sub: "Records this far back usually mean it's been 20+ years since the last replacement. Scan for a free roof inspection — your home in 3D, your roof's likely age, and how your block compares."

**Front footer slot** — replaced italic "we're a licensed Florida roofer..." line with a typographic stamp (mono small caps, terracotta border): `FREE ROOF INSPECTION · NO CALL · NO PITCH · LICENSED FL ROOFER`. Editorial register stays intact; visual anchor for trash-can sort improves.

**Back QR scan-line** — was "Two minutes. No phone tag." Now: "Scan for a free roof inspection."

## Open follow-ons (NOT blocking session 14)

- [ ] **QR landing page build** — the 3D render + age cards + storm count is its own multi-session beat. v6 postcard ships first; landing page is currently a stub at `/m/[code]`. The postcard's promises must match the eventual landing page; if landing page can't deliver "your home in 3D" within ~6 weeks, kill headlines A/B/C/D referencing 3D and fall back to a copy-only landing page tease.
- [ ] **Storm-count source** — NOAA Storm Events Database has named-storm history by state + date. The "47 since 2009" number on headline A is static (good for postcard, no per-card lookup needed) but the landing page's per-home count needs a server-side NOAA query. Verify the 47 number against NOAA before first live send.
- [ ] **Round-robin variant selection logic** — implement in `app/api/pipeline/send/route.ts`. Simple modulo on `mailing_history` row count per contractor, or random pick. Decide before first live send. Currently defaults to D (Hannah's pick).
- [ ] **Re-evaluate after first 100 sends** — if D outperforms, make it the only variant and kill A/B/C. If a different variant wins, swap default. Performance signal = scan rate on the QR landing page.
