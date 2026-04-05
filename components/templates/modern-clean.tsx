// Modern Clean template — Premium edition with two scroll animations.
// Animation A (hero): Material Transformation — cheap roof → premium
// Animation B (mid-page): Cutaway X-Ray — reveal roof layers
// Non-premium templates still use the standard Hero component.

import type { ContractorSiteData } from "../contractor-sections/types";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import Nav from "../contractor-sections/nav";
import ScrollAnimation from "../scroll-animation";
import ProofBar from "../contractor-sections/proof-bar";
import Services from "../contractor-sections/services";
import EstimateSection from "../contractor-sections/estimate-section";
import WhyUs from "../contractor-sections/why-us";
import About from "../contractor-sections/about";
import Reviews from "../contractor-sections/reviews";
import FAQ from "../contractor-sections/faq";
import Process from "../contractor-sections/process";
import ServiceArea from "../contractor-sections/service-area";
import CtaBand from "../contractor-sections/cta-band";
import ContactForm from "../contractor-sections/contact-form";
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

      {/* HERO: 3D Scroll Animation — Roof Layer Explosion */}
      <ScrollAnimation
        framePath="/animations/roof-transform"
        frameCount={151}
        scrollHeight="300vh"
        bgColor="#FFFFFF"
        accentColor="#0F1B2D"
        fontDisplay="'Sora', system-ui, sans-serif"
        fontBody="'DM Sans', system-ui, sans-serif"
        fullBleed
        gradientMask
        glassCardHeadline={props.heroHeadline || `Built to Last. Backed by ${props.warrantyYears || 25} Years.`}
        glassCardSubheadline={
          props.yearsInBusiness
            ? `${props.yearsInBusiness}+ Years Serving ${props.city || "Your Area"} · Licensed & Insured`
            : `Licensed & Insured · Serving ${props.city || "Your Area"}`
        }
        glassCardCta="Get Your Free Estimate"
        ctaScrollTarget="estimate-section"
        milestones={[
          { text: "What goes into your roof?", startProgress: 0.08, endProgress: 0.22, style: "headline" },
          { text: "Architectural Shingles — 30-year warranty", startProgress: 0.24, endProgress: 0.38, style: "label" },
          { text: "Synthetic Underlayment — Moisture barrier", startProgress: 0.40, endProgress: 0.54, style: "label" },
          { text: "Plywood Decking — Structural foundation", startProgress: 0.56, endProgress: 0.70, style: "label" },
          { text: "We know every layer of your roof.", startProgress: 0.74, endProgress: 0.90, style: "headline" },
        ]}
        endCtaText="See What Your Roof Costs"
        mobileStaticImage="/animations/roof-transform/frame-0151.jpg"
      />

      <ProofBar
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        offersFinancing={props.offersFinancing}
        hasEstimateWidget={props.hasEstimateWidget}
        yearsInBusiness={props.yearsInBusiness}
        warrantyYears={props.warrantyYears}
        reviews={props.reviews}
      />
      <Services services={props.services} />

      {/* ANIMATION B: Cutaway X-Ray — Deep dive reveal */}
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

      <div id="estimate-section">
        <EstimateSection
          hasEstimateWidget={props.hasEstimateWidget}
          contractorId={props.contractorId}
          businessName={props.businessName}
          phone={props.phone}
        />
      </div>
      <WhyUs
        city={props.city}
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        gafMasterElite={props.gafMasterElite}
        owensCorningPreferred={props.owensCorningPreferred}
        certainteedSelect={props.certainteedSelect}
        bbbAccredited={props.bbbAccredited}
        bbbRating={props.bbbRating}
        offersFinancing={props.offersFinancing}
        warrantyYears={props.warrantyYears}
        yearsInBusiness={props.yearsInBusiness}
      />
      <About
        businessName={props.businessName}
        city={props.city}
        aboutText={props.aboutText}
        yearsInBusiness={props.yearsInBusiness}
      />
      <Reviews reviews={props.reviews} />
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
      <Process />
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
      />
      <FloatingEstimateCTA hasEstimateWidget={props.hasEstimateWidget} phone={props.phone} />
      <FloatingTextUs phone={props.phone} />
    </main>
  );
}
