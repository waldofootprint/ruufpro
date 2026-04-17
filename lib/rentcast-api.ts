// RentCast API wrapper — property records + value estimates.
// Uses a cache-first pattern: check Supabase before calling the API.
// Each property lookup costs 2 API calls (records + AVM).
// Free tier: 50 calls/month = 25 property lookups.

import { createClient } from "@supabase/supabase-js";
import { getGeoAndFips } from "./fema-api";

const RENTCAST_BASE = "https://api.rentcast.io/v1";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getApiKey() {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) throw new Error("RENTCAST_API_KEY not set");
  return key;
}

// Normalize address for cache key: lowercase, trim, collapse whitespace
function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface PropertyData {
  id: string;
  address: string;
  formatted_address: string | null;
  year_built: number | null;
  square_footage: number | null;
  lot_size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  stories: number | null;
  roof_type: string | null;
  owner_names: string[] | null;
  owner_type: string | null;
  owner_occupied: boolean | null;
  estimated_value: number | null;
  value_range_low: number | null;
  value_range_high: number | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  sale_history: Record<string, { event?: string; price?: number }>;
  tax_assessed_value: number | null;
  annual_property_tax: number | null;
  features: Record<string, any>;
  roof_details: {
    type: string | null;
    year_built: number | null;
    estimated_age: number | null;
  };
  fetched_at: string;
}

// Check cache first, return cached data if exists
export async function getCachedProperty(address: string): Promise<PropertyData | null> {
  const supabase = getSupabase();
  const normalized = normalizeAddress(address);

  const { data } = await supabase
    .from("property_data_cache")
    .select("*")
    .eq("address", normalized)
    .single();

  if (!data) return null;

  return formatPropertyData(data);
}

// Fetch from RentCast API and cache the result
export async function fetchPropertyData(address: string): Promise<PropertyData> {
  const supabase = getSupabase();
  const apiKey = getApiKey();
  const normalized = normalizeAddress(address);
  const encoded = encodeURIComponent(address);

  // 1. Fetch property records
  const propsRes = await fetch(
    `${RENTCAST_BASE}/properties?address=${encoded}`,
    { headers: { "X-Api-Key": apiKey, Accept: "application/json" } }
  );

  if (!propsRes.ok) {
    const errText = await propsRes.text();
    throw new Error(`RentCast properties API error ${propsRes.status}: ${errText}`);
  }

  const propsData = await propsRes.json();
  const prop = Array.isArray(propsData) ? propsData[0] : propsData;

  if (!prop) {
    throw new Error("No property data found for this address");
  }

  // 2. Fetch value estimate (AVM)
  let valueData: any = null;
  try {
    const avmRes = await fetch(
      `${RENTCAST_BASE}/avm/value?address=${encoded}`,
      { headers: { "X-Api-Key": apiKey, Accept: "application/json" } }
    );
    if (avmRes.ok) {
      valueData = await avmRes.json();
    }
  } catch {
    // AVM may fail for some properties — not critical
  }

  // 3. Build the cache record
  const cacheRecord = {
    address: normalized,
    formatted_address: prop.formattedAddress || null,
    year_built: prop.yearBuilt || null,
    square_footage: prop.squareFootage || null,
    lot_size: prop.lotSize || null,
    bedrooms: prop.bedrooms || null,
    bathrooms: prop.bathrooms || null,
    property_type: prop.propertyType || null,
    stories: prop.features?.floorCount || null,
    roof_type: prop.features?.roofType || null,
    owner_names: prop.owner?.names || null,
    owner_type: prop.owner?.type || null,
    owner_occupied: prop.ownerOccupied ?? null,
    estimated_value: valueData?.price || null,
    value_range_low: valueData?.priceRangeLow || null,
    value_range_high: valueData?.priceRangeHigh || null,
    last_sale_date: prop.lastSaleDate || null,
    last_sale_price: prop.lastSalePrice || null,
    sale_history: prop.history || {},
    tax_assessed_value: prop.taxAssessments
      ? Object.values(prop.taxAssessments as Record<string, any>).sort((a: any, b: any) => b.year - a.year)[0]?.value || null
      : null,
    annual_property_tax: prop.propertyTaxes
      ? Object.values(prop.propertyTaxes as Record<string, any>).sort((a: any, b: any) => b.year - a.year)[0]?.total || null
      : null,
    features: prop.features || {},
    rentcast_id: prop.id || null,
    fetched_at: new Date().toISOString(),
    // Copilot #317: Derived roof age fields
    estimated_roof_age_years: prop.yearBuilt
      ? new Date().getFullYear() - prop.yearBuilt
      : null,
    roof_age_source: "year_built_derived",
    likely_original_roof: prop.yearBuilt
      ? (!prop.features?.roofType || prop.features.roofType === "")
      : false,
    in_replacement_window: prop.yearBuilt
      ? (new Date().getFullYear() - prop.yearBuilt >= 18)
      : false,
  } as Record<string, any>;

  // Copilot #317b: Geocode + cache county FIPS for disaster lookups
  try {
    const geo = await getGeoAndFips(address);
    if (geo) {
      cacheRecord.county_fips = geo.countyFips;
      cacheRecord.latitude = geo.lat;
      cacheRecord.longitude = geo.lng;
    }
  } catch (err) {
    console.error("Geocoding failed during RentCast fetch:", err);
  }

  // 4. Upsert into cache (on conflict update)
  const { data: cached, error } = await supabase
    .from("property_data_cache")
    .upsert(cacheRecord, { onConflict: "address" })
    .select("*")
    .single();

  if (error) {
    console.error("Property cache insert error:", error);
    // Return data even if cache fails
    return formatPropertyData({ id: "uncached", ...cacheRecord });
  }

  return formatPropertyData(cached);
}

// Lookup with cache-first pattern
export async function lookupProperty(address: string): Promise<{ data: PropertyData; fromCache: boolean }> {
  const cached = await getCachedProperty(address);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const fresh = await fetchPropertyData(address);
  return { data: fresh, fromCache: false };
}

// Format raw DB record into clean PropertyData
function formatPropertyData(raw: any): PropertyData {
  const currentYear = new Date().getFullYear();
  return {
    id: raw.id,
    address: raw.address,
    formatted_address: raw.formatted_address,
    year_built: raw.year_built,
    square_footage: raw.square_footage,
    lot_size: raw.lot_size,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    property_type: raw.property_type,
    stories: raw.stories,
    roof_type: raw.roof_type,
    owner_names: raw.owner_names,
    owner_type: raw.owner_type,
    owner_occupied: raw.owner_occupied,
    estimated_value: raw.estimated_value,
    value_range_low: raw.value_range_low,
    value_range_high: raw.value_range_high,
    last_sale_date: raw.last_sale_date,
    last_sale_price: raw.last_sale_price,
    sale_history: raw.sale_history || {},
    tax_assessed_value: raw.tax_assessed_value,
    annual_property_tax: raw.annual_property_tax,
    features: raw.features || {},
    roof_details: {
      type: raw.roof_type,
      year_built: raw.year_built,
      estimated_age: raw.year_built ? currentYear - raw.year_built : null,
    },
    fetched_at: raw.fetched_at,
  };
}
