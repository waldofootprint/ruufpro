"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import type { Lead } from "@/lib/types";
import { getLeadTemperature, formatTimeAgo as fmtTimeAgo } from "@/lib/dashboard-utils";
import {
  Phone,
  Mail,
  Send,
  Edit3,
  Star,
  Gift,
  ChevronRight,
  CloudLightning,
  MessageSquare,
  FileEdit,
  Check,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface LeadData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  temperature: string | null;
  source: string;
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_material: string | null;
  created_at: string;
  created_ago: string;
  contacted_at: string | null;
  notes: string | null;
}

type FilterType = "all" | "urgent" | "followup" | "review";
type ToneType = "direct" | "warm" | "formal";

// Status pills for progression (manual only — no auto-advance)
const STATUS_PILLS = ["Called", "Inspection Set", "Quote Sent", "Won"] as const;
type StatusPill = (typeof STATUS_PILLS)[number];

// ── Helpers ──────────────────────────────────────────────────────────────

function getUrgencyDot(lead: LeadData): { color: string; pulse: boolean; label: string; priority: number } {
  const hours = (Date.now() - new Date(lead.created_at).getTime()) / 3600000;

  // Emergency: hot lead under 1h
  if ((lead.temperature === "hot" || lead.status === "new") && hours < 1)
    return { color: "bg-red-500", pulse: true, label: "Emergency", priority: 0 };

  // Urgent: new/hot lead under 24h
  if ((lead.temperature === "hot" || lead.status === "new") && hours < 24)
    return { color: "bg-red-500", pulse: false, label: "Urgent", priority: 1 };

  // Going cold: new/hot lead over 24h — needs attention NOW
  if ((lead.temperature === "hot" || lead.status === "new") && !lead.contacted_at)
    return { color: "bg-orange-500", pulse: false, label: "Going cold", priority: 2 };

  // Follow-up: quoted leads waiting for response
  if (lead.status === "quoted")
    return { color: "bg-amber-500", pulse: false, label: "Follow-up", priority: 3 };

  // Active: in progress, no urgency
  if (lead.status === "contacted" || lead.status === "appointment_set")
    return { color: "bg-emerald-500", pulse: false, label: "Active", priority: 4 };

  // Completed: done, review/referral opportunity
  if (lead.status === "completed")
    return { color: "bg-emerald-400", pulse: false, label: "Completed", priority: 5 };

  // Won: celebrate
  if (lead.status === "won")
    return { color: "bg-emerald-500", pulse: false, label: "Won", priority: 5 };

  // Lost / everything else
  return { color: "bg-slate-300", pulse: false, label: "Browsing", priority: 6 };
}

function getStatusActions(lead: LeadData): {
  primary: { label: string; icon: typeof Send; variant: "filled" | "outline" };
  secondary: { label: string; icon: typeof Edit3 }[];
} {
  const s = lead.status;
  if (s === "completed") {
    return {
      primary: { label: "Ask for Review", icon: Star, variant: "filled" },
      secondary: [{ label: "Ask for Referral", icon: Gift }],
    };
  }
  if (s === "quoted") {
    const daysSinceQuote = lead.contacted_at
      ? (Date.now() - new Date(lead.contacted_at).getTime()) / 86400000
      : 999;
    return {
      primary: { label: daysSinceQuote > 4 ? "Re-engage" : "Follow Up", icon: Send, variant: "filled" },
      secondary: [{ label: "Edit", icon: Edit3 }, { label: "Call", icon: Phone }],
    };
  }
  // Default: new, contacted, appointment_set
  return {
    primary: { label: "Send Text", icon: Send, variant: "filled" },
    secondary: [{ label: "Edit", icon: Edit3 }, { label: "Call", icon: Phone }],
  };
}

