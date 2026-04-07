// Modern Clean template — Premium edition with two scroll animations.
// Animation A (hero): Material Transformation — cheap roof → premium
// Animation B (mid-page): Cutaway X-Ray — reveal roof layers
// Non-premium templates still use the standard Hero component.

import Image from "next/image";
import type { ContractorSiteData } from "../contractor-sections/types";
import { THEME } from "../contractor-sections/theme";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import Nav from "../contractor-sections/nav";
import ScrollAnimation from "../scroll-animation";
import ProofBar from "../contractor-sections/proof-bar";
import Services from "../contractor-sections/services";
import EstimateSection from "../contractor-sections/estimate-section";
import EstimateWidgetV4 from "../estimate-widget-v4";
import AboutTrust from "../contractor-sections/about-trust";
import Reviews from "../contractor-sections/reviews";
import FAQ from "../contractor-sections/faq";
import Process from "../contractor-sections/process";
import ServiceArea from "../contractor-sections/service-area";
import CtaBand from "../contractor-sections/cta-band";
import ContactForm from "../contractor-sections/contact-form";
import ProjectGallery from "../contractor-sections/project-gallery";
import Footer from "../contractor-sections/footer";

export default function ModernCleanTemplate(props: ContractorSiteData) {
  return (
    <main style={{ background: "#fff", minHeight: "100vh" }}>
      <Nav
        businessName={props.businessName}
        phone={props.phone}
        hasEstimateWidget={props.hasEstimateWidget}
        services={props.services}
        serviceAreaCities={props.serviceAreaCities}
        city={props.city}
      />

      {/* HERO: Figma two-column layout + research-backed conversion elements
          Layout from figma-contractor-homepage.html: text left, image right
          Research additions: first-person CTA (Q2,Q3), dual CTAs (Q3,Q4),
          trust badges near CTAs (Q3), star rating (Q2), city name (Q1),
          real photo support (Q3), urgency badge (Q4), 48px tap targets (Q2,Q3) */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "120px 48px 80px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "56px",
            alignItems: "center",
          }}
        >
          {/* Left column — text content */}
          <div>
            {/* Urgency badge — only renders if set */}
            {props.urgencyBadge && (
              <p
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#DC2626",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "980px",
                  padding: "6px 14px",
                  marginBottom: "16px",
                }}
              >
                {props.urgencyBadge}
              </p>
            )}

            {/* Kicker — accent bar + location/rating */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "3px", height: "20px", background: THEME.accent, borderRadius: "2px" }} />
              <span
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: THEME.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {props.reviews && props.reviews.length > 0
                  ? `★ ${(props.reviews.reduce((sum, r) => sum + r.rating, 0) / props.reviews.length).toFixed(1)} rated · Locally owned in ${props.city || "your area"}`
                  : `Locally owned in ${props.city || "your area"}`}
              </span>
            </div>

            {/* H1 */}
            <h1
              style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: "clamp(40px, 5.5vw, 64px)",
                fontWeight: 800,
                color: "#1A1A2E",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                marginBottom: "20px",
              }}
            >
              {props.heroHeadline || `Honest roofing for ${props.city || "your"} homeowners.`}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: "17px",
                color: "#64748B",
                lineHeight: 1.65,
                maxWidth: "500px",
                marginBottom: "36px",
              }}
            >
              {props.heroSubheadline || `Roof replacements, repairs, and inspections done right — with upfront pricing, clean job sites, and no pressure. ${props.city ? `Locally owned in ${props.city} and` : "Locally owned and"} fully insured.`}
            </p>

            {/* Dual CTAs */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "36px" }}>
              <a
                href={props.hasEstimateWidget ? "#estimate-section" : "#contact"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 32px",
                  background: THEME.ctaBg,
                  color: "#fff",
                  borderRadius: "99px",
                  fontWeight: 700,
                  fontSize: "15px",
                  textDecoration: "none",
                  fontFamily: "'Sora', system-ui, sans-serif",
                  boxShadow: "0 4px 16px rgba(232,114,12,0.3)",
                  minHeight: "48px",
                }}
              >
                {props.heroCta || "Get My Free Estimate"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a
                href={`tel:${props.phone.replace(/\D/g, "")}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 28px",
                  background: "transparent",
                  color: "#1A1A2E",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "99px",
                  fontWeight: 600,
                  fontSize: "15px",
                  textDecoration: "none",
                  fontFamily: "'Sora', system-ui, sans-serif",
                  minHeight: "48px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                Call {props.phone}
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {(props.isLicensed || props.isInsured) && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.8)", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
                  Licensed &amp; insured
                </div>
              )}
              {props.reviews && props.reviews.length > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.8)", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B" }} />
                  {props.reviews.length > 5 ? `${(props.reviews.reduce((s, r) => s + r.rating, 0) / props.reviews.length).toFixed(1)}-star rated` : "5-star Google rated"}
                </div>
              )}
              {props.warrantyYears && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.8)", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563EB" }} />
                  {props.warrantyYears}-year warranty
                </div>
              )}
            </div>
          </div>

          {/* Right column — estimate widget */}
          {props.hasEstimateWidget ? (
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                border: `1px solid ${THEME.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <EstimateWidgetV4
                contractorId={props.contractorId}
                contractorName={props.businessName}
                contractorPhone={props.phone}
                variant="light"
              />
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "460px",
                  overflow: "hidden",
                  borderRadius: "4px 20px 20px 4px",
                }}
              >
                <Image
                  src={props.heroImage || "/images/stock-photos/roofer-nail-gun-action.png"}
                  alt={`${props.businessName} roofing project in ${props.city || "your area"}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile responsive override */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
            }
            .hero-section {
              padding: 100px 16px 48px !important;
            }
          }
        `}</style>
      </section>

      <ProofBar
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        offersFinancing={props.offersFinancing}
        hasEstimateWidget={props.hasEstimateWidget}
        yearsInBusiness={props.yearsInBusiness}
        warrantyYears={props.warrantyYears}
        reviews={props.reviews}
      />

      {/* Section order: Problem → Promise → Proof → Path (Q3)
          Process early = "here's how easy it is" before asking for anything
          Reviews before estimate = social proof reduces friction */}

      <Process />

      {/* Process component has its own micro-CTA now */}

      <Services services={props.services} />

      {/* Services component has its own micro-CTA now */}

      <Reviews reviews={props.reviews} />

      {/* Micro-CTA: after reviews — social proof → action */}
      <div style={{ textAlign: "center", padding: "32px 32px 0" }}>
        <a
          href={props.hasEstimateWidget ? "#estimate-section" : "#contact"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: THEME.accent,
            fontWeight: 600,
            fontSize: 15,
            fontFamily: THEME.fontDisplay,
            textDecoration: "none",
          }}
        >
          Get my free estimate <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* ANIMATION B: Cutaway X-Ray — Pro/Growth only (premium differentiator) */}
      {props.tier !== "free" && (
        <ScrollAnimation
          framePath="/animations/roof-cutaway"
          frameCount={151}
          scrollHeight="250vh"
          bgColor="#F9FAFB"
          accentColor="#0F1B2D"
          fontDisplay="'Sora', system-ui, sans-serif"
          fontBody="'DM Sans', system-ui, sans-serif"
          gradientMask
          milestones={[
            { text: "Every layer. Every detail.", startProgress: 0.0, endProgress: 0.18, style: "headline" },
            { text: "Ice & Water Shield — Prevents leaks at vulnerable points", startProgress: 0.22, endProgress: 0.40, style: "label" },
            { text: "Drip Edge Flashing — Channels water away from fascia", startProgress: 0.44, endProgress: 0.62, style: "label" },
            { text: "5 layers of protection between you and the elements.", startProgress: 0.68, endProgress: 0.88, style: "headline" },
          ]}
          endCtaText="See What Your Roof Costs"
          ctaScrollTarget="estimate-section"
          mobileStaticImage="/animations/roof-cutaway/frame-0151.jpg"
        />
      )}

      <div id="estimate-section">
        <EstimateSection
          hasEstimateWidget={props.hasEstimateWidget}
          contractorId={props.contractorId}
          businessName={props.businessName}
          phone={props.phone}
        />
      </div>

      <AboutTrust
        businessName={props.businessName}
        city={props.city}
        aboutText={props.aboutText}
        yearsInBusiness={props.yearsInBusiness}
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        gafMasterElite={props.gafMasterElite}
        owensCorningPreferred={props.owensCorningPreferred}
        certainteedSelect={props.certainteedSelect}
        bbbAccredited={props.bbbAccredited}
        bbbRating={props.bbbRating}
        offersFinancing={props.offersFinancing}
        warrantyYears={props.warrantyYears}
        phone={props.phone}
        licenseNumber={props.licenseNumber ?? undefined}
      />
      <ProjectGallery
        theme={{ accent: THEME.accent, fontDisplay: THEME.fontDisplay, fontBody: THEME.fontBody, maxWidth: THEME.maxWidth, borderRadius: THEME.borderRadius }}
        businessName={props.businessName}
        photos={[]}
      />

      <FAQ
        businessName={props.businessName}
        city={props.city}
        state={props.state}
        services={props.services}
        serviceAreaCities={props.serviceAreaCities}
        offersFinancing={props.offersFinancing}
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        yearsInBusiness={props.yearsInBusiness}
        phone={props.phone}
        theme="modern-clean"
      />

      <ServiceArea
        city={props.city}
        state={props.state}
        serviceAreaCities={props.serviceAreaCities}
      />
      <CtaBand
        phone={props.phone}
        city={props.city}
        hasEstimateWidget={props.hasEstimateWidget}
      />
      <ContactForm
        businessName={props.businessName}
        phone={props.phone}
        city={props.city}
        state={props.state}
        contractorId={props.contractorId}
      />
      <Footer
        businessName={props.businessName}
        phone={props.phone}
        city={props.city}
        state={props.state}
        services={props.services}
        tier={props.tier}
        licenseNumber={props.licenseNumber ?? undefined}
      />
      <FloatingEstimateCTA hasEstimateWidget={props.hasEstimateWidget} phone={props.phone} />
      <FloatingTextUs phone={props.phone} />
    </main>
  );
}
