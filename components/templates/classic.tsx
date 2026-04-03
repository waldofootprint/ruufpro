// Classic template — clean, corporate, monochromatic design.
// Signature element: diagonal image collage in hero.
// Uses Inter font, uppercase headings, charcoal buttons, minimal color.

import type { ContractorSiteData } from "../contractor-sections/types";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import ClassicNav from "../contractor-sections/classic/nav";
import ClassicHero from "../contractor-sections/classic/hero";
import ClassicServices from "../contractor-sections/classic/services";
import ClassicEstimate from "../contractor-sections/classic/estimate-section";
import ClassicAbout from "../contractor-sections/classic/about";
import Reviews from "../contractor-sections/reviews";
import FAQ from "../contractor-sections/faq";
import ServiceArea from "../contractor-sections/service-area";
import ClassicCtaBand from "../contractor-sections/classic/cta-band";
import ClassicContact from "../contractor-sections/classic/contact-form";
import ClassicFooter from "../contractor-sections/classic/footer";

export default function ClassicTemplate(props: ContractorSiteData) {
  return (
    <main style={{ background: "#fff", minHeight: "100vh" }}>
      <ClassicNav
        businessName={props.businessName}
        phone={props.phone}
        hasEstimateWidget={props.hasEstimateWidget}
        services={props.services}
        serviceAreaCities={props.serviceAreaCities}
        city={props.city}
      />
      <ClassicHero
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
      <ClassicServices services={props.services} />
      <ClassicEstimate
        hasEstimateWidget={props.hasEstimateWidget}
        contractorId={props.contractorId}
        businessName={props.businessName}
        phone={props.phone}
      />
      <ClassicAbout
        businessName={props.businessName}
        city={props.city}
        state={props.state}
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
        theme="classic"
      />
      <ServiceArea
        city={props.city}
        state={props.state}
        serviceAreaCities={props.serviceAreaCities}
      />
      <ClassicCtaBand
        phone={props.phone}
        city={props.city}
        hasEstimateWidget={props.hasEstimateWidget}
      />
      <ClassicContact
        businessName={props.businessName}
        phone={props.phone}
        city={props.city}
        state={props.state}
        contractorId={props.contractorId}
      />
      <ClassicFooter
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
