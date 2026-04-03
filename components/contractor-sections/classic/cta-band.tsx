"use client";

// Classic CTA Band — dark background with bold call to action.

import { CLASSIC } from "../theme-classic";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";

type CtaProps = Pick<ContractorSiteData, "phone" | "city" | "hasEstimateWidget">;

export default function ClassicCtaBand({ phone, city, hasEstimateWidget }: CtaProps) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <section
      style={{
        background: CLASSIC.bgDark,
        padding: "64px 24px",
        fontFamily: CLASSIC.fontBody,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: CLASSIC.maxWidth,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 600,
              color: CLASSIC.textOnDark,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              marginBottom: 8,
              fontFamily: CLASSIC.fontDisplay,
            }}
          >
            Ready to Get Started?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: CLASSIC.textOnDarkMuted,
              lineHeight: 1.6,
            }}
          >
            Contact us today for a free inspection and estimate in {city}.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {hasEstimateWidget && (
            <a
              href="#estimate"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "14px 28px",
                background: "#fff",
                color: CLASSIC.text,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: CLASSIC.borderRadius,
                transition: "all 0.2s",
                fontFamily: CLASSIC.fontDisplay,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F0F0F0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              Get Estimate
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
              color: CLASSIC.textOnDark,
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: CLASSIC.borderRadius,
              transition: "all 0.2s",
              fontFamily: CLASSIC.fontDisplay,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Call {phone}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
