// City page component — localized SEO landing page for a service area city.
// Theme-aware, follows the same pattern as service-detail-page.tsx.

"use client";

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
        <nav style={{ fontSize: 13, color: t.textSecondary }}>
          <Link href="/" style={{ color: t.accent, textDecoration: "none" }}>{businessName}</Link>
          <span style={{ margin: "0 8px" }}>/</span>
          <span>{content.cityName}</span>
        </nav>
      </div>

      {/* Hero section */}
      <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "40px 24px 48px" }}>
        <h1 style={{ fontFamily: t.fontDisplay, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: t.text, lineHeight: 1.15, marginBottom: 24 }}>
          {content.headline}
        </h1>

        {/* Checkmarks */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
          {content.checkmarks.map((check) => (
            <div key={check} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: t.borderRadius, fontSize: 14, fontWeight: 500, color: t.text }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              {check}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
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
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", border: `2px solid ${t.border}`, color: t.text, borderRadius: 9999, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.2s" }}
          >
            Call {phone}
          </a>
        </div>

        {/* Content paragraphs */}
        <div style={{ maxWidth: 720 }}>
          {content.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 16, color: t.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Services we offer in this city */}
      {services.length > 0 && (
        <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "0 24px 48px" }}>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 20 }}>
            Our Services in {content.cityName}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {services.map((service) => (
              <div key={service} style={{ padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: t.borderRadius, fontSize: 14, fontWeight: 500, color: t.text }}>
                {service}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other cities we serve */}
      {otherCities.length > 0 && (
        <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "0 24px 64px" }}>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 20 }}>
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
        <p style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 8 }}>
          Ready to protect your {content.cityName} home?
        </p>
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
