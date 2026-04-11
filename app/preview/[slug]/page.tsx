// Prospect preview page — THE conversion page for cold email outreach.
// When a prospect clicks the email link, this is what they see:
// their personalized site + a "Claim This Site" banner.
//
// Key differences from /site/[slug]:
// - Only shows prospects (is_prospect = true)
// - Adds ProspectBanner with claim CTA
// - Tracks page views for follow-up intelligence
// - NO platform branding
// - Shows estimate widget (this is the product we're selling)

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Contractor, Site } from "@/lib/types";
import ModernCleanTemplate from "@/components/templates/modern-clean";
import ChalkboardTemplate from "@/components/templates/chalkboard";
import BlueprintTemplate from "@/components/templates/blueprint";
import type { ContractorSiteData } from "@/components/contractor-sections/types";
import { ProspectBanner } from "@/components/prospect/prospect-banner";

// Use service role to read prospect data (bypasses RLS for server component)
function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createAdminSupabase();
  const { data: site } = await supabase
    .from("sites")
    .select("*, contractors!inner(*)")
    .eq("slug", params.slug)
    .eq("published", true)
    .eq("contractors.is_prospect", true)
    .single();

  if (!site) return { title: "Site Not Found" };

  const contractor = site.contractors as unknown as Contractor;
  return {
    title: site.meta_title || `${contractor.business_name} — Roofing in ${contractor.city}, ${contractor.state}`,
    description: site.meta_description || `Professional roofing services in ${contractor.city}, ${contractor.state}. Free estimates, licensed & insured.`,
  };
}

export default async function ProspectPreview({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createAdminSupabase();

  const { data: site } = await supabase
    .from("sites")
    .select("*, contractors!inner(*)")
    .eq("slug", params.slug)
    .eq("published", true)
    .eq("contractors.is_prospect", true)
    .single();

  if (!site) {
    notFound();
  }

  const contractor = site.contractors as unknown as Contractor;
  const siteData = site as unknown as Site;

  // Map database fields → template props
  const templateData: ContractorSiteData = {
    tier: "pro", // Preview sites always show Pro tier to showcase the product
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
    hasEstimateWidget: true, // Show widget — this is what we're selling
    contractorId: contractor.id,
    urgencyBadge: null,
    slug: params.slug,

    // SEO / schema fields
    address: contractor.address,
    zip: contractor.zip,
    logoUrl: contractor.logo_url,
    licenseNumber: contractor.license_number,
    hasAiChatbot: (contractor as any).has_ai_chatbot ?? false,
    businessHours: (contractor as any).business_hours ?? null,
  };

  const template = (siteData as any).template || "modern_clean";

  return (
    <>
      <ProspectBanner
        businessName={contractor.business_name}
        slug={params.slug}
        siteId={site.id}
      />
      {template === "chalkboard" ? (
        <ChalkboardTemplate {...templateData} />
      ) : template === "blueprint" ? (
        <BlueprintTemplate {...templateData} />
      ) : (
        <ModernCleanTemplate {...templateData} />
      )}
    </>
  );
}
