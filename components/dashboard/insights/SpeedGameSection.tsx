"use client";

import { Clock } from "lucide-react";
import { formatMinutes, type SpeedGameStats } from "@/lib/insights";
import { SectionShell } from "./SectionShell";

export function SpeedGameSection({ stats }: { stats: SpeedGameStats }) {
  if (stats.buckets.length === 0 || stats.avgReplyMinutes === null) return null;

  const bestBucket = [...stats.buckets]
    .filter((b) => b.closeRatePct !== null)
    .sort((a, b) => (b.closeRatePct || 0) - (a.closeRatePct || 0))[0];

  const parts: string[] = [];
  if (stats.fastestCloses) {
    parts.push(`Your ${stats.fastestCloses.count === 1 ? "fastest close" : `${stats.fastestCloses.count} fastest closes`} replied within ${formatMinutes(stats.fastestCloses.minutes)}.`);
  }
  parts.push(`Your average reply time is ${formatMinutes(stats.avgReplyMinutes)}.`);
  if (bestBucket && bestBucket.closeRatePct !== null) {
    parts.push(`Leads you reply to in ${bestBucket.range} close at ${bestBucket.closeRatePct}%.`);
  }

  return (
    <SectionShell icon={Clock} title="Speed Game" caption="Reply time vs close rate — your data">
      <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{parts.join(" ")}</p>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.buckets.map((b) => {
          const isBest = bestBucket && b.label === bestBucket.label;
          return (
            <div
              key={b.label}
              className="text-center px-3 py-3"
              style={{
                borderRadius: 12,
                boxShadow: "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)",
                color: isBest ? "var(--neu-accent)" : "var(--neu-text)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider neu-muted mb-1">{b.range}</p>
              <p className="text-xl font-extrabold tracking-tight">
                {b.closeRatePct !== null ? `${b.closeRatePct}%` : "—"}
              </p>
              <p className="text-[10px] neu-muted mt-0.5">
                {b.closeRatePct !== null ? `${b.closedCount}/${b.leadCount} closed` : `${b.leadCount} lead${b.leadCount === 1 ? "" : "s"}`}
              </p>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
