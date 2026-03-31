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
          color: open ? THEME.textPrimary : THEME.textMuted,
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
        onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textPrimary)}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = THEME.textMuted; }}
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
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: THEME.maxWidth,
        zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${THEME.border}`,
        borderRadius: THEME.borderRadius,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: THEME.fontBody,
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <a
        href="#"
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: THEME.primary,
          textDecoration: "none",
          fontFamily: THEME.fontDisplay,
          letterSpacing: "-0.3px",
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
              color: THEME.textMuted,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = THEME.textMuted)}
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
            color: THEME.textMuted,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = THEME.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = THEME.textMuted)}
        >
          Contact
        </a>
      </div>

      {/* Right: phone + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a
          href={`tel:${phoneClean}`}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: THEME.textSecondary,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <span className="hidden sm:inline">{phone}</span>
        </a>
        {hasEstimateWidget ? (
          <a
            href="#estimate"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: THEME.accent,
              padding: "8px 20px",
              borderRadius: 9999,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = THEME.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
          >
            Free Estimate
          </a>
        ) : (
          <a
            href="#contact"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: THEME.accent,
              padding: "8px 20px",
              borderRadius: 9999,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = THEME.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = THEME.accent)}
          >
            Contact Us
          </a>
        )}
      </div>
    </nav>
  );
}
