"use client";

// Classic Hero — split layout with bold uppercase heading on left,
// diagonal image collage on right. Three value props with vertical dividers.
// Signature design element inspired by premium roofing company sites.

import Image from "next/image";
import { CLASSIC } from "../theme-classic";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";

type HeroProps = Pick<
  ContractorSiteData,
  "businessName" | "phone" | "city" | "heroHeadline" | "tagline" | "heroCta" | "heroImage" | "hasEstimateWidget" | "reviews" | "urgencyBadge" | "offersFinancing"
>;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const slideIn = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.3 } },
};

// Three roofing images for the diagonal collage
const COLLAGE_IMAGES = [
  "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&h=800&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1635424709870-cdc6e64f0e20?w=600&h=800&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=800&q=85&auto=format&fit=crop",
];

export default function ClassicHero({
  businessName,
  phone,
  city,
  heroHeadline,
  tagline,
  heroCta,
  hasEstimateWidget,
  reviews = [],
  urgencyBadge,
  offersFinancing,
}: HeroProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const headline = heroHeadline || `Your Home Deserves the Best Roofing`;
  const subtitle = tagline || `Elevate your property's protection and curb appeal with ${businessName}, ${city}'s trusted leader. We deliver unmatched durability, meticulous craftsmanship, and transparent service. Secure your home's future with a free estimate today!`;
  const ctaText = heroCta || "Contact Us";

  const valueProps = [
    "UNRIVALED\nDURABILITY",
    "EXPERT LOCAL\nCRAFTSMANSHIP",
    "GUARANTEED\nSATISFACTION",
  ];

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        background: CLASSIC.bg,
        fontFamily: CLASSIC.fontBody,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: CLASSIC.maxWidth,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
          className="grid-cols-1! md:grid-cols-[1fr_1fr]!"
        >
          {/* Left: text content */}
          <div>
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
                  color: CLASSIC.accent,
                  background: "rgba(45,45,45,0.08)",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontFamily: CLASSIC.fontDisplay,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {urgencyBadge || "Free Estimates Within 24 Hours"}
              </span>
            </motion.div>

            {/* Headline — large uppercase */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 600,
                color: CLASSIC.text,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                marginBottom: 32,
                fontFamily: CLASSIC.fontDisplay,
                textTransform: "uppercase",
              }}
            >
              {headline}
            </motion.h1>

            {/* Value props with vertical dividers */}
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 0,
                marginBottom: 32,
              }}
              className="flex-col! md:flex-row!"
            >
              {valueProps.map((prop, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  {i > 0 && (
                    <div
                      className="hidden md:block"
                      style={{
                        width: 1,
                        height: 40,
                        background: CLASSIC.border,
                        margin: "0 24px",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: CLASSIC.textSecondary,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      whiteSpace: "pre-line",
                      lineHeight: 1.5,
                      fontFamily: CLASSIC.fontDisplay,
                    }}
                  >
                    {prop}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Subtitle paragraph */}
            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 15,
                color: CLASSIC.textSecondary,
                lineHeight: 1.7,
                maxWidth: 520,
                marginBottom: 32,
              }}
            >
              {subtitle}
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href={hasEstimateWidget ? "#estimate" : "#contact"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 32px",
                  background: CLASSIC.accent,
                  color: "#fff",
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
                  e.currentTarget.style.background = CLASSIC.accentHover;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = CLASSIC.accent;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {ctaText}
              </a>
              <a
                href={offersFinancing ? "#estimate" : "#services"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 32px",
                  background: "transparent",
                  color: CLASSIC.text,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: CLASSIC.borderRadius,
                  border: `1px solid ${CLASSIC.border}`,
                  transition: "all 0.2s",
                  fontFamily: CLASSIC.fontDisplay,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = CLASSIC.accent;
                  e.currentTarget.style.color = CLASSIC.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = CLASSIC.border;
                  e.currentTarget.style.color = CLASSIC.text;
                }}
              >
                {offersFinancing ? "See Financing" : "Explore Services"}
              </a>
            </motion.div>

            {/* Google Review Badge */}
            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.77-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {[1,2,3,4,5].map(i => <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#FBBC05" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              <span style={{ fontSize: 13, fontWeight: 500, color: CLASSIC.textSecondary }}>
                {reviews.length > 0 ? `${reviews.length} Google Reviews` : "5-Star Google Rated"}
              </span>
            </motion.div>
          </div>

          {/* Right: diagonal image collage */}
          <motion.div
            variants={slideIn}
            style={{
              position: "relative",
              height: 480,
            }}
            className="hidden md:block"
          >
            {/* Subtle frame outline behind collage */}
            <div
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                bottom: 8,
                left: 8,
                border: `1px solid ${CLASSIC.border}`,
                borderRadius: CLASSIC.borderRadiusLg,
                zIndex: 0,
              }}
            />

            {/* Three diagonal images */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: CLASSIC.borderRadiusLg,
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              {/* Image 1 — left panel */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: "polygon(0 0, 38% 0, 28% 100%, 0 100%)",
                }}
              >
                <Image
                  src={COLLAGE_IMAGES[0]}
                  alt={`${businessName} roof replacement in progress`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="30vw"
                  priority
                />
              </div>

              {/* Image 2 — center panel */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: "polygon(40% 0, 72% 0, 62% 100%, 30% 100%)",
                }}
              >
                <Image
                  src={COLLAGE_IMAGES[1]}
                  alt={`${businessName} roofing team at work`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="35vw"
                  priority
                />
              </div>

              {/* Image 3 — right panel */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: "polygon(74% 0, 100% 0, 100% 100%, 64% 100%)",
                }}
              >
                <Image
                  src={COLLAGE_IMAGES[2]}
                  alt={`${businessName} completed roof project in ${city}`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="35vw"
                  priority
                />
              </div>

              {/* White diagonal separator lines */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="38" y1="0" x2="28" y2="100" stroke="white" strokeWidth="0.6" />
                  <line x1="72" y1="0" x2="62" y2="100" stroke="white" strokeWidth="0.6" />
                </svg>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
