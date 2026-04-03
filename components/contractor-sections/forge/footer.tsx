"use client";

// Forge Footer — very dark background, blue accent links.

import { FORGE } from "../theme-forge";
import { getServiceContent } from "@/lib/service-page-content";

interface FooterProps {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  services: string[];
}

export default function ForgeFooter({ businessName, phone, city, state, services }: FooterProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#050505", padding: "48px 24px 24px", fontFamily: FORGE.fontBody }}>
      <div style={{ maxWidth: FORGE.maxWidth, margin: "0 auto" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, paddingBottom: 40, borderBottom: `1px solid ${FORGE.border}` }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M16 4L2 18h4v10h8v-7h4v7h8V18h4L16 4z" fill={FORGE.accent} /></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: FORGE.fontDisplay }}>{businessName}</span>
            </div>
            <p style={{ fontSize: 14, color: FORGE.textMuted, lineHeight: 1.6 }}>
              Professional roofing services in {city}, {state}. Licensed, insured, and committed to quality.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: FORGE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, fontFamily: FORGE.fontDisplay }}>Services</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {services.slice(0, 6).map((service) => {
                const entry = getServiceContent(service);
                return (
                  <a key={service} href={entry ? `/services/${entry.slug}` : "#services"} style={{ fontSize: 14, color: FORGE.textFaint, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = FORGE.textFaint as string)}>
                    {service}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: FORGE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, fontFamily: FORGE.fontDisplay }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "About Us", href: "#about" }, { label: "Services", href: "/services" }, { label: "Contact", href: "#contact" }, { label: "Service Areas", href: "#service-area" }].map((link) => (
                <a key={link.label} href={link.href} style={{ fontSize: 14, color: FORGE.textFaint, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = FORGE.textFaint as string)}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: FORGE.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16, fontFamily: FORGE.fontDisplay }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={`tel:${phoneClean}`} style={{ fontSize: 14, color: FORGE.textFaint, textDecoration: "none" }}>{phone}</a>
              <span style={{ fontSize: 14, color: FORGE.textFaint }}>{city}, {state}</span>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: FORGE.textFaint }}>&copy; {year} {businessName}. All rights reserved.</span>
          <span style={{ fontSize: 12, color: FORGE.textFaint }}>
            Powered by{" "}
            <a href="https://ruufpro.com" target="_blank" rel="noopener noreferrer" style={{ color: FORGE.textMuted, textDecoration: "none" }}>RuufPro</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
