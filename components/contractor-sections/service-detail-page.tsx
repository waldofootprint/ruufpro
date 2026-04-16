// Service detail page component — deep content for a single service.
// Themed to match the contractor's template.

"use client";

import { THEME } from "./theme";
import { BLUEPRINT } from "./theme-blueprint";
import { CHALK } from "./theme-chalkboard";
import { CLASSIC } from "./theme-classic";
import { FORGE } from "./theme-forge";
import { motion } from "framer-motion";
import Link from "next/link";
import Nav from "./nav";

interface RelatedService {
  slug: string;
  name: string;
  headline: string;
}

interface Props {
  serviceName: string;
  serviceSlug: string;
  headline: string;
  paragraphs: string[];
  subServices: string[];
  relatedServices: RelatedService[];
  businessName: string;
  phone: string;
  city: string;
  state: string;
  hasEstimateWidget: boolean;
  template: string;
  siteSlug: string;
  services?: string[];
  serviceAreaCities?: string[];
}

function getTheme(template: string) {
  if (template === "chalkboard" || template === "bold_confident") {
    return {
      bg: CHALK.bg,
      bgCard: CHALK.bgLight,
      bgAlt: CHALK.bgAlt,
      text: CHALK.text,
      textSecondary: CHALK.textMuted,
      accent: CHALK.accent,
      accentHover: CHALK.accentHover,
      border: CHALK.border,
      fontDisplay: CHALK.fontDisplay,
      fontBody: CHALK.fontBody,
      maxWidth: CHALK.maxWidth,
      borderRadius: CHALK.borderRadius,
      sectionPadding: CHALK.sectionPadding,
      tagBg: CHALK.accentSubtle,
      tagText: CHALK.accent,
      isDark: true,
    };
  }
  if (template === "blueprint" || template === "warm_trustworthy") {
    return {
      bg: BLUEPRINT.bg,
      bgCard: BLUEPRINT.bgWhite,
      bgAlt: BLUEPRINT.bgAlt,
      text: BLUEPRINT.text,
      textSecondary: BLUEPRINT.textSecondary,
      accent: BLUEPRINT.accent,
      accentHover: BLUEPRINT.accentHover,
      border: BLUEPRINT.border,
      fontDisplay: BLUEPRINT.fontDisplay,
      fontBody: BLUEPRINT.fontBody,
      maxWidth: BLUEPRINT.maxWidth,
      borderRadius: BLUEPRINT.borderRadius,
      sectionPadding: BLUEPRINT.sectionPadding,
      tagBg: BLUEPRINT.accentLight,
      tagText: BLUEPRINT.accent,
      isDark: false,
    };
  }
  if (template === "classic" || template === "clean_professional") {
    return {
      bg: CLASSIC.bgAlt,
      bgCard: CLASSIC.bg,
      bgAlt: CLASSIC.borderLight,
      text: CLASSIC.text,
      textSecondary: CLASSIC.textSecondary,
      accent: CLASSIC.accent,
      accentHover: CLASSIC.accentHover,
      border: CLASSIC.border,
      fontDisplay: CLASSIC.fontDisplay,
      fontBody: CLASSIC.fontBody,
      maxWidth: CLASSIC.maxWidth,
      borderRadius: CLASSIC.borderRadiusLg,
      sectionPadding: CLASSIC.sectionPadding,
      tagBg: CLASSIC.accentLight,
      tagText: CLASSIC.text,
      isDark: false,
    };
  }
  if (template === "forge" || template === "bold_dark") {
    return {
      bg: FORGE.bgAlt,
      bgCard: FORGE.bgCard,
      bgAlt: FORGE.bg,
      text: FORGE.text,
      textSecondary: FORGE.textMuted,
      accent: FORGE.accent,
      accentHover: FORGE.accentHover,
      border: FORGE.border,
      fontDisplay: FORGE.fontDisplay,
      fontBody: FORGE.fontBody,
      maxWidth: FORGE.maxWidth,
      borderRadius: FORGE.borderRadiusLg,
      sectionPadding: FORGE.sectionPadding,
      tagBg: FORGE.accentLight,
      tagText: FORGE.accent,
      isDark: true,
    };
  }
  return {
    bg: THEME.bgWarm,
    bgCard: THEME.bgWhite,
    bgAlt: "#EFF1F3",
    text: THEME.textPrimary,
    textSecondary: THEME.textSecondary,
    accent: THEME.accent,
    accentHover: THEME.accentHover,
    border: THEME.border,
    fontDisplay: THEME.fontDisplay,
    fontBody: THEME.fontBody,
    maxWidth: THEME.maxWidth,
    borderRadius: THEME.borderRadius,
    sectionPadding: THEME.sectionPadding,
    tagBg: "rgba(232,114,12,0.08)",
    tagText: THEME.accent,
    isDark: false,
  };
}

