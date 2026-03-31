"use client";

// FAQ section — auto-generated from contractor data.
// One component for all 3 templates, styled via theme prop.
// All answers are in the DOM regardless of open/close state
// so Google can crawl the full content.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { THEME } from "./theme";
import { BLUEPRINT } from "./theme-blueprint";
import { CHALK } from "./theme-chalkboard";
import { generateFaqItems, type FaqInput } from "@/lib/faq-data";
import type { ContractorSiteData } from "./types";

type FaqProps = Pick<
  ContractorSiteData,
  | "businessName"
  | "city"
  | "state"
  | "services"
  | "serviceAreaCities"
  | "offersFinancing"
  | "isLicensed"
  | "isInsured"
  | "yearsInBusiness"
  | "phone"
> & {
  theme: "modern-clean" | "blueprint" | "chalkboard";
};

const THEMES = {
  "modern-clean": {
    colors: THEME,
    bg: THEME.bgWarm,
    cardBg: THEME.bgWhite,
    text: THEME.textPrimary,
    textSecondary: THEME.textSecondary,
    accent: THEME.accent,
    border: THEME.border,
    kicker: THEME.accent,
    font: THEME.fontBody,
    fontDisplay: THEME.fontDisplay,
    sectionPadding: THEME.sectionPadding,
    maxWidth: THEME.maxWidth,
    radius: "12px",
  },
  blueprint: {
    colors: BLUEPRINT,
    bg: BLUEPRINT.bgAlt,
    cardBg: BLUEPRINT.bgWhite,
    text: BLUEPRINT.text,
    textSecondary: BLUEPRINT.textSecondary,
    accent: BLUEPRINT.accent,
    border: BLUEPRINT.border,
    kicker: BLUEPRINT.accent,
    font: BLUEPRINT.fontBody,
    fontDisplay: BLUEPRINT.fontDisplay,
    sectionPadding: BLUEPRINT.sectionPadding,
    maxWidth: BLUEPRINT.maxWidth,
    radius: BLUEPRINT.borderRadius,
  },
  chalkboard: {
    colors: CHALK,
    bg: CHALK.bgAlt,
    cardBg: CHALK.bgLight,
    text: CHALK.text,
    textSecondary: CHALK.textMuted,
    accent: CHALK.accent,
    border: CHALK.border,
    kicker: CHALK.accent,
    font: CHALK.fontBody,
    fontDisplay: CHALK.fontDisplay,
    sectionPadding: CHALK.sectionPadding,
    maxWidth: CHALK.maxWidth,
    radius: CHALK.borderRadius,
  },
};

export default function FAQ({
  businessName,
  city,
  state,
  services,
  serviceAreaCities,
  offersFinancing,
  isLicensed,
  isInsured,
  yearsInBusiness,
  phone,
  theme,
}: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = THEMES[theme];

  const faqInput: FaqInput = {
    businessName,
    city,
    state,
    services,
    serviceAreaCities,
    offersFinancing,
    isLicensed,
    isInsured,
    yearsInBusiness,
  };
  const faqs = generateFaqItems(faqInput);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      id="faq"
      style={{
        padding: t.sectionPadding,
        background: t.bg,
        fontFamily: t.font,
      }}
    >
      <div style={{ maxWidth: t.maxWidth, margin: "0 auto" }}>
        {/* Kicker + Heading */}
        {theme === "modern-clean" && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: t.kicker,
              marginBottom: 8,
              paddingLeft: 16,
              borderLeft: `3px solid ${t.kicker}`,
            }}
          >
            FAQ
          </p>
        )}
        {theme === "chalkboard" && (
          <p style={{ fontSize: 20, color: t.kicker, marginBottom: 8 }}>
            faq
          </p>
        )}
        {theme === "blueprint" && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: t.kicker,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              fontFamily: t.fontDisplay,
            }}
          >
            FAQ
          </p>
        )}

        <h2
          style={{
            fontFamily: t.fontDisplay,
            fontSize: theme === "chalkboard" ? 32 : "clamp(24px, 4vw, 34px)",
            fontWeight: 800,
            color: t.text,
            lineHeight: 1.15,
            letterSpacing: theme === "modern-clean" ? "-0.02em" : undefined,
            marginBottom: 32,
          }}
        >
          Common questions from {city} homeowners
        </h2>

        {/* FAQ Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  background: t.cardBg,
                  borderRadius: t.radius,
                  border: `1px solid ${t.border}`,
                  overflow: "hidden",
                  transition: "box-shadow 0.2s ease",
                  boxShadow: isOpen ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 24px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: t.fontDisplay,
                    fontSize: 16,
                    fontWeight: 600,
                    color: t.text,
                    lineHeight: 1.4,
                    gap: 16,
                  }}
                >
                  {faq.question}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                  >
                    <ChevronDown size={20} color={t.accent} />
                  </motion.span>
                </button>

                {/* Answer — always in DOM for SEO, visually toggled */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        style={{
                          padding: "0 24px 18px",
                          margin: 0,
                          fontSize: 15,
                          lineHeight: 1.7,
                          color: t.textSecondary,
                          fontFamily: t.font,
                        }}
                      >
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hidden SEO text — ensures Google sees all answers even when collapsed */}
                {!isOpen && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: "hidden",
                      clip: "rect(0,0,0,0)",
                      whiteSpace: "nowrap",
                      borderWidth: 0,
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
