"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  PipelineResponse,
  ProspectBatch,
  PipelineStage,
  GateType,
  GateStatus,
  PipelineProspect,
} from "@/lib/ops-pipeline";
import { DISPLAY_STAGES, STAGE_LABELS, GATE_LABELS } from "@/lib/ops-pipeline";

// ── Helpers ─────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtWeek(b: ProspectBatch) {
  return `Week ${b.week_number} (${fmtDate(b.week_start)}–${fmtDate(b.week_end)})`;
}
function fmtTimestamp(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function daysSince(d: string | null): number {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function stageColor(stage: PipelineStage, count: number): string {
  if (count === 0) return "text-[#D1D1D6]";
  const hot: PipelineStage[] = ["interested", "free_signup", "paid"];
  const warn: PipelineStage[] = ["site_built"];
  if (hot.includes(stage)) return "text-[#34C759] font-extrabold";
  if (warn.includes(stage)) return "text-[#FF9F0A]";
  return "text-[#3C3C43]";
}

const STAGE_PILL: Record<string, string> = {
  scraped: "bg-gray-100 text-gray-500",
  enriched: "bg-blue-50 text-blue-600",
  site_built: "bg-[#EDE7F6] text-[#5E35B1]",
  site_approved: "bg-teal-50 text-teal-600",
  outreach_approved: "bg-cyan-50 text-cyan-600",
  sent: "bg-[#E0F7FA] text-[#00838F]",
  awaiting_reply: "bg-[#FFF8E1] text-[#F57F17]",
  replied: "bg-[#E8F5E9] text-[#2E7D32]",
  draft_ready: "bg-[#F3E5F5] text-[#7B1FA2]",
  responded: "bg-emerald-50 text-emerald-600",
  interested: "bg-[#C8E6C9] text-[#1B5E20]",
  free_signup: "bg-green-200 text-green-800",
  paid: "bg-green-300 text-green-900",
  not_now: "bg-gray-100 text-gray-500",
  objection: "bg-red-50 text-red-500",
  unsubscribed: "bg-red-100 text-red-600",
};

// ── Types for attention items ───────────────────────────────────────
interface AttentionItem {
  id: string;
  business_name: string;
  location: string;
  context: string;
  days: number;
  urgency: "ok" | "warn" | "urgent";
  batch_label: string;
  type: "reply_wait" | "draft_pending" | "site_review";
}

export default function OpsPage() {
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [approving, setApproving] = useState<string | null>(null);
  const [attentionOpen, setAttentionOpen] = useState(true);
  const [expandedGate, setExpandedGate] = useState<string | null>(null);

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

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 60_000);
    return () => clearInterval(interval);
  }, [fetchPipeline]);

  // ── Gate actions ──────────────────────────────────────────────────
  async function handleGateApproval(gateType: GateType, batchId: string) {
    setApproving(`${gateType}-${batchId}`);
    try {
      const res = await fetch("/api/ops/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gate_type: gateType, batch_id: batchId, action: "approve_all" }),
      });
      if (res.ok) await fetchPipeline();
    } catch (err) {
      console.error("Gate approval failed:", err);
    } finally {
      setApproving(null);
    }
  }

  function getPendingGatesForBatch(batch: ProspectBatch): GateStatus[] {
    return batch.gates.filter((g) => g.status === "pending" && g.items_pending > 0);
  }

  function getOverallStatus(): "green" | "yellow" | "red" {
    if (!pipeline) return "green";
    const pending = pipeline.pending_gates.filter(g => g.status === "pending");
    if (pending.length > 0) return "yellow";
    return "green";
  }

  function timeSince(): string {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    return `${Math.floor(seconds / 60)}m ago`;
  }

  // ── Build attention items from pipeline data ──────────────────────
  function getAttentionItems(): AttentionItem[] {
    if (!pipeline) return [];
    const items: AttentionItem[] = [];
    // This would come from an API in production. For now, show gate-based items.
    pipeline.batches.forEach((batch) => {
      const label = `Week ${batch.week_number}`;
      batch.gates.forEach((gate) => {
        if (gate.status === "pending" && gate.items_pending > 0) {
          items.push({
            id: `${batch.id}-${gate.gate_type}`,
            business_name: GATE_LABELS[gate.gate_type as GateType],
            location: `${gate.items_pending} items waiting`,
            context: `Batch: ${fmtWeek(batch)}`,
            days: 0,
            urgency: "warn",
            batch_label: label,
            type: gate.gate_type === "site_review" ? "site_review" : gate.gate_type === "draft_approval" ? "draft_pending" : "reply_wait",
          });
        }
      });
    });
    return items;
  }

  const status = getOverallStatus();
  const statusConfig = {
    green: { bg: "bg-[#E8F5E9]", border: "border-[#A5D6A7]", text: "text-[#2E7D32]", dot: "bg-[#4CAF50]", label: "All Systems Healthy" },
    yellow: { bg: "bg-[#FFF8E1]", border: "border-[#FDE68A]", text: "text-[#F57F17]", dot: "bg-[#FF9800]", label: "Gates Need Attention" },
    red: { bg: "bg-[#FFEBEE]", border: "border-[#FFCDD2]", text: "text-[#C62828]", dot: "bg-[#FF3B30]", label: "Issues Detected" },
  }[status];

  const attentionItems = getAttentionItems();

  return (
    <>
      {/* ═══ STATUS BAR (under top bar) ═══ */}
      <div className="bg-white border-b border-[#E5E5EA] px-8 py-2.5 flex justify-between items-center">
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border ${statusConfig.text}`}>
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </div>
        <div className="text-xs text-[#8E8E93]">
          Updated {timeSince()}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-4">

        {/* ═══ CROSS-BATCH ATTENTION SECTION ═══ */}
        {attentionItems.length > 0 && (
          <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
            <button
              className="w-full px-5 py-3 flex justify-between items-center border-b border-[#F2F2F7] hover:bg-[#FAFAFA] transition-colors"
              onClick={() => setAttentionOpen(!attentionOpen)}
            >
              <div className="text-xs font-bold uppercase tracking-[0.05em] text-[#F57F17]">
                ⚠ Needs Your Attention — Across All Batches
              </div>
              <div className="text-[11px] text-[#8E8E93]">
                {attentionItems.length} item{attentionItems.length !== 1 ? "s" : ""} waiting
              </div>
            </button>
            {attentionOpen && (
              <div>
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center px-5 py-2.5 border-b border-[#F5F5F5] last:border-b-0 hover:bg-[#FAFBFC] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[13px] font-semibold">{item.business_name}</div>
                        <div className="text-[11px] text-[#8E8E93]">{item.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg inline-block ${
                        item.urgency === "urgent" ? "bg-[#FFEBEE] text-[#C62828]" :
                        item.urgency === "warn" ? "bg-[#FFF8E1] text-[#F57F17]" :
                        "bg-[#E8F5E9] text-[#2E7D32]"
                      }`}>
                        {item.context}
                      </div>
                      <div className="text-[10px] text-[#AEAEB2] mt-0.5">{item.batch_label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PIPELINE CONTENT ═══ */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#E5E5EA] p-12 text-center text-[#8E8E93] text-sm">
            Loading pipeline data...
          </div>
        ) : !pipeline || pipeline.batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E5EA] p-12 text-center">
            <p className="text-[#8E8E93] text-sm font-medium">No batches yet</p>
            <p className="text-[#C7C7CC] text-xs mt-1">Weekly auto-scrape will create your first batch on Monday</p>
          </div>
        ) : (
          <>
            {/* ── Totals Bar ── */}
            <div className="bg-white rounded-xl border border-[#E5E5EA] px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8E8E93]">Pipeline Totals</h2>
                <span className="text-[11px] text-[#C7C7CC]">{pipeline.batches.length} batch{pipeline.batches.length !== 1 ? "es" : ""} active</span>
              </div>
              <div className="flex">
                {DISPLAY_STAGES.map((stage) => {
                  const count = pipeline.totals[stage] || 0;
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className={`text-xl font-bold leading-none ${stageColor(stage, count)}`}>{count}</div>
                      <div className="text-[9px] uppercase tracking-[0.08em] text-[#8E8E93] mt-1">{STAGE_LABELS[stage]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Batch Cards ── */}
            {pipeline.batches.map((batch) => {
              const isExpanded = expandedBatch === batch.id;
              const pendingGates = getPendingGatesForBatch(batch);
              const isCompleted = batch.status === "completed";

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-[#E5E5EA] overflow-hidden">
                  {/* Batch header */}
                  <button
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
                    onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-[#C7C7CC] transition-transform">{isExpanded ? "▼" : "▶"}</span>
                      <span className="text-sm font-semibold">{fmtWeek(batch)}</span>
                      <span className="text-[11px] text-[#8E8E93]">{batch.lead_count} leads</span>
                      {batch.city_targets.length > 0 && (
                        <span className="text-[11px] text-[#8E8E93]">
                          · {batch.city_targets.slice(0, 3).join(", ")}
                          {batch.city_targets.length > 3 && ` +${batch.city_targets.length - 3}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-[10px]">✓ Complete</span>
                      )}
                      {pendingGates.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#F57F17] bg-[#FFF8E1] px-2.5 py-1 rounded-[10px]">
                          {pendingGates.length} gate{pendingGates.length > 1 ? "s" : ""} waiting
                        </span>
                      )}
                      <span className="text-[11px] text-[#C7C7CC]">{batch.progress}%</span>
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="px-5 pb-1">
                    <div className="h-[5px] bg-[#F2F2F7] rounded-[3px] overflow-hidden">
                      <div className="h-full rounded-[3px] bg-gradient-to-r from-[#60A5FA] to-[#34D399] transition-all duration-500" style={{ width: `${batch.progress}%` }} />
                    </div>
                  </div>

                  {/* Stage counts */}
                  <div className="flex px-5 py-2.5 border-t border-[#F8F8FA]">
                    {DISPLAY_STAGES.map((stage, i) => {
                      const count = batch.stage_counts[stage] || 0;
                      return (
                        <div key={stage} className="flex-1 text-center relative">
                          {i > 0 && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] text-[#E5E5EA]">→</span>}
                          <div className={`text-[13px] font-semibold ${stageColor(stage, count)}`}>{count}</div>
                          <div className="text-[8px] uppercase tracking-[0.1em] text-[#AEAEB2] mt-0.5">{STAGE_LABELS[stage]}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Gate Panel ── */}
                  {pendingGates.length > 0 && (
                    <div className="border-t border-[#FDE68A] bg-[#FFFBEB]/50 px-5 py-3">
                      <div className="flex flex-wrap gap-3">
                        {pendingGates.map((gate) => {
                          const gateKey = `${gate.gate_type}-${batch.id}`;
                          const isGateExpanded = expandedGate === gateKey;
                          return (
                            <div key={gate.id}>
                              <div className="flex items-center gap-3 bg-white border border-[#FDE68A] rounded-[10px] px-4 py-2.5">
                                <div>
                                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#92400E]">
                                    {GATE_LABELS[gate.gate_type as GateType]}
                                  </div>
                                  <div className="text-[11px] text-[#B45309] mt-0.5">
                                    {gate.items_pending} item{gate.items_pending !== 1 ? "s" : ""} waiting
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedGate(isGateExpanded ? null : gateKey); }}
                                    className="text-[11px] font-semibold bg-white text-[#92400E] border border-[#FDE68A] hover:bg-[#FFF8E1] px-3.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    {gate.gate_type === "site_review" ? "Review 1-by-1" : "Preview"}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleGateApproval(gate.gate_type as GateType, batch.id); }}
                                    disabled={approving === gateKey}
                                    className="text-[11px] font-semibold text-white bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#FCD34D] px-3.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    {approving === gateKey ? "Approving..." : "Approve All"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Site Review Panel (Gate 1 expanded) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && g.gate_type === "site_review") && (
                    <SiteReviewPanel batchId={batch.id} onApprove={() => { setExpandedGate(null); fetchPipeline(); }} />
                  )}

                  {/* ── Email Preview Panel (Gate 2 expanded) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && g.gate_type === "outreach_approval") && (
                    <EmailPreviewPanel batchId={batch.id} />
                  )}

                  {/* ── Lead Table ── */}
                  {isExpanded && (
                    <div className="border-t border-[#F2F2F7]">
                      <BatchLeadTable batchId={batch.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="text-center py-6 text-[11px] text-[#D1D1D6]">
        RuufPro Ops · Auto-refreshes every 60s
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SITE REVIEW PANEL — 3-state card grid
// ═══════════════════════════════════════════════════════════════════
type SiteState = "approved" | "neutral" | "rejected";

function SiteReviewPanel({ batchId, onApprove }: { batchId: string; onApprove: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, SiteState>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const siteLeads = data.filter((l: any) => l.stage === "site_built" && l.preview_site_url);
          setLeads(siteLeads);
          // All start approved
          const initial: Record<string, SiteState> = {};
          siteLeads.forEach((l: any) => { initial[l.id] = "approved"; });
          setStates(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  function cycleState(id: string) {
    setStates((prev) => {
      const current = prev[id] || "approved";
      const next: SiteState = current === "approved" ? "neutral" : current === "neutral" ? "rejected" : "approved";
      return { ...prev, [id]: next };
    });
  }

  const approvedCount = Object.values(states).filter(s => s === "approved").length;
  const rejectedCount = Object.values(states).filter(s => s === "rejected").length;

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading sites...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No sites to review</div>;

  const stateStyles: Record<SiteState, { card: string; check: string; label: string; icon: string }> = {
    approved: { card: "border-[#34C759] bg-[#F0FFF4]", check: "bg-[#34C759] border-[#34C759] text-white", label: "text-[#34C759]", icon: "✓" },
    neutral: { card: "border-[#E5E5EA] bg-white", check: "bg-white border-[#D1D1D6] text-transparent", label: "text-[#AEAEB2]", icon: "—" },
    rejected: { card: "border-[#EF4444] bg-[#FEF2F2] opacity-50", check: "bg-[#EF4444] border-[#EF4444] text-white", label: "text-[#EF4444]", icon: "✗" },
  };

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Review Preview Sites</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">{approvedCount} approved · {rejectedCount} rejected</div>
        </div>
        <div className="flex gap-2">
          {rejectedCount > 0 && (
            <button className="text-[11px] font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] hover:bg-[#FFCDD2] px-3.5 py-1.5 rounded-lg transition-colors">
              Reject Selected ({rejectedCount})
            </button>
          )}
          <button
            className="text-[11px] font-semibold bg-[#34C759] text-white hover:bg-[#2DA44E] px-3.5 py-1.5 rounded-lg transition-colors"
            onClick={onApprove}
          >
            Approve All {leads.length}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-[#8E8E93] mb-3 px-3 py-2 bg-[#F0F7FF] rounded-lg border border-[#007AFF22]">
        <strong className="text-[#007AFF]">How it works:</strong> All sites start approved (green ✓). Click once to skip, click again to reject (red ✗), click again to re-approve.
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
        {leads.map((lead) => {
          const state = states[lead.id] || "approved";
          const s = stateStyles[state];
          return (
            <div
              key={lead.id}
              onClick={() => cycleState(lead.id)}
              className={`flex items-center gap-3 border rounded-[10px] p-3 cursor-pointer transition-all hover:shadow-sm ${s.card}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center text-xs font-bold ${s.check}`}>
                  {s.icon}
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-[0.06em] mt-0.5 ${s.label}`}>
                  {state === "approved" ? "Approved" : state === "neutral" ? "Skipped" : "Rejected"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{lead.business_name || "Unknown"}</div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  {lead.city ? `${lead.city}, ${lead.state || ""}` : ""}
                  {lead.their_website_url ? ` · ${lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}` : " · No website"}
                </div>
              </div>
              {lead.preview_site_url && (
                <a
                  href={lead.preview_site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-[#007AFF] font-medium px-2.5 py-1 rounded-md border border-[#007AFF33] hover:bg-[#EFF6FF] flex-shrink-0 transition-colors"
                >
                  View ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL PREVIEW PANEL — Tabs for Email 1-5 with samples
// ═══════════════════════════════════════════════════════════════════
function EmailPreviewPanel({ batchId }: { batchId: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Email 1 (Day 0)", "Email 2 (Day 3)", "Email 3 (Day 7)", "Email 4 (Day 14)", "Email 5 (Day 21)"];

  // Demo samples — in production these come from the email generation pipeline
  const samples = [
    {
      to: "john@exampleroofing.com",
      subject: "I built you a website — take a look",
      body: `Hi John,\n\nI was looking at roofing contractors in Tampa and noticed Example Roofing doesn't have a website yet. So I built you one — takes 30 seconds to check out:\n\n[Preview Link]\n\nIt's free to keep. If you want, I can also add an instant estimate tool that lets homeowners get a price right on your site.\n\nNo pressure either way.\n\n— Hannah, RuufPro`,
    },
    {
      to: "mike@suncoastroofing.com",
      subject: "Quick preview for SunCoast Roofing",
      body: `Hi Mike,\n\nI put together a professional website for SunCoast Roofing — your services, service areas, and contact info are already on it:\n\n[Preview Link]\n\nRoofers using our estimate widget are closing 23% more leads because homeowners get a price before they even call.\n\nWorth a look?\n\n— Hannah, RuufPro`,
    },
  ];

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs font-bold uppercase tracking-[0.05em]">Preview Email Sequences</div>
        <button className="text-[11px] font-semibold text-white bg-[#F59E0B] hover:bg-[#D97706] px-3.5 py-1.5 rounded-lg transition-colors">
          Send All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E5EA] mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`text-[11px] font-semibold px-4 py-2 border-b-2 transition-all ${
              activeTab === i
                ? "text-[#007AFF] border-[#007AFF]"
                : "text-[#8E8E93] border-transparent hover:text-[#1D1D1F]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sample emails */}
      {samples.map((sample, i) => (
        <div key={i} className="bg-white border border-[#E5E5EA] rounded-[10px] p-4 mb-2.5">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[#AEAEB2] font-semibold mb-1.5">Sample {i + 1} of {samples.length}</div>
          <div className="text-xs text-[#8E8E93] mb-2">
            To: <strong className="text-[#1D1D1F]">{sample.to}</strong>
          </div>
          <div className="text-[13px] font-semibold mb-2.5 pb-2 border-b border-[#F2F2F7]">{sample.subject}</div>
          <div className="text-[13px] text-[#3C3C43] leading-relaxed whitespace-pre-line">{sample.body}</div>
        </div>
      ))}
      <div className="text-xs text-[#AEAEB2] text-center mt-2">+ more personalized emails in this batch</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BATCH LEAD TABLE — with expandable detail rows
// ═══════════════════════════════════════════════════════════════════
function BatchLeadTable({ batchId }: { batchId: string }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<string>("business_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) setLeads(await res.json());
      } catch (err) { console.error("Failed to fetch leads:", err); }
      finally { setLoading(false); }
    }
    fetchLeads();
  }, [batchId]);

  if (loading) return <div className="p-6 text-center text-[#8E8E93] text-sm">Loading leads...</div>;
  if (leads.length === 0) return <div className="p-6 text-center text-[#8E8E93] text-sm">No leads in this batch</div>;

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const filtered = stageFilter === "all" ? leads : leads.filter((l) => l.stage === stageFilter);
  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortCol] || "").toString().toLowerCase();
    const bv = (b[sortCol] || "").toString().toLowerCase();
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const stages = Array.from(new Set(leads.map((l: any) => l.stage as string)));
  const thCls = "text-[10px] uppercase tracking-[0.06em] text-[#AEAEB2] font-semibold text-left px-3 py-2 cursor-pointer hover:text-[#1D1D1F] select-none";

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F2F2F7] flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] text-[#AEAEB2] uppercase tracking-[0.1em] font-semibold mr-1">Filter:</span>
        <button
          onClick={() => setStageFilter("all")}
          className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${stageFilter === "all" ? "bg-[#1D1D1F] text-white" : "bg-white text-[#8E8E93] border border-[#E5E5EA] hover:bg-gray-100"}`}
        >
          All ({leads.length})
        </button>
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${stageFilter === s ? "bg-[#1D1D1F] text-white" : `${STAGE_PILL[s] || "bg-gray-100 text-gray-500"} hover:opacity-80`}`}
          >
            {STAGE_LABELS[s as PipelineStage] || s} ({leads.filter((l) => l.stage === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {[
                { key: "business_name", label: "Business" },
                { key: "city", label: "City" },
                { key: "their_website_url", label: "Their Site" },
                { key: "_preview", label: "Preview" },
                { key: "stage", label: "Stage" },
                { key: "emails_sent_count", label: "Emails" },
                { key: "reply_category", label: "Reply" },
                { key: "_draft", label: "Draft" },
              ].map(({ key, label }) => (
                <th key={key} className={thCls} onClick={() => !key.startsWith("_") && handleSort(key)}>
                  {label} {sortCol === key ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead) => {
              const isOpen = expandedLead === lead.id;
              return (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isExpanded={isOpen}
                  onToggle={() => setExpandedLead(isOpen ? null : lead.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAD ROW + EXPANDABLE DETAIL
// ═══════════════════════════════════════════════════════════════════
function LeadRow({ lead, isExpanded, onToggle }: { lead: any; isExpanded: boolean; onToggle: () => void }) {
  const td = "text-xs px-3 py-2.5 border-b border-[#F5F5F5]";

  // Build timeline from timestamps
  const timeline: { label: string; date: string | null; status: "done" | "active" | "pending" }[] = [
    { label: "Scraped", date: lead.scraped_at, status: lead.scraped_at ? "done" : "pending" },
    { label: "Enriched", date: lead.enriched_at, status: lead.enriched_at ? "done" : "pending" },
    { label: "Site Built", date: lead.site_built_at, status: lead.site_built_at ? "done" : "pending" },
    { label: "Site Approved", date: lead.site_approved_at, status: lead.site_approved_at ? "done" : "pending" },
    { label: "Sent", date: lead.sent_at, status: lead.sent_at ? "done" : "pending" },
    { label: "Replied", date: lead.replied_at, status: lead.replied_at ? "done" : "pending" },
  ];
  // Mark the last done item as "active" if there's a pending after it
  const lastDoneIdx = timeline.map(t => t.status).lastIndexOf("done");
  if (lastDoneIdx >= 0 && lastDoneIdx < timeline.length - 1) {
    timeline[lastDoneIdx].status = "active";
  }

  return (
    <>
      <tr className={`cursor-pointer transition-colors ${isExpanded ? "bg-[#F0F7FF]" : "hover:bg-[#F8FAFC]"}`} onClick={onToggle}>
        <td className={`${td} font-semibold text-[#1D1D1F]`}>{lead.business_name || "—"}</td>
        <td className={td}>{lead.city ? `${lead.city}, ${lead.state || ""}` : "—"}</td>
        <td className={td}>
          {lead.their_website_url ? (
            <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">
              {lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          ) : <span className="text-[#D1D1D6] text-[11px]">No website</span>}
        </td>
        <td className={td}>
          {lead.preview_site_url ? (
            <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
          ) : <span className="text-[#D1D1D6]">—</span>}
        </td>
        <td className={td}>
          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-lg ${STAGE_PILL[lead.stage] || "bg-gray-100 text-gray-500"}`}>
            {STAGE_LABELS[lead.stage as PipelineStage] || lead.stage}
          </span>
        </td>
        <td className={td}>{lead.emails_sent_count > 0 ? lead.emails_sent_count : "—"}</td>
        <td className={td}>
          {lead.reply_category ? (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${lead.reply_category === "interested" ? "bg-[#C8E6C9] text-[#1B5E20]" : lead.reply_category === "objection" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
              {lead.reply_category}
            </span>
          ) : "—"}
        </td>
        <td className={td}>
          {lead.draft_response ? (
            <span className="text-[#8E8E93] text-[11px] max-w-[200px] truncate inline-block" title={lead.draft_response}>
              &ldquo;{lead.draft_response.slice(0, 50)}...&rdquo;
            </span>
          ) : "—"}
        </td>
      </tr>

      {/* ── Expanded Detail Row ── */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-[#F8FAFF] border-b border-[#E5E5EA] p-5">
              <div className="grid grid-cols-3 gap-4">
                {/* Column 1: Contact Info */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Contact Info</div>
                  <div className="space-y-1">
                    {[
                      ["Owner", lead.owner_name || "—"],
                      ["Email", lead.owner_email || "—"],
                      ["Phone", lead.phone || "—"],
                      ["Rating", lead.rating ? `${lead.rating}★ (${lead.reviews_count || 0} reviews)` : "—"],
                      ["Website", lead.their_website_url ? lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "") : "None"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">{label}</span>
                        <span className="font-semibold text-right">{value}</span>
                      </div>
                    ))}
                    {lead.preview_site_url && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Preview</span>
                        <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] font-medium">View ↗</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Pipeline Timeline */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Pipeline Timeline</div>
                  <div className="space-y-0">
                    {timeline.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-1 relative">
                        {i < timeline.length - 1 && (
                          <div className="absolute left-[5px] top-[18px] bottom-[-4px] w-px bg-[#E5E5EA]" />
                        )}
                        <div className={`w-[11px] h-[11px] rounded-full flex-shrink-0 mt-0.5 ${
                          item.status === "done" ? "bg-[#34C759]" :
                          item.status === "active" ? "bg-[#FF9F0A] shadow-[0_0_0_3px_rgba(255,159,10,0.2)]" :
                          "bg-[#E5E5EA]"
                        }`} />
                        <div>
                          <span className="text-[11px] text-[#3C3C43]">{item.label}</span>
                          {item.date && <span className="text-[10px] text-[#AEAEB2] ml-1">{fmtTimestamp(item.date)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Conversation */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Conversation</div>
                  {lead.reply_text ? (
                    <>
                      <div className="bg-[#E8F5E9] rounded-xl rounded-bl-sm p-3 mb-2">
                        <div className="text-[10px] font-semibold text-[#2E7D32] mb-1">Their Reply</div>
                        <div className="text-xs text-[#1B5E20] leading-relaxed">{lead.reply_text}</div>
                      </div>
                      {lead.replied_at && (
                        <div className="text-[10px] text-[#FF9F0A] font-medium mb-2">
                          Time since reply: {daysSince(lead.replied_at)}d ago
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-[#C7C7CC]">No reply yet</div>
                  )}
                  {lead.draft_response && (
                    <div className="bg-[#F3E5F5] rounded-xl rounded-br-sm p-3 mt-2">
                      <div className="text-[10px] font-semibold text-[#7B1FA2] mb-1">Draft Response</div>
                      <div className="text-xs text-[#4A148C] leading-relaxed italic">{lead.draft_response}</div>
                    </div>
                  )}
                  <div className="mt-3 space-y-1">
                    {lead.emails_sent_count > 0 && (
                      <div className="text-[10px] text-[#8E8E93]">Emails sent: {lead.emails_sent_count}</div>
                    )}
                    {lead.draft_status && lead.draft_status !== "none" && (
                      <div className="text-[10px] text-[#7B1FA2] font-medium">Draft status: {lead.draft_status}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
