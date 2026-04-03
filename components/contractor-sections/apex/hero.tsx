"use client";

import Image from "next/image";
import { APEX } from "../theme-apex";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "../types";
import { Phone, ArrowRight, Shield, Clock, Star } from "lucide-react";

type HeroProps = Pick<
  ContractorSiteData,
  | "businessName"
  | "phone"
  | "city"
  | "heroHeadline"
  | "tagline"
  | "heroCta"
  | "heroImage"
  | "hasEstimateWidget"
  | "yearsInBusiness"
  | "isLicensed"
  | "isInsured"
>;

const ease = [0.32, 0.72, 0, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease, delay: 0.2 },
  },
};

export default function ApexHero({
  businessName,
  phone,
  city,
  heroHeadline,
  tagline,
  heroCta,
  heroImage,
  hasEstimateWidget,
  yearsInBusiness,
  isLicensed,
  isInsured,
}: HeroProps) {
  const headline = heroHeadline || "Built to Protect What Matters Most";
  const subtitle =
    tagline ||
    `${businessName} delivers expert roofing with honest pricing and lasting results. Trusted by homeowners across ${city}.`;
  const ctaText = heroCta || "Get Your Free Estimate";
  const imgSrc =
    heroImage ||
    "https://images.unsplash.com/photo-1635424709870-cdc6e64f0e20?w=900&h=700&q=85&auto=format&fit=crop";

  const trustItems = [
    yearsInBusiness
      ? { icon: Clock, label: `${yearsInBusiness}+ Years` }
      : { icon: Clock, label: "Experienced" },
    isLicensed
      ? { icon: Shield, label: "Licensed" }
      : { icon: Shield, label: "Professional" },
    { icon: Star, label: "5-Star Rated" },
  ];

  return (
    <section
      id="hero"
      style={{
        background: APEX.bg,
        fontFamily: APEX.fontBody,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: APEX.maxWidth,
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
            gridTemplateColumns: "1fr",
            gap: 48,
            paddingTop: 80,
            paddingBottom: 96,
            alignItems: "center",
          }}
          className="md:grid-cols-[1.1fr_1fr]!"
        >
          {/* Left: text content — left-aligned, not centered (taste-skill rule) */}
          <div>
            {/* Eyebrow pill badge */}
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: APEX.borderRadiusFull,
                  background: APEX.cardBg,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  border: `1px solid ${APEX.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  color: APEX.textSecondary,
                  fontFamily: APEX.fontDisplay,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22C55E",
                    animation: "pulse 2s infinite",
                  }}
                />
                Serving {city}
              </span>
            </motion.div>

            {/* Massive headline — tracking-tighter, bold */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: "clamp(38px, 5vw, 64px)",
                fontWeight: 700,
                color: APEX.text,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                marginBottom: 24,
                fontFamily: APEX.fontDisplay,
                maxWidth: 560,
              }}
            >
              {headline}
            </motion.h1>

            {/* Body text — max-width 65ch for readability */}
            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 17,
                color: APEX.textSecondary,
                lineHeight: 1.7,
                maxWidth: "52ch",
                marginBottom: 40,
              }}
            >
              {subtitle}
            </motion.p>

            {/* CTAs — pill buttons with button-in-button arrow */}
            <motion.div
              variants={fadeUp}
              style={{ display: "flex", flexWrap: "wrap", gap: 14 }}
            >
              <a
                href={hasEstimateWidget ? "#estimate" : "#contact"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 20px 14px 24px",
                  borderRadius: APEX.borderRadiusFull,
                  background: APEX.text,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: APEX.fontDisplay,
                  transition: APEX.transitionFast,
                  letterSpacing: "-0.01em",
                }}
                className="hover:scale-[1.02] active:scale-[0.98]"
              >
                {ctaText}
                {/* Button-in-button trailing icon */}
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                  }}
                  className="group-hover:translate-x-0.5"
                >
                  <ArrowRight size={14} strokeWidth={2} />
                </span>
              </a>

              {phone && (
                <a
                  href={`tel:${phone}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 24px",
                    borderRadius: APEX.borderRadiusFull,
                    background: APEX.cardBg,
                    color: APEX.text,
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontFamily: APEX.fontDisplay,
                    border: `1px solid ${APEX.border}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    transition: APEX.transitionFast,
                    letterSpacing: "-0.01em",
                  }}
                  className="hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Phone size={16} strokeWidth={1.5} />
                  {phone}
                </a>
              )}
            </motion.div>

            {/* Trust items — horizontal pills */}
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 36,
              }}
            >
              {trustItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: APEX.textSecondary,
                  }}
                >
                  <item.icon
                    size={16}
                    strokeWidth={1.5}
                    style={{ color: APEX.accent }}
                  />
                  {item.label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: hero image in a double-bezel card (taste-skill pattern) */}
          <motion.div
            variants={scaleIn}
            className="hidden md:block"
          >
            {/* Outer shell — the "tray" */}
            <div
              style={{
                padding: 6,
                borderRadius: APEX.borderRadiusLg,
                background: APEX.cardBg,
                boxShadow: APEX.cardShadow,
                border: `1px solid ${APEX.border}`,
              }}
            >
              {/* Inner core — the image */}
              <div
                style={{
                  position: "relative",
                  borderRadius: "calc(24px - 6px)",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                }}
              >
                <Image
                  src={imgSrc}
                  alt={`${businessName} - professional roofing in ${city}`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                />

                {/* Floating stat card — overlapping the image bottom-left */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={APEX.star}
                        color={APEX.star}
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: APEX.text,
                      fontFamily: APEX.fontDisplay,
                    }}
                  >
                    5.0 Rating
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Pulse animation for the green dot */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </section>
  );
}
