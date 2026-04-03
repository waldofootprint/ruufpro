"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "services">;

export default function ChalkFooter({ businessName, phone, city, state, services }: Props) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <footer style={{ padding: "48px 32px 32px", borderTop: `1px solid ${CHALK.border}`, fontFamily: CHALK.fontBody }}>
      <div style={{ maxWidth: CHALK.maxWidth, margin: "0 auto" }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 32, flexWrap: "wrap", paddingBottom: 28, borderBottom: `1px solid ${CHALK.border}`, marginBottom: 20 }}>
          <div style={{ maxWidth: 280 }}>
            <p style={{ fontFamily: CHALK.fontDisplay, fontSize: 22, color: CHALK.text, marginBottom: 8 }}>{businessName}</p>
            <p style={{ fontSize: 15, color: CHALK.textFaint, lineHeight: 1.5 }}>
              Roof replacements, repairs, and inspections for {city} homeowners. Licensed, insured, and locally owned.
            </p>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: CHALK.textFaint, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Links</p>
              {["Services", "About", "Reviews", "Contact"].map((link) => (
                <a key={link} href={`#${link.toLowerCase()}`} style={{ display: "block", fontSize: 15, color: CHALK.textMuted, textDecoration: "none", marginBottom: 6, transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = CHALK.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = CHALK.textMuted)}>
                  {link}
                </a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: CHALK.textFaint, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Contact</p>
              <p style={{ fontSize: 15, color: CHALK.textMuted, marginBottom: 6 }}>{city}, {state}</p>
              <a href={`tel:${phoneClean}`} style={{ fontSize: 15, color: CHALK.textMuted, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = CHALK.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = CHALK.textMuted)}>
                {phone}
              </a>
            </div>
          </div>
        </div>
        {/* Bottom row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, color: CHALK.textFaint }}>&copy; {new Date().getFullYear()} {businessName}</span>
          <span style={{ fontSize: 13, color: CHALK.textFaint }}>
            Powered by <a href="https://ruufpro.com" style={{ color: CHALK.accent, textDecoration: "none" }}>RuufPro</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
