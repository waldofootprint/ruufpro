import BlueprintTemplate from "@/components/templates/blueprint";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

const mockData: ContractorSiteData = {
  tier: "pro",
  businessName: "Precision Roofing Solutions",
  phone: "(303) 555-0178",
  city: "Denver",
  state: "CO",
  tagline: "Engineered for Colorado's toughest weather.",
  heroHeadline: "Precision-Built Roofs for Every Season.",
  heroSubheadline: null,
  heroCta: "Schedule Your Free Estimate",
  heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  aboutText:
    "Precision Roofing was founded by two structural engineers who got tired of seeing shoddy roofing work in Colorado. We bring an engineer's eye to every project — measuring twice, cutting once, and building roofs that handle 60mph winds and 2 feet of snow without breaking a sweat.",
  services: [
    "Residential Roof Replacement",
    "Commercial Roofing",
    "Roof Inspections",
    "Snow & Ice Damage Repair",
    "Metal Roofing",
    "Energy-Efficient Upgrades",
  ],
  reviews: [
    {
      name: "Michael R.",
      text: "These guys are engineers first, roofers second. They found structural issues that three other companies missed. Our new roof survived the worst hailstorm in 20 years without a scratch.",
      rating: 5,
    },
    {
      name: "Karen S.",
      text: "Professional from start to finish. They showed up with blueprints and measurements, explained everything, and finished a day ahead of schedule.",
      rating: 5,
    },
    {
      name: "Tom B.",
      text: "Worth every penny. Our energy bills dropped 15% after they installed the new roof with proper ventilation. These guys know the science.",
      rating: 5,
    },
  ],
  isLicensed: true,
  isInsured: true,
  gafMasterElite: true,
  owensCorningPreferred: true,
  certainteedSelect: false,
  bbbAccredited: true,
  bbbRating: "A+",
  offersFinancing: true,
  warrantyYears: 20,
  yearsInBusiness: 9,
  serviceAreaCities: [
    "Denver",
    "Aurora",
    "Lakewood",
    "Arvada",
    "Boulder",
    "Centennial",
  ],
  hasEstimateWidget: true,
  contractorId: "demo-003",
  urgencyBadge: null,
  slug: "precision-roofing",
  address: "2100 Champa St",
  zip: "80205",
  logoUrl: null,
  licenseNumber: "CO-RF-45612",
  hasAiChatbot: false,
  galleryImages: [],
  businessHours: null,
};

export default function BlueprintDemoPage() {
  return <BlueprintTemplate {...mockData} />;
}
