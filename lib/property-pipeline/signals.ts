// Signal + tag rendering for Property Pipeline candidates.
//
// Phase 1 of statewide expansion plan. Replaces the rejected score model with
// pure verifiable-fact tags + a "most recent signal" sort key.
//
// Plan: research/handoff-2026-05-01-property-pipeline-statewide-expansion.md
//
// Three tag types:
//   🔨 OLD_PERMIT  — last roof permit ≥ 7 years ago, or no permit on file
//   🏠 RECENT_SALE — last_sale_year within RECENT_SALE_YEARS
//   ⛈️ STORM       — county had ≥1 IEM storm event in last STORM_WINDOW_DAYS
//
// Sort key = most recent of those three signal dates. No invented score.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineCandidate } from "./types";

export const OLD_PERMIT_THRESHOLD_YEARS = 7;
export const RECENT_SALE_YEARS = 2;
export const STORM_WINDOW_DAYS = 90;

export type TagCode = "OLD_PERMIT" | "RECENT_SALE" | "STORM";

export interface SignalTag {
  code: TagCode;
  label: string;
  date: string;
  detail?: string;
}

export interface CandidateWithSignals extends PipelineCandidate {
  tags: SignalTag[];
  latest_signal_at: string | null;
  county: string;
}

interface StormEventRow {
  county: string;
  valid_at: string;
  typecode: string;
  magnitude: number | null;
  city: string | null;
}

// Fetch the most recent storm event per county, restricted to last STORM_WINDOW_DAYS.
// Returns a Map keyed by lowercased county name.
export async function fetchRecentStormByCounty(
  supabase: SupabaseClient,
  counties: string[]
): Promise<Map<string, StormEventRow>> {
  if (counties.length === 0) return new Map();

  const since = new Date(Date.now() - STORM_WINDOW_DAYS * 86_400_000).toISOString();
  const initcap = counties.map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());

  const { data, error } = await supabase
    .from("storm_events")
    .select("county, valid_at, typecode, magnitude, city")
    .in("county", initcap)
    .gte("valid_at", since)
    .order("valid_at", { ascending: false });

  if (error) throw error;

  const out = new Map<string, StormEventRow>();
  for (const row of (data ?? []) as StormEventRow[]) {
    const key = row.county.toLowerCase();
    if (!out.has(key)) out.set(key, row);    // keep most recent only
  }
  return out;
}

// Compute tags for a single candidate given the storm-by-county map.
export function computeTags(
  candidate: PipelineCandidate & { county?: string },
  stormByCounty: Map<string, StormEventRow>
): SignalTag[] {
  const tags: SignalTag[] = [];
  const now = new Date();

  // 🔨 Old / missing permit
  if (!candidate.last_roof_permit_date) {
    tags.push({
      code: "OLD_PERMIT",
      label: "No roof permit on file",
      date: new Date(0).toISOString(),
    });
  } else {
    const permitDate = new Date(candidate.last_roof_permit_date);
    const yearsAgo = (now.getTime() - permitDate.getTime()) / (365.25 * 86_400_000);
    if (yearsAgo >= OLD_PERMIT_THRESHOLD_YEARS) {
      tags.push({
        code: "OLD_PERMIT",
        label: `Last roof permit: ${permitDate.getUTCFullYear()}`,
        date: candidate.last_roof_permit_date,
      });
    }
  }

  // 🏠 Recent sale
  if (candidate.last_sale_year) {
    const ageYears = now.getUTCFullYear() - candidate.last_sale_year;
    if (ageYears <= RECENT_SALE_YEARS) {
      tags.push({
        code: "RECENT_SALE",
        label: `Sold ${candidate.last_sale_year}`,
        date: `${candidate.last_sale_year}-01-01T00:00:00Z`,
      });
    }
  }

  // ⛈️ Storm in county within window
  const county = (candidate.county ?? "manatee").toLowerCase();
  const storm = stormByCounty.get(county);
  if (storm) {
    const mag = storm.magnitude ? ` ${storm.magnitude}` : "";
    tags.push({
      code: "STORM",
      label: `${storm.typecode}${mag} in ${storm.county} ${storm.valid_at.slice(0, 10)}`,
      date: storm.valid_at,
      detail: storm.city ?? undefined,
    });
  }

  return tags;
}

// Most-recent signal date wins. Used as sort key. Returns null when only the
// "no permit on file" zero-date tag is present (those go last).
export function latestSignalAt(tags: SignalTag[]): string | null {
  const real = tags.filter((t) => t.date !== new Date(0).toISOString());
  if (real.length === 0) return null;
  return real.reduce((a, b) => (a.date > b.date ? a : b)).date;
}

// Convenience: enrich a list of candidates with tags + sort by latest signal.
export async function enrichWithSignals(
  supabase: SupabaseClient,
  candidates: (PipelineCandidate & { county?: string })[]
): Promise<CandidateWithSignals[]> {
  const counties = Array.from(
    new Set(candidates.map((c) => (c.county ?? "manatee").toLowerCase()))
  );
  const stormByCounty = await fetchRecentStormByCounty(supabase, counties);

  const enriched = candidates.map((c) => {
    const tags = computeTags(c, stormByCounty);
    return {
      ...c,
      county: c.county ?? "manatee",
      tags,
      latest_signal_at: latestSignalAt(tags),
    };
  });

  // Sort: most recent signal first; nulls (no real signal) last.
  enriched.sort((a, b) => {
    if (a.latest_signal_at && b.latest_signal_at) {
      return b.latest_signal_at.localeCompare(a.latest_signal_at);
    }
    if (a.latest_signal_at) return -1;
    if (b.latest_signal_at) return 1;
    return 0;
  });

  return enriched;
}
