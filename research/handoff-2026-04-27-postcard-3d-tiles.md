# Postcard 3D — Handoff for next session

**Date:** 2026-04-27
**Branch:** `feature/postcard-3d` (off `feature/direct-mail-nfc` @ `df473f2`)
**Worktree:** `/Users/hannahwaldo/RoofReady-postcard-3d/` (separate dir; main repo `~/RoofReady` left untouched for parallel onboarding session)
**Status:** Spike + 2 saved prototypes + 2 abandoned approaches. NOT deployed. NOT pushed.

---

## TL;DR for next session

We were chasing "homeowner scans postcard QR → sees a 3D model of THEIR house, can rotate it" as a postcard-funnel wow moment. After two failed accuracy approaches, we landed on **Google Photorealistic 3D Tiles** as the winning path — verified working on Hannah's actual Bradenton home. We also have a non-3D alternative (satellite + overlay markers) that ships faster if scope tightens.

**The decision Hannah made at session end:** keep both prototypes saved, build production on top of the **3D Tiles** approach.

**The single most important read on next session:** spin up the dev server, open the two preview URLs below, eyeball them, then decide between (A) full production wire-up of 3D Tiles or (B) tighten + multi-address spot-check first.

---

## What lives where

### Prototypes (KEEP)

| Route | What it is | Status |
|---|---|---|
| `/postcard-3d-tiles-test` | Real Google Photorealistic 3D Tiles render of `8734 54th Ave E, Bradenton, FL`. Auto-orbits, drag-rotate, scroll-zoom. Hardcoded address. | ✅ Working — Hannah loved it |
| `/postcard-overlay-mockup` | Non-3D alternative: Google Static Maps satellite + tappable pins (roof age / permit / FEMA / storms) + property facts grid + replacement-window callout + contractor CTA card. Two presets (Bradenton, Sarasota). | ✅ Mockup-quality |

### Abandoned approaches (still in branch — feel free to delete)

| Route / file | What it was | Why we killed it |
|---|---|---|
| `/postcard-preview` + `lib/roof-3d-from-footprint.ts` | Procedural roof from MS Building Footprint OBB | OBB approach can't capture L-shape / complex hip / multiple ridges. Result: rectangular tent on every roof. |
| `/api/postcard/roof-trace` + `lib/roof-3d-from-trace.ts` | Claude Sonnet 4.5 vision tool-call traces ridges/planes from satellite, converts to RoofScene | Vision identifies roof type + ridge polylines well, but its plane decomposition is wrong (mis-labels eave corners as ridges, omits peaks from plane vertex lists). Hand-fix heuristics produced shapes that still didn't look like the real roof. ~$0.025/scan. |
| `/api/postcard/roof-scene` | Debug endpoint that runs trace → buildRoofSceneFromTrace and returns scene JSON | Diagnostic only — fine to delete |

**Lesson learned:** building accurate procedural 3D from a top-down 2D image is genuinely hard. Vision is great at classification (roof type, color, "complex hip with solar panels") but cannot give you reliable plane geometry. Don't try this approach again.

---

## How to resume

### 1. Start the dev server in the worktree

```bash
cd /Users/hannahwaldo/RoofReady-postcard-3d
PORT=3939 npm run dev
```

Use port 3939, not 3000 — main repo at `~/RoofReady` may have its own dev server.

### 2. Open the two saved prototypes

- http://localhost:3939/postcard-3d-tiles-test  ← the winning approach
- http://localhost:3939/postcard-overlay-mockup  ← the satellite-overlay alternative

The 3D tiles render takes ~5-10s on first load (tiles streaming). Auto-orbits. Drag to take control.

### 3. Critical: verify the parallel onboarding session is still running clean

The other session was working on Riley's website-scraper for onboarding training. Before doing anything, check:

```bash
cd ~/RoofReady && git branch --show-current && git status --short | head
```

If still on `feature/onboarding-rebuild` with the scraper-related dirty files, **DO NOT TOUCH** that working tree. All postcard-3d work happens in `/Users/hannahwaldo/RoofReady-postcard-3d/` only.

---

## The architecture decision (already made)

**Postcard QR landing will use Google Photorealistic 3D Tiles directly as the rendering substrate.** No procedural reconstruction. No Vision tracing. The photoreal mesh from Google IS the 3D model.

