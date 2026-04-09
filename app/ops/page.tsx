"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  PipelineResponse,
  ProspectBatch,
  PipelineStage,
  GateType,
  GateStatus,
} from "@/lib/ops-pipeline";
import { DISPLAY_STAGES, STAGE_LABELS, GATE_LABELS } from "@/lib/ops-pipeline";

// ── Helper: format date ──────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtWeek(b: ProspectBatch) {
  return `Week ${b.week_number} (${fmtDate(b.week_start)}–${fmtDate(b.week_end)})`;
}

// ── Status color helpers ─────────────────────────────────────────────
function stageColor(stage: PipelineStage, count: number): string {
  if (count === 0) return "text-gray-300";
  const hot: PipelineStage[] = ["interested", "free_signup", "paid"];
  const warn: PipelineStage[] = ["replied", "draft_ready"];
  if (hot.includes(stage)) return "text-green-600 font-bold";
  if (warn.includes(stage)) return "text-amber-600 font-semibold";
  return "text-gray-700";
}

export default function OpsPage() {
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [approving, setApproving] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/ops/pipeline");
      if (res.ok) {
        const data = await res.json();
        setPipeline(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Pipeline fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 60s auto-refresh
  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 60_000);
    return () => clearInterval(interval);
  }, [fetchPipeline]);

  // ── Gate approval action ─────────────────────────────────────────
  async function handleGateApproval(gateType: GateType, batchId: string) {
    setApproving(`${gateType}-${batchId}`);
    try {
      const res = await fetch("/api/ops/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gate_type: gateType,
          batch_id: batchId,
          action: "approve_all",
        }),
      });
      if (res.ok) {
        await fetchPipeline(); // Refresh data
      }
    } catch (err) {
      console.error("Gate approval failed:", err);
    } finally {
      setApproving(null);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function getPendingGatesForBatch(batch: ProspectBatch): GateStatus[] {
    return batch.gates.filter((g) => g.status === "pending" && g.items_pending > 0);
  }

  function getOverallStatus(): "green" | "yellow" | "red" {
    if (!pipeline) return "green";
    const pendingGates = pipeline.pending_gates.filter(g => g.status === "pending");
    if (pendingGates.length > 0) return "yellow";
    return "green";
  }

  // ── Time since last update ───────────────────────────────────────
  function timeSince(): string {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }

  const status = getOverallStatus();
  const statusConfig = {
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500", label: "All Systems Healthy" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Gates Need Attention" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Issues Detected" },
  }[status];

  return (
    <>
      {/* ═══ TOP BAR ═══ */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold tracking-tight">
            RuufPro <span className="text-gray-400 font-normal">Ops</span>
          </h1>
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border ${statusConfig.text}`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Updated {timeSince()} &middot; {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">

        {/* ═══ SECTION 3: WEEKLY BATCH PIPELINE ═══ */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Loading pipeline data...
          </div>
        ) : !pipeline || pipeline.batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-sm font-medium">No batches yet</p>
            <p className="text-gray-400 text-xs mt-1">Weekly auto-scrape will create your first batch on Monday</p>
          </div>
        ) : (
          <>
            {/* Totals bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pipeline Totals</h2>
                <span className="text-xs text-gray-400">{pipeline.batches.length} batch{pipeline.batches.length !== 1 ? "es" : ""} active</span>
              </div>
              <div className="flex gap-1">
                {DISPLAY_STAGES.map((stage) => {
                  const count = pipeline.totals[stage] || 0;
                  const total = Object.values(pipeline.totals).reduce((a, c) => a + c, 0);
                  const width = total > 0 ? Math.max((count / total) * 100, count > 0 ? 4 : 0) : 0;
                  return (
                    <div key={stage} className="text-center" style={{ flex: `${Math.max(width, 6)} 0 0` }}>
                      <div className={`text-lg font-bold ${stageColor(stage, count)}`}>{count}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{STAGE_LABELS[stage]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Batch rows */}
            {pipeline.batches.map((batch) => {
              const isExpanded = expandedBatch === batch.id;
              const pendingGates = getPendingGatesForBatch(batch);
              const isCompleted = batch.status === "completed";

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Batch header */}
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                      <div className="text-left">
                        <span className="text-sm font-semibold">{fmtWeek(batch)}</span>
                        <span className="text-xs text-gray-400 ml-2">{batch.lead_count} leads</span>
                        {batch.city_targets.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            &middot; {batch.city_targets.slice(0, 3).join(", ")}
                            {batch.city_targets.length > 3 && ` +${batch.city_targets.length - 3}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                          ✓ Complete
                        </span>
                      )}
                      {pendingGates.length > 0 && (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          {pendingGates.length} gate{pendingGates.length > 1 ? "s" : ""} waiting
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{batch.progress}%</span>
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="px-5 pb-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${batch.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage counts row */}
                  <div className="px-5 py-3 flex border-t border-gray-50">
                    {DISPLAY_STAGES.map((stage, i) => {
                      const count = batch.stage_counts[stage] || 0;
                      return (
                        <div key={stage} className="flex-1 text-center relative">
                          {i > 0 && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-200 text-[10px]">→</span>
                          )}
                          <div className={`text-sm ${stageColor(stage, count)}`}>{count}</div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider">{STAGE_LABELS[stage]}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══ SECTION 4: APPROVAL GATES (inline) ═══ */}
                  {pendingGates.length > 0 && (
                    <div className="border-t border-amber-100 bg-amber-50/50 px-5 py-3">
                      <div className="flex flex-wrap gap-3">
                        {pendingGates.map((gate) => (
                          <div
                            key={gate.id}
                            className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-4 py-2.5"
                          >
                            <div>
                              <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                {GATE_LABELS[gate.gate_type as GateType]}
                              </div>
                              <div className="text-xs text-amber-600 mt-0.5">
                                {gate.items_pending} item{gate.items_pending !== 1 ? "s" : ""} waiting
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGateApproval(gate.gate_type as GateType, batch.id);
                              }}
                              disabled={approving === `${gate.gate_type}-${batch.id}`}
                              className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 px-4 py-1.5 rounded-lg transition-colors"
                            >
                              {approving === `${gate.gate_type}-${batch.id}` ? "Approving..." : "Approve All"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded: lead table for this batch */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <BatchLeadTable batchId={batch.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="text-center py-6 text-[11px] text-gray-300">
        RuufPro Ops &middot; Auto-refreshes every 60s
      </div>
    </>
  );
}

// ── Batch Lead Table (loads on expand) ─────────────────────────────
function BatchLeadTable({ batchId }: { batchId: string }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<string>("business_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) setLeads(await res.json());
      } catch (err) {
        console.error("Failed to fetch leads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [batchId]);

  if (loading) {
    return <div className="p-6 text-center text-gray-400 text-sm">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return <div className="p-6 text-center text-gray-400 text-sm">No leads in this batch</div>;
  }

  // Sort
  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  // Filter + sort
  const filtered = stageFilter === "all" ? leads : leads.filter((l) => l.stage === stageFilter);
  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortCol] || "").toString().toLowerCase();
    const bv = (b[sortCol] || "").toString().toLowerCase();
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  // Unique stages for filter
  const stages = [...new Set(leads.map((l) => l.stage))];

  const thClass = "text-[10px] uppercase tracking-wider text-gray-400 font-semibold text-left px-3 py-2 cursor-pointer hover:text-gray-600 select-none";
  const tdClass = "text-xs px-3 py-2.5 border-b border-gray-50";

  const stagePillColors: Record<string, string> = {
    scraped: "bg-gray-100 text-gray-500",
    enriched: "bg-blue-50 text-blue-600",
    site_built: "bg-indigo-50 text-indigo-600",
    site_approved: "bg-teal-50 text-teal-600",
    outreach_approved: "bg-cyan-50 text-cyan-600",
    sent: "bg-sky-50 text-sky-600",
    awaiting_reply: "bg-amber-50 text-amber-600",
    replied: "bg-green-50 text-green-600",
    draft_ready: "bg-purple-50 text-purple-600",
    responded: "bg-emerald-50 text-emerald-600",
    interested: "bg-green-100 text-green-700",
    free_signup: "bg-green-200 text-green-800",
    paid: "bg-green-300 text-green-900",
    not_now: "bg-gray-100 text-gray-500",
    objection: "bg-red-50 text-red-500",
    unsubscribed: "bg-red-100 text-red-600",
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mr-1">Filter:</span>
        <button
          onClick={() => setStageFilter("all")}
          className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${stageFilter === "all" ? "bg-gray-800 text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"}`}
        >
          All ({leads.length})
        </button>
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${stageFilter === s ? "bg-gray-800 text-white" : `${stagePillColors[s] || "bg-gray-100 text-gray-500"} hover:opacity-80`}`}
          >
            {STAGE_LABELS[s as PipelineStage] || s} ({leads.filter((l) => l.stage === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={thClass} onClick={() => handleSort("business_name")}>
                Business {sortCol === "business_name" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className={thClass} onClick={() => handleSort("city")}>
                City {sortCol === "city" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className={thClass} onClick={() => handleSort("their_website_url")}>
                Their Site {sortCol === "their_website_url" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className={thClass}>Our Preview</th>
              <th className={thClass} onClick={() => handleSort("stage")}>
                Stage {sortCol === "stage" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className={thClass} onClick={() => handleSort("emails_sent_count")}>
                Emails {sortCol === "emails_sent_count" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className={thClass} onClick={() => handleSort("reply_category")}>
                Reply {sortCol === "reply_category" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className={thClass}>Draft</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50/50">
                <td className={`${tdClass} font-semibold text-gray-800`}>{lead.business_name || "—"}</td>
                <td className={tdClass}>{lead.city ? `${lead.city}, ${lead.state || ""}` : "—"}</td>
                <td className={tdClass}>
                  {lead.their_website_url ? (
                    <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      {lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  ) : (
                    <span className="text-gray-300 text-[11px]">No website</span>
                  )}
                </td>
                <td className={tdClass}>
                  {lead.preview_site_url ? (
                    <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      Preview ↗
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className={tdClass}>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${stagePillColors[lead.stage] || "bg-gray-100 text-gray-500"}`}>
                    {STAGE_LABELS[lead.stage as PipelineStage] || lead.stage}
                  </span>
                </td>
                <td className={tdClass}>{lead.emails_sent_count > 0 ? lead.emails_sent_count : "—"}</td>
                <td className={tdClass}>
                  {lead.reply_category ? (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${lead.reply_category === "interested" ? "bg-green-100 text-green-700" : lead.reply_category === "objection" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                      {lead.reply_category}
                    </span>
                  ) : "—"}
                </td>
                <td className={tdClass}>
                  {lead.draft_response ? (
                    <span className="text-gray-400 text-[11px] max-w-[200px] truncate inline-block" title={lead.draft_response}>
                      &ldquo;{lead.draft_response.slice(0, 50)}...&rdquo;
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
