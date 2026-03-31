"use client";

import Image from "next/image";
import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "city" | "aboutText" | "yearsInBusiness">;

export default function ChalkAbout({ businessName, city, aboutText, yearsInBusiness }: Props) {
  const story = aboutText || `${businessName} is a locally owned roofing company serving homeowners in ${city} and the surrounding area${yearsInBusiness ? ` for over ${yearsInBusiness} years` : ""}. We show up on time, give you an honest assessment of what your roof actually needs, and do the work right. No pressure tactics, no inflated quotes, no disappearing after the check clears. Just straightforward roofing from people who live in your community.`;

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
            <div style={{ position: "relative", width: "100%", height: 360, overflow: "hidden", borderRadius: 8 }}>
              <Image
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format"
                alt={`${businessName} roofing team serving ${city}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
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
              { title: "Written estimates", desc: "Full breakdown — materials, labor, permits. The price we quote is what you pay." },
              { title: "Fast callbacks", desc: "Call or message us and we'll get back to you the same day. Usually within a few hours." },
              { title: "Clean job sites", desc: "Tarps down, debris hauled, magnetic nail sweep. We leave your yard better than we found it." },
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
