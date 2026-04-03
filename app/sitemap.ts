// Dynamic sitemap — serves different content based on whether the request
// is for the main domain or a contractor subdomain.
//
// Main domain (ruufpro.com): lists all published contractor site URLs
// Contractor subdomain (joes-roofing.ruufpro.com): lists that site's homepage

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = headers();
  const host = headersList.get("host") || "";

  const isLocalhost = host.includes("localhost");
  const mainDomains = ["ruufpro.com", "www.ruufpro.com", "localhost:3000"];

  // Extract subdomain using same logic as middleware.ts
  let subdomain: string | null = null;
  if (!mainDomains.includes(host)) {
    subdomain = isLocalhost
      ? host.split(".localhost")[0]
      : host.replace(".ruufpro.com", "");
  }

  const supabase = createServerSupabase();

  if (!subdomain) {
    // Main domain: list all published contractor sites so Google can discover them
    const { data: sites } = await supabase
      .from("sites")
      .select("slug, updated_at")
      .eq("published", true);

    return (sites || []).map((site) => ({
      url: `https://${site.slug}.ruufpro.com`,
      lastModified: site.updated_at ? new Date(site.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  }

  // Contractor subdomain: homepage + services listing + individual service pages
  const baseUrl = isLocalhost
    ? `http://${subdomain}.localhost:3000`
    : `https://${subdomain}.ruufpro.com`;

  // Fetch this site's services + contractor's city list for city page URLs
  const { data: siteData } = await supabase
    .from("sites")
    .select("services, contractor_id")
    .eq("slug", subdomain)
    .eq("published", true)
    .single();

  const services: string[] = siteData?.services || [];

  // Get contractor's service area cities
  let cities: string[] = [];
  if (siteData?.contractor_id) {
    const { data: contractor } = await supabase
      .from("contractors")
      .select("service_area_cities")
      .eq("id", siteData.contractor_id)
      .single();
    cities = contractor?.service_area_cities || [];
  }

  // Import helpers
  const { getServiceContent } = await import("@/lib/service-page-content");
  const { cityToSlug } = await import("@/lib/city-page-content");

  const serviceEntries = services
    .map((s) => getServiceContent(s))
    .filter(Boolean);

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...serviceEntries.map((entry) => ({
      url: `${baseUrl}/services/${entry!.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...cities.map((city) => ({
      url: `${baseUrl}/${cityToSlug(city)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
