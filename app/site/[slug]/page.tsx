// Contractor site page — renders the roofer's website from database data.
//
// Flow:
// 1. Visitor goes to "joes-roofing.ruufpro.com"
// 2. Middleware rewrites to "/site/joes-roofing"
// 3. This page fetches site + contractor data from Supabase
// 4. Renders the appropriate template with that data

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/get-site-data";
import { buildSchemas } from "@/lib/schema";
import ModernCleanTemplate from "@/components/templates/modern-clean";
import ChalkboardTemplate from "@/components/templates/chalkboard";
import BlueprintTemplate from "@/components/templates/blueprint";
import ClassicTemplate from "@/components/templates/classic";
import ForgeTemplate from "@/components/templates/forge";
import ApexTemplate from "@/components/templates/apex";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getSiteData(params.slug);

  if (!result) return { title: "Site Not Found" };

  const { site, contractor } = result;
  const canonicalUrl = `https://${params.slug}.ruufpro.com`;

  // Build a richer fallback description using actual services
  const serviceSnippet = (site.services || []).slice(0, 3).join(", ");
  const fallbackDesc = serviceSnippet
    ? `Professional ${serviceSnippet.toLowerCase()} in ${contractor.city}, ${contractor.state}. Licensed & insured. Free estimates.`
    : `Professional roofing services in ${contractor.city}, ${contractor.state}. Free estimates, licensed & insured.`;

  const title = site.meta_title || `${contractor.business_name} — Roofing in ${contractor.city}, ${contractor.state}`;
  const description = site.meta_description || fallbackDesc;
  const ogImage = contractor.logo_url || `${canonicalUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: contractor.business_name,
      locale: "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${contractor.business_name} — Roofing in ${contractor.city}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ContractorSite({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getSiteData(params.slug);

  if (!result) {
    notFound();
  }

  const { site, templateData } = result;

  // JSON-LD structured data — RoofingContractor, Service, FAQPage, WebPage
  const schemas = buildSchemas(result);

  // Choose template based on site.template field
  // Maps both old names and onboarding design style names to templates
  const template = (site.template || "modern_clean") as string;

  const templateComponent =
    template === "chalkboard" || template === "bold_confident"
      ? <ChalkboardTemplate {...templateData} />
      : template === "blueprint" || template === "warm_trustworthy"
      ? <BlueprintTemplate {...templateData} />
      : template === "classic" || template === "clean_professional"
      ? <ClassicTemplate {...templateData} />
      : template === "forge" || template === "bold_dark"
      ? <ForgeTemplate {...templateData} />
      : template === "apex"
      ? <ApexTemplate templateData={templateData} />
      : <ModernCleanTemplate {...templateData} />;

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {templateComponent}
    </>
  );
}
