// Modern Clean template — Premium edition with two scroll animations.
// Animation A (hero): Material Transformation — cheap roof → premium
// Animation B (mid-page): Cutaway X-Ray — reveal roof layers
// Non-premium templates still use the standard Hero component.

import Image from "next/image";
import type { ContractorSiteData } from "../contractor-sections/types";
import { THEME } from "../contractor-sections/theme";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import ChatWidget from "../chat-widget/ChatWidget";
import Nav from "../contractor-sections/nav";

import ProofBar from "../contractor-sections/proof-bar";
import Services from "../contractor-sections/services";
import EstimateSection from "../contractor-sections/estimate-section";
import EstimateWidgetV4 from "../estimate-widget-v4";

import Reviews from "../contractor-sections/reviews";
import AboutTrust from "../contractor-sections/about-trust";
import FAQ from "../contractor-sections/faq";
import WhyChooseUs from "../contractor-sections/why-choose-us";
import ServiceArea from "../contractor-sections/service-area";
import CtaBand from "../contractor-sections/cta-band";
import ContactForm from "../contractor-sections/contact-form";
import ProjectGallery from "../contractor-sections/project-gallery";
import Footer from "../contractor-sections/footer";

export default function ModernCleanTemplate(props: ContractorSiteData & { basePath?: string }) {
  return (
    <main style={{ background: "#F5F3F0", minHeight: "100vh" }}>
      {/* Subtle noise texture + section styling */}
      <style>{`
        .mc-section-warm {
          background: #F5F0EB;
          position: relative;
        }
        .mc-section-warm::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.4;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }
        .mc-section-warm > * { position: relative; z-index: 1; }
        .mc-dot-texture {
          position: relative;
        }
        .mc-dot-texture::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(61,43,31,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 0;
        }
        .mc-dot-texture > * { position: relative; z-index: 1; }
        /* Service card hover — amber top accent on hover */
        .service-card:hover { border-top-color: #D4880F !important; }
        /* Square off widget corners for C1 style */
        .hero-section .rounded-3xl, .estimate-band .rounded-3xl { border-radius: 0 !important; }
        .hero-section .rounded-xl, .estimate-band .rounded-xl { border-radius: 0 !important; }
        .hero-section [class*="rounded-"], .estimate-band [class*="rounded-"] { border-radius: 0 !important; }
      `}</style>
      <Nav
        businessName={props.businessName}
        phone={props.phone}
        hasEstimateWidget={props.hasEstimateWidget}
        services={props.services}
        serviceAreaCities={props.serviceAreaCities}
        city={props.city}
        basePath={props.basePath}
      />

      {/* HERO: Dark, textured, high-impact. Photo bg with overlay + text left, widget/image right.
          Squared-off CTAs, prominent trust badges, construction-grade feel. */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#1A1A1A",
        }}
      >
        {/* Background photo — uses <img> to bypass Next.js optimizer for decorative bg */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/stock-photos/metal-hero.jpg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Dark overlay — fades to transparent on right for sky */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(15,15,15,0.9) 0%, rgba(15,15,15,0.6) 40%, rgba(15,15,15,0.2) 70%, transparent 100%)",
            zIndex: 1,
          }}
        />

        {/* Dot texture overlay — adds grit */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Bottom edge — clean dark cutoff, no gradient fade */}

        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "120px 48px 80px",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <div
            className="hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
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
                    fontFamily: THEME.fontBody,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#FCA5A5",
                    background: "rgba(220,38,38,0.15)",
                    border: "1px solid rgba(220,38,38,0.3)",
                    borderRadius: 0,
                    padding: "6px 14px",
                    marginBottom: "16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {props.urgencyBadge}
                </p>
              )}

              {/* Kicker — line + text */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "32px", height: "2px", background: THEME.accent }} />
                <span
                  style={{
                    fontFamily: THEME.fontBody,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: THEME.accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {props.reviews && props.reviews.length > 0
                    ? `Locally owned in ${props.city || "your area"} · ${props.reviews.length}+ reviews`
                    : `Locally owned in ${props.city || "your area"}`}
                </span>
              </div>

              {/* H1 */}
              <h1
                style={{
                  fontFamily: THEME.fontDisplay,
                  fontSize: "clamp(48px, 7vw, 80px)",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 0.95,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase" as const,
                  marginBottom: "20px",
                }}
              >
                {props.heroHeadline || `Honest roofing for ${props.city || "your"} homeowners.`}
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontFamily: THEME.fontBody,
                  fontSize: "17px",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.65,
                  maxWidth: "500px",
                  marginBottom: "36px",
                }}
              >
                {props.heroSubheadline || `Roof replacements, repairs, and inspections done right — with upfront pricing, clean job sites, and no pressure. ${props.city ? `Locally owned in ${props.city} and` : "Locally owned and"} fully insured.`}
              </p>

              {/* Dual CTAs — squared off */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href={props.hasEstimateWidget ? "#estimate-section" : "#contact"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "16px 32px",
                    background: THEME.ctaBg,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "16px",
                    textDecoration: "none",
                    fontFamily: THEME.fontDisplay,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    boxShadow: "0 4px 16px rgba(212,136,15,0.3)",
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
                    padding: "16px 28px",
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "2px solid rgba(255,255,255,0.2)",
                    fontWeight: 700,
                    fontSize: "16px",
                    textDecoration: "none",
                    fontFamily: THEME.fontDisplay,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.04em",
                    minHeight: "48px",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {props.phone}
                </a>
              </div>
            </div>

            {/* Right column — estimate widget or photo. Widget overlaps hero bottom edge. */}
            {props.hasEstimateWidget ? (
              <div
                style={{
                  background: "#fff",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  marginBottom: "-60px",
                  position: "relative",
                  zIndex: 3,
                }}
              >
                <EstimateWidgetV4
                  contractorId={props.contractorId}
                  contractorName={props.businessName}
                  contractorPhone={props.phone}
                  variant="light"
                  accentColor={THEME.accent}
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
                    borderRadius: 0,
                    boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
                  }}
                >
                  <Image
                    src={props.heroImage || "/images/stock-photos/hero-assembled-v1.png"}
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
        </div>

        {/* Mobile responsive override */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
            }
            .hero-section {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
          }
        `}</style>

        <ProofBar
          isLicensed={props.isLicensed}
          isInsured={props.isInsured}
          offersFinancing={props.offersFinancing}
          hasEstimateWidget={props.hasEstimateWidget}
          yearsInBusiness={props.yearsInBusiness}
          warrantyYears={props.warrantyYears}
          reviews={props.reviews}
        />
      </section>

      {/* Section order based on research: Social proof first, then services.
          Top roofer sites: Reviews → Services → Why Choose Us → Estimate → Contact */}

      <Reviews
        reviews={props.reviews}
        businessName={props.businessName}
        yearsInBusiness={props.yearsInBusiness}
        warrantyYears={props.warrantyYears}
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
      />

      <div className="mc-dot-texture">
        <Services services={props.services} />
      </div>

      <div style={{ padding: "80px 24px", background: THEME.bg }}>
        <div style={{ maxWidth: THEME.maxWidth, margin: "0 auto" }}>
          <WhyChooseUs
            businessName={props.businessName}
            yearsInBusiness={props.yearsInBusiness}
            warrantyYears={props.warrantyYears}
            isLicensed={props.isLicensed}
            isInsured={props.isInsured}
            hasEstimateWidget={props.hasEstimateWidget}
            phone={props.phone}
          />
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
        </div>
      </div>

      <EstimateSection
        hasEstimateWidget={props.hasEstimateWidget}
        contractorId={props.contractorId}
        businessName={props.businessName}
        phone={props.phone}
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
        offersFinancing={props.offersFinancing}
      />
      <div className="mc-dot-texture">
        <ContactForm
          businessName={props.businessName}
          phone={props.phone}
          city={props.city}
          state={props.state}
          contractorId={props.contractorId}
        />
      </div>
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
      <ChatWidget
        contractorId={props.contractorId}
        businessName={props.businessName}
        hasAiChatbot={props.hasAiChatbot ?? false}
        customGreeting={props.chatGreeting}
        accentColor="#D4880F"
        fontFamily="'Barlow', sans-serif"
      />
    </main>
  );
}
