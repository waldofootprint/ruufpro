"use client";

import { useState, useEffect } from "react";
import { getIcpScore, ICP_STYLES } from "./shared";

type TriageState = "selected" | "parked" | "skipped";

export function TriagePanel({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, TriageState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [parkReason, setParkReason] = useState<Record<string, string>>({});
  const [tierFilter, setTierFilter] = useState<"all" | "gold" | "silver">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const triageLeads = data.filter((l: any) => l.stage === "awaiting_triage" && !l.triage_decision);
          setLeads(triageLeads);
          const initial: Record<string, TriageState> = {};
          triageLeads.forEach((l: any) => { initial[l.id] = "selected"; });
          setStates(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  function cycleState(id: string) {
    setStates((prev) => {
      const current = prev[id] || "selected";
      const next: TriageState = current === "selected" ? "parked" : current === "parked" ? "skipped" : "selected";
      return { ...prev, [id]: next };
    });
  }

  function selectAllGold() {
    setStates((prev) => {
      const next = { ...prev };
      leads.forEach((lead) => {
        const score = getIcpScore(lead);
        if (score.tier === "gold") next[lead.id] = "selected";
      });
      return next;
    });
  }

  async function handleSubmitTriage() {
    setSubmitting(true);
    try {
      const decisions = Object.entries(states).map(([id, decision]) => ({
        id,
        decision,
        parked_reason: decision === "parked" ? (parkReason[id] || "") : undefined,
      }));

      const res = await fetch("/api/ops/pipeline/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Triage complete: ${data.selected} selected · ${data.parked} parked · ${data.skipped} skipped`);
        onDone();
      } else {
        const err = await res.json();
        alert(`Triage failed: ${err.error}`);
      }
    } catch { alert("Network error"); }
    finally { setSubmitting(false); }
  }

  const selectedCount = Object.values(states).filter(s => s === "selected").length;
  const parkedCount = Object.values(states).filter(s => s === "parked").length;
  const skippedCount = Object.values(states).filter(s => s === "skipped").length;

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading prospects for triage...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No prospects awaiting triage</div>;

  const triageStyles: Record<TriageState, { card: string; badge: string; label: string }> = {
    selected: { card: "border-[#34C759] bg-[#F0FFF4]", badge: "bg-[#34C759] text-white", label: "Selected" },
    parked: { card: "border-[#FF9F0A] bg-[#FFF8E1]", badge: "bg-[#FF9F0A] text-white", label: "Parked" },
    skipped: { card: "border-[#D1D1D6] bg-[#F5F5F7] opacity-50", badge: "bg-[#8E8E93] text-white", label: "Skipped" },
  };

  function getDataRichness(lead: any): { icons: string; label: string } {
    const parts: string[] = [];
    const labels: string[] = [];

    const hasGooglePhotos = lead.photos && Array.isArray(lead.photos) && lead.photos.length > 0;
    const hasGoogleReviews = lead.google_reviews && Array.isArray(lead.google_reviews) && lead.google_reviews.length > 0;
    const hasFbPage = lead.facebook_page_url;
    const hasFbPhotos = lead.facebook_photos && Array.isArray(lead.facebook_photos) && lead.facebook_photos.length > 0;
    const fbStatus = lead.facebook_enrichment_status;

    if (hasGooglePhotos) { parts.push("📷"); labels.push(`${lead.photos.length} Google photos`); }
    if (hasGoogleReviews) { parts.push("⭐"); labels.push(`${lead.google_reviews.length} reviews`); }
    if (lead.extracted_services?.length > 0) { parts.push("🔧"); labels.push(`${lead.extracted_services.length} services`); }
    if (hasFbPage) { parts.push("📘"); labels.push("FB page"); }
    if (hasFbPhotos) { parts.push("🖼"); labels.push(`${lead.facebook_photos.length} FB photos`); }

    if (fbStatus === "no_match") { parts.push("⚪"); labels.push("No FB page found"); }
    if (fbStatus === "error") { parts.push("🔴"); labels.push("FB enrichment error"); }

    if (parts.length === 0) return { icons: "—", label: "No data" };
    return { icons: parts.join(""), label: labels.join(" · ") };
  }

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Triage Prospects</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">
            {selectedCount} selected · {parkedCount} parked · {skippedCount} skipped
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAllGold}
            className="text-[11px] font-semibold bg-[#FFF8E1] text-[#92400E] border border-[#FDE68A] hover:bg-[#FDE68A] px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Select All Gold
          </button>
          <button
            onClick={handleSubmitTriage}
            disabled={submitting}
            className="text-[11px] font-semibold bg-[#34C759] text-white hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-3.5 py-1.5 rounded-lg transition-colors"
          >
            {submitting ? "Processing..." : `Confirm Triage (${leads.length})`}
          </button>
        </div>
      </div>

      {/* Tier filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {(["all", "gold", "silver"] as const).map((t) => {
          const count = t === "all" ? leads.length : leads.filter(l => getIcpScore(l).tier === t).length;
          const active = tierFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-lg border transition-colors ${
                active
                  ? t === "gold" ? "bg-[#FFF8E1] text-[#92400E] border-[#FDE68A]"
                  : t === "silver" ? "bg-[#F5F5F7] text-[#3C3C43] border-[#D1D1D6]"
                  : "bg-[#007AFF] text-white border-[#007AFF]"
                  : "bg-white text-[#8E8E93] border-[#E5E5EA] hover:bg-[#F5F5F7]"
              }`}
            >
              {t === "all" ? "All" : t === "gold" ? "Gold" : "Silver"} ({count})
            </button>
          );
        })}
      </div>

      <div className="text-[11px] text-[#8E8E93] mb-3 px-3 py-2 bg-[#F0F7FF] rounded-lg border border-[#007AFF22]">
        <strong className="text-[#007AFF]">How it works:</strong> All prospects start selected (green). Click to park (amber), click again to skip (gray). Parked leads can be revived later.
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2.5">
        {leads.filter(l => tierFilter === "all" || getIcpScore(l).tier === tierFilter).map((lead) => {
          const state = states[lead.id] || "selected";
          const s = triageStyles[state];
          const score = getIcpScore(lead);
          const richness = getDataRichness(lead);
          const tierStyle = ICP_STYLES[score.tier as keyof typeof ICP_STYLES] || ICP_STYLES.silver;

          return (
            <div
              key={lead.id}
              className={`border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${s.card}`}
            >
              {/* Top row: badge + business name + tier */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => cycleState(lead.id)}
                    className={`text-[9px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-md flex-shrink-0 ${s.badge}`}
                  >
                    {s.label}
                  </button>
                  <div className="text-[13px] font-semibold truncate">{lead.business_name}</div>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md flex-shrink-0 ${tierStyle.bg} ${tierStyle.text}`}>
                  {score.tier}
                </span>
              </div>

              {/* Location + website */}
              <div className="text-[11px] text-[#8E8E93] mb-2">
                {lead.city}, {lead.state || "FL"}
                {lead.their_website_url
                  ? ` · ${lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}`
                  : " · No website"}
              </div>

              {/* Rating + reviews */}
              <div className="flex items-center gap-3 mb-2">
                {lead.rating && (
                  <span className="text-[11px] font-semibold text-[#3C3C43]">
                    {lead.rating}★
                  </span>
                )}
                {lead.reviews_count != null && (
                  <span className="text-[11px] text-[#8E8E93]">
                    {lead.reviews_count} reviews
                  </span>
                )}
                {lead.phone && (
                  <span className="text-[11px] text-[#8E8E93]">{lead.phone}</span>
                )}
              </div>

              {/* Data richness */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px]">{richness.icons}</span>
                <span className="text-[10px] text-[#8E8E93]">{richness.label}</span>
              </div>

              {/* Extracted services */}
              {lead.extracted_services?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {lead.extracted_services.slice(0, 4).map((svc: string) => (
                    <span key={svc} className="text-[9px] bg-[#E5E5EA] text-[#3C3C43] px-1.5 py-0.5 rounded">
                      {svc}
                    </span>
                  ))}
                  {lead.extracted_services.length > 4 && (
                    <span className="text-[9px] text-[#8E8E93]">+{lead.extracted_services.length - 4}</span>
                  )}
                </div>
              )}

              {/* Park reason (only when parked) */}
              {state === "parked" && (
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={parkReason[lead.id] || ""}
                  onChange={(e) => setParkReason((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[11px] border border-[#FDE68A] rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:border-[#FF9F0A] bg-white"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
