"use client";

import ProcessSteps from "@/components/contractor-sections/process-steps";
import TrustSection from "@/components/contractor-sections/trust-section";
import CertificationLogos from "@/components/contractor-sections/certification-logos";
import FounderSection from "@/components/contractor-sections/founder-section";
import ProjectGallery from "@/components/contractor-sections/project-gallery";
import FinancingCallout from "@/components/contractor-sections/financing-callout";
import StatsCounter from "@/components/contractor-sections/stats-counter";
import { MODERN } from "@/components/contractor-sections/theme-modern";
import { BOLD } from "@/components/contractor-sections/theme-bold";
import { CLEAN } from "@/components/contractor-sections/theme-clean";

const mockTrust = {
  isLicensed: true,
  isInsured: true,
  warrantyYears: 25,
  yearsInBusiness: 15,
  gafMasterElite: true,
  owensCorningPreferred: true,
  certainteedSelect: false,
  bbbAccredited: true,
  offersFinancing: true,
  reviews: [
    { name: "Sarah M.", text: "Great work", rating: 5 },
    { name: "Mike R.", text: "Professional", rating: 5 },
    { name: "Lisa K.", text: "On time", rating: 5 },
    { name: "James T.", text: "Fair price", rating: 4 },
    { name: "Amy W.", text: "Clean crew", rating: 5 },
  ],
};

export default function PreviewComponents() {
  return (
    <div>
      {/* ═══ MODERN CLEAN ═══ */}
      <div style={{ background: "#FFFFFF" }}>
        <div style={{ padding: "40px 32px 16px", maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontFamily: MODERN.fontDisplay, fontSize: 32, fontWeight: 800, color: MODERN.text }}>
            Template 1: Modern Clean
          </h1>
          <p style={{ color: MODERN.textSecondary, fontSize: 14, marginTop: 4 }}>
            Navy (#0F1B2D) + White + Amber/Orange (#E8722A) — Sora + DM Sans
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {["#0F1B2D", "#FFFFFF", "#E8722A", "#F9FAFB", "#1A1A2E"].map((c) => (
              <div key={c} style={{ width: 48, height: 48, borderRadius: 8, background: c, border: "1px solid #E5E7EB", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}>
                <span style={{ fontSize: 8, color: c === "#FFFFFF" || c === "#F9FAFB" ? "#999" : "#FFF" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <TrustSection theme={MODERN} variant="bar" {...mockTrust} />
        <TrustSection theme={MODERN} variant="full" {...mockTrust} />
        <ProcessSteps theme={MODERN} />

        <CertificationLogos theme={MODERN} {...mockTrust} />
        <StatsCounter theme={MODERN} yearsInBusiness={15} reviews={mockTrust.reviews} warrantyYears={25} />
        <FounderSection theme={MODERN} businessName="Pinnacle Roofing Co." city="Tampa" state="FL" yearsInBusiness={15} />
        <ProjectGallery theme={MODERN} businessName="Pinnacle Roofing Co." />
        <FinancingCallout theme={MODERN} offersFinancing={true} phone="813-555-0123" />

        {/* Dark navy section preview */}
        <div style={{ background: MODERN.bgDark, padding: "60px 32px" }}>
          <ProcessSteps theme={MODERN} isDark heading="Our Process" />
          <StatsCounter theme={MODERN} isDark yearsInBusiness={15} reviews={mockTrust.reviews} warrantyYears={25} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #E8722A, #D4A843, #DC4A3F)" }} />

      {/* ═══ BOLD (Dark) ═══ */}
      <div style={{ background: BOLD.bg }}>
        <div style={{ padding: "40px 32px 16px", maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontFamily: BOLD.fontDisplay, fontSize: 32, fontWeight: 800, color: BOLD.text }}>
            Template 2: Bold
          </h1>
          <p style={{ color: BOLD.textSecondary, fontSize: 14, marginTop: 4 }}>
            Charcoal (#141414) + Gold (#D4A843) + Orange CTA (#E67E22) — Plus Jakarta Sans
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {["#141414", "#1E1E1E", "#D4A843", "#E67E22", "#F0F0F0"].map((c) => (
              <div key={c} style={{ width: 48, height: 48, borderRadius: 8, background: c, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}>
                <span style={{ fontSize: 8, color: c === "#F0F0F0" || c === "#D4A843" || c === "#E67E22" ? "#000" : "#999" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <TrustSection theme={BOLD} variant="bar" isDark {...mockTrust} />
        <TrustSection theme={BOLD} variant="full" isDark {...mockTrust} />
        <CertificationLogos theme={BOLD} isDark {...mockTrust} />
        <ProcessSteps theme={BOLD} isDark />
        <StatsCounter theme={BOLD} isDark yearsInBusiness={15} reviews={mockTrust.reviews} warrantyYears={25} />
        <FounderSection theme={BOLD} isDark businessName="Summit Roofing" city="Denver" state="CO" yearsInBusiness={15} />
        <ProjectGallery theme={BOLD} isDark businessName="Summit Roofing" />
        <FinancingCallout theme={BOLD} isDark offersFinancing={true} phone="303-555-0456" />
      </div>

      {/* Divider */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #D4A843, #DC4A3F, #2563EB)" }} />

      {/* ═══ CLEAN (Trust-Forward) ═══ */}
      <div style={{ background: CLEAN.bg }}>
        <div style={{ padding: "40px 32px 16px", maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontFamily: CLEAN.fontDisplay, fontSize: 32, fontWeight: 800, color: CLEAN.text }}>
            Template 3: Clean
          </h1>
          <p style={{ color: CLEAN.textSecondary, fontSize: 14, marginTop: 4 }}>
            White + Warm Gray (#F5F5F0) + Coral CTA (#DC4A3F) + Blue Accent (#2563EB) — Plus Jakarta Sans
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {["#FFFFFF", "#F5F5F0", "#2563EB", "#DC4A3F", "#334155", "#16A34A"].map((c) => (
              <div key={c} style={{ width: 48, height: 48, borderRadius: 14, background: c, border: "1px solid #E5E7EB", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}>
                <span style={{ fontSize: 8, color: c === "#FFFFFF" || c === "#F5F5F0" ? "#999" : "#FFF" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <TrustSection theme={CLEAN} variant="bar" {...mockTrust} />
        <div style={{ background: CLEAN.bgWarm }}>
          <TrustSection theme={CLEAN} variant="full" {...mockTrust} />
          <CertificationLogos theme={CLEAN} {...mockTrust} />
        </div>
        <ProcessSteps theme={CLEAN} />
        <StatsCounter theme={CLEAN} yearsInBusiness={15} reviews={mockTrust.reviews} warrantyYears={25} />
        <div style={{ background: CLEAN.bgWarm }}>
          <FounderSection theme={CLEAN} businessName="Sunshine Roofing" city="Jacksonville" state="FL" yearsInBusiness={15} />
        </div>
        <ProjectGallery theme={CLEAN} businessName="Sunshine Roofing" />
        <FinancingCallout theme={CLEAN} offersFinancing={true} phone="904-555-0789" />
      </div>
    </div>
  );
}
