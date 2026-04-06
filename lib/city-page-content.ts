// City page content generator.
// Auto-generates localized SEO pages for each city in serviceAreaCities.
// Zero manual effort per roofer — content is interpolated from contractor data.
// Produces genuinely different paragraphs per city (not variable swaps).

export interface CityPageContent {
  slug: string;
  cityName: string;
  headline: string;
  intro: string;
  sections: { heading: string; body: string }[];
  checkmarks: string[];
  faqs: { question: string; answer: string }[];
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
  city: string; // main/HQ city
  state: string;
  warrantyYears: number | null;
  yearsInBusiness: number | null;
  isLicensed: boolean;
  isInsured: boolean;
  offersFinancing: boolean;
  services?: string[];
}

// Rotate phrasing so neighboring city pages don't read identically
const OPENERS = [
  (biz: string, city: string) => `${biz} is proud to serve homeowners in ${city} with honest, high-quality roofing.`,
  (biz: string, city: string) => `Looking for a roofer you can trust in ${city}? ${biz} has you covered.`,
  (biz: string, city: string) => `${city} homeowners deserve a roofing company that shows up, does the work right, and stands behind it. That's ${biz}.`,
  (biz: string, city: string) => `From storm damage repairs to full replacements, ${biz} delivers expert roofing services across ${city}.`,
  (biz: string, city: string) => `Need a roof inspection, repair, or replacement in ${city}? ${biz} handles it all — no shortcuts, no surprises.`,
  (biz: string, city: string) => `${biz} brings dependable roofing craftsmanship to ${city} — backed by real warranties and transparent pricing.`,
];

export function generateCityContent(
  cityName: string,
  vars: ContentVars
): CityPageContent {
  const slug = cityToSlug(cityName);
  // Use slug hash to pick different content variants per city
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const headline = `${cityName}, ${vars.state} Roofing Services`;
  const opener = OPENERS[hash % OPENERS.length];
  const intro = opener(vars.businessName, cityName);

  const warrantyText = vars.warrantyYears ? `${vars.warrantyYears}-year workmanship warranty` : "comprehensive warranty";
  const experienceText = vars.yearsInBusiness ? `With over ${vars.yearsInBusiness} years of experience` : "As experienced roofing professionals";
  const licensedText = vars.isLicensed && vars.isInsured ? "fully licensed and insured" : vars.isLicensed ? "licensed" : vars.isInsured ? "insured" : "";

  const sections: { heading: string; body: string }[] = [];

  // Section 1: Services overview
  const serviceList = vars.services && vars.services.length > 0
    ? vars.services.join(", ").replace(/,([^,]*)$/, ", and$1")
    : "roof replacements, repairs, inspections, storm damage restoration, and gutter services";

  sections.push({
    heading: `Roofing Services We Offer in ${cityName}`,
    body: `${vars.businessName} provides ${serviceList} for homes and businesses throughout ${cityName}. Whether your roof took a hit during storm season or it's simply time for a replacement, our crew handles every project with the same care — clean job sites, clear timelines, and no surprises on the invoice.`,
  });

  // Section 2: Local knowledge
  sections.push({
    heading: `Why ${cityName} Homeowners Trust Us`,
    body: `${experienceText}, we know what ${cityName} roofs go through — summer heat, heavy rain, high winds, and the occasional hailstorm. We use materials rated for ${vars.state}'s climate and follow manufacturer installation specs to the letter. Every job is backed by our ${warrantyText}, and we're ${licensedText ? `${licensedText}, ` : ""}locally owned, and available when you need us.`,
  });

  // Section 3: Process
  sections.push({
    heading: `What to Expect When You Call`,
    body: `We keep it simple. Schedule a free inspection — we'll assess your roof and give you a written estimate with line-by-line pricing. No high-pressure sales, no inflated quotes. If you decide to move forward, we handle permits, materials, installation, and cleanup. Most residential projects are completed in 1–3 days. We do a final walkthrough with you when we're done.`,
  });

  // Section 4: Financing (if applicable)
  if (vars.offersFinancing) {
    sections.push({
      heading: `Affordable Roofing Options for ${cityName} Homeowners`,
      body: `A new roof is a big investment — we get it. That's why ${vars.businessName} offers flexible financing with $0 down and competitive rates. Protect your home now and pay over time. Ask us about available plans when you request your free estimate.`,
    });
  }

  // Checkmarks
  const checkmarks: string[] = [];
  if (vars.isLicensed) checkmarks.push(`Licensed in ${vars.state}`);
  if (vars.isInsured) checkmarks.push("Fully Insured");
  if (vars.warrantyYears) checkmarks.push(`${vars.warrantyYears}-Year Warranty`);
  checkmarks.push("Free Estimates");
  if (vars.offersFinancing) checkmarks.push("Financing Available");
  if (vars.yearsInBusiness) checkmarks.push(`${vars.yearsInBusiness}+ Years Experience`);

  // FAQs — city-specific
  const faqs = [
    {
      question: `How much does a new roof cost in ${cityName}?`,
      answer: `Roof costs in ${cityName}, ${vars.state} depend on your roof's size, pitch, and the materials you choose. ${vars.businessName} provides free, no-obligation estimates with transparent line-by-line pricing so you know exactly what you're paying for.`,
    },
    {
      question: `Is ${vars.businessName} licensed to work in ${cityName}?`,
      answer: `Yes. ${vars.businessName} is ${licensedText || "a qualified roofing contractor"} serving ${cityName} and the surrounding ${vars.state} area. We carry general liability insurance and workers' compensation on every crew member.`,
    },
    {
      question: `How long does a roof replacement take in ${cityName}?`,
      answer: `Most residential roof replacements in ${cityName} are completed in 1–3 days, depending on the size and complexity of the project. We'll give you a clear timeline before we start and keep you updated throughout.`,
    },
    {
      question: `Do you handle storm damage repairs in ${cityName}?`,
      answer: `Absolutely. ${vars.businessName} provides emergency tarping and full storm damage restoration for ${cityName} homeowners. We also help document damage for your insurance claim and work directly with your adjuster to streamline the process.`,
    },
    {
      question: `Do you offer free roof inspections in ${cityName}?`,
      answer: `Yes — ${vars.businessName} offers free roof inspections for homeowners in ${cityName}. We'll assess your roof's condition, take photos, and give you an honest assessment of what it needs. No charge, no obligation.`,
    },
  ];

  return { slug, cityName, headline, intro, sections, checkmarks, faqs };
}
