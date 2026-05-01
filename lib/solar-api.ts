// Google Solar API client.
//
// Flow: address string → geocode to lat/lng → call Solar API → get roof data
//
// The Solar API returns satellite-measured roof data:
// - Total roof area (in square meters, we convert to sqft)
// - Pitch (angle of the roof in degrees)
// - Individual roof segments (each with area, pitch, and compass direction)
//
// We cache results in Supabase so we never pay for the same address twice.
// This is important because multiple roofers may serve the same neighborhoods.

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const API_KEY = process.env.GOOGLE_API_KEY!;
const SQFT_PER_SQM = 10.764;

// Supabase client for server-side caching (uses anon key — cache table allows public insert)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// The shape of data we extract from the Solar API response
export interface RoofData {
  roofAreaSqft: number;
  pitchDegrees: number;
  numSegments: number;
  segments: {
    areaSqft: number;
    pitchDegrees: number;
    azimuthDegrees: number; // compass direction the segment faces
  }[];
  source: "google_solar" | "cache" | "ms_footprints";
  // Confidence signals from Google Solar API (present only on fresh fetches).
  imageryQuality?: "HIGH" | "MEDIUM" | "LOW";
  imageryDate?: string; // ISO YYYY-MM-DD when imagery was captured
  imageryProcessedDate?: string; // ISO YYYY-MM-DD when imagery was processed
}

// ----- GEOCODING -----
// Convert a street address to latitude/longitude using Google Geocoding API

interface GeoResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  types: string[];
  hasStreetNumber: boolean;
  locationType: string; // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE
}

// Place types we won't burn a Solar API call on — park, intersection, routes
// without street numbers, etc. Returns a reason string when invalid, null
// when the address looks residential-enough to measure.
function validateResidentialPlace(g: GeoResult): string | null {
  const REJECT = new Set([
    "park",
    "intersection",
    "route", // "123 Main St" routes have street_address; a bare "Main St" becomes route-only
    "natural_feature",
    "airport",
    "cemetery",
    "church",
    "school",
    "university",
    "hospital",
    "shopping_mall",
    "stadium",
  ]);
  const ACCEPT = new Set([
    "street_address",
    "premise",
    "subpremise",
    "residential",
    "rooftop",
  ]);

  const hasAccept = g.types.some((t) => ACCEPT.has(t));
  const hasReject = g.types.some((t) => REJECT.has(t));

  if (hasReject && !hasAccept) {
    return `non_residential_place:${g.types.slice(0, 3).join(",")}`;
  }
  // Pure route/intersection geocodes come back with types like ["route"] only
  if (!hasAccept && !g.hasStreetNumber && g.locationType !== "ROOFTOP") {
    return `no_street_number:${g.types.slice(0, 3).join(",") || "unknown"}`;
  }
  return null;
}

async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    return null;
  }

  const result = data.results[0];
  const hasStreetNumber = (result.address_components || []).some(
    (c: { types: string[] }) => c.types.includes("street_number")
  );
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
    types: result.types || [],
    hasStreetNumber,
    locationType: result.geometry?.location_type || "APPROXIMATE",
  };
}

// ----- CACHING -----
// Hash the address so we can look it up quickly without storing raw addresses as keys

