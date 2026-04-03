"use client";

import { useState } from "react";
import type { CommandMotivation, CommandWin } from "@/lib/command-center";
import { WIN_TYPE_CONFIG } from "@/lib/command-center";

interface Props {
  motivation: CommandMotivation[];
  wins: CommandWin[];
  onAddWin: (title: string, description: string, type: CommandWin["milestone_type"]) => void;
}

export default function MotivationPanel({ motivation, wins, onAddWin }: Props) {
  const [showAddWin, setShowAddWin] = useState(false);
  const [winTitle, setWinTitle] = useState("");
  const [winDesc, setWinDesc] = useState("");
  const [winType, setWinType] = useState<CommandWin["milestone_type"]>("win");

  const stories = motivation.filter((m) => m.type === "story");
  const principles = motivation.filter((m) => m.type === "principle");

  function handleSubmitWin() {
    if (!winTitle.trim()) return;
    onAddWin(winTitle, winDesc, winType);
    setWinTitle("");
    setWinDesc("");
    setShowAddWin(false);
  }

  return (
    <div className="space-y-6">
      {/* Wins & Milestones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Wins & Milestones</h3>
          <button
            onClick={() => setShowAddWin(!showAddWin)}
            className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Log a win
          </button>
        </div>

        {showAddWin && (
          <div className="bg-white/[0.03] border border-indigo-500/20 rounded-xl p-4 mb-3 space-y-3">
            <input
              type="text"
              placeholder="What happened?"
              value={winTitle}
              onChange={(e) => setWinTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
            <input
              type="text"
              placeholder="Details (optional)"
              value={winDesc}
              onChange={(e) => setWinDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
            <div className="flex gap-2">
              {(["win", "milestone", "learning"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setWinType(t)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                    winType === t
                      ? `${WIN_TYPE_CONFIG[t].color} border-white/10`
                      : "text-slate-500 border-white/5 hover:border-white/10"
                  }`}
                >
                  {WIN_TYPE_CONFIG[t].icon} {WIN_TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmitWin}
              className="px-4 py-2 bg-indigo-500 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Save
            </button>
          </div>
        )}

        {wins.length > 0 ? (
          <div className="space-y-2">
            {wins.map((win) => {
              const cfg = WIN_TYPE_CONFIG[win.milestone_type];
              return (
                <div key={win.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex gap-3">
                  <span className="text-lg">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-white font-medium">{win.title}</p>
                    {win.description && (
                      <p className="text-[12px] text-slate-500 mt-0.5">{win.description}</p>
                    )}
                    <p className="text-[11px] text-slate-600 mt-1">
                      {new Date(win.date_achieved).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">No wins logged yet. Your first one is coming.</p>
          </div>
        )}
      </div>

      {/* Vault Stories */}
      {stories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">They All Started From Zero</h3>
          <div className="space-y-2">
            {stories.map((s) => (
              <div key={s.id} className="bg-white/[0.03] border-l-2 border-l-indigo-500 rounded-r-xl p-4">
                <p className="text-[13px] text-indigo-300 font-semibold mb-1">{s.name}</p>
                <p className="text-[13px] text-slate-400 leading-relaxed">{s.story}</p>
                {s.vault_entry && (
                  <p className="text-[10px] text-slate-600 mt-2">Entry [{s.vault_entry}]</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guiding Principles */}
      {principles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Guiding Principles</h3>
          <div className="space-y-1">
            {principles.map((p) => (
              <div key={p.id} className="py-3 border-b border-white/[0.04] last:border-0">
                <p className="text-[14px] text-white font-medium leading-relaxed">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
