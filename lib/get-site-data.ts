// Shared data-fetching for contractor site pages.
// Used by both the homepage (/site/[slug]) and sub-pages (/site/[slug]/services).

import { createServerSupabase } from "@/lib/supabase-server";
import type { Contractor, Site } from "@/lib/types";
import { getTierFromContractor } from "@/lib/types";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

export interface SiteDataResult {
  site: Site;
  contractor: Contractor;
  templateData: ContractorSiteData;
}

export async function getSiteData(slug: string): Promise<SiteDataResult | null> {
  const supabase = createServerSupabase();

  const { data: site } = await supabase
    .from("sites")
    .select("*, contractors(*)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!site) return null;

  const contractor = site.contractors as unknown as Contractor;
  const siteData = site as unknown as Site;

  const templateData: ContractorSiteData = {
    tier: getTierFromContractor(contractor),
    businessName: contractor.business_name,
    phone: contractor.phone,
    city: contractor.city,
    state: contractor.state,
    tagline: contractor.tagline,
    heroHeadline: siteData.hero_headline,
    heroSubheadline: siteData.hero_subheadline || null,
    heroCta: siteData.hero_cta_text,
    heroImage: null,
    aboutText: siteData.about_text,
    services: siteData.services || [],
    reviews: siteData.reviews || [],
    isLicensed: contractor.is_licensed,
    isInsured: contractor.is_insured,
    gafMasterElite: contractor.gaf_master_elite,
    owensCorningPreferred: contractor.owens_corning_preferred,
    certainteedSelect: contractor.certainteed_select,
    bbbAccredited: contractor.bbb_accredited,
    bbbRating: contractor.bbb_rating,
    offersFinancing: contractor.offers_financing,
    warrantyYears: contractor.warranty_years,
    yearsInBusiness: contractor.years_in_business,
    serviceAreaCities: contractor.service_area_cities || [],
    hasEstimateWidget: contractor.has_estimate_widget,
    contractorId: contractor.id,
    urgencyBadge: null, // defaults handled in hero components
    slug,

    // SEO / schema fields
    address: contractor.address,
    zip: contractor.zip,
    logoUrl: contractor.logo_url,
    licenseNumber: contractor.license_number,
  };

  return { site: siteData, contractor, templateData };
}
