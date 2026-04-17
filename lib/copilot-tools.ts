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
import { detectIntent } from "./intent-detection";
import type { ChatMessage } from "./intent-detection";

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

// ── Review Tool Types ─────────────────────────────────────────────────

export interface ReviewStats {
  total_sent: number;
  total_clicked: number;
  total_reviewed: number;
  click_rate: string;
  review_rate: string;
  this_month: { sent: number; clicked: number; reviewed: number };
  last_month: { sent: number; clicked: number; reviewed: number };
  recent_requests: Array<{
    lead_name: string;
    status: string;
    sent_at: string;
    sent_ago: string;
  }>;
}

export interface UnreviewedCustomer {
  lead_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  completed_ago: string;
}

// ── Review Tool Functions ─────────────────────────────────────────────

/**
 * Get review request metrics — sent, clicked, reviewed, conversion rates.
 * "How are my reviews doing?" / "Review stats" / "Review performance"
 */
export async function getReviewStatsForCopilot(
  supabase: SupabaseClient,
  contractorId: string
): Promise<ReviewStats> {
  const { data, error } = await supabase
    .from("review_requests")
    .select("id, status, sent_at, clicked_at, reviewed_at, created_at, leads(name)")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch review stats: ${error.message}`);

  const all = data || [];
  const sent = all.filter((r: any) => r.status !== "pending");
  const clicked = all.filter((r: any) => r.clicked_at);
  const reviewed = all.filter((r: any) => r.status === "reviewed");

  // Monthly boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const inRange = (r: any, start: Date, end: Date) => {
    const d = new Date(r.created_at);
    return d >= start && d < end;
  };

  const recent = all.slice(0, 5).map((r: any) => ({
    lead_name: (r.leads as any)?.name || "Unknown",
    status: r.status,
    sent_at: r.sent_at,
    sent_ago: formatTimeAgo(r.created_at),
  }));

  return {
    total_sent: sent.length,
    total_clicked: clicked.length,
    total_reviewed: reviewed.length,
    click_rate: sent.length > 0 ? `${Math.round((clicked.length / sent.length) * 100)}%` : "N/A",
    review_rate: sent.length > 0 ? `${Math.round((reviewed.length / sent.length) * 100)}%` : "N/A",
    this_month: {
      sent: sent.filter((r: any) => inRange(r, monthStart, now)).length,
      clicked: clicked.filter((r: any) => inRange(r, monthStart, now)).length,
      reviewed: reviewed.filter((r: any) => inRange(r, monthStart, now)).length,
    },
    last_month: {
      sent: sent.filter((r: any) => inRange(r, lastMonthStart, monthStart)).length,
      clicked: clicked.filter((r: any) => inRange(r, lastMonthStart, monthStart)).length,
      reviewed: reviewed.filter((r: any) => inRange(r, lastMonthStart, monthStart)).length,
    },
    recent_requests: recent,
  };
}

/**
 * Find completed/won jobs that haven't been asked for a review yet.
 * "Who hasn't left a review?" / "Unreviewed customers" / "Who should I ask?"
 */
export async function findUnreviewedCustomersForCopilot(
  supabase: SupabaseClient,
  contractorId: string
): Promise<{ customers: UnreviewedCustomer[]; total: number; message: string }> {
  // Get completed/won leads
  const { data: completedLeads, error: leadsErr } = await supabase
    .from("leads")
    .select("id, name, email, phone, status, created_at")
    .eq("contractor_id", contractorId)
    .in("status", ["completed", "won"])
    .order("created_at", { ascending: false });

  if (leadsErr) throw new Error(`Failed to fetch leads: ${leadsErr.message}`);
  if (!completedLeads || completedLeads.length === 0) {
    return { customers: [], total: 0, message: "No completed jobs yet." };
  }

  // Get existing review requests for these leads
  const leadIds = completedLeads.map(l => l.id);
  const { data: existingRequests } = await supabase
    .from("review_requests")
    .select("lead_id")
    .eq("contractor_id", contractorId)
    .in("lead_id", leadIds);

  const requestedIds = new Set((existingRequests || []).map(r => r.lead_id));

  // Filter to unrequested leads
  const unrequested = completedLeads
    .filter(l => !requestedIds.has(l.id))
    .slice(0, 20)
    .map(l => ({
      lead_id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      status: l.status,
      created_at: l.created_at,
      completed_ago: formatTimeAgo(l.created_at),
    }));

  const total = completedLeads.filter(l => !requestedIds.has(l.id)).length;
  const msg = total > 0
    ? `You have ${total} completed job${total === 1 ? "" : "s"} with no review request sent.`
    : "All completed jobs have been asked for reviews — nice work!";

  return { customers: unrequested, total, message: msg };
}

/**
 * Send review request emails to a batch of leads via Inngest.
 * "Send review requests to all of them" / "Ask them for reviews"
 * Cap: 10 per batch from Copilot (safety limit for AI-initiated sends).
 */
export async function sendBatchReviewRequestsForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  leadIds: string[]
): Promise<{ queued: number; skipped: number; errors: string[] }> {
  if (leadIds.length > 10) {
    return { queued: 0, skipped: 0, errors: ["Maximum 10 review requests per Copilot batch. Try a smaller group."] };
  }

  // Verify contractor has Google review URL configured
  const { data: contractor } = await supabase
    .from("contractors")
    .select("google_review_url, review_email_delay")
    .eq("id", contractorId)
    .single();

  if (!contractor?.google_review_url) {
    return { queued: 0, skipped: 0, errors: ["No Google review URL configured. Set it in Dashboard → Reviews."] };
  }

  // Verify leads belong to this contractor and are completed/won with email
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email, status")
    .eq("contractor_id", contractorId)
    .in("id", leadIds)
    .in("status", ["completed", "won"]);

  if (!leads || leads.length === 0) {
    return { queued: 0, skipped: 0, errors: ["No eligible completed leads found."] };
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from("review_requests")
    .select("lead_id")
    .eq("contractor_id", contractorId)
    .in("lead_id", leads.map(l => l.id));

  const alreadyRequested = new Set((existing || []).map(r => r.lead_id));
  const eligible = leads.filter(l => l.email && !alreadyRequested.has(l.id));
  const skipped = leads.length - eligible.length;

  // Send via Inngest
  const { inngest } = await import("@/lib/inngest/client");
  const errors: string[] = [];
  let queued = 0;

  for (const lead of eligible) {
    try {
      await inngest.send({
        name: "sms/review.requested",
        data: {
          contractorId,
          leadId: lead.id,
          delay: contractor.review_email_delay || "immediate",
        },
      });
      queued++;
    } catch (err: any) {
      errors.push(`${lead.name}: ${err.message}`);
    }
  }

  return { queued, skipped, errors };
}

/**
 * Return context for drafting a response to a Google review.
 * "Help me reply to this 3-star review" / "Draft a response to this review"
 * Returns guidelines — the AI model composes the actual response.
 */
// ── Engagement / Replay Count Types ───────────────────────────────────

export interface LeadEngagement {
  lead_id: string;
  lead_name: string;
  widget_views: number;
  living_estimate_views: number;
  total_views: number;
  first_view: string;
  last_view: string;
  last_view_ago: string;
}

// ── Engagement / Replay Count Tool Functions ──────────────────────────

/**
 * Get estimate view counts for a specific lead — widget views + living estimate views.
 * "How engaged is Garcia?" / "Has anyone been checking their estimate?" / "Is she still interested?"
 */
export async function getLeadEngagementForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  nameOrId: string
): Promise<{ found: boolean; engagement: LeadEngagement | null; message: string }> {
  const lead = await getLeadDetailsForCopilot(supabase, contractorId, nameOrId);
  if (!lead) {
    return { found: false, engagement: null, message: "No lead found matching that name." };
  }

  const { data: events } = await supabase
    .from("widget_events")
    .select("event_type, created_at")
    .eq("lead_id", lead.id)
    .in("event_type", ["widget_view", "living_estimate_view"])
    .order("created_at", { ascending: true });

  const rows = events || [];
  const widgetViews = rows.filter((e: any) => e.event_type === "widget_view").length;
  const leViews = rows.filter((e: any) => e.event_type === "living_estimate_view").length;
  const total = widgetViews + leViews;

  if (total === 0) {
    return {
      found: true,
      engagement: null,
      message: `${lead.name} hasn't revisited their estimate yet.`,
    };
  }

  const engagement: LeadEngagement = {
    lead_id: lead.id,
    lead_name: lead.name,
    widget_views: widgetViews,
    living_estimate_views: leViews,
    total_views: total,
    first_view: rows[0].created_at,
    last_view: rows[rows.length - 1].created_at,
    last_view_ago: formatTimeAgo(rows[rows.length - 1].created_at),
  };

  const msg = total > 2
    ? `${lead.name} has checked their estimate ${total} times — last visit ${engagement.last_view_ago}.`
    : `${lead.name} has viewed their estimate ${total} time${total === 1 ? "" : "s"}.`;

  return { found: true, engagement, message: msg };
}

