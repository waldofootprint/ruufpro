import ForgeTemplate from "@/components/templates/forge";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

const mockData: ContractorSiteData = {
  tier: "pro",
  businessName: "Pinnacle Roofing Co.",
  phone: "(813) 555-0192",
  city: "Tampa",
  state: "FL",
  tagline: "Tampa Bay's trusted roofing experts since 2011.",
  heroHeadline: "Your Roof. Done Right.",
  heroSubheadline: null,
  heroCta: "Get Your Free Estimate",
  heroImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  aboutText:
    "We're a family-owned roofing company that's been serving Tampa Bay homeowners for over a decade. Every roof we install is backed by our 10-year workmanship warranty and built with premium materials from trusted manufacturers.",
  services: [
    "Roof Replacement",
    "Roof Repair",
    "Storm Damage Restoration",
    "Roof Inspections",
    "Metal Roofing",
    "Flat Roofing",
  ],
  reviews: [
    {
      name: "Maria G.",
      text: "Pinnacle replaced our entire roof after the hurricane. Fast, professional, and the price was exactly what they quoted. Highly recommend!",
      rating: 5,
    },
    {
      name: "James T.",
      text: "Best roofing company in Tampa. They handled everything with our insurance company and made the process stress-free.",
      rating: 5,
    },
    {
      name: "Sandra K.",
      text: "Had a leak that two other companies couldn't fix. Pinnacle found it in 20 minutes and had it repaired same day. These guys know roofs.",
      rating: 5,
    },
  ],
  isLicensed: true,
  isInsured: true,
  gafMasterElite: true,
  owensCorningPreferred: false,
  certainteedSelect: false,
  bbbAccredited: true,
  bbbRating: "A+",
  offersFinancing: true,
  warrantyYears: 10,
  yearsInBusiness: 13,
  serviceAreaCities: [
    "Tampa",
    "St. Petersburg",
    "Clearwater",
    "Brandon",
    "Riverview",
    "Wesley Chapel",
  ],
  hasEstimateWidget: true,
  contractorId: "demo-001",
  urgencyBadge: null,
  slug: "pinnacle-roofing",
  address: "4521 W Kennedy Blvd",
  zip: "33609",
  logoUrl: null,
  licenseNumber: "CCC1330456",
  hasAiChatbot: false,
  businessHours: null,
};

export default function ForgeDemoPage() {
  return <ForgeTemplate {...mockData} />;
}
