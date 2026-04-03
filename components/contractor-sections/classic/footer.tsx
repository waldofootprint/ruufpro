"use client";

// Classic Footer — clean, minimal footer with columns.
// White text on dark background.

import { CLASSIC } from "../theme-classic";
import { getServiceContent } from "@/lib/service-page-content";

interface FooterProps {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  services: string[];
}

export default function ClassicFooter({
  businessName,
  phone,
  city,
  state,
  services,
}: FooterProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: CLASSIC.bgDark,
        padding: "48px 24px 24px",
        fontFamily: CLASSIC.fontBody,
      }}
    >
      <div style={{ maxWidth: CLASSIC.maxWidth, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            paddingBottom: 40,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Company info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L2 18h4v10h8v-7h4v7h8V18h4L16 4z" fill="#fff" />
              </svg>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: CLASSIC.textOnDark,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontFamily: CLASSIC.fontDisplay,
                }}
              >
                {businessName}
              </span>
            </div>
            <p style={{ fontSize: 14, color: CLASSIC.textOnDarkMuted, lineHeight: 1.6 }}>
              Professional roofing services in {city}, {state}. Licensed, insured, and committed to quality.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: CLASSIC.textOnDarkMuted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: CLASSIC.fontDisplay,
              }}
            >
              Services
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {services.slice(0, 6).map((service) => {
                const entry = getServiceContent(service);
                const href = entry ? `/services/${entry.slug}` : "#services";
                return (
                  <a
                    key={service}
                    href={href}
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  >
                    {service}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: CLASSIC.textOnDarkMuted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: CLASSIC.fontDisplay,
              }}
            >
              Quick Links
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "About Us", href: "#about" },
                { label: "Services", href: "/services" },
                { label: "Contact", href: "#contact" },
                { label: "Service Areas", href: "#service-area" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: CLASSIC.textOnDarkMuted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: CLASSIC.fontDisplay,
              }}
            >
              Contact
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href={`tel:${phoneClean}`}
                style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
              >
                {phone}
              </a>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                {city}, {state}
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            &copy; {year} {businessName}. All rights reserved.
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Powered by{" "}
            <a
              href="https://ruufpro.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
            >
              RuufPro
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
