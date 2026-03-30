// Blueprint template — cool white + slate blue accent.
// Clean, trustworthy, professional. Plus Jakarta Sans.

import type { ContractorSiteData } from "../contractor-sections/types";
import BlueprintNav from "../contractor-sections/blueprint/nav";
import BlueprintHero from "../contractor-sections/blueprint/hero";
import BlueprintFeatures from "../contractor-sections/blueprint/features";
import BlueprintServices from "../contractor-sections/blueprint/services";
import BlueprintEstimate from "../contractor-sections/blueprint/estimate-section";
import BlueprintAbout from "../contractor-sections/blueprint/about";
import BlueprintReviews from "../contractor-sections/blueprint/reviews";
import BlueprintServiceArea from "../contractor-sections/blueprint/service-area";
import BlueprintCta from "../contractor-sections/blueprint/cta-band";
import BlueprintContact from "../contractor-sections/blueprint/contact-form";
import BlueprintFooter from "../contractor-sections/blueprint/footer";

export default function BlueprintTemplate(props: ContractorSiteData) {
  return (
    <div style={{ background: "#F5F7FA", minHeight: "100vh" }}>
      <BlueprintNav businessName={props.businessName} phone={props.phone} hasEstimateWidget={props.hasEstimateWidget} />
      <BlueprintHero businessName={props.businessName} city={props.city} phone={props.phone} heroHeadline={props.heroHeadline} tagline={props.tagline} heroCta={props.heroCta} heroImage={null} hasEstimateWidget={props.hasEstimateWidget} yearsInBusiness={props.yearsInBusiness} />
      <BlueprintFeatures isInsured={props.isInsured} offersFinancing={props.offersFinancing} warrantyYears={props.warrantyYears} />
      <BlueprintServices services={props.services} />
      <BlueprintEstimate hasEstimateWidget={props.hasEstimateWidget} contractorId={props.contractorId} businessName={props.businessName} phone={props.phone} />
      <BlueprintAbout businessName={props.businessName} city={props.city} aboutText={props.aboutText} yearsInBusiness={props.yearsInBusiness} />
      <BlueprintReviews reviews={props.reviews} />
      <BlueprintServiceArea city={props.city} state={props.state} serviceAreaCities={props.serviceAreaCities} />
      <BlueprintCta phone={props.phone} city={props.city} hasEstimateWidget={props.hasEstimateWidget} />
      <BlueprintContact businessName={props.businessName} phone={props.phone} city={props.city} state={props.state} contractorId={props.contractorId} />
      <BlueprintFooter businessName={props.businessName} phone={props.phone} city={props.city} state={props.state} services={props.services} />
    </div>
  );
}