function formatEstimate(low: number | null, high: number | null): string {
  if (!low && !high) return "No estimate";
  if (low && high) return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
  if (low) return `$${low.toLocaleString()}`;
  return `$${(high as number).toLocaleString()}`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getStatusLabel(lead: LeadData): string | null {
  if (lead.status === "new" && lead.temperature === "hot") return "EMERGENCY";
  if (lead.status === "quoted") return "QUOTED";
  if (lead.status === "contacted") return "CONTACTED";
  if (lead.status === "appointment_set") return "INSPECTION SET";
  if (lead.status === "completed") return "COMPLETED";
  if (lead.status === "won") return "WON";
  if (lead.status === "lost") return "LOST";
  return null;
}

function getStatusColor(label: string | null): string {
  if (!label) return "";
  if (label === "EMERGENCY") return "text-red-600 bg-red-50 border-red-200";
  if (label === "WON") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (label === "COMPLETED") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (label === "LOST") return "text-slate-400 bg-slate-50 border-slate-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
}

function generateDraft(lead: LeadData, tone: ToneType, businessName: string): string {
  const first = lead.name.split(" ")[0];
  if (lead.status === "completed") {
    if (tone === "direct") return `Hi ${first}, thanks for choosing ${businessName}. Would you mind leaving us a quick Google review? It really helps us out.`;
    if (tone === "warm") return `Hey ${first}! It was great working on your roof. If you have a minute, we'd really appreciate a Google review — it means a lot to a small business like ours.`;
    return `${first}, thank you for trusting ${businessName} with your roofing project. If you were satisfied with our work, we would be grateful for a Google review at your convenience.`;
  }
  if (lead.status === "quoted") {
    if (tone === "direct") return `Hey ${first}, just checking in on the estimate I sent over. Happy to answer any questions or walk through the numbers. No pressure.`;
    if (tone === "warm") return `Hi ${first}! Just wanted to follow up on your estimate — I know it's a big decision. Happy to chat through anything or adjust the scope if needed.`;
    return `${first}, I wanted to follow up regarding the estimate we provided. Please don't hesitate to reach out if you have any questions about the scope or pricing.`;
  }
  // New / contacted / default
  if (tone === "direct") return `Hey ${first}! Mike here from ${businessName}. Sorry to hear about the leak — I know that's stressful. I can come take a look today. Does 2pm or 4pm work better for you?`;
  if (tone === "warm") return `Hi ${first}, this is Mike from ${businessName}. Thanks so much for reaching out — I'd love to help with your roofing needs. When would be a good time for a free inspection?`;
  return `${first}, thank you for contacting ${businessName}. We would be happy to schedule a complimentary inspection at your earliest convenience. Please let us know what dates work best for your schedule.`;
}

function matchesFilter(lead: LeadData, filter: FilterType): boolean {
  if (filter === "all") return true;
  if (filter === "urgent") return lead.temperature === "hot" || (lead.status === "new" && !lead.contacted_at);
  if (filter === "followup") return lead.status === "quoted" || lead.status === "contacted";
  if (filter === "review") return lead.status === "completed";
  return true;
}

// ── Main Component ───────────────────────────────────────────────────────

export default function CopilotPage() {
  const { contractorId, businessName, tier } = useDashboard();
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tone, setTone] = useState<ToneType>("direct");
  const [activeTab, setActiveTab] = useState<"detail" | "chat">("detail");
  const [activePills, setActivePills] = useState<Set<StatusPill>>(new Set());
  const [noteText, setNoteText] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState<{ leadId: string; action: string; time: number }[]>([]);

  // Direct Supabase fetch — same pattern as leads page
  useEffect(() => {
    async function loadLeads() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(50);

      const raw = (data as Lead[]) || [];
      const mapped: LeadData[] = raw.map((l) => ({
        id: l.id,
        name: l.name || "Unknown",
        phone: l.phone,
        email: l.email,
        address: l.address,
        status: l.status || "new",
        temperature: getLeadTemperature(l),
        source: l.source || "estimate_widget",
        estimate_low: l.estimate_low,
        estimate_high: l.estimate_high,
        estimate_material: l.estimate_material,
        created_at: l.created_at,
        created_ago: fmtTimeAgo(l.created_at),
        contacted_at: l.contacted_at,
        notes: l.notes,
      }));
      setLeads(mapped);
      if (mapped.length > 0) setSelectedLead(mapped[0]);
      setLoading(false);
    }
    loadLeads();
  }, [contractorId]);

  // Filter + sort by urgency priority (emergency first, browsing last)
  const filteredLeads = leads
    .filter((l) => matchesFilter(l, filter))
    .sort((a, b) => {
      const pa = getUrgencyDot(a).priority;
      const pb = getUrgencyDot(b).priority;
      if (pa !== pb) return pa - pb;
      // Within same priority, newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Get last action for a lead
  function getLastAction(leadId: string) {
    const actions = actionLog.filter((a) => a.leadId === leadId);
    if (actions.length === 0) return null;
    const last = actions[actions.length - 1];
    const ago = formatTimeAgo(new Date(last.time).toISOString());
    return `${last.action} · ${ago}`;
  }

  // Action handlers — these LOG actions, they do NOT change status
  function handleSendText(lead: LeadData) {
    const draft = generateDraft(lead, tone, businessName);
    const encoded = encodeURIComponent(draft);
    window.open(`sms:${lead.phone}?body=${encoded}`, "_self");
    setActionLog((prev) => [...prev, { leadId: lead.id, action: "Texted", time: Date.now() }]);
  }

  function handleCall(lead: LeadData) {
    window.open(`tel:${lead.phone}`, "_self");
    setActionLog((prev) => [...prev, { leadId: lead.id, action: "Called", time: Date.now() }]);
  }

  function handleSendEmail(lead: LeadData) {
    // TODO: Wire Resend API for actual delivery
    setActionLog((prev) => [...prev, { leadId: lead.id, action: "Emailed", time: Date.now() }]);
  }

  // Toggle status pill — manual milestones only
  function togglePill(pill: StatusPill) {
    setActivePills((prev) => {
      const next = new Set(prev);
      if (next.has(pill)) next.delete(pill);
      else next.add(pill);
      return next;
    });
  }

  // Pro tier gate
  if (tier === "free") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Copilot Lead Console</h2>
          <p className="text-sm text-slate-500 mb-6">
            AI-powered lead management that drafts responses, scores leads, and tells you exactly what to do next.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            Upgrade to Pro — $149/mo
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-sm">Loading leads...</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden">
      {/* ===== LEFT: Lead Queue Panel ===== */}
      <div className="w-[380px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
          {(["all", "urgent", "followup", "review"] as FilterType[]).map((f) => {
            const labels: Record<FilterType, string> = {
              all: "All",
              urgent: "Urgent",
              followup: "Follow-up",
              review: "Review",
            };
            const count = leads.filter((l) => matchesFilter(l, f)).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? f === "urgent" ? "bg-red-600 text-white" : "bg-slate-800 text-white"
                    : f === "urgent" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f === "urgent" && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                {labels[f]}
                {f !== "all" && count > 0 && (
                  <span className={`text-[10px] ${filter === f ? "text-white/70" : "text-slate-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lead Cards */}
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-400">No leads match this filter</p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const dot = getUrgencyDot(lead);
              const actions = getStatusActions(lead);
              const isSelected = selectedLead?.id === lead.id;
              const lastAction = getLastAction(lead.id);

              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLead(lead);
                    setActivePills(new Set());
                    setNoteText(lead.notes || "");
                  }}
                  className={`px-5 py-4 border-b border-slate-100 cursor-pointer transition-colors ${
                    isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* Name + urgency dot + time */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex-shrink-0 w-2.5 h-2.5">
                        {dot.pulse && (
                          <span className={`animate-ping absolute inset-0 rounded-full ${dot.color} opacity-75`} />
                        )}
                        <span className={`relative block w-2.5 h-2.5 rounded-full ${dot.color}`} />
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{lead.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {lead.status !== "new" && lead.status !== "lost"
                        ? `${lead.status.replace("_", " ")} ${formatTimeAgo(lead.contacted_at || lead.created_at)}`
                        : formatTimeAgo(lead.created_at)}
                    </span>
                  </div>

                  {/* Job type */}
                  <p className="text-xs text-slate-500 mb-0.5 ml-4">
                    {lead.estimate_material
                      ? `${lead.source === "ai_chatbot" ? "Chat request" : "Estimate request"}`
                      : "Contact request"}
                  </p>

                  {/* Estimate range */}
                  <p className="text-xs text-slate-600 font-medium ml-4 mb-2">
                    {formatEstimate(lead.estimate_low, lead.estimate_high)}
                    {lead.estimate_material && ` · ${lead.estimate_material}`}
                  </p>

                  {/* Draft preview */}
                  {lead.status !== "lost" && (
                    <div className="ml-4 mb-3 p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg">
                      <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-3">
                        {generateDraft(lead, "direct", businessName)}
                      </p>
                    </div>
                  )}

                  {/* Last action indicator */}
                  {lastAction && (
                    <div className="ml-4 mb-2 flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] text-slate-400">{lastAction}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (lead.phone) handleSendText(lead);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <actions.primary.icon className="w-3 h-3" />
                      {actions.primary.label}
                    </button>
                    {actions.secondary.map((sec) => (
                      <button
                        key={sec.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sec.label === "Call" && lead.phone) handleCall(lead);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors"
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== RIGHT: Center Panel ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!selectedLead ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Select a lead to view details</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex items-center gap-6 px-8 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("detail")}
                className={`py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "detail"
                    ? "border-slate-800 text-slate-800"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Lead Detail
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "chat"
                    ? "border-slate-800 text-slate-800"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Chat
              </button>
            </div>

            {activeTab === "detail" ? (
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                {/* ── A. Lead Header ── */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-slate-800">{selectedLead.name}</h1>
                      {(() => {
                        const label = getStatusLabel(selectedLead);
                        if (!label) return null;
                        return (
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(label)}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-slate-400">
                      {selectedLead.address || "No address"}
                      {" · "}
                      {formatTimeAgo(selectedLead.created_at)}
                      {" · "}
                      {selectedLead.source.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLead.phone && (
                      <button
                        onClick={() => handleCall(selectedLead)}
                        className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                    {selectedLead.email && (
                      <button
                        onClick={() => handleSendEmail(selectedLead)}
                        className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── B. Draft Response (Hero Element) ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  {/* Tone Toggle */}
                  <div className="flex items-center gap-1 mb-4">
                    {(["direct", "warm", "formal"] as ToneType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                          tone === t
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Draft Text */}
                  <p className="text-sm text-slate-700 italic leading-relaxed mb-5">
                    &ldquo;{generateDraft(selectedLead, tone, businessName)}&rdquo;
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {selectedLead.phone && (
                      <button
                        onClick={() => handleSendText(selectedLead)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Text
                      </button>
                    )}
                    {selectedLead.email && (
                      <button
                        onClick={() => handleSendEmail(selectedLead)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Send as Email
                      </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Edit Draft
                    </button>
                  </div>
                </div>

                {/* ── C. Three-Column Info Grid ── */}
                <div className="grid grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden">
                  {/* Details */}
                  <div className="p-5 border-r border-slate-200">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Details
                    </h3>
                    <div className="space-y-2.5">
                      <InfoRow label="Job" value={selectedLead.source === "ai_chatbot" ? "Chat request" : "Estimate request"} />
                      <InfoRow label="Estimate" value={formatEstimate(selectedLead.estimate_low, selectedLead.estimate_high)} />
                      <InfoRow label="Material" value={selectedLead.estimate_material || "—"} />
                      <InfoRow label="Phone" value={selectedLead.phone || "—"} />
                      <InfoRow label="Email" value={selectedLead.email || "—"} />
                    </div>
                  </div>

                  {/* Property Intel */}
                  <div className="p-5 border-r border-slate-200">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Property
                    </h3>
                    <div className="space-y-2.5">
                      <InfoRow label="Built" value="—" />
                      <InfoRow label="Size" value="—" />
                      <InfoRow label="Roof age" value="—" />
                      <InfoRow label="Last sale" value="—" />
                      <InfoRow label="Roof" value="—" />
                    </div>
                    <p className="text-[10px] text-slate-300 mt-3 italic">Property data coming soon</p>
                  </div>

                  {/* Score */}
                  <div className="p-5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Score
                    </h3>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-slate-800">—</p>
                      <p className="text-xs text-slate-400 mt-1">Score coming soon</p>
                    </div>
                  </div>
                </div>

                {/* ── D. Context Row ── */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Weather Alert (conditional — placeholder) */}
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudLightning className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">Weather alert</span>
                    </div>
                    <p className="text-[11px] text-amber-600 leading-relaxed">
                      Weather data coming soon
                    </p>
                  </div>

                  {/* Talking Point */}
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">Talking point</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 italic leading-relaxed">
                      {selectedLead.estimate_material
                        ? `"${selectedLead.estimate_material} is a solid choice for Florida weather — ask about their timeline and any storm damage concerns."`
                        : `"Ask about their timeline and what's driving the project — understanding urgency helps you close."`}
                    </p>
                  </div>

                  {/* Next Steps */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Next
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-slate-300 font-mono">1</span> Text or call now
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-slate-300 font-mono">2</span> Schedule inspection
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-slate-300 font-mono">3</span> Send estimate
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── E. Status Progression ── */}
                <div className="flex items-center gap-3 py-2">
                  {STATUS_PILLS.map((pill, i) => {
                    const active = activePills.has(pill);
                    return (
                      <div key={pill} className="flex items-center gap-3">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                        <button
                          onClick={() => togglePill(pill)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? "bg-slate-800 text-white border-slate-800"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          {pill}
                          {pill === "Won" && " \u{1F389}"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ── F. Quick Notes ── */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setNotesOpen(!notesOpen)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {noteText ? "View notes" : "Add a note after your call..."}
                    </span>
                  </button>
                  {notesOpen && (
                    <div className="px-4 pb-4">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="What happened on the call? Any next steps?"
                        className="w-full h-24 text-sm text-slate-700 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chat Tab — Placeholder for now */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Chat with Copilot coming soon</p>
                  <p className="text-xs text-slate-300 mt-1">Ask about any lead or get a morning briefing</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  const isRedFlag = label === "Roof age" && value.includes("original");
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-medium ${isRedFlag ? "text-red-500" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}
