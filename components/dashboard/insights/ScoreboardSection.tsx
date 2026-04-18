"use client";

import { TrendingUp } from "lucide-react";
import { formatUSD, type ScoreboardStats } from "@/lib/insights";
import { SectionShell, InsetStat } from "./SectionShell";

export function ScoreboardSection({ stats }: { stats: ScoreboardStats }) {
  const { closedThisWeekCount, closedThisWeekRevenue, pipelineCount, pipelineValue, closeRatePct, forecastRevenue } = stats;
  if (closedThisWeekCount === 0 && pipelineCount === 0) return null;

  return (
    <SectionShell icon={TrendingUp} title="The Scoreboard" caption="This week · your numbers">
      <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>
        {buildSummary(stats)}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <InsetStat label="Closed" value={closedThisWeekCount > 0 ? formatUSD(closedThisWeekRevenue) : "—"} sub={closedThisWeekCount > 0 ? `${closedThisWeekCount} ${closedThisWeekCount === 1 ? "job" : "jobs"}` : "No closes yet"} />
        <InsetStat label="Pipeline" value={pipelineCount > 0 ? formatUSD(pipelineValue) : "—"} sub={pipelineCount > 0 ? `${pipelineCount} ${pipelineCount === 1 ? "lead" : "leads"}` : "Nothing quoted"} />
        <InsetStat label="Close rate" value={closeRatePct !== null ? `${closeRatePct}%` : "—"} sub={closeRatePct !== null ? "All-time" : "Need 5+ decided"} />
        <InsetStat label="Forecast" value={forecastRevenue !== null ? formatUSD(forecastRevenue) : "—"} sub={forecastRevenue !== null ? "Next month" : "Close rate needed"} />
      </div>
    </SectionShell>
  );
}

function buildSummary(s: ScoreboardStats): string {
  const parts: string[] = [];
  if (s.closedThisWeekCount > 0) {
    parts.push(`You closed ${s.closedThisWeekCount} ${s.closedThisWeekCount === 1 ? "job" : "jobs"} worth ${formatUSD(s.closedThisWeekRevenue)} this week.`);
  } else {
    parts.push("No closes yet this week.");
  }
  if (s.pipelineCount > 0) {
    parts.push(`Pipeline has ${formatUSD(s.pipelineValue)} across ${s.pipelineCount} quoted ${s.pipelineCount === 1 ? "lead" : "leads"}.`);
  }
  if (s.closeRatePct !== null && s.forecastRevenue !== null && s.pipelineCount > 0) {
    parts.push(`At your ${s.closeRatePct}% close rate, that's roughly ${formatUSD(s.forecastRevenue)} next month.`);
  }
  return parts.join(" ");
}
