"use client";

import { useState, useEffect } from "react";
import type { PipelineStage } from "@/lib/ops-pipeline";
import { STAGE_LABELS } from "@/lib/ops-pipeline";
import { OUTREACH_METHOD_LABELS } from "@/lib/prospect-scoring";
import { getIcpScore, ICP_STYLES, STAGE_PILL, fmtTimestamp, daysSince } from "./shared";

// ── "Why is this stuck?" helper ───────────────────────────────────
function getStuckReason(lead: any): { text: string; color: string } | null {
  const s = lead.stage;
  if (s === "scraped" && !lead.photos_enriched_at) return { text: "Needs enrichment", color: "text-[#8E8E93] bg-[#F5F5F7]" };
  if (s === "google_enriched" || s === "awaiting_triage") return { text: "Needs triage", color: "text-[#F57F17] bg-[#FFF8E1]" };
  if (s === "site_built" && !lead.site_approved_at) return { text: "Needs site review", color: "text-[#F57F17] bg-[#FFF8E1]" };
  if (s === "site_approved" || s === "contact_lookup") return { text: "Looking up contact", color: "text-[#8E8E93] bg-[#F5F5F7]" };
  if (s === "contact_ready") return { text: "Needs outreach approval", color: "text-[#F57F17] bg-[#FFF8E1]" };
  if (s === "outreach_approved") {
    const method = lead.outreach_method;
    if (method === "cold_email" && !lead.owner_email) return { text: "NO EMAIL", color: "text-white bg-[#FF3B30]" };
    if (method === "form" && !lead.contact_form_url) return { text: "NO FORM", color: "text-white bg-[#FF3B30]" };
    return { text: "Ready to send", color: "text-[#34C759] bg-[#F0FFF4]" };
  }
  if (s === "sent" || s === "awaiting_reply") return { text: "Awaiting reply", color: "text-[#007AFF] bg-[#EFF6FF]" };
  if (s === "replied" || s === "draft_ready") return { text: "Draft needs review", color: "text-[#F57F17] bg-[#FFF8E1]" };
  return null;
}

const STAGE_ORDER: string[] = ["scraped", "enriched", "site_built", "site_approved", "outreach_approved", "sent", "awaiting_reply", "replied", "draft_ready", "responded", "interested", "free_signup", "paid", "not_now", "objection", "unsubscribed"];

const STAGE_ICONS: Record<string, string> = {
  scraped: "🔍", enriched: "📋", site_built: "🏗", site_approved: "✅",
  outreach_approved: "📤", sent: "📬", awaiting_reply: "⏳", replied: "💬",
  draft_ready: "📝", responded: "↩", interested: "🟢", free_signup: "🎉",
  paid: "💰", not_now: "⏸", objection: "🔴", unsubscribed: "❌",
};

