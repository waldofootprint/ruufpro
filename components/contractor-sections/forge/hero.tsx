"use client";

// Forge Hero — dark background with blue accent strip at top,
// bold white heading on left, full-bleed roofing image on right,
// value props stacked vertically with blue accent lines.

import Image from "next/image";
import { FORGE } from "../theme-forge";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";

type HeroProps = Pick<
  ContractorSiteData,
  "businessName" | "phone" | "city" | "heroHeadline" | "tagline" | "heroCta" | "heroImage" | "hasEstimateWidget" | "reviews" | "urgencyBadge" | "offersFinancing"
>;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const slideIn = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.3 } },
};

export default function ForgeHero({
  businessName,
  phone,
  city,
  heroHeadline,
  tagline,
  heroCta,
  heroImage,
  hasEstimateWidget,
  reviews = [],
  urgencyBadge,
  offersFinancing,
}: HeroProps) {
  const headline = heroHeadline || `Your Home Deserves the Best Roofing`;
  const subtitle = tagline || `Elevate your property's protection and curb appeal with ${businessName}, ${city}'s trusted leader. We deliver unmatched durability, meticulous craftsmanship, and transparent service. Secure your home's future with a free estimate today!`;
  const ctaText = heroCta || "Contact Us";
  const imgSrc = heroImage || "https://images.unsplash.com/photo-1773427617774-d9ce7493b3d8?w=900&h=700&q=85&auto=format&fit=crop";

  const valueProps = [
    "Unrivaled Durability",
    "Expert Local Craftsmanship",
    "Guaranteed Satisfaction",
  ];

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        background: FORGE.bg,
        fontFamily: FORGE.fontBody,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: FORGE.maxWidth,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: 560,
          }}
          className="grid-cols-1! md:grid-cols-[1fr_1fr]!"
        >
          {/* Left: text content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingRight: 48,
              paddingTop: 60,
              paddingBottom: 60,
            }}
            className="pr-0! md:pr-12!"
          >
            {/* Urgency Badge */}
            <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: FORGE.accent,
                  background: `${FORGE.accent}15`,
                  border: `1px solid ${FORGE.accent}30`,
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontFamily: FORGE.fontDisplay,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {urgencyBadge || "Free Estimates Within 24 Hours"}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: "clamp(34px, 4.5vw, 52px)",
                fontWeight: 700,
                color: FORGE.text,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                marginBottom: 24,
                fontFamily: FORGE.fontDisplay,
              }}
            >
              {headline}
            </motion.h1>

            {/* Subtitle paragraph */}
            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 15,
                color: FORGE.textMuted,
                lineHeight: 1.7,
                maxWidth: 480,
                marginBottom: 40,
              }}
            >
              {subtitle}
            </motion.p>

            {/* Value props — stacked vertically with blue accent lines */}
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {valueProps.map((prop, i) => (
                <div key={i}>
                  {/* Blue accent line */}
                  <div
                    style={{
                      width: 36,
                      height: 3,
                      background: FORGE.accent,
                      borderRadius: 2,
                      marginBottom: 10,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: FORGE.text,
                      letterSpacing: "0.02em",
                      fontFamily: FORGE.fontDisplay,
                    }}
                  >
                    {prop}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Google Review Badge */}
            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 32 }}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.77-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {[1,2,3,4,5].map(i => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FBBC05" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              <span style={{ fontSize: 13, fontWeight: 500, color: FORGE.textMuted }}>
                {reviews.length > 0 ? `${reviews.length} Google Reviews` : "5-Star Google Rated"}
              </span>
            </motion.div>
          </div>

          {/* Right: full-bleed hero image */}
          <motion.div
            variants={slideIn}
            style={{
              position: "relative",
              minHeight: 400,
            }}
            className="hidden md:block"
          >
            <Image
              src={imgSrc}
              alt={`${businessName} - professional roofing services in ${city}`}
              fill
              style={{ objectFit: "cover" }}
              sizes="50vw"
              priority
            />
            {/* CTA buttons overlaid on image */}
            <div style={{ position: "absolute", bottom: 32, right: 32, display: "flex", gap: 10, zIndex: 2 }}>
              <a
                href={offersFinancing ? "#estimate" : "#services"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  borderRadius: FORGE.borderRadius,
                  border: "1px solid rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                  fontFamily: FORGE.fontDisplay,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}
              >
                {offersFinancing ? "See Financing" : "Explore Services"}
              </a>
              <a
                href={hasEstimateWidget ? "#estimate" : "#contact"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: FORGE.accent,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  borderRadius: FORGE.borderRadius,
                  transition: "background 0.2s",
                  fontFamily: FORGE.fontDisplay,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = FORGE.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = FORGE.accent)}
              >
                {ctaText}
              </a>
            </div>
            {/* Subtle gradient overlay for depth */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(13,13,13,0.3) 0%, transparent 30%)",
                pointerEvents: "none",
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
