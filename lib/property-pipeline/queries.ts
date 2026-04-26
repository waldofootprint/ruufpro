import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineCandidate, ZipAggregate } from "./types";

export interface FetchOpts {
  limit?: number;
  offset?: number;
  zipFilter?: string;
}

// Defensive UI-side filter — hides rows with recent permits that slipped past
// the upstream universe builder (address-normalizer mismatch between
// load-pp-universe.mjs and backfill-pp-signals.mjs is the root cause; tracked
// for v1.2 fix). 10yr cap is conservative; Lead-Spy uses 20yr.
const RECENT_PERMIT_CUTOFF_YEARS = 10;

function recentPermitCutoffISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - RECENT_PERMIT_CUTOFF_YEARS);
  return d.toISOString().slice(0, 10);
}

export async function fetchPipelineCandidates(
  supabase: SupabaseClient,
  { limit = 100, offset = 0, zipFilter }: FetchOpts = {}
): Promise<{ rows: PipelineCandidate[]; total: number }> {
  const cutoff = recentPermitCutoffISO();

  let query = supabase
    .from("property_pipeline_candidates")
    .select(
      "id, parcel_id, address_raw, city, zip, year_built, assessed_value, last_sale_year, last_roof_permit_date, status, score, tier, score_factors",
      { count: "exact" }
    )
    .eq("status", "active")
    .or(`last_roof_permit_date.is.null,last_roof_permit_date.lt.${cutoff}`)
    // No permit on file ranks first (strongest in-market signal), then newer
    // year-built (the 2000-2010 replacement-window sweet spot), then older.
    .order("last_roof_permit_date", { ascending: true, nullsFirst: true })
    .order("year_built", { ascending: false })
    .range(offset, offset + limit - 1);

  if (zipFilter) query = query.eq("zip", zipFilter);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as PipelineCandidate[], total: count ?? 0 };
}

export async function fetchZipAggregates(
  supabase: SupabaseClient
): Promise<ZipAggregate[]> {
  const cutoff = recentPermitCutoffISO();
  const { data, error } = await supabase
    .from("property_pipeline_candidates")
    .select("zip")
    .eq("status", "active")
    .or(`last_roof_permit_date.is.null,last_roof_permit_date.lt.${cutoff}`);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const zip = (row as { zip: string }).zip;
    counts.set(zip, (counts.get(zip) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([zip, count]) => ({ zip, count }))
    .sort((a, b) => b.count - a.count);
}
