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
        padding: "16px 20px",
        background: "rgba(42,45,42,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${CHALK.border}`,
        fontFamily: CHALK.fontBody,
      }}
    >
      <a href="#" style={{ fontFamily: CHALK.fontDisplay, fontSize: 24, color: CHALK.text, textDecoration: "none" }}
        className="text-xl md:text-2xl">
        {businessName}
      </a>

      {/* Desktop links */}
      <div style={{ display: "flex", gap: 24, alignItems: "center" }} className="hidden md:flex">
        {[
          { label: "Services", href: "/services" },
          { label: "About", href: "#about" },
          { label: "Reviews", href: "#reviews" },
          { label: "Contact", href: "#contact" },
        ].map(({ label, href }) => (
          <a key={label} href={href}
            style={{ fontSize: 17, color: CHALK.textMuted, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = CHALK.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = CHALK.textMuted)}>
            {label}
          </a>
        ))}
        <a href={`tel:${phoneClean}`} style={{ fontSize: 15, color: CHALK.textFaint, textDecoration: "none" }}>
          {phone}
        </a>
      </div>

      {/* Right: phone icon on mobile + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a href={`tel:${phoneClean}`} style={{ color: CHALK.textMuted, textDecoration: "none", display: "flex", alignItems: "center" }} className="md:hidden!">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
        </a>
        <a
          href={hasEstimateWidget ? "#estimate" : "#contact"}
          style={{ fontFamily: CHALK.fontDisplay, fontSize: 15, background: CHALK.accent, color: CHALK.bg, padding: "10px 22px", borderRadius: 9999, textDecoration: "none", transition: "background 0.2s", minHeight: 44, display: "inline-flex", alignItems: "center" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = CHALK.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = CHALK.accent)}
        >
          Free Estimate
        </a>
      </div>
    </nav>
  );
}
