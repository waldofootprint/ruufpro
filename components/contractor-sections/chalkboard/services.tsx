"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "services">;

const DESCRIPTIONS: Record<string, string> = {
  "Roof Replacement": "Full tear-off down to the deck, new underlayment, flashing, drip edge, and shingle installation. We handle the permit, the dumpster, and the cleanup — you just pick your shingle color.",
  "Roof Repair": "Leaks, missing shingles, cracked flashing, sagging gutterlines, pipe boot failures — we diagnose the actual problem and fix it right the first time. No upselling you a full replacement when a repair will do.",
  "Inspections": "We check your decking, underlayment, flashing, vents, gutters, and shingle condition. You get a written report with photos and honest recommendations — whether that means repairs, replacement, or doing nothing.",
  "Gutters": "Seamless aluminum gutter installation, downspout routing, gutter guards, and repairs. Properly sized and pitched to handle your roof's water volume and protect your foundation.",
  "Emergency Tarping": "Storm hit last night? We respond fast with emergency tarping to stop the damage from getting worse. Available 24/7 — call us and we'll get your roof covered.",
  "Storm Damage": "Hail, wind, fallen trees — we handle the full restoration and work directly with your insurance adjuster. We document the damage, file the claim paperwork, and get your roof back to pre-storm condition.",
  "Siding": "Vinyl, fiber cement, and wood siding installation and repair. We match existing materials and handle trim, soffit, and fascia so everything looks right together.",
  "Ventilation": "Ridge vents, soffit vents, powered attic fans, and intake/exhaust balancing. Proper ventilation extends your roof's life and cuts your energy bills — most homes we inspect are under-ventilated.",
};

const ICONS: Record<string, React.ReactElement> = {
  "Roof Replacement": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  "Roof Repair": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  "Inspections": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  "Gutters": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
};

const defaultIcon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;

export default function ChalkServices({ services }: Props) {
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
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 20, color: CHALK.accent, marginBottom: 8 }}>what we do</p>
        <h2 style={{ fontFamily: CHALK.fontDisplay, fontSize: 36, color: "#fff", marginBottom: 8 }}>Our Services</h2>
        <p style={{ fontSize: 17, color: CHALK.textMuted, maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
          Whether you need a quick repair or a full tear-off, here's what we can help with.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {list.slice(0, 6).map((svc, i) => {
          const desc = DESCRIPTIONS[svc] || `Professional ${svc.toLowerCase()} services delivered with quality craftsmanship and attention to detail.`;
          const icon = ICONS[svc] || defaultIcon;

          return (
            <div
              key={svc}
              style={{
                background: CHALK.bgLight,
                border: `1px solid ${CHALK.border}`,
                borderLeft: "3px solid transparent",
                borderRadius: CHALK.borderRadius,
                padding: 28,
                transition: "all 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = CHALK.accent;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(246,196,83,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Icon + number */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: CHALK.accentSubtle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {icon}
                </div>
                <span style={{ fontFamily: CHALK.fontDisplay, fontSize: 32, color: CHALK.accent, opacity: 0.2 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 style={{ fontFamily: CHALK.fontDisplay, fontSize: 20, color: CHALK.text, marginBottom: 6 }}>
                {svc}
              </h3>
              <p style={{ fontSize: 15, color: CHALK.textMuted, lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Nudge */}
      <p style={{ textAlign: "center", fontSize: 16, color: CHALK.textFaint, marginTop: 32, lineHeight: 1.6 }}>
        Not sure what you need?{" "}
        <a href="#contact" style={{ color: CHALK.accent, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Tell us what&apos;s going on and we&apos;ll figure it out together
        </a>
      </p>
    </section>
  );
}
