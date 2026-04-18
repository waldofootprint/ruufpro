---
name: demo-page-build
description: >
  Builds personalized demo pages for roofing contractor prospects. Scrapes their website,
  maps ONLY real scraped data to chatbot_config so Riley sounds impressive, creates DB records,
  and QAs the result. Zero fabrication — if it's not on their site, the field stays null.
  Trigger with /demo-page-build or when asked to "build a demo page", "build demo pages",
  "set up Riley for a prospect", or "scrape and build".
---

# Demo Page Builder

## Purpose

Build personalized demo pages for direct mail prospects. Each demo page shows a working Riley chatbot + estimate widget customized with the roofer's real business data. The demo page IS the lead magnet — when a roofer sees Riley answering questions about THEIR company, they want in.

## HARD RULES

1. **ZERO fabrication.** Only use data actually scraped from the roofer's website. No editing, no guessing, no inserting, no synthetic content. If a field isn't on their site, it stays null.
2. **Skip thin prospects.** If a prospect has no FAQ entries AND no about page content AND thin website overall — skip them. Don't waste an NFC card on a demo page that'll sound generic.
3. **Hannah approves every prospect.** Show the planned chatbot_config fields BEFORE inserting anything. Hannah says go or skip.
4. **Best scraping tool wins.** Start with Playwright scraper, but if Firecrawl or Apify gets better data for a specific site — use it. NFC cards are limited; quality > cost savings.
5. **No sites table.** Demo pages render from `prospect_pipeline` data, NOT the `sites` table. RuufPro does not build websites.

---

## On Invoke

### Step 1: Get Prospect Input

Accept any of these:
- **Pipeline ID** — UUID from prospect_pipeline table
- **Business name + URL** — for new prospects not yet in the pipeline
- **Batch** — "build demo pages for top 25" (loops through this workflow per prospect)

If no input provided, check prospect_pipeline for prospects at stage `scraped` or `google_enriched` that have `their_website_url` set but no `demo_page_url`.

### Step 2: Scrape the Website

**Primary tool:** `tools/scrape-prospect-site.mjs`
```bash
node tools/scrape-prospect-site.mjs --url "https://example-roofing.com"
```

**Scrape priority order (from Riley experiment findings):**
1. **FAQ page** — most valuable page. Fills 60%+ of chatbot_config when it exists.
2. **About page** — owner names are the #1 credibility signal for Riley.
3. **Services pages** — material lists, brands, specialties.
4. **Homepage** — trust signals, hero headline.

**If Playwright scraper returns thin data** (< 2 FAQ entries, no about text):
- Try Firecrawl MCP (`mcp__firecrawl__firecrawl_scrape`) on specific pages (FAQ URL, about URL)
- Announce to Hannah: "Playwright got thin data, using Firecrawl on [URL] (paid API)"
- If still thin after Firecrawl — this prospect may need to be skipped

**Scraper output fields:**
- `tagline`, `hero_headline`, `about_text`, `services[]`, `reviews[]`
- `phone`, `service_areas[]`, `faq[]`, `owner_name`, `founded_year`
- `competitor_tools[]`, `contact_form_url`

### Step 3: Data Quality Check

**Minimum threshold to proceed** — must have at least 2 of these 3:
- FAQ entries (any number)
- Owner name OR substantive about page content (not just "we are a roofing company")
- Detailed services with brands or specialties mentioned

**Auto-SKIP if:**
- Website is entirely a single-page template with no real content
- All 3 above are missing
- Competitor tools detected (Roofle, Intercom, Podium, etc.) — check via `lib/nfc-scoring.ts`

**If skipping:** Tell Hannah exactly why: "Skipping [Business] — no FAQ, no about page, services page is just a bullet list with no details."

### Step 4: Map Scraped Data to chatbot_config

**CRITICAL: Only use data that was actually scraped. Never invent content.**

| chatbot_config field | Source | If not found |
|---|---|---|
| `custom_faqs` | Scraped FAQ entries → `[{q: "...", a: "..."}]` | Leave as `[]` |
| `differentiators` | About page: owner names, founding year, specialties, unique details | `null` |
| `typical_timeline_days` | FAQ answers or services mentioning days/weeks | `null` |
| `materials_brands` | Services pages: brand names (GAF, Owens Corning, CertainTeed, etc.) | `null` |
| `team_description` | About page: owner names, team info, years experience | `null` |
| `does_insurance_work` | `true` if FAQ or about mentions "insurance" | `false` |
| `insurance_description` | Specific detail from FAQ/about about insurance process | `null` |
| `warranty_description` | FAQ answers or services about warranty | `null` |
| `emergency_available` | `true` if FAQ/services mention "emergency" or "24/7" | `false` |
| `emergency_description` | Specific detail from FAQ/about about emergency service | `null` |
| `offers_free_inspection` | `true` if FAQ/services/about mention "free inspection" or "free estimate" | `false` |
| `process_steps` | Scraped process/how-it-works section | `null` |
| `financing_provider` | Specific financing company name if mentioned | `null` |
| `financing_terms` | Specific terms if mentioned | `null` |
| `current_promotions` | Current promo from homepage/banner if found | `null` |
| `payment_methods` | If listed on site | `null` |
| `referral_program` | If mentioned on site | `null` |
| `price_range_low` / `price_range_high` | **NEVER populate** — never fabricate pricing | `null` |

