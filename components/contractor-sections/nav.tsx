"use client";

// Nav — floating glassmorphism pill navigation.
// Sticks to the top, transparent blur background,
// shows business name, anchor links, phone, and CTA.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

// We only pick the fields this section needs
type NavProps = Pick<ContractorSiteData, "businessName" | "phone" | "hasEstimateWidget">;

export default function Nav({ businessName, phone, hasEstimateWidget }: NavProps) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <nav
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: THEME.maxWidth,
        zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${THEME.border}`,
        borderRadius: THEME.borderRadius,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: THEME.fontBody,
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo / Business name */}
      <a
        href="#"
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: THEME.primary,
          textDecoration: "none",
          fontFamily: THEME.fontDisplay,
          letterSpacing: "-0.3px",
        }}
      >
        {businessName}
      </a>

      {/* Desktop nav links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
        className="hidden md:flex"
      >
        {["Services", "About", "Reviews", "Contact"].map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: THEME.textMuted,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = THEME.textMuted)}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Right: phone + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a
          href={`tel:${phoneClean}`}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: THEME.textSecondary,
            textDecoration: "none",
          }}
          className="hidden sm:block"
        >
          {phone}
        </a>
        {hasEstimateWidget && (
          <a
            href="#estimate"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: THEME.primary,
              padding: "8px 18px",
              borderRadius: 10,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = THEME.primary)}
          >
            Get Free Estimate
          </a>
        )}
      </div>
    </nav>
  );
}
