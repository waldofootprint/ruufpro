// Chalkboard template v2 — dark green-gray with chalk accents.
// Fredericka the Great headlines + Kalam body.
// Cards, containers, alternating backgrounds, visual richness.

import type { ContractorSiteData } from "../contractor-sections/types";
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
    <main style={{ background: "#2A2D2A", minHeight: "100vh", position: "relative" }}>
      {/* Chalkboard texture overlay */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          opacity: 0.6, zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <ChalkNav businessName={props.businessName} phone={props.phone} hasEstimateWidget={props.hasEstimateWidget} />
        <ChalkHero businessName={props.businessName} city={props.city} phone={props.phone} heroHeadline={props.heroHeadline} tagline={props.tagline} heroCta={props.heroCta} heroImage={null} hasEstimateWidget={props.hasEstimateWidget} yearsInBusiness={props.yearsInBusiness} />
        <ChalkTrust isLicensed={props.isLicensed} isInsured={props.isInsured} offersFinancing={props.offersFinancing} warrantyYears={props.warrantyYears} yearsInBusiness={props.yearsInBusiness} gafMasterElite={props.gafMasterElite} bbbAccredited={props.bbbAccredited} />
        <ChalkStats yearsInBusiness={props.yearsInBusiness} />
        <ChalkDivider />
        <ChalkServices services={props.services} />
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
    </main>
  );
}
