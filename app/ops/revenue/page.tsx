"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { STAGE_LABELS } from "@/lib/ops-pipeline";
import type { RevenueResponse, VelocityCounts } from "@/lib/ops-revenue";

// ── Stage pill colors ───────────────────────────────────────────────
const STAGE_PILL: Record<string, string> = {
  replied: "bg-[#E8F5E9] text-[#2E7D32]",
  interested: "bg-[#C8E6C9] text-[#1B5E20]",
  free_signup: "bg-green-200 text-green-800",
  paid: "bg-green-300 text-green-900",
};

// ── Helpers ──────────────────────────────────────────────────────────
function delta(today: number, yesterday: number): { text: string; cls: string } {
  const diff = today - yesterday;
  if (diff > 0) return { text: `+${diff}`, cls: "text-[#34C759]" };
  if (diff < 0) return { text: `${diff}`, cls: "text-[#FF3B30]" };
  return { text: "—", cls: "text-[#D1D1D6]" };
}

function weekDelta(tw: number, lw: number): { text: string; cls: string } {
  if (lw === 0 && tw === 0) return { text: "—", cls: "text-[#D1D1D6]" };
  if (lw === 0) return { text: "new", cls: "text-[#34C759]" };
  const pct = Math.round(((tw - lw) / lw) * 100);
  if (pct > 0) return { text: `+${pct}%`, cls: "text-[#34C759]" };
  if (pct < 0) return { text: `${pct}%`, cls: "text-[#FF3B30]" };
  return { text: "0%", cls: "text-[#8E8E93]" };
}

// ── Metric definitions ──────────────────────────────────────────────
const VELOCITY_METRICS: { key: keyof VelocityCounts; label: string }[] = [
  { key: "scraped", label: "Scraped" },
  { key: "sent", label: "Sent" },
  { key: "replies", label: "Replies" },
  { key: "interested", label: "Interested" },
  { key: "signups", label: "Signups" },
  { key: "views", label: "Views" },
];

const MOMENTUM_METRICS: { key: keyof VelocityCounts; label: string }[] = [
  { key: "scraped", label: "Scraped" },
  { key: "sites_built", label: "Sites Built" },
  { key: "sent", label: "Sent" },
  { key: "replies", label: "Replies" },
  { key: "interested", label: "Interested" },
  { key: "signups", label: "Signups" },
];

const MILESTONES = [
  { value: 149, label: "$149" },
  { value: 1000, label: "$1K" },
  { value: 2500, label: "$2.5K" },
  { value: 5000, label: "$5K" },
];

