/**
 * FEMA NFHL flood-zone point lookup.
 *
 * Hits the public FEMA hazards.fema.gov ArcGIS REST endpoint for the
 * S_FLD_HAZ_AR layer (flood hazard areas). Returns the FEMA flood zone code
 * at a (lat,lng) — common values: "X" (minimal/none), "AE", "AH", "AO", "VE".
 *
 * No API key. Free public endpoint. Caches results in-process for the
 * duration of the server runtime (lat,lng rounded to 4 decimals = ~11m).
 *
 * If the endpoint times out / errors, returns null. Caller decides fallback.
 */

const ENDPOINT =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";

const cache = new Map<string, { zone: string | null; at: number }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function getFemaFloodZone(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.zone;

  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY",
    returnGeometry: "false",
    f: "json",
  });

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      console.error("[fema] non-OK response", res.status);
      cache.set(key, { zone: null, at: Date.now() });
      return null;
    }
    const json = (await res.json()) as {
      features?: Array<{ attributes?: { FLD_ZONE?: string } }>;
    };
    const zone = json.features?.[0]?.attributes?.FLD_ZONE ?? null;
    cache.set(key, { zone, at: Date.now() });
    return zone;
  } catch (err) {
    console.error("[fema] lookup failed", err);
    cache.set(key, { zone: null, at: Date.now() });
    return null;
  }
}
