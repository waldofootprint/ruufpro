"use client";

import { Sparkles } from "lucide-react";
import { formatUSD, type RileyROIStats } from "@/lib/insights";
import { SectionShell } from "./SectionShell";

export function RileyROISection({ stats }: { stats: RileyROIStats }) {
  if (stats.state === "hidden") return null;

  const { summary, heroLabel, heroValue, heroSub } = buildROICopy(stats);

  return (
    <SectionShell icon={Sparkles} title="Riley ROI" caption="What your AI assistant brought in">
      <p className="text-[15px] leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{summary}</p>
      <div
        className="text-center px-5 py-7"
        style={{
          borderRadius: 16,
          background: "rgba(249, 115, 22, 0.04)",
          boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
        }}
      >
        <p className="neu-eyebrow" style={{ fontSize: 10.5 }}>{heroLabel}</p>
        <p
          className="font-bold tabular-nums my-2"
          style={{
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            backgroundImage: "linear-gradient(135deg, var(--neu-accent), var(--neu-accent-2))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {heroValue}
        </p>
        <p className="text-[12.5px]" style={{ color: "var(--neu-text-muted)" }}>{heroSub}</p>
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