export default function ServiceDetailContent({
  serviceName,
  serviceSlug,
  headline,
  paragraphs,
  subServices,
  relatedServices,
  businessName,
  phone,
  city,
  state,
  hasEstimateWidget,
  template,
  siteSlug,
  services = [],
  serviceAreaCities = [],
}: Props) {
  const t = getTheme(template);
  const phoneClean = phone.replace(/\D/g, "");
  const base = siteSlug === "demo" ? "/demo" : `/site/${siteSlug}`;

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.fontBody }}>
      <Nav
        businessName={businessName}
        phone={phone}
        hasEstimateWidget={hasEstimateWidget}
        services={services}
        serviceAreaCities={serviceAreaCities}
        city={city}
        basePath={base}
      />

      {/* Hero / header */}
      <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: t.sectionPadding, paddingBottom: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            <a href={`${base}`} style={{ fontSize: 13, color: t.textSecondary, textDecoration: "none" }}>Home</a>
            <span style={{ fontSize: 13, color: t.textSecondary }}>/</span>
            <Link href={`${base}/services`} style={{ fontSize: 13, color: t.textSecondary, textDecoration: "none" }}>Services</Link>
            <span style={{ fontSize: 13, color: t.textSecondary }}>/</span>
            <span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>{serviceName}</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: t.text,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontFamily: t.fontDisplay,
              marginBottom: 0,
            }}
          >
            {headline}
          </h1>
        </motion.div>
      </section>

      {/* Main content — two column on desktop */}
      <section style={{ maxWidth: t.maxWidth, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 48,
          }}
          className="md:grid-cols-[1fr_320px]!"
        >
          {/* Left: main content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {paragraphs.map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 16,
                  color: t.textSecondary,
                  lineHeight: 1.8,
                  marginBottom: 24,
                }}
              >
                {para}
              </p>
            ))}

            {/* Sub-services section */}
            <div style={{ marginTop: 40 }}>
              <h2
                style={{
                  fontSize: "clamp(22px, 3vw, 28px)",
                  fontWeight: 700,
                  color: t.text,
                  fontFamily: t.fontDisplay,
                  marginBottom: 20,
                  lineHeight: 1.2,
                }}
              >
                {serviceName} Services We Offer
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {subServices.map((sub) => (
                  <div
                    key={sub}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 16px",
                      background: t.bgCard,
                      border: `1px solid ${t.border}`,
                      borderRadius: 10,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={t.accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: CTA sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: t.borderRadius,
                padding: 28,
                position: "sticky",
                top: 80,
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: t.text,
                  fontFamily: t.fontDisplay,
                  marginBottom: 12,
                  lineHeight: 1.2,
                }}
              >
                Need {serviceName.toLowerCase()}?
              </h3>
              <p style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>
                Get a free, no-obligation estimate from {businessName}. We serve {city} and the surrounding {state} area.
              </p>
              <a
                href={hasEstimateWidget ? `/site/${siteSlug}#estimate` : `/site/${siteSlug}#contact`}
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.isDark ? t.bg : "#fff",
                  background: t.accent,
                  padding: "14px 24px",
                  borderRadius: 9999,
                  textDecoration: "none",
                  transition: "background 0.2s",
                  marginBottom: 12,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = t.accent)}
              >
                Get a Free Estimate
              </a>
              <a
                href={`tel:${phoneClean}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.text,
                  border: `2px solid ${t.border}`,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  textDecoration: "none",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = t.border)}
              >
                Call {phone}
              </a>

              {/* Trust signals */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
                {[
                  "Free estimates, no obligation",
                  "Licensed & insured",
                  "Serving " + city + " & surrounding areas",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 13, color: t.textSecondary }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related services */}
      {relatedServices.length > 0 && (
        <section
          style={{
            background: t.isDark ? CHALK.bgAlt : "rgba(30,58,95,0.03)",
            padding: "60px 24px",
          }}
        >
          <div style={{ maxWidth: t.maxWidth, margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "clamp(22px, 3vw, 28px)",
                fontWeight: 700,
                color: t.text,
                fontFamily: t.fontDisplay,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              Other Services
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {relatedServices.map((svc) => (
                <Link
                  key={svc.slug}
                  href={`${base}/services/${svc.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: t.bgCard,
                      border: `1px solid ${t.border}`,
                      borderRadius: t.borderRadius,
                      padding: "20px 24px",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = t.accent;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = t.border;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, fontFamily: t.fontDisplay, marginBottom: 6 }}>
                      {svc.name}
                    </h3>
                    <p style={{ fontSize: 13, color: t.textSecondary, margin: 0 }}>
                      {svc.headline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link
                href={`${base}/services`}
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.accent,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                View all services &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ padding: "24px", textAlign: "center", borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 13, color: t.textSecondary }}>
          &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
