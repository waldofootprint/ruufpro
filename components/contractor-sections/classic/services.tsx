"use client";

// Classic Services — clean grid of service cards with minimal styling.
// Uppercase section label, large heading, cards with subtle borders.

import { CLASSIC } from "../theme-classic";
import { motion } from "framer-motion";
import { getServiceContent } from "@/lib/service-page-content";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "Roof Replacement": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/></svg>,
  "Roof Repair": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  "Storm Damage Repair": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>,
  "Roof Inspection": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  "Gutter Services": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  "Siding Installation": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>,
  "Commercial Roofing": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>,
};

function getIcon(service: string) {
  return SERVICE_ICONS[service] || (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  );
}

interface ServicesProps {
  services: string[];
}

export default function ClassicServices({ services }: ServicesProps) {
  return (
    <section
      id="services"
      style={{
        background: CLASSIC.bgAlt,
        padding: CLASSIC.sectionPadding,
        fontFamily: CLASSIC.fontBody,
      }}
    >
      <div style={{ maxWidth: CLASSIC.maxWidth, margin: "0 auto" }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 48 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: CLASSIC.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 12,
              fontFamily: CLASSIC.fontDisplay,
            }}
          >
            OUR SERVICES
          </span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              color: CLASSIC.text,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              fontFamily: CLASSIC.fontDisplay,
            }}
          >
            What We Do
          </h2>
        </motion.div>

        {/* Service cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {services.map((service, i) => {
            const entry = getServiceContent(service);
            const href = entry ? `/services/${entry.slug}` : "#contact";

            return (
              <motion.a
                key={service}
                href={href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{
                  display: "block",
                  padding: 28,
                  background: CLASSIC.bg,
                  border: `1px solid ${CLASSIC.border}`,
                  borderRadius: CLASSIC.borderRadiusLg,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = CLASSIC.accent;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = CLASSIC.border;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ color: CLASSIC.textMuted, marginBottom: 16 }}>
                  {getIcon(service)}
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: CLASSIC.text,
                    marginBottom: 8,
                    fontFamily: CLASSIC.fontDisplay,
                  }}
                >
                  {service}
                </h3>
                <span
                  style={{
                    fontSize: 13,
                    color: CLASSIC.textMuted,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  Learn more &rarr;
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
