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
      <p className="text-[15px] leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{parts.join(" ")}</p>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.buckets.map((b) => {
          const isBest = bestBucket && b.label === bestBucket.label;
          return (
            <div
              key={b.label}
              className="text-center px-3 py-4"
              style={{
                borderRadius: 14,
                background: isBest ? "rgba(249, 115, 22, 0.06)" : "var(--neu-bg)",
                boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                color: isBest ? "var(--neu-accent)" : "var(--neu-text)",
              }}
            >
              <p className="neu-eyebrow mb-1.5" style={{ fontSize: 10 }}>{b.range}</p>
              <p className="font-bold tabular-nums" style={{ fontSize: 24, lineHeight: 1, letterSpacing: "-0.035em" }}>
                {b.closeRatePct !== null ? `${b.closeRatePct}%` : "—"}
              </p>
              <p className="text-[10.5px] mt-1.5" style={{ color: "var(--neu-text-muted)" }}>
                {b.closeRatePct !== null ? `${b.closedCount}/${b.leadCount} closed` : `${b.leadCount} lead${b.leadCount === 1 ? "" : "s"}`}
              </p>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
