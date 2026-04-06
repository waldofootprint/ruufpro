"use client";

// Footer — dark footer with business info, links, and RuufPro attribution.

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";

type FooterProps = Pick<ContractorSiteData, "businessName" | "phone" | "city" | "state" | "services" | "tier"> & {
  licenseNumber?: string;
};

export default function Footer({ businessName, phone, city, state, services, tier, licenseNumber }: FooterProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: THEME.textPrimary,
        padding: "48px 24px 32px",
        fontFamily: THEME.fontBody,
      }}
    >
      <div style={{ maxWidth: THEME.maxWidth, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 32,
            paddingBottom: 32,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexWrap: "wrap",
          }}
        >
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: THEME.fontDisplay, marginBottom: 8 }}>
              {businessName}
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              Roof replacements, repairs, and inspections for {city} homeowners. Licensed, insured, and locally owned.
            </p>
          </div>

          {/* Link columns */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            {/* Quick Links */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Quick Links
              </p>
              {["Services", "About Us", "Reviews", "Contact"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "")}`}
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                    marginBottom: 8,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Services */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Services
              </p>
              {(services.length > 0 ? services.slice(0, 4) : ["Roof Replacement", "Roof Repair", "Inspections", "Gutters"]).map((svc) => (
                <a
                  key={svc}
                  href="#services"
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                    marginBottom: 8,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                >
                  {svc}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Contact
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>
                {city}, {state}
              </p>
              <a
                href={`tel:${phoneClean}`}
                style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
              >
                {phone}
              </a>
              {licenseNumber && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>
                  License #{licenseNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              &copy; {year} {businessName}. All rights reserved.
            </p>
            <a
              href="/privacy"
              style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              Privacy Policy
            </a>
          </div>
          {tier === "free" && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              Powered by{" "}
              <a
                href="https://ruufpro.com"
                style={{ color: THEME.accent, textDecoration: "none", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                RuufPro
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
