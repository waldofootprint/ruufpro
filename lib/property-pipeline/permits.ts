/**
 * Roof-permit lookup against the Accela dataset (public.accela_roof_permits).
 *
 * Used by:
 *   - app/postcard-landing-mockup (server component) to compute real roof age
 *   - any future address-driven roof-age display
 *
 * Returns the most recent permit for the address (any status: issued / closed /
 * finaled), or null if no permit on file. Caller decides how to interpret null
 * — typically "assume original roof, age = current_year - year_built".
 */

import { createClient } from "@supabase/supabase-js";
import { normalizeAddressFull, normalizeAddressLine } from "./address.mjs";

export interface RoofPermit {
  recordNumber: string;
  permitDate: string; // ISO YYYY-MM-DD
  permitYear: number;
  description: string | null;
  status: string | null;
  recordType: string | null;
  addressRaw: string;
}

export interface RoofAgeResult {
  /** Permit row used to compute age, or null if none on file. */
  permit: RoofPermit | null;
  /** Age in years derived from the most recent permit OR year_built fallback. */
  ageYears: number | null;
  /** "permit" when a permit drove the answer, "year_built" when fallback used, "unknown" if neither. */
  source: "permit" | "year_built" | "unknown";
}

let cached: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env for permits lookup");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/**
 * Find the most recent roof permit for an address.
 *
 * Accepts either:
 *   - a full one-line address ("8734 54th Ave E Bradenton FL 34211"), OR
 *   - a (street, city, zip) tuple via getLastRoofPermitForParts().
 */
export async function getLastRoofPermit(fullAddress: string): Promise<RoofPermit | null> {
  const normalized = normalizeAddressLine(fullAddress);
  return queryByNormalized(normalized);
}

export async function getLastRoofPermitForParts(
  street: string,
  city: string,
  zip: string
): Promise<RoofPermit | null> {
  const normalized = normalizeAddressFull(street, city, zip);
  return queryByNormalized(normalized);
}

async function queryByNormalized(normalized: string): Promise<RoofPermit | null> {
  // Strip "FL" / state token — CSV rows don't include the state, so the stored
  // normalized form is "8734 54TH AVE E BRADENTON 34211". Removing FL keeps
  // user-supplied addresses joinable.
  const cleaned = normalized.replace(/\bFL\b/g, "").replace(/\s+/g, " ").trim();

  const supabase = getClient();
  const { data, error } = await supabase
    .from("accela_roof_permits")
    .select("record_number, permit_date, description, status, record_type, address_raw")
    .eq("address_normalized", cleaned)
    .order("permit_date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[permits] query failed", error);
    return null;
  }
  const rows = data as Array<Record<string, unknown>> | null;
  const row = rows?.[0];
  if (!row) return null;

  const date = String(row.permit_date);
  return {
    recordNumber: String(row.record_number),
    permitDate: date,
    permitYear: Number(date.slice(0, 4)),
    description: (row.description as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    recordType: (row.record_type as string | null) ?? null,
    addressRaw: String(row.address_raw),
  };
}

/**
 * Compute roof age preferring permit data, falling back to year_built.
 */
export function deriveRoofAge(
  permit: RoofPermit | null,
  yearBuilt: number | null,
  asOfYear = new Date().getFullYear()
): RoofAgeResult {
  if (permit) {
    return {
      permit,
      ageYears: Math.max(0, asOfYear - permit.permitYear),
      source: "permit",
    };
  }
  if (yearBuilt && yearBuilt >= 1900 && yearBuilt <= asOfYear) {
    return { permit: null, ageYears: asOfYear - yearBuilt, source: "year_built" };
  }
  return { permit: null, ageYears: null, source: "unknown" };
}
