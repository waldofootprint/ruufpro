"use client";

// Proof Bar — horizontal row of trust signal pills with green checkmarks.
// Dynamically built from the contractor's trust signal checkboxes.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type ProofBarProps = Pick<
  ContractorSiteData,
  "isLicensed" | "isInsured" | "offersFinancing" | "hasEstimateWidget" | "yearsInBusiness"
>;

export default function ProofBar({ isLicensed, isInsured, offersFinancing, hasEstimateWidget, yearsInBusiness }: ProofBarProps) {
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
          <p style={{ fontSize: 28, fontWeight: 800, color: THEME.primary, fontFamily: THEME.fontDisplay, lineHeight: 1 }}>5.0</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Google Rating</p>
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
