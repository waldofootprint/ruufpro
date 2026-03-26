// This page renders a contractor's site.
//
// How the data flows:
// 1. Visitor goes to "joes-roofing.roofready.com"
// 2. Middleware rewrites to "/site/joes-roofing"
// 3. This page receives { params: { slug: "joes-roofing" } }
// 4. We query Supabase for the site + contractor data matching that slug
// 5. We merge the data with smart defaults (so the site looks complete
//    even if the roofer only entered 4 fields during onboarding)
// 6. We render the appropriate template based on business type

import { createServerSupabase } from "@/lib/supabase-server";
import { getSiteContent } from "@/lib/defaults";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Contractor, Site, BusinessType } from "@/lib/types";
import StormInsuranceTemplate from "@/components/templates/storm-insurance";

// Generate SEO metadata for each contractor site
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
  const content = getSiteContent(
    contractor.business_type as BusinessType,
    contractor.business_name,
    contractor.city,
    { metaTitle: site.meta_title, metaDescription: site.meta_description }
  );

  return {
    title: content.metaTitle,
    description: content.metaDescription,
  };
}

export default async function ContractorSite({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabase();

  // Fetch the site and its contractor data in one query.
  // The "contractors(*)" part is a Supabase join — it pulls the related
  // contractor row along with the site row.
  const { data: site } = await supabase
    .from("sites")
    .select("*, contractors(*)")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  // If no published site exists for this slug, show a 404
  if (!site) {
    notFound();
  }

  const contractor = site.contractors as unknown as Contractor;
  const content = getSiteContent(
    contractor.business_type as BusinessType,
    contractor.business_name,
    contractor.city,
    {
      headline: site.hero_headline,
      ctaText: site.hero_cta_text,
      aboutText: site.about_text,
      services: site.services,
      metaTitle: site.meta_title,
      metaDescription: site.meta_description,
    }
  );

  // Render the template. Currently all design styles use the same layout
  // component — when Hannah's v0 designs are ready, we'll create separate
  // components for modern_clean, bold_confident, and warm_trustworthy.
  return (
    <StormInsuranceTemplate
      contractor={contractor}
      site={site as unknown as Site}
      content={content}
    />
  );
}
