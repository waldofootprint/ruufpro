// Services listing page — shows all services a contractor offers.
// Each service links to its own detail page for deep SEO content.
//
// Route: joes-roofing.ruufpro.com/services
// Internal: /site/joes-roofing/services

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/get-site-data";
import { getServicesForContractor } from "@/lib/service-page-content";
import ServicesPageContent from "@/components/contractor-sections/services-page";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getSiteData(params.slug);
  if (!result) return { title: "Site Not Found" };

  const { contractor } = result;
  const canonicalUrl = `https://${params.slug}.ruufpro.com/services`;

  const title = `Roofing Services in ${contractor.city}, ${contractor.state} | ${contractor.business_name}`;
  const description = `${contractor.business_name} offers professional roofing services in ${contractor.city}, ${contractor.state} — roof replacement, repair, inspections, and more. Licensed & insured. Free estimates.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: contractor.business_name,
      locale: "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ServicesPage({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getSiteData(params.slug);
  if (!result) notFound();

  const { site, contractor, templateData } = result;
  const template = site.template || "modern_clean";

  const services = getServicesForContractor(
    templateData.services.length > 0
      ? templateData.services
      : ["Roof Replacement", "Roof Repair", "Inspections", "Gutters", "Storm Damage", "Ventilation"],
    {
      city: contractor.city,
      businessName: contractor.business_name,
      state: contractor.state,
    }
  );

  // Build JSON-LD for service listing
  const baseUrl = `https://${params.slug}.ruufpro.com`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Roofing Services — ${contractor.business_name}`,
      url: `${baseUrl}/services`,
      isPartOf: {
        "@type": "WebSite",
        name: contractor.business_name,
        url: baseUrl,
      },
    },
    ...services.map((svc) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: svc.name,
      description: svc.interpolated.paragraphs[0],
      url: `${baseUrl}/services/${svc.slug}`,
      provider: {
        "@type": "RoofingContractor",
        name: contractor.business_name,
        url: baseUrl,
      },
      areaServed: {
        "@type": "City",
        name: contractor.city,
      },
    })),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <ServicesPageContent
        services={services.map((svc) => ({
          slug: svc.slug,
          name: svc.name,
          headline: svc.interpolated.headline,
          excerpt: svc.interpolated.paragraphs[0],
          subServices: svc.subServices,
        }))}
        businessName={contractor.business_name}
        phone={contractor.phone}
        city={contractor.city}
        state={contractor.state}
        hasEstimateWidget={contractor.has_estimate_widget}
        template={template}
        siteSlug={params.slug}
      />
    </>
  );
}
