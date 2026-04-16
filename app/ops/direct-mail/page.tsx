"use client";

import { useEffect, useState, useCallback } from "react";
import { scoreNfcProspect, NFC_TIER_STYLES, type NfcTier } from "@/lib/nfc-scoring";

// ── Types ────────────────────────────────────────────────────────
interface Prospect {
  id: string;
  batch_id: string;
  business_name: string;
  city: string;
  state: string;
  rating: number;
  reviews_count: number;
  their_website_url: string | null;
  phone: string | null;
  owner_email: string | null;
  google_place_id: string | null;
  fl_license_type: string | null;
  photos: string[] | null;
  google_reviews: any[] | null;
  facebook_page_url: string | null;
  preview_site_url: string | null;
  stage: string;
  has_estimate_widget: boolean;
  nfc_tier: string | null;
  nfc_score: number | null;
  nfc_card_number: number | null;
  nfc_assigned_at: string | null;
  qr_code_url: string | null;
  letter_status: string | null;
  site_approved_at: string | null;
  stage_entered_at: string;
  created_at: string;
}

interface Batch {
  id: string;
  name: string;
  week_start: string;
  week_end: string;
  status: string;
  city_targets: string[];
  created_at: string;
}

type ApprovalState = "approved" | "skipped" | "rejected";

// ── Stage display for direct mail flow ───────────────────────────
const STAGE_DISPLAY: Record<string, { label: string; color: string }> = {
  scraped: { label: "Scraped", color: "bg-gray-100 text-gray-500" },
  google_enriched: { label: "Enriched", color: "bg-blue-50 text-blue-600" },
  enriched: { label: "Enriched", color: "bg-blue-50 text-blue-600" },
  ai_rewritten: { label: "Enriched", color: "bg-blue-50 text-blue-600" },
  site_built: { label: "Site Ready", color: "bg-[#EDE7F6] text-[#5E35B1]" },
  site_approved: { label: "Approved", color: "bg-[#C8E6C9] text-[#1B5E20]" },
  sent: { label: "Mailed", color: "bg-[#E0F7FA] text-[#00838F]" },
};

// ── Helpers ──────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function computeNfc(lead: Prospect) {
  return scoreNfcProspect({
    google_place_id: lead.google_place_id,
    has_estimate_widget: lead.has_estimate_widget,
    rating: lead.rating,
    reviews_count: lead.reviews_count,
    their_website_url: lead.their_website_url,
    website_status: lead.their_website_url ? "has_website" : "none",
    fl_license_type: lead.fl_license_type,
    photos: lead.photos,
    google_reviews: lead.google_reviews,
    phone: lead.phone,
    facebook_page_url: lead.facebook_page_url,
    business_name: lead.business_name,
  });
}

