// City page content generator.
// Auto-generates localized SEO pages for each city in serviceAreaCities.
// Zero manual effort per roofer — content is interpolated from contractor data.

export interface CityPageContent {
  slug: string;
  cityName: string;
  headline: string;
  paragraphs: string[];
  checkmarks: string[];
}

/** Convert city name to URL slug: "St. Petersburg" → "st-petersburg" */
export function cityToSlug(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/[.']/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Find city name from slug by matching against serviceAreaCities */
export function slugToCity(slug: string, cities: string[]): string | null {
  return cities.find((c) => cityToSlug(c) === slug) || null;
}

interface ContentVars {
  businessName: string;
  city: string; // main city
  state: string;
  warrantyYears: number | null;
  yearsInBusiness: number | null;
  isLicensed: boolean;
  isInsured: boolean;
  offersFinancing: boolean;
}

export function generateCityContent(
  cityName: string,
  vars: ContentVars
): CityPageContent {
  const slug = cityToSlug(cityName);

  const headline = `Professional Roofing in ${cityName}, ${vars.state}`;

  const paragraphs = [
    `${vars.businessName} provides expert roofing services to homeowners and businesses in ${cityName}. From roof replacements and repairs to storm damage restoration, our ${vars.isLicensed ? "licensed and " : ""}${vars.isInsured ? "insured " : ""}team delivers quality workmanship${vars.warrantyYears ? ` backed by a ${vars.warrantyYears}-year warranty` : ""}.`,

    `As a locally owned company serving the greater ${vars.city} area, we understand ${cityName}'s unique roofing challenges — from intense heat and UV exposure to storm-season damage. We use premium materials rated for your local climate and stand behind every job.`,

    `Whether you need an emergency repair, a full roof replacement, or just a professional inspection, ${vars.businessName} is ${cityName}'s trusted choice. Get a free estimate today — no obligation, no pressure, just straight answers and a clear quote.`,
  ];

  const checkmarks: string[] = [];
  if (vars.isLicensed) checkmarks.push(`Licensed in ${vars.state}`);
  if (vars.isInsured) checkmarks.push("Fully Insured");
  if (vars.warrantyYears) checkmarks.push(`${vars.warrantyYears}-Year Warranty`);
  checkmarks.push("Free Estimates");
  if (vars.offersFinancing) checkmarks.push("Financing Available");
  if (vars.yearsInBusiness) checkmarks.push(`${vars.yearsInBusiness}+ Years Experience`);

  return { slug, cityName, headline, paragraphs, checkmarks };
}
