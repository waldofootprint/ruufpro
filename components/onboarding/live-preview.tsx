"use client";

// Live template preview for onboarding edit mode.
// Renders the FULL website (all sections) at desktop scale, and auto-scrolls
// to the section matching what the roofer is editing on the left.

import { useEffect, useRef } from "react";

// Modern Clean sections
import Nav from "../contractor-sections/nav";
import Hero from "../contractor-sections/hero";
import ProofBar from "../contractor-sections/proof-bar";
import Services from "../contractor-sections/services";
import About from "../contractor-sections/about";
import Reviews from "../contractor-sections/reviews";
import CtaBand from "../contractor-sections/cta-band";
import ContactForm from "../contractor-sections/contact-form";
import ServiceArea from "../contractor-sections/service-area";
import Footer from "../contractor-sections/footer";

// Chalkboard sections
import ChalkNav from "../contractor-sections/chalkboard/nav";
import ChalkHero from "../contractor-sections/chalkboard/hero";
import ChalkTrust from "../contractor-sections/chalkboard/trust";
import ChalkServices from "../contractor-sections/chalkboard/services";
import ChalkAbout from "../contractor-sections/chalkboard/about";
import ChalkReviews from "../contractor-sections/chalkboard/reviews";
import ChalkCta from "../contractor-sections/chalkboard/cta-band";
import ChalkContact from "../contractor-sections/chalkboard/contact-form";
import ChalkServiceArea from "../contractor-sections/chalkboard/service-area";
import ChalkFooter from "../contractor-sections/chalkboard/footer";

// Blueprint sections
import BlueprintNav from "../contractor-sections/blueprint/nav";
import BlueprintHero from "../contractor-sections/blueprint/hero";
import BlueprintFeatures from "../contractor-sections/blueprint/features";
import BlueprintServices from "../contractor-sections/blueprint/services";
import BlueprintAbout from "../contractor-sections/blueprint/about";
import BlueprintReviews from "../contractor-sections/blueprint/reviews";
import BlueprintCta from "../contractor-sections/blueprint/cta-band";
import BlueprintContact from "../contractor-sections/blueprint/contact-form";
import BlueprintServiceArea from "../contractor-sections/blueprint/service-area";
import BlueprintFooter from "../contractor-sections/blueprint/footer";

type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";

interface Props {
  designStyle: DesignStyle;
  businessName: string;
  city: string;
  state: string;
  phone: string;
  slug: string;
  activeSection?: string;
  services?: string[];
  isLicensed?: boolean;
  isInsured?: boolean;
  offersFinancing?: boolean;
  warrantyYears?: number | null;
  yearsInBusiness?: number | null;
  gafMasterElite?: boolean;
  bbbAccredited?: boolean;
  reviews?: { name: string; text: string; rating: number }[];
  aboutText?: string;
  serviceAreaCities?: string[];
}

const BG_COLORS: Record<DesignStyle, string> = {
  modern_clean: "#FFFFFF",
  bold_confident: "#2A2D2A",
  warm_trustworthy: "#F5F7FA",
};

const SCALE = 0.32;
const DESKTOP_W = 1440;

