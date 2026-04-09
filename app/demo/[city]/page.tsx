// Demo city landing page — uses mock data instead of database.

import { notFound } from "next/navigation";
import { slugToCity, generateCityContent, cityToSlug } from "@/lib/city-page-content";
import CityPageComponent from "@/components/contractor-sections/city-page";

const DEMO_CITIES = ["Tampa", "St. Petersburg", "Clearwater", "Brandon", "Riverview", "Wesley Chapel"];
const DEMO_SERVICES = ["Roof Replacement", "Roof Repair", "Inspections", "Storm Damage", "Gutters", "Emergency Tarping"];

export default function DemoCityPage({
  params,
}: {
  params: { city: string };
}) {
  const cityName = slugToCity(params.city, DEMO_CITIES);
  if (!cityName) notFound();

  const content = generateCityContent(cityName, {
    businessName: "Pinnacle Roofing Co.",
    city: "Tampa",
    state: "FL",
    warrantyYears: 10,
    yearsInBusiness: 13,
    isLicensed: true,
    isInsured: true,
    offersFinancing: true,
    services: DEMO_SERVICES,
  });

  const otherCities = DEMO_CITIES.filter((c) => cityToSlug(c) !== params.city);

  return (
    <CityPageComponent
      content={content}
      businessName="Pinnacle Roofing Co."
      phone="(813) 555-0192"
      mainCity="Tampa"
      state="FL"
      hasEstimateWidget={true}
      contractorId="demo-001"
      template="modern_clean"
      siteSlug="demo"
      otherCities={otherCities}
      services={DEMO_SERVICES}
    />
  );
}
