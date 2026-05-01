# Phase 2 Step 1 — Polygon Overlay + Frontend `error_code`/`confidence` Handling

**Date:** 2026-05-01
**Owner:** Hannah
**Status:** Awaiting approval. Once approved, execute in fresh session.
**Predecessor:** `decisions/2026-05-01-phase-1-shippable-calculator.md`

---

## Goal

Close the trust gap with Roofr by showing homeowners (a) a static Mapbox aerial of the measured building with the footprint polygon overlaid on the results screen, and (b) per-`error_code` copy + a low-confidence indicator. Math engine untouched. No editable polygon.

## Architecture

- **Polygon source:** MS Footprints building polygon (already in our geospatial Supabase). Extend the existing `find_building_footprint` RPC to also return `ST_AsGeoJSON(geom)`. The polygon is the *building*, not the *roof segments* — Google Solar does not return per-segment polygons (only segment bounding-box corners and areas), so the building outline is the highest-fidelity polygon we can draw.
- **Renderer:** Mapbox Static Images API. Single `<img>` tag, no JS map library, no editable interactions. URL built **server-side** in `/api/estimate` so the Mapbox token never ships in the client bundle.
- **Always-call footprint:** Today the footprint RPC fires only when Solar returns null. For the overlay, we call it on **every** geocode-resolved request (~10-20ms cost). On Solar success, footprint is overlay-only; on Solar null, it's also the area source (Phase 1 behavior preserved).
- **Fallback:** If footprint lookup returns no polygon (rural address, gap in MS data), the widget falls back to a centered aerial **without** an overlay rather than blocking the result.
- **Error copy:** Centralize `error_code → { headline, body, cta }` in `lib/error-copy.ts`. Widget reads from this map. Fixes the live bug where `estimate-widget-v4.tsx:449` still checks the pre-Phase-1 string `couldnt_measure_accurately` (now `measurement_unavailable`) — manual-quote branch is currently dead code in production.
- **Confidence:** Add a small "Approximate measurement" badge on the results screen when `confidence === "low"`. No auto-widening of the price range (per Phase 1 Step 3 decision).

## Tech Stack

- Mapbox Static Images API (server-side URL composition, public-token-style scope, free tier covers >50k req/mo)
- Existing Supabase geospatial project (`vfmnjwpjxamtbuehmtrv`), `building_footprints` table, column `geom`
- Next.js 14 App Router, TypeScript
- No new client libs. No `mapbox-gl` / `react-map-gl`.

---

## Pre-execution checks (DO FIRST)

1. **Mapbox account.** Confirm Hannah has a Mapbox account and a token. If not, sign up at mapbox.com (free), create a token with scopes `styles:tiles`, `styles:read`, `fonts:read`, `datasets:read`, `vision:read`. Restrict by URL referrer to `*.ruufpro.com,localhost:*`.
2. **Verify `building_footprints.geom` column type.** Run in Supabase SQL editor:
   ```sql
   SELECT column_name, data_type, udt_name
   FROM information_schema.columns
   WHERE table_name = 'building_footprints' AND column_name = 'geom';
   ```
   Expected: `udt_name = 'geometry'`. If `geography`, adjust RPC accordingly.
