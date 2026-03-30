"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "services">;

const DESCRIPTIONS: Record<string, string> = {
  "Roof Replacement": "Complete tear-off and installation with premium materials. Every project backed by manufacturer warranties.",
  "Roof Repair": "Leak fixes, storm damage repair, flashing replacement — we handle it all quickly and get it right the first time.",
  "Inspections": "Thorough roof assessment with a detailed written report. Honest answers, no pressure to buy anything.",
  "Gutters": "Seamless gutter installation and repair to protect your home and foundation from water damage.",
  "Emergency Tarping": "24/7 emergency response for storm damage. We'll get your roof tarped and protected fast.",
  "Storm Damage": "Full storm restoration with insurance claim assistance. We work with all major carriers.",
};

const ICONS: Record<string, React.ReactElement> = {
  "Roof Replacement": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  "Roof Repair": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  "Inspections": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  "Gutters": <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
};

const defaultIcon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;

export default function ChalkServices({ services }: Props) {
  const list = services.length > 0 ? services : ["Roof Replacement", "Roof Repair", "Inspections", "Gutters"];

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
          From small repairs to complete replacements, we handle every aspect of your roofing needs.
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
    </section>
  );
}
