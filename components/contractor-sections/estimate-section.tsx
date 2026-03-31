"use client";

// Estimate Widget Section — only renders if contractor has the paid widget.
// Imports the widget directly (no iframe) for seamless rendering.
// Layout: copy + steps on left, widget on right.

import { THEME } from "./theme";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";
import EstimateWidgetV3 from "@/components/estimate-widget-v3";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        style={{
          background: THEME.bgWarm,
          border: `1px solid ${THEME.border}`,
          borderRadius: THEME.borderRadiusLg,
          padding: "48px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
        className="grid-cols-1! md:grid-cols-[1fr_1fr]!"
      >
        {/* Subtle accent glow */}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: -40,
            width: 200,
            height: 200,
            background: "radial-gradient(circle, rgba(232,114,12,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Left: copy + steps */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
              marginBottom: 12,
              fontFamily: THEME.fontDisplay,
            }}
          >
            What will your new roof cost?
          </h2>
          <p style={{ fontSize: 16, color: THEME.textSecondary, lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
            Get a ballpark estimate in about 2 minutes. We measure your actual roof from satellite imagery and apply our pricing — no phone call, no email required, no one will pressure you.
          </p>

          {/* How it works steps */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: THEME.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 24,
              fontFamily: THEME.fontDisplay,
            }}
          >
            How it works
          </p>

          {[
            { step: "1", title: "We measure your roof", desc: "Satellite imagery calculates your actual square footage, pitch, and complexity" },
            { step: "2", title: "We apply our pricing", desc: "Your estimate uses real material and labor costs for this area" },
            { step: "3", title: "You get a ballpark range", desc: "A realistic starting number — not a binding quote, but close enough to plan around" },
          ].map((item, i) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                gap: 14,
                marginBottom: i < 2 ? 20 : 0,
                paddingBottom: i < 2 ? 20 : 0,
                borderBottom: i < 2 ? `1px solid ${THEME.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
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
                <p style={{ fontSize: 15, fontWeight: 700, color: THEME.textPrimary, marginBottom: 3, fontFamily: THEME.fontDisplay }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}

          {/* Trust nudge */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${THEME.border}`,
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 24,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: THEME.textMuted }}>
              Your info stays private — we never share or sell your data
            </span>
          </div>
        </div>

        {/* Right: widget directly embedded */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <EstimateWidgetV3
            contractorId={contractorId}
            contractorName={businessName}
            contractorPhone={phone}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
