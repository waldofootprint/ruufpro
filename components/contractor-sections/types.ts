// Shared types for contractor template sections.
// Every section receives a slice of this data — pulled from the
// contractors + sites tables in Supabase.

export interface ContractorSiteData {
  // Business basics
  businessName: string;
  phone: string;
  city: string;
  state: string;

  // Content
  tagline: string | null;
  heroHeadline: string | null;
  heroCta: string | null;
  heroImage: string | null;
  aboutText: string | null;
  services: string[];
  reviews: { name: string; text: string; rating: number }[];

  // Trust signals (from contractor profile)
  isLicensed: boolean;
  isInsured: boolean;
  gafMasterElite: boolean;
  owensCorningPreferred: boolean;
  certainteedSelect: boolean;
  bbbAccredited: boolean;
  bbbRating: string | null;
  offersFinancing: boolean;
  warrantyYears: number | null;
  yearsInBusiness: number | null;

  // Service area
  serviceAreaCities: string[];

  // Widget
  hasEstimateWidget: boolean;
  contractorId: string;

  // Site meta
  slug: string;

  // SEO / schema fields (from contractor profile, used for JSON-LD)
  address: string | null;
  zip: string | null;
  logoUrl: string | null;
  licenseNumber: string | null;
}
