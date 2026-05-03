"use client";

import { ShieldAlert } from "lucide-react";
import { SectionShell, InsetStat } from "./SectionShell";

export interface ModeBStats {
  fires_7d: number;
  total_attempts_7d: number;
  rate_pct: number;
}

export function ModeBSection({ stats }: { stats: ModeBStats }) {
  if (stats.total_attempts_7d === 0) return null;

  const warn = stats.rate_pct > 15;

  return (
    <SectionShell
      icon={ShieldAlert}
      iconColor={warn ? "#d97706" : undefined}
      caption="CALCULATOR HEALTH"
      title="Estimates refused (last 7 days)"
    >
      <div className="grid grid-cols-3 gap-3">
        <InsetStat
          label="REFUSAL RATE"
          value={`${stats.rate_pct}%`}
          sub={warn ? "above 15% — investigate" : "homeowners who got no number"}
        />
        <InsetStat
          label="REFUSED"
          value={String(stats.fires_7d)}
          sub="Mode B fires"
        />
        <InsetStat
          label="TOTAL ATTEMPTS"
          value={String(stats.total_attempts_7d)}
          sub="last 7 days"
        />
      </div>
      {stats.rate_pct === 0 && (
        <p className="text-[12px] mt-4" style={{ color: "var(--neu-text-muted)" }}>
          All estimates returning a number — nice.
        </p>
      )}
    </SectionShell>
  );
}
