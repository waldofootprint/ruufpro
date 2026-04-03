"use client";

// Live template preview for onboarding.
// Renders ACTUAL template sections scaled down inside a browser-chrome frame.
// Shows only sections relevant to the current step:
//   step=2: Hero only (they're editing name/phone/city)
//   step=3: Hero + trust + services (they're toggling these)

// Modern Clean sections
import Nav from "../contractor-sections/nav";
import Hero from "../contractor-sections/hero";
import ProofBar from "../contractor-sections/proof-bar";
import Services from "../contractor-sections/services";

// Chalkboard sections
import ChalkNav from "../contractor-sections/chalkboard/nav";
import ChalkHero from "../contractor-sections/chalkboard/hero";
import ChalkTrust from "../contractor-sections/chalkboard/trust";
import ChalkServices from "../contractor-sections/chalkboard/services";

// Blueprint sections
import BlueprintNav from "../contractor-sections/blueprint/nav";
import BlueprintHero from "../contractor-sections/blueprint/hero";
import BlueprintFeatures from "../contractor-sections/blueprint/features";
import BlueprintServices from "../contractor-sections/blueprint/services";

type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";

interface Props {
  designStyle: DesignStyle;
  businessName: string;
  city: string;
  state: string;
  phone: string;
  slug: string;
  /** Which onboarding step — controls what sections are visible */
  step?: number;
  services?: string[];
  isLicensed?: boolean;
  isInsured?: boolean;
  offersFinancing?: boolean;
  warrantyYears?: number | null;
  yearsInBusiness?: number | null;
  gafMasterElite?: boolean;
  bbbAccredited?: boolean;
  reviews?: { name: string; text: string; rating: number }[];
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
  phone,
  slug,
  step = 2,
  services = ["Roof Replacement", "Roof Repair", "Roof Inspections", "Gutter Installation"],
  isLicensed = true,
  isInsured = true,
  offersFinancing = false,
  warrantyYears = null,
  yearsInBusiness = null,
  gafMasterElite = false,
  bbbAccredited = false,
  reviews = [],
}: Props) {
  const name = businessName || "Your Roofing Company";
  const loc = city || "Your City";
  const ph = phone || "(555) 123-4567";

  const heroOnly = step <= 2;
  const sectionsOnly = step >= 3;

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

      {/* Scaled content — renders at 1440px, CSS-scaled to fit.
           We use a fixed-height clip based on what's visible at scale. */}
      <div style={{
        overflow: "hidden",
        background: BG_COLORS[designStyle],
        maxHeight: sectionsOnly ? 360 : 220,
      }}>
        <div style={{
          width: DESKTOP_W,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}>
          {designStyle === "modern_clean" && (
            <>
              {heroOnly && (
                <>
                  <Nav businessName={name} phone={ph} hasEstimateWidget={true} services={services} serviceAreaCities={[]} city={loc} />
                  <Hero
                    businessName={name}
                    phone={ph}
                    city={loc}
                    heroHeadline={null}
                    tagline={null}
                    heroCta={null}
                    heroImage="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"
                    hasEstimateWidget={true}
                  />
                </>
              )}
              {sectionsOnly && (
                <>
                  <ProofBar
                    isLicensed={isLicensed}
                    isInsured={isInsured}
                    offersFinancing={offersFinancing}
                    hasEstimateWidget={true}
                    yearsInBusiness={yearsInBusiness}
                    reviews={reviews}
                  />
                  <Services services={services} />
                </>
              )}
            </>
          )}

          {designStyle === "bold_confident" && (
            <>
              {heroOnly && (
                <>
                  <ChalkNav businessName={name} phone={ph} hasEstimateWidget={true} />
                  <ChalkHero
                    businessName={name}
                    city={loc}
                    phone={ph}
                    heroHeadline={null}
                    tagline={null}
                    heroCta={null}
                    heroImage={null}
                    hasEstimateWidget={true}
                    yearsInBusiness={yearsInBusiness}
                    reviews={reviews}
                    urgencyBadge={null}
                  />
                </>
              )}
              {sectionsOnly && (
                <>
                  <ChalkTrust
                    isLicensed={isLicensed}
                    isInsured={isInsured}
                    offersFinancing={offersFinancing}
                    warrantyYears={warrantyYears}
                    yearsInBusiness={yearsInBusiness}
                    gafMasterElite={gafMasterElite}
                    bbbAccredited={bbbAccredited}
                  />
                  <ChalkServices services={services} slug={slug || "preview"} />
                </>
              )}
            </>
          )}

          {designStyle === "warm_trustworthy" && (
            <>
              {heroOnly && (
                <>
                  <BlueprintNav businessName={name} phone={ph} hasEstimateWidget={true} />
                  <BlueprintHero
                    businessName={name}
                    city={loc}
                    phone={ph}
                    heroHeadline={null}
                    tagline={null}
                    heroCta={null}
                    heroImage={null}
                    hasEstimateWidget={true}
                    yearsInBusiness={yearsInBusiness}
                    reviews={reviews}
                    urgencyBadge={null}
                  />
                </>
              )}
              {sectionsOnly && (
                <>
                  <BlueprintFeatures
                    isInsured={isInsured}
                    offersFinancing={offersFinancing}
                    warrantyYears={warrantyYears}
                  />
                  <BlueprintServices services={services} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