// ── Main Page ────────────────────────────────────────────────────
export default function DirectMailPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [prospects, setProspects] = useState<Record<string, Prospect[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const [approving, setApproving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [collapsedBatches, setCollapsedBatches] = useState<Set<string>>(new Set());

  // ── Fetch pipeline data ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ops/pipeline");
      if (!res.ok) throw new Error("Failed to fetch pipeline");
      const data = await res.json();
      setBatches(data.batches || []);

      // Auto-expand first active batch
      if (data.batches?.length && !expandedBatch) {
        const firstActive = data.batches.find((b: Batch) => b.status === "active");
        if (firstActive) {
          setExpandedBatch(firstActive.id);
          await fetchLeads(firstActive.id);
        }
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only show prospects that have reached site_built or beyond — earlier stages are noise
  const ACTIONABLE_STAGES = new Set(["site_built", "site_approved", "sent", "interested", "paid", "not_now"]);

  const fetchLeads = useCallback(async (batchId: string) => {
    try {
      const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
      if (!res.ok) return;
      const allLeads: Prospect[] = await res.json();
      const actionable = allLeads.filter((p) => ACTIONABLE_STAGES.has(p.stage));
      setProspects((prev) => ({ ...prev, [batchId]: actionable }));

      // Initialize approval states — site_built = ready to approve, site_approved = already done
      const states: Record<string, ApprovalState> = {};
      actionable.forEach((p) => {
        if (p.site_approved_at || p.stage === "site_approved" || p.stage === "sent") {
          states[p.id] = "approved";
        } else if (p.stage === "site_built" && p.preview_site_url) {
          states[p.id] = "approved"; // default to approved, click to change
        } else {
          states[p.id] = "skipped";
        }
      });
      setApprovalStates((prev) => ({ ...prev, ...states }));
    } catch (err) {
      console.error("Leads fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Expand a batch ────────────────────────────────────────────
  async function handleExpandBatch(batchId: string) {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      return;
    }
    setExpandedBatch(batchId);
    if (!prospects[batchId]) {
      await fetchLeads(batchId);
    }
  }

  // ── Toggle approval state ────────────────────────────────────
  function cycleApproval(id: string) {
    setApprovalStates((prev) => {
      const current = prev[id] || "skipped";
      const next: ApprovalState =
        current === "approved" ? "skipped" : current === "skipped" ? "rejected" : "approved";
      return { ...prev, [id]: next };
    });
  }

  // ── Submit approvals ─────────────────────────────────────────
  async function handleApproveSelected(batchId: string) {
    const batchLeads = prospects[batchId] || [];
    const toApprove = batchLeads.filter(
      (p) => approvalStates[p.id] === "approved" && p.stage === "site_built"
    );
    const toReject = batchLeads.filter(
      (p) => approvalStates[p.id] === "rejected" && p.stage === "site_built"
    );

    if (toApprove.length === 0 && toReject.length === 0) return;
    setApproving(true);

    try {
      // Approve selected
      if (toApprove.length > 0) {
        await fetch("/api/ops/gates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gate_type: "site_review",
            batch_id: batchId,
            action: "approve_selected",
            prospect_ids: toApprove.map((p) => p.id),
          }),
        });
      }

      // Reject selected
      if (toReject.length > 0) {
        await fetch("/api/ops/gates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gate_type: "site_review",
            batch_id: batchId,
            action: "reject_selected",
            prospect_ids: toReject.map((p) => p.id),
          }),
        });
      }

      // Refresh
      await fetchLeads(batchId);
      await fetchData();
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setApproving(false);
    }
  }

  // ── Collapse toggle ──────────────────────────────────────────
  function toggleCollapse(batchId: string) {
    setCollapsedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  // ── Approval style map ───────────────────────────────────────
  const stateStyles: Record<ApprovalState, { card: string; check: string; icon: string; label: string }> = {
    approved: {
      card: "border-[#34C759] bg-[#F0FFF4]",
      check: "bg-[#34C759] border-[#34C759] text-white",
      icon: "✓",
      label: "Approved",
    },
    skipped: {
      card: "border-[#E5E5EA] bg-white",
      check: "bg-white border-[#D1D1D6] text-transparent",
      icon: "—",
      label: "Skipped",
    },
    rejected: {
      card: "border-[#EF4444] bg-[#FEF2F2] opacity-50",
      check: "bg-[#EF4444] border-[#EF4444] text-white",
      icon: "✗",
      label: "Rejected",
    },
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-8 py-12 text-center">
        <div className="text-sm text-[#8E8E93]">Loading direct mail pipeline...</div>
      </div>
    );
  }

  // ── Sort batches: active first, then by date ─────────────────
  const sortedBatches = [...batches].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="px-8 py-6 max-w-[1100px] mx-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Direct Mail</h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Review prospects, approve sites, assign NFC cards
          </p>
        </div>
        <div className="text-[10px] text-[#AEAEB2]">
          Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {sortedBatches.length === 0 && (
        <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-12 text-center">
          <div className="text-2xl mb-2">📬</div>
          <div className="text-sm font-semibold text-[#3C3C43]">No batches yet</div>
          <div className="text-xs text-[#8E8E93] mt-1">
            Tell Claude to scrape prospects and they&apos;ll show up here
          </div>
        </div>
      )}

      {/* ── Batch cards ─────────────────────────────────────── */}
      {sortedBatches.map((batch, batchIdx) => {
        const isActive = batch.status === "active";
        const isCollapsed = collapsedBatches.has(batch.id);
        const batchLeads = prospects[batch.id] || [];
        const isExpanded = expandedBatch === batch.id;

        // Compute stats
        const siteBuilt = batchLeads.filter((p) => p.stage === "site_built" && p.preview_site_url);
        const siteApproved = batchLeads.filter(
          (p) => p.site_approved_at || p.stage === "site_approved" || p.stage === "sent"
        );
        const withNfc = batchLeads.filter((p) => p.nfc_card_number);
        const withQr = batchLeads.filter((p) => p.qr_code_url);
        const totalWithSites = siteBuilt.length + siteApproved.length;

        // Count pending approvals
        const pendingApprovals = batchLeads.filter(
          (p) => p.stage === "site_built" && p.preview_site_url
        ).length;

        // NFC tier breakdown
        const nfcBreakdown = batchLeads.reduce(
          (acc, p) => {
            const nfc = computeNfc(p);
            acc[nfc.tier] = (acc[nfc.tier] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return (
          <div
            key={batch.id}
            className={`bg-white rounded-[14px] border ${
              isActive ? "border-[#007AFF33]" : "border-[#E5E5EA]"
            } mb-4 overflow-hidden transition-all`}
          >
            {/* ── Batch header ──────────────────────────────── */}
            <div
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              onClick={() => {
                if (!isActive) {
                  toggleCollapse(batch.id);
                } else {
                  handleExpandBatch(batch.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-[#007AFF]" : "bg-[#D1D1D6]"
                  }`}
                />
                <div>
                  <div className="text-[13px] font-semibold">
                    Batch {batchIdx + 1}
                    <span className="text-[#8E8E93] font-normal ml-1.5">
                      {batch.city_targets?.join(", ") || "—"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#AEAEB2] mt-0.5">
                    {fmtDate(batch.week_start)} — {batchLeads.length} prospects
                    {pendingApprovals > 0 && (
                      <span className="text-[#FF9F0A] font-semibold ml-1.5">
                        · {pendingApprovals} awaiting review
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* NFC tier chips */}
                {batchLeads.length > 0 && (
                  <div className="flex gap-1">
                    {(["platinum", "gold", "silver", "skip"] as NfcTier[]).map((tier) =>
                      nfcBreakdown[tier] ? (
                        <span
                          key={tier}
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${NFC_TIER_STYLES[tier].bg} ${NFC_TIER_STYLES[tier].text} border ${NFC_TIER_STYLES[tier].border}`}
                        >
                          {nfcBreakdown[tier]} {tier}
                        </span>
                      ) : null
                    )}
                  </div>
                )}

                {/* Progress indicators */}
                <div className="flex items-center gap-2 text-[10px] text-[#8E8E93]">
                  {totalWithSites > 0 && (
                    <span>
                      {siteApproved.length}/{totalWithSites} approved
                    </span>
                  )}
                  {withNfc.length > 0 && <span>· {withNfc.length} NFC</span>}
                </div>

                {/* Expand arrow */}
                <svg
                  className={`w-4 h-4 text-[#C7C7CC] transition-transform ${
                    isExpanded || (!isActive && !isCollapsed) ? "" : "-rotate-90"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* ── Processing state — batch exists but no sites built yet ── */}
            {((isActive && isExpanded) || (!isActive && !isCollapsed)) && batchLeads.length === 0 && (
              <div className="border-t border-[#E5E5EA] px-5 py-8 text-center bg-[#FAFAFA]">
                <div className="text-lg mb-1">⏳</div>
                <div className="text-[13px] font-semibold text-[#3C3C43]">Pipeline in progress</div>
                <div className="text-[11px] text-[#8E8E93] mt-1">
                  Prospects are being scraped and enriched. Cards will appear here once preview sites are built.
                </div>
              </div>
            )}

            {/* ── Expanded content ──────────────────────────── */}
            {((isActive && isExpanded) || (!isActive && !isCollapsed)) && batchLeads.length > 0 && (
              <div className="border-t border-[#E5E5EA]">
                {/* ── Action bar ────────────────────────────── */}
                {pendingApprovals > 0 && (
                  <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#E5E5EA] flex items-center justify-between">
                    <div className="text-[11px] text-[#8E8E93]">
                      Click card to toggle: <span className="text-[#34C759] font-semibold">✓ Approve</span>{" "}
                      → <span className="text-[#AEAEB2]">— Skip</span> →{" "}
                      <span className="text-[#EF4444]">✗ Reject</span>
                    </div>
                    <button
                      onClick={() => handleApproveSelected(batch.id)}
                      disabled={approving}
                      className="text-[11px] font-semibold bg-[#34C759] text-white hover:bg-[#2DA44E] px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {approving ? "Saving..." : "Submit Decisions"}
                    </button>
                  </div>
                )}

                {/* ── Prospect cards ────────────────────────── */}
                <div className="p-4">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-2.5">
                    {batchLeads.map((lead) => {
                      const state = approvalStates[lead.id] || "skipped";
                      const s = stateStyles[state];
                      const nfcResult = computeNfc(lead);
                      const nfcStyle = NFC_TIER_STYLES[nfcResult.tier];
                      const isAlreadyApproved =
                        lead.site_approved_at || lead.stage === "site_approved" || lead.stage === "sent";
                      const canToggle = lead.stage === "site_built" && lead.preview_site_url;
                      const previewUrl = lead.preview_site_url
                        ? lead.preview_site_url.startsWith("http")
                          ? lead.preview_site_url
                          : `https://ruufpro.com${lead.preview_site_url}`
                        : null;

                      return (
                        <div
                          key={lead.id}
                          onClick={() => canToggle && cycleApproval(lead.id)}
                          className={`border rounded-[10px] p-3 transition-all ${
                            canToggle ? "cursor-pointer hover:shadow-sm" : ""
                          } ${isAlreadyApproved ? "border-[#34C759] bg-[#F0FFF4]" : s.card}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div
                                className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center text-xs font-bold ${
                                  isAlreadyApproved ? stateStyles.approved.check : s.check
                                }`}
                              >
                                {isAlreadyApproved ? "✓" : s.icon}
                              </div>
                              {isAlreadyApproved && (
                                <div className="text-[8px] font-bold uppercase text-[#34C759] mt-0.5">
                                  Done
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-semibold truncate">
                                  {lead.business_name || "Unknown"}
                                </span>
                                <span
                                  className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${nfcStyle.bg} ${nfcStyle.text} border ${nfcStyle.border}`}
                                >
                                  {nfcResult.tier} {nfcResult.score}pts
                                </span>
                                {STAGE_DISPLAY[lead.stage] && (
                                  <span
                                    className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${STAGE_DISPLAY[lead.stage].color}`}
                                  >
                                    {STAGE_DISPLAY[lead.stage].label}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#8E8E93] mt-0.5">
                                {lead.city ? `${lead.city}, ${lead.state || ""}` : ""}
                                {lead.rating > 0 ? ` · ${lead.rating}★` : ""}
                                {lead.reviews_count > 0 ? ` (${lead.reviews_count} reviews)` : ""}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {lead.their_website_url ? (
                                  <span className="text-[9px] text-[#8E8E93]">Has website</span>
                                ) : (
                                  <span className="text-[9px] text-[#FF9F0A] font-semibold">No website</span>
                                )}
                                {lead.fl_license_type && (
                                  <span className="text-[9px] text-[#2E7D32]">Licensed</span>
                                )}
                                {lead.phone && (
                                  <span className="text-[9px] text-[#007AFF]">Has phone</span>
                                )}
                                {lead.nfc_card_number && (
                                  <span className="text-[9px] font-bold text-[#5E35B1] bg-[#EDE7F6] px-1.5 py-0.5 rounded">
                                    NFC #{lead.nfc_card_number}
                                  </span>
                                )}
                                {lead.qr_code_url && (
                                  <span className="text-[9px] text-[#00838F]">QR ready</span>
                                )}
                                {lead.letter_status && (
                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                      lead.letter_status === "mailed"
                                        ? "bg-[#C8E6C9] text-[#1B5E20]"
                                        : lead.letter_status === "printed"
                                        ? "bg-[#FFF8E1] text-[#F57F17]"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {lead.letter_status}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* View Site button */}
                            {previewUrl && (
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-white bg-[#007AFF] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0056D2] flex-shrink-0 transition-colors"
                              >
                                View Site ↗
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Batch summary footer ──────────────────── */}
                <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#E5E5EA] flex items-center justify-between text-[10px] text-[#8E8E93]">
                  <div className="flex gap-4">
                    <span>{batchLeads.length} total</span>
                    <span>{siteApproved.length} approved</span>
                    <span>{withNfc.length} NFC assigned</span>
                    <span>{withQr.length} QR generated</span>
                  </div>
                  {!isActive && (
                    <button
                      onClick={() => toggleCollapse(batch.id)}
                      className="text-[#007AFF] font-semibold hover:underline"
                    >
                      Collapse
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Collapsed state for inactive batches ──────── */}
            {!isActive && isCollapsed && batchLeads.length > 0 && (
              <div className="px-5 py-2 border-t border-[#F2F2F7] text-[10px] text-[#AEAEB2]">
                {batchLeads.length} prospects · {siteApproved.length} approved · {withNfc.length} NFC
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
