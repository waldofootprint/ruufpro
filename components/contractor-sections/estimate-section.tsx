"use client";

// Estimate Widget Section — only renders if contractor has the paid widget.
// Imports the widget directly (no iframe) for seamless rendering.
// Layout: copy + steps on left, widget on right.

import { THEME } from "./theme";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

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
      {/* Header — centered */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: 32 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, justifyContent: "center" }}>
          <div style={{ width: 3, height: 20, background: THEME.accent, borderRadius: 2, flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: THEME.accent,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontFamily: THEME.fontDisplay,
            }}
          >
            Instant estimate
          </span>
        </div>
        <h2
          style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 800,
            color: THEME.textPrimary,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 10,
            fontFamily: THEME.fontSerif,
          }}
        >
          Get a Ballpark
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
          Instant estimate. Zero commitment.
        </p>
      </motion.div>

      {/* Widget card — centered, contained */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          maxWidth: 600,
          margin: "0 auto",
          background: THEME.bgWarm,
          border: `1px solid ${THEME.border}`,
          borderRadius: THEME.borderRadiusLg,
          padding: "32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <EstimateWidgetV4
          contractorId={contractorId}
          contractorName={businessName}
          contractorPhone={phone}
          variant="light"
        />

        {/* Privacy badge — inside the card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${THEME.border}`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: THEME.textMuted }}>
            Your info stays private — we never share or sell your data
          </span>
        </div>
      </motion.div>
    </section>
  );
}
