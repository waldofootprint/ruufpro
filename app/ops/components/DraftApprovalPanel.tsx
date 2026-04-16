"use client";

import { useState, useEffect } from "react";
import { daysSince } from "./shared";

export function DraftApprovalPanel({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const draftLeads = data.filter((l: any) => l.draft_status === "pending" && l.reply_text);
          setLeads(draftLeads);
          const initial: Record<string, string> = {};
          draftLeads.forEach((l: any) => { initial[l.id] = l.draft_response || ""; });
          setDrafts(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  async function handleSend(lead: any) {
    setSendingId(lead.id);
    try {
      const editedDraft = drafts[lead.id] || lead.draft_response;

      const res = await fetch("/api/ops/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: lead.id,
          action: "send",
          edited_text: editedDraft,
        }),
      });

      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== lead.id));
      } else {
        const err = await res.json();
        alert(`Send failed: ${err.error}`);
      }
    } catch { alert("Send failed"); }
    finally { setSendingId(null); }
  }

  async function handleSkip(leadId: string) {
    try {
      const res = await fetch("/api/ops/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: leadId,
          action: "skip",
        }),
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      }
    } catch { alert("Skip failed"); }
  }

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading replies...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No draft replies to review</div>;

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Review Draft Replies</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">{leads.length} reply draft{leads.length !== 1 ? "s" : ""} waiting</div>
        </div>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white border border-[#E5E5EA] rounded-[10px] p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] font-semibold">{lead.business_name || "Unknown"}</span>
              <span className="text-[11px] text-[#8E8E93]">{lead.city || ""}</span>
              {lead.reply_category && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${
                  lead.reply_category === "interested" ? "bg-[#C8E6C9] text-[#1B5E20]" :
                  lead.reply_category === "question" ? "bg-[#E3F2FD] text-[#1565C0]" :
                  lead.reply_category === "objection" ? "bg-[#FFEBEE] text-[#C62828]" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {lead.reply_category}
                </span>
              )}
              {lead.replied_at && (
                <span className="text-[10px] text-[#FF9F0A] font-medium">{daysSince(lead.replied_at)}d ago</span>
              )}
            </div>

            {/* Their reply */}
            <div className="bg-[#E8F5E9] rounded-xl rounded-bl-sm p-3 mb-3">
              <div className="text-[10px] font-semibold text-[#2E7D32] mb-1">Their Reply</div>
              <div className="text-[13px] text-[#1B5E20] leading-relaxed">{lead.reply_text}</div>
            </div>

            {/* Editable draft */}
            <div className="bg-[#F3E5F5] rounded-xl rounded-br-sm p-3 mb-3">
              <div className="text-[10px] font-semibold text-[#7B1FA2] mb-1">Your Draft Response</div>
              <textarea
                value={drafts[lead.id] || ""}
                onChange={(e) => setDrafts(prev => ({ ...prev, [lead.id]: e.target.value }))}
                rows={4}
                className="w-full text-[13px] text-[#4A148C] leading-relaxed bg-transparent border-none outline-none resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleSkip(lead.id)}
                className="text-[11px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] px-3 py-1.5 rounded-lg transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => handleSend(lead)}
                disabled={sendingId === lead.id}
                className="text-[11px] font-semibold text-white bg-[#7B1FA2] hover:bg-[#6A1B9A] disabled:bg-[#CE93D8] px-4 py-1.5 rounded-lg transition-colors"
              >
                {sendingId === lead.id ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="text-center mt-4">
          <button onClick={onDone} className="text-[11px] font-semibold text-[#007AFF] hover:underline">Done reviewing</button>
        </div>
      )}
    </div>
  );
}
