# Cold Email Tool Suite — Implementation Plan

## Context
Hannah needs to cold email roofing contractors to acquire her first customers. The Hormozi-inspired strategy: build a personalized website for each prospect BEFORE emailing them, then send the link. This requires 4 tools that automate the pipeline from prospect discovery → site generation → email sequences → tracking.

## Architecture Decisions

- **All tools in Node.js** (.mjs files) — Supabase JS SDK already installed, Playwright needed for screenshots, keeps everything in one language
- **Supabase for site/contractor records** (required — templates render from DB), **CSV for prospect/outreach data** (simpler, portable, Instantly-compatible)
- **Playwright for screenshots** against localhost (dev server must be running) or Vercel URL once deployed
- **Google Places API (Text Search)** for prospect research — ~$0.16 per 100 prospects

## Prerequisites (Must Do First)

### 1. Database Migration — `supabase/012_prospect_contractors.sql`
- Make `user_id` nullable on `contractors` (currently `NOT NULL` — blocks tool inserts)
- Add `is_prospect boolean DEFAULT false` column
- Add `blueprint` to the sites template check constraint (currently missing)

### 2. Install Dependencies
```bash
npm install --save-dev playwright
npm install csv-parse csv-stringify
npx playwright install chromium
```

### 3. Create shared lib — `tools/lib/`
- `supabase-admin.mjs` — Supabase client using service role key
- `slugify.mjs` — business name → URL slug with uniqueness check
- `csv.mjs` — CSV read/write helpers

## Tool 1: Site Preview Generator (HIGHEST PRIORITY)

**File:** `tools/generate-site-preview.mjs`

**Usage:**
```bash
# Single prospect
node tools/generate-site-preview.mjs --name "Joe's Roofing" --city "Dallas" --state "TX" --phone "(214) 555-0123"

# Batch from CSV
node tools/generate-site-preview.mjs --csv .tmp/prospects/top_picks.csv
```

**What it does:**
1. Creates contractor record in Supabase (`user_id: null, is_prospect: true`)
2. Creates site record (`published: true, template: 'modern_clean'`)
3. Launches Playwright, navigates to `localhost:3000/site/{slug}`
4. Screenshots the page → saves to `.tmp/mockups/{slug}.png`
5. Prints the live URL + screenshot path

**Key details:**
- Checks for duplicate business_name + city before inserting
- Generates unique slug, appends `-2`, `-3` if taken
- `--template` flag (default: `modern_clean`, options: `chalkboard`, `blueprint`)
- `--base-url` flag (default: `http://localhost:3000`, can point to Vercel)
- Batch mode: reads CSV, processes each row with 2s delay between screenshots

## Tool 2: Prospect Research — `tools/find-prospects.mjs`

**Usage:**
```bash
node tools/find-prospects.mjs --city "Dallas" --state "TX" --limit 50 --confirm
```

**What it does:**
1. Calls Google Places Text Search API: "roofing contractors in {city}, {state}"
2. Paginates until `--limit` reached
3. For each result extracts: name, phone, address, website, rating, review count
4. Checks if website exists (HEAD request)
5. Generates personalized first-line based on online presence
6. Outputs CSV to `.tmp/prospects/{city}_{state}_{date}.csv`

**Cost safeguard:** Prints estimated API cost + call count. Requires `--confirm` flag.

**NOTE:** Requires Places API (New) enabled in Google Cloud Console. Hannah needs to do this.

## Tool 3: Email Sequence Generator — `tools/generate-email-sequence.mjs`

**Usage:**
```bash
node tools/generate-email-sequence.mjs --prospects .tmp/prospects/dallas_top_30.csv --output .tmp/sequences/dallas_batch_1
```

**What it does:**
1. Reads prospect CSV
2. Looks up site_link from Supabase for each prospect (if site was built)
3. Outputs two files:
   - `{output}_instantly.csv` — recipient list + merge variables for Instantly upload
   - `{output}_templates.md` — the 5 email step templates with `{{variable}}` placeholders

**Email templates** follow the Hormozi "gift first" framework from the workflow doc.

## Tool 4: Outreach Tracker — `tools/track-outreach.mjs`

