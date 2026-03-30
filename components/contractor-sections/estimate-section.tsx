"use client";

// Estimate Widget Section — only renders if contractor has the paid widget.
// Shows a description + embeds the actual estimate widget component.
// For free-plan roofers, this section simply doesn't render (clean removal).

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type EstimateSectionProps = Pick<
  ContractorSiteData,
  "hasEstimateWidget" | "contractorId" | "businessName" | "phone"
>;

export default function EstimateSection({
  hasEstimateWidget,
  contractorId,
  businessName,
  phone,
}: EstimateSectionProps) {
  // Clean removal — free plan roofers don't see this at all
  if (!hasEstimateWidget) return null;

  return (
    <section
      id="estimate"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      <div
        style={{
          background: THEME.bgWarm,
          border: `1.5px solid ${THEME.border}`,
          borderRadius: THEME.borderRadiusLg,
          padding: "48px",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 48,
          alignItems: "start",
        }}
        className="grid-cols-1! md:grid-cols-[1.2fr_0.8fr]!"
      >
        {/* Left: heading + form */}
        <div>
          <h2
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              color: THEME.textPrimary,
              lineHeight: 1.15,
              marginBottom: 12,
              fontFamily: THEME.fontDisplay,
            }}
          >
            Curious what a new roof costs?
          </h2>
          <p style={{ fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6, marginBottom: 32, maxWidth: 480 }}>
            We believe in transparency. Use our free estimator to get a ballpark price in about 2 minutes — no phone call, no pressure.
          </p>

          {/* The actual widget will be embedded here via iframe or component */}
          <div
            style={{
              background: THEME.primary,
              borderRadius: THEME.borderRadius,
              padding: 24,
              minHeight: 300,
            }}
          >
            <iframe
              src={`/widget/${contractorId}`}
              style={{
                width: "100%",
                minHeight: 500,
                border: "none",
                borderRadius: 12,
              }}
              title="Roofing Estimate Calculator"
            />
          </div>
        </div>

        {/* Right: how it works mini-steps */}
        <div style={{ paddingTop: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: THEME.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 24,
            }}
          >
            How it works
          </p>

          {[
            { step: "1", title: "We measure your roof", desc: "Using satellite imagery for accurate square footage" },
            { step: "2", title: "You pick your materials", desc: "Compare asphalt, metal, tile, and more" },
            { step: "3", title: "Get your ballpark price", desc: "A clear estimate range, no surprises" },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: THEME.primary,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                  fontFamily: THEME.fontDisplay,
                }}
              >
                {item.step}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: THEME.textPrimary, marginBottom: 2 }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
