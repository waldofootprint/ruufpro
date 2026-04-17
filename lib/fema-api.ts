// FEMA Disaster Declarations API wrapper — free, no API key required.
// Fetches federally declared disasters by state + county FIPS code.
// Used by Copilot #317b: Disaster Exposure Intel.

const FEMA_BASE = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries";

// Only disaster types relevant to roofing damage
const ROOFING_INCIDENT_TYPES = new Set([
  "Hurricane",
  "Severe Storm(s)",
  "Tornado",
  "Severe Ice Storm",
  "Typhoon",
  "Tropical Storm",
  "Flood",
]);

export interface FemaDisaster {
  title: string;
  type: string;
  date: string;           // incident begin date
  declaration_date: string;
  fema_id: string;        // e.g. "DR-4673"
}

export interface DisasterExposure {
  disasters: FemaDisaster[];
  exposure_count: number;
  exposure_level: "low" | "moderate" | "high";
}

/**
 * Fetch FEMA disaster declarations for a county.
 * Filters to roofing-relevant incident types only.
 * Optionally filters to disasters that occurred after a given year (e.g. year_built).
 */
export async function fetchFemaDisasters(
  state: string,
  countyFips: string,
  sinceYear?: number
): Promise<DisasterExposure> {
  // FEMA wants the full 5-digit FIPS (state 2 + county 3)
  // countyFips should already be 5 digits, but normalize just in case
  const fips = countyFips.padStart(5, "0");

  const params = new URLSearchParams({
    "$filter": `state eq '${state.toUpperCase()}' and fipsCountyCode eq '${fips.slice(2)}' and fipsStateCode eq '${fips.slice(0, 2)}'`,
    "$select": "disasterNumber,declarationType,declarationDate,incidentType,declarationTitle,incidentBeginDate,incidentEndDate",
    "$orderby": "incidentBeginDate desc",
  });

  const res = await fetch(`${FEMA_BASE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    // Cache for 24 hours — disaster declarations don't change often
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.error(`FEMA API error ${res.status}: ${await res.text()}`);
    return { disasters: [], exposure_count: 0, exposure_level: "low" };
  }

  const json = await res.json();
  const records = json.DisasterDeclarationsSummaries || [];

  // Deduplicate by disasterNumber (same disaster can have multiple declarations)
  const seen = new Set<number>();
  const disasters: FemaDisaster[] = [];

  for (const rec of records) {
    if (seen.has(rec.disasterNumber)) continue;
    seen.add(rec.disasterNumber);

    // Only roofing-relevant incident types
    if (!ROOFING_INCIDENT_TYPES.has(rec.incidentType)) continue;

    const incidentDate = rec.incidentBeginDate?.split("T")[0] || "";
    const incidentYear = incidentDate ? parseInt(incidentDate.split("-")[0], 10) : 0;

    // Filter by year_built if provided
    if (sinceYear && incidentYear && incidentYear < sinceYear) continue;

    disasters.push({
      title: (rec.declarationTitle || rec.incidentType).trim(),
      type: rec.incidentType,
      date: incidentDate,
      declaration_date: rec.declarationDate?.split("T")[0] || "",
      fema_id: `${rec.declarationType}-${rec.disasterNumber}`,
    });
  }

  const count = disasters.length;
  const level: DisasterExposure["exposure_level"] =
    count === 0 ? "low" : count <= 2 ? "moderate" : "high";

  return { disasters, exposure_count: count, exposure_level: level };
}

/**
 * Look up county FIPS code using the FCC Census Block API (free, no key).
 * This is more reliable than name matching since county names can vary.
 */
export async function lookupCountyFipsFromCoords(
  lat: number,
  lng: number
): Promise<string | null> {
  const res = await fetch(
    `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`
  );

  if (!res.ok) return null;

  const json = await res.json();
  // FCC returns county FIPS as part of the block FIPS (first 5 digits)
  const fips = json.County?.FIPS;
  return fips || null;
}

/**
 * Full geocode + FIPS lookup pipeline.
 * Returns everything needed to query FEMA disasters.
 */
export async function getGeoAndFips(
  address: string
): Promise<{ lat: number; lng: number; countyFips: string; county: string; state: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY not set — skipping geocoding");
    return null;
  }

  const encoded = encodeURIComponent(address);
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`
  );

  if (!res.ok) {
    console.error(`Google Geocoding error ${res.status}`);
    return null;
  }

  const json = await res.json();
  const result = json.results?.[0];
  if (!result) return null;

  const lat = result.geometry.location.lat;
  const lng = result.geometry.location.lng;

  // Extract state from address components
  let state = "";
  let county = "";
  for (const comp of result.address_components || []) {
    if (comp.types.includes("administrative_area_level_1")) {
      state = comp.short_name;
    }
    if (comp.types.includes("administrative_area_level_2")) {
      county = comp.long_name;
    }
  }

  // Get FIPS from coordinates (most reliable method)
  const fips = await lookupCountyFipsFromCoords(lat, lng);
  if (!fips || !state) return null;

  return { lat, lng, countyFips: fips, county, state };
}
