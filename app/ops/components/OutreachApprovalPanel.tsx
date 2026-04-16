"use client";

import { useState, useEffect } from "react";
const OUTREACH_METHOD_LABELS: Record<string, { label: string; color: string }> = {
  cold_email: { label: "Email", color: "bg-blue-100 text-blue-700" },
  form: { label: "Form", color: "bg-green-100 text-green-700" },
  linkedin_draft: { label: "LinkedIn", color: "bg-purple-100 text-purple-700" },
  direct_mail: { label: "Mail", color: "bg-amber-100 text-amber-700" },
};
import { getCampaignType, generateEmailPreview, generateFormMessage } from "@/lib/outreach-templates";

type OutreachState = "approved" | "neutral" | "rejected";

export function OutreachApprovalPanel({ batchId, onApproveAndSend }: { batchId: string; onApproveAndSend: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, OutreachState>>({});
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const outreachLeads = data.filter((l: any) => l.stage === "site_approved" || l.stage === "outreach_approved");
          setLeads(outreachLeads);
          const initial: Record<string, OutreachState> = {};
          outreachLeads.forEach((l: any) => { initial[l.id] = "approved"; });
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
      const next: OutreachState = current === "approved" ? "neutral" : current === "neutral" ? "rejected" : "approved";
      return { ...prev, [id]: next };
    });
  }

  async function handleApproveAndSend() {
    setSending(true);
    try {
      const approvedIds = Object.entries(states).filter(([, s]) => s === "approved").map(([id]) => id);
      const rejectedIds = Object.entries(states).filter(([, s]) => s === "rejected").map(([id]) => id);

      const res = await fetch("/api/ops/pipeline/approve-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId, approved_ids: approvedIds, rejected_ids: rejectedIds }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Sent ${data.emailed} emails · ${data.forms_queued} forms queued · ${data.rejected} rejected`);
        onApproveAndSend();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch { alert("Network error"); }
    finally { setSending(false); }
  }

  const approvedCount = Object.values(states).filter(s => s === "approved").length;
  const rejectedCount = Object.values(states).filter(s => s === "rejected").length;

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading outreach preview...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No leads ready for outreach</div>;

  const stateStyles: Record<OutreachState, { card: string; check: string; label: string; icon: string }> = {
    approved: { card: "border-[#34C759] bg-[#F0FFF4]", check: "bg-[#34C759] border-[#34C759] text-white", label: "text-[#34C759]", icon: "✓" },
    neutral: { card: "border-[#E5E5EA] bg-white", check: "bg-white border-[#D1D1D6] text-transparent", label: "text-[#AEAEB2]", icon: "—" },
    rejected: { card: "border-[#EF4444] bg-[#FEF2F2] opacity-50", check: "bg-[#EF4444] border-[#EF4444] text-white", label: "text-[#EF4444]", icon: "✗" },
  };

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Review Outreach Before Sending</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">{approvedCount} approved · {rejectedCount} rejected · {leads.length - approvedCount - rejectedCount} skipped</div>
        </div>
        <button
          onClick={handleApproveAndSend}
          disabled={sending || approvedCount === 0}
          className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-4 py-1.5 rounded-lg transition-colors"
        >
          {sending ? "Sending..." : `Approve & Send ${approvedCount}`}
        </button>
      </div>

      <div className="text-[11px] text-[#8E8E93] mb-3 px-3 py-2 bg-[#F0F7FF] rounded-lg border border-[#007AFF22]">
        <strong className="text-[#007AFF]">How it works:</strong> All leads start approved (green ✓). Click to skip, click again to reject. Click &ldquo;Approve &amp; Send&rdquo; to queue emails + form submissions in one action.
      </div>

      <div className="space-y-2">
        {leads.map((lead) => {
          const state = states[lead.id] || "approved";
          const s = stateStyles[state];
          const method = lead.outreach_method || (lead.contact_form_url ? "form" : "cold_email");
          const methodStyle = OUTREACH_METHOD_LABELS[method as keyof typeof OUTREACH_METHOD_LABELS];
          const isEmailExpanded = expandedEmail === lead.id;

          const campaignType = getCampaignType(lead);
          const vars = {
            first_name: (lead.owner_name || "").split(" ")[0] || "there",
            business_name: lead.business_name || "your business",
            city: lead.city || "",
            preview_url: lead.demo_page_url ? `https://ruufpro.com${lead.demo_page_url}` : "[preview link]",
            claim_url: lead.demo_page_url ? `https://ruufpro.com${lead.demo_page_url.replace("/demo-preview/", "/claim/")}` : "[claim link]",
          };

          const email1 = method === "cold_email" ? generateEmailPreview(0, campaignType, vars) : null;
          const formMsg = method === "form" ? generateFormMessage(vars) : null;

          return (
            <div key={lead.id} className={`border rounded-[10px] p-3 transition-all ${s.card}`}>
              <div className="flex items-start gap-3">
                {/* Toggle */}
                <div className="flex flex-col items-center cursor-pointer flex-shrink-0 pt-0.5" onClick={() => cycleState(lead.id)}>
                  <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center text-xs font-bold ${s.check}`}>
                    {s.icon}
                  </div>
                  <div className={`text-[8px] font-bold uppercase tracking-[0.06em] mt-0.5 ${s.label}`}>
                    {state === "approved" ? "Send" : state === "neutral" ? "Skip" : "Cut"}
                  </div>
                </div>

                {/* Lead info + preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold truncate">{lead.business_name || "Unknown"}</span>
                    <span className="text-[11px] text-[#8E8E93]">{lead.city || ""}</span>
                    {methodStyle && (
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${methodStyle.color}`}>
                        {methodStyle.label}
                      </span>
                    )}
                  </div>

                  {/* Email preview */}
                  {email1 && (
                    <div className="bg-white/80 rounded-lg border border-[#E5E5EA]/50 p-2.5 mt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-[#8E8E93]">To: <strong className="text-[#1D1D1F]">{lead.owner_email || "needs enrichment"}</strong></div>
                          <div className="text-[12px] font-semibold mt-0.5">{email1.subject}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedEmail(isEmailExpanded ? null : lead.id); }}
                          className="text-[10px] text-[#007AFF] font-medium"
                        >
                          {isEmailExpanded ? "Collapse" : "Preview →"}
                        </button>
                      </div>
                      {isEmailExpanded && (
                        <div className="text-[12px] text-[#3C3C43] leading-relaxed whitespace-pre-line mt-2 pt-2 border-t border-[#F2F2F7]">
                          {email1.body}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form message preview */}
                  {formMsg && (
                    <div className="bg-white/80 rounded-lg border border-[#E5E5EA]/50 p-2.5 mt-1">
                      <div className="text-[10px] text-[#8E8E93] mb-1">Form submission to: <strong className="text-[#1D1D1F]">{lead.contact_form_url?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || "form"}</strong></div>
                      <div className="text-[12px] text-[#3C3C43] leading-relaxed whitespace-pre-line">{formMsg}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
