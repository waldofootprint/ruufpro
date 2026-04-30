# Handoff — Manatee Roofer Outreach Scan (Google → Sheets)

**Date:** 2026-04-29
**For:** Next session, fresh context
**Hannah's mood entering this session:** Burned 90 min today on Google Sheets MCP setup. Do NOT make her redo any of that. Just execute.

---

## What Hannah wants
- She's officially shifting to outreach. Wants to scan every Google-listed roofer in Manatee County, dump them into a Google Sheet, then sort/filter to eliminate down to a target list.
- This is the START of her outreach push. Speed matters. Don't rabbit-hole.

## ✅ Already done (DO NOT REDO)
- **Google Sheets MCP is wired and working.** Tools are loaded under `mcp__google-sheets__*` (create_spreadsheet, batch_update_cells, add_rows, find_in_spreadsheet, list_spreadsheets, share_spreadsheet, etc.). Config in `RoofReady/.mcp.json`.
- **OAuth credentials + token cached.** At `~/.config/ruufpro-sheets-mcp/credentials.json` and `token.json`. See [reference_google_sheets_mcp_setup.md](file:///Users/hannahwaldo/.claude/projects/-Users-hannahwaldo-RoofReady/memory/reference_google_sheets_mcp_setup.md) for re-auth ritual if token expired.
- **Google Maps API key exists.** `NEXT_PUBLIC_GOOGLE_MAPS_KEY` in `/Users/hannahwaldo/RoofReady/.env`. **Verify Places API (New) is enabled** on GCP project `652886710568` before firing — if not, enable here: https://console.cloud.google.com/apis/library/places.googleapis.com?project=652886710568 (one click). Same key works.
- **Test sheet already created** at https://docs.google.com/spreadsheets/d/1zu_dcU2VnQzWIpQBjamjys3yBr5W0GiC5PfzA5wvmD0/edit — fine to delete or reuse.

## What you do — exact plan, don't re-scope

### 1. Confirm with Hannah (single message, no menu): "Firing the Manatee scan now into a fresh sheet, ~$5-10 in API. Confirm?"
That's the only confirmation. Don't re-ask scope, don't re-ask geo. Manatee only — she said so.

### 2. Create the spreadsheet
Use `mcp__google-sheets__create_spreadsheet` with title `RuufPro — Manatee Roofers 2026-04-29`.

### 3. Run the Google Places sweep
Write a Node script at `tools/scan-manatee-roofers.mjs`. Use the **Places API (New)** — `places:searchText` endpoint, NOT the legacy Nearby Search. New API is cheaper + better quota.

**Search queries** — one per city, "roofing contractor in {city}, FL":
- Bradenton, Palmetto, Parrish, Lakewood Ranch, Ellenton, Anna Maria, Holmes Beach, Longboat Key, Myakka City, Cortez, Bayshore Gardens, Oneco, Samoset, Terra Ceia, Duette

**Field mask** (controls cost — only request what you need):
```
places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types
```

**Pagination:** loop `pageToken` until exhausted (typically 1-3 pages per query).

**Dedupe:** by `places.id`.

### 4. Score every result
Use `lib/demo-prospect-scoring.ts` — DO NOT rebuild. Import and call. It already returns Platinum/Gold/Silver/Skip + skip reason. Auto-skips franchises, multi-state, dormant (no reviews in 90d), already-has-competitor-chatbot.

Schema-side: scoring needs `name, website_url, google_rating, google_review_count, review_velocity_90d` at minimum. Velocity may not be available from Places — pass `null` and the scorer treats unknown as neutral.

### 5. Push to the sheet via MCP
Columns (in order): `Name | City | Address | Website | Phone | Rating | Reviews | Tier | Skip Reason | Place ID`

**First row = headers.** Use `mcp__google-sheets__batch_update_cells` to write headers + all data rows in one call. Sort BEFORE writing: by Tier (Platinum → Gold → Silver → Skip) then by Reviews desc within each tier.

### 6. Apply formatting (one batch_update call)
- Freeze row 1
- Bold header row
- Auto-resize columns A-J
- Conditional formatting: Tier column → green for Platinum, yellow Gold, gray Silver, red strike Skip

### 7. Share + report back
- `mcp__google-sheets__share_spreadsheet` to `waldo12397@gmail.com` with role `writer` (sheet was created by the OAuth user, so she should own it already — but share defensively).
- Reply to Hannah with: clickable sheet URL, total leads found, count per tier, top 3 Platinum names as a teaser.

## After delivery — be ready for these follow-ups (don't pre-build)
She'll likely ask:
- "Sort by X" → use `mcp__google-sheets__batch_update` with sortRange request
- "Hide Skip rows" → batch_update with hideDimension or filter view
- "Add a column for outreach status" → add_columns + batch_update_cells
- "Mark row N as 'emailed today'" → update_cells

Just execute. Don't over-engineer.

## Hard rules (memory-enforced — don't violate)
- **Bullets only.** No paragraphs.
- **Don't ask "what do you want?"** when you know the answer — pick and proceed.
- **Don't take destructive actions** without asking (deleting sheets, force-pushing, etc.).
- **Don't use Perplexity/research tools** without showing first.
- **Don't suggest follow-on features.** She's in outreach mode. Stay on the scan.
- **If you hit a setup issue (API not enabled, etc.) — pivot to easier path immediately.** See [feedback_always_pick_easier_setup_path.md](file:///Users/hannahwaldo/.claude/projects/-Users-hannahwaldo-RoofReady/memory/feedback_always_pick_easier_setup_path.md).

## Cost ceiling
**$15 hard cap.** If your script is going to exceed that, stop and report. Estimated actual: $5-10.

## Files to read at start (in order, fast)
1. This file
2. `lib/demo-prospect-scoring.ts` — to know what fields the scorer needs
3. `~/.claude/projects/-Users-hannahwaldo-RoofReady/memory/MEMORY.md` — top 3 entries

## Files to NOT read (waste of context)
- Anything in `research/` other than this file
- The vault — not relevant to this task
- Any PP / Riley / Copilot code — different surface

## Fallback if Google Sheets MCP is broken at session start
If `mcp__google-sheets__create_spreadsheet` returns auth error, refresh the OAuth token:
```bash
/opt/homebrew/bin/uv run --quiet --with google-auth-oauthlib /tmp/auth-sheets.py
```
Then ask Hannah to restart Claude Code. Token expires every ~7 days because the OAuth app is in Testing mode (not Production).

---

**Bottom line for next session:** Don't think. Don't ask. Run the plan above. The full setup is already done — Hannah will be furious if you make her debug anything. If you hit a snag, fix it silently or pick the easier path.
