"use client";

import Image from "next/image";
import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "city" | "aboutText" | "yearsInBusiness">;

const VALUES = ["Written estimates with full line-by-line breakdown", "Clean job sites — tarps down, magnetic nail sweep after", "Licensed, insured, and locally owned", "We treat your home like our own"];

export default function BlueprintAbout({ businessName, city, aboutText, yearsInBusiness }: Props) {
  const text = aboutText || `${businessName} is a locally owned roofing company serving homeowners in ${city} and the surrounding area${yearsInBusiness ? ` for over ${yearsInBusiness} years` : ""}. We show up on time, give you an honest assessment of what your roof actually needs, and do the work right. No pressure tactics, no inflated quotes, no disappearing after the check clears.`;

  return (
    <section id="about" style={{ background: BLUEPRINT.bgWhite, padding: BLUEPRINT.sectionPadding, fontFamily: BLUEPRINT.fontBody }}>
      <div
        style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 56, alignItems: "center" }}
        className="grid-cols-1! md:grid-cols-2!"
      >
        {/* Image */}
        <div style={{ position: "relative", width: "100%", height: 380, overflow: "hidden", borderRadius: 16, border: `1px solid ${BLUEPRINT.border}`, boxShadow: "0 12px 40px rgba(15,23,42,0.06)" }}>
          <Image
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format"
            alt={`${businessName} roofing team serving ${city}`}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Content */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: BLUEPRINT.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: BLUEPRINT.fontDisplay }}>
            About Us
          </p>
          <h2 style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: BLUEPRINT.text, lineHeight: 1.15, marginBottom: 16 }}>
            Why {city} trusts {businessName}
          </h2>
          <p style={{ fontSize: 16, color: BLUEPRINT.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
            {text}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {VALUES.map((v) => (
              <span key={v} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: BLUEPRINT.text, fontWeight: 500 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BLUEPRINT.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
