import ClassicTemplate from "@/components/templates/classic";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

const mockData: ContractorSiteData = {
  tier: "pro",
  businessName: "Heritage Roofing Co.",
  phone: "(214) 555-0312",
  city: "Dallas",
  state: "TX",
  tagline: "Four generations of trusted roofing in North Texas.",
  heroHeadline: "The Roofer Your Neighbors Recommend.",
  heroSubheadline: null,
  heroCta: "Get a Free Quote Today",
  heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  aboutText:
    "Heritage Roofing has been a Dallas institution since 1962. Started by our grandfather with a ladder and a handshake, we've grown into North Texas's most trusted roofing company. Four generations later, we still answer every call personally and treat every home like it's our own.",
  services: [
    "Roof Replacement",
    "Roof Repair",
    "Roof Inspections",
    "Gutters & Downspouts",
    "Attic Insulation",
    "Emergency Repairs",
  ],
  reviews: [
    {
      name: "Jennifer A.",
      text: "Heritage reroofed our 1940s Craftsman and it looks absolutely beautiful. They understood the character of the home and matched everything perfectly.",
      rating: 5,
    },
    {
      name: "William H.",
      text: "My parents used Heritage in the 80s, I used them last year. Same quality, same honesty. That says everything you need to know.",
      rating: 5,
    },
    {
      name: "Lisa M.",
      text: "Emergency repair on a Sunday afternoon — they were there in 45 minutes. Patched the leak and came back Monday to do the full repair. Old-school service.",
      rating: 5,
    },
  ],
  isLicensed: true,
  isInsured: true,
  gafMasterElite: false,
  owensCorningPreferred: false,
  certainteedSelect: true,
  bbbAccredited: true,
  bbbRating: "A+",
  offersFinancing: false,
  warrantyYears: 25,
  yearsInBusiness: 64,
  serviceAreaCities: [
    "Dallas",
    "Fort Worth",
    "Plano",
    "Arlington",
    "Frisco",
    "McKinney",
  ],
  hasEstimateWidget: true,
  contractorId: "demo-004",
  urgencyBadge: null,
  slug: "heritage-roofing",
  address: "3400 Oak Lawn Ave",
  zip: "75219",
  logoUrl: null,
  licenseNumber: "TX-RF-112890",
  hasAiChatbot: false,
  businessHours: null,
};

export default function ClassicDemoPage() {
  return <ClassicTemplate {...mockData} />;
}
