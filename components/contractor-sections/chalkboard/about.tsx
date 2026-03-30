"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "city" | "aboutText" | "yearsInBusiness">;

export default function ChalkAbout({ businessName, city, aboutText, yearsInBusiness }: Props) {
  const story = aboutText || `${businessName} has been serving ${city} homeowners${yearsInBusiness ? ` for over ${yearsInBusiness} years` : ""}. We're not a franchise or a national chain — we're your neighbors. Every roof we touch gets the same care we'd give our own home.`;

  return (
    <section
      id="about"
      style={{
        padding: CHALK.sectionPadding,
        background: CHALK.bgAlt,
        fontFamily: CHALK.fontBody,
      }}
    >
      <div
        style={{ maxWidth: CHALK.maxWidth, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}
        className="grid-cols-1! md:grid-cols-2!"
      >
        {/* Left: visual */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              border: `3px dashed ${CHALK.borderDashed}`,
              borderRadius: 12,
              padding: 8,
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format"
              alt={`${businessName} team`}
              style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 8 }}
            />
          </div>
        </div>

        {/* Right: text */}
        <div>
          <p style={{ fontSize: 20, color: CHALK.accent, marginBottom: 8 }}>about us</p>
          <h2 style={{ fontFamily: CHALK.fontDisplay, fontSize: 32, color: "#fff", marginBottom: 16 }}>
            Built on trust
          </h2>
          <p style={{ fontSize: 18, color: CHALK.textMuted, lineHeight: 1.6, marginBottom: 28 }}>
            {story}
          </p>

          {/* Values */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { title: "No hidden fees", desc: "What we quote is what you pay." },
              { title: "Same-day callbacks", desc: "Call us and we'll get right back to you." },
              { title: "Clean job sites", desc: "We leave your yard better than we found it." },
            ].map((v) => (
              <div key={v.title} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CHALK.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <div>
                  <span style={{ fontWeight: 700, color: CHALK.text, fontSize: 16 }}>{v.title}</span>
                  <span style={{ color: CHALK.textMuted, fontSize: 15 }}> — {v.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
