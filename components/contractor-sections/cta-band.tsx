"use client";

// CTA Band — dark full-width call-to-action with dot texture background.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type CtaBandProps = Pick<ContractorSiteData, "phone" | "city" | "hasEstimateWidget">;

export default function CtaBand({ phone, city, hasEstimateWidget }: CtaBandProps) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <section
      style={{
        background: THEME.primary,
        padding: "64px 24px",
        textAlign: "center",
        fontFamily: THEME.fontBody,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dot texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: 12,
            fontFamily: THEME.fontDisplay,
          }}
        >
          Ready to get your roof handled?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 32, lineHeight: 1.6 }}>
          Free estimate, no obligation, no pressure. We'll come out, look at your roof, and give you an honest answer. Most calls returned same day.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          {hasEstimateWidget ? (
            <a
              href="#estimate"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: THEME.accent,
                color: "#fff",
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                fontFamily: THEME.fontDisplay,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
            >
              Get Your Free Estimate
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          ) : (
            <a
              href="#contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: THEME.accent,
                color: "#fff",
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                fontFamily: THEME.fontDisplay,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
            >
              Contact Us
            </a>
          )}
          <a
            href={`tel:${phoneClean}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              background: "transparent",
              color: "#fff",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderRadius: 9999,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              fontFamily: THEME.fontDisplay,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            Call {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