// ── Material Switcher Types ──────────────────────────────────────────

export interface MaterialSwitchData {
  lead_id: string;
  lead_name: string;
  switch_count: number;
  materials_compared: string[];
  most_viewed_material: string | null;
  switch_timeline: Array<{
    from: string;
    to: string;
    from_tier: string | null;
    to_tier: string | null;
    at: string;
  }>;
}

// ── Material Switcher Tool Functions ────────────────────────────────

/**
 * Get material switch events for a specific lead — how many times they toggled
 * between material options in the estimate widget or living estimate page.
 * "What materials is Garcia looking at?" / "Did they compare options?"
 */
export async function getMaterialSwitchesForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  nameOrId: string
): Promise<{ found: boolean; switches: MaterialSwitchData | null; message: string }> {
  const lead = await getLeadDetailsForCopilot(supabase, contractorId, nameOrId);
  if (!lead) {
    return { found: false, switches: null, message: "No lead found matching that name." };
  }

  const { data: events } = await supabase
    .from("widget_events")
    .select("metadata, created_at")
    .eq("lead_id", lead.id)
    .eq("event_type", "material_switch")
    .order("created_at", { ascending: true });

  const rows = events || [];

  if (rows.length === 0) {
    return {
      found: true,
      switches: null,
      message: `${lead.name} hasn't compared material options yet.`,
    };
  }

  // Build unique materials list and find most-switched-to
  const toCounts: Record<string, number> = {};
  const allMaterials = new Set<string>();
  const timeline = rows.map((e: any) => {
    const m = e.metadata || {};
    if (m.previous_material) allMaterials.add(m.previous_material);
    if (m.new_material) {
      allMaterials.add(m.new_material);
      toCounts[m.new_material] = (toCounts[m.new_material] || 0) + 1;
    }
    return {
      from: m.previous_material || "unknown",
      to: m.new_material || "unknown",
      from_tier: m.previous_tier || null,
      to_tier: m.new_tier || null,
      at: e.created_at,
    };
  });

  const mostViewed = Object.entries(toCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const materials = Array.from(allMaterials);
  const count = rows.length;

  const switches: MaterialSwitchData = {
    lead_id: lead.id,
    lead_name: lead.name,
    switch_count: count,
    materials_compared: materials,
    most_viewed_material: mostViewed,
    switch_timeline: timeline,
  };

  const materialList = materials.join(" and ");
  const msg = count <= 2
    ? `${lead.name} looked at ${materialList} — just browsing so far.`
    : `${lead.name} toggled between ${materialList} ${count} times. They might appreciate a breakdown of the differences.`;

  return { found: true, switches, message: msg };
}

// ── Price Adjustment Types ──────────────────────────────────────────

export interface PriceAdjustmentData {
  lead_id: string;
  lead_name: string;
  adjustment_count: number;
  material_switches: number;
  addon_changes: number;
  first_estimate_material: string | null;
  last_estimate_material: string | null;
  last_price_low: number | null;
  last_price_high: number | null;
  materials_compared: string[];
  addons_added: string[];
  addons_removed: string[];
  timeline: Array<{
    type: "material_switch" | "addon";
    detail: string;
    at: string;
  }>;
}

// ── Price Adjustment Tool Functions ────────────────────────────────

/**
 * Get all price-affecting changes for a lead — material switches + addon toggles.
 * "How has Garcia's estimate changed?" / "Did they adjust their price?"
 * "What happened with the Smith estimate?"
 */
export async function getPriceAdjustmentsForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  nameOrId: string
): Promise<{ found: boolean; adjustments: PriceAdjustmentData | null; message: string }> {
  const lead = await getLeadDetailsForCopilot(supabase, contractorId, nameOrId);
  if (!lead) {
    return { found: false, adjustments: null, message: "No lead found matching that name." };
  }

  const { data: events } = await supabase
    .from("widget_events")
    .select("event_type, metadata, created_at")
    .eq("lead_id", lead.id)
    .in("event_type", ["material_switch", "price_adjustment"])
    .order("created_at", { ascending: true });

  const rows = events || [];

  if (rows.length === 0) {
    return {
      found: true,
      adjustments: null,
      message: `${lead.name} hasn't made any changes to their estimate.`,
    };
  }

  const materialSwitches = rows.filter((e: any) => e.event_type === "material_switch");
  const addonChanges = rows.filter((e: any) => e.event_type === "price_adjustment");

  // Track materials compared
  const allMaterials = new Set<string>();
  const addonsAdded = new Set<string>();
  const addonsRemoved = new Set<string>();

  let firstMaterial: string | null = null;
  let lastMaterial: string | null = null;
  let lastPriceLow: number | null = null;
  let lastPriceHigh: number | null = null;

  const timeline: PriceAdjustmentData["timeline"] = [];

  for (const row of materialSwitches) {
    const m = (row as any).metadata || {};
    if (m.previous_material) allMaterials.add(m.previous_material);
    if (m.new_material) {
      allMaterials.add(m.new_material);
      lastMaterial = m.new_material;
      if (!firstMaterial && m.previous_material) firstMaterial = m.previous_material;
    }
    if (m.new_price_low) lastPriceLow = m.new_price_low;
    if (m.new_price_high) lastPriceHigh = m.new_price_high;
    timeline.push({
      type: "material_switch",
      detail: `${m.previous_material || "unknown"} → ${m.new_material || "unknown"}`,
      at: (row as any).created_at,
    });
  }

  for (const row of addonChanges) {
    const m = (row as any).metadata || {};
    const addonName = m.addon_name || m.addon_id || "unknown";
    if (m.action === "added") addonsAdded.add(addonName);
    if (m.action === "removed") addonsRemoved.add(addonName);
    if (m.new_total_low) lastPriceLow = m.new_total_low;
    if (m.new_total_high) lastPriceHigh = m.new_total_high;
    timeline.push({
      type: "addon",
      detail: `${m.action === "removed" ? "Removed" : "Added"} ${addonName}`,
      at: (row as any).created_at,
    });
  }

  if (!firstMaterial && allMaterials.size > 0) {
    firstMaterial = Array.from(allMaterials)[0];
  }

  const adjustments: PriceAdjustmentData = {
    lead_id: lead.id,
    lead_name: lead.name,
    adjustment_count: rows.length,
    material_switches: materialSwitches.length,
    addon_changes: addonChanges.length,
    first_estimate_material: firstMaterial,
    last_estimate_material: lastMaterial,
    last_price_low: lastPriceLow,
    last_price_high: lastPriceHigh,
    materials_compared: Array.from(allMaterials),
    addons_added: Array.from(addonsAdded),
    addons_removed: Array.from(addonsRemoved),
    timeline,
  };

  // Build concise message
  const parts: string[] = [];
  parts.push(`${lead.name} made ${rows.length} change${rows.length === 1 ? "" : "s"} to their estimate.`);

  if (materialSwitches.length > 0 && allMaterials.size > 1) {
    parts.push(`Compared ${Array.from(allMaterials).join(" and ")}.`);
  }
  if (addonsAdded.size > 0) {
    parts.push(`Added: ${Array.from(addonsAdded).join(", ")}.`);
  }
  if (lastMaterial) {
    parts.push(`Last selection: ${lastMaterial}.`);
  }

  return { found: true, adjustments, message: parts.join(" ") };
}

