// City landing page — auto-generated SEO page for each service area city.
// Route: joes-roofing.ruufpro.com/tampa
// Internal: /site/joes-roofing/tampa

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/get-site-data";
import { slugToCity, generateCityContent, cityToSlug } from "@/lib/city-page-content";
import CityPageComponent from "@/components/contractor-sections/city-page";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; city: string };
}): Promise<Metadata> {
  const result = await getSiteData(params.slug);
  if (!result) return { title: "Site Not Found" };

  const { contractor, templateData } = result;
  const cityName = slugToCity(params.city, templateData.serviceAreaCities);
  if (!cityName) return { title: "City Not Found" };

  const content = generateCityContent(cityName, {
    businessName: contractor.business_name,
    city: contractor.city,
    state: contractor.state,
    warrantyYears: contractor.warranty_years,
    yearsInBusiness: contractor.years_in_business,
    isLicensed: contractor.is_licensed,
    isInsured: contractor.is_insured,
    offersFinancing: contractor.offers_financing,
    services: templateData.services,
  });

  const canonicalUrl = `https://${params.slug}.ruufpro.com/${content.slug}`;
  const description = `${contractor.business_name} offers professional roofing services in ${cityName}, ${contractor.state}. Licensed, insured, free estimates. Call today.`;

  return {
    title: `${content.headline} | ${contractor.business_name}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${content.headline} | ${contractor.business_name}`,
      description,
      url: canonicalUrl,
      siteName: contractor.business_name,
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: { slug: string; city: string };
}) {
  const result = await getSiteData(params.slug);
  if (!result) notFound();

  const { site, contractor, templateData } = result;
  const cityName = slugToCity(params.city, templateData.serviceAreaCities);
  if (!cityName) notFound();

  const template = site.template || "modern_clean";

  const content = generateCityContent(cityName, {
    businessName: contractor.business_name,
    city: contractor.city,
    state: contractor.state,
    warrantyYears: contractor.warranty_years,
    yearsInBusiness: contractor.years_in_business,
    isLicensed: contractor.is_licensed,
    isInsured: contractor.is_insured,
    offersFinancing: contractor.offers_financing,
    services: templateData.services,
  });

  const otherCities = templateData.serviceAreaCities.filter(
    (c) => cityToSlug(c) !== params.city
  );

  // JSON-LD schemas
  const baseUrl = `https://${params.slug}.ruufpro.com`;
  const schemas = [
    // RoofingContractor with city-specific areaServed
    {
      "@context": "https://schema.org",
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
      areaServed: {
        "@type": "City",
        name: cityName,
        containedInPlace: {
          "@type": "State",
          name: contractor.state,
        },
      },
      ...(contractor.is_licensed && { hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Roofing License" } }),
    },
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: cityName, item: `${baseUrl}/${content.slug}` },
      ],
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    // Service schema for each service
    ...templateData.services.map((service) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: service,
      provider: {
        "@type": "RoofingContractor",
        name: contractor.business_name,
      },
      areaServed: {
        "@type": "City",
        name: cityName,
      },
      description: `Professional ${service.toLowerCase()} services in ${cityName}, ${contractor.state} by ${contractor.business_name}.`,
    })),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <CityPageComponent
        content={content}
        businessName={contractor.business_name}
        phone={contractor.phone}
        mainCity={contractor.city}
        state={contractor.state}
        hasEstimateWidget={contractor.has_estimate_widget}
        contractorId={contractor.id}
        template={template}
        siteSlug={params.slug}
        otherCities={otherCities}
        services={templateData.services}
      />
    </>
  );
}
