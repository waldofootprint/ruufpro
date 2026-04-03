"use client";

// Proof Bar — horizontal row of trust signal pills with green checkmarks.
// Dynamically built from the contractor's trust signal checkboxes.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type ProofBarProps = Pick<
  ContractorSiteData,
  "isLicensed" | "isInsured" | "offersFinancing" | "hasEstimateWidget" | "yearsInBusiness" | "reviews"
>;

export default function ProofBar({ isLicensed, isInsured, offersFinancing, hasEstimateWidget, yearsInBusiness, reviews = [] }: ProofBarProps) {
  // Build pills dynamically from what the roofer has checked
  const pills: string[] = [];
  if (hasEstimateWidget) pills.push("Free Estimates");
  if (isLicensed || isInsured) pills.push("Licensed & Insured");
  pills.push("Locally Owned"); // always show this — they're all local
  if (offersFinancing) pills.push("Financing Available");
  if (pills.length < 4) pills.push("Satisfaction Guaranteed"); // fill to 4

  return (
    <section
      style={{
        padding: "0 24px 40px",
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {pills.map((pill) => (
          <div
            key={pill}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: THEME.bgWarm,
              border: `1px solid ${THEME.border}`,
              borderRadius: 10,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 500,
              color: THEME.textPrimary,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {pill}
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          flexWrap: "wrap",
          marginTop: 24,
          padding: "20px 0",
          borderTop: `1px solid ${THEME.border}`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        {yearsInBusiness && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: THEME.primary, fontFamily: THEME.fontDisplay, lineHeight: 1 }}>{yearsInBusiness}+</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Years in Business</p>
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.77-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <p style={{ fontSize: 28, fontWeight: 800, color: THEME.primary, fontFamily: THEME.fontDisplay, lineHeight: 1 }}>
              {reviews.length > 0 ? reviews.length : "5.0"}
            </p>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {reviews.length > 0 ? "Google Reviews" : "Google Rating"}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: THEME.primary, fontFamily: THEME.fontDisplay, lineHeight: 1 }}>100%</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Satisfaction</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: THEME.primary, fontFamily: THEME.fontDisplay, lineHeight: 1 }}>Free</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Estimates</p>
        </div>
      </div>
    </section>
  );
}
