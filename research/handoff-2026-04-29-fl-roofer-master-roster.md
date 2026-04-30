# Handoff — FL Roofer Master Roster + Column-by-Column Enrichment Workflow

**Date last updated:** 2026-04-29 (end of day)
**For:** Next session, possibly fresh context
**Status:** Batch 1 (Manatee, 101 licensees) is enriched 5 columns deep. Hannah's preferred workflow locked in. Ready to either ship Batch 1 to outreach or start Batch 2 (Sarasota).

---

## TL;DR — what's done, what's next

- **9,210-row FL roofing license master roster** built from FL DBPR public data — lives in `FL Master Roster` tab.
- **110 enriched Manatee roofers** (from earlier Places sweep) ported into `Manatee Scan` tab.
- **Batch 1: 101 NEW Manatee licensees** (DBPR-not-in-our-110) enriched 5 signals deep — lives in `Manatee Batch 1` tab.
- **30 of 101 are clean ICP-shaped roofers ready for outreach** (green pool, top of sheet).
- **Hannah locked in a column-at-a-time workflow** instead of one-shot enrichment. She pre-approves each new column to learn what each signal does. This is THE pattern going forward.

---

## ⭐ THE primary sheet — only one we use

**`RuufPro — FL Roofer Master Roster 2026-04-29`**
- ID: `1nudY6M21NzgmDNcztxZQW-IhWEsskNpEuoxkUvOsHTk`
- URL: https://docs.google.com/spreadsheets/d/1nudY6M21NzgmDNcztxZQW-IhWEsskNpEuoxkUvOsHTk/edit

**Tabs (4):**
1. `FL Master Roster` (sheetId 0) — 9,210 raw FL roofing licenses, sorted SW FL first then by ZIP. 12 cols incl. blank `Enriched On` for tracking.
2. `Active Leads` (sheetId 767273283) — empty, headers only. NOT USED THIS SESSION; Batch 1 went to its own tab instead. Decide later whether to consolidate into Active Leads or keep one-tab-per-batch.
3. `Manatee Scan` (sheetId 366668326) — 110 enriched roofers from Places sweep. Sorted: 30 ICP fits → too_many → too_few → low_rating → no_website → franchise → has_competitor_tool.
4. `Manatee Batch 1` (sheetId 1904682419) — **the tab from this session.** 101 new DBPR Manatee licensees, 15 columns deep.

**DEPRECATED — do not touch:**
- `RuufPro — Manatee Roofers 2026-04-29` (`1I3AMLI1eSas9RxWvRhQ8s-CNi43nQRhS_9_DSqTHUGE`) — superseded by `Manatee Scan` tab. Kept as backup. Don't write to it.

---

## 🎯 Hannah's column-at-a-time workflow — DO NOT SKIP THIS

Hannah explicitly chose to NOT do one-shot enrichment. She wants to add ONE signal at a time, eyeball the result, then approve the next. Reasons:
- She's learning what each signal contributes
- She catches false positives early (we found and filtered out web-scrape junk like "Historic Home" / "John Doe" before they shipped)
- She controls sort order at each step

**The pattern, every time:**
1. Propose 2-3 column candidates with my recommendation + reasoning
2. Wait for approval
3. Run the scrape/lookup/compute, save to `enriched-batch-N-{signal}.json`
4. Push to sheet as a new column on the right
5. Apply formatting (bold header, autoresize, conditional fill)
6. Show top-N rows of the green pool with the new signal visible
7. Ask "next column?"

**Sort rules locked in for `Manatee Batch 1` (do NOT change without approval):**
- Bucket order top→bottom: `No` (green) → `No website` → scan errors → `No Google match` → `Yes — disqualified` (pink, last)
- Within green: `Contact Form?` Yes-first, then `Reviews` ASC, then business name
- Hannah tried adding Years Licensed as primary green sort — **REJECTED, undo'd** — keep form/reviews as the green sort

---

## Columns currently in `Manatee Batch 1` (15 total, A→O)

