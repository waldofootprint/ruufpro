"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums",
        tier === "hot" && "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
        tier === "warm" && "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
        tier === "cool" && "bg-muted text-muted-foreground"
      )}
    >
      {score}
    </div>
  );
}

// --- Alert Badge ---
function AlertBadgeComponent({ alert }: { alert: AlertBadge }) {
  const config = {
    stale: { icon: Clock, className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
    hot_activity: { icon: Flame, className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
    new_homeowner: { icon: Home, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
    storm: { icon: CloudLightning, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" },
    replacement: { icon: Wrench, className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  }[alert.type];

  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold", config.className)}>
      <Icon className="h-3 w-3" />
      {alert.label}
    </span>
  );
}

// --- Status Pill ---
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-emerald-100 text-emerald-700",
    appointment_set: "bg-violet-100 text-violet-700",
    quoted: "bg-amber-100 text-amber-700",
    won: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    lost: "bg-muted text-muted-foreground",
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
    <span className={cn("inline-block px-3 py-1 rounded-full text-[11px] font-semibold", styles[status] || styles.new)}>
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

// --- Lead Accordion Detail ---
function LeadAccordion({ lead }: { lead: LeadWithDetails }) {
  const pd = lead.propertyData;
  const signals = lead.signals;
  const chat = lead.chatPreview;

  return (
    <div className="bg-muted/30 border-t border-border px-4 pb-5 pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Property Intel */}
        <Card className="p-4">
          <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
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
              label="Purchased"
              value={pd?.last_sale_date ? new Date(pd.last_sale_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
              highlight={!!(pd?.last_sale_date && (Date.now() - new Date(pd.last_sale_date).getTime()) < 365 * 24 * 60 * 60 * 1000)}
            />
            <DataRow label="Sq Ft" value={pd?.square_footage?.toLocaleString() || "—"} />
            <DataRow label="Flood Zone" value={pd?.flood_zone || "—"} />
            <DataRow label="FEMA Disasters" value={pd?.fema_disaster_count?.toString() || "—"} alert={pd?.fema_disaster_count ? pd.fema_disaster_count > 3 : false} />
          </div>
        </Card>

        {/* Behavioral Signals */}
        <Card className="p-4">
          <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
            <BarChart3 className="h-3.5 w-3.5" /> Signals
          </h4>
          <div className="space-y-2">
            <SignalRow icon={Eye} label="Estimate views" value={`${signals?.widgetViews ?? 0} views`} warn={signals?.widgetViews ? signals.widgetViews >= 3 : false} />
            <SignalRow icon={Shuffle} label="Material switches" value={signals?.materialsCompared?.join(", ") || "—"} />
            <SignalRow icon={MessageSquare} label="Chat depth" value={signals?.chatDepthTier || "—"} good={signals?.chatDepthTier === "high_intent"} />
            <SignalRow icon={DollarSign} label="Price adjustments" value={`${signals?.priceAdjustments ?? 0} changes`} />
          </div>
        </Card>

        {/* Riley Chat + Copilot Insights */}
        <div className="flex flex-col gap-4">
          <Card className="p-4 flex-1">
            <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
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
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground ml-auto"
                      )}
                    >
                      {msg.content.length > 120 ? msg.content.slice(0, 120) + "..." : msg.content}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  {chat.stage} · {chat.messageCount} messages
                  {chat.topics.length > 0 && ` · ${chat.topics.join(", ")}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No conversation yet</p>
            )}
          </Card>

          <Card className="p-4">
            <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
              <Shield className="h-3.5 w-3.5" /> Copilot Insights
            </h4>
            <div className="space-y-1.5">
              {generateInsights(lead).map((insight, i) => (
                <div key={i} className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-emerald-500 rounded-r-lg text-sm text-foreground leading-relaxed">
                  {insight}
                </div>
              ))}
              {generateInsights(lead).length === 0 && (
                <p className="text-sm text-muted-foreground">Not enough data for insights</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
          <Pencil className="h-4 w-4" /> Draft Follow-Up
        </Button>
        <a href={`sms:${lead.phone}`}>
          <Button variant="outline" className="gap-2">
            <Phone className="h-4 w-4" /> Text Lead
          </Button>
        </a>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" /> Send Estimate
        </Button>
      </div>
    </div>
  );
}

function DataRow({ label, value, alert, highlight }: { label: string; value: string; alert?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", alert && "text-red-600 dark:text-red-400", highlight && "text-orange-600 dark:text-orange-400")}>
        {value}
      </span>
    </div>
  );
}

function SignalRow({ icon: Icon, label, value, warn, good }: { icon: any; label: string; value: string; warn?: boolean; good?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", warn ? "bg-orange-100 dark:bg-orange-950" : good ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted")}>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className={cn("text-sm font-medium", warn && "text-orange-600", good && "text-emerald-600")}>{value}</span>
    </div>
  );
}

function generateInsights(lead: LeadWithDetails): string[] {
  const insights: string[] = [];
  const pd = lead.propertyData;
  const sig = lead.signals;

  if (sig?.materialSwitches && sig.materialSwitches >= 2) {
    insights.push(`Compared materials ${sig.materialSwitches}x — actively researching options`);
  }
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

  return insights.slice(0, 3);
}

// --- Main Lead List Component ---
interface LeadListProps {
  leads: LeadWithDetails[];
}

export function LeadList({ leads }: LeadListProps) {
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Leads</h2>
        <div className="flex gap-1.5">
          {(["heat", "newest", "value"] as SortKey[]).map((key) => (
            <button
              key={key}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                sortKey === key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              )}
              onClick={() => setSortKey(key)}
            >
              {key === "heat" && "🔥 Heat Score"}
              {key === "newest" && "Newest"}
              {key === "value" && "Value"}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Table */}
      <div className="rounded-2xl bg-card border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header */}
        <div className="hidden lg:grid grid-cols-[48px_1.5fr_100px_120px_100px_100px_90px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
          {["", "Lead", "Score", "Estimate", "Material", "Status", "Activity"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-sm">No leads yet. They&apos;ll show up here as homeowners use your estimate widget or chat with Riley.</p>
          </div>
        ) : (
          sorted.map((lead) => {
            const isExpanded = expandedId === lead.id;
            return (
              <div key={lead.id} className={cn(isExpanded && "bg-muted/20")}>
                {/* Row */}
                <div
                  className={cn(
                    "grid grid-cols-[48px_1.5fr_100px_120px_100px_100px_90px] gap-2 px-4 py-3 items-center cursor-pointer transition-colors border-b border-border/50",
                    isExpanded ? "bg-muted/40" : "hover:bg-muted/20"
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  <HeatBadge score={lead.heatScore} />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.address || "No address"}</p>
                    {lead.alerts.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {lead.alerts.map((a, i) => (
                          <AlertBadgeComponent key={i} alert={a} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block" />

                  <p className="hidden lg:block text-sm font-semibold text-foreground">
                    {lead.estimate_low && lead.estimate_high
                      ? `$${(lead.estimate_low / 1000).toFixed(0)}K – $${(lead.estimate_high / 1000).toFixed(0)}K`
                      : "—"}
                  </p>

                  <p className="hidden lg:block text-xs text-muted-foreground capitalize">
                    {lead.estimate_material || "—"}
                  </p>

                  <div className="hidden lg:block">
                    <StatusPill status={lead.status} />
                  </div>

                  <p className="hidden lg:block text-xs text-muted-foreground">
                    {timeAgo(lead.created_at)}
                  </p>
                </div>

                {/* Accordion */}
                {isExpanded && <LeadAccordion lead={lead} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
