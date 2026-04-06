// City page component — localized SEO landing page for a service area city.
// Includes: breadcrumb, hero, content sections, services grid, FAQ accordion,
// cross-links to other cities, and footer CTA.

"use client";

import { useState } from "react";
import { THEME } from "./theme";
import { BLUEPRINT } from "./theme-blueprint";
import { CHALK } from "./theme-chalkboard";
import { CLASSIC } from "./theme-classic";
import { FORGE } from "./theme-forge";
import Link from "next/link";
import type { CityPageContent } from "@/lib/city-page-content";
import { cityToSlug } from "@/lib/city-page-content";

interface Props {
  content: CityPageContent;
  businessName: string;
  phone: string;
  mainCity: string;
  state: string;
  hasEstimateWidget: boolean;
  contractorId: string;
  template: string;
  siteSlug: string;
  otherCities: string[];
  services: string[];
}

function getTheme(template: string) {
  if (template === "chalkboard" || template === "bold_confident") {
    return { bg: CHALK.bg, bgCard: CHALK.bgLight, text: CHALK.text, textSecondary: CHALK.textMuted, accent: CHALK.accent, accentHover: CHALK.accentHover, border: CHALK.border, fontDisplay: CHALK.fontDisplay, fontBody: CHALK.fontBody, maxWidth: CHALK.maxWidth, borderRadius: CHALK.borderRadius, isDark: true };
  }
  if (template === "blueprint" || template === "warm_trustworthy") {
    return { bg: BLUEPRINT.bg, bgCard: BLUEPRINT.bgWhite, text: BLUEPRINT.text, textSecondary: BLUEPRINT.textSecondary, accent: BLUEPRINT.accent, accentHover: BLUEPRINT.accentHover, border: BLUEPRINT.border, fontDisplay: BLUEPRINT.fontDisplay, fontBody: BLUEPRINT.fontBody, maxWidth: BLUEPRINT.maxWidth, borderRadius: BLUEPRINT.borderRadius, isDark: false };
  }
  if (template === "classic" || template === "clean_professional") {
    return { bg: CLASSIC.bgAlt, bgCard: CLASSIC.bg, text: CLASSIC.text, textSecondary: CLASSIC.textSecondary, accent: CLASSIC.accent, accentHover: CLASSIC.accentHover, border: CLASSIC.border, fontDisplay: CLASSIC.fontDisplay, fontBody: CLASSIC.fontBody, maxWidth: CLASSIC.maxWidth, borderRadius: CLASSIC.borderRadiusLg, isDark: false };
  }
  if (template === "forge" || template === "bold_dark") {
    return { bg: FORGE.bgAlt, bgCard: FORGE.bgCard, text: FORGE.text, textSecondary: FORGE.textMuted, accent: FORGE.accent, accentHover: FORGE.accentHover, border: FORGE.border, fontDisplay: FORGE.fontDisplay, fontBody: FORGE.fontBody, maxWidth: FORGE.maxWidth, borderRadius: FORGE.borderRadiusLg, isDark: true };
  }
  return { bg: THEME.bgWarm, bgCard: THEME.bgWhite, text: THEME.textPrimary, textSecondary: THEME.textSecondary, accent: THEME.accent, accentHover: THEME.accentHover, border: THEME.border, fontDisplay: THEME.fontDisplay, fontBody: THEME.fontBody, maxWidth: THEME.maxWidth, borderRadius: THEME.borderRadius, isDark: false };
}

