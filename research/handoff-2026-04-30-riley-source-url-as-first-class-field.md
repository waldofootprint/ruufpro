# Handoff — Make Riley's source website URL a first-class field (Option C)

**Date:** 2026-04-30
**Branch:** main (clean)
**Why:** During a full dashboard audit (2026-04-30), the "Scan my site" button on Riley tab was reported broken. Root cause: button always 400s for any contractor whose `chatbot_config.source_website_url` is `NULL`. Hannah picked Option C (visible URL field) as the long-term fix.

---

## The bug we're fixing

**Symptom:** "Scan my site" banner on Riley tab → click → modal opens → immediately 400s with "No website URL on file. Run the URL crawl in onboarding first." Dead-end Close button.

**Root cause chain:**
1. Banner copy promises *"Paste your site URL and Riley will fill this in for you"* — implies modal will accept a URL
2. Click opens [`RecrawlModal`](app/dashboard/settings/tabs/RileyTab.tsx#L1101) which has NO input field
3. Modal POSTs `/api/dashboard/riley/recrawl` immediately on mount with no body ([line 1125](app/dashboard/settings/tabs/RileyTab.tsx#L1125))
4. API reads `chatbot_config.source_website_url`; returns 400 if NULL ([route.ts:98-107](app/api/dashboard/riley/recrawl/route.ts#L98-L107))
5. Modal shows error + Close. No way forward.

**Who it hits:** Any contractor whose account predates the onboarding URL-crawl step OR who skipped it. Confirmed for SunCoast Roofing test account (id `f0e73bee-6946-4083-985a-39cc466d8703`).

---

## Why Option C, not B

**B = hidden URL, modal-driven** — extend the modal to prompt for URL when missing, save, then scan. Fixes the 400 but keeps the URL invisible in normal use.

**C = visible URL, persistent field on Riley tab** — surface URL as an editable field always shown on Riley tab, alongside Greeting / accordions. "Scan my site" only appears when URL exists; clicking just runs against it.

**Why C wins long-term:**
- Trust signal — contractor sees "Riley is trained on suncoast.com" at all times
- Edits without modal friction (changed domains? new site? edit + save)
- Self-explanatory for new contractors — empty field with helper text reveals the feature
- Surfaces what's currently buried in JSONB (`chatbot_config.source_website_url` text column already exists, see migration 092)
- Eliminates the dead-end 400 entirely (button only renders when URL exists)
- One source of truth visible everywhere it matters (debugging, support, admin)

---

## Schema reality (already exists, no migration needed)

`supabase/092_chatbot_config_crawl_state.sql` already added:
- `source_website_url text` (nullable)
- `last_crawled_at timestamptz`
- `crawl_state jsonb`

So this is a UI + flow change, NOT a schema change. ✅

---

## Where `source_website_url` is read today (cross-surface check)

```
app/dashboard/settings/tabs/RileyTab.tsx        — read at 222, written at 345, gates banners at 532/546/563
app/api/dashboard/riley/recrawl/route.ts        — gates 400 at 102-107
app/api/onboarding/full-crawl/route.ts          — background full-site crawl trigger
app/onboarding/page.tsx                         — written during onboarding URL-crawl step
lib/scrape-to-chatbot-config.ts                 — sets it on initial scrape mapping
```

Nothing else. Safe surface area.

---

## Build plan

### 1. UI: add visible field on Riley tab (~30 min)

In `app/dashboard/settings/tabs/RileyTab.tsx`, add a new section above the Greeting Message block:

```
┌─ Source Website URL ──────────────────────────────────────┐
│ Riley learns from this site. Update if your URL changes.  │
│ ┌───────────────────────────────────────┐                  │
│ │ https://suncoastroofing.com           │  [Save & Scan]   │
│ └───────────────────────────────────────┘                  │
│ Last scanned: 14 days ago · 8 pages indexed               │
└────────────────────────────────────────────────────────────┘
```

- Bind to existing `sourceWebsiteUrl` state (already in component, line 196)
- Add `editing` flag — show "Save & Scan" only when value differs from saved
- Validate: must be `https?://` and pass URL constructor
- Helper text below differs based on state:
  - **Empty:** "Paste your website URL so Riley can learn it (3–8 min, runs in the background)"
  - **Saved + last_crawled_at:** "Last scanned: {relative} · {pagesCompleted} pages indexed"
  - **Saved, never scanned:** "Click Scan to train Riley on this site"

### 2. Wire the Save & Scan handler (~20 min)

```
async function saveAndScan(url: string) {
  // Save URL to chatbot_config.source_website_url
  await supabase.from("chatbot_config").upsert({
    contractor_id: contractorId,
    source_website_url: url,
    updated_at: new Date().toISOString(),
  });
  setSourceWebsiteUrl(url);
  // Then trigger the existing recrawl flow
  setRecrawlOpen(true);
}
```

The existing `RecrawlModal` works as-is once URL is on file — no change needed.

### 3. Remove now-redundant surfaces (~15 min)

Once the URL field is visible:
- **Delete the "Skip the typing — paste your site URL" banner** (lines 476-497) — it's misleading and now redundant
- **Delete the "Scan my site" button on the banner** — replaced by Save & Scan on the URL field
- **Keep** the "Train Riley on full site" / "Re-crawl full site" buttons (lines 533, 552) — these run the full crawl, different from URL re-scan
- **Keep** the "Last scanned {url} on {date}" status line (line 566) — still informative

### 4. Onboarding parity check (~10 min)

Verify `app/onboarding/page.tsx` still writes `source_website_url` correctly. Don't change onboarding flow — just confirm it still hits this column. New flow on Riley tab is the **edit-after-onboarding** surface, not a replacement for onboarding.

### 5. Migration for existing NULL contractors (~0 min — none needed)

No backfill. Contractors with NULL just see the empty field with the helper text and can fill it themselves. That's the whole point.

### 6. Testing

- SunCoast test account (NULL URL): field renders empty, helper says "Paste your website URL…", typing + Save & Scan triggers full flow, modal succeeds, URL persists
- Contractor WITH URL on file: field shows URL, "Last scanned" line below, edit → Save & Scan re-runs against new URL
- Invalid URL: client-side rejects, no API call

---

## Files to touch

| File | Change |
|---|---|
| [`app/dashboard/settings/tabs/RileyTab.tsx`](app/dashboard/settings/tabs/RileyTab.tsx) | Add URL field section, remove banner, wire saveAndScan |

That's it. One file. The API and modal already work — they just need a URL on the row.

---

## Out of scope (don't drift)

- Don't touch the onboarding URL-crawl flow
- Don't change the recrawl API
- Don't redesign the Riley tab beyond the new URL section
- Don't migrate existing rows
- Don't add a "remove URL" / "untrain Riley" feature — separate decision
- Don't auto-rescan on URL save — the user chose "Save & Scan" or just "Save"; keep it explicit

---

## Definition of done

1. Riley tab shows a visible "Source Website URL" field with current value (or empty)
2. Empty state has clear helper text
3. Saving a URL persists to `chatbot_config.source_website_url`
4. "Save & Scan" runs the existing recrawl flow successfully against the saved URL
5. Old "Skip the typing" banner is gone
6. SunCoast test account can now train Riley without touching onboarding
7. Deploy to Vercel, hit the live URL, eyeball
8. Commit + ask Hannah to deploy

---

## Opening prompt for next session

```
Read research/handoff-2026-04-30-riley-source-url-as-first-class-field.md.
Then build it — Option C, single file change to RileyTab.tsx. Show me the new
URL field on localhost before deploying.
```
