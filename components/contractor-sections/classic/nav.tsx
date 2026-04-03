"use client";

// Classic Nav — clean horizontal nav with uppercase links and dark CTA button.
// Minimal and corporate. Logo area on left, links center, CTA right.

import { useState } from "react";
import { CLASSIC } from "../theme-classic";

interface ClassicNavProps {
  businessName: string;
  phone: string;
  hasEstimateWidget: boolean;
  services: string[];
  serviceAreaCities: string[];
  city: string;
}

export default function ClassicNav({
  businessName,
  phone,
  hasEstimateWidget,
}: ClassicNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const phoneClean = phone.replace(/\D/g, "");

  const navLinks = [
    { label: "ABOUT US", href: "#about" },
    { label: "SERVICES", href: "/services" },
    { label: "SERVICE AREAS", href: "#service-area" },
    { label: "CONTACT US", href: "#contact" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${CLASSIC.borderLight}`,
        fontFamily: CLASSIC.fontBody,
      }}
    >
      <div
        style={{
          maxWidth: CLASSIC.maxWidth,
          margin: "0 auto",
          padding: "0 24px",
          height: 72,
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
          {/* Roof icon */}
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L2 18h4v10h8v-7h4v7h8V18h4L16 4z" fill={CLASSIC.accent} />
          </svg>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: CLASSIC.text,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: CLASSIC.fontDisplay,
            }}
          >
            {businessName}
          </span>
        </a>

        {/* Desktop nav links */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            gap: 32,
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: CLASSIC.textSecondary,
                textDecoration: "none",
                letterSpacing: "0.06em",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = CLASSIC.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = CLASSIC.textSecondary)}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA button */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 16 }}>
          <a
            href={hasEstimateWidget ? "#estimate" : `tel:${phoneClean}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              background: CLASSIC.accent,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: CLASSIC.borderRadius,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = CLASSIC.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = CLASSIC.accent)}
          >
            CALL NOW
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
          }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CLASSIC.text} strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: "#fff",
            borderTop: `1px solid ${CLASSIC.borderLight}`,
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
                color: CLASSIC.textSecondary,
                textDecoration: "none",
                letterSpacing: "0.04em",
                borderBottom: `1px solid ${CLASSIC.borderLight}`,
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
              background: CLASSIC.accent,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textAlign: "center",
              textDecoration: "none",
              textTransform: "uppercase",
              borderRadius: CLASSIC.borderRadius,
            }}
          >
            CALL NOW
          </a>
        </div>
      )}
    </nav>
  );
}
