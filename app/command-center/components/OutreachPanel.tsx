"use client";

import { useState } from "react";
import type { CommandOutreach, OutreachChannel, OutreachStatus } from "@/lib/command-center";
import { OUTREACH_STATUS_CONFIG } from "@/lib/command-center";

interface Props {
  outreach: CommandOutreach[];
  onAdd: (item: Partial<CommandOutreach>) => void;
  onStatusChange: (id: string, status: OutreachStatus) => void;
}

const CHANNEL_LABELS: Record<OutreachChannel, string> = {
  demo_site: "Demo Site",
  facebook: "Facebook",
  cold_email: "Cold Email",
  other: "Other",
};

export default function OutreachPanel({ outreach, onAdd, onStatusChange }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [channel, setChannel] = useState<OutreachChannel>("demo_site");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!company.trim()) return;
    onAdd({ channel, company_name: company, city: city || null, notes: notes || null, status: "sent" });
    setCompany("");
    setCity("");
    setNotes("");
    setShowAdd(false);
  }

  // Pipeline stats
  const byChannel = (ch: OutreachChannel) => outreach.filter((o) => o.channel === ch);
  const channels: OutreachChannel[] = ["demo_site", "facebook", "cold_email"];

  return (
    <div className="space-y-4">
      {/* Channel summary */}
      <div className="grid grid-cols-3 gap-3">
        {channels.map((ch) => {
          const items = byChannel(ch);
          const responded = items.filter((i) => ["replied", "call_booked", "signed_up"].includes(i.status)).length;
          return (
            <div key={ch} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{CHANNEL_LABELS[ch]}</p>
              <p className="text-xl font-bold text-white">{items.length}</p>
              <p className="text-[12px] text-slate-500">{responded} responded</p>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add outreach
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/[0.03] border border-indigo-500/20 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            {channels.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                  channel === ch ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" : "text-slate-500 border-white/5"
                }`}
              >
                {CHANNEL_LABELS[ch]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-500 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-400 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Outreach table */}
      {outreach.length > 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">Company</th>
                  <th className="px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">Channel</th>
                  <th className="px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">City</th>
                  <th className="px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="px-4 py-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {outreach.map((item) => {
                  const sCfg = OUTREACH_STATUS_CONFIG[item.status];
                  return (
                    <tr key={item.id} className="border-b border-white/[0.03] last:border-0">
                      <td className="px-4 py-3 text-[13px] text-white">{item.company_name || "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400">{CHANNEL_LABELS[item.channel]}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400">{item.city || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) => onStatusChange(item.id, e.target.value as OutreachStatus)}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${sCfg.color} border-0 cursor-pointer`}
                          style={{ appearance: "auto" }}
                        >
                          {Object.entries(OUTREACH_STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-500">
                        {new Date(item.date_sent).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
          <p className="text-slate-500 text-sm">No outreach yet. Start with Play 1: Demo-as-Lead-Magnet.</p>
        </div>
      )}
    </div>
  );
}