// ── Chat Depth Score Types ───────────────────────────────────────────

export interface ChatDepthData {
  lead_id: string;
  lead_name: string;
  tier: "high_intent" | "engaged" | "browsing";
  message_count: number;
  question_types: string[];
  stage: string;
  situation: string;
  used_estimate_tool: boolean;
  provided_address: boolean;
  mentioned_specifics: boolean;
  high_intent_topics: string[];
  first_message_at: string | null;
  last_message_at: string | null;
  conversation_count: number;
}

const TOPIC_LABELS: Record<string, string> = {
  trust_seeking: "warranties & credentials",
  price_seeking: "pricing & financing",
  timeline_seeking: "timeline",
  scheduling: "scheduling",
  comparison: "comparing options",
  insurance: "insurance claim",
  emergency: "emergency",
};

// ── Chat Depth Score Tool Functions ──────────────────────────────────

/**
 * Analyze a lead's Riley chat conversations — message count, topics discussed,
 * and intent tier (browsing / engaged / high-intent).
 * "How serious is Garcia?" / "What did Wilson ask about?" / "Is Johnson interested?"
 */
export async function getChatDepthForCopilot(
  supabase: SupabaseClient,
  contractorId: string,
  nameOrId: string
): Promise<{ found: boolean; depth: ChatDepthData | null; message: string }> {
  const lead = await getLeadDetailsForCopilot(supabase, contractorId, nameOrId);
  if (!lead) {
    return { found: false, depth: null, message: "No lead found matching that name." };
  }

  // Query all Riley conversations for this lead
  const { data: conversations } = await supabase
    .from("chat_conversations")
    .select("messages, created_at, updated_at")
    .eq("lead_id", lead.id)
    .eq("type", "riley")
    .order("created_at", { ascending: true });

  const convos = conversations || [];

  if (convos.length === 0) {
    return {
      found: true,
      depth: null,
      message: `No Riley conversation on file for ${lead.name}. They may have come in through the estimate widget or contact form.`,
    };
  }

  // Combine all messages across sessions
  const allMessages: ChatMessage[] = [];
  let firstMessageAt: string | null = null;
  let lastMessageAt: string | null = null;

  for (const convo of convos) {
    const msgs = (convo.messages || []) as ChatMessage[];
    allMessages.push(...msgs);
    if (!firstMessageAt) firstMessageAt = convo.created_at;
    lastMessageAt = convo.updated_at || convo.created_at;
  }

  if (allMessages.length === 0) {
    return {
      found: true,
      depth: null,
      message: `${lead.name} has a Riley session on file but no messages recorded.`,
    };
  }

  // Run intent detection on combined messages
  const intent = detectIntent(allMessages);

  // Determine tier
  let tier: ChatDepthData["tier"] = "browsing";

  const isHighIntent =
    intent.stage === "decision" ||
    intent.stage === "close" ||
    intent.situation === "emergency" ||
    intent.situation === "insurance_claim" ||
    (intent.engagement.questionBreadth >= 3 && intent.engagement.messageCount >= 5) ||
    intent.engagement.usedEstimateTool;

  const isEngaged =
    intent.stage === "consideration" ||
    (intent.engagement.messageCount >= 4 && intent.engagement.questionBreadth >= 1) ||
    intent.engagement.mentionedSpecifics;

  if (isHighIntent) {
    tier = "high_intent";
  } else if (isEngaged) {
    tier = "engaged";
  }

  // Extract human-readable topic list
  const highIntentTopics = intent.questionTypes
    .filter((qt) => TOPIC_LABELS[qt])
    .map((qt) => TOPIC_LABELS[qt]);

  const depth: ChatDepthData = {
    lead_id: lead.id,
    lead_name: lead.name,
    tier,
    message_count: intent.engagement.messageCount,
    question_types: intent.questionTypes,
    stage: intent.stage,
    situation: intent.situation,
    used_estimate_tool: intent.engagement.usedEstimateTool,
    provided_address: intent.engagement.providedAddress,
    mentioned_specifics: intent.engagement.mentionedSpecifics,
    high_intent_topics: highIntentTopics,
    first_message_at: firstMessageAt,
    last_message_at: lastMessageAt,
    conversation_count: convos.length,
  };

  // Build message
  const msg = buildChatDepthMessage(depth);

  return { found: true, depth, message: msg };
}