export function BatchLeadTable({ batchId }: { batchId: string }) {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [advancing, setAdvancing] = useState(false);
  const [sortCol, setSortCol] = useState<string>("business_name");
  const [sortAsc, setSortAsc] = useState(true);

  const leads = allLeads;

  function handleSort(col: string) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  }

  function sortLeads(list: any[]) {
    return [...list].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === "rating" || sortCol === "reviews_count" || sortCol === "years_in_business") {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
        return sortAsc ? av - bv : bv - av;
      }
      av = (av || "").toString().toLowerCase();
      bv = (bv || "").toString().toLowerCase();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  async function fetchLeads() {
    try {
      const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
      if (res.ok) setAllLeads(await res.json());
    } catch (err) { console.error("Failed to fetch leads:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeads(); }, [batchId]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAllInStage(stage: string) {
    const stageLeads = leads.filter(l => l.stage === stage).map(l => l.id);
    const allSelected = stageLeads.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      stageLeads.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  async function advanceSelected() {
    if (selected.size === 0) return;
    setAdvancing(true);
    try {
      const res = await fetch("/api/ops/pipeline/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      if (res.ok) {
        setSelected(new Set());
        await fetchLeads();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch { alert("Network error"); }
    finally { setAdvancing(false); }
  }

  const [enrichingSelected, setEnrichingSelected] = useState(false);
  const [buildingSelected, setBuildingSelected] = useState(false);
  const [enrichingPhotosSelected, setEnrichingPhotosSelected] = useState(false);

  async function enrichSelected() {
    if (selected.size === 0) return;
    setEnrichingSelected(true);
    try {
      const res = await fetch("/api/ops/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Enriched ${data.enriched} · ${data.no_match} no match · ${data.credits_used} credits used`);
        setSelected(new Set());
        await fetchLeads();
      } else { alert(`Failed: ${data.error}`); }
    } catch { alert("Network error"); }
    finally { setEnrichingSelected(false); }
  }

  async function enrichPhotosSelected() {
    if (selected.size === 0) return;
    setEnrichingPhotosSelected(true);
    try {
      const res = await fetch("/api/ops/enrich-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Photos enriched: ${data.enriched}/${data.total} · Cost: ${data.estimated_cost}`);
        setSelected(new Set());
        await fetchLeads();
      } else { alert(`Failed: ${data.error}`); }
    } catch { alert("Network error"); }
    finally { setEnrichingPhotosSelected(false); }
  }

  async function buildSitesSelected() {
    if (selected.size === 0) return;
    setBuildingSelected(true);
    try {
      const res = await fetch("/api/ops/build-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Built ${data.built}/${data.total} sites`);
        setSelected(new Set());
        await fetchLeads();
      } else { alert(`Failed: ${data.error}`); }
    } catch { alert("Network error"); }
    finally { setBuildingSelected(false); }
  }

  if (loading) return <div className="p-6 text-center text-[#8E8E93] text-sm">Loading leads...</div>;
  if (leads.length === 0) return <div className="p-6 text-center text-[#8E8E93] text-sm">No leads in this batch</div>;

  const selectedLeads = leads.filter(l => selected.has(l.id));
  const selectedNeedEnrich = selectedLeads.filter(l => !l.enriched_at);
  const selectedNeedPhotos = selectedLeads.filter(l => l.google_place_id && !l.photos_enriched_at);
  const selectedNeedSites = selectedLeads.filter(l => (l.stage === "scraped" || l.stage === "enriched") && !l.preview_site_url);

  const stageGroups = STAGE_ORDER
    .map(stage => ({ stage, leads: leads.filter(l => l.stage === stage) }));

  return (
    <div>
      {/* Action bar when items selected */}
      {selected.size > 0 && (
        <div className="px-5 py-2.5 bg-[#EFF6FF] border-b border-[#007AFF33] flex items-center justify-between sticky top-[52px] z-10">
          <span className="text-xs font-semibold text-[#007AFF]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear
            </button>
            {selectedNeedEnrich.length > 0 && (
              <button
                onClick={enrichSelected}
                disabled={enrichingSelected}
                className="text-[11px] font-semibold text-white bg-[#E65100] hover:bg-[#BF360C] disabled:bg-[#FFAB91] px-4 py-1.5 rounded-lg transition-colors"
              >
                {enrichingSelected ? "Enriching..." : `Enrich ${selectedNeedEnrich.length} Emails`}
              </button>
            )}
            {selectedNeedPhotos.length > 0 && (
              <button
                onClick={enrichPhotosSelected}
                disabled={enrichingPhotosSelected}
                className="text-[11px] font-semibold text-white bg-[#00796B] hover:bg-[#004D40] disabled:bg-[#80CBC4] px-4 py-1.5 rounded-lg transition-colors"
              >
                {enrichingPhotosSelected ? "Enriching..." : `📷 Photos ${selectedNeedPhotos.length}`}
              </button>
            )}
            {selectedNeedSites.length > 0 && (
              <button
                onClick={buildSitesSelected}
                disabled={buildingSelected}
                className="text-[11px] font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-[#90CAF9] px-4 py-1.5 rounded-lg transition-colors"
              >
                {buildingSelected ? "Building..." : `🏠 Build ${selectedNeedSites.length} Sites`}
              </button>
            )}
            <button
              onClick={advanceSelected}
              disabled={advancing}
              className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-4 py-1.5 rounded-lg transition-colors"
            >
              {advancing ? "Advancing..." : `Advance ${selected.size} →`}
            </button>
          </div>
        </div>
      )}

      {/* Stage-grouped dropdowns */}
      {stageGroups.map(({ stage, leads: stageLeads }) => {
        const isOpen = expandedStage === stage;
        const stageSelected = stageLeads.filter(l => selected.has(l.id)).length;
        const allSelected = stageLeads.every(l => selected.has(l.id));
        const sorted = sortLeads(stageLeads);

        return (
          <div key={stage} className="border-b border-[#F2F2F7] last:border-b-0">
            <button
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
              onClick={() => setExpandedStage(isOpen ? null : stage)}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-[#C7C7CC]">{isOpen ? "▼" : "▶"}</span>
                <span className="text-sm">{STAGE_ICONS[stage] || "○"}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${STAGE_PILL[stage] || "bg-gray-100 text-gray-500"}`}>
                  {STAGE_LABELS[stage as PipelineStage] || stage}
                </span>
                <span className="text-[13px] font-bold text-[#1D1D1F]">{stageLeads.length}</span>
                {stageSelected > 0 && (
                  <span className="text-[10px] font-medium text-[#007AFF]">({stageSelected} selected)</span>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="bg-[#FAFAFA]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5EA]">
                        <th className="px-3 py-2 w-8">
                          <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAllInStage(stage)} className="w-3.5 h-3.5 rounded border-[#D1D1D6] text-[#007AFF] cursor-pointer" />
                        </th>
                        {[
                          { key: "business_name", label: "Business" },
                          { key: "city", label: "City" },
                          { key: "rating", label: "Rating" },
                          { key: "reviews_count", label: "Reviews" },
                          { key: "_data_richness", label: "Site Readiness" },
                          { key: "their_website_url", label: "Website" },
                          { key: "preview_site_url", label: "Preview" },
                        ].map(({ key, label }) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="text-[10px] uppercase tracking-[0.06em] text-[#AEAEB2] font-semibold text-left px-3 py-2 cursor-pointer hover:text-[#1D1D1F] select-none"
                          >
                            {label} {sortCol === key ? (sortAsc ? "▲" : "▼") : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((lead) => {
                        const isChecked = selected.has(lead.id);
                        const icp = getIcpScore(lead);
                        const icpStyle = ICP_STYLES[icp.tier];
                        const domain = lead.their_website_url?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
                        const td = "text-xs px-3 py-2.5 border-b border-[#F0F0F2]";

                        const photoCount = lead.photos?.length || 0;
                        const reviewCount = lead.google_reviews?.length || 0;
                        const serviceCount = lead.extracted_services?.length || 0;
                        const hasEmail = !!lead.owner_email;
                        const hasPhone = !!lead.phone && lead.phone !== "unknown";
                        const richnessChecks = [photoCount > 0, reviewCount > 0, serviceCount > 0, hasEmail, hasPhone];
                        const richnessScore = richnessChecks.filter(Boolean).length;
                        const richnessMax = richnessChecks.length;
                        const richnessColor = richnessScore >= 4 ? "text-[#34C759]" : richnessScore >= 2 ? "text-[#FF9F0A]" : "text-[#FF3B30]";
                        const richnessLabel = richnessScore >= 4 ? "Rich" : richnessScore >= 2 ? "Partial" : "Bare";

                        return (
                          <tr key={lead.id} className={`transition-colors ${isChecked ? "bg-[#EFF6FF]" : "hover:bg-white"}`}>
                            <td className={`${td} w-8`}>
                              <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(lead.id)} className="w-4 h-4 rounded border-[#D1D1D6] text-[#007AFF] cursor-pointer" />
                            </td>
                            <td className={`${td} font-semibold text-[#1D1D1F]`}>
                              <div className="flex items-center gap-2">
                                {lead.business_name || "Unknown"}
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${icpStyle.bg} ${icpStyle.text} border ${icpStyle.border}`}>{icpStyle.label}</span>
                                {(() => {
                                  const stuck = getStuckReason(lead);
                                  return stuck ? <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${stuck.color}`}>{stuck.text}</span> : null;
                                })()}
                              </div>
                            </td>
                            <td className={td}>{lead.city ? `${lead.city}, ${lead.state || "FL"}` : "—"}</td>
                            <td className={td}>{lead.rating > 0 ? `${lead.rating}★` : "—"}</td>
                            <td className={td}>{lead.reviews_count > 0 ? lead.reviews_count : "—"}</td>
                            <td className={td}>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold ${richnessColor}`}>{richnessScore}/{richnessMax}</span>
                                <div className="flex gap-0.5" title={`Photos: ${photoCount} · Reviews: ${reviewCount} · Services: ${serviceCount} · Email: ${hasEmail ? "Yes" : "No"} · Phone: ${hasPhone ? "Yes" : "No"}`}>
                                  <span className={`text-[9px] ${photoCount > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={`${photoCount} photos`}>📷{photoCount > 0 ? photoCount : ""}</span>
                                  <span className={`text-[9px] ${reviewCount > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={`${reviewCount} reviews`}>⭐{reviewCount > 0 ? reviewCount : ""}</span>
                                  <span className={`text-[9px] ${serviceCount > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={`${serviceCount} services`}>🔧{serviceCount > 0 ? serviceCount : ""}</span>
                                  <span className={`text-[9px] ${hasEmail ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={hasEmail ? lead.owner_email : "No email"}>✉</span>
                                  <span className={`text-[9px] ${hasPhone ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={hasPhone ? lead.phone : "No phone"}>📞</span>
                                </div>
                                <span className={`text-[8px] font-semibold uppercase ${richnessColor}`}>{richnessLabel}</span>
                              </div>
                            </td>
                            <td className={td}>
                              {domain ? (
                                <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline font-medium">{domain}</a>
                              ) : <span className="text-[#FF9F0A] font-medium">No website</span>}
                            </td>
                            <td className={td}>
                              {lead.preview_site_url ? (
                                <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
                              ) : <span className="text-[#D1D1D6]">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAD ROW + EXPANDABLE DETAIL (used in alternate table views)
// ═══════════════════════════════════════════════════════════════════
export function LeadRow({ lead, isExpanded, isSelected, onSelect, onToggle }: { lead: any; isExpanded: boolean; isSelected: boolean; onSelect: () => void; onToggle: () => void }) {
  const td = "text-xs px-3 py-2.5 border-b border-[#F5F5F5]";
  const icp = getIcpScore(lead);
  const icpStyle = ICP_STYLES[icp.tier];

  const timeline: { label: string; date: string | null; status: "done" | "active" | "pending" }[] = [
    { label: "Scraped", date: lead.scraped_at, status: lead.scraped_at ? "done" : "pending" },
    { label: "Enriched", date: lead.enriched_at, status: lead.enriched_at ? "done" : "pending" },
    { label: "Site Built", date: lead.site_built_at, status: lead.site_built_at ? "done" : "pending" },
    { label: "Site Approved", date: lead.site_approved_at, status: lead.site_approved_at ? "done" : "pending" },
    { label: "Sent", date: lead.sent_at, status: lead.sent_at ? "done" : "pending" },
    { label: "Replied", date: lead.replied_at, status: lead.replied_at ? "done" : "pending" },
  ];
  const lastDoneIdx = timeline.map(t => t.status).lastIndexOf("done");
  if (lastDoneIdx >= 0 && lastDoneIdx < timeline.length - 1) {
    timeline[lastDoneIdx].status = "active";
  }

  return (
    <>
      <tr className={`cursor-pointer transition-colors ${isSelected ? "bg-[#EFF6FF]" : isExpanded ? "bg-[#F0F7FF]" : "hover:bg-[#F8FAFC]"}`} onClick={onToggle}>
        <td className={`${td} w-8`} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-[#D1D1D6] text-[#007AFF] cursor-pointer"
          />
        </td>
        <td className={`${td} font-semibold text-[#1D1D1F]`}>
          <div className="flex items-center gap-2">
            {lead.business_name || "—"}
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${icpStyle.bg} ${icpStyle.text} border ${icpStyle.border}`}>
              {icpStyle.label}
            </span>
          </div>
        </td>
        <td className={td}>{lead.city ? `${lead.city}, ${lead.state || ""}` : "—"}</td>
        <td className={td}>
          {lead.their_website_url ? (
            <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">
              {lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          ) : <span className="text-[#D1D1D6] text-[11px]">No website</span>}
        </td>
        <td className={td}>
          {lead.form_detected_at ? (
            lead.contact_form_url ? (
              lead.has_captcha ? (
                <span className="text-[10px] font-semibold text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-lg">CAPTCHA</span>
              ) : lead.form_submission_status === "success" ? (
                <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">Sent ✓</span>
              ) : lead.form_submission_status === "failed" ? (
                <span className="text-[10px] font-semibold text-[#C62828] bg-[#FFEBEE] px-2 py-0.5 rounded-lg" title={lead.form_submission_error || ""}>Failed</span>
              ) : (
                <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">Found</span>
              )
            ) : (
              <span className="text-[10px] text-[#C7C7CC]">No form</span>
            )
          ) : lead.their_website_url ? (
            <span className="text-[10px] text-[#D1D1D6]">—</span>
          ) : (
            <span className="text-[10px] text-[#D1D1D6]">—</span>
          )}
        </td>
        <td className={td}>
          {lead.preview_site_url ? (
            <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
          ) : <span className="text-[#D1D1D6]">—</span>}
        </td>
        <td className={td}>
          <div className="flex items-center gap-1">
            <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-lg ${STAGE_PILL[lead.stage] || "bg-gray-100 text-gray-500"}`}>
              {STAGE_LABELS[lead.stage as PipelineStage] || lead.stage}
            </span>
            {lead.outreach_method && (
              <span className="text-[8px] text-[#8E8E93] font-medium">via {lead.outreach_method}</span>
            )}
          </div>
        </td>
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

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-[#F8FAFF] border-b border-[#E5E5EA] p-5">
              <div className="grid grid-cols-3 gap-4">
                {/* Column 1: Contact Info + ICP */}
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
                    {lead.contact_form_url && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Form</span>
                        <a href={lead.contact_form_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] font-medium truncate max-w-[150px]">
                          {lead.contact_form_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
                        </a>
                      </div>
                    )}
                    {lead.form_field_mapping?.form_type && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Form Type</span>
                        <span className="font-semibold">{lead.form_field_mapping.form_type}</span>
                      </div>
                    )}
                    {lead.outreach_method && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Outreach</span>
                        <span className="font-semibold capitalize">{lead.outreach_method}</span>
                      </div>
                    )}
                    {lead.form_submission_error && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Error</span>
                        <span className="text-red-500 text-[10px] max-w-[180px] truncate" title={lead.form_submission_error}>{lead.form_submission_error}</span>
                      </div>
                    )}
                  </div>

                  {/* ICP Qualification */}
                  <div className="mt-3 pt-3 border-t border-[#E5E5EA]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93]">ICP Quality</div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${icpStyle.bg} ${icpStyle.text} border ${icpStyle.border}`}>
                        {icpStyle.label}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {icp.signals.map((signal: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span className={signal.includes("No ") || signal.includes("low") ? "text-[#C7C7CC]" : "text-[#34C759]"}>
                            {signal.includes("No ") || signal.includes("low") ? "○" : "✓"}
                          </span>
                          <span className={signal.includes("No ") || signal.includes("low") ? "text-[#AEAEB2]" : "text-[#3C3C43]"}>{signal}</span>
                        </div>
                      ))}
                    </div>
                    {icp.outreach_methods.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E5E5EA]">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-1.5">Outreach Channels</div>
                        <div className="flex flex-wrap gap-1">
                          {icp.outreach_methods.map((method: string) => {
                            const style = OUTREACH_METHOD_LABELS[method as keyof typeof OUTREACH_METHOD_LABELS];
                            return style ? (
                              <span key={method} className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${style.color}`}>
                                {style.label}
                              </span>
                            ) : null;
                          })}
                        </div>
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
