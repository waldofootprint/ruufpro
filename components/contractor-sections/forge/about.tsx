"use client";

// Forge About — dark background with image and text side by side.

import Image from "next/image";
import { FORGE } from "../theme-forge";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";

type AboutProps = Pick<ContractorSiteData, "businessName" | "city" | "state" | "aboutText" | "yearsInBusiness">;

export default function ForgeAbout({
  businessName,
  city,
  state,
  aboutText,
  yearsInBusiness,
}: AboutProps) {
  const text = aboutText || `${businessName} has been the trusted roofing partner for homeowners in ${city}, ${state} for ${yearsInBusiness || "many"} years. We're committed to delivering exceptional craftsmanship, honest pricing, and a seamless experience from the first inspection to the final cleanup.`;

  return (
    <section
      id="about"
      style={{
        background: FORGE.bg,
        padding: FORGE.sectionPadding,
        fontFamily: FORGE.fontBody,
      }}
    >
      <div style={{ maxWidth: FORGE.maxWidth, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
          className="grid-cols-1! md:grid-cols-[1fr_1fr]!"
        >
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ position: "relative" }}
          >
            <div style={{ position: "relative", width: "100%", height: 400, overflow: "hidden", borderRadius: FORGE.borderRadiusLg }}>
              <Image
                src="https://images.unsplash.com/photo-1762810981576-1b07f76af9d2?w=800&h=600&q=85&auto=format&fit=crop"
                alt={`${businessName} roofing team serving ${city}, ${state}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {yearsInBusiness && (
              <div
                style={{
                  position: "absolute",
                  bottom: -16,
                  right: 24,
                  background: FORGE.accent,
                  color: "#fff",
                  padding: "16px 24px",
                  borderRadius: FORGE.borderRadius,
                  textAlign: "center",
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: FORGE.fontDisplay }}>{yearsInBusiness}+</div>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>Years</div>
              </div>
            )}
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div style={{ width: 36, height: 3, background: FORGE.accent, borderRadius: 2, marginBottom: 16 }} />
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 600,
                color: FORGE.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
                marginBottom: 24,
                fontFamily: FORGE.fontDisplay,
              }}
            >
              {city}&apos;s Most Trusted Roofing Team
            </h2>
            <p style={{ fontSize: 15, color: FORGE.textMuted, lineHeight: 1.75, marginBottom: 24 }}>
              {text}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Licensed & Fully Insured", "Free Inspections & Estimates", "Workmanship Guarantee"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FORGE.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: FORGE.text }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
