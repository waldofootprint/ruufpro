// Copilot tool functions — pure data access, no React, no streaming.
// These are called by the copilot API route when Claude invokes a tool.
// Each function takes a Supabase client + contractorId and returns structured data.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadStatus, LeadTemperature } from "./types";
import {
  getLeadTemperature,
  calculateRevenue,
  getAvgResponseTime,
  formatTimeAgo,
} from "./dashboard-utils";

// ── Types ──────────────────────────────────────────────────────────────

export interface LeadFilters {
  status?: LeadStatus;
  temperature?: LeadTemperature;
  dateRange?: "today" | "this_week" | "this_month" | "all";
  uncontacted?: boolean;
  limit?: number;
}

export interface CopilotLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: LeadStatus;
  temperature: LeadTemperature | null;
  source: string;
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_material: string | null;
  created_at: string;
  created_ago: string;
  contacted_at: string | null;
  notes: string | null;
}

export interface BusinessSnapshot {
  total_leads: number;
  leads_this_week: number;
  leads_today: number;
  by_status: Record<string, number>;
  by_temperature: Record<string, number>;
  avg_response_time: string | null;
  pipeline_value: number;
  conversion_rate: string;
  uncontacted_count: number;
  oldest_uncontacted: CopilotLead | null;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getDateFloor(range: LeadFilters["dateRange"]): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "this_week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
  if (range === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

function toCopilotLead(lead: Lead): CopilotLead {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    status: lead.status,
    temperature: getLeadTemperature(lead),
    source: lead.source,
    estimate_low: lead.estimate_low,
    estimate_high: lead.estimate_high,
    estimate_material: lead.estimate_material,
    created_at: lead.created_at,
    created_ago: formatTimeAgo(lead.created_at),
    contacted_at: lead.contacted_at,
    notes: lead.notes,
  };
}

// ── Tool Functions ─────────────────────────────────────────────────────

/**
 * Get leads matching filters. Used by the getLeads tool.
 * "Show me hot leads" / "Who came in today?" / "Any uncontacted leads?"
 */
export async function getLeadsForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  filters: LeadFilters = {}
): Promise<{ leads: CopilotLead[]; total: number }> {
  let query = supabase
    .from("leads")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false });

  // Status filter
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  // Temperature filter — applied post-query since temperature can be derived
  // from timeline field (not always stored directly)

  // Date range filter
  const dateFloor = getDateFloor(filters.dateRange);
  if (dateFloor) {
    query = query.gte("created_at", dateFloor.toISOString());
  }

  // Uncontacted filter
  if (filters.uncontacted) {
    query = query.eq("status", "new").is("contacted_at", null);
  }

  const limit = filters.limit || 10;
  query = query.limit(limit + 20); // fetch extra for post-filtering

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch leads: ${error.message}`);

  let leads = (data as Lead[]) || [];

  // Post-query temperature filter (since temperature can be derived)
  if (filters.temperature) {
    leads = leads.filter(
      (l) => getLeadTemperature(l) === filters.temperature
    );
  }

  const copilotLeads = leads.slice(0, limit).map(toCopilotLead);

  return { leads: copilotLeads, total: copilotLeads.length };
}

/**
 * Get details for a specific lead by fuzzy name match or ID.
 * "What's the story on the Johnson lead?"
 */
export async function getLeadDetailsForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  nameOrId: string
): Promise<CopilotLead | null> {
  // Try exact ID match first
  if (nameOrId.match(/^[0-9a-f-]{36}$/i)) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("contractor_id", contractorId)
      .eq("id", nameOrId)
      .single();
    return data ? toCopilotLead(data as Lead) : null;
  }

  // Fuzzy name match — case-insensitive partial match
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("contractor_id", contractorId)
    .ilike("name", `%${nameOrId}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  const lead = (data as Lead[] | null)?.[0];
  return lead ? toCopilotLead(lead) : null;
}

/**
 * Business snapshot — overview metrics for "How am I doing this week?"
 */
export async function getBusinessSnapshotForCopilot(
  supabase: SupabaseClient,
  contractorId: string
): Promise<BusinessSnapshot> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch leads: ${error.message}`);

  const leads = (data as Lead[]) || [];
  const now = new Date();

  // Date boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekDay = now.getDay();
  const weekDiff = now.getDate() - weekDay + (weekDay === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), weekDiff);

  const leadsToday = leads.filter(
    (l) => new Date(l.created_at) >= todayStart
  );
  const leadsThisWeek = leads.filter(
    (l) => new Date(l.created_at) >= weekStart
  );

  // Counts by status
  const byStatus: Record<string, number> = {};
  leads.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  });

  // Counts by temperature
  const byTemperature: Record<string, number> = {};
  leads.forEach((l) => {
    const temp = getLeadTemperature(l) || "unknown";
    byTemperature[temp] = (byTemperature[temp] || 0) + 1;
  });

  // Uncontacted leads
  const uncontacted = leads.filter(
    (l) => l.status === "new" && !l.contacted_at
  );
  const oldestUncontacted = uncontacted.length > 0
    ? toCopilotLead(uncontacted[uncontacted.length - 1])
    : null;

  // Conversion rate
  const closable = leads.filter(
    (l) => l.status !== "new" && l.status !== "lost"
  );
  const won = leads.filter((l) => l.status === "won" || l.status === "completed");
  const convRate =
    closable.length > 0
      ? `${Math.round((won.length / closable.length) * 100)}%`
      : "N/A";

  return {
    total_leads: leads.length,
    leads_this_week: leadsThisWeek.length,
    leads_today: leadsToday.length,
    by_status: byStatus,
    by_temperature: byTemperature,
    avg_response_time: getAvgResponseTime(leads),
    pipeline_value: calculateRevenue(leads),
    conversion_rate: convRate,
    uncontacted_count: uncontacted.length,
    oldest_uncontacted: oldestUncontacted,
  };
}
