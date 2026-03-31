"use client";

import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "services">;

const ICONS: Record<string, string> = {
  "Roof Replacement": "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
  "Roof Repair": "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  "Roof Inspection": "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  "Storm Damage": "M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9",
  "Gutter Installation": "M12 22V8M5 12H2a10 10 0 0020 0h-3",
};

const DESCRIPTIONS: Record<string, string> = {
  "Roof Replacement": "Full tear-off down to the deck, new underlayment, flashing, drip edge, and shingle installation. We handle the permit, the dumpster, and the cleanup.",
  "Roof Repair": "Leaks, missing shingles, cracked flashing, pipe boot failures — we diagnose the actual problem and fix it right. No upselling you a replacement when a repair will do.",
  "Roof Inspection": "We check your decking, underlayment, flashing, vents, gutters, and shingle condition. Written report with photos and honest recommendations.",
  "Storm Damage": "Hail, wind, fallen trees — we handle the full restoration and work directly with your insurance adjuster. Documentation, claim paperwork, and rebuild.",
  "Gutter Installation": "Seamless aluminum gutter installation, downspout routing, gutter guards, and repairs. Properly sized and pitched for your roof's water volume.",
};

const DEFAULTS = ["Roof Replacement", "Roof Repair", "Roof Inspection", "Storm Damage", "Gutter Installation"];

export default function BlueprintServices({ services }: Props) {
  const items = services.length > 0 ? services.slice(0, 6) : DEFAULTS;

  return (
    <section id="services" style={{ background: BLUEPRINT.bgWhite, padding: BLUEPRINT.sectionPadding, fontFamily: BLUEPRINT.fontBody }}>
      <div style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: BLUEPRINT.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: BLUEPRINT.fontDisplay }}>
            What We Do
          </p>
          <h2 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: BLUEPRINT.text, marginBottom: 12 }}>
            Our Services
          </h2>
          <p style={{ fontSize: 16, color: BLUEPRINT.textSecondary, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Whether you need a quick repair or a full tear-off, here's what we can help with.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="grid-cols-1! sm:grid-cols-2! md:grid-cols-3!">
          {items.map((service) => (
            <div
              key={service}
              style={{
                background: BLUEPRINT.bgWhite,
                borderRadius: 14,
                padding: 28,
                border: `1px solid ${BLUEPRINT.border}`,
                transition: "all 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BLUEPRINT.accent;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(74,111,165,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BLUEPRINT.border;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: BLUEPRINT.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUEPRINT.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[service] || ICONS["Roof Replacement"]} />
                </svg>
              </div>
              <h3 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: 17, fontWeight: 700, color: BLUEPRINT.text, marginBottom: 6 }}>
                {service}
              </h3>
              <p style={{ fontSize: 14, color: BLUEPRINT.textSecondary, lineHeight: 1.5 }}>
                {DESCRIPTIONS[service] || `Professional ${service.toLowerCase()} services with quality materials and expert craftsmanship.`}
              </p>
            </div>
          ))}
        </div>

        {/* Nudge */}
        <p style={{ textAlign: "center", fontSize: 15, color: BLUEPRINT.textMuted, marginTop: 32, lineHeight: 1.6 }}>
          Not sure what you need?{" "}
          <a href="#contact" style={{ color: BLUEPRINT.accent, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Tell us what's going on and we'll figure it out together
          </a>
        </p>
      </div>
    </section>
  );
}