export default function RevenuePage() {
  const router = useRouter();
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ops/revenue");
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Revenue fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-[#E5E5EA] p-12 text-center text-[#8E8E93] text-sm">
          Loading revenue data...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-[#E5E5EA] p-12 text-center text-[#8E8E93] text-sm">
          Failed to load revenue data
        </div>
      </div>
    );
  }

  const streakBadge =
    data.streak_days >= 4 ? "bg-[#E8F5E9] text-[#2E7D32]" :
    data.streak_days >= 1 ? "bg-[#FFF8E1] text-[#F57F17]" :
    "bg-[#F5F5F7] text-[#8E8E93]";

  const mrrPct = data.goal_mrr > 0 ? Math.min(100, (data.mrr / data.goal_mrr) * 100) : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-3">
      {/* ═══ SECTION 1: TODAY'S VELOCITY ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="flex items-center gap-10">
            <div className="text-[12px] font-bold uppercase tracking-[0.05em]">Today&apos;s Velocity</div>
            <div className="text-[11px] text-[#C7C7CC]">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data.streak_days > 0 && (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-[10px] ${streakBadge}`}>
                {data.streak_days}-day streak
              </span>
            )}
          </div>
        </div>

        {/* Metric strip — matches totals-bar pattern */}
        <div className="flex px-5 py-3">
          {VELOCITY_METRICS.map((m) => {
            const val = data.today[m.key];
            const yest = data.yesterday[m.key];
            const d = delta(val, yest);
            const isHot = m.key === "interested" && val > 0;
            const numCls = val === 0 ? "text-[#D1D1D6]" : isHot ? "text-[#34C759] font-extrabold" : "text-[#3C3C43]";
            return (
              <div key={m.key} className="flex-1 text-center">
                <div className={`text-[20px] font-bold leading-none ${numCls}`}>{val}</div>
                <div className="text-[9px] uppercase tracking-[0.08em] text-[#8E8E93] mt-1">{m.label}</div>
                <div className={`text-[10px] font-semibold mt-1.5 ${d.cls}`}>{d.text}</div>
              </div>
            );
          })}
        </div>

        {/* MRR progress */}
        <div className="px-5 py-3 border-t border-[#F2F2F7]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8E8E93]">Progress to $5K MRR</div>
            <div className="text-[13px] font-bold tabular-nums">
              ${data.mrr.toLocaleString()}
              <span className="text-[11px] text-[#C7C7CC] font-normal"> / $5,000</span>
            </div>
          </div>
          <div className="h-[5px] bg-[#F2F2F7] rounded-[3px] relative overflow-visible">
            <div
              className="h-full rounded-[3px] bg-gradient-to-r from-[#60A5FA] to-[#34D399]"
              style={{ width: `${Math.max(mrrPct, 0.5)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <div className="text-[9px] text-[#D1D1D6]">$0</div>
            {MILESTONES.map((ms) => (
              <div
                key={ms.value}
                className={`text-[9px] ${data.mrr >= ms.value ? "text-[#007AFF] font-semibold" : "text-[#D1D1D6]"}`}
              >
                {ms.label}
              </div>
            ))}
          </div>
          <div className="text-[11px] text-[#8E8E93] mt-2">
            {data.mrr > 0 ? (
              `${Math.round(mrrPct)}% to goal`
            ) : data.hot_prospects.length > 0 ? (
              <>Next milestone: <span className="font-semibold text-[#007AFF]">First customer ($149)</span> · {data.hot_prospects.length} hot prospect{data.hot_prospects.length !== 1 ? "s" : ""} in pipeline</>
            ) : (
              <>Next milestone: <span className="font-semibold text-[#007AFF]">First customer ($149)</span> · <button onClick={() => router.push("/ops/settings")} className="text-[#007AFF] font-medium hover:underline">Connect Stripe →</button></>
            )}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: WEEKLY MOMENTUM ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="text-[12px] font-bold uppercase tracking-[0.05em]">This Week vs Last</div>
          <div className="text-[11px] text-[#C7C7CC]">Mon–Sun</div>
        </div>
        <div className="px-5 py-2">
          {MOMENTUM_METRICS.map((m, i) => {
            const tw = data.this_week[m.key];
            const lw = data.last_week[m.key];
            const d = weekDelta(tw, lw);
            const maxVal = Math.max(tw, lw, 1);
            return (
              <div
                key={m.key}
                className={`flex items-center gap-3 py-2 ${i < MOMENTUM_METRICS.length - 1 ? "border-b border-[#F5F5F5]" : ""}`}
              >
                <div className="text-[12px] font-medium w-[80px] text-[#3C3C43]">{m.label}</div>
                <div className="flex-1 relative h-[14px]">
                  {/* Last week (ghost) */}
                  <div
                    className="absolute top-0 h-full rounded-[2px] bg-[#F2F2F7]"
                    style={{ width: `${Math.round((lw / maxVal) * 100)}%` }}
                  />
                  {/* This week */}
                  <div
                    className="absolute top-0 h-full rounded-[2px] bg-gradient-to-r from-[#60A5FA] to-[#34D399] opacity-85"
                    style={{ width: `${Math.round((tw / maxVal) * 100)}%` }}
                  />
                </div>
                <div className="text-[13px] font-bold tabular-nums w-[32px] text-right text-[#1D1D1F]">{tw}</div>
                <div className="text-[11px] text-[#AEAEB2] w-[32px] text-right">{lw}</div>
                <div className={`text-[10px] font-semibold w-[40px] text-right ${d.cls}`}>{d.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 3: CLOSEST TO MONEY ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="text-[12px] font-bold uppercase tracking-[0.05em]">Closest to Money</div>
          {data.hot_prospects.length > 0 && (
            <span className="text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-[10px]">
              {data.hot_prospects.length} prospect{data.hot_prospects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {data.hot_prospects.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-[13px] text-[#8E8E93] font-medium">No hot prospects yet</div>
            <div className="text-[11px] text-[#C7C7CC] mt-1">Keep pushing outreach — interested prospects appear here.</div>
            <button
              onClick={() => router.push("/ops")}
              className="mt-2 text-[11px] font-semibold text-[#007AFF] hover:underline"
            >
              Go to Pipeline →
            </button>
          </div>
        ) : (
          <div>
            {data.hot_prospects.map((p, i) => {
              const pillCls = STAGE_PILL[p.stage] || "bg-gray-100 text-gray-500";
              const stageLabel = STAGE_LABELS[p.stage as keyof typeof STAGE_LABELS] || p.stage;
              const daysWarn = p.days_in_stage >= 5;
              const daysOk = p.days_in_stage >= 3;
              const daysBadge = daysWarn
                ? "bg-[#FFEBEE] text-[#C62828]"
                : daysOk
                ? "bg-[#FFF8E1] text-[#F57F17]"
                : "bg-[#E8F5E9] text-[#2E7D32]";

              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center px-5 py-2.5 ${
                    i < data.hot_prospects.length - 1 ? "border-b border-[#F5F5F5]" : ""
                  } hover:bg-[#FAFBFC] transition-[background] duration-100 cursor-pointer`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">
                        {p.name || p.business_name}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] mt-0.5">
                        {p.business_name && p.name !== p.business_name ? `${p.business_name} · ` : ""}
                        {p.city}
                        {p.reply_category ? ` · ${p.reply_category}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${pillCls}`}>
                      {stageLabel}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${daysBadge}`}>
                      {p.days_in_stage}d in stage
                    </span>

                    {p.preview_url && (
                      <a
                        href={p.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#007AFF] font-medium px-2.5 py-1 rounded-md border border-[#007AFF33] hover:bg-[#EFF6FF] transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Site
                      </a>
                    )}
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="text-[11px] text-[#007AFF] font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Email
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ SECTION 4: BOTTLENECK ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F2F2F7]">
          <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#F57F17]">Bottleneck</div>
        </div>

        {!data.bottleneck ? (
          <div className="p-6 text-center">
            <div className="text-[13px] text-[#8E8E93] font-medium">No pipeline data yet</div>
            <div className="text-[11px] text-[#C7C7CC] mt-1">Create your first batch to start tracking.</div>
            <button
              onClick={() => router.push("/ops")}
              className="mt-2 text-[11px] font-semibold text-[#007AFF] hover:underline"
            >
              Go to Pipeline →
            </button>
          </div>
        ) : (
          <div className="px-5 py-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">
                    {STAGE_LABELS[data.bottleneck.from_stage as keyof typeof STAGE_LABELS] || data.bottleneck.from_stage}
                  </span>
                  <span className="text-[11px] text-[#AEAEB2]">→</span>
                  <span className="text-[13px] font-semibold">
                    {STAGE_LABELS[data.bottleneck.to_stage as keyof typeof STAGE_LABELS] || data.bottleneck.to_stage}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                    data.bottleneck.conversion_pct < 20 ? "bg-[#FFEBEE] text-[#C62828]" :
                    data.bottleneck.conversion_pct < 50 ? "bg-[#FFF8E1] text-[#F57F17]" :
                    "bg-[#E8F5E9] text-[#2E7D32]"
                  }`}>
                    {data.bottleneck.conversion_pct}% conversion
                  </span>
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-1">
                  {data.bottleneck.stuck_count} prospect{data.bottleneck.stuck_count !== 1 ? "s" : ""} stuck · {data.bottleneck.action}
                </div>
              </div>

              <a
                href={data.bottleneck.action_href}
                target={data.bottleneck.action_href.startsWith("http") ? "_blank" : undefined}
                rel={data.bottleneck.action_href.startsWith("http") ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (!data.bottleneck!.action_href.startsWith("http")) {
                    e.preventDefault();
                    router.push(data.bottleneck!.action_href);
                  }
                }}
                className="text-[11px] font-semibold text-white bg-[#F59E0B] hover:bg-[#D97706] px-3.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                Fix this →
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-5 text-[11px] text-[#D1D1D6]">
        RuufPro Ops · Revenue
      </div>
    </div>
  );
}
