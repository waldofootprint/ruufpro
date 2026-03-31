"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "phone" | "city" | "hasEstimateWidget">;

export default function ChalkCta({ phone, city, hasEstimateWidget }: Props) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <section
      style={{
        padding: "64px 32px",
        background: CHALK.bgAlt,
        textAlign: "center",
        fontFamily: CHALK.fontBody,
        position: "relative",
      }}
    >
      {/* Dashed border top/bottom */}
      <div style={{ position: "absolute", top: 0, left: 32, right: 32, borderTop: `2px dashed ${CHALK.borderDashed}` }} />
      <div style={{ position: "absolute", bottom: 0, left: 32, right: 32, borderBottom: `2px dashed ${CHALK.borderDashed}` }} />

      <h2 style={{ fontFamily: CHALK.fontDisplay, fontSize: 36, color: "#fff", marginBottom: 12 }}>
        Ready to get your roof handled?
      </h2>
      <p style={{ fontSize: 18, color: CHALK.textMuted, marginBottom: 32, maxWidth: 460, margin: "0 auto 32px" }}>
        Free estimate, no obligation, no pressure. We'll come out, look at your roof, and give you an honest answer.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        <a
          href={hasEstimateWidget ? "#estimate" : "#contact"}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", background: CHALK.accent, color: CHALK.bg,
            borderRadius: 9999, fontFamily: CHALK.fontDisplay, fontSize: 18,
            textDecoration: "none", transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = CHALK.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = CHALK.accent)}
        >
          Get Free Estimate
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a
          href={`tel:${phoneClean}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 28px", border: `2px dashed ${CHALK.borderDashed}`,
            color: CHALK.textMuted, borderRadius: 9999, fontFamily: CHALK.fontDisplay, fontSize: 18,
            textDecoration: "none", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = CHALK.accent; e.currentTarget.style.color = CHALK.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = CHALK.borderDashed; e.currentTarget.style.color = CHALK.textMuted; }}
        >
          Call {phone}
        </a>
      </div>
    </section>
  );
}
