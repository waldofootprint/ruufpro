// Forge template — dark, bold, industrial design.
// Blue accent nav, black hero with full-bleed image, dark sections throughout.
// Uses Inter font, blue accent buttons and lines.

import type { ContractorSiteData } from "../contractor-sections/types";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import ForgeNav from "../contractor-sections/forge/nav";
import ForgeHero from "../contractor-sections/forge/hero";
import ForgeServices from "../contractor-sections/forge/services";
import ForgeEstimate from "../contractor-sections/forge/estimate-section";
import ForgeAbout from "../contractor-sections/forge/about";
import Reviews from "../contractor-sections/reviews";
import FAQ from "../contractor-sections/faq";
import ServiceArea from "../contractor-sections/service-area";
import ForgeCtaBand from "../contractor-sections/forge/cta-band";
import ForgeContact from "../contractor-sections/forge/contact-form";
import ForgeFooter from "../contractor-sections/forge/footer";

export default function ForgeTemplate(props: ContractorSiteData) {
  return (
    <main style={{ background: "#0D0D0D", minHeight: "100vh" }}>
      <ForgeNav
        businessName={props.businessName}
        phone={props.phone}
        hasEstimateWidget={props.hasEstimateWidget}
        services={props.services}
        serviceAreaCities={props.serviceAreaCities}
        city={props.city}
      />
      <ForgeHero
        businessName={props.businessName}
        phone={props.phone}
        city={props.city}
        heroHeadline={props.heroHeadline}
        tagline={props.tagline}
        heroCta={props.heroCta}
        heroImage={props.heroImage}
        hasEstimateWidget={props.hasEstimateWidget}
        reviews={props.reviews}
        urgencyBadge={props.urgencyBadge}
        offersFinancing={props.offersFinancing}
      />
      <ForgeServices services={props.services} />
      <ForgeEstimate
        hasEstimateWidget={props.hasEstimateWidget}
        contractorId={props.contractorId}
        businessName={props.businessName}
        phone={props.phone}
      />
      <ForgeAbout
        businessName={props.businessName}
        city={props.city}
        state={props.state}
        aboutText={props.aboutText}
        yearsInBusiness={props.yearsInBusiness}
      />
      <Reviews
        reviews={props.reviews}
        businessName={props.businessName}
        yearsInBusiness={props.yearsInBusiness}
        isLicensed={props.isLicensed}
        isInsured={props.isInsured}
        warrantyYears={props.warrantyYears}
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
        theme="forge"
      />
      <ServiceArea
        city={props.city}
        state={props.state}
        serviceAreaCities={props.serviceAreaCities}
      />
      <ForgeCtaBand
        phone={props.phone}
        city={props.city}
        hasEstimateWidget={props.hasEstimateWidget}
      />
      <ForgeContact
        businessName={props.businessName}
        phone={props.phone}
        city={props.city}
        state={props.state}
        contractorId={props.contractorId}
      />
      <ForgeFooter
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
