// API route for the dashboard storm alert banner.
// Checks NOAA weather alerts for a contractor's service area.
// Returns the highest-severity alert + suggested multiplier, or null.
//
// Geocoding: Uses free Census Bureau geocoder for ZIP → lat/lng.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getWeatherSurge } from "@/lib/weather-surge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Free Census Bureau geocoder — no API key needed
async function zipToCoords(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${zip}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    if (match?.coordinates) {
      return { lat: match.coordinates.y, lng: match.coordinates.x };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const contractorId = req.nextUrl.searchParams.get("contractor_id");
  if (!contractorId) {
    return NextResponse.json({ alert: null });
  }

  // Get contractor's primary ZIP and service ZIPs
  const { data: contractor } = await supabase
    .from("contractors")
    .select("zip, city, state")
    .eq("id", contractorId)
    .single();

  const { data: settings } = await supabase
    .from("estimate_settings")
    .select("service_zips, weather_surge_enabled")
    .eq("contractor_id", contractorId)
    .single();

  // If surge is already enabled, no need for the alert banner
  if (settings?.weather_surge_enabled) {
    return NextResponse.json({ alert: null });
  }

  // Try contractor's primary ZIP first, then first service ZIP
  const primaryZip = contractor?.zip;
  const serviceZips = settings?.service_zips || [];
  const zipToCheck = primaryZip || serviceZips[0];

  if (!zipToCheck) {
    return NextResponse.json({ alert: null });
  }

  const coords = await zipToCoords(zipToCheck);
  if (!coords) {
    return NextResponse.json({ alert: null });
  }

  const surge = await getWeatherSurge(coords.lat, coords.lng);

  if (!surge.isSurged) {
    return NextResponse.json({ alert: null });
  }

  return NextResponse.json({
    alert: {
      event: surge.alerts[0]?.replace(/ \(.*\)$/, "") || "Severe Weather",
      severity: surge.highestSeverity,
      suggestedMultiplier: surge.multiplier,
      allAlerts: surge.alerts,
      fetchedAt: surge.fetchedAt,
    },
  });
}
