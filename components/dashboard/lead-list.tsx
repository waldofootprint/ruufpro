"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  FileText,
  Pencil,
  ArrowUpDown,
  Flame,
  Clock,
  Home,
  CloudLightning,
  Wrench,
  Eye,
  Shuffle,
  BarChart3,
  DollarSign,
  MapPin,
  Shield,
  AlertTriangle,
  Star,
} from "lucide-react";
import type { Lead } from "@/lib/types";

// Lead with joined property data
export interface LeadWithDetails extends Lead {
  heatScore: number;
  propertyData?: {
    estimated_value?: number;
    value_range_low?: number;
    value_range_high?: number;
    year_built?: number;
    estimated_roof_age_years?: number;
    is_original_roof?: boolean;
    in_replacement_window?: boolean;
    owner_names?: string;
    owner_occupied?: boolean;
    last_sale_date?: string;
    last_sale_price?: number;
    square_footage?: number;
    flood_zone?: string;
    fema_disaster_count?: number;
    county_name?: string;
  };
  chatPreview?: {
    messages: { role: string; content: string }[];
    stage: string;
    messageCount: number;
    topics: string[];
  };
  signals?: {
    widgetViews: number;
    lastViewAt?: string;
    materialSwitches: number;
    materialsCompared?: string[];
    chatDepthTier?: string;
    priceAdjustments: number;
  };
  alerts: AlertBadge[];
}

type AlertBadge = {
  type: "stale" | "hot_activity" | "new_homeowner" | "storm" | "replacement";
  label: string;
};

type SortKey = "heat" | "newest" | "value";

// --- Heat Score Badge ---
function HeatBadge({ score }: { score: number }) {
  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cool";
  const color = tier === "hot" ? "#ef4444" : tier === "warm" ? "#f59e0b" : "var(--neu-text-muted)";
  return (
    <div
      className="neu-score flex h-10 w-10 items-center justify-center text-sm font-extrabold tabular-nums"
      style={{ color }}
    >
      {score}
    </div>
  );
}

// --- Alert Badge ---
function AlertBadgeComponent({ alert }: { alert: AlertBadge }) {
  const colors = {
    stale: { icon: Clock, color: "#ef4444" },
    hot_activity: { icon: Flame, color: "#f97316" },
    new_homeowner: { icon: Home, color: "#3b82f6" },
    storm: { icon: CloudLightning, color: "#eab308" },
    replacement: { icon: Wrench, color: "#8b5cf6" },
  }[alert.type];

  const Icon = colors.icon;
  return (
    <span
      className="neu-flat inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: colors.color }}
    >
      <Icon className="h-3 w-3" />
      {alert.label}
    </span>
  );
}

// --- Status Pill ---
function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "#3b82f6",
    contacted: "#10b981",
    appointment_set: "#8b5cf6",
    quoted: "#f59e0b",
    won: "#10b981",
    completed: "#10b981",
    lost: "var(--neu-text-muted)",
  };

  const labels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    appointment_set: "Appt Set",
    quoted: "Quoted",
    won: "Won",
    completed: "Completed",
    lost: "Lost",
  };

  return (
    <span
      className="neu-flat inline-block px-3 py-1 text-[11px] font-semibold"
      style={{ color: colors[status] || colors.new }}
    >
      {labels[status] || status}
    </span>
  );
}

// --- Time Ago Helper ---
function timeAgo(date: string | null): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// --- Status Selector ---
const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "appointment_set", label: "Appt Set" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "completed", label: "Completed" },
  { value: "lost", label: "Lost" },
] as const;

