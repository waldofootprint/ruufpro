"use client";

// About — image + story + values. Falls back to auto-generated content.

import Image from "next/image";
import { THEME } from "./theme";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";

type AboutProps = Pick<ContractorSiteData, "businessName" | "city" | "aboutText" | "yearsInBusiness">;

export default function About({ businessName, city, aboutText, yearsInBusiness }: AboutProps) {
  const story = aboutText || `${businessName} is a locally owned roofing company serving homeowners in ${city} and the surrounding area${yearsInBusiness ? ` for over ${yearsInBusiness} years` : ""}. We show up on time, give you an honest assessment of what your roof actually needs, and do the work right. No pressure tactics, no inflated quotes, no disappearing after the check clears. Just straightforward roofing from people who live in your community.`;

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}
        className="grid-cols-1! md:grid-cols-2!"
      >
        {/* Image with accent strip */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 12,
              left: -10,
              bottom: 24,
              width: "100%",
              background: THEME.primary,
              borderRadius: "20px 4px 4px 20px",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, width: "100%", height: 420, overflow: "hidden", borderRadius: "20px 4px 4px 20px" }}>
            <Image
              src="https://images.unsplash.com/photo-1747188460368-9e61441e97fa?w=800&q=80&auto=format"
              alt={`${businessName} roofing team serving ${city}`}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px 4px 4px 20px",
                background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.12) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
          {yearsInBusiness && (
            <div
              className="hidden sm:flex"
              style={{
                position: "absolute",
                bottom: 8,
                right: -16,
                zIndex: 2,
                width: 90,
                height: 90,
                background: THEME.accent,
                borderRadius: 14,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 20px rgba(232,114,12,0.3)",
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", fontFamily: THEME.fontDisplay, lineHeight: 1 }}>
                {yearsInBusiness}+
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Years</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 3, height: 20, background: THEME.accent, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: THEME.fontDisplay }}>
              About us
            </span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: THEME.textPrimary, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16, fontFamily: THEME.fontSerif }}>
            Built on trust, one roof at a time
          </h2>
          <p style={{ fontSize: 16, color: THEME.textSecondary, lineHeight: 1.7, marginBottom: 28 }}>
            {story}
          </p>

          {/* Values */}
          <div style={{ display: "flex", gap: 20, borderTop: `1px solid ${THEME.border}`, paddingTop: 24 }} className="flex-col! sm:flex-row!">
            {[
              { title: "Written Estimates", desc: "You see the full breakdown before we start. No hidden fees, no surprise charges." },
              { title: "Clean Job Sites", desc: "We protect your landscaping, use tarps, and haul everything away. Magnetic nail sweep included." },
              { title: "Warranty Backed", desc: "Manufacturer warranties on materials plus our own workmanship guarantee." },
            ].map((v) => (
              <div key={v.title} style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary, marginBottom: 4, fontFamily: THEME.fontDisplay }}>{v.title}</h4>
                <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.55 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
