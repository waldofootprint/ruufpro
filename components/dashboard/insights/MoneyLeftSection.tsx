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
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--neu-text)" }}>{summary}</p>
      <div className="space-y-2">
        {stats.leads.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 px-3.5 py-3"
            style={{
              borderRadius: 12,
              boxShadow: "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--neu-text)" }}>
                {l.name}
                {l.estimateLow && l.estimateHigh && (
                  <span className="font-medium neu-muted"> · {formatUSD(l.estimateLow)}–{formatUSD(l.estimateHigh)}{l.estimateMaterial ? ` ${l.estimateMaterial.toLowerCase()}` : ""}</span>
                )}
              </p>
              <p className="text-[11px] neu-muted mt-0.5">{l.reason}</p>
            </div>
            <a
              href="/dashboard"
              className="shrink-0 text-[11px] font-bold px-3 py-1.5"
              style={{
                borderRadius: 10,
                background: "var(--neu-accent)",
                color: "var(--neu-accent-fg)",
                boxShadow: "3px 3px 8px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)",
              }}
            >
              Open
            </a>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
