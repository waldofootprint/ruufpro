"use client";

import { useState, useEffect } from "react";
import { scoreDemoProspect, PROSPECT_TIER_STYLES } from "@/lib/demo-prospect-scoring";

type SiteState = "approved" | "neutral" | "rejected";

export function SiteReviewPanel({ batchId, onApprove }: { batchId: string; onApprove: () => void }) {
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2.5">
        {leads.map((lead) => {
          const state = states[lead.id] || "approved";
          const s = stateStyles[state];
          const demoResult = scoreDemoProspect({
            google_place_id: lead.google_place_id,
            rating: lead.rating,
            reviews_count: lead.reviews_count,
            their_website_url: lead.their_website_url,
            phone: lead.phone,
            facebook_page_url: lead.facebook_page_url,
            business_name: lead.business_name,
            google_reviews: lead.google_reviews,
            website_faq: lead.website_faq,
            website_services: lead.website_services,
            website_about: lead.website_about,
            owner_name: lead.owner_name,
            website_service_areas: lead.website_service_areas,
            website_testimonials: lead.website_testimonials,
            competitor_tools: lead.competitor_tools,
          });
          const demoStyle = PROSPECT_TIER_STYLES[demoResult.tier];
          const photoCount = lead.photos?.length || 0;
          const reviewCount = lead.google_reviews?.length || 0;
          const previewUrl = lead.preview_site_url
            ? (lead.preview_site_url.startsWith("http") ? lead.preview_site_url : `https://ruufpro.com${lead.preview_site_url}`)
            : null;
          return (
            <div
              key={lead.id}
              onClick={() => cycleState(lead.id)}
              className={`border rounded-[10px] p-3 cursor-pointer transition-all hover:shadow-sm ${s.card}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center text-xs font-bold ${s.check}`}>
                    {s.icon}
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-[0.06em] mt-0.5 ${s.label}`}>
                    {state === "approved" ? "Approved" : state === "neutral" ? "Skipped" : "Rejected"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold truncate">{lead.business_name || "Unknown"}</span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${demoStyle.bg} ${demoStyle.text} border ${demoStyle.border}`}>
                      {demoResult.tier} {demoResult.score}pts
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8E8E93] mt-0.5">
                    {lead.city ? `${lead.city}, ${lead.state || ""}` : ""}
                    {lead.rating > 0 ? ` · ${lead.rating}★` : ""}
                    {lead.reviews_count > 0 ? ` (${lead.reviews_count})` : ""}
                    {lead.their_website_url ? ` · Has site` : " · No website"}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {photoCount > 0 && <span className="text-[9px] text-[#34C759]">📷 {photoCount}</span>}
                    {reviewCount > 0 && <span className="text-[9px] text-[#34C759]">⭐ {reviewCount}</span>}
                    {lead.fl_license_type && <span className="text-[9px] text-[#2E7D32]">🪪 Licensed</span>}
                    {lead.owner_email && <span className="text-[9px] text-[#007AFF]">✉ Email</span>}
                  </div>
                </div>
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
  );
}
