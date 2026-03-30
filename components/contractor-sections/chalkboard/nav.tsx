"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "hasEstimateWidget">;

export default function ChalkNav({ businessName, phone, hasEstimateWidget }: Props) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: "rgba(42,45,42,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px dashed ${CHALK.borderDashed}`,
        fontFamily: CHALK.fontBody,
      }}
    >
      <a href="#" style={{ fontFamily: CHALK.fontDisplay, fontSize: 28, color: CHALK.text, textDecoration: "none" }}>
        {businessName}
      </a>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }} className="hidden md:flex">
        {["Services", "About", "Reviews", "Contact"].map((label) => (
          <a key={label} href={`#${label.toLowerCase()}`}
            style={{ fontSize: 17, color: CHALK.textMuted, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = CHALK.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = CHALK.textMuted)}>
            {label}
          </a>
        ))}
        <a href={`tel:${phoneClean}`} style={{ fontSize: 15, color: CHALK.textFaint, textDecoration: "none" }}>
          {phone}
        </a>
        {hasEstimateWidget && (
          <a href="#estimate"
            style={{ fontFamily: CHALK.fontDisplay, fontSize: 15, background: CHALK.accent, color: CHALK.bg, padding: "8px 20px", borderRadius: 6, textDecoration: "none", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = CHALK.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = CHALK.accent)}>
            Get Estimate
          </a>
        )}
      </div>
    </nav>
  );
}
