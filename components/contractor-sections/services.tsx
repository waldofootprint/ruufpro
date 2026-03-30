// Services — 2-column grid of numbered service cards.
// Uses the services array from the site data.
// Falls back to common roofing services if none are set.

"use client";

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type ServicesProps = Pick<ContractorSiteData, "services">;

// Default descriptions for common services
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "Roof Replacement": "Complete tear-off and installation of your new roof system, using premium materials backed by manufacturer warranties.",
  "Roof Repair": "Leak fixes, storm damage repair, flashing replacement, and patching — we handle it all quickly and affordably.",
  "Inspections": "Thorough roof assessment with a detailed written report. Know exactly what your roof needs before making decisions.",
  "Gutters": "Seamless gutter installation, repair, and cleaning to protect your home from water damage.",
  "Emergency Tarping": "24/7 emergency service for storm damage. We'll get your roof tarped and protected fast.",
  "Storm Damage": "Insurance claim assistance and full storm restoration services. We work with all major carriers.",
};

// Icons for common services (SVG paths)
const SERVICE_ICONS: Record<string, React.ReactElement> = {
  "Roof Replacement": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={THEME.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  "Roof Repair": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={THEME.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  default: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={THEME.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
};

export default function Services({ services }: ServicesProps) {
  // Fall back to standard roofing services if none set
  const serviceList = services.length > 0
    ? services
    : ["Roof Replacement", "Roof Repair", "Inspections", "Gutters"];

  return (
    <section
      id="services"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: THEME.accent,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
            fontFamily: THEME.fontDisplay,
          }}
        >
          What we do
        </p>
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 700,
            color: THEME.textPrimary,
            lineHeight: 1.15,
            fontFamily: THEME.fontDisplay,
          }}
        >
          Our services
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, marginTop: 8, maxWidth: 540, lineHeight: 1.6 }}>
          From small repairs to complete replacements, we handle every aspect of your roofing needs with expertise and care.
        </p>
      </div>

      {/* Service grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {serviceList.slice(0, 6).map((service, i) => {
          const desc = SERVICE_DESCRIPTIONS[service] || `Professional ${service.toLowerCase()} services delivered with quality craftsmanship and attention to detail.`;
          const icon = SERVICE_ICONS[service] || SERVICE_ICONS.default;

          return (
            <div
              key={service}
              style={{
                background: THEME.bgWarm,
                border: `1.5px solid ${THEME.border}`,
                borderRadius: THEME.borderRadius,
                padding: 28,
                transition: "all 0.2s ease",
                cursor: "default",
                borderLeft: "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = THEME.accent;
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Number + icon */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: THEME.border,
                    opacity: 0.5,
                    fontFamily: THEME.fontDisplay,
                    lineHeight: 1,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#fff",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {icon}
                </div>
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  marginBottom: 8,
                  fontFamily: THEME.fontDisplay,
                }}
              >
                {service}
              </h3>
              <p style={{ fontSize: 15, color: THEME.textSecondary, lineHeight: 1.7 }}>
                {desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
