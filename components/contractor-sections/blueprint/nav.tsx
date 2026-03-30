"use client";

import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "hasEstimateWidget">;

const NAV_LINKS = ["Services", "About", "Reviews", "Contact"];

export default function BlueprintNav({ businessName, phone, hasEstimateWidget }: Props) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${BLUEPRINT.border}`,
        fontFamily: BLUEPRINT.fontBody,
      }}
    >
      <div
        style={{
          maxWidth: BLUEPRINT.maxWidth,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="#hero" style={{ fontFamily: BLUEPRINT.fontDisplay, fontWeight: 800, fontSize: 18, color: BLUEPRINT.text, textDecoration: "none" }}>
          {businessName}
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              style={{ fontSize: 14, fontWeight: 500, color: BLUEPRINT.textSecondary, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = BLUEPRINT.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = BLUEPRINT.textSecondary)}
              className="hidden md:inline!"
            >
              {link}
            </a>
          ))}
          <a href={`tel:${phoneClean}`} style={{ fontSize: 14, fontWeight: 600, color: BLUEPRINT.text, textDecoration: "none" }} className="hidden sm:inline!">
            {phone}
          </a>
          <a
            href={hasEstimateWidget ? "#estimate" : "#contact"}
            style={{
              padding: "8px 20px",
              background: BLUEPRINT.accent,
              color: "#fff",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BLUEPRINT.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BLUEPRINT.accent)}
          >
            Get Estimate
          </a>
        </div>
      </div>
    </nav>
  );
}
