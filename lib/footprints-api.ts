// Microsoft Building Footprints lookup against the geospatial Supabase
// project. Used by /api/estimate as a Footprints-direct fallback when
// Google Solar returns null for an address (no building insights available).
//
// The MS dataset covers FL with ~2018-2019 vintage imagery — older than
// Solar but still enough to bracket a roof area when nothing else works.
// Caller multiplies by a pitch-derived factor to get a synthesized roof
// area, then runs the same calculateEstimate path as a Solar-backed roof
// (with confidence flagged "low" so the homeowner sees the wider band).
//
// Geospatial project schema (supabase/079_building_footprints.sql):
//   building_footprints(id bigserial pk, geom geometry(Polygon, 4326), …)
// RPC (supabase/097_find_building_footprint_area.sql):
//   find_building_footprint_area(lat, lng) → (area_sqm, building_id)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SQFT_PER_SQM = 10.764;

let cachedClient: SupabaseClient | null = null;

function getGeospatialClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_GEOSPATIAL_URL;
  const key = process.env.SUPABASE_GEOSPATIAL_ANON_KEY;
  if (!url || !key) return null;
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

export interface FootprintAreaResult {
  areaSqft: number;
  source: "ms_footprints";
  buildingId?: number;
}

export async function getBuildingFootprintArea(
  lat: number,
  lng: number
): Promise<FootprintAreaResult | null> {
  const supabase = getGeospatialClient();
  if (!supabase) {
    console.warn(
      "[footprints-api] missing SUPABASE_GEOSPATIAL_URL or _ANON_KEY"
    );
    return null;
  }

  const t0 = Date.now();
  const { data, error } = await supabase.rpc("find_building_footprint_area", {
    p_lat: lat,
    p_lng: lng,
  });

  if (error) {
    console.warn(
      `[footprints-api] rpc error after ${Date.now() - t0}ms:`,
      error.message
    );
    return null;
  }

  const rows = data as Array<{ area_sqm?: number; building_id?: number }> | null;
  const row = rows && rows.length > 0 ? rows[0] : null;
  if (!row || typeof row.area_sqm !== "number" || row.area_sqm <= 0) {
    return null;
  }

  return {
    areaSqft: Math.round(row.area_sqm * SQFT_PER_SQM),
    source: "ms_footprints",
    buildingId:
      typeof row.building_id === "number" ? row.building_id : undefined,
  };
}
