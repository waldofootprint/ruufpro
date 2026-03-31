// Individual service detail page — deep SEO content for a single service.
// Each contractor gets unique content interpolated with their city/name/state.
//
// Route: joes-roofing.ruufpro.com/services/roof-replacement
// Internal: /site/joes-roofing/services/roof-replacement

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/get-site-data";
import {
  getServiceContent,
  interpolateContent,
  getServicesForContractor,
} from "@/lib/service-page-content";
import ServiceDetailContent from "@/components/contractor-sections/service-detail-page";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; service: string };
}): Promise<Metadata> {
  const result = await getSiteData(params.slug);
  if (!result) return { title: "Site Not Found" };

  const entry = getServiceContent(params.service);
  if (!entry) return { title: "Service Not Found" };

  const { contractor } = result;
  const vars = { city: contractor.city, businessName: contractor.business_name, state: contractor.state };
  const headline = interpolateContent(entry.headline, vars);
  const description = interpolateContent(entry.paragraphs[0], vars);
  const canonicalUrl = `https://${params.slug}.ruufpro.com/services/${entry.slug}`;

  return {
    title: `${headline} | ${contractor.business_name}`,
    description: description.slice(0, 160),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${headline} | ${contractor.business_name}`,
      description: description.slice(0, 160),
      url: canonicalUrl,
      siteName: contractor.business_name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: headline,
      description: description.slice(0, 160),
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: { slug: string; service: string };
}) {
  const result = await getSiteData(params.slug);
  if (!result) notFound();

  const entry = getServiceContent(params.service);
  if (!entry) notFound();

  const { site, contractor, templateData } = result;
  const template = site.template || "modern_clean";
  const vars = { city: contractor.city, businessName: contractor.business_name, state: contractor.state };

  const headline = interpolateContent(entry.headline, vars);
  const paragraphs = entry.paragraphs.map((p) => interpolateContent(p, vars));

  // Get other services for "Related Services" section
  const allServices = getServicesForContractor(
    templateData.services.length > 0
      ? templateData.services
      : ["Roof Replacement", "Roof Repair", "Inspections", "Gutters", "Storm Damage", "Ventilation"],
    vars
  );
  const relatedServices = allServices
    .filter((s) => s.slug !== entry.slug)
    .slice(0, 3);

  // JSON-LD for this specific service
  const baseUrl = `https://${params.slug}.ruufpro.com`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: entry.name,
      description: paragraphs[0],
      url: `${baseUrl}/services/${entry.slug}`,
      provider: {
        "@type": "RoofingContractor",
        name: contractor.business_name,
        url: baseUrl,
        telephone: contractor.phone,
        address: {
          "@type": "PostalAddress",
          addressLocality: contractor.city,
          addressRegion: contractor.state,
          addressCountry: "US",
        },
      },
      areaServed: {
        "@type": "City",
        name: contractor.city,
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `${entry.name} Services`,
        itemListElement: entry.subServices.map((sub, i) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: sub,
          },
          position: i + 1,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Services", item: `${baseUrl}/services` },
        { "@type": "ListItem", position: 3, name: entry.name, item: `${baseUrl}/services/${entry.slug}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <ServiceDetailContent
        serviceName={entry.name}
        serviceSlug={entry.slug}
        headline={headline}
        paragraphs={paragraphs}
        subServices={entry.subServices}
        relatedServices={relatedServices.map((s) => ({
          slug: s.slug,
          name: s.name,
          headline: s.interpolated.headline,
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
