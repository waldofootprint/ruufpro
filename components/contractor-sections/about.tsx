"use client";

// About — image + story + values. Falls back to auto-generated content.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type AboutProps = Pick<ContractorSiteData, "businessName" | "city" | "aboutText" | "yearsInBusiness">;

export default function About({ businessName, city, aboutText, yearsInBusiness }: AboutProps) {
  const story = aboutText || `${businessName} has proudly served the ${city} area${yearsInBusiness ? ` for over ${yearsInBusiness} years` : ""}, providing quality residential roofing services. As a locally owned business, we treat every home like our own — delivering honest assessments, fair pricing, and expert craftsmanship you can count on.`;

  return (
    <section
      id="about"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="grid-cols-1! md:grid-cols-2!">
        {/* Image */}
        <div style={{ position: "relative" }}>
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format"
            alt={`${businessName} team`}
            style={{
              width: "100%",
              height: 420,
              objectFit: "cover",
              borderRadius: THEME.borderRadiusLg,
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          />
          {yearsInBusiness && (
            <div
              style={{
                position: "absolute",
                bottom: -12,
                right: -12,
                width: 100,
                height: 100,
                background: THEME.accent,
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 8px 24px rgba(232,114,12,0.3)`,
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: THEME.fontDisplay, lineHeight: 1 }}>
                {yearsInBusiness}+
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Years</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: THEME.fontDisplay }}>
            About us
          </p>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: THEME.textPrimary, lineHeight: 1.15, marginBottom: 16, fontFamily: THEME.fontDisplay }}>
            Built on trust, one roof at a time
          </h2>
          <p style={{ fontSize: 16, color: THEME.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
            {story}
          </p>

          {/* Values */}
          <div style={{ display: "flex", gap: 24, borderTop: `1px solid ${THEME.border}`, paddingTop: 24 }} className="flex-col! sm:flex-row!">
            {[
              { title: "Premium Materials", desc: "Only top-tier products backed by manufacturer warranties." },
              { title: "Clean Job Sites", desc: "We protect your property and clean up every day." },
              { title: "Clear Pricing", desc: "Detailed written estimates with no hidden fees." },
            ].map((v) => (
              <div key={v.title} style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary, marginBottom: 4, fontFamily: THEME.fontDisplay }}>{v.title}</h4>
                <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
