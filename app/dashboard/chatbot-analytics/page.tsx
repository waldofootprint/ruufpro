// Riley Analytics — Shows chatbot performance metrics.
// Conversation volume, lead conversion, top questions, speed metrics.
// Pro tier only.

"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import {
  Bot,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationRow {
  id: string;
  session_id: string;
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>;
  lead_captured: boolean;
  created_at: string;
  updated_at: string;
}

interface LeadRow {
  id: string;
  status: string;
  source: string;
  created_at: string;
  contacted_at: string | null;
}

interface DayBucket {
  label: string;
  conversations: number;
  leads: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMessageText(msg: { content?: string; parts?: Array<{ type: string; text?: string }> }): string {
  if (msg.parts) {
    return msg.parts.filter((p) => p.type === "text" && p.text).map((p) => p.text).join("");
  }
  return msg.content || "";
}

function dayKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function avgMinutes(leads: LeadRow[]): number | null {
  const withContact = leads.filter((l) => l.contacted_at);
  if (withContact.length === 0) return null;
  const total = withContact.reduce((sum, l) => {
    const diff = new Date(l.contacted_at!).getTime() - new Date(l.created_at).getTime();
    return sum + diff;
  }, 0);
  return Math.round(total / withContact.length / 60000);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatbotAnalyticsPage() {
  const { contractorId, tier } = useDashboard();

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  // Fetch data
  useEffect(() => {
    async function load() {
      if (!contractorId) return;

      const [convRes, leadRes] = await Promise.all([
        supabase
          .from("chat_conversations")
          .select("id, session_id, messages, lead_captured, created_at, updated_at")
          .eq("contractor_id", contractorId)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("leads")
          .select("id, status, source, created_at, contacted_at")
          .eq("contractor_id", contractorId)
          .eq("source", "ai_chatbot")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      setConversations(convRes.data || []);
      setLeads(leadRes.data || []);
      setLoading(false);
    }
    load();
  }, [contractorId]);

  // Filter by range
  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "7d" ? now - 7 * 86400000
      : range === "30d" ? now - 30 * 86400000
      : 0;

    return {
      conversations: conversations.filter((c) => new Date(c.created_at).getTime() >= cutoff),
      leads: leads.filter((l) => new Date(l.created_at).getTime() >= cutoff),
    };
  }, [conversations, leads, range]);

  // Compute metrics
  const metrics = useMemo(() => {
    const convos = filtered.conversations;
    const lds = filtered.leads;

    const totalConversations = convos.length;
    const totalLeads = lds.length;
    const conversionRate = totalConversations > 0 ? Math.round((totalLeads / totalConversations) * 100) : 0;

    // Avg messages per conversation
    const totalMsgs = convos.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
    const avgMessages = totalConversations > 0 ? (totalMsgs / totalConversations).toFixed(1) : "0";

    // Speed to contact
    const speedMin = avgMinutes(lds);

    // Lead statuses
    const statusCounts: Record<string, number> = {};
    lds.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    // Top questions — extract first user message from each conversation
    const questionCounts: Record<string, number> = {};
    convos.forEach((c) => {
      const firstUser = c.messages?.find((m) => m.role === "user");
      if (firstUser) {
        const text = getMessageText(firstUser).toLowerCase().trim();
        if (text.length > 5 && text.length < 200) {
          // Bucket by keyword
          const bucket =
            text.includes("cost") || text.includes("price") || text.includes("how much") ? "Pricing / cost questions"
            : text.includes("insurance") || text.includes("claim") ? "Insurance / claims"
            : text.includes("material") || text.includes("shingle") || text.includes("metal") ? "Materials & brands"
            : text.includes("how long") || text.includes("timeline") || text.includes("when") ? "Timeline / scheduling"
            : text.includes("warranty") || text.includes("guarantee") ? "Warranty questions"
            : text.includes("financing") || text.includes("payment") || text.includes("afford") ? "Financing / payments"
            : text.includes("emergency") || text.includes("leak") || text.includes("storm") ? "Emergency / urgent"
            : text.includes("inspect") || text.includes("estimate") || text.includes("quote") ? "Free inspection / estimate"
            : "Other questions";
          questionCounts[bucket] = (questionCounts[bucket] || 0) + 1;
        }
      }
    });

    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Daily buckets for chart (last 14 days for 30d, last 7 for 7d)
    const chartDays = range === "7d" ? 7 : 14;
    const buckets: DayBucket[] = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d.toISOString());
      buckets.push({
        label: dayLabel(d.toISOString()),
        conversations: convos.filter((c) => dayKey(c.created_at) === key).length,
        leads: lds.filter((l) => dayKey(l.created_at) === key).length,
      });
    }

    return { totalConversations, totalLeads, conversionRate, avgMessages, speedMin, statusCounts, topQuestions, buckets };
  }, [filtered, range]);

