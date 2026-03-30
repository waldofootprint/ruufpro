// Prospect analytics helpers — query view tracking data for follow-up intelligence.

import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface ProspectViewSummary {
  slug: string;
  site_id: string;
  total_views: number;
  unique_visitors: number;
  first_view: string;
  last_view: string;
}

/**
 * Get view counts for all prospect sites, sorted by most recent activity.
 */
export async function getProspectViewSummaries(): Promise<ProspectViewSummary[]> {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("prospect_views")
    .select("slug, site_id, viewed_at, ip_hash")
    .order("viewed_at", { ascending: false });

  if (error || !data) return [];

  // Aggregate by slug
  const bySlug = new Map<string, {
    site_id: string;
    views: number;
    ips: Set<string>;
    first: string;
    last: string;
  }>();

  for (const row of data) {
    const existing = bySlug.get(row.slug);
    if (existing) {
      existing.views++;
      if (row.ip_hash) existing.ips.add(row.ip_hash);
      if (row.viewed_at < existing.first) existing.first = row.viewed_at;
      if (row.viewed_at > existing.last) existing.last = row.viewed_at;
    } else {
      bySlug.set(row.slug, {
        site_id: row.site_id,
        views: 1,
        ips: new Set(row.ip_hash ? [row.ip_hash] : []),
        first: row.viewed_at,
        last: row.viewed_at,
      });
    }
  }

  return Array.from(bySlug.entries())
    .map(([slug, d]) => ({
      slug,
      site_id: d.site_id,
      total_views: d.views,
      unique_visitors: d.ips.size,
      first_view: d.first,
      last_view: d.last,
    }))
    .sort((a, b) => new Date(b.last_view).getTime() - new Date(a.last_view).getTime());
}

/**
 * Get view count for a specific prospect slug.
 */
export async function getProspectViewCount(slug: string): Promise<number> {
  const supabase = getAdminSupabase();

  const { count } = await supabase
    .from("prospect_views")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug);

  return count || 0;
}
