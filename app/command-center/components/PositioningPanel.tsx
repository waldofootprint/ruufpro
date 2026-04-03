"use client";

import type { CommandPositioning } from "@/lib/command-center";

export default function PositioningPanel({ pos }: { pos: CommandPositioning | null }) {
  if (!pos) return null;

  const hormozi = pos.hormozi_json;
  const tiers = pos.pricing_tiers || [];

  return (
    <div className="space-y-4">
      {/* Current vs Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Current Positioning</h4>
          <p className="text-[15px] text-slate-300 font-medium leading-relaxed">{pos.current_pos || "Not set"}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 border border-emerald-500/20 rounded-xl p-5">
          <h4 className="text-[11px] text-emerald-400 uppercase tracking-wider mb-2">Target Positioning</h4>
          <p className="text-[15px] text-white font-semibold leading-relaxed">{pos.target_pos || "Not set"}</p>
        </div>
      </div>

      {/* Hormozi Value Equation */}
      {hormozi && hormozi.dream_outcome && (
        <div className="bg-gradient-to-br from-indigo-500/8 to-violet-500/5 border border-indigo-500/15 rounded-xl p-5">
          <h4 className="text-[11px] text-indigo-300 uppercase tracking-wider mb-4">Hormozi Value Equation [025]</h4>
          <div className="space-y-2.5">
            {[
              { label: "Dream Outcome", value: hormozi.dream_outcome },
              { label: "Likelihood", value: hormozi.likelihood },
              { label: "Time Delay", value: hormozi.time_delay },
              { label: "Effort", value: hormozi.effort },
            ].map((row) => (
              <div key={row.label} className="flex gap-3">
                <span className="text-[13px] text-emerald-400 font-medium w-32 shrink-0">{row.label}:</span>
                <span className="text-[13px] text-slate-300">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotel Ballroom Test */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-4">Hotel Ballroom Test [035]</h4>
        <div className="space-y-2">
          <p className="text-[13px] text-slate-600">&ldquo;Who wants a website?&rdquo; → some hands</p>
          <p className="text-[13px] text-slate-400">&ldquo;Who wants lead capture?&rdquo; → more hands</p>
          <p className="text-[14px] text-white font-medium">&ldquo;Who wants their phone ringing with qualified homeowners while they&apos;re on the roof, without lifting a finger?&rdquo; → every roofer</p>
        </div>
      </div>

      {/* Pricing Math */}
      {tiers.length > 0 && (
        <div>
          <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">$50K MRR Math</h4>
          <div className="grid grid-cols-3 gap-3">
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`bg-white/[0.03] border rounded-xl p-5 text-center ${
                  i === 1 ? "border-indigo-500/30" : "border-white/[0.06]"
                }`}
              >
                <p className="text-2xl font-bold text-white">${tier.price}<span className="text-sm text-slate-500">/mo</span></p>
                <p className="text-[13px] text-slate-400 mt-1">{tier.roofers_needed} roofers</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-2">{tier.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pos.notes && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Notes</h4>
          <p className="text-[13px] text-slate-400 leading-relaxed whitespace-pre-wrap">{pos.notes}</p>
        </div>
      )}
    </div>
  );
}
