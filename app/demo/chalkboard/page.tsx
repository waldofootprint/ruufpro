import ChalkboardTemplate from "@/components/templates/chalkboard";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

const mockData: ContractorSiteData = {
  tier: "pro",
  businessName: "Summit Roofing & Restoration",
  phone: "(615) 555-0234",
  city: "Nashville",
  state: "TN",
  tagline: "Nashville's storm damage specialists — trusted since 2008.",
  heroHeadline: "Roofing That Stands the Test of Time.",
  heroSubheadline: null,
  heroCta: "Get Your Free Inspection",
  heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  aboutText:
    "Summit Roofing was born out of the 2008 Nashville tornado season. We saw our neighbors struggling with insurance claims and contractors who disappeared after cashing the check. We decided to do it differently — honest work, fair pricing, and a handshake you can count on.",
  services: [
    "Storm Damage Repair",
    "Roof Replacement",
    "Insurance Claims",
    "Roof Inspections",
    "Gutter Installation",
    "Siding Repair",
  ],
  reviews: [
    {
      name: "Robert M.",
      text: "Summit handled our entire insurance claim after the hailstorm. They got us a brand new roof and we barely had to lift a finger. Can't recommend them enough.",
      rating: 5,
    },
    {
      name: "Patricia L.",
      text: "We've used Summit three times now — roof, gutters, and siding. Always on time, always on budget. They treat your home like it's their own.",
      rating: 5,
    },
    {
      name: "David W.",
      text: "Best roofer in Nashville, hands down. They found damage our insurance adjuster missed and got us an additional $8,000 for repairs.",
      rating: 5,
    },
  ],
  isLicensed: true,
  isInsured: true,
  gafMasterElite: false,
  owensCorningPreferred: true,
  certainteedSelect: false,
  bbbAccredited: true,
  bbbRating: "A+",
  offersFinancing: true,
  warrantyYears: 15,
  yearsInBusiness: 18,
  serviceAreaCities: [
    "Nashville",
    "Franklin",
    "Murfreesboro",
    "Brentwood",
    "Hendersonville",
    "Lebanon",
  ],
  hasEstimateWidget: true,
  contractorId: "demo-002",
  urgencyBadge: null,
  slug: "summit-roofing",
  address: "1200 Broadway",
  zip: "37203",
  logoUrl: null,
  licenseNumber: "TN-RC-78234",
  hasAiChatbot: false,
  galleryImages: [],
  businessHours: null,
};

export default function ChalkboardDemoPage() {
  return <ChalkboardTemplate {...mockData} />;
}
