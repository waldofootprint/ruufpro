// Modern Clean template — assembles all contractor sections in order.
// This is the complete roofer website, rendered from database data.
// Each section is independent and conditionally renders based on
// what data the roofer has filled in.

import type { ContractorSiteData } from "../contractor-sections/types";
import Nav from "../contractor-sections/nav";
import Hero from "../contractor-sections/hero";
import ProofBar from "../contractor-sections/proof-bar";
import Services from "../contractor-sections/services";
import EstimateSection from "../contractor-sections/estimate-section";
import WhyUs from "../contractor-sections/why-us";
import About from "../contractor-sections/about";
import Reviews from "../contractor-sections/reviews";
import Process from "../contractor-sections/process";
import ServiceArea from "../contractor-sections/service-area";
import CtaBand from "../contractor-sections/cta-band";
import ContactForm from "../contractor-sections/contact-form";
import Footer from "../contractor-sections/footer";

export default function ModernCleanTemplate(props: ContractorSiteData) {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <Nav
        businessName={props.businessName}
        phone={props.phone}
        hasEstimateWidget={props.hasEstimateWidget}
      />
      <Hero
        businessName={props.businessName}
        phone={props.phone}
        city={props.city}
        heroHeadline={props.heroHeadline}
        tagline={props.tagline}
        heroCta={props.heroCta}
        heroImage={props.heroImage}
        hasEstimateWidget={props.hasEstimateWidget}
      />
      <ProofBar
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        offersFinancing={props.offersFinancing}
        hasEstimateWidget={props.hasEstimateWidget}
      />
      <Services services={props.services} />
      <EstimateSection
        hasEstimateWidget={props.hasEstimateWidget}
        contractorId={props.contractorId}
        businessName={props.businessName}
        phone={props.phone}
      />
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
    </div>
  );
}
