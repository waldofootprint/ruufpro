"use client";

// FinancingCallout — removes the price objection.
// "Flexible financing available. $0 down, 0% interest options."
// Compact callout section with CTA.

import { motion } from "framer-motion";

interface Theme {
  bg?: string;
  bgWarm?: string;
  bgAlt?: string;
  text?: string;
  textSecondary?: string;
  accent?: string;
  cta?: string;
  ctaHover?: string;
  fontDisplay?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
  borderRadius?: string;
  border?: string;
}

interface FinancingCalloutProps {
  theme: Theme;
  isDark?: boolean;
  offersFinancing: boolean;
  phone?: string;
}

export default function FinancingCallout({
  theme,
  isDark = false,
  offersFinancing,
  phone,
}: FinancingCalloutProps) {
  if (!offersFinancing) return null;

  const textColor = isDark ? "#FFFFFF" : (theme.text || "#1A1A2E");
  const mutedColor = isDark ? "rgba(255,255,255,0.65)" : (theme.textSecondary || "#666");
  const accentColor = theme.accent || "#E8722A";
  const ctaColor = theme.cta || accentColor;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : (theme.border || "#E5E7EB");
  const bgColor = isDark ? "rgba(255,255,255,0.03)" : (theme.bgWarm || theme.bgAlt || "#F9FAFB");

  return (
    <section style={{
      padding: "48px 32px",
      fontFamily: theme.fontBody,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: theme.maxWidth || "1100px",
          margin: "0 auto",
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: theme.borderRadius || "12px",
          padding: "40px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 24 }}>💳</span>
            <h3 style={{
              fontFamily: theme.fontDisplay,
              fontSize: 22,
              fontWeight: 700,
              color: textColor,
              margin: 0,
            }}>
              Flexible Financing Available
            </h3>
          </div>
          <p style={{
            fontSize: 15,
            color: mutedColor,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Don't let budget hold you back. We offer financing options with $0 down and competitive rates so you can protect your home now and pay over time.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          {phone && (
            <a
              href={`tel:${phone}`}
              style={{
                padding: "14px 28px",
                borderRadius: theme.borderRadius || "10px",
                background: ctaColor,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "transform 0.15s",
              }}
            >
              Ask About Financing
            </a>
          )}
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 640px) {
          section > div > div { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>
    </section>
  );
}
