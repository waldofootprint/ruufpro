# Handoff — county-level storm stats for the PP QR landing page

**Created:** 2026-04-29
**Use this when:** building the QR-code landing page that homeowners hit after scanning the postcard. The same numbers shown on the dashboard approval queue need to appear here, with citations.

---

## TL;DR

Real NOAA + FEMA county-level storm stats are already wired and ready to use. One source of truth, no live API calls at runtime, every number is reproducible from the fetcher script.

```ts
import { getCountyStormStats } from "@/lib/property-pipeline/storm-stats";

const stats = getCountyStormStats("manatee", yearBuilt);
// stats.majorHurricanesSinceBuild           → number
// stats.closestMajorSinceBuild              → { name, year, milesAtClosest, ... } | null
// stats.mostRecentMajor                     → { name, year, peakLifetimeCategory } | null
// stats.peakStormCenterWindMph              → number | null  (sustained at storm center, NOT observed at property)
// stats.peakStormCenterStorm                → { name, year } | null
// stats.federalDisastersSinceBuild          → number
// stats.hurdat2LastYearCovered              → number  (last year of HURDAT2 data we have)
// stats.sources                             → [{ name, url }]  ← cite these on the landing page
```

---

## Files

| File | What it does |
|------|--------------|
| `data/county-storm-stats/manatee-fl.json` | Static JSON output. Ships in the bundle. |
| `lib/property-pipeline/storm-stats.ts` | Reader. Takes county + year_built, returns the per-home view. Used by dashboard tab AND landing page. |
| `tools/fetch-county-storm-stats.mjs` | Fetcher. Run quarterly or after a major-storm landfall. |

---

## Sources (free, no API key, official)

1. **NOAA HURDAT2** — Atlantic hurricane best-track database, 1851→present.
   - Index: https://www.nhc.noaa.gov/data/hurdat/
   - Current file used: `hurdat2-1851-2024-040425.txt` (auto-detected — fetcher always picks newest)
2. **FEMA OpenFEMA Disaster Declarations Summaries v2**
   - https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries
   - Filter: `state eq 'FL' and fipsCountyCode eq '081' and incidentType eq 'Hurricane'`

`stats.sources` returns these URLs ready to dump into a "Sources" footnote on the landing page.

---

## Methodology (how the numbers are computed — keep this near the landing page copy)

- **Major hurricane** = HURDAT2 Cat 3+ (peak lifetime, Saffir-Simpson) **AND** track passed within **100 mi of the county centroid**.
- **Closest approach** = the smallest haversine distance between the storm's track points and the county centroid.
- **Peak wind at storm center** = HURDAT2's recorded max sustained 1-min wind at the storm's center when it was nearest to us. This is **not** the wind observed at any specific property. The landing page must label it that way to stay defensible.
- **FEMA federal disasters** = unique disaster numbers from OpenFEMA matching the county FIPS + `incidentType=Hurricane`. Multiple declarations per disaster (DR/EM/FM) are deduped.

For Manatee centroid (27.4783, -82.3452), 100 mi radius, since 2003:
7 majors · closest = Milton 2024 (16.5 mi) · 4 FEMA hurricane declarations.

---

## Refreshing the data

```bash
node tools/fetch-county-storm-stats.mjs --county=manatee
```

Re-run when:
- A new hurricane impacts Manatee
- NOAA publishes the next HURDAT2 release (typically each spring)
- We expand to a new county — add a row in `COUNTIES` inside the fetcher script

---

## Adding a new county

Open `tools/fetch-county-storm-stats.mjs`, add to `COUNTIES`:

```js
sarasota: {
  state: "FL",
  fipsState: "12",
  fipsCounty: "115",
  centroidLat: 27.0,
  centroidLng: -82.4,
  displayName: "Sarasota County, FL",
},
```

Then run `node tools/fetch-county-storm-stats.mjs --county=sarasota` and add the import in `storm-stats.ts`.

---

## What this is NOT (for landing page copy carefully)

- Not per-property wind. The peak-wind number is the storm's center intensity at closest approach. Real property-level wind requires a radial decay model (Tier 2 — not built).
- Not a complete catalog of every storm. Filtered to Cat 3+ (peak lifetime) within 100 mi.
- Not real-time. Static JSON, refresh = manual.

---

## Where this is already used

- `components/dashboard/property-pipeline-tab.tsx` — hero card "Major Hurricanes" + "Closest Approach" + "FEMA Declarations" cells.

## Where this still needs to be used

- `/m/[code]/page.tsx` (or wherever the QR landing page ends up) — same `getCountyStormStats(county, yearBuilt)` call, render with citations from `stats.sources`.
