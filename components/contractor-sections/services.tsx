// Services — grid of service cards with editorial section header.
// Uses the services array from the site data.
// Falls back to common roofing services if none are set.

"use client";

import { THEME } from "./theme";
import { motion } from "framer-motion";
import type { ContractorSiteData } from "./types";

type ServicesProps = Pick<ContractorSiteData, "services">;

// Default descriptions for common services
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "Roof Replacement": "Full roof replacement — professionally installed, fully permitted, and backed by manufacturer warranties.",
  "Roof Repair": "From storm damage to everyday wear, we identify the problem and fix it right.",
  "Inspections": "We give you an accurate picture of your roof's condition — no guesswork, no inflated findings.",
  "Gutters": "Gutter cleaning, repair, and installation done right — because proper drainage is the first line of defense against water damage.",
  "Emergency Tarping": "Fast-response emergency tarping to protect your home from further damage when every hour counts.",
  "Storm Damage": "Expert assessment and repair of storm-damaged roofs, from missing shingles to structural issues — documented thoroughly for insurance claims.",
  "Siding": "Vinyl, fiber cement, and wood siding installation and repair. We match existing materials and handle trim, soffit, and fascia so everything looks right together.",
  "Ventilation": "Proper roof ventilation installed and serviced to protect your attic, extend shingle life, and keep energy costs in check.",
};

// Icons for common services (SVG paths)
const SERVICE_ICONS: Record<string, React.ReactElement> = {
  "Roof Replacement": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  "Roof Repair": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  "Inspections": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  "Gutters": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
    </svg>
  ),
  "Storm Damage": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/>
    </svg>
  ),
  "Ventilation": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/>
    </svg>
  ),
  default: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const cardFade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function Services({ services }: ServicesProps) {
  // Fall back to standard roofing services if none set
  const serviceList = services.length > 0
    ? services
    : ["Roof Replacement", "Roof Repair", "Inspections", "Storm Damage", "Gutters", "Emergency Tarping"];

  return (
    <section
      id="services"
      style={{
        padding: THEME.sectionPadding,
        maxWidth: THEME.maxWidth,
        margin: "0 auto",
        fontFamily: THEME.fontBody,
      }}
    >
      {/* Header — editorial style */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 48 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 3, height: 20, background: THEME.accent, borderRadius: 2, flexShrink: 0 }} />
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
            What we do
          </span>
        </div>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 800,
            color: THEME.textPrimary,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontFamily: THEME.fontSerif,
            marginBottom: 10,
          }}
        >
          Our services
        </h2>
        <p style={{ fontSize: 16, color: THEME.textSecondary, maxWidth: 520, lineHeight: 1.65 }}>
          Whether you need a quick repair or a full tear-off, here's what we can help with.
        </p>
      </motion.div>

      {/* Service grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {serviceList.slice(0, 6).map((service, i) => {
          const desc = SERVICE_DESCRIPTIONS[service] || `Professional ${service.toLowerCase()} services delivered with quality craftsmanship and attention to detail.`;
          const icon = SERVICE_ICONS[service] || SERVICE_ICONS.default;

          return (
            <motion.div
              key={service}
              variants={cardFade}
              className="service-card"
              style={{
                background: "#fff",
                border: `1px solid ${THEME.border}`,
                borderRadius: 14,
                padding: "28px 24px",
                transition: "all 0.25s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Icon box + title row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    background: THEME.primary,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: THEME.textPrimary,
                        fontFamily: THEME.fontDisplay,
                        lineHeight: 1.2,
                      }}
                    >
                      {service}
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: THEME.border,
                        fontFamily: THEME.fontDisplay,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 14, color: THEME.textSecondary, lineHeight: 1.7, marginLeft: 56 }}>
                {desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Micro-CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: "center", marginTop: 40 }}
      >
        <a
          href="#contact"
          className="micro-cta-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 999,
            border: `1.5px solid ${THEME.accent}`,
            color: THEME.accent,
            fontWeight: 600,
            fontSize: 15,
            fontFamily: THEME.fontDisplay,
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
        >
          Get my free estimate <span aria-hidden="true">→</span>
        </a>
      </motion.div>
    </section>
  );
}
