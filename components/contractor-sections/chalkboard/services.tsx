"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";
import { getServiceContent } from "@/lib/service-page-content";

type Props = Pick<ContractorSiteData, "services" | "slug">;

const DESCRIPTIONS: Record<string, string> = {
  "Roof Replacement": "Full tear-off, new underlayment, flashing, drip edge, and shingle installation. We handle the permit, the dumpster, and the cleanup.",
  "Roof Repair": "Leaks, missing shingles, cracked flashing — we diagnose the actual problem and fix it right the first time. No upselling you a replacement when a repair will do.",
  "Inspections": "We check your decking, underlayment, flashing, vents, gutters, and shingle condition. You get a written report with photos and honest recommendations.",
  "Roof Inspections": "Thorough inspection of your decking, underlayment, flashing, vents, and shingles. Written report with photos and honest recommendations.",
  "Gutters": "Seamless aluminum gutter installation, downspout routing, gutter guards, and repairs. Properly sized and pitched to protect your foundation.",
  "Gutter Installation": "Seamless aluminum gutters, downspout routing, gutter guards, and repairs. Properly sized and pitched to handle your roof's water volume.",
  "Emergency Tarping": "Storm hit? We respond fast with emergency tarping to stop the damage from getting worse. Available 24/7.",
  "Storm Damage": "Hail, wind, fallen trees — we handle the full restoration and work directly with your insurance adjuster to get your roof back to pre-storm condition.",
  "Storm Damage Restoration": "Hail, wind, fallen trees — full restoration with insurance claim support. We document damage, file paperwork, and restore your roof.",
  "Insurance Claims": "We work directly with your insurance adjuster, document all damage with photos, and handle the claim paperwork so you don't have to.",
  "Siding": "Vinyl, fiber cement, and wood siding installation and repair. We match existing materials and handle trim, soffit, and fascia.",
  "Siding Repair": "Vinyl, fiber cement, and wood siding repair. We match existing materials and handle trim, soffit, and fascia.",
  "Ventilation": "Ridge vents, soffit vents, powered attic fans, and intake/exhaust balancing. Proper ventilation extends your roof's life and cuts energy bills.",
  "Metal Roofing": "Standing seam and corrugated metal roof installation. Lasts 50+ years, handles high winds, and cuts cooling costs.",
  "Flat Roofing": "TPO, EPDM, and modified bitumen flat roof installation and repair. Properly sloped for drainage with sealed seams.",
  "Attic Insulation": "Blown-in and batt insulation installation. Keeps your home comfortable year-round and reduces energy costs.",
};

export default function ChalkServices({ services, slug }: Props) {
  const list = services.length > 0 ? services : ["Roof Replacement", "Roof Repair", "Inspections", "Gutters", "Storm Damage", "Ventilation"];

  return (
    <section
      id="services"
      style={{
        padding: CHALK.sectionPadding,
        maxWidth: CHALK.maxWidth,
        margin: "0 auto",
        fontFamily: CHALK.fontBody,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: CHALK.accent, marginBottom: 12 }}>Services</p>
        <h2 style={{ fontFamily: CHALK.fontDisplay, fontSize: 36, color: "#fff", marginBottom: 12 }}>What We Do</h2>
        <p style={{ fontSize: 17, color: CHALK.textMuted, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Whether you need a quick repair or a complete roof replacement, we&apos;ve got you covered.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {list.slice(0, 6).map((svc) => {
          const desc = DESCRIPTIONS[svc] || `Professional ${svc.toLowerCase()} services delivered with quality craftsmanship and attention to detail.`;
          const entry = getServiceContent(svc);
          const href = entry && slug ? `/site/${slug}/services/${entry.slug}` : "#contact";

          return (
            <a
              key={svc}
              href={href}
              style={{
                display: "block",
                background: CHALK.bgLight,
                border: `1px solid ${CHALK.border}`,
                borderRadius: CHALK.borderRadius,
                padding: "28px 28px 24px",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = CHALK.accent;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = CHALK.border;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <h3 style={{ fontFamily: CHALK.fontDisplay, fontSize: 20, color: CHALK.text, marginBottom: 8 }}>
                {svc}
              </h3>
              <p style={{ fontSize: 15, color: CHALK.textMuted, lineHeight: 1.65, marginBottom: 16 }}>
                {desc}
              </p>
              <span style={{ fontSize: 14, color: CHALK.accent, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
                Learn more
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </a>
          );
        })}
      </div>

      <p style={{ textAlign: "center", fontSize: 15, color: CHALK.textFaint, marginTop: 36, lineHeight: 1.6 }}>
        Not sure what you need?{" "}
        <a href="#contact" style={{ color: CHALK.accent, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Tell us what&apos;s going on and we&apos;ll figure it out together
        </a>
      </p>
    </section>
  );
}
