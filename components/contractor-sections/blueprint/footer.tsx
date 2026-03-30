"use client";

import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";

type Props = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "services">;

export default function BlueprintFooter({ businessName, phone, city, state }: Props) {
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <footer style={{ background: BLUEPRINT.bgWhite, borderTop: `1px solid ${BLUEPRINT.border}`, padding: "48px 32px 32px", fontFamily: BLUEPRINT.fontBody }}>
      <div style={{ maxWidth: BLUEPRINT.maxWidth, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 32, flexWrap: "wrap", paddingBottom: 28, borderBottom: `1px solid ${BLUEPRINT.border}`, marginBottom: 20 }}>
          <div style={{ maxWidth: 280 }}>
            <p style={{ fontFamily: BLUEPRINT.fontDisplay, fontSize: 18, fontWeight: 800, color: BLUEPRINT.text, marginBottom: 8 }}>{businessName}</p>
            <p style={{ fontSize: 14, color: BLUEPRINT.textSecondary, lineHeight: 1.5 }}>
              Professional roofing for {city} homeowners. Licensed, insured, locally owned.
            </p>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: BLUEPRINT.textMuted, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Links</p>
              {["Services", "About", "Reviews", "Contact"].map((link) => (
                <a key={link} href={`#${link.toLowerCase()}`} style={{ display: "block", fontSize: 14, color: BLUEPRINT.textSecondary, textDecoration: "none", marginBottom: 6, transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = BLUEPRINT.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = BLUEPRINT.textSecondary)}>
                  {link}
                </a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: BLUEPRINT.textMuted, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Contact</p>
              <p style={{ fontSize: 14, color: BLUEPRINT.textSecondary, marginBottom: 6 }}>{city}, {state}</p>
              <a href={`tel:${phoneClean}`} style={{ fontSize: 14, color: BLUEPRINT.textSecondary, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BLUEPRINT.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = BLUEPRINT.textSecondary)}>
                {phone}
              </a>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, color: BLUEPRINT.textMuted }}>&copy; {new Date().getFullYear()} {businessName}</span>
          <span style={{ fontSize: 13, color: BLUEPRINT.textMuted }}>
            Powered by <a href="https://ruufpro.com" style={{ color: BLUEPRINT.accent, textDecoration: "none" }}>RuufPro</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
