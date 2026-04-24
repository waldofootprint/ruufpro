"use client";

import { AlertTriangle } from "lucide-react";
import { formatUSD, type MoneyLeftStats } from "@/lib/insights";
import { SectionShell } from "./SectionShell";

export function MoneyLeftSection({ stats }: { stats: MoneyLeftStats }) {
  if (stats.leads.length === 0) return null;

  const hotCount = stats.leads.filter((l) => l.heatScore >= 60).length;
  const staleCount = stats.leads.length - hotCount;

  const summary = hotCount > 0
    ? `You have ${hotCount} high-intent ${hotCount === 1 ? "lead" : "leads"} waiting${staleCount > 0 ? ` plus ${staleCount} stale` : ""}. Roughly ${formatUSD(stats.totalEstimatedValue)} of potential work is sitting uncontacted.`
    : `${staleCount} ${staleCount === 1 ? "lead has" : "leads have"} been sitting 48h+ without a reply — ~${formatUSD(stats.totalEstimatedValue)} in potential value.`;

  return (
    <SectionShell
      icon={AlertTriangle}
      iconColor="var(--neu-accent)"
      title="Money Left on the Table"
      caption="Hot leads you haven't called yet"
    >
      <p className="text-[15px] leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{summary}</p>
      <div className="flex flex-col gap-2">
        {stats.leads.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3"
            style={{
              padding: "12px 16px",
              borderLeft: "2px solid var(--neu-accent)",
              background: "rgba(249, 115, 22, 0.04)",
              borderRadius: "0 12px 12px 0",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate" style={{ color: "var(--neu-text)", letterSpacing: "-0.01em" }}>
                {l.name}
                {l.estimateLow && l.estimateHigh && (
                  <span className="font-normal" style={{ color: "var(--neu-text-muted)" }}> · {formatUSD(l.estimateLow)}–{formatUSD(l.estimateHigh)}{l.estimateMaterial ? ` ${l.estimateMaterial.toLowerCase()}` : ""}</span>
                )}
              </p>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--neu-text-muted)" }}>{l.reason}</p>
            </div>
            <a href="/dashboard" className="neu-dark-cta shrink-0" style={{ padding: "7px 14px", fontSize: 11.5 }}>
              Open →
            </a>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
