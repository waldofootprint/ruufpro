# Copilot #317b: Disaster Exposure Intel — Build Plan

## Context

Copilot #317 (8a-c) shipped roof age, original roof flag, and replacement window — all derived from cached RentCast `year_built`. This feature adds the missing disaster/storm dimension: what FEMA-declared disasters have hit a lead's county, and is the property in a flood zone? This gives roofers contextual intel like "Hurricane Ian hit this county in 2022 and this roof is 28 years old."

**Zero new paid API costs.** FEMA Disaster API + FEMA NFHL flood zones + FCC Census FIPS lookup are all free, no key. Google Geocoding uses existing `GOOGLE_API_KEY` with $300 credit.

---

## Files to Touch

| File | Change |
|------|--------|
| `supabase/074_copilot_disaster_exposure.sql` | NEW — disaster cache table + property_data_cache columns |
| `lib/fema-api.ts` | NEW — FEMA disaster + flood zone + geocode+FIPS functions |
| `lib/copilot-tools.ts` | ADD `DisasterExposureData` interface + `getDisasterExposureForCopilot()` |
| `lib/copilot-system-prompt.ts` | ADD tool description + example interactions |
| `app/api/dashboard/copilot/route.ts` | WIRE new tool registration |

---

## Step 1: Migration — `supabase/074_copilot_disaster_exposure.sql`

**New table: `disaster_declarations_cache`** (per-county, 30-day TTL)

```sql
CREATE TABLE IF NOT EXISTS disaster_declarations_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_fips text NOT NULL,
  county_fips text NOT NULL,
  county_name text,
  declarations jsonb DEFAULT '[]',
  last_fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(state_fips, county_fips)
);

ALTER TABLE disaster_declarations_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read disaster cache"
  ON disaster_declarations_cache FOR SELECT USING (true);
CREATE POLICY "Service role manages disaster cache"
  ON disaster_declarations_cache FOR ALL USING (auth.role() = 'service_role');
```

**New columns on `property_data_cache`:**

```sql
ALTER TABLE property_data_cache
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS county_name text,
  ADD COLUMN IF NOT EXISTS county_fips text,
  ADD COLUMN IF NOT EXISTS state_fips text,
  ADD COLUMN IF NOT EXISTS flood_zone text,
  ADD COLUMN IF NOT EXISTS flood_zone_sfha boolean,
  ADD COLUMN IF NOT EXISTS flood_zone_fetched_at timestamptz;
```

**Why separate table for disasters:** Disaster declarations are county-level. If 10 leads share Hillsborough County, we call FEMA once. 30-day cache because new declarations are rare.

---

## Step 2: FEMA API Wrapper — `lib/fema-api.ts`

Three functions:

### `geocodeWithCounty(address: string)`
- Reuses `GOOGLE_API_KEY` (same as `lib/solar-api.ts`)
- Calls Google Geocoding → extracts lat, lng, county name from `address_components`
- Then calls FCC Census Block API (`https://geo.fcc.gov/api/census/block/find?latitude=X&longitude=Y&format=json`) → extracts county FIPS
- Returns `{ lat, lng, countyName, countyFips, stateFips }`
- FCC API: free, no key, returns FIPS directly from coordinates

### `fetchDisasterDeclarations(stateFips: string, countyFips: string)`
- Endpoint: `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries`
- Filter: state + county FIPS + last 10 years + roof-relevant types only (Hurricane, Severe Storm(s), Tornado, Flood)
- Deduplicate by `disasterNumber` (FEMA returns one row per assistance program per disaster)
- Returns array of `{ disasterNumber, type, title, beginDate, endDate }`

### `fetchFloodZone(lat: number, lng: number)`
- Endpoint: `https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHL/MapServer/28/query`
- Query: point geometry at lat/lng, return `FLD_ZONE` + `SFHA_TF`
- Returns `{ floodZone: string, isSFHA: boolean }` or null

All three are cache-first — check DB before calling.

---

## Step 3: Copilot Tool — `lib/copilot-tools.ts`

### New interface:

```typescript
export interface DisasterExposureData {
  lead_id: string;
  lead_name: string;
  address: string | null;
  county_name: string | null;
  disaster_count: number;
  recent_disasters: Array<{
    type: string;
    title: string;
    begin_date: string;
    years_ago: number;
  }>;
  hurricanes_10yr: number;
  severe_storms_10yr: number;
  flood_zone: string | null;
  is_flood_zone: boolean;
  flood_zone_description: string;
}
```

### `getDisasterExposureForCopilot(supabase, contractorId, nameOrId)`