export default function LivePreview({
  designStyle,
  businessName,
  city,
  state,
  phone,
  slug,
  activeSection = "hero",
  services = ["Roof Replacement", "Roof Repair", "Roof Inspections", "Gutter Installation"],
  isLicensed = true,
  isInsured = true,
  offersFinancing = false,
  warrantyYears = null,
  yearsInBusiness = null,
  gafMasterElite = false,
  bbbAccredited = false,
  reviews = [],
  aboutText = "",
  serviceAreaCities = [],
}: Props) {
  const name = businessName || "Your Roofing Company";
  const loc = city || "Your City";
  const st = state || "TX";
  const ph = phone || "(555) 123-4567";

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the preview container to the active section
  useEffect(() => {
    const el = sectionRefs.current[activeSection];
    const container = scrollContainerRef.current;
    if (el && container) {
      // el.offsetTop is in unscaled coordinates — multiply by scale to get actual position
      const scrollTarget = el.offsetTop * SCALE;
      container.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }
  }, [activeSection]);

  const contentRef = useRef<HTMLDivElement | null>(null);

  // Clamp scroll so you can't scroll past the footer
  useEffect(() => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    function handleScroll() {
      // Max scroll = scaled content height - container height
      const maxScroll = (content!.scrollHeight * SCALE) - container!.clientHeight;
      if (maxScroll > 0 && container!.scrollTop > maxScroll) {
        container!.scrollTop = maxScroll;
      }
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  function setRef(name: string) {
    return (el: HTMLDivElement | null) => { sectionRefs.current[name] = el; };
  }

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      {/* Browser chrome */}
      <div style={{ background: "#f1f1f1", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          {slug || "your-business"}.ruufpro.com
        </div>
      </div>

      {/* Scrollable preview viewport */}
      <div
        ref={scrollContainerRef}
        style={{
          height: 500,
          overflowY: "auto",
          overflowX: "hidden",
          background: BG_COLORS[designStyle],
          scrollbarWidth: "none", // Firefox
          overscrollBehavior: "contain",
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={contentRef}
          style={{
            width: DESKTOP_W,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >

          {/* ===== MODERN CLEAN ===== */}
          {designStyle === "modern_clean" && (
            <>
              <div ref={setRef("template")}>
                <Nav businessName={name} phone={ph} hasEstimateWidget={true} services={services} serviceAreaCities={serviceAreaCities} city={loc} />
              </div>
              <div ref={setRef("hero")}>
                <Hero businessName={name} phone={ph} city={loc} heroHeadline={null} tagline={null} heroCta={null} heroImage="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80" hasEstimateWidget={true} />
              </div>
              <div ref={setRef("trust")}>
                <ProofBar isLicensed={isLicensed} isInsured={isInsured} offersFinancing={offersFinancing} hasEstimateWidget={true} yearsInBusiness={yearsInBusiness} warrantyYears={warrantyYears} reviews={reviews} />
              </div>
              <div ref={setRef("services")}>
                <Services key={services.join(",")} services={services} />
              </div>
              <div ref={setRef("about")}>
                <About businessName={name} city={loc} aboutText={aboutText || null} yearsInBusiness={yearsInBusiness} />
              </div>
              <div ref={setRef("cities")}>
                <ServiceArea city={loc} state={st} serviceAreaCities={serviceAreaCities.length > 0 ? serviceAreaCities : [loc]} />
              </div>
              <Reviews reviews={reviews.length > 0 ? reviews : [{ name: "Maria G.", text: "Best roofing company we've ever worked with. Professional, on time, and great price.", rating: 5 }, { name: "James T.", text: "They handled everything with our insurance. Stress-free experience.", rating: 5 }]} businessName={name} yearsInBusiness={yearsInBusiness} isLicensed={true} isInsured={true} warrantyYears={10} />
              <CtaBand phone={ph} city={loc} hasEstimateWidget={true} offersFinancing={true} />
              <ContactForm businessName={name} phone={ph} city={loc} state={st} contractorId="preview" />
              <Footer businessName={name} phone={ph} city={loc} state={st} services={services} tier="free" />
            </>
          )}

          {/* ===== CHALKBOARD ===== */}
          {designStyle === "bold_confident" && (
            <>
              <div ref={setRef("template")}>
                <ChalkNav businessName={name} phone={ph} hasEstimateWidget={true} />
              </div>
              <div ref={setRef("hero")}>
                <ChalkHero businessName={name} city={loc} phone={ph} heroHeadline={null} tagline={null} heroCta={null} heroImage={null} hasEstimateWidget={true} yearsInBusiness={yearsInBusiness} reviews={reviews} urgencyBadge={null} />
              </div>
              <div ref={setRef("trust")}>
                <ChalkTrust isLicensed={isLicensed} isInsured={isInsured} offersFinancing={offersFinancing} warrantyYears={warrantyYears} yearsInBusiness={yearsInBusiness} gafMasterElite={gafMasterElite} bbbAccredited={bbbAccredited} />
              </div>
              <div ref={setRef("services")}>
                <ChalkServices key={services.join(",")} services={services} slug={slug || "preview"} />
              </div>
              <div ref={setRef("about")}>
                <ChalkAbout businessName={name} city={loc} aboutText={aboutText || null} yearsInBusiness={yearsInBusiness} />
              </div>
              <div ref={setRef("cities")}>
                <ChalkServiceArea city={loc} state={st} serviceAreaCities={serviceAreaCities.length > 0 ? serviceAreaCities : [loc]} />
              </div>
              <ChalkReviews reviews={reviews.length > 0 ? reviews : [{ name: "Maria G.", text: "Best roofing company we've ever worked with. Professional, on time, and great price.", rating: 5 }, { name: "James T.", text: "They handled everything with our insurance. Stress-free experience.", rating: 5 }]} />
              <ChalkCta phone={ph} city={loc} hasEstimateWidget={true} />
              <ChalkContact businessName={name} phone={ph} city={loc} state={st} contractorId="preview" />
              <ChalkFooter businessName={name} phone={ph} city={loc} state={st} services={services} />
            </>
          )}

          {/* ===== BLUEPRINT ===== */}
          {designStyle === "warm_trustworthy" && (
            <>
              <div ref={setRef("template")}>
                <BlueprintNav businessName={name} phone={ph} hasEstimateWidget={true} />
              </div>
              <div ref={setRef("hero")}>
                <BlueprintHero businessName={name} city={loc} phone={ph} heroHeadline={null} tagline={null} heroCta={null} heroImage={null} hasEstimateWidget={true} yearsInBusiness={yearsInBusiness} reviews={reviews} urgencyBadge={null} />
              </div>
              <div ref={setRef("trust")}>
                <BlueprintFeatures isInsured={isInsured} offersFinancing={offersFinancing} warrantyYears={warrantyYears} />
              </div>
              <div ref={setRef("services")}>
                <BlueprintServices key={services.join(",")} services={services} />
              </div>
              <div ref={setRef("about")}>
                <BlueprintAbout businessName={name} city={loc} aboutText={aboutText || null} yearsInBusiness={yearsInBusiness} />
              </div>
              <div ref={setRef("cities")}>
                <BlueprintServiceArea city={loc} state={st} serviceAreaCities={serviceAreaCities.length > 0 ? serviceAreaCities : [loc]} />
              </div>
              <BlueprintReviews reviews={reviews.length > 0 ? reviews : [{ name: "Maria G.", text: "Best roofing company we've ever worked with. Professional, on time, and great price.", rating: 5 }, { name: "James T.", text: "They handled everything with our insurance. Stress-free experience.", rating: 5 }]} />
              <BlueprintCta phone={ph} city={loc} hasEstimateWidget={true} />
              <BlueprintContact businessName={name} phone={ph} city={loc} state={st} contractorId="preview" />
              <BlueprintFooter businessName={name} phone={ph} city={loc} state={st} services={services} />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
