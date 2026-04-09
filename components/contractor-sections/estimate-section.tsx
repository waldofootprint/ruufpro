"use client";

// Estimate Widget Section — Amber Accent Band style.
// Full-width amber bg with copy + trust pills left, widget right.
// Only renders if contractor has the paid widget.

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
      className="estimate-band"
      style={{
        position: "relative",
        background: THEME.accent,
        padding: "56px 48px",
        fontFamily: THEME.fontBody,
        overflow: "hidden",
      }}
    >
      {/* Dot texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          pointerEvents: "none",
        }}
      />

      <div
        className="estimate-band-grid"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: THEME.maxWidth,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        {/* Left — copy + trust pills */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{
              fontFamily: THEME.fontDisplay,
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: THEME.primary,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.0,
              marginBottom: 12,
            }}
          >
            Get Your Free Estimate Now
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(26,26,26,0.7)",
              lineHeight: 1.65,
              marginBottom: 24,
              maxWidth: 400,
            }}
          >
            No phone tag. No waiting for a callback. Enter your address and get a ballpark price in under 2 minutes.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["Satellite-measured", "Local pricing", "Zero commitment"].map((pill) => (
              <div
                key={pill}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  background: "rgba(26,26,26,0.1)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: THEME.primary,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {pill}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — widget */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: "#fff",
            boxShadow: "0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <EstimateWidgetV4
            contractorId={contractorId}
            contractorName={businessName}
            contractorPhone={phone}
            variant="light"
            accentColor={THEME.accent}
          />
        </motion.div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          .estimate-band { padding: 40px 16px !important; }
          .estimate-band-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