Flow:
1. `getLeadDetailsForCopilot()` → get lead + address (existing pattern)
2. Get `property_data_cache` record (same FK/address fallback as `getPropertyIntelForCopilot`)
3. If no lat/lng cached → `geocodeWithCounty(address)` → update property_data_cache
4. If no county_fips → return "Couldn't determine the county for this address"
5. Check `disaster_declarations_cache` → if missing or >30 days old → `fetchDisasterDeclarations()` → upsert
6. If no flood_zone cached → `fetchFloodZone(lat, lng)` → update property_data_cache
7. Build `DisasterExposureData` + message → return

### Message examples (tone-checked):

- **With disasters + flood zone:** "Garcia's area (Hillsborough County) has had 4 FEMA-declared disasters in the past 10 years, including Hurricane Ian (2022) and Hurricane Irma (2017). The property is in flood zone AE — a high-risk flood area."
- **No disasters:** "No FEMA-declared disasters in Garcia's county over the last 10 years. The property is in flood zone X — minimal flood risk."
- **No address:** "No address on file for Garcia. Disaster data needs a street address."
- **Partial:** "Garcia's area has had 3 FEMA-declared disasters in the past 10 years. Flood zone data isn't available for this location."

### Flood zone descriptions (factual, not alarming):
- AE/AH/AO/A → "High-risk flood area (FEMA Special Flood Hazard Area)"
- VE/V → "High-risk coastal flood area"
- X (shaded) → "Moderate flood risk"
- X (unshaded) → "Minimal flood risk"
- D → "Flood risk undetermined"

---

## Step 4: System Prompt — `lib/copilot-system-prompt.ts`

Add to Available Tools list:

```
- **getDisasterExposure**: Get FEMA disaster history and flood zone for a lead's area — declared disasters (hurricanes, storms, tornadoes, floods) in their county over 10 years, plus flood zone status. Call for "what disasters hit [name]'s area", "flood zone", "storm history", "disaster exposure", or FEMA questions.
```

Add examples:

```
User: "What disasters have hit Garcia's area?"
→ Call getDisasterExposure with nameOrId="Garcia".

User: "Is Wilson's property in a flood zone?"
→ Call getDisasterExposure with nameOrId="Wilson".
```

---

## Step 5: Wire in API Route — `app/api/dashboard/copilot/route.ts`

```typescript
getDisasterExposure: tool({
  description: "Get FEMA disaster history and flood zone for a lead's area...",
  inputSchema: z.object({
    nameOrId: z.string().describe("The lead's name (partial match OK) or UUID"),
  }),
  execute: async ({ nameOrId }) => {
    return getDisasterExposureForCopilot(supabase, contractorId, nameOrId);
  },
}),
```

---

## Step 6: Tone Checklist

| Rule | Status |
|------|--------|
| No fake expertise | ✅ FEMA data only, no roofing advice |
| No emotional assumptions | ✅ No "homeowner must be worried" |
| No fabricated statistics | ✅ All numbers from FEMA API |
| Coach don't command | ✅ No "you should mention the hurricane" |
| Never condescend | ✅ Neutral observations |
| Inform don't script | ✅ What to KNOW, not what to SAY |

---

## Verification Plan

1. **Migration** — run via Supabase MCP, verify table + columns exist
2. **FEMA Disaster API** — test with Hillsborough County FL (FIPS 12057), confirm Hurricane Ian + Irma appear
3. **FEMA Flood Zone API** — test with known FL address, confirm zone returned
4. **FCC Census FIPS** — test with FL lat/lng, confirm county FIPS returned
5. **Geocoding** — test `geocodeWithCounty()` with a FL address
6. **Cache** — verify second call for same county skips FEMA, uses cache
7. **Copilot chat** — ask "What disasters have hit [lead name]'s area?" → verify tool triggers
8. **Edge cases** — lead with no address, geocode failure, FEMA timeout, county with zero disasters
9. **Regression** — verify `getPropertyIntel` still works (shares property_data_cache)
10. **Deploy** — `vercel --prod --force`, test on ruufpro.com

---

## Reuse Summary

| Existing | Reuse How |
|----------|-----------|
| `getLeadDetailsForCopilot()` in copilot-tools.ts | Lead lookup by name — same as all other tools |
| Property_data_cache FK/address fallback | Same pattern as `getPropertyIntelForCopilot` |
| `GOOGLE_API_KEY` env var | Already configured, used by solar-api.ts |
| Google Geocoding pattern | Same as `geocodeAddress()` in solar-api.ts, extended for county extraction |
| Tool registration pattern | Same Zod + execute pattern as all 13 existing tools |
