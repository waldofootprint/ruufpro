"use client";

import { Dna } from "lucide-react";
import { formatUSD, type CustomerDNAStats } from "@/lib/insights";
import { SectionShell } from "./SectionShell";

export function CustomerDNASection({ stats }: { stats: CustomerDNAStats }) {
  // Hide entirely if no wins at all — prevents empty state clutter
  if (stats.wonCount === 0) return null;

  if (!stats.unlocked) {
    const needed = 10 - stats.wonCount;
    return (
      <SectionShell icon={Dna} title="Customer DNA" caption="Patterns across your won leads">
        <div
          className="text-[12px] px-4 py-4"
          style={{
            borderRadius: 12,
            color: "var(--neu-text-muted)",
            boxShadow: "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)",
          }}
        >
          🔒 Unlocks at 10 won leads. You're at <b style={{ color: "var(--neu-text)" }}>{stats.wonCount}</b> — {needed} more to go.
        </div>
      </SectionShell>
    );
  }

  const chips: { label: string; value: string }[] = [];
  if (stats.avgRoofAge !== null) chips.push({ label: "Avg roof age", value: `${stats.avgRoofAge} yrs` });
  if (stats.topMaterial) chips.push({ label: "Top material", value: `${stats.topMaterial.name} (${stats.topMaterial.pct}%)` });
  if (stats.avgHomeValue !== null) chips.push({ label: "Avg home value", value: formatUSD(stats.avgHomeValue) });
  if (stats.avgWidgetViews !== null) chips.push({ label: "Widget views", value: `${stats.avgWidgetViews}× avg` });
  if (stats.newHomeownerPct !== null) chips.push({ label: "New homeowners", value: `${stats.newHomeownerPct}%` });
  if (stats.financingPct !== null) chips.push({ label: "Financing", value: `${stats.financingPct}%` });

  const summaryBits: string[] = [];
  if (stats.avgRoofAge !== null) summaryBits.push(`${stats.avgRoofAge}-year roofs`);
  if (stats.topMaterial) summaryBits.push(`interested in ${stats.topMaterial.name.toLowerCase()}`);
  if (stats.avgHomeValue !== null) summaryBits.push(`home value around ${formatUSD(stats.avgHomeValue)}`);
  const summary = summaryBits.length > 0
    ? `Your ${stats.wonCount} won leads share a pattern: ${summaryBits.join(", ")}.`
    : `Patterns across your ${stats.wonCount} won leads.`;

  return (
    <SectionShell icon={Dna} title="Customer DNA" caption="Patterns across your won leads">
      <p className="text-[15px] leading-relaxed mb-5" style={{ color: "var(--neu-text)" }}>{summary}</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {chips.map((c) => (
          <div
            key={c.label}
            className="px-4 py-3.5"
            style={{
              borderRadius: 14,
              boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
            }}
          >
            <p className="neu-eyebrow mb-1.5" style={{ fontSize: 10 }}>{c.label}</p>
            <p className="text-[14px] font-semibold" style={{ color: "var(--neu-text)", letterSpacing: "-0.01em" }}>{c.value}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
