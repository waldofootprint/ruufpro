"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "yearsInBusiness">;

export default function ChalkStats({ yearsInBusiness }: Props) {
  const stats = [
    { num: "500+", label: "Roofs Completed" },
    { num: "4.9", label: "Google Rating" },
    ...(yearsInBusiness ? [{ num: `${yearsInBusiness}+`, label: "Years in Business" }] : []),
    { num: "100%", label: "Satisfaction" },
  ];

  return (
    <section
      style={{
        padding: "48px 32px",
        background: CHALK.bgAlt,
        fontFamily: CHALK.fontBody,
      }}
    >
      <div style={{ maxWidth: CHALK.maxWidth, margin: "0 auto", display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: CHALK.fontDisplay, fontSize: 52, color: CHALK.accent, lineHeight: 1 }}>
              {s.num}
            </div>
            {/* Chalk underline */}
            <svg width="60" height="4" viewBox="0 0 60 4" style={{ margin: "8px auto 6px", display: "block" }}>
              <path d="M2 2 Q15 0.5 30 2.5 T58 2" fill="none" stroke={CHALK.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </svg>
            <div style={{ fontSize: 15, color: CHALK.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
