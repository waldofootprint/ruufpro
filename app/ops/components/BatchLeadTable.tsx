"use client";

import { useState, useEffect } from "react";
import type { PipelineStage } from "@/lib/ops-pipeline";
import { STAGE_LABELS } from "@/lib/ops-pipeline";
import { getProspectScore, SCORE_STYLES, STAGE_PILL, fmtTimestamp, daysSince } from "./shared";
import { scoreDemoProspect, PROSPECT_TIER_STYLES, type ProspectTier } from "@/lib/demo-prospect-scoring";

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
                        const prospectResult = getProspectScore(lead);
                        const tierStyle = SCORE_STYLES[prospectResult.tier];
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
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>{tierStyle.label}</span>
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
                                <a href={lead.preview_site_url.startsWith("http") ? lead.preview_site_url : `https://ruufpro.com${lead.preview_site_url}`} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
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
  const prospectScore = getProspectScore(lead);
  const prospectTierStyle = SCORE_STYLES[prospectScore.tier];

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
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${prospectTierStyle.bg} ${prospectTierStyle.text} border ${prospectTierStyle.border}`}>
              {prospectTierStyle.label}
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
            <a href={lead.preview_site_url.startsWith("http") ? lead.preview_site_url : `https://ruufpro.com${lead.preview_site_url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
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
      {isExpanded && (() => {
        const demoScore = getProspectScore(lead);
        const demoStyle = SCORE_STYLES[demoScore.tier];
        const previewFullUrl = lead.preview_site_url
          ? (lead.preview_site_url.startsWith("http") ? lead.preview_site_url : `https://ruufpro.com${lead.preview_site_url}`)
          : null;
        const photos = lead.photos || [];
        const reviews = lead.google_reviews || [];
        const services = lead.ai_services || lead.extracted_services || [];

        return (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-[#F8FAFF] border-b border-[#E5E5EA] p-5">

              {/* Preview Site Banner */}
              {previewFullUrl && (
                <div className="mb-4 p-3 bg-[#EFF6FF] border border-[#007AFF33] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#007AFF]">Preview Site Built</div>
                    <div className="text-[10px] text-[#3B82F6] mt-0.5 font-mono">{previewFullUrl}</div>
                  </div>
                  <a
                    href={previewFullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] font-semibold bg-[#007AFF] text-white hover:bg-[#0056D2] px-4 py-2 rounded-lg transition-colors"
                  >
                    View Preview Site ↗
                  </a>
                </div>
              )}

              {/* Scoring Chips Row */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${demoStyle.bg} ${demoStyle.text} border ${demoStyle.border}`}>
                  {demoStyle.label} ({demoScore.score}pts)
                </span>
                {lead.fl_license_type && (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                    FL Licensed: {lead.fl_license_type}
                  </span>
                )}
                {demoScore.reviewAutomationSuspected && (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                    Review Automation Suspected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                {/* Column 1: Contact Info */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Contact Info</div>
                  <div className="space-y-1">
                    {[
                      ["Owner", lead.owner_name || "—"],
                      ["Email", lead.owner_email || "—"],
                      ["Phone", lead.phone || "—"],
                      ["Address", lead.address || "—"],
                      ["Rating", lead.rating ? `${lead.rating}★ (${lead.reviews_count || 0} reviews)` : "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-xs gap-2">
                        <span className="text-[#8E8E93] flex-shrink-0">{label}</span>
                        <span className="font-semibold text-right truncate" title={String(value)}>{value}</span>
                      </div>
                    ))}
                    {lead.their_website_url && (
                      <div className="flex justify-between text-xs gap-2">
                        <span className="text-[#8E8E93] flex-shrink-0">Website</span>
                        <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] font-medium truncate">
                          {lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
                        </a>
                      </div>
                    )}
                    {lead.facebook_page_url && (
                      <div className="flex justify-between text-xs gap-2">
                        <span className="text-[#8E8E93] flex-shrink-0">Facebook</span>
                        <a href={lead.facebook_page_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] font-medium truncate">
                          FB Page ↗
                        </a>
                      </div>
                    )}
                    {lead.outreach_method && (
                      <div className="flex justify-between text-xs gap-2">
                        <span className="text-[#8E8E93] flex-shrink-0">Outreach</span>
                        <span className="font-semibold capitalize">{lead.outreach_method}</span>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  {services.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5E5EA]">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-1.5">Services</div>
                      <div className="flex flex-wrap gap-1">
                        {services.slice(0, 8).map((s: string, i: number) => (
                          <span key={i} className="text-[9px] font-medium px-2 py-0.5 rounded-lg bg-[#F0F7FF] text-[#1E40AF] border border-[#DBEAFE]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Enrichment Data */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Enrichment Data</div>

                  {/* Photos */}
                  {photos.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-[#8E8E93] mb-1">{photos.length} photo{photos.length !== 1 ? "s" : ""} found</div>
                      <div className="flex gap-1 flex-wrap">
                        {photos.slice(0, 6).map((photo: any, i: number) => (
                          <div key={i} className="w-[52px] h-[52px] rounded-lg overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
                            {photo.url ? (
                              <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-[#C7C7CC]">📷</div>
                            )}
                          </div>
                        ))}
                        {photos.length > 6 && (
                          <div className="w-[52px] h-[52px] rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#8E8E93] font-semibold">
                            +{photos.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Google Reviews */}
                  {reviews.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-[#8E8E93] mb-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""} captured</div>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {reviews.slice(0, 3).map((r: any, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-2 border border-[#F0F0F2]">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[10px] text-[#FF9F0A]">{"★".repeat(r.rating || 5)}</span>
                              {r.author_name && <span className="text-[9px] text-[#AEAEB2]">— {r.author_name}</span>}
                            </div>
                            <div className="text-[10px] text-[#3C3C43] leading-tight line-clamp-2">{r.text || "No text"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Facebook About */}
                  {lead.facebook_about && (
                    <div>
                      <div className="text-[10px] text-[#8E8E93] mb-1">Facebook About</div>
                      <div className="text-[10px] text-[#3C3C43] leading-tight bg-white rounded-lg p-2 border border-[#F0F0F2] line-clamp-3">
                        {lead.facebook_about}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: AI-Generated Copy */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">AI-Generated Copy</div>
                  {lead.ai_rewritten_at ? (
                    <div className="space-y-2.5">
                      {lead.ai_hero_headline && (
                        <div>
                          <div className="text-[9px] font-semibold text-[#8E8E93] uppercase mb-0.5">Hero Headline</div>
                          <div className="text-[12px] font-bold text-[#1D1D1F]">{lead.ai_hero_headline}</div>
                        </div>
                      )}
                      {lead.ai_about_text && (
                        <div>
                          <div className="text-[9px] font-semibold text-[#8E8E93] uppercase mb-0.5">About Text</div>
                          <div className="text-[10px] text-[#3C3C43] leading-tight line-clamp-4">{lead.ai_about_text}</div>
                        </div>
                      )}
                      {lead.ai_email_subject && (
                        <div className="pt-2 border-t border-[#E5E5EA]">
                          <div className="text-[9px] font-semibold text-[#8E8E93] uppercase mb-0.5">Email Subject</div>
                          <div className="text-[11px] font-semibold text-[#1D1D1F]">{lead.ai_email_subject}</div>
                        </div>
                      )}
                      {lead.ai_email_body && (
                        <div>
                          <div className="text-[9px] font-semibold text-[#8E8E93] uppercase mb-0.5">Email Body</div>
                          <div className="text-[10px] text-[#3C3C43] leading-tight bg-white rounded-lg p-2 border border-[#F0F0F2] whitespace-pre-line line-clamp-6">
                            {lead.ai_email_body}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#C7C7CC]">Not yet rewritten by AI</div>
                  )}
                </div>

                {/* Column 4: Pipeline + Conversation */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Pipeline Timeline</div>
                  <div className="space-y-0 mb-3">
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

                  {/* Prospect Score Breakdown */}
                  <div className="pt-3 border-t border-[#E5E5EA]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-1.5">Demo Score</div>
                    <div className="space-y-0.5">
                      {demoScore.autoSkipReason ? (
                        <div className="text-[10px] text-[#991B1B] font-medium">{demoScore.reasons[0]}</div>
                      ) : (
                        demoScore.reasons.slice(0, 8).map((reason: string, i: number) => (
                          <div key={i} className={`text-[10px] ${reason.startsWith("-") ? "text-[#DC2626]" : "text-[#3C3C43]"}`}>
                            {reason}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Conversation */}
                  {lead.reply_text && (
                    <div className="pt-3 border-t border-[#E5E5EA] mt-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-1.5">Reply</div>
                      <div className="bg-[#E8F5E9] rounded-lg p-2">
                        <div className="text-[10px] text-[#1B5E20] leading-tight line-clamp-3">{lead.reply_text}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
        );
      })()}
    </>
  );
}