3. **Confirm GIST index on geom.** Run:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'building_footprints';
   ```
   Need a GIST index for `ST_Contains` to be fast. If missing, add:
   ```sql
   CREATE INDEX IF NOT EXISTS building_footprints_geom_gist
     ON building_footprints USING GIST (geom);
   ```
4. **Verify Vercel env vars.** Add (does not yet exist): `MAPBOX_TOKEN` (server-side, **not** `NEXT_PUBLIC_`).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| Geospatial Supabase migration (SQL) | New | Replace `find_building_footprint` RPC to return GeoJSON polygon alongside area |
| `lib/footprints-api.ts` | Modify | Surface polygon GeoJSON in return shape |
| `lib/mapbox-static.ts` | New (~70 lines) | Build a Mapbox Static Images URL with a path overlay encoded from a GeoJSON polygon |
| `lib/error-copy.ts` | New (~50 lines) | `error_code → { headline, body, cta }` map |
| `app/api/estimate/route.ts` | Modify | Call footprints on geocode success; attach `roof_overlay` to all responses |
| `components/estimate-widget-v4.tsx` | Modify | Render overlay `<img>` on success step; render `error_code`-driven UI; render low-confidence badge; fix live bug at line 449 |
| `.env.example` | Modify | Document `MAPBOX_TOKEN` |

**Do NOT touch:** `estimate-widget-v3.tsx` (archived), the 5 theme wrapper sections (no logic change needed — they already pass through to v4).

---

## Tasks

### Task 1: Geospatial DB — extend footprint RPC to return polygon

**Files:**
- Migration via Supabase dashboard SQL editor (project `vfmnjwpjxamtbuehmtrv`). Save the SQL to `migrations/geospatial/2026-05-01-find-building-footprint-with-geom.sql` for source-of-truth (geospatial migrations are not in the main Supabase migration system per memory).

- [ ] **Step 1: Inspect current RPC**

Run in Supabase SQL editor:
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'find_building_footprint_area';
```
Record the output. (Phase 1 created `find_building_footprint_area`; we'll create a sibling rather than break it.)

- [ ] **Step 2: Write the new RPC**

Save to `migrations/geospatial/2026-05-01-find-building-footprint-with-geom.sql`:
```sql
CREATE OR REPLACE FUNCTION public.find_building_footprint_with_geom(
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE(
  area_sqm double precision,
  building_id bigint,
  geom_geojson jsonb
)
LANGUAGE sql STABLE AS $$
  WITH point AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326) AS pt
  ),
  contained AS (
    SELECT
      ST_Area(bf.geom::geography) AS area_sqm,
      bf.id AS building_id,
      ST_AsGeoJSON(bf.geom)::jsonb AS geom_geojson,
      0 AS rank
    FROM building_footprints bf, point
    WHERE ST_Contains(bf.geom, point.pt)
    ORDER BY ST_Area(bf.geom::geography) DESC
    LIMIT 1
  ),
  nearest AS (
    SELECT
      ST_Area(bf.geom::geography) AS area_sqm,
      bf.id AS building_id,
      ST_AsGeoJSON(bf.geom)::jsonb AS geom_geojson,
      1 AS rank
    FROM building_footprints bf, point
    WHERE ST_DWithin(bf.geom::geography, point.pt::geography, 50)
    ORDER BY ST_Distance(bf.geom::geography, point.pt::geography)
    LIMIT 1
  )
  SELECT area_sqm, building_id, geom_geojson
  FROM (SELECT * FROM contained UNION ALL SELECT * FROM nearest) u
  ORDER BY rank
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_building_footprint_with_geom(double precision, double precision)
  TO anon, authenticated, service_role;
```

- [ ] **Step 3: Apply via Supabase dashboard SQL editor**

Paste the SQL above into the geospatial project's SQL editor. Run. Confirm "Success. No rows returned."

- [ ] **Step 4: Smoke-test the RPC**

In SQL editor, run with Hannah's home (8734 54th Ave E, Bradenton ≈ 27.4459, -82.4146):
```sql
SELECT * FROM public.find_building_footprint_with_geom(27.4459, -82.4146);
```
Expected: one row, `area_sqm` ~150-300, `geom_geojson` is a GeoJSON Polygon with `coordinates` array.

- [ ] **Step 5: Commit migration file**

```bash
git add migrations/geospatial/2026-05-01-find-building-footprint-with-geom.sql
git commit -m "migration(geospatial): add find_building_footprint_with_geom returning GeoJSON polygon"
```

---

### Task 2: `lib/footprints-api.ts` — return polygon

**Files:**
- Modify: `lib/footprints-api.ts`

- [ ] **Step 1: Read the current file**

Read all of `lib/footprints-api.ts` to confirm the current return shape (per Phase 1 audit: returns `{ areaSqft, source, buildingId? } | null`).

- [ ] **Step 2: Add a new exported function `getBuildingFootprintWithGeom`**

Add alongside the existing `getBuildingFootprintArea` (do not delete the existing one — Phase 1 callers still use it). Type:
```ts
export type FootprintWithGeom = {
  areaSqft: number;
  source: "ms_footprints";
  buildingId?: number;
  /** GeoJSON Polygon. SRID 4326. */
  polygon: {
    type: "Polygon";
    coordinates: number[][][]; // [[[lng,lat],[lng,lat],...]]
  } | null;
};

export async function getBuildingFootprintWithGeom(
  lat: number,
  lng: number,
): Promise<FootprintWithGeom | null> {
  const url = process.env.SUPABASE_GEOSPATIAL_URL;
  const key = process.env.SUPABASE_GEOSPATIAL_ANON_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key);
  const { data, error } = await client.rpc("find_building_footprint_with_geom", {
    p_lat: lat,
    p_lng: lng,
  });
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  const areaSqft = Math.round(row.area_sqm * 10.7639);
  const polygon = row.geom_geojson && row.geom_geojson.type === "Polygon"
    ? row.geom_geojson
    : null;

  return {
    areaSqft,
    source: "ms_footprints",
    buildingId: row.building_id,
    polygon,
  };
}
```

(Use the existing `createClient` import. If the file currently imports from `@supabase/supabase-js`, reuse that. If it constructs its own client elsewhere, follow that pattern.)

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: clean (no errors involving `lib/footprints-api.ts`).

- [ ] **Step 4: Commit**

```bash
git add lib/footprints-api.ts
git commit -m "feat(footprints): add getBuildingFootprintWithGeom returning polygon"
```

---

### Task 3: `lib/mapbox-static.ts` — build static URL with path overlay

**Files:**
- Create: `lib/mapbox-static.ts`

- [ ] **Step 1: Create the file**

```ts
const MAPBOX_BASE = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static";

export type StaticMapInput = {
  lat: number;
  lng: number;
  /** GeoJSON Polygon (SRID 4326). If null, a marker-only image is returned. */
  polygon: {
    type: "Polygon";
    coordinates: number[][][];
  } | null;
  /** Output dimensions in CSS pixels. @2x is added automatically. */
  width?: number;
  height?: number;
  /** Map zoom. 18-19 is "single-house" zoom. */
  zoom?: number;
};

/**
 * Build a Mapbox Static Images URL with the polygon stroked in orange and
 * lightly filled. Returns null if the Mapbox token isn't configured so callers
 * can degrade gracefully.
 */
export function buildRoofOverlayUrl(input: StaticMapInput): string | null {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;

  const width = input.width ?? 600;
  const height = input.height ?? 360;
  const zoom = input.zoom ?? 19;
  const overlays: string[] = [];

  if (input.polygon && input.polygon.coordinates.length > 0) {
    const ring = input.polygon.coordinates[0]; // outer ring; ignore holes for overlay
    const geojson = {
      type: "Feature" as const,
      properties: {
        stroke: "#1e3a8a",        // navy (Tailwind blue-900)
        "stroke-width": 3,
        "stroke-opacity": 1,
        fill: "#1e3a8a",
        "fill-opacity": 0.18,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [ring],
      },
    };
    overlays.push(`geojson(${encodeURIComponent(JSON.stringify(geojson))})`);
  }

  const overlayPart = overlays.length > 0 ? `${overlays.join(",")}/` : "";
  const center = `${input.lng},${input.lat},${zoom}`;
  const size = `${width}x${height}@2x`;
  // Keep `attribution` and `logo` enabled (Mapbox TOS requires them on free tier
  // unless attribution is shown elsewhere on the page).
  return `${MAPBOX_BASE}/${overlayPart}${center}/${size}?access_token=${token}`;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Smoke-test URL generation**

Create a one-off node script `/tmp/mapbox-smoke.mjs`:
```js
import { buildRoofOverlayUrl } from "../lib/mapbox-static.ts";
console.log(buildRoofOverlayUrl({
  lat: 27.4459, lng: -82.4146,
  polygon: { type: "Polygon", coordinates: [[[-82.4148,27.4458],[-82.4144,27.4458],[-82.4144,27.4460],[-82.4148,27.4460],[-82.4148,27.4458]]] },
}));
```
(Or just `console.log` from the API route the first time it runs.) Paste the URL into a browser. Expected: aerial of Bradenton with orange polygon outline.

- [ ] **Step 4: Commit**

```bash
git add lib/mapbox-static.ts
git commit -m "feat(mapbox): add buildRoofOverlayUrl for results-page polygon overlay"
```

---

### Task 4: `app/api/estimate/route.ts` — call footprint always, attach `roof_overlay` to response

**Files:**
- Modify: `app/api/estimate/route.ts`

This is two coordinated edits.

- [ ] **Step 1: Replace the Phase-1 footprint call site to use the with-geom version**

Find the existing call to `getBuildingFootprintArea(lat, lng)` (Phase 1, after `roofData = roofResult.data` ~line 234). Replace with `getBuildingFootprintWithGeom(lat, lng)`. Use its `areaSqft` for the synthesized `RoofData` exactly as before; capture the full result in a local `footprintResult` so the polygon survives.

```ts
// Near top of route handler, after geocode succeeds (lat/lng resolved):
let footprintResult: Awaited<ReturnType<typeof getBuildingFootprintWithGeom>> = null;
if (lat != null && lng != null) {
  footprintResult = await getBuildingFootprintWithGeom(lat, lng);
}

// At the existing Phase-1 fallback block:
if (roofData == null && footprintResult && !roofResult.invalid) {
  const PITCH_MULT = { flat: 1.02, low: 1.10, moderate: 1.20, steep: 1.35 } as const;
  const pitchFactor = PITCH_MULT[pitch_category as keyof typeof PITCH_MULT] ?? 1.20;
  const synthSqft = Math.round(footprintResult.areaSqft * pitchFactor);
  roofData = {
    roofAreaSqft: synthSqft,
    pitchDegrees: PITCH_CATEGORY_DEGREES[pitch_category] || 22,
    numSegments: 2,
    segments: [],
    source: "ms_footprints" as const,
  };
  confidence = "low";
}
```

- [ ] **Step 2: Build the overlay URL once, reuse for all response paths**

Above the success and error response builders, add:
```ts
import { buildRoofOverlayUrl } from "@/lib/mapbox-static";

// Where lat/lng are known and we've at least geocoded:
const roofOverlay = lat != null && lng != null
  ? {
      url: buildRoofOverlayUrl({
        lat,
        lng,
        polygon: footprintResult?.polygon ?? null,
      }),
      has_polygon: !!footprintResult?.polygon,
    }
  : null;
```

- [ ] **Step 3: Attach `roof_overlay` to the success response**

In the JSON success response object (existing `confidence`, `roof_data`, `pipeline` block), add:
```ts
roof_overlay: roofOverlay,
```

- [ ] **Step 4: Attach `roof_overlay` to error responses where lat/lng resolved**

Specifically, the `commercial_or_high_rise`, `measurement_unavailable`, and `pitch_conflict_recheck` paths — they have lat/lng. The polygon may still be null but the URL will return a useful aerial. Add `roof_overlay: roofOverlay` to those JSON bodies. (`address_unrecognized` and `setup_incomplete` have no coords — leave them.)

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 6: Local smoke test**

Run `npm run dev` (background). Then:
```bash
curl -s -X POST http://localhost:3000/api/estimate \
  -H "Content-Type: application/json" \
  -d '{"contractor_id":"c2a1286d-4faa-444a-b5b7-99f592359f80","address":"8734 54th Ave E, Bradenton, FL 34211","pitch_category":"moderate","current_material":"asphalt","shingle_layers":"not_sure"}' \
  | jq '.roof_overlay'
```
Expected: `{ "url": "https://api.mapbox.com/...", "has_polygon": true }`.

- [ ] **Step 7: Commit**

```bash
git add app/api/estimate/route.ts
git commit -m "feat(api/estimate): attach roof_overlay (Mapbox static URL + has_polygon) to responses"
```

---

### Task 5: `lib/error-copy.ts` — central error_code copy map

**Files:**
- Create: `lib/error-copy.ts`

- [ ] **Step 1: Create the file**

```ts
export type ErrorCode =
  | "setup_incomplete"
  | "commercial_or_high_rise"
  | "address_unrecognized"
  | "measurement_unavailable"
  | "pitch_conflict_recheck";

export type ErrorCopy = {
  /** Short headline (~6 words). */
  headline: string;
  /** Full explanation (1-3 sentences). May reference `{contractor}` for token replacement. */
  body: string;
  /** What the homeowner does next. */
  cta: "manual_quote" | "retry_address" | "retry_pitch" | "contact" | null;
};

const COPY: Record<ErrorCode, ErrorCopy> = {
  setup_incomplete: {
    headline: "Online estimates aren't available right now",
    body: "{contractor} hasn't finished setting up online pricing. Submit your details and they'll get back to you with a quote.",
    cta: "manual_quote",
  },
  commercial_or_high_rise: {
    headline: "This looks like a commercial property",
    body: "Our online tool is built for residential roofs. {contractor} handles commercial and high-rise jobs by phone — please reach out directly for a custom quote.",
    cta: "contact",
  },
  address_unrecognized: {
    headline: "We couldn't find that address",
    body: "Double-check the spelling, or try the cross-streets. If the home is brand-new construction, online maps may not have caught up — submit your details and {contractor} will follow up.",
    cta: "retry_address",
  },
  measurement_unavailable: {
    headline: "We couldn't measure this roof from satellite",
    body: "Trees, complex roof shapes, or older imagery can make automatic measurement unreliable. {contractor} will visit the property for an exact quote — typically within 1-2 business days.",
    cta: "manual_quote",
  },
  pitch_conflict_recheck: {
    headline: "The pitch you picked doesn't match what we see",
    body: "Our satellite measurement suggests a different roof pitch. Take a quick look at your house and try again — or submit and we'll confirm pitch on-site.",
    cta: "retry_pitch",
  },
};

export function getErrorCopy(code: string | undefined, contractorName: string): ErrorCopy {
  const known = code && code in COPY ? (code as ErrorCode) : null;
  if (known) {
    const c = COPY[known];
    return { ...c, body: c.body.replace("{contractor}", contractorName) };
  }
  // Unknown / future error_code → manual quote fallback.
  return {
    headline: "We hit an unexpected snag",
    body: `Submit your details and ${contractorName} will follow up with a quote.`,
    cta: "manual_quote",
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/error-copy.ts
git commit -m "feat(error-copy): centralized error_code → user copy map"
```

---

### Task 6: `components/estimate-widget-v4.tsx` — render overlay, low-confidence badge, error copy

**Files:**
- Modify: `components/estimate-widget-v4.tsx`

This task has the most surface area. Break into discrete sub-edits.

- [ ] **Step 1: Update the response type and error handling**

Find the existing `fetch("/api/estimate")` block (~line 430). Update the response type to include `roof_overlay`. Update error handling to read `error_code` (not the legacy `couldnt_measure_accurately` string check):

```ts
type EstimateResponse = {
  estimates?: Array<{...existing fields...}>;
  roof_data?: {...existing fields...};
  pipeline?: "solar" | "lidar" | null;
  confidence?: "high" | "low";
  roof_overlay?: { url: string | null; has_polygon: boolean } | null;
  // error path:
  error?: string;
  error_code?: string;
  measurement_status?: string;
};
```

Replace the existing line ~449 check:
```ts
// OLD (broken — Phase 1 renamed the code):
if (data.error_code === "couldnt_measure_accurately" && data.measurement_status === "needs_manual_quote") { ... }

// NEW:
if (data.error_code) {
  setErrorCode(data.error_code);
  setManualQuoteContext(data.error_code === "measurement_unavailable" ? "needs_manual_quote" : null);
  setRoofOverlay(data.roof_overlay ?? null);
  setStep(8); // unified results/error step
  return;
}
```

Add component state:
```ts
const [errorCode, setErrorCode] = useState<string | null>(null);
const [confidence, setConfidence] = useState<"high" | "low" | null>(null);
const [roofOverlay, setRoofOverlay] = useState<{ url: string | null; has_polygon: boolean } | null>(null);
const [manualQuoteContext, setManualQuoteContext] = useState<string | null>(null);
```

In the success branch, also do:
```ts
setConfidence(data.confidence ?? null);
setRoofOverlay(data.roof_overlay ?? null);
setErrorCode(null);
```

- [ ] **Step 2: Render the overlay image on step 8 (results screen)**

Find the success-state block (~line 1180). At the top of the results card, above the material tiles, add:

```tsx
{roofOverlay?.url && (
  <div style={{
    width: "100%", borderRadius: 12, overflow: "hidden",
    marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0a0a0a",
    aspectRatio: "5/3",
  }}>
    <img
      src={roofOverlay.url}
      alt="Aerial view of your home"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      loading="lazy"
    />
    {roofOverlay.has_polygon && (
      <div style={{
        marginTop: -28, padding: "4px 10px",
        background: "rgba(0,0,0,0.6)", color: "#fff",
        fontSize: 11, display: "inline-block",
        borderTopRightRadius: 6, position: "relative",
      }}>
        Measured area outlined in orange
      </div>
    )}
  </div>
)}
```

(Adjust the styling token references — `C.red` etc — to match this widget's existing color system. Use `variant === "light"` branching where the rest of the file does.)

- [ ] **Step 3: Render the low-confidence badge**

Just below the overlay (before the price tiles), add:
```tsx
{confidence === "low" && (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 10px", borderRadius: 999,
    background: "rgba(30,58,138,0.15)", color: "#1e3a8a",
    fontSize: 12, fontWeight: 500, marginBottom: 12,
  }}>
    <InfoIcon size={12} /> Approximate measurement — confirm on-site
  </div>
)}
```

- [ ] **Step 4: Replace the error/manual-quote branch with error_code-driven rendering**

Find the existing manual-quote screen (~line 1162). Replace with a unified error-state renderer that reads from `lib/error-copy.ts`:

```tsx
import { getErrorCopy } from "@/lib/error-copy";

// In the step-8 render branch, before the success path:
{errorCode && (() => {
  const copy = getErrorCopy(errorCode, contractorName);
  return (
    <div>
      {/* Show overlay even on error if we have it (commercial / measurement_unavailable / pitch_conflict) */}
      {roofOverlay?.url && (
        <img src={roofOverlay.url} alt="Aerial view" style={{...}} />
      )}
      <h2>{copy.headline}</h2>
      <p>{copy.body}</p>
      {copy.cta === "manual_quote" && (
        <ManualQuoteConfirmation contractorName={contractorName} />
      )}
      {copy.cta === "retry_address" && (
        <button onClick={() => setStep(2)}>Try a different address</button>
      )}
      {copy.cta === "retry_pitch" && (
        <button onClick={() => setStep(3)}>Re-check pitch</button>
      )}
      {copy.cta === "contact" && (
        <a href={`tel:${contractorPhone}`}>Call {contractorName}</a>
      )}
    </div>
  );
})()}
```

(Extract the existing manual-quote block into a small `ManualQuoteConfirmation` sub-component within the same file to keep this DRY.)

- [ ] **Step 5: Generic-error fallback (when fetch itself fails, e.g. network)**

The existing `error` state (red box at line 643) is for pre-step-8 transient errors (network, timeout). Keep it. The step-8 error rendering above handles structured `error_code` responses from the API.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 7: Visual smoke test in browser**

Per RuufPro CLAUDE.md "Showing Preview Links":
```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```
Wait for compile. Then visit `http://localhost:3000/widget/c2a1286d-4faa-444a-b5b7-99f592359f80` (or any contractor site with a calculator) and walk through each:
1. Hannah's home `8734 54th Ave E, Bradenton, FL 34211` → success with overlay + polygon
2. `1450 Brickell Bay Dr, Miami, FL 33131` → `commercial_or_high_rise` error copy + aerial (no polygon)
3. `nonsense address xyz` → `address_unrecognized` error copy, no aerial
4. Force a `confidence: "low"` response (use 11506 Old Mission Dr or a footprint-fallback address) → low-confidence badge visible

Take screenshots of each state. Save to `.tmp/phase-2-step-1-screenshots/`.

- [ ] **Step 8: Commit**

```bash
git add components/estimate-widget-v4.tsx
git commit -m "feat(widget): render polygon overlay, low-confidence badge, error_code-driven copy"
```

---

### Task 7: Env vars + docs

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add MAPBOX_TOKEN to `.env.example`**

```
# Mapbox Static Images API (server-side only — DO NOT prefix with NEXT_PUBLIC_)
# Token scopes: styles:tiles, styles:read, fonts:read
# Restrict by URL referrer to *.ruufpro.com,localhost:*
MAPBOX_TOKEN=
```

- [ ] **Step 2: Set env var in Vercel**

Hannah does this manually via Vercel dashboard (or `vercel env add MAPBOX_TOKEN production`). Confirm it's set before deploying.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs(env): document MAPBOX_TOKEN for results-page polygon overlay"
```

---

### Task 8: End-to-end verification

- [ ] **Step 1: Re-run the 11-address test from Phase 1 (post-deploy)**

Use the curl block from `decisions/2026-05-01-phase-1-shippable-calculator.md` lines 158-177. For each, verify:
- 200 responses include `roof_overlay.url` (non-null) — paste 2-3 URLs into a browser to confirm the polygon appears
- `commercial_or_high_rise` errors include `roof_overlay.url` (no polygon, but aerial is useful)
- `address_unrecognized` errors have `roof_overlay: null` (no coords resolved)

- [ ] **Step 2: Acceptance check**

| Criterion | Pass when |
|---|---|
| Polygon visible on Hannah's home | `8734 54th Ave E` results page shows orange polygon outlining the building |
| Polygon visible on Old Mission Dr (footprint-fallback) | Same — proves the overlay works for footprint-only path |
| Commercial address gets correct copy | `1450 Brickell Bay Dr` shows "This looks like a commercial property" headline |
| Manual-quote branch revived | `error_code: measurement_unavailable` triggers manual-quote screen (was broken pre-Phase-2) |
| Low-confidence badge | At least one address shows `confidence: "low"` with the amber pill rendered |
| No client-side Mapbox token | `view-source:` on the widget page does not contain the Mapbox token |

- [ ] **Step 3: Show diffs to Hannah before pushing to main**

Per Phase 1 convention: Hannah reviews diffs and screenshots before push.

---

## Resolved decisions (2026-05-01, Hannah)

1. **Always show overlay** on every successful estimate AND on errors with resolved coords (`commercial_or_high_rise`, `measurement_unavailable`, `pitch_conflict_recheck`). Roofr trust-signal model.
2. **Polygon color: professional navy `#1e3a8a`** (Tailwind blue-900). Same color across all 5 themes.
3. **Mapbox account does not exist yet** → see Task 0 below (added).
4. **Pitch step = step 3.** Confirmed from `components/estimate-widget-v4.tsx:825`.

---

## Task 0: Mapbox account setup (BLOCKER — do first)

**Owner:** Hannah (manual). Cannot be automated.

- [ ] **Step 1: Sign up at [mapbox.com](https://mapbox.com)** with the RuufPro ops email. Free tier is fine — Static Images API allows 50,000 requests/month at $0, ~50,000× our current volume.

- [ ] **Step 2: Create an access token** under Account → Tokens → Create token. Name it `ruufpro-prod-static`. Required scopes:
  - `styles:tiles` ✓
  - `styles:read` ✓
  - `fonts:read` ✓
  - All other scopes: leave unchecked.

- [ ] **Step 3: Restrict the token by URL.** In the token settings, add allowed URLs: `*.ruufpro.com/*`, `localhost:*`, `*.vercel.app/*` (so preview deployments work).

- [ ] **Step 4: Add to Vercel env vars** as `MAPBOX_TOKEN` (NOT `NEXT_PUBLIC_MAPBOX_TOKEN` — server-side only). Set on Production, Preview, and Development environments. Either via dashboard or:
  ```bash
  vercel env add MAPBOX_TOKEN production
  vercel env add MAPBOX_TOKEN preview
  vercel env add MAPBOX_TOKEN development
  ```

- [ ] **Step 5: Verify locally.** Pull env: `vercel env pull .env.local`. Confirm `MAPBOX_TOKEN=pk....` appears in `.env.local`.

## Out of scope (explicitly deferred)

- Showing per-segment polygons from Solar (would need Solar's `boundingBox` corners, lower fidelity than building outline — skip)
- Editable polygon (explicitly excluded by Hannah)
- `outside_service_area` error code (Phase 2 step 2)
- Lead deduplication (Phase 2 step 3)
- `alphaAreaSqft` from Modal LiDAR (Phase 2 step 4)

---

## Source-of-truth references

- Phase 1 plan: `decisions/2026-05-01-phase-1-shippable-calculator.md`
- Widget: `components/estimate-widget-v4.tsx` (1399 lines, single source of truth across all 5 themes)
- Theme wrappers (no changes needed): `components/contractor-sections/{blueprint,classic,chalkboard,forge}/estimate-section.tsx`
- API route: `app/api/estimate/route.ts`
- Footprints lib: `lib/footprints-api.ts`
- Geospatial Supabase: project `vfmnjwpjxamtbuehmtrv`, table `building_footprints`, geom column `geom` (NOT `geometry`), GIST index required
- Mapbox Static Images API docs: `https://docs.mapbox.com/api/maps/static-images/`
