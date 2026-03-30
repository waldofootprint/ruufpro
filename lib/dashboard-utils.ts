// Dashboard helper functions.
// Pure utilities — no React, no Supabase, just data in → data out.

import type { Lead, LeadTemperature } from "./types";

// Map timeline to temperature tag
export function getLeadTemperature(lead: Lead): LeadTemperature | null {
  if (!lead.timeline) return null;
  if (lead.timeline === "now") return "hot";
  if (lead.timeline === "1_3_months") return "warm";
  return "browsing";
}

// Status dot color class based on lead state + temperature
export function getStatusDotColor(lead: Lead): string {
  if (lead.status === "won") return "bg-green-500";
  if (lead.status === "lost") return "bg-slate-300";
  if (lead.status === "contacted" || lead.status === "quoted") return "bg-green-500";
  // status === "new"
  const temp = getLeadTemperature(lead);
  if (temp === "hot") return "bg-red-500";
  if (temp === "warm") return "bg-amber-500";
  return "bg-slate-400";
}

// Speed-to-lead: time between lead creation and first contact
export function getSpeedToLead(lead: Lead): string | null {
  if (!lead.contacted_at) return null;
  const created = new Date(lead.created_at).getTime();
  const contacted = new Date(lead.contacted_at).getTime();
  const diffMs = contacted - created;
  if (diffMs < 0) return null;

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Human-readable time ago
export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Sum revenue from won leads (uses estimate_low as conservative figure)
export function calculateRevenue(leads: Lead[]): number {
  return leads
    .filter((l) => l.status === "won" && l.estimate_low)
    .reduce((sum, l) => sum + (l.estimate_low || 0), 0);
}

// Average response time across contacted leads
export function getAvgResponseTime(leads: Lead[]): string | null {
  const contactedLeads = leads.filter((l) => l.contacted_at);
  if (contactedLeads.length === 0) return null;

  const totalMs = contactedLeads.reduce((sum, l) => {
    const created = new Date(l.created_at).getTime();
    const contacted = new Date(l.contacted_at!).getTime();
    return sum + (contacted - created);
  }, 0);

  const avgMins = Math.floor(totalMs / contactedLeads.length / 60000);
  if (avgMins < 1) return "<1m";
  if (avgMins < 60) return `${avgMins}m`;
  const hours = Math.floor(avgMins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Temperature tag display config
export function getTemperatureConfig(temp: LeadTemperature | null): {
  label: string;
  className: string;
} | null {
  if (!temp) return null;
  if (temp === "hot")
    return { label: "Hot", className: "bg-red-50 text-red-600" };
  if (temp === "warm")
    return { label: "Warm", className: "bg-amber-50 text-amber-600" };
  return { label: "Browsing", className: "bg-slate-100 text-slate-500" };
}