**What makes Riley sound like an employee (from experiment):**
- Named owners ("Antonio and Lupita") — single biggest credibility signal
- Specific numbers (since 2003, 30+ years)
- Specialty products (ZAM alloy, APOC coatings)
- Operational details ("dump trailers not dumpsters")
- Local knowledge ("15 years in Florida")

Look for these details when mapping. If they're in the scraped data, make sure they land in the right field.

### Step 5: Show Hannah for Approval

Present the planned chatbot_config in a clear format:

```
## [Business Name] — Demo Page Build

**Data richness:** [HIGH/MEDIUM/LOW]
- FAQs found: [count]
- Owner name: [name or "not found"]
- About page: [summary or "thin/missing"]

**Planned chatbot_config:**
- custom_faqs: [count] entries
  - Q: [first question]
  - Q: [second question]
  - ...
- differentiators: [value or null]
- typical_timeline_days: [value or null]
- materials_brands: [list or null]
- team_description: [value or null]
- insurance: [yes/no + description or null]
- emergency: [yes/no]
- offers_free_inspection: [yes/no]
- [any other non-null fields]

**Fields left null:** [list]

**Proceed? (go / skip / edit)**
```

**Wait for Hannah's response before proceeding.**

### Step 6: Create DB Records (after approval)

Execute via Supabase MCP (`mcp__supabase__execute_sql`):

**6a. Create contractor row:**
```sql
INSERT INTO contractors (id, business_name, phone, city, state, has_ai_chatbot)
VALUES (gen_random_uuid(), '[name]', '[phone]', '[city]', '[state]', true)
RETURNING id;
```

**6b. Create chatbot_config row:**
```sql
INSERT INTO chatbot_config (contractor_id, custom_faqs, differentiators, typical_timeline_days, ...)
VALUES ('[contractor_id]', '[faqs_json]'::jsonb, ...);
```

**6c. Update prospect_pipeline:**
```sql
UPDATE prospect_pipeline
SET contractor_id = '[contractor_id]',
    demo_page_url = '/demo-preview/' || id,
    stage = 'demo_built',
    demo_page_built_at = now()
WHERE id = '[pipeline_id]';
```

**6d. Create auth user (needed for contractor FK):**
```sql
-- Check if contractor needs a placeholder auth user
-- The contractors table requires a user_id FK
-- Use a deterministic placeholder: demo-[pipeline_id]@ruufpro.demo
```

Note: Check the contractors table schema for required fields before inserting. The exact SQL may need adjustment based on NOT NULL constraints and FK requirements.

### Step 7: QA Riley

After DB records are created, test Riley on the live demo page.

**Navigate to:** `https://ruufpro.com/demo-preview/[pipeline-id]`

**Ask these 3 questions (from the experiment scoring rubric):**

1. "How much does a new roof cost?"
   - GOOD: References free inspection, doesn't fabricate prices
   - BAD: Makes up numbers, dodges entirely

2. "How long does a roof replacement take?"
   - GOOD: Uses scraped timeline if available, honest if not
   - BAD: Makes up timeline, says nothing useful

3. "What makes you different from other roofers?"
   - GOOD: Mentions owner names, specific facts, specialties from config
   - BAD: Generic "years of experience and quality work"

**Score each 1-3.** Report total to Hannah.

- 12-15/15: Excellent — ready for mail
- 10-11/15: Good — acceptable for demo
- Below 10: Flag for review — data may be too thin

### Step 8: Report

After building (or skipping), report:

```
## Demo Page Build Report

**Built:** [count] pages
**Skipped:** [count] prospects (with reasons)

### Built Pages:
| Business | City | FAQs | Owner | Riley Score | Demo URL |
|----------|------|------|-------|-------------|----------|
| ... | ... | ... | ... | .../15 | /demo-preview/[id] |

### Skipped:
| Business | Reason |
|----------|--------|
| ... | No FAQ, thin about page |
```

---

## Key Files

| File | Purpose |
|------|---------|
| `tools/scrape-prospect-site.mjs` | Playwright website scraper |
| `lib/nfc-scoring.ts` | NFC scoring system (THE scoring system) |
| `lib/chat-system-prompt.ts` | How chatbot_config fields feed into Riley's prompt |
| `app/demo-preview/[id]/page.tsx` | Demo page — renders from prospect_pipeline |
| `supabase/049_chatbot_config.sql` | chatbot_config table schema |
| `.tmp/riley-experiment/findings.md` | Full experiment findings + field impact ranking |

## chatbot_config Field Impact Ranking (from experiment)

1. **custom_faqs** — THE most important. Q3/Q4 pull nearly verbatim.
2. **differentiators** — Q5 lives or dies here. Named owners + unique details.
3. **typical_timeline_days** — Null = Riley dodges timeline questions.
4. **insurance_description** — One specific detail > vague "we assist."
5. **materials_brands** — Named brands >> generic material list.
6. **team_description** — Named owners surfaced here too.
7. **warranty_description** — Only surfaces if directly asked.
