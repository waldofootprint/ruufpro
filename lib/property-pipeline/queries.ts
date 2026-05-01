import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineCandidate, ZipAggregate } from "./types";

export interface FetchOpts {
  limit?: number;
  offset?: number;
  zipFilter?: string;
}

export async function fetchPipelineCandidates(
  supabase: SupabaseClient,
  { limit = 100, offset = 0, zipFilter }: FetchOpts = {}
): Promise<{ rows: PipelineCandidate[]; total: number }> {
  let query = supabase
    .from("property_pipeline_candidates")
    .select(
      "id, parcel_id, address_raw, city, zip, year_built, assessed_value, last_sale_year, last_roof_permit_date, county, status, score, tier, score_factors",
      { count: "exact" }
    )
    .eq("status", "active")
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
  const { data, error } = await supabase
    .from("property_pipeline_candidates")
    .select("zip")
    .eq("status", "active");

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
