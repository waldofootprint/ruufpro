"use client";

// Nav — floating glassmorphism pill navigation.
// Dropdown menus for Services and Service Areas.

import { useState, useRef, useEffect } from "react";
import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";
import { getServiceContent } from "@/lib/service-page-content";

type NavProps = Pick<ContractorSiteData, "businessName" | "phone" | "hasEstimateWidget" | "services" | "serviceAreaCities" | "city">;

const SERVICE_DEFAULTS = ["Roof Replacement", "Roof Repair", "Inspections", "Gutters", "Storm Damage", "Ventilation"];

interface DropdownProps {
  label: string;
  items: string[];
  href: string;
  itemHrefs?: string[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function NavDropdown({ label, items, href, itemHrefs, open, onToggle, onClose }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: open ? "#fff" : "rgba(255,255,255,0.6)",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: THEME.fontBody,
          transition: "color 0.2s",
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
      >
        {label}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: "8px 0",
            minWidth: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            zIndex: 100,
          }}
        >
          {/* Link to full section at top */}
          <a
            href={href}
            onClick={onClose}
            style={{
              display: "block",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: THEME.accent,
              textDecoration: "none",
              borderBottom: `1px solid ${THEME.border}`,
              marginBottom: 4,
            }}
          >
            View all →
          </a>
          {items.slice(0, 8).map((item, i) => (
            <a
              key={item}
              href={itemHrefs?.[i] || href}
              onClick={onClose}
              style={{
                display: "block",
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: THEME.textSecondary,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = THEME.bgWarm;
                e.currentTarget.style.color = THEME.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = THEME.textSecondary;
              }}
            >
              {item}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav({ businessName, phone, hasEstimateWidget, services, serviceAreaCities, city }: NavProps) {
  const phoneClean = phone.replace(/\D/g, "");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const serviceList = services && services.length > 0 ? services : SERVICE_DEFAULTS;
  const areaCities = serviceAreaCities && serviceAreaCities.length > 0 ? serviceAreaCities : [city];

  // Resolve service names to slugs for per-item links
  const serviceHrefs = serviceList.map((svc) => {
    const entry = getServiceContent(svc);
    return entry ? `/services/${entry.slug}` : "/services";
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 50,
        background: "rgba(15,15,15,0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "none",
        borderRadius: 0,
        padding: "0 40px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: THEME.fontBody,
        boxShadow: "none",
      }}
    >
      {/* Logo */}
      <a
        href="#"
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#fff",
          textDecoration: "none",
          fontFamily: THEME.fontDisplay,
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
        }}
      >
        {businessName}
      </a>

      {/* Desktop nav links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
        className="hidden md:flex"
      >
        <NavDropdown
          label="Services"
          items={serviceList}
          href="/services"
          itemHrefs={serviceHrefs}
          open={openDropdown === "services"}
          onToggle={() => setOpenDropdown(openDropdown === "services" ? null : "services")}
          onClose={() => setOpenDropdown(null)}
        />
        {["About", "Reviews"].map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              transition: "color 0.2s",
              textTransform: "uppercase" as const,
              letterSpacing: "0.04em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
          >
            {label}
          </a>
        ))}
        <NavDropdown
          label="Service Areas"
          items={areaCities}
          href="#service-area"
          open={openDropdown === "areas"}
          onToggle={() => setOpenDropdown(openDropdown === "areas" ? null : "areas")}
          onClose={() => setOpenDropdown(null)}
        />
        <a
          href="#contact"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        >
          Contact
        </a>
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {mobileMenuOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        )}
      </button>

      {/* Right: phone + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hidden md:flex">
        <a
          href={`tel:${phoneClean}`}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <span className="hidden sm:inline">{phone}</span>
        </a>
        <a
          href={hasEstimateWidget ? "#estimate" : "#contact"}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: THEME.accent,
            color: THEME.primary,
            padding: "10px 24px",
            border: "none",
            textDecoration: "none",
            transition: "background 0.2s",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            fontFamily: THEME.fontDisplay,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = THEME.accentHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = THEME.accent; }}
        >
          {hasEstimateWidget ? "Request a Consultation" : "Contact Us"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {["Services", "About", "Reviews", "Contact"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 15,
                fontWeight: 600,
                color: THEME.textPrimary,
                textDecoration: "none",
                borderBottom: `1px solid ${THEME.border}`,
                fontFamily: THEME.fontBody,
              }}
            >
              {label}
            </a>
          ))}
          <a
            href={`tel:${phoneClean}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 0 8px",
              fontSize: 15,
              fontWeight: 600,
              color: THEME.primary,
              textDecoration: "none",
              fontFamily: THEME.fontBody,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            {phone}
          </a>
          <a
            href={hasEstimateWidget ? "#estimate-section" : "#contact"}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px 20px",
              marginTop: 8,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: THEME.ctaBg,
              borderRadius: 10,
              textDecoration: "none",
              fontFamily: THEME.fontDisplay,
            }}
          >
            Get Free Estimate
          </a>
        </div>
      )}
    </nav>
  );
}
