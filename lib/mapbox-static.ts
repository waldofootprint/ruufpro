import type { FootprintPolygon } from "./footprints-api";

const MAPBOX_BASE = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static";

export type StaticMapInput = {
  lat: number;
  lng: number;
  /** GeoJSON Polygon (SRID 4326). If null, an unmarked centered aerial is returned. */
  polygon: FootprintPolygon | null;
  /** Output dimensions in CSS pixels. @2x is added automatically. */
  width?: number;
  height?: number;
  /** Map zoom. 18-19 is "single-house" zoom. */
  zoom?: number;
};

/**
 * Build a Mapbox Static Images URL with the polygon stroked in navy and
 * lightly filled. Returns null if MAPBOX_TOKEN isn't configured so callers
 * can degrade gracefully (no overlay, but the rest of the response still
 * works).
 *
 * Mapbox attribution and logo are kept enabled (TOS requires them on free
 * tier unless attribution is shown elsewhere on the page).
 */
export function buildRoofOverlayUrl(input: StaticMapInput): string | null {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;

  const width = input.width ?? 600;
  const height = input.height ?? 360;
  const zoom = input.zoom ?? 19;
  const overlays: string[] = [];

  if (input.polygon && input.polygon.coordinates.length > 0) {
    // Outer ring only; ignore holes for the overlay (residential building
    // footprints in the MS dataset don't typically have holes anyway).
    // Round coordinates to 6 decimals (~11cm precision at FL latitudes,
    // well below 1 satellite pixel at z19). PostGIS emits 14+ decimals
    // by default; trimming keeps the URL well under Mapbox's 8KB limit
    // on dense polygons.
    const ring = input.polygon.coordinates[0].map(([lng, lat]) => [
      Math.round(lng * 1e6) / 1e6,
      Math.round(lat * 1e6) / 1e6,
    ]);
    const geojson = {
      type: "Feature" as const,
      properties: {
        stroke: "#1e3a8a",         // navy (Tailwind blue-900)
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
  // Center on the polygon centroid when a polygon is present, not on the
  // request lat/lng. The widget passes Google Places-derived coords, which
  // are typically the parcel/driveway centroid; on larger lots that point
  // can be 50m+ from the actual structure, putting the polygon off-frame at
  // zoom 19 (single-house). Centroid-based centering keeps the building
  // (and its outline) framed regardless of how far the input point drifts.
  const centerLngLat =
    input.polygon && input.polygon.coordinates.length > 0
      ? polygonCenter(input.polygon.coordinates[0])
      : [input.lng, input.lat];
  const center = `${centerLngLat[0]},${centerLngLat[1]},${zoom}`;
  const size = `${width}x${height}@2x`;
  // The returned URL contains `?access_token=${token}` and is meant for
  // <img src> rendering, where the token is visible in the page HTML. This is
  // acceptable IF the token is URL-restricted (*.ruufpro.com etc.) and scoped
  // to styles:tiles only. Do NOT log this URL to systems that retain full URLs
  // with query strings (Sentry breadcrumbs, request loggers, analytics) —
  // strip the access_token query param before logging.
  return `${MAPBOX_BASE}/${overlayPart}${center}/${size}?access_token=${token}`;
}

function polygonCenter(ring: number[][]): [number, number] {
  // Arithmetic mean of the outer-ring vertices. For the ~3000 sqft residential
  // footprints we deal with, this is within ~1m of the geometric (area-weighted)
  // centroid — well below a satellite pixel at zoom 19, and far cheaper to
  // compute than the signed-area formula.
  // GeoJSON closed rings repeat the first vertex at the end; skip the duplicate.
  const len =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.length - 1
      : ring.length;
  let lng = 0;
  let lat = 0;
  for (let i = 0; i < len; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lng / len, lat / len];
}