| Col | Header | Source | Yield notes |
|---|---|---|---|
| A | License # | DBPR | 100% |
| B | Business | DBPR (DBA preferred over person name) | 100% |
| C | License Holder | DBPR | 100% |
| D | City | DBPR | 100% |
| E | ZIP | DBPR | 100% |
| F | Address | DBPR | 100% |
| G | Website | Places API search by name+city | 50/101 (50%) — non-matches lack Google profiles |
| H | Place ID | Places API | 60/101 (matched name with similarity ≥0.4) |
| I | Disqualifying Tool? | Website fetch + regex | Yes(7) · No(40) · No website(10) · No Google match(41) · scan err(3) |
| J | Rating | Places (cached from Pass 1) | 60/101 |
| K | Reviews | Places (cached from Pass 1) | 60/101 |
| L | Owner Name | DBPR license holder, parsed `LAST, FIRST` → `First Last` | 100% |
| M | Email | Website scrape (mailto + inline regex), prefers personal over generic | personal: 21 · generic: 13 · none: 16 (of 50 with website) |
| N | Contact Form? | Website scrape — native `<form>` with ≥2 fields, OR 3rd-party widget (JotForm/Gravity/HubSpot/Typeform/Wufoo/Cognito/Formstack) | 31/50 (62%) — 15 of those use a 3rd-party widget |
| O | Years Licensed | DBPR issue date, `2026 - issue_year` | 100%. Caveat: license-issued ≠ years-in-business |

**Conditional formatting on column I:**
- 🟢 green = "No" (clean — eligible for outreach)
- 🩷 pink = "Yes …" (disqualified)
- ⬜ gray = "No Google match"
- 🟧 orange = "No website"
- 🟪 purple = "(scan err: …)"

---

## False-positive watchlist (manual eyeball before send)

These slipped through automated filters — review manually before exporting to Instantly:

**Email column (col M):**
- `prime@hvac.pro` — looks like an HVAC link picked up from elsewhere, not the roofer's email
- `kevinclarkfit@training.com` — looks like a training/placeholder email
- `daphane@mulocklaw.com` — law firm (probably attorney bio mentioned on site)
- `behlen@behlenmfg.com` — appears for 2 different licenses; manufacturer email scraped from supplier links

**Disqualifying column (col I):**
- `VERTICAL ROOFING CORP` flagged via `Instant Quote (heuristic)` regex only — could be false positive (just phrasing on a contact page). Worth eyeballing the actual site before disqualifying.

**Owner Name column (col L):**
- All come from DBPR — high confidence. The license holder is the qualifying contractor, almost always the owner for 1-10 person crews. For larger ops with full-time qualifiers, may be a senior employee but still senior enough to address.

---

## What I tried that DIDN'T work (don't redo)

- **Web-scraped owner names** — 24% raw hit rate, 12% after filtering false positives ("Our Founder", "John Doe" placeholder, "Historic Home" / "Flat Roof" matched generic page text). DBPR license holder name is 100% hit rate and high quality — use that instead.
- **County-code-based SW FL flagging** — DBPR uses internal county codes, NOT FIPS. I guessed wrong initially. **Use ZIP prefix (335-349) for SW FL filtering, not the county_code column.**
- **Phone number column** — proposed but Hannah explicitly said: "I'll never use their phone number, i don't plan on cold calling." Skip phone-based signals.

---

## Pipeline state — the 30 ready-now

The **30 clean ICP-shaped Manatee roofers** at the top of `Manatee Batch 1` (rows 2-31 in current sort) have:
- Working website
- No competitor chatbot/estimator widget
- Owner name parsed from DBPR
- ~52% have a personal email scraped (21 of 40 in green pool)
- 62% have a contact form on their site