### Why this works
- Real photogrammetry of the actual house — no "approximation" risk
- Coverage verified for Bradenton/Sarasota city
- ~$24-30/month at 5,000 scans (session-based billing, first 1k free)
- Drops into our existing Three.js stack via `3d-tiles-renderer` (NASA-AMMOS)
- Same rotate/zoom/pan UX as the existing `/roof-3d-preview` viewer

### Why we don't need to "trace" anything
The original plan was: trace roof from satellite → build procedural 3D model. That whole pipeline is unnecessary. Google's tile mesh already contains the building. We just render it.

---

## Production build plan (~1-2 days eng)

### Phase 1 — Polish the viewer (4 hrs)

1. **Tighten initial camera** — currently shows the full neighborhood. Should focus tight on the target address, ~80-150m back, ~50-100m up, angled like a real-estate listing photo. File: `app/postcard-3d-tiles-test/page.tsx` lines 96-104. Adjust `camera.position.set(...)` and `controls.minDistance/maxDistance`.

2. **Add Google attribution badge** (REQUIRED by ToS) — small "Imagery © 2026 Google" text in bottom-left of canvas, 16dp min size. Cannot be hidden. See [Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies).

3. **Loading state** — currently shows "loading…" text. Add a skeleton or spinner during initial tile stream (~3-5s).

4. **Fade-in on first tile** — current jarring pop-in when tiles arrive. Use the `tiles-load-end` event to fade alpha 0→1.

5. **Mobile gesture polish** — test pinch-zoom on phones. OrbitControls handles touch but check feel.

### Phase 2 — Address-driven dynamic loading (3 hrs)

Currently the test page hardcodes Bradenton coords. Production needs:

1. **Geocoding endpoint** — already wired the call once via curl in this session. Build `/api/postcard/geocode?address=...` that hits Google Geocoding API with the same key, returns `{ lat, lng, formatted }`. Cache results in `property_pipeline_candidates` so we don't pay $5/1k for every scan.

2. **Address from URL param** — `/postcard/[token]/page.tsx` resolves token → `property_pipeline_candidates` row → already-geocoded lat/lng → renders viewer. The token is the QR-encoded payload (already in the PP step 4 implementation per memory `project_pp_step_6_progress.md`).

### Phase 3 — Building isolation (1-2 days, OPTIONAL)

The current view shows the whole neighborhood. Hannah originally wanted "isolated mesh on neutral background" like the existing `/roof-3d-preview`. The research agent flagged this as **YELLOW LIGHT, ~1-2 days**:

- Use `ImageOverlayPlugin` from `3d-tiles-renderer` v0.4.19+ with the MS Building Footprint polygon as an alpha mask
- Set `scene.background = new THREE.Color('#f4ede1')` (already done in current page)
- Edge artifacts (clipped neighbor walls, ground bleed under eaves) are documented; plan extra time to tune

**Hannah's take at session end:** "open question — full neighborhood may be the wow as-is."

**My recommendation:** Ship Phase 1+2 unmasked first. Real users will tell us if the neighborhood context is a feature or a bug. Then decide whether to invest in masking.

### Phase 4 — Coverage gate (1 hr)

Not every Manatee address will have crisp 3D coverage. Outlying areas (Parrish, Myakka City) may be low-LOD blobs. Before any postcard send:

1. Build a simple coverage check: hit Google's root tileset for the bbox around lat/lng, check if returned tiles contain mesh content vs flat imagery
2. If coverage is poor, fall back to the **`/postcard-overlay-mockup`** experience for that property
3. Log coverage status on each `property_pipeline_candidates` row

---

## What's wired up vs not

### ✅ Working
- Google Static Maps satellite proxy at `/api/postcard/satellite?address=...`
- Google Photorealistic 3D Tiles render with `3d-tiles-renderer`
- Y-up coordinate fix (ENU frame inverse + X-axis rotation)
- Auto-orbit + drag-rotate + scroll-zoom
- Map Tiles API enabled on Google Cloud project `652886710568`

### ⚠️ Half-wired
- `components/widget/roof-render-3d.tsx` was modified to auto-fit camera to scene bounds. This was for the abandoned procedural approach. It still works for the original `/roof-3d-preview` route (stub data) but the change is technically scope creep on this branch — fine to keep, harmless.

### ❌ Not done
- `/postcard/[token]` real route (token resolution, lat/lng from DB)
- Geocoding endpoint
- Coverage check
- Google attribution badge (REQUIRED before any prod deploy)
- Mobile testing
- Production environment variables (NEXT_PUBLIC_GOOGLE_MAPS_KEY needs Map Tiles API enabled — already done on dev key)

