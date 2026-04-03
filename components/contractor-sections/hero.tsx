"use client";

// Hero — Editorial Confidence design.
// Atmospheric background, bold typography, staggered motion,
// angular image treatment, elevated trust proof strip.

import Image from "next/image";
import { THEME } from "./theme";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";

type HeroProps = Pick<
  ContractorSiteData,
  "businessName" | "phone" | "city" | "heroHeadline" | "tagline" | "heroCta" | "heroImage" | "hasEstimateWidget"
>;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const slideIn = {
  hidden: { opacity: 0, x: 40, scale: 0.97 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.2 } },
};

export default function Hero({
  businessName,
  phone,
  city,
  heroHeadline,
  tagline,
  heroCta,
  heroImage,
  hasEstimateWidget,
}: HeroProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const headline = heroHeadline || `Honest roofing for ${city} homeowners.`;
  const subtitle = tagline || `Roof replacements, repairs, and inspections done right — with upfront pricing, clean job sites, and no pressure. Locally owned and fully insured.`;
  const ctaText = heroCta || "Get Your Free Estimate";
  const imgSrc = heroImage || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&h=600&q=85&auto=format&fit=crop";

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        overflow: "hidden",
        fontFamily: THEME.fontBody,
      }}
    >
      {/* Atmospheric background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 10% 0%, rgba(30,58,95,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 90% 10%, rgba(232,114,12,0.04) 0%, transparent 60%),
            linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%)
          `,
          zIndex: 0,
        }}
      />
      {/* Subtle noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "100px 24px 80px",
          maxWidth: THEME.maxWidth,
          margin: "0 auto",
        }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 56,
            alignItems: "center",
          }}
          className="grid-cols-1! md:grid-cols-[1.15fr_0.85fr]!"
        >
          {/* Left: text content */}
          <div>
            {/* Kicker with editorial left-border */}
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 20,
                  background: THEME.accent,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
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
                Locally owned in {city}
              </span>
            </motion.div>

            {/* Headline — go big */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: "clamp(38px, 5.5vw, 64px)",
                fontWeight: 800,
                color: THEME.textPrimary,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                marginBottom: 20,
                fontFamily: THEME.fontDisplay,
              }}
            >
              {headline}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 17,
                color: THEME.textSecondary,
                lineHeight: 1.65,
                maxWidth: 500,
                marginBottom: 36,
              }}
            >
              {subtitle}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}
            >
              {hasEstimateWidget ? (
                <a
                  href="#estimate"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "15px 32px",
                    background: THEME.accent,
                    color: "#fff",
                    borderRadius: 9999,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                    fontFamily: THEME.fontDisplay,
                    boxShadow: "0 4px 16px rgba(232,114,12,0.3), 0 1px 3px rgba(0,0,0,0.08)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = THEME.accentHover;
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(232,114,12,0.35), 0 2px 4px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = THEME.accent;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,114,12,0.3), 0 1px 3px rgba(0,0,0,0.08)";
                  }}
                >
                  {ctaText}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              ) : (
                <a
                  href="#contact"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "15px 32px",
                    background: THEME.accent,
                    color: "#fff",
                    borderRadius: 9999,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                    fontFamily: THEME.fontDisplay,
                    boxShadow: "0 4px 16px rgba(232,114,12,0.3), 0 1px 3px rgba(0,0,0,0.08)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = THEME.accentHover;
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(232,114,12,0.35), 0 2px 4px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = THEME.accent;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,114,12,0.3), 0 1px 3px rgba(0,0,0,0.08)";
                  }}
                >
                  Contact Us
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              )}
              <a
                href={`tel:${phoneClean}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "15px 28px",
                  background: "transparent",
                  color: THEME.textPrimary,
                  border: `1.5px solid ${THEME.border}`,
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: THEME.fontDisplay,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = THEME.primary;
                  e.currentTarget.style.background = "rgba(30,58,95,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = THEME.border;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                Call {phone}
              </a>
            </motion.div>

            {/* Trust proof strip — elevated badges */}
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ),
                  text: "Same-day response",
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={THEME.star} stroke={THEME.star} strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ),
                  text: "5-star Google rated",
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  ),
                  text: "Licensed & insured",
                },
              ].map((badge, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: "rgba(255,255,255,0.8)",
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {badge.icon}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: THEME.textMuted,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: hero image with angular treatment */}
          <motion.div
            variants={slideIn}
            style={{ position: "relative" }}
          >
            {/* Navy accent strip behind image */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: -10,
                bottom: 24,
                width: "100%",
                background: THEME.primary,
                borderRadius: "4px 20px 20px 4px",
                zIndex: 0,
              }}
            />
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: 460, overflow: "hidden", borderRadius: "4px 20px 20px 4px" }}>
              <Image
                src={imgSrc}
                alt={`${businessName} - professional roofing services in ${city}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {/* Subtle gradient overlay on image for depth */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "4px 20px 20px 4px",
                  background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.15) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Floating badge */}
            <div
              className="hidden sm:flex"
              style={{
                position: "absolute",
                bottom: 12,
                left: -20,
                zIndex: 2,
                background: "#fff",
                borderRadius: 12,
                padding: "12px 18px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: THEME.textPrimary,
                fontFamily: THEME.fontDisplay,
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(232,114,12,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={THEME.star} stroke={THEME.star} strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <div style={{ lineHeight: 1.2 }}>Trusted by homeowners</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: THEME.textMuted, marginTop: 1 }}>
                  Free estimates, no pressure
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
