# 3D Roof Render — One-Pager Spec

**Status:** Backlog — post-Gate-2, post-first-paying-customer
**Owner:** Hannah
**Drafted:** 2026-04-24
**Type:** Widget feature + marketing asset

---

## Why

- Calculator's biggest credibility gap = "is this number real?" A 3D render of the measured roof is direct visual proof we're not guessing.
- Differentiator on the widget — Roofle/Roofr show a number, no picture. We'd show the segmented roof with ridges/hips/valleys highlighted, tied to the line items.
- Doubles as marketing asset: demo page hero, cold-email GIFs, FB-group video, sales decks.
- Conversion lever on the widget: "wait, see your roof" = scroll-stop + dwell time + price feels earned.
- Reuses Pipeline A output we already compute + store. Zero new vendor dependency.

## What it shows

- Roof footprint extruded from MS Footprint polygon
- Per-plane mesh from Pipeline A RANSAC output (8–15 planes typical)
- Ridges (red), hips (orange), valleys (blue) overlaid as 3D polylines
- Total sqft + per-plane sqft on hover/tap
- Camera orbits on load, then user can drag/zoom
- Optional: drape Google Solar RGB GeoTIFF as texture so it doesn't look CAD-clean

## Tech stack

- **react-three-fiber** + **drei** (orbit controls, environment, helpers)
- **three.js** geometry from Pipeline A `planes[]` (already has normal + inlier polygon per plane)
- **MapLibre / deck.gl** optional for satellite basemap underneath
- New Pipeline A output: per-plane vertex array (currently we throw away the boundary; need to keep convex hull of inliers)
- Storage: cache rendered scene JSON in `measurement_runs.scene_json` (≤50KB per row)

## Build phases

**Phase 1 — MVP (3–5 days)**
- New endpoint `/api/render/[measurementRunId]` returns scene JSON
- Pipeline A change: emit per-plane boundary polygon (convex hull of inliers, ~20 LOC in `lidar-tier3-geometry.py`)
- React component `<RoofRender3D>` in `components/widget/` — renders scene, orbit controls, basic lighting
- Wire into widget after price reveals (collapsed by default, "See your roof in 3D" button)
- Wire into demo page

**Phase 2 — Polish (3–5 days)**
- Ridge/hip/valley overlay polylines with color legend
- Per-plane hover state + sqft tooltip
- Camera intro animation (auto-orbit on load, settle, then user-controlled)
- Solar GeoTIFF texture drape (only when Solar quality = HIGH)
- Mobile touch gesture tuning

**Phase 3 — Marketing reuse (2–3 days)**
- Headless render service (puppeteer + r3f) → MP4 export for cold email
- Static hero render on `/site/[slug]` demo pages
- Comparison shot: "your roof on Roofle" (just sqft) vs "your roof on RuufPro" (full 3D)

## Risks

- Pipeline A coverage: today ~70–80% of FL addresses get LiDAR. Other 20–30% fall back to Solar. Spec a Solar-only render path (DSM heightmap, less crisp) so we never show "no render available."
- Mobile perf: r3f is fine on modern phones but test on iPhone SE / older Androids. Hard cap geometry at ~5k tris.
- Pipeline A re-open: needs new output field. Frozen-hash discipline applies — this is its own scoping doc when it's time.

## Ship gates

- Renders ≥95% of `lidar_outcome=ok` rows without manual fixup
- First paint ≤2s on widget cold load
- Mobile orbit/zoom stable on iOS Safari + Android Chrome
- 5 FL roofers see it on a real address and say it looks right (ties into Track E)

## Out of scope (initial ship)

- Indoor / interior modeling
- User edit/annotation on the render
- Material picker tied to the render (later: shingle color preview)
- Photogrammetry from drone footage (different product entirely)

## Cost

- $0 net new vendor cost (Pipeline A + Solar already running)
- Build: ~2 weeks one engineer, ~1 week if focused
- Maintenance: low — pure frontend, geometry pipeline already in scope

## When to start

After: Gate-2 GREEN + first paying contractor live.
Reason: this is a conversion-lift feature, but conversion lift on a broken calculator = nothing. Fix the number first, then make it look impressive.
