"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { SitePriority } from "@/lib/command-center";
import { TEMPLATE_OPTIONS, PRIORITY_CONFIG } from "@/lib/command-center";

interface Props {
  onSubmit: (data: { site_name: string; city: string; template: string; edit_request: string; priority: SitePriority }) => void;
  onClose: () => void;
}

export default function SiteCardForm({ onSubmit, onClose }: Props) {
  const [siteName, setSiteName] = useState("");
  const [city, setCity] = useState("");
  const [template, setTemplate] = useState("modern_clean");
  const [editRequest, setEditRequest] = useState("");
  const [priority, setPriority] = useState<SitePriority>("normal");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteName.trim()) return;
    onSubmit({ site_name: siteName, city, template, edit_request: editRequest, priority });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[15px] font-semibold text-white">Add Site Request</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Company / Site Name *</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="e.g. Pinnacle Roofing Co"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            autoFocus
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">City / State</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Tampa, FL"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/40"
          >
            {TEMPLATE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">What to Build or Change</label>
          <textarea
            value={editRequest}
            onChange={(e) => setEditRequest(e.target.value)}
            placeholder="Describe what you need..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Priority</label>
          <div className="flex gap-2">
            {(["urgent", "normal", "low"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                  priority === p
                    ? `${PRIORITY_CONFIG[p].color} border-white/10`
                    : "text-slate-500 border-white/5 hover:border-white/10"
                }`}
              >
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-500 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-400 transition-colors mt-2"
        >
          Add to Edit Requested
        </button>
      </form>
    </div>
  );
}
