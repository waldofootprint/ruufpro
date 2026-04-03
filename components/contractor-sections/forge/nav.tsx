"use client";

// Forge Nav — blue accent bar with white text and outlined CTA button.

import { useState } from "react";
import { FORGE } from "../theme-forge";

interface ForgeNavProps {
  businessName: string;
  phone: string;
  hasEstimateWidget: boolean;
  services: string[];
  serviceAreaCities: string[];
  city: string;
}

export default function ForgeNav({
  businessName,
  phone,
  hasEstimateWidget,
}: ForgeNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const phoneClean = phone.replace(/\D/g, "");

  const navLinks = [
    { label: "CONTACT US", href: "#contact" },
    { label: "ABOUT US", href: "#about" },
    { label: "SERVICES", href: "/services" },
    { label: "SERVICE AREAS", href: "#service-area" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: FORGE.bgBlue,
        fontFamily: FORGE.fontBody,
      }}
    >
      <div
        style={{
          maxWidth: FORGE.maxWidth,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo / Business Name */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L2 18h4v10h8v-7h4v7h8V18h4L16 4z" fill="rgba(255,255,255,0.9)" />
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: FORGE.fontDisplay,
            }}
          >
            {businessName}
          </span>
        </a>

        {/* Desktop nav links */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 28 }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA button — outlined style */}
        <div className="hidden md:flex" style={{ alignItems: "center" }}>
          <a
            href={hasEstimateWidget ? "#estimate" : `tel:${phoneClean}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 22px",
              background: "transparent",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.5)",
              borderRadius: FORGE.borderRadius,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            }}
          >
            CALL NOW
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: FORGE.bgBlue,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 24px 24px",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.04em",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href={hasEstimateWidget ? "#estimate" : `tel:${phoneClean}`}
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block",
              marginTop: 16,
              padding: "12px 24px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textAlign: "center",
              textDecoration: "none",
              textTransform: "uppercase",
              borderRadius: FORGE.borderRadius,
            }}
          >
            CALL NOW
          </a>
        </div>
      )}
    </nav>
  );
}