**Usage:**
```bash
node tools/track-outreach.mjs --import .tmp/prospects/dallas.csv
node tools/track-outreach.mjs --update "joes-roofing" --status "replied-interested"
node tools/track-outreach.mjs --summary
```

**What it does:** Maintains `.tmp/outreach/tracker.csv` with prospect pipeline status.

## File Structure
```
tools/
  generate-site-preview.mjs
  find-prospects.mjs
  generate-email-sequence.mjs
  track-outreach.mjs
  lib/
    supabase-admin.mjs
    slugify.mjs
    csv.mjs
    places-api.mjs

supabase/
  012_prospect_contractors.sql

.tmp/
  mockups/        ← screenshot PNGs
  prospects/      ← research CSVs
  sequences/      ← email sequence outputs
  outreach/       ← pipeline tracking
```

## Build Order
1. DB migration (012) — 15 min
2. Shared libs (`tools/lib/`) — 30 min
3. **Tool 1: generate-site-preview** — 1-2 hours (highest priority)
4. Tool 4: track-outreach — 30 min
5. Tool 2: find-prospects — 1 hour (needs Places API enabled)
6. Tool 3: generate-email-sequence — 1 hour
7. Update `workflows/cold_email_outreach.md` — 15 min

## End-to-End Workflow
```
find-prospects → review CSV → generate-site-preview (batch) → generate-email-sequence → upload to Instantly → track-outreach
```

## Stress Test Findings & Fixes

### Fix 1: Prospect Site Isolation (Critical)
- Create `app/preview/[slug]/page.tsx` — separate route for prospect previews
- Renders same templates but reads only `is_prospect = true` records
- NO "Powered by RuufPro" branding on preview pages — breaks the Hormozi illusion
- Prospect slugs prefixed with `p-` to avoid collisions with real customers
- Add `prospect_expires_at` timestamp, auto-cleanup after 30 days
- All dashboard queries filter `WHERE is_prospect = false`

### Fix 2: Dev Server Auto-Management (Tool 1)
- Tool checks if localhost:3000 is responding before screenshotting
- If not running, auto-starts `npm run dev` in background, waits for ready
- Uses `waitForSelector` on nav/hero element, not just "network idle"
- Minimum screenshot file size check (catches blank/error pages)

### Fix 3: Screenshot Performance (Tool 1)
- Reuse single Playwright browser instance across batch (launch once, new page per screenshot)
- Progress output: `[12/50] Generating joes-roofing...`
- Save state to resume if interrupted (skip already-screenshotted slugs)
- `--concurrency` flag (default 1, max 3)

### Fix 4: Email Address Gap (Tool 2 — Critical)
Google Places does NOT return email addresses. Instantly requires emails. Options:
- **v1 (Manual):** Tool outputs CSV without emails. Hannah manually enriches top prospects (LinkedIn, company website contact page, Hunter.io)
- **v2 (Automated):** Add website scraping step — if prospect has a website, scrape contact page for email
- **v3 (API):** Integrate Apollo free tier (50 credits/month) for email enrichment
- **Build v1 first, add v2/v3 later**

### Fix 5: Instantly CSV Format (Verified)
- `Email` column first (capitalized), required
- Additional columns auto-map to custom variables
- Column names: capitalized, max 20 chars, no empty columns
- UTF-8 encoding
- Tool 3 outputs in this exact format

### Fix 6: CAN-SPAM Compliance
- Hannah needs a PO Box or virtual office address before sending
- Instantly handles unsubscribe links automatically
- Add physical address requirement to workflow prerequisites

### Fix 7: Prospect Cleanup
- `node tools/generate-site-preview.mjs --cleanup` deletes expired prospect records (>30 days old, no conversion)
- Prevents database pollution from 500+ unconverted prospects

## Verification
- Run Tool 1 with test data, confirm site appears at localhost:3000/preview/{slug}
- Confirm screenshot saved to .tmp/mockups/
- Confirm no "Powered by RuufPro" on preview page
- Run Tool 4 import + summary
- Run Tool 2 with --limit 5 --confirm (small test batch)
- Run Tool 3 with test prospects, verify Instantly CSV format matches spec
- Test prospect → real customer conversion flow (slug rename, is_prospect flip)
