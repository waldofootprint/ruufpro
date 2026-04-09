// Demo services listing page — uses mock data instead of database.

import { getServicesForContractor } from "@/lib/service-page-content";
import ServicesPageContent from "@/components/contractor-sections/services-page";

const DEMO = {
  businessName: "Pinnacle Roofing Co.",
  phone: "(813) 555-0192",
  city: "Tampa",
  state: "FL",
  services: ["Roof Replacement", "Roof Repair", "Inspections", "Storm Damage", "Gutters", "Emergency Tarping"],
};

export default function DemoServicesPage() {
  const services = getServicesForContractor(DEMO.services, {
    city: DEMO.city,
    businessName: DEMO.businessName,
    state: DEMO.state,
  });

  return (
    <ServicesPageContent
      services={services.map((svc) => ({
        slug: svc.slug,
        name: svc.name,
        headline: svc.interpolated.headline,
        excerpt: svc.interpolated.paragraphs[0],
        subServices: svc.subServices,
      }))}
      businessName={DEMO.businessName}
      phone={DEMO.phone}
      city={DEMO.city}
      state={DEMO.state}
      hasEstimateWidget={true}
      template="modern_clean"
      siteSlug="demo"
      serviceNames={DEMO.services}
      serviceAreaCities={["Tampa", "St. Petersburg", "Clearwater", "Brandon", "Riverview", "Wesley Chapel"]}
    />
  );
}