  // --- Tier gate ---
  if (tier === "free") {
    return (
      <div className="max-w-[480px] mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
          <Bot className="w-7 h-7 text-violet-500" />
        </div>
        <h2 className="text-[18px] font-extrabold text-slate-800">Riley Analytics — Pro Feature</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[360px] mx-auto">
          See how Riley is performing — conversations, leads captured, top questions,
          and conversion rates. Upgrade to Pro to unlock.
        </p>
        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: "pro_monthly" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-[13px] font-semibold hover:bg-violet-700 transition"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxBar = Math.max(...metrics.buckets.map((b) => b.conversations), 1);

  return (
    <div className="max-w-[780px] mx-auto space-y-5">
      {/* Header + range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-slate-800">Riley Analytics</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">How Riley is performing for your business</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition ${
                range === r ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Conversations"
          value={metrics.totalConversations}
          icon={<MessageSquare className="w-4 h-4" />}
          color="violet"
        />
        <StatCard
          label="Leads Captured"
          value={metrics.totalLeads}
          icon={<Users className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="amber"
          subtitle={metrics.totalConversations > 0 ? `${metrics.totalLeads} of ${metrics.totalConversations}` : undefined}
        />
        <StatCard
          label="Avg Messages"
          value={metrics.avgMessages}
          icon={<Zap className="w-4 h-4" />}
          color="blue"
          subtitle="per conversation"
        />
      </div>

      {/* Conversation volume chart */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-800 mb-4">Conversation Volume</h3>
        {metrics.totalConversations === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[13px] text-slate-400">No conversations yet. Riley is ready and waiting!</p>
          </div>
        ) : (
          <div className="flex items-end gap-1.5" style={{ height: 140 }}>
            {metrics.buckets.map((bucket, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: 100 }}>
                  {/* Lead bar (on top) */}
                  <div
                    className="w-full rounded-t bg-emerald-400 transition-all duration-300"
                    style={{ height: `${(bucket.leads / maxBar) * 100}%`, minHeight: bucket.leads > 0 ? 3 : 0 }}
                    title={`${bucket.leads} leads`}
                  />
                  {/* Conversation bar */}
                  <div
                    className="w-full rounded-t bg-violet-400 transition-all duration-300"
                    style={{ height: `${(bucket.conversations / maxBar) * 100}%`, minHeight: bucket.conversations > 0 ? 3 : 0 }}
                    title={`${bucket.conversations} conversations`}
                  />
                </div>
                <span className="text-[9px] text-slate-400 leading-none whitespace-nowrap">
                  {bucket.label.split(", ")[0]}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-400" /> Conversations
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Leads captured
          </span>
        </div>
      </div>

      {/* Two-column: Top questions + Lead funnel */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Questions */}
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="text-[14px] font-bold text-slate-800 mb-3">Top Questions Asked</h3>
          {metrics.topQuestions.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-4 text-center">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {metrics.topQuestions.map(([question, count], i) => {
                const maxQ = metrics.topQuestions[0][1] as number;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-slate-700">{question}</span>
                      <span className="text-[11px] font-bold text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full transition-all duration-500"
                        style={{ width: `${((count as number) / maxQ) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-3">
            Based on first message in each conversation. Use this to improve your FAQs.
          </p>
        </div>

        {/* Lead Funnel */}
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="text-[14px] font-bold text-slate-800 mb-3">Lead Status Funnel</h3>
          {metrics.totalLeads === 0 ? (
            <p className="text-[13px] text-slate-400 py-4 text-center">No leads captured yet</p>
          ) : (
            <div className="space-y-2">
              {[
                { key: "new", label: "New", color: "bg-blue-400" },
                { key: "contacted", label: "Contacted", color: "bg-violet-400" },
                { key: "appointment_set", label: "Appointment Set", color: "bg-amber-400" },
                { key: "quoted", label: "Quoted", color: "bg-orange-400" },
                { key: "won", label: "Won", color: "bg-emerald-500" },
                { key: "completed", label: "Completed", color: "bg-emerald-600" },
                { key: "lost", label: "Lost", color: "bg-slate-300" },
              ].map(({ key, label, color }) => {
                const count = metrics.statusCounts[key] || 0;
                if (count === 0) return null;
                const pct = Math.round((count / metrics.totalLeads) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-slate-700">{label}</span>
                      <span className="text-[11px] text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Speed to contact */}
          {metrics.speedMin !== null && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[12px] text-slate-600">
                  Avg time to contact: <strong className="text-slate-800">{metrics.speedMin < 60 ? `${metrics.speedMin} min` : `${(metrics.speedMin / 60).toFixed(1)} hrs`}</strong>
                </span>
                {metrics.speedMin <= 5 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Excellent
                  </span>
                )}
                {metrics.speedMin > 5 && metrics.speedMin <= 30 && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    Good
                  </span>
                )}
                {metrics.speedMin > 30 && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Slow — respond faster!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insight card */}
      {metrics.totalConversations > 0 && (
        <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-violet-900">Riley&apos;s Impact</h4>
              <p className="text-[12px] text-violet-700 mt-0.5 leading-relaxed">
                {metrics.conversionRate >= 15
                  ? `Riley is converting ${metrics.conversionRate}% of conversations into leads — above the 15% industry average. Keep your FAQs updated to maintain this.`
                  : metrics.conversionRate >= 5
                  ? `Riley is converting ${metrics.conversionRate}% of conversations. Add more custom FAQs and fill in your pricing to improve.`
                  : metrics.totalLeads > 0
                  ? `Riley has captured ${metrics.totalLeads} leads. Fill in more training data (pricing, FAQs) to increase conversion.`
                  : `Riley is having conversations but hasn't captured leads yet. Make sure your pricing range is filled in — that's the #1 question homeowners ask.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "violet" | "emerald" | "amber" | "blue";
  subtitle?: string;
}) {
  const colorMap = {
    violet: { bg: "bg-violet-50", text: "text-violet-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-500" },
    blue: { bg: "bg-blue-50", text: "text-blue-500" },
  };
  const c = colorMap[color];

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-[24px] font-extrabold text-slate-800 leading-none">{value}</div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
