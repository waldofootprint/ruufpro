// Shared types for contractor template sections.
// Every section receives a slice of this data — pulled from the
// contractors + sites tables in Supabase.

import type { ContractorTier } from "@/lib/types";

export interface ContractorSiteData {
  // Plan tier — derived from feature flags, controls what sections render
  tier: ContractorTier;

  // Business basics
  businessName: string;
  phone: string;
  city: string;
  state: string;

  // Content
  tagline: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
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
  hasAiChatbot: boolean;
  chatGreeting?: string | null;
  contractorId: string;

  // Conversion
  urgencyBadge: string | null;

  // Site meta
  slug: string;

  // SEO / schema fields (from contractor profile, used for JSON-LD)
  address: string | null;
  zip: string | null;
  logoUrl: string | null;
  licenseNumber: string | null;

  // Business hours (from contractor profile, used for chatbot)
  businessHours: Record<string, { open: string; close: string } | null> | null;
}
