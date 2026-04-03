"use client";

import type { CommandAdvisor } from "@/lib/command-center";

interface Props {
  note: CommandAdvisor | null;
  briefs: CommandAdvisor[];
}

export default function AdvisorPanel({ note, briefs }: Props) {
  return (
    <div className="space-y-4">
      {/* Persistent advisor note */}
      {note && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">Advisor&apos;s Note</h3>
          </div>
          <p className="text-[14px] text-slate-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          <p className="text-[11px] text-slate-600 mt-3">
            Updated {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      )}

      {/* Daily briefs (most recent first) */}
      {briefs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Briefs</h3>
          {briefs.slice(0, 5).map((brief) => (
            <div
              key={brief.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
            >
              <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">{brief.content}</p>
              <p className="text-[11px] text-slate-600 mt-2">
                {new Date(brief.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {!note && briefs.length === 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
          <p className="text-slate-500 text-sm">No advisor notes yet. They&apos;ll appear here after our conversations.</p>
        </div>
      )}
    </div>
  );
}
