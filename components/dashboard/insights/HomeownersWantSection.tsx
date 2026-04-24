"use client";

import { MessageSquare } from "lucide-react";
import type { HomeownersWantStats } from "@/lib/insights";
import { SectionShell } from "./SectionShell";

export function HomeownersWantSection({ stats }: { stats: HomeownersWantStats }) {
  if (stats.totalConvos < 3 || stats.questions.length === 0) return null;

  const top = stats.questions[0];
  const parts: string[] = [`${top.pct}% of Riley conversations asked about ${top.label.toLowerCase()}.`];
  if (stats.topMaterial) {
    parts.push(`${stats.topMaterial.pct}% of estimates were for ${stats.topMaterial.name.toLowerCase()}.`);
  }
  if (stats.financingInterestPct !== null && stats.financingInterestPct >= 40) {
    parts.push(`${stats.financingInterestPct}% of leads asked about financing — make sure you're offering it.`);
  }

  return (
    <SectionShell icon={MessageSquare} title="What Your Homeowners Want" caption={`From ${stats.totalConvos} Riley conversations`}>
      <p className="text-[15px] leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{parts.join(" ")}</p>
      <div className="flex flex-col gap-3">
        {stats.questions.map((q) => (
          <div key={q.type} className="grid grid-cols-[120px_1fr_44px] items-center gap-3 text-[12.5px]">
            <span className="truncate font-medium" style={{ color: "var(--neu-text)" }}>{q.label}</span>
            <div
              className="h-2 relative overflow-hidden"
              style={{
                borderRadius: 999,
                boxShadow: "inset 2px 2px 4px var(--neu-inset-dark), inset -1px -1px 2px var(--neu-inset-light)",
              }}
            >
              <div
                className="h-full"
                style={{
                  width: `${q.pct}%`,
                  background: "linear-gradient(90deg, var(--neu-accent), var(--neu-accent-2))",
                  borderRadius: 999,
                  boxShadow: "0 2px 6px -1px rgba(249,115,22,0.5)",
                }}
              />
            </div>
            <span className="text-right font-bold tabular-nums" style={{ color: "var(--neu-text)", letterSpacing: "-0.01em" }}>{q.pct}%</span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