---

## Critical context to preserve

### Google Cloud project state (changed in this session)
- **Map Tiles API was newly enabled** on project `652886710568` (the existing GOOGLE_API_KEY project). This applies to both dev and prod keys since they're the same key. Pricing: free first 1k sessions/mo, then ~$6 CPM. Estimated $24-30/mo at 5k scans.
- API key has **no application restrictions** (Hannah confirmed mid-session). HTTP referrer restrictions are NOT set. If prod ever needs locking down, add `*.ruufpro.com/*` and `http://localhost:*/*`.
- We hit a brief 403 propagation lag when the API was first enabled — tiles 403'd for ~30s after enable. Resolved automatically.

### ToS gotchas (from research agent)
- **Mandatory Google attribution** must be visible in viewer (16dp logo). Cannot be hidden.
- **No caching of tile bytes** — must hit Google live each scan. Don't try to pre-bake.
- **No ML/object-detection on tile imagery** — don't feed rendered scenes back into Vision.
- Promo videos screen-recording the experience: <30s allowed.

### Why parallel session safety mattered
Hannah was running another session building Riley's website scraper on `feature/onboarding-rebuild`. We worked entirely in a **separate git worktree** at `/Users/hannahwaldo/RoofReady-postcard-3d/` so the other session's dirty files were never touched. Continue this discipline if both sessions are ever active again.

---

## File inventory (what's in this branch)

```
app/api/postcard/
├── satellite/route.ts             # Google Static Maps proxy
├── roof-trace/route.ts            # ABANDONED — Vision ridge tracing
└── roof-scene/route.ts            # ABANDONED — debug endpoint

app/postcard-3d-tiles-test/
└── page.tsx                       # ⭐ THE WINNING APPROACH

app/postcard-overlay-mockup/
└── page.tsx                       # ⭐ Non-3D alternative

app/postcard-preview/
└── page.tsx                       # ABANDONED — procedural + Vision approaches

lib/
├── roof-3d-from-footprint.ts      # ABANDONED — OBB procedural
├── roof-3d-from-trace.ts          # ABANDONED — Vision-trace converter
└── roof-3d-stub-data.ts           # carried over from existing /roof-3d-preview

research/
├── handoff-2026-04-27-postcard-3d-tiles.md   # this file

components/widget/roof-render-3d.tsx           # modified: auto-fit camera

package.json / package-lock.json               # added: three, @react-three/fiber,
                                                #        @react-three/drei,
                                                #        @types/three,
                                                #        3d-tiles-renderer
```

---

## Quick decision matrix for next session

| If Hannah says... | Do this |
|---|---|
| "Let's ship it" | Phase 1 + Phase 2 (camera tighten, attribution, geocoding endpoint, /postcard/[token] route). ~6-8 hrs. NOT masked. |
| "Show me 5 more addresses first" | Add address picker to `/postcard-3d-tiles-test` page, run through Palmetto / Sarasota / Parrish samples, screenshot each, decide if coverage holds. |
| "I want it isolated like last week's viewer" | Phase 3 (`ImageOverlayPlugin` masking with MS Building Footprint stencil). Yellow light, plan for edge artifacts. ~1-2 days. |
| "Use the overlay mockup instead" | Pivot — promote `/postcard-overlay-mockup` to production at `/postcard/[token]`, drop the 3D path. Ships in half a day. |
| "Combine both" | Production page shows the satellite-overlay by default + a "see in 3D" toggle that swaps in the Tiles viewer. Best of both, ~2 days. |

---

## What I'd recommend on day 1 of next session

1. Open both prototype URLs, eyeball them on a real laptop and a real phone
2. Decide: 3D Tiles primary, overlay primary, or hybrid
3. If 3D Tiles primary → start Phase 1 polish, get the camera tight on Hannah's house, add Google attribution
4. If hybrid → wireframe the toggle UX first, then build
5. Either way → finish Phase 2 (geocoding + token route) before any deploy
6. Coverage spot-check against 5+ Manatee addresses before mailing real postcards
7. Deploy to a Vercel preview, never to prod, until Hannah eyeballs the production wire-up

**Never:**
- Trace satellite imagery again (dead end)
- Try to "isolate" the building procedurally without using `ImageOverlayPlugin` (will fight WebGL forever)
- Push to main or deploy without explicit Hannah OK — per `feedback_always_ask_deploy_after_commit.md`
