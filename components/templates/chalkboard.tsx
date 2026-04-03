// Chalkboard template v2 — dark green-gray with chalk accents.
// Fredericka the Great headlines + Kalam body.
// Cards, containers, alternating backgrounds, visual richness.

import type { ContractorSiteData } from "../contractor-sections/types";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import ChalkNav from "../contractor-sections/chalkboard/nav";
import ChalkHero from "../contractor-sections/chalkboard/hero";
import ChalkTrust from "../contractor-sections/chalkboard/trust";
import ChalkStats from "../contractor-sections/chalkboard/stats";
import ChalkDivider from "../contractor-sections/chalkboard/chalk-divider";
import ChalkServices from "../contractor-sections/chalkboard/services";
import ChalkEstimate from "../contractor-sections/chalkboard/estimate-section";
import ChalkAbout from "../contractor-sections/chalkboard/about";
import ChalkReviews from "../contractor-sections/chalkboard/reviews";
import FAQ from "../contractor-sections/faq";
import ChalkCta from "../contractor-sections/chalkboard/cta-band";
import ChalkContact from "../contractor-sections/chalkboard/contact-form";
import ChalkServiceArea from "../contractor-sections/chalkboard/service-area";
import ChalkFooter from "../contractor-sections/chalkboard/footer";

export default function ChalkboardTemplate(props: ContractorSiteData) {
  return (
    <main style={{ background: "#2A2D2A", minHeight: "100vh" }}>
      <div>
        <ChalkNav businessName={props.businessName} phone={props.phone} hasEstimateWidget={props.hasEstimateWidget} />
        <ChalkHero businessName={props.businessName} city={props.city} phone={props.phone} heroHeadline={props.heroHeadline} tagline={props.tagline} heroCta={props.heroCta} heroImage={null} hasEstimateWidget={props.hasEstimateWidget} yearsInBusiness={props.yearsInBusiness} reviews={props.reviews} urgencyBadge={props.urgencyBadge} />
        <ChalkTrust isLicensed={props.isLicensed} isInsured={props.isInsured} offersFinancing={props.offersFinancing} warrantyYears={props.warrantyYears} yearsInBusiness={props.yearsInBusiness} gafMasterElite={props.gafMasterElite} bbbAccredited={props.bbbAccredited} />
        <ChalkStats yearsInBusiness={props.yearsInBusiness} />
        <ChalkDivider />
        <ChalkServices services={props.services} slug={props.slug} />
        <ChalkDivider />
        <ChalkEstimate hasEstimateWidget={props.hasEstimateWidget} contractorId={props.contractorId} businessName={props.businessName} phone={props.phone} />
        <ChalkAbout businessName={props.businessName} city={props.city} aboutText={props.aboutText} yearsInBusiness={props.yearsInBusiness} />
        <ChalkDivider />
        <ChalkReviews reviews={props.reviews} />
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
          theme="chalkboard"
        />
        <ChalkServiceArea city={props.city} state={props.state} serviceAreaCities={props.serviceAreaCities} />
        <ChalkDivider />
        <ChalkCta phone={props.phone} city={props.city} hasEstimateWidget={props.hasEstimateWidget} />
        <ChalkContact businessName={props.businessName} phone={props.phone} city={props.city} state={props.state} contractorId={props.contractorId} />
        <ChalkFooter businessName={props.businessName} phone={props.phone} city={props.city} state={props.state} services={props.services} />
      </div>
      <FloatingEstimateCTA hasEstimateWidget={props.hasEstimateWidget} phone={props.phone} />
      <FloatingTextUs phone={props.phone} />
    </main>
  );
}
