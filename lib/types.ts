// TypeScript types matching our Supabase schema.
// These keep our code type-safe — if you reference a column
// that doesn't exist, TypeScript catches it before runtime.

export type BusinessType = "storm_insurance" | "residential" | "full_service";

export type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";

export type LeadSource = "contact_form" | "estimate_widget" | "external_widget" | "ai_chatbot";

export type LeadStatus = "new" | "contacted" | "appointment_set" | "quoted" | "won" | "completed" | "lost";

export type LeadTimeline = "no_timeline" | "1_3_months" | "now";

export type FinancingInterest = "yes" | "no" | "maybe";

export type LeadTemperature = "hot" | "warm" | "browsing";

// Contractor plan tiers — derived from feature flags, not stored in DB.
// Free: basic website only
// Pro ($149): everything — widget, Riley, reviews, city pages, connect your domain, CRM
export type ContractorTier = "free" | "pro";

export function getTierFromContractor(contractor: Pick<Contractor, "has_estimate_widget">): ContractorTier {
  if (contractor.has_estimate_widget) return "pro";
  return "free";
}

export interface Contractor {
  id: string;
  user_id: string;
  email: string;
  business_name: string;
  phone: string;
  city: string;
  state: string;
  zip: string | null;
  address: string | null;
  business_type: BusinessType;

  // Optional profile fields
  tagline: string | null;
  logo_url: string | null;
  service_area_cities: string[] | null;
  years_in_business: number | null;
  license_number: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  business_hours: string | null;
  webhook_enabled: boolean;
  webhook_url: string | null;

  // Trust signal checkboxes
  is_licensed: boolean;
  is_insured: boolean;
  gaf_master_elite: boolean;
  owens_corning_preferred: boolean;
  certainteed_select: boolean;
  bbb_accredited: boolean;
  bbb_rating: string | null;
  offers_financing: boolean;
  warranty_years: number | null;

  // Paid services
  has_estimate_widget: boolean;
  has_review_automation: boolean;
  has_auto_reply: boolean;
  has_seo_pages: boolean;
  has_custom_domain: boolean;
  custom_domain: string | null;
  has_ai_chatbot: boolean;

  // Billing
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;

  // Site ownership
  has_roofready_site: boolean;
  external_site_url: string | null;

  // SMS & 10DLC
  google_review_url: string | null;
  sms_enabled: boolean;
  missed_call_textback_enabled: boolean;
  review_request_enabled: boolean;
  legal_entity_type: 'sole_proprietor' | 'llc' | 'corporation' | 'partnership';
  ein: string | null;

  created_at: string;
  updated_at: string;
}

export type TemplateId = "modern_clean" | "bold_confident" | "warm_trustworthy" | "chalkboard" | "blueprint" | "residential" | "classic" | "clean_professional" | "forge" | "bold_dark";

export interface Site {
  id: string;
  contractor_id: string;
  slug: string;
  template: TemplateId;
  published: boolean;

  // Content (all optional — smart defaults used when empty)
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_cta_text: string | null;
  about_text: string | null;
  services: string[] | null;
  gallery_images: string[] | null;
  reviews: Review[];

  // SEO
  meta_title: string | null;
  meta_description: string | null;

  created_at: string;
  updated_at: string;
}

export interface Review {
  name: string;
  text: string;
  rating: number;
}

export interface EstimateMaterialEntry {
  material: string;
  tier: string;
  label: string;
  price_low: number;
  price_high: number;
  warranty: string;
  lifespan: string;
}

export interface Lead {
  id: string;
  contractor_id: string;
  site_id: string | null;

  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  message: string | null;

  source: LeadSource;
  status: LeadStatus;

  // Estimate data (if from widget)
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_material: string | null;
  estimate_roof_sqft: number | null;
  estimate_materials: EstimateMaterialEntry[] | null;
  living_estimate_id: string | null;
  property_data_id: string | null;

  // Lead qualification (from widget)
  timeline: LeadTimeline | null;
  financing_interest: FinancingInterest | null;

  // Speed-to-lead tracking
  contacted_at: string | null;

  // Notes (roofer's free-text notes on this lead)
  notes: string | null;

  // Roof intel (from estimate engine)
  estimate_pitch_degrees: number | null;
  estimate_segments: number | null;

  created_at: string;
}

export interface ChatbotConfig {
  // Tier 1: Top 5 homeowner questions
  price_range_low: number | null;
  price_range_high: number | null;
  offers_free_inspection: boolean;
  typical_timeline_days: string | null;
  materials_brands: string[] | null;
  process_steps: string | null;

  // Tier 2: Insurance, financing, warranty, emergency
  does_insurance_work: boolean;
  insurance_description: string | null;
  financing_provider: string | null;
  financing_terms: string | null;
  warranty_description: string | null;
  emergency_available: boolean;
  emergency_description: string | null;

  // Tier 3: Stickiness / differentiation
  custom_faqs: Array<{ q: string; a: string }> | null;
  differentiators: string | null;
  team_description: string | null;
  payment_methods: string[] | null;
  current_promotions: string | null;
  referral_program: string | null;
}

export interface EstimateSettings {
  id: string;
  contractor_id: string;

  asphalt_low: number | null;
  asphalt_high: number | null;
  metal_low: number | null;
  metal_high: number | null;
  tile_low: number | null;
  tile_high: number | null;
  flat_low: number | null;
  flat_high: number | null;

  service_zips: string[] | null;

  created_at: string;
  updated_at: string;
}