function hashAddress(address: string): string {
  const normalized = address.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function getCachedRoofData(
  addressHash: string
): Promise<RoofData | null> {
  const { data } = await supabase
    .from("roof_data_cache")
    .select("*")
    .eq("address_hash", addressHash)
    .single();

  if (!data) return null;

  return {
    roofAreaSqft: data.roof_area_sqft,
    pitchDegrees: data.pitch_degrees || 0,
    numSegments: data.num_segments || 0,
    segments: data.segment_data || [],
    source: "cache",
  };
}

async function cacheRoofData(
  addressHash: string,
  addressText: string,
  roofData: RoofData,
  geometricData: {
    ridgeLengthFt?: number;
    hipLengthFt?: number;
    valleyLengthFt?: number;
    perimeterFt?: number;
  } = {}
): Promise<void> {
  await supabase.from("roof_data_cache").upsert({
    address_hash: addressHash,
    address_text: addressText,
    roof_area_sqft: roofData.roofAreaSqft,
    pitch_degrees: roofData.pitchDegrees,
    num_segments: roofData.numSegments,
    segment_data: roofData.segments,
    ridge_length_ft: geometricData.ridgeLengthFt || null,
    hip_length_ft: geometricData.hipLengthFt || null,
    valley_length_ft: geometricData.valleyLengthFt || null,
    perimeter_ft: geometricData.perimeterFt || null,
    source: "google_solar",
  });
}

// ----- SOLAR API -----
// Call Google's Solar API to get roof measurements from satellite data

async function callSolarAPI(
  lat: number,
  lng: number
): Promise<RoofData | null> {
  const url =
    `https://solar.googleapis.com/v1/buildingInsights:findClosest` +
    `?location.latitude=${lat}` +
    `&location.longitude=${lng}` +
    `&requiredQuality=HIGH` +
    `&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  // API returns an error if it can't find building data for this location
  if (data.error) {
    console.log("Solar API error:", data.error.message);
    return null;
  }

  const solar = data.solarPotential;
  if (!solar?.wholeRoofStats) return null;

  // Confidence signals — imageryQuality is HIGH/MEDIUM/LOW, dates are {year,month,day}
  const imageryQuality: "HIGH" | "MEDIUM" | "LOW" | undefined = data.imageryQuality;
  const formatDate = (d: { year?: number; month?: number; day?: number } | undefined) => {
    if (!d?.year) return undefined;
    const mm = String(d.month || 1).padStart(2, "0");
    const dd = String(d.day || 1).padStart(2, "0");
    return `${d.year}-${mm}-${dd}`;
  };
  const imageryDate = formatDate(data.imageryDate);
  const imageryProcessedDate = formatDate(data.imageryProcessedDate);

  const segments = (solar.roofSegmentStats || []).map(
    (seg: {
      stats: { areaMeters2: number };
      pitchDegrees: number;
      azimuthDegrees: number;
    }) => ({
      areaSqft: seg.stats.areaMeters2 * SQFT_PER_SQM,
      pitchDegrees: seg.pitchDegrees,
      azimuthDegrees: seg.azimuthDegrees,
    })
  );

  // Calculate the area-weighted average pitch across all segments.
  // This is more accurate than the whole-roof pitch for complex roofs.
  const totalArea = segments.reduce(
    (sum: number, s: { areaSqft: number }) => sum + s.areaSqft,
    0
  );
  const weightedPitch =
    totalArea > 0
      ? segments.reduce(
          (sum: number, s: { areaSqft: number; pitchDegrees: number }) =>
            sum + s.pitchDegrees * s.areaSqft,
          0
        ) / totalArea
      : 0;

  return {
    roofAreaSqft: solar.wholeRoofStats.areaMeters2 * SQFT_PER_SQM,
    pitchDegrees: weightedPitch,
    numSegments: segments.length,
    segments,
    source: "google_solar",
    imageryQuality,
    imageryDate,
    imageryProcessedDate,
  };
}

// ----- PUBLIC API -----
// Main function: get roof data for an address (checks cache first)

export async function getRoofData(
  address: string,
  preCoords?: { lat: number; lng: number }
): Promise<{
  data: RoofData | null;
  geocoded: GeoResult | null;
  invalid?: string;
}> {
  // Step 1: Check cache
  const addressHash = hashAddress(address);
  const cached = await getCachedRoofData(addressHash);
  if (cached) {
    // Populate geocoded on cache hit too — downstream callers (Phase 2 step 1
    // footprint lookup + roof_overlay) need lat/lng even when Solar data
    // came from cache. Use preCoords if the widget supplied them; otherwise
    // re-geocode (cheap; ~150ms). Pre-Phase-2 callers ignored geocoded on
    // cache hit, so this is non-breaking.
    let geo: GeoResult | null = null;
    if (preCoords) {
      geo = {
        lat: preCoords.lat,
        lng: preCoords.lng,
        formattedAddress: address,
        types: [],
        hasStreetNumber: false,
        locationType: "ROOFTOP",
      };
    } else {
      geo = await geocodeAddress(address);
    }
    return { data: cached, geocoded: geo };
  }

  // Step 2: Use pre-resolved coords or geocode the address. When we geocode
  // server-side, we also get place types back — reject non-residential hits
  // before burning a Solar API call on them.
  let geo: GeoResult | null;
  if (preCoords) {
    geo = {
      lat: preCoords.lat,
      lng: preCoords.lng,
      formattedAddress: address,
      types: [],
      hasStreetNumber: false,
      locationType: "ROOFTOP", // trust widget-side Places Autocomplete
    };
  } else {
    geo = await geocodeAddress(address);
    if (geo) {
      const invalid = validateResidentialPlace(geo);
      if (invalid) {
        return { data: null, geocoded: geo, invalid };
      }
    }
  }
  if (!geo) {
    return { data: null, geocoded: null };
  }

  // Step 3: Call Solar API
  const roofData = await callSolarAPI(geo.lat, geo.lng);
  if (!roofData) {
    return { data: null, geocoded: geo };
  }

  // Step 4: Cache the result (we do this in the background, don't block the response)
  cacheRoofData(addressHash, geo.formattedAddress, roofData).catch((err) =>
    console.error("Cache write failed:", err)
  );

  return { data: roofData, geocoded: geo };
}
