// Contractor site page — renders the roofer's website from database data.
//
// Flow:
// 1. Visitor goes to "joes-roofing.ruufpro.com"
// 2. Middleware rewrites to "/site/joes-roofing"
// 3. This page fetches site + contractor data from Supabase
// 4. Renders the appropriate template with that data

import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Contractor, Site } from "@/lib/types";
import ModernCleanTemplate from "@/components/templates/modern-clean";
import ChalkboardTemplate from "@/components/templates/chalkboard";
import BlueprintTemplate from "@/components/templates/blueprint";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createServerSupabase();
  const { data: site } = await supabase
    .from("sites")
    .select("*, contractors(*)")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!site) return { title: "Site Not Found" };

  const contractor = site.contractors as unknown as Contractor;
  return {
    title: site.meta_title || `${contractor.business_name} — Roofing in ${contractor.city}, ${contractor.state}`,
    description: site.meta_description || `Professional roofing services in ${contractor.city}, ${contractor.state}. Free estimates, licensed & insured.`,
  };
}

export default async function ContractorSite({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabase();

  const { data: site } = await supabase
    .from("sites")
    .select("*, contractors(*)")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!site) {
    notFound();
  }

  const contractor = site.contractors as unknown as Contractor;
  const siteData = site as unknown as Site;

  // Map database fields → template props
  const templateData: ContractorSiteData = {
    businessName: contractor.business_name,
    phone: contractor.phone,
    city: contractor.city,
    state: contractor.state,
    tagline: contractor.tagline,
    heroHeadline: siteData.hero_headline,
    heroCta: siteData.hero_cta_text,
    heroImage: null, // TODO: add hero_image to sites table
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
    slug: params.slug,
  };

  // Choose template based on site.template field
  const template = (siteData as any).template || "modern_clean";

  if (template === "chalkboard") {
    return <ChalkboardTemplate {...templateData} />;
  }

  if (template === "blueprint") {
    return <BlueprintTemplate {...templateData} />;
  }

  return <ModernCleanTemplate {...templateData} />;
}
