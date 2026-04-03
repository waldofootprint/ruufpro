"use client";

// Classic About — clean two-column layout with image and text.
// Professional, minimal styling with subtle border accents.

import Image from "next/image";
import { CLASSIC } from "../theme-classic";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";

type AboutProps = Pick<ContractorSiteData, "businessName" | "city" | "state" | "aboutText" | "yearsInBusiness">;

export default function ClassicAbout({
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
        background: CLASSIC.bg,
        padding: CLASSIC.sectionPadding,
        fontFamily: CLASSIC.fontBody,
      }}
    >
      <div style={{ maxWidth: CLASSIC.maxWidth, margin: "0 auto" }}>
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
            <div style={{ position: "relative", width: "100%", height: 400, overflow: "hidden", borderRadius: CLASSIC.borderRadiusLg }}>
              <Image
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&q=85&auto=format&fit=crop"
                alt={`${businessName} roofing team serving ${city}, ${state}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Years badge */}
            {yearsInBusiness && (
              <div
                style={{
                  position: "absolute",
                  bottom: -16,
                  right: 24,
                  background: CLASSIC.accent,
                  color: "#fff",
                  padding: "16px 24px",
                  borderRadius: CLASSIC.borderRadius,
                  textAlign: "center",
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: CLASSIC.fontDisplay }}>
                  {yearsInBusiness}+
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>
                  Years
                </div>
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
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: CLASSIC.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 12,
                fontFamily: CLASSIC.fontDisplay,
              }}
            >
              ABOUT US
            </span>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 600,
                color: CLASSIC.text,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
                marginBottom: 24,
                fontFamily: CLASSIC.fontDisplay,
              }}
            >
              {city}&apos;s Most Trusted Roofing Team
            </h2>
            <p
              style={{
                fontSize: 15,
                color: CLASSIC.textSecondary,
                lineHeight: 1.75,
                marginBottom: 24,
              }}
            >
              {text}
            </p>

            {/* Trust indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Licensed & Fully Insured",
                "Free Inspections & Estimates",
                "Workmanship Guarantee",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CLASSIC.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: CLASSIC.text }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
