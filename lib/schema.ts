// JSON-LD structured data builder for contractor sites.
// Generates schema.org markup that helps Google understand
// the business, its services, and FAQ content.

import type { SiteDataResult } from "./get-site-data";
import { generateFaqItems } from "./faq-data";
import { getServiceContent } from "./service-page-content";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema = Record<string, any>;

export function buildSchemas(result: SiteDataResult): Schema[] {
  const schemas: Schema[] = [];

  schemas.push(buildContractorSchema(result));
  schemas.push(...buildServiceSchemas(result));
  schemas.push(buildFaqSchema(result));
  schemas.push(buildWebPageSchema(result));

  return schemas;
}

function buildContractorSchema(result: SiteDataResult): Schema {
  const { contractor, templateData } = result;
  const url = `https://${templateData.slug}.ruufpro.com`;

  const schema: Schema = {
    "@context": "https://schema.org",
    "@type": "RoofingContractor",
    name: contractor.business_name,
    url,
    telephone: contractor.phone,
    priceRange: "$$",
  };

  // Address — always include city/state, add street + zip when available
  schema.address = {
    "@type": "PostalAddress",
    addressLocality: contractor.city,
    addressRegion: contractor.state,
    addressCountry: "US",
    ...(contractor.address && { streetAddress: contractor.address }),
    ...(contractor.zip && { postalCode: contractor.zip }),
  };

  // Logo
  if (contractor.logo_url) {
    schema.image = contractor.logo_url;
  }

  // Service areas
  if (templateData.serviceAreaCities.length > 0) {
    schema.areaServed = templateData.serviceAreaCities.map((city) => ({
      "@type": "City",
      name: city,
    }));
  }

  // Aggregate rating from reviews
  if (templateData.reviews.length > 0) {
    const total = templateData.reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = total / templateData.reviews.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: templateData.reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Trust credentials
  if (templateData.isLicensed) {
    schema.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Roofing License",
    };
  }

  return schema;
}

function buildServiceSchemas(result: SiteDataResult): Schema[] {
  const { contractor, templateData } = result;
  const url = `https://${templateData.slug}.ruufpro.com`;

  return templateData.services.map((service) => {
    const entry = getServiceContent(service);
    const serviceUrl = entry ? `${url}/services/${entry.slug}` : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service,
      ...(serviceUrl && { url: serviceUrl }),
      provider: {
        "@type": "RoofingContractor",
        name: contractor.business_name,
        url,
      },
      areaServed: {
        "@type": "City",
        name: contractor.city,
      },
    };
  });
}

function buildFaqSchema(result: SiteDataResult): Schema {
  const { templateData } = result;
  const faqs = generateFaqItems({
    businessName: templateData.businessName,
    city: templateData.city,
    state: templateData.state,
    services: templateData.services,
    serviceAreaCities: templateData.serviceAreaCities,
    offersFinancing: templateData.offersFinancing,
    isLicensed: templateData.isLicensed,
    isInsured: templateData.isInsured,
    yearsInBusiness: templateData.yearsInBusiness,
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function buildWebPageSchema(result: SiteDataResult): Schema {
  const { contractor, templateData } = result;
  const url = `https://${templateData.slug}.ruufpro.com`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${contractor.business_name} — Roofing in ${contractor.city}, ${contractor.state}`,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: contractor.business_name,
      url,
    },
  };
}
