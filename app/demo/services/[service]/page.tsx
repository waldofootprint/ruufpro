// Demo service detail page — uses mock data instead of database.

import { notFound } from "next/navigation";
import {
  getServiceContent,
  interpolateContent,
  getServicesForContractor,
} from "@/lib/service-page-content";
import ServiceDetailContent from "@/components/contractor-sections/service-detail-page";

const DEMO = {
  businessName: "Pinnacle Roofing Co.",
  phone: "(813) 555-0192",
  city: "Tampa",
  state: "FL",
  services: ["Roof Replacement", "Roof Repair", "Inspections", "Storm Damage", "Gutters", "Emergency Tarping"],
};

export default function DemoServicePage({
  params,
}: {
  params: { service: string };
}) {
  const entry = getServiceContent(params.service);
  if (!entry) notFound();

  const vars = { city: DEMO.city, businessName: DEMO.businessName, state: DEMO.state };
  const headline = interpolateContent(entry.headline, vars);
  const paragraphs = entry.paragraphs.map((p) => interpolateContent(p, vars));

  const allServices = getServicesForContractor(DEMO.services, vars);
  const relatedServices = allServices
    .filter((s) => s.slug !== entry.slug)
    .slice(0, 3);

  return (
    <ServiceDetailContent
      serviceName={entry.name}
      serviceSlug={entry.slug}
      headline={headline}
      paragraphs={paragraphs}
      subServices={entry.subServices}
      relatedServices={relatedServices.map((s) => ({
        slug: s.slug,
        name: s.name,
        headline: s.interpolated.headline,
      }))}
      businessName={DEMO.businessName}
      phone={DEMO.phone}
      city={DEMO.city}
      state={DEMO.state}
      hasEstimateWidget={true}
      template="modern_clean"
      siteSlug="demo"
      services={DEMO.services}
      serviceAreaCities={["Tampa", "St. Petersburg", "Clearwater", "Brandon", "Riverview", "Wesley Chapel"]}
    />
  );
}
