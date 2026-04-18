"use client";

import { Sparkles } from "lucide-react";
import { formatUSD, type RileyROIStats } from "@/lib/insights";
import { SectionShell } from "./SectionShell";

export function RileyROISection({ stats }: { stats: RileyROIStats }) {
  if (stats.state === "hidden") return null;

  const { summary, heroLabel, heroValue, heroSub } = buildROICopy(stats);

  return (
    <SectionShell icon={Sparkles} title="Riley ROI" caption="What your AI assistant brought in">
      <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{summary}</p>
      <div
        className="text-center px-5 py-6"
        style={{
          borderRadius: 14,
          boxShadow: "inset 3px 3px 6px var(--neu-shadow-dark), inset -3px -3px 6px var(--neu-shadow-light)",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider neu-muted">{heroLabel}</p>
        <p className="text-4xl font-extrabold tracking-tight my-1.5" style={{ color: "var(--neu-accent)" }}>{heroValue}</p>
        <p className="text-xs neu-muted">{heroSub}</p>
      </div>
    </SectionShell>
  );
}

function buildROICopy(s: RileyROIStats): { summary: string; heroLabel: string; heroValue: string; heroSub: string } {
  switch (s.state) {
    case "building":
      return {
        summary: `Riley captured ${s.leadsCaptured} ${s.leadsCaptured === 1 ? "lead" : "leads"} so far — building your pipeline.`,
        heroLabel: "Riley leads captured",
        heroValue: String(s.leadsCaptured),
        heroSub: `${s.convoCount} conversations · $149/mo`,
      };
    case "pipeline":
      return {
        summary: `Riley has captured ${s.leadsCaptured} leads. ${formatUSD(s.pipelineValue)} in estimates pending close.`,
        heroLabel: "Riley pipeline",
        heroValue: formatUSD(s.pipelineValue),
        heroSub: `${s.leadsCaptured} leads · ${s.convoCount} conversations`,
      };
    case "first_close":
      return {
        summary: `Your first Riley-sourced close: ${formatUSD(s.wonRevenue)}. Riley just paid for itself ${s.roiMultiplier}×.`,
        heroLabel: "Riley ROI (first close)",
        heroValue: `${s.roiMultiplier}×`,
        heroSub: `${formatUSD(s.wonRevenue)} closed · $149/mo`,
      };
    case "ongoing":
      return {
        summary: `Riley has closed ${s.wonCount} ${s.wonCount === 1 ? "deal" : "deals"} worth ${formatUSD(s.wonRevenue)} — ${s.roiMultiplier}× your subscription.`,
        heroLabel: "Riley ROI",
        heroValue: `${s.roiMultiplier}×`,
        heroSub: `${formatUSD(s.wonRevenue)} closed · ${formatUSD(s.pipelineValue)} pipeline`,
      };
    default:
      return { summary: "", heroLabel: "", heroValue: "", heroSub: "" };
  }
}
