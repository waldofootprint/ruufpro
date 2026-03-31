// Services listing page component — themed grid of service cards.
// Each card links to its own dedicated service page.

"use client";

import { THEME } from "./theme";
import { BLUEPRINT } from "./theme-blueprint";
import { CHALK } from "./theme-chalkboard";
import { motion } from "framer-motion";
import Link from "next/link";

interface ServiceCard {
  slug: string;
  name: string;
  headline: string;
  excerpt: string;
  subServices: string[];
}

interface Props {
  services: ServiceCard[];
  businessName: string;
  phone: string;
  city: string;
  state: string;
  hasEstimateWidget: boolean;
  template: string;
  siteSlug: string;
}

// Theme resolver
function getTheme(template: string) {
  if (template === "chalkboard" || template === "bold_confident") {
    return {
      bg: CHALK.bg,
      bgCard: CHALK.bgLight,
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
  // Modern Clean default
  return {
    bg: THEME.bgWarm,
    bgCard: THEME.bgWhite,
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

const SERVICE_ICONS: Record<string, string> = {
  "roof-replacement": "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  "roof-repair": "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  "roof-installation": "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M12 2v20",
  "roof-inspection": "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  "roof-maintenance": "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  "storm-damage": "M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9 M13 11l-4 6h6l-4 6",
  "emergency-tarping": "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  "gutters": "M12 2.69l5.66 5.66a8 8 0 11-11.31 0z",
  "siding": "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18",
  "ventilation": "M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2",
  "soffit-fascia": "M3 9l9-7 9 7 M4 10v10h16V10 M9 20v-6h6v6",
};

function ServiceIcon({ slug, color }: { slug: string; color: string }) {
  const paths = SERVICE_ICONS[slug] || "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.split(" M").map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const cardFade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function ServicesPageContent({
  services,
  businessName,
  phone,
  city,
  state,
  hasEstimateWidget,
  template,
  siteSlug,
}: Props) {
  const t = getTheme(template);
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.fontBody }}>
      {/* Simple nav bar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: t.isDark ? "rgba(42,45,42,0.95)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${t.border}`,
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            maxWidth: t.maxWidth,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              fontFamily: t.fontDisplay,
              fontWeight: 800,
              fontSize: 17,
              color: t.text,
              textDecoration: "none",
            }}
          >
            {businessName}
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href="/"
              style={{ fontSize: 14, fontWeight: 500, color: t.textSecondary, textDecoration: "none" }}
            >
              Home
            </a>
            <a
              href={`tel:${phoneClean}`}
              style={{ fontSize: 14, fontWeight: 600, color: t.text, textDecoration: "none" }}
              className="hidden sm:inline!"
            >
              {phone}
            </a>
            <a
              href={hasEstimateWidget ? "/#estimate" : "/#contact"}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: t.isDark ? t.bg : "#fff",
                background: t.accent,
                padding: "8px 20px",
                borderRadius: 9999,
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = t.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = t.accent)}
            >
              Free Estimate
            </a>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section
        style={{
          maxWidth: t.maxWidth,
          margin: "0 auto",
          padding: t.sectionPadding,
          paddingBottom: 40,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <a
              href="/"
              style={{ fontSize: 13, color: t.textSecondary, textDecoration: "none" }}
            >
              Home
            </a>
            <span style={{ fontSize: 13, color: t.textSecondary }}>/</span>
            <span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>Services</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: t.text,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontFamily: t.fontDisplay,
              marginBottom: 16,
            }}
          >
            Our Roofing Services
          </h1>
          <p
            style={{
              fontSize: 18,
              color: t.textSecondary,
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            {businessName} provides professional roofing services throughout {city}, {state} and the surrounding area.
            From routine maintenance to complete roof replacements, we have you covered.
          </p>
        </motion.div>
      </section>

      {/* Services grid */}
      <section
        style={{
          maxWidth: t.maxWidth,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {services.map((svc) => (
            <motion.div key={svc.slug} variants={cardFade}>
              <Link
                href={`/services/${svc.slug}`}
                style={{ textDecoration: "none", display: "block", height: "100%" }}
              >
                <div
                  style={{
                    background: t.bgCard,
                    border: `1px solid ${t.border}`,
                    borderRadius: t.borderRadius,
                    padding: "28px 24px",
                    height: "100%",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = t.accent;
                    e.currentTarget.style.boxShadow = t.isDark
                      ? "0 8px 30px rgba(0,0,0,0.3)"
                      : "0 8px 30px rgba(0,0,0,0.06)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background: t.isDark ? CHALK.accentSubtle : "rgba(30,58,95,0.06)",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ServiceIcon slug={svc.slug} color={t.accent} />
                    </div>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: t.text,
                        fontFamily: t.fontDisplay,
                        lineHeight: 1.2,
                        margin: 0,
                      }}
                    >
                      {svc.name}
                    </h2>
                  </div>

                  {/* Excerpt */}
                  <p
                    style={{
                      fontSize: 14,
                      color: t.textSecondary,
                      lineHeight: 1.7,
                      marginBottom: 16,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {svc.excerpt}
                  </p>

                  {/* Sub-services tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {svc.subServices.slice(0, 4).map((sub) => (
                      <span
                        key={sub}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: t.tagText,
                          background: t.tagBg,
                          padding: "4px 10px",
                          borderRadius: 6,
                        }}
                      >
                        {sub}
                      </span>
                    ))}
                    {svc.subServices.length > 4 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: t.textSecondary,
                          padding: "4px 10px",
                        }}
                      >
                        +{svc.subServices.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Learn more link */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: t.accent,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Learn more
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          background: t.isDark ? CHALK.bgAlt : "rgba(30,58,95,0.03)",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 800,
              color: t.text,
              fontFamily: t.fontDisplay,
              marginBottom: 12,
              lineHeight: 1.15,
            }}
          >
            Not sure what you need?
          </h2>
          <p style={{ fontSize: 16, color: t.textSecondary, lineHeight: 1.6, marginBottom: 28 }}>
            Tell us what's going on with your roof and we'll recommend the right service. No pressure, no upselling.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={hasEstimateWidget ? "/#estimate" : "/#contact"}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: t.isDark ? t.bg : "#fff",
                background: t.accent,
                padding: "14px 32px",
                borderRadius: 9999,
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = t.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = t.accent)}
            >
              Get a Free Estimate
            </a>
            <a
              href={`tel:${phoneClean}`}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: t.text,
                background: "transparent",
                border: `2px solid ${t.border}`,
                padding: "12px 32px",
                borderRadius: 9999,
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = t.border)}
            >
              Call {phone}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px", textAlign: "center", borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 13, color: t.textSecondary }}>
          &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
