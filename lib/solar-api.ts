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
  source: "google_solar" | "cache";
}

// ----- GEOCODING -----
// Convert a street address to latitude/longitude using Google Geocoding API

interface GeoResult {
  lat: number;
  lng: number;
  formattedAddress: string;
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
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
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
  };
}

// ----- PUBLIC API -----
// Main function: get roof data for an address (checks cache first)

export async function getRoofData(
  address: string
): Promise<{ data: RoofData | null; geocoded: GeoResult | null }> {
  // Step 1: Check cache
  const addressHash = hashAddress(address);
  const cached = await getCachedRoofData(addressHash);
  if (cached) {
    return { data: cached, geocoded: null };
  }

  // Step 2: Geocode the address
  const geo = await geocodeAddress(address);
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