function FaqAccordion({ faqs, theme }: { faqs: CityPageContent["faqs"]; theme: ReturnType<typeof getTheme> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            style={{
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "20px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                fontFamily: theme.fontDisplay,
                fontSize: 16,
                fontWeight: 600,
                color: theme.text,
              }}
            >
              {faq.question}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.textSecondary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {/* Keep answer in DOM for SEO crawling */}
            <div
              style={{
                overflow: "hidden",
                maxHeight: isOpen ? 500 : 0,
                opacity: isOpen ? 1 : 0,
                transition: "max-height 0.3s ease, opacity 0.2s ease",
              }}
            >
              <p style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 1.7, paddingBottom: 20 }}>
                {faq.answer}
              </p>
            </div>
            {/* Hidden SEO text when collapsed */}
            {!isOpen && (
              <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CityPageComponent({
  content,
  businessName,
  phone,
  mainCity,
  state,
  hasEstimateWidget,
  template,
  siteSlug,
  otherCities,
  services,
}: Props) {
  const t = getTheme(template);
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.fontBody }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "24px 24px 0" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: t.textSecondary }}>
          <Link href="/" style={{ color: t.accent, textDecoration: "none" }}>{businessName}</Link>
          <span style={{ margin: "0 8px" }}>/</span>
          <span>{content.cityName}</span>
        </nav>
      </div>

      {/* Hero section */}
      <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "40px 24px 48px" }}>
        <h1 style={{ fontFamily: t.fontDisplay, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: t.text, lineHeight: 1.15, marginBottom: 16 }}>
          {content.headline}
        </h1>

        <p style={{ fontSize: 17, color: t.textSecondary, lineHeight: 1.65, maxWidth: 640, marginBottom: 28 }}>
          {content.intro}
        </p>

        {/* Checkmarks */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
          {content.checkmarks.map((check) => (
            <div key={check} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: t.borderRadius, fontSize: 14, fontWeight: 500, color: t.text }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              {check}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href={hasEstimateWidget ? "#estimate" : `tel:${phoneClean}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: t.accent, color: "#fff", borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = t.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = t.accent)}
          >
            Get Free Estimate in {content.cityName}
          </a>
          <a
            href={`tel:${phoneClean}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", border: `2px solid ${t.border}`, color: t.text, borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
          >
            Call {phone}
          </a>
        </div>
      </section>

      {/* Content sections — each with its own H2 for SEO */}
      <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "0 24px 48px" }}>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 12, lineHeight: 1.25 }}>
              {section.heading}
            </h2>
            <p style={{ fontSize: 16, color: t.textSecondary, lineHeight: 1.7, maxWidth: 720 }}>
              {section.body}
            </p>
          </div>
        ))}
      </section>

      {/* Services grid */}
      {services.length > 0 && (
        <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "0 24px 48px" }}>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 20 }}>
            Our Services in {content.cityName}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {services.map((service) => (
              <div key={service} style={{ padding: "18px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: t.borderRadius, fontSize: 15, fontWeight: 600, color: t.text, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                {service}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ section */}
      {content.faqs.length > 0 && (
        <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "0 24px 48px" }}>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 8 }}>
            Common Questions About Roofing in {content.cityName}
          </h2>
          <p style={{ fontSize: 15, color: t.textSecondary, marginBottom: 24 }}>
            Answers to what {content.cityName} homeowners ask us most.
          </p>
          <FaqAccordion faqs={content.faqs} theme={t} />
        </section>
      )}

      {/* Other cities we serve */}
      {otherCities.length > 0 && (
        <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "0 24px 56px" }}>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 16 }}>
            Also Serving Nearby Cities
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {otherCities.map((city) => (
              <Link
                key={city}
                href={`/${cityToSlug(city)}`}
                style={{ padding: "8px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 9999, fontSize: 13, fontWeight: 500, color: t.accent, textDecoration: "none", transition: "all 0.2s" }}
              >
                {city}, {state}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section style={{ background: t.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 8 }}>
          Ready to protect your {content.cityName} home?
        </h2>
        <p style={{ fontSize: 15, color: t.textSecondary, marginBottom: 24 }}>
          Get a free, no-obligation estimate from {businessName}.
        </p>
        <a
          href={hasEstimateWidget ? "#estimate" : `tel:${phoneClean}`}
          style={{ display: "inline-flex", padding: "14px 36px", background: t.accent, color: "#fff", borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
        >
          Get Your Free Estimate
        </a>
      </section>
    </div>
  );
}