function buildChatDepthMessage(d: ChatDepthData): string {
  const parts: string[] = [];
  const tierLabel = d.tier === "high_intent" ? "high-intent" : d.tier;

  // Tier + topic summary
  if (d.high_intent_topics.length > 0) {
    parts.push(
      `${d.lead_name} is ${tierLabel} — asked about ${d.high_intent_topics.join(", ")} across ${d.message_count} messages.`
    );
  } else {
    parts.push(
      `${d.lead_name} is ${tierLabel} — ${d.message_count} message${d.message_count === 1 ? "" : "s"}.`
    );
  }

  // Notable signals
  const signals: string[] = [];
  if (d.used_estimate_tool) signals.push("used the estimate tool");
  if (d.provided_address) signals.push("provided their address");
  if (d.mentioned_specifics) signals.push("mentioned specific materials");

  if (signals.length > 0) {
    // Capitalize first signal
    const joined = signals.join(", ");
    parts.push(joined.charAt(0).toUpperCase() + joined.slice(1) + ".");
  }

  // Multi-session note
  if (d.conversation_count > 1) {
    parts.push(`Came back ${d.conversation_count} separate times.`);
  }

  return parts.join(" ");
}

// ── Review Tool Types ─────────────────────────────────────────────────
// (moved down to keep engagement tools grouped above)

export function draftReviewResponseForCopilot(
  reviewText: string,
  starRating: number,
  businessName: string
): { review_text: string; star_rating: number; business_name: string; guidelines: string } {
  const isPositive = starRating >= 4;
  const guidelines = isPositive
    ? `This is a positive review (${starRating}/5 stars). Write a warm, genuine thank-you response. Reference a specific detail from their review to show you read it. Keep it under 3 sentences. Sign off with the business name. Don't be generic — make it personal.`
    : `This is a critical review (${starRating}/5 stars). Write a professional, empathetic response. Acknowledge their experience, apologize for the issue, and offer to resolve it offline ("please call us at..." or "email us at..."). Keep it under 4 sentences. Never be defensive or argue. Show you take feedback seriously. Sign off with the business name.`;

  return {
    review_text: reviewText,
    star_rating: starRating,
    business_name: businessName,
    guidelines,
  };
}