**Outreach-ready next steps (when Hannah's ready):**
1. Personal-email subset (21) → cold email via Instantly
2. Generic-email-only subset (8) → contact form OR direct mail
3. Form-only / no-email subset (11) → contact form OR direct mail
4. Owner name + business address gives direct-mail capability for ALL 30

---

## Files in `.tmp/dbpr/` — reusable scripts + state (~5MB total)

| File | What | Reuse |
|---|---|---|
| `master-roster.json` | 9,210 active FL roofing licenses, parsed objects | Source of truth for any future filter |
| `manatee-new-pool.json` | 101 DBPR Manatee licensees not in our 110 | Batch 1 input |
| `manatee-overlap.json` | 60 fuzzy-matched dupes between DBPR and Places-110 | Reference |
| `enriched-batch-1.json` | Pass 1 output: place_id, website, disqualifying, rating, reviews | Cached — feeds passes 2-5 |
| `enriched-batch-1-email.json` | Pass 4 output: email, has_form, form_widget | |
| `enriched-batch-1-owners.json` | Pass 3 web-scrape attempt — abandoned, kept for reference | |
| `enrich-pass1.mjs` | **Reusable** — Places API + tool-scan pass | YES, swap input file for next batch |
| `scrape-email-form.mjs` | **Reusable** — email + contact form scrape | YES |
| `scrape-owner-names.mjs` | Web owner-name scrape — abandoned approach | NO, use DBPR instead |
| `push-chunks.mjs` | **Reusable** — direct Sheets REST API write for >2K rows | YES, for any large write |
| `push-manatee-tab.mjs`, `push-batch1-*.mjs` | Per-pass push scripts using cached OAuth | Templates for new passes |

**FL DBPR raw file URL** (re-download anytime, ~45MB):
`https://www2.myfloridalicense.com/sto/file_download/extracts//CONSTRUCTIONLICENSE_1.csv`

---

## Method recipe — how to add a new column to `Manatee Batch 1`

This is the canonical pattern. Copy-paste:

1. **Build column data** (Node one-liner, sorted same as current sheet):
   ```js
   // Re-derive the sorted row order using the locked sort:
   //   bucket → has_form Yes-first → reviews ASC → business name
   // Then map to col values, write { 'P1:P102': [['Header'], ...] } to JSON
   ```
2. **Append column to sheet:** `mcp__google-sheets__batch_update` with `appendDimension`.
3. **Push values:** use a `push-batch1-passN.mjs` template (clone an existing one, change col letter + filename).
4. **Format header + autoresize:** `mcp__google-sheets__batch_update` with `repeatCell` (bold, gray bg) + `autoResizeDimensions`.
5. **(Optional) conditional formatting** on the new column.
6. **Show top-10 of green pool** with new signal in stdout.
7. **Wait for "next column?" approval.**

---

## Method recipe — how to start Batch 2 (Sarasota or any new county)

1. **Filter master:** `node -e` filter `master-roster.json` by ZIP set for the target county. (Sarasota ZIPs: 34229-34243 plus 34275, 34285-34293 — check FL ZIP gazetteer.)
2. **Dedupe** against `manatee-with-tools.json` if expanding within touched geo (probably not needed for new counties).
3. **Create new tab:** `Sarasota Batch 1` etc. via `addSheet`.
4. **Push raw rows** with empty enrichment columns (use `push-batch1-raw.mjs` as template).
5. **Repeat the column-at-a-time workflow** with Hannah's approval at each step.

---

## OAuth quirks (preempt these)

- The `mcp-google-sheets` MCP caches the OAuth token at server startup. **If token is refreshed via `/tmp/auth-sheets.py`, must restart Claude Code** — MCP does not auto-reload.
- Token location: `~/.config/ruufpro-sheets-mcp/token.json`. Has `refresh_token`, can self-refresh via direct REST.
- For >1MB writes: do NOT use `mcp__google-sheets__batch_update_cells` (tool param size limits). Use the `push-chunks.mjs` pattern (Node + direct Sheets REST + cached token).

---

## Cost reality check

- Pass 1 (Places + tool scan): **$0.50 for 101 rows**
- All subsequent passes: **$0** (everything cached or scraped from already-known URLs)
- Owner-name web-scrape detour: **$0** (didn't ship)
- Total session API spend: **~$0.50**

If Hannah wants to scale to all 9,210 statewide: ~$45-50 in Places API. Hold until Manatee outreach validates the funnel.

---

## Hard rules — DON'T violate

- **Never call roofers** — Hannah confirmed she will NOT cold-call. Don't propose phone-based features. Phone column is fine to add as data, never as outreach channel. ([feedback_no_customer_calls.md](file:///Users/hannahwaldo/.claude/projects/-Users-hannahwaldo-RoofReady/memory/feedback_no_customer_calls.md))
- **One column at a time** — never bundle multiple new signals into one pass without explicit approval
- **Show false-positive watchlist** to Hannah after every scrape pass — she eyeballs before exporting to Instantly
- **Don't auto-cascade to other counties** — finish Manatee, then check in
- **Don't drop the deprecated Manatee sheet** (kept as backup)

---

## Re-orient prompt for next session

> Read `research/handoff-2026-04-29-fl-roofer-master-roster.md`. We're in column-at-a-time enrichment mode for `Manatee Batch 1` tab in the FL Roofer Master Roster sheet. Last sort applied: greens with form-yes first, reviews ASC. Ready to either add another column (propose 2-3 next), or talk about exporting Batch 1 to Instantly/direct mail, or start Batch 2 (Sarasota). Wait for Hannah to direct.