function StatusSelector({
  current,
  onChange,
}: {
  current: string;
  onChange: (status: string) => void;
}) {
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="neu-inset-deep text-xs font-semibold px-3 py-1.5 cursor-pointer focus:outline-none"
      style={{ color: "var(--neu-text)", background: "var(--neu-bg)" }}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

// --- Topic Label Map ---
const TOPIC_LABELS: Record<string, string> = {
  price_seeking: "Price",
  timeline_seeking: "Timeline",
  trust_seeking: "Trust",
  emergency: "Emergency",
  insurance: "Insurance",
  comparison: "Comparing",
  general_info: "General",
  scheduling: "Scheduling",
};

// --- Lead Accordion Detail ---
function LeadAccordion({
  lead,
  onStatusChange,
}: {
  lead: LeadWithDetails;
  onStatusChange?: (leadId: string, newStatus: string) => void;
}) {
  const pd = lead.propertyData;
  const signals = lead.signals;
  const chat = lead.chatPreview;

  return (
    <div className="px-4 pb-5 pt-4" style={{ borderTop: "1px solid var(--neu-border)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
        {/* Property Intel */}
        <div className="neu-inset p-4">
          <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide neu-muted mb-3">
            <Home className="h-3.5 w-3.5" /> Property Intel
          </h4>
          <div className="space-y-2">
            <DataRow label="Home Value" value={pd?.estimated_value ? `$${(pd.estimated_value / 1000).toFixed(0)}K` : "—"} />
            <DataRow label="Year Built" value={pd?.year_built?.toString() || "—"} />
            <DataRow
              label="Roof Age"
              value={pd?.estimated_roof_age_years ? `${pd.estimated_roof_age_years} yrs${pd.is_original_roof ? " (original)" : ""}` : "—"}
              alert={pd?.in_replacement_window}
            />
            <DataRow label="Owner" value={pd?.owner_names || "—"} />
            <DataRow
              label="Occupant"
              value={pd?.owner_occupied === true ? "Owner-occupied" : pd?.owner_occupied === false ? "Non-owner" : "—"}
            />
            <DataRow
              label="Purchased"
              value={pd?.last_sale_date ? new Date(pd.last_sale_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
              highlight={!!(pd?.last_sale_date && (Date.now() - new Date(pd.last_sale_date).getTime()) < 365 * 24 * 60 * 60 * 1000)}
            />
            <DataRow
              label="Sale Price"
              value={pd?.last_sale_price ? `$${(pd.last_sale_price / 1000).toFixed(0)}K` : "—"}
            />
            <DataRow label="Sq Ft" value={pd?.square_footage?.toLocaleString() || "—"} />
            <DataRow label="Flood Zone" value={pd?.flood_zone || "—"} />
            <DataRow label="FEMA Disasters" value={pd?.fema_disaster_count?.toString() || "—"} alert={pd?.fema_disaster_count ? pd.fema_disaster_count > 3 : false} />
          </div>
        </div>

        {/* Behavioral Signals */}
        <div className="neu-inset p-4">
          <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide neu-muted mb-3">
            <BarChart3 className="h-3.5 w-3.5" /> Signals
          </h4>
          <div className="space-y-2">
            <SignalRow
              icon={Eye}
              label="Estimate views"
              value={signals?.widgetViews ? `${signals.widgetViews} view${signals.widgetViews !== 1 ? "s" : ""}${signals.lastViewAt ? ` · ${timeAgo(signals.lastViewAt)}` : ""}` : "0 views"}
              warn={signals?.widgetViews ? signals.widgetViews >= 3 : false}
            />
            <SignalRow
              icon={Shuffle}
              label="Material switches"
              value={signals?.materialSwitches ? `${signals.materialSwitches}x${signals.materialsCompared?.length ? ` — ${signals.materialsCompared.join(", ")}` : ""}` : "—"}
              warn={signals?.materialSwitches ? signals.materialSwitches >= 2 : false}
            />
            <SignalRow
              icon={MessageSquare}
              label="Chat depth"
              value={signals?.chatDepthTier?.replace("_", " ") || "—"}
              good={signals?.chatDepthTier === "high_intent"}
            />
            <SignalRow
              icon={DollarSign}
              label="Price adjustments"
              value={signals?.priceAdjustments ? `${signals.priceAdjustments} change${signals.priceAdjustments !== 1 ? "s" : ""}` : "—"}
            />
          </div>
        </div>

        {/* Riley Chat + Copilot Insights */}
        <div className="flex flex-col gap-5">
          <div className="neu-inset p-4 flex-1">
            <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide neu-muted mb-3">
              <MessageSquare className="h-3.5 w-3.5" /> Riley Chat
            </h4>
            {chat && chat.messages.length > 0 ? (
              <>
                <div className="space-y-2 mb-3">
                  {chat.messages.slice(-3).map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm leading-relaxed max-w-[90%]",
                        msg.role === "user"
                          ? "neu-flat"
                          : "ml-auto"
                      )}
                      style={msg.role !== "user" ? { background: "var(--neu-accent)", color: "var(--neu-accent-fg)" } : { color: "var(--neu-text)" }}
                    >
                      {msg.content.length > 120 ? msg.content.slice(0, 120) + "..." : msg.content}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] neu-muted flex items-center gap-1.5">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    chat.stage === "decision" || chat.stage === "close" ? "bg-red-400" :
                    chat.stage === "consideration" ? "bg-amber-400" : "bg-emerald-400"
                  )} />
                  {chat.stage} · {chat.messageCount} message{chat.messageCount !== 1 ? "s" : ""}
                  {chat.topics.length > 0 && ` · ${chat.topics.map(t => TOPIC_LABELS[t] || t).join(", ")}`}
                </p>
              </>
            ) : (
              <p className="text-sm neu-muted">No conversation yet</p>
            )}
          </div>

          <div className="neu-inset p-4">
            <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide neu-muted mb-3">
              <Shield className="h-3.5 w-3.5" /> Copilot Insights
            </h4>
            <div className="space-y-1.5">
              {generateInsights(lead).map((insight, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-r-lg text-sm leading-relaxed"
                  style={{
                    borderLeft: "2px solid var(--neu-accent)",
                    color: "var(--neu-text)",
                  }}
                >
                  {insight}
                </div>
              ))}
              {generateInsights(lead).length === 0 && (
                <p className="text-sm neu-muted">Not enough data for insights</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons + Status */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="neu-accent-btn flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
          <Pencil className="h-4 w-4" /> Draft Follow-Up
        </button>
        {lead.phone && (
          <a href={`sms:${lead.phone}`}>
            <button className="neu-flat flex items-center gap-2 px-4 py-2.5 text-sm font-medium" style={{ color: "var(--neu-text)" }}>
              <Phone className="h-4 w-4" /> Text Lead
            </button>
          </a>
        )}
        <button className="neu-flat flex items-center gap-2 px-4 py-2.5 text-sm font-medium" style={{ color: "var(--neu-text)" }}>
          <FileText className="h-4 w-4" /> Send Estimate
        </button>
        {(lead.status === "won" || lead.status === "completed") && (
          <button className="neu-flat flex items-center gap-2 px-4 py-2.5 text-sm font-medium" style={{ color: "var(--neu-accent)" }}>
            <Star className="h-4 w-4" /> Request Review
          </button>
        )}

        {/* Status selector — pushed to the right */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide neu-muted">Status</span>
          <StatusSelector
            current={lead.status}
            onChange={(newStatus) => onStatusChange?.(lead.id, newStatus)}
          />
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value, alert, highlight }: { label: string; value: string; alert?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 last:border-0" style={{ borderBottom: "1px solid var(--neu-border)" }}>
      <span className="text-xs neu-muted">{label}</span>
      <span
        className="text-sm font-medium"
        style={{ color: alert ? "#ef4444" : highlight ? "var(--neu-accent)" : "var(--neu-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function SignalRow({ icon: Icon, label, value, warn, good }: { icon: any; label: string; value: string; warn?: boolean; good?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1.5 last:border-0" style={{ borderBottom: "1px solid var(--neu-border)" }}>
      <div className="neu-score flex h-7 w-7 items-center justify-center">
        <Icon className="h-3.5 w-3.5 neu-muted" />
      </div>
      <span className="text-xs neu-muted flex-1">{label}</span>
      <span
        className="text-sm font-medium"
        style={{ color: warn ? "#f97316" : good ? "#10b981" : "var(--neu-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function generateInsights(lead: LeadWithDetails): string[] {
  const insights: string[] = [];
  const pd = lead.propertyData;
  const sig = lead.signals;

  // Widget engagement insights
  if (sig?.widgetViews && sig.widgetViews >= 3) {
    insights.push(`Viewed estimate ${sig.widgetViews}x — very engaged`);
  }
  if (sig?.materialSwitches && sig.materialSwitches >= 2) {
    const materials = sig.materialsCompared?.join(" vs ") || `${sig.materialSwitches} options`;
    insights.push(`Compared ${materials} — actively researching`);
  }

  // Property insights
  if (pd?.estimated_roof_age_years && pd.estimated_roof_age_years >= 20) {
    insights.push(`${pd.estimated_roof_age_years}-year-old roof${pd.is_original_roof ? " — likely original" : ""}`);
  }
  if (pd?.estimated_value && lead.estimate_high) {
    const ratio = ((lead.estimate_high / pd.estimated_value) * 100).toFixed(1);
    if (Number(ratio) < 5) {
      insights.push(`Estimate is ${ratio}% of home value — very affordable`);
    }
  }
  if (pd?.last_sale_date) {
    const monthsAgo = Math.floor((Date.now() - new Date(pd.last_sale_date).getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (monthsAgo < 12) {
      insights.push(`Bought home ${monthsAgo} months ago — new homeowner`);
    }
  }
  if (pd?.fema_disaster_count && pd.fema_disaster_count > 3) {
    insights.push(`${pd.fema_disaster_count} FEMA disasters in ${pd.county_name || "county"}`);
  }

  // Chat insights
  if (lead.chatPreview?.topics.includes("scheduling")) {
    insights.push("Asked about scheduling — ready to act");
  }

  return insights.slice(0, 4);
}

// --- Main Lead List Component ---
interface LeadListProps {
  leads: LeadWithDetails[];
  onStatusChange?: (leadId: string, newStatus: string) => void;
}

export function LeadList({ leads, onStatusChange }: LeadListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("heat");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...leads].sort((a, b) => {
    if (sortKey === "heat") return b.heatScore - a.heatScore;
    if (sortKey === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortKey === "value") return (b.estimate_high || 0) - (a.estimate_high || 0);
    return 0;
  });

  return (
    <div>
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: "var(--neu-text)" }}>Leads</h2>
        <div className="flex gap-2">
          {(["heat", "newest", "value"] as SortKey[]).map((key) => (
            <button
              key={key}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-all",
                sortKey === key ? "neu-accent-btn" : "neu-flat neu-muted"
              )}
              onClick={() => setSortKey(key)}
            >
              {key === "heat" && "Heat Score"}
              {key === "newest" && "Newest"}
              {key === "value" && "Value"}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Table */}
      <div className="neu-raised overflow-hidden">
        {/* Header */}
        <div
          className="hidden lg:grid grid-cols-[48px_1.5fr_100px_120px_100px_100px_90px] gap-2 px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--neu-border)" }}
        >
          {["", "Lead", "Score", "Estimate", "Material", "Status", "Activity"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest neu-muted">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="p-12 text-center neu-muted">
            <p className="text-sm">No leads yet. They&apos;ll show up here as homeowners use your estimate widget or chat with Riley.</p>
          </div>
        ) : (
          sorted.map((lead) => {
            const isExpanded = expandedId === lead.id;
            return (
              <div key={lead.id}>
                {/* Row */}
                <div
                  className="grid grid-cols-[48px_1.5fr_100px_120px_100px_100px_90px] gap-2 px-4 py-3 items-center cursor-pointer transition-all"
                  style={{
                    borderBottom: "1px solid var(--neu-border)",
                    ...(isExpanded
                      ? { boxShadow: "inset 2px 2px 4px var(--neu-inset-dark), inset -2px -2px 4px var(--neu-inset-light)" }
                      : {}),
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  <HeatBadge score={lead.heatScore} />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--neu-text)" }}>{lead.name}</p>
                    <p className="text-xs truncate neu-muted">{lead.address || "No address"}</p>
                    {lead.alerts.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {lead.alerts.map((a, i) => (
                          <AlertBadgeComponent key={i} alert={a} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block" />

                  <p className="hidden lg:block text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
                    {lead.estimate_low && lead.estimate_high
                      ? `$${(lead.estimate_low / 1000).toFixed(0)}K – $${(lead.estimate_high / 1000).toFixed(0)}K`
                      : "—"}
                  </p>

                  <p className="hidden lg:block text-xs capitalize neu-muted">
                    {lead.estimate_material || "—"}
                  </p>

                  <div className="hidden lg:block">
                    <StatusPill status={lead.status} />
                  </div>

                  <p className="hidden lg:block text-xs neu-muted">
                    {timeAgo(lead.created_at)}
                  </p>
                </div>

                {/* Accordion */}
                {isExpanded && <LeadAccordion lead={lead} onStatusChange={onStatusChange} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
