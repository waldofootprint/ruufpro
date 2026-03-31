"use client";

import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "hasEstimateWidget">;

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

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
              key={link.label}
              href={link.href}
              style={{ fontSize: 14, fontWeight: 500, color: BLUEPRINT.textSecondary, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = BLUEPRINT.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = BLUEPRINT.textSecondary)}
              className="hidden md:inline!"
            >
              {link.label}
            </a>
          ))}
          <a href={`tel:${phoneClean}`} style={{ fontSize: 14, fontWeight: 600, color: BLUEPRINT.text, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden!"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span className="hidden sm:inline!">{phone}</span>
          </a>
          <a
            href={hasEstimateWidget ? "#estimate" : "#contact"}
            style={{
              padding: "8px 20px",
              background: BLUEPRINT.accent,
              color: "#fff",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BLUEPRINT.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BLUEPRINT.accent)}
          >
            Free Estimate
          </a>
        </div>
      </div>
    </nav>
  );
}
