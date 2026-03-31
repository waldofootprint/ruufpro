// Shared FAQ generation — used by both the FAQ section component (client)
// and the JSON-LD FAQPage schema builder (server).
// No "use client" or "use server" directive so it works in both environments.

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqInput {
  businessName: string;
  city: string;
  state: string;
  services: string[];
  serviceAreaCities: string[];
  offersFinancing: boolean;
  isLicensed: boolean;
  isInsured: boolean;
  yearsInBusiness: number | null;
}

export function generateFaqItems(input: FaqInput): FaqItem[] {
  const {
    businessName,
    city,
    state,
    services,
    serviceAreaCities,
    offersFinancing,
    isLicensed,
    isInsured,
    yearsInBusiness,
  } = input;

  const serviceList = services.length > 0
    ? services.join(", ")
    : "roof replacement, roof repair, and inspections";

  const areaList = serviceAreaCities.length > 0
    ? serviceAreaCities.join(", ")
    : `${city} and surrounding areas`;

  const faqs: FaqItem[] = [
    {
      question: `How much does a roof replacement cost in ${city}?`,
      answer: `Roof replacement costs in ${city}, ${state} vary based on your roof size, pitch, and the materials you choose. ${businessName} provides free, no-obligation estimates so you get an accurate price for your specific home — not a generic range. Contact us to schedule a free inspection and estimate.`,
    },
    {
      question: `What roofing services does ${businessName} provide?`,
      answer: `${businessName} offers ${serviceList} for homeowners in ${city} and the surrounding area. Whether you need a full replacement after storm damage or a small repair to stop a leak, we handle it all.`,
    },
    {
      question: `Is ${businessName} licensed and insured?`,
      answer: isLicensed && isInsured
        ? `Yes. ${businessName} is fully licensed and insured. This protects you from liability during the project and guarantees our work meets all local building codes in ${city}, ${state}.`
        : isLicensed
        ? `Yes, ${businessName} is licensed and meets all local building codes in ${city}, ${state}. Contact us for details about our coverage and credentials.`
        : `${businessName} is committed to quality work and serving ${city} homeowners with integrity. Contact us to learn more about our credentials.`,
    },
    {
      question: `What areas does ${businessName} serve?`,
      answer: `We serve homeowners across ${areaList}. If you're in ${state} and aren't sure if you're in our service area, give us a call — we're happy to check.`,
    },
    {
      question: `Do you offer financing for roofing projects?`,
      answer: offersFinancing
        ? `Yes! ${businessName} offers flexible financing options to help ${city} homeowners get the roof they need without the upfront burden. Ask us about available plans when you request your free estimate.`
        : `${businessName} works with homeowners to find payment options that fit their budget. Contact us to discuss what options are available for your project.`,
    },
    {
      question: `How long does a roof replacement take?`,
      answer: `Most residential roof replacements are completed in 1–3 days, depending on the size and complexity of your roof. ${businessName} keeps you informed every step of the way and always cleans up the job site when we're done.`,
    },
    {
      question: `Why should I choose ${businessName}?`,
      answer: buildWhyUsAnswer(input),
    },
  ];

  return faqs;
}

function buildWhyUsAnswer(input: FaqInput): string {
  const parts: string[] = [];

  if (input.yearsInBusiness && input.yearsInBusiness > 0) {
    parts.push(`over ${input.yearsInBusiness} years of experience`);
  }
  if (input.isLicensed) parts.push("full licensing");
  if (input.isInsured) parts.push("comprehensive insurance");

  const credentials = parts.length > 0
    ? `With ${parts.join(", ")}, `
    : "";

  return `${credentials}${input.businessName} has built a reputation in ${input.city} for honest work, fair pricing, and roofs that last. We provide free inspections, written estimates, and stand behind every job we do.`;
}
