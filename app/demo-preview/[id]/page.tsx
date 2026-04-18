// Demo page — personalized demo for direct mail outreach prospects.
// Fetches prospect data from prospect_pipeline and renders live
// Riley chatbot + estimate widget with their actual business data.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DemoPageClient from "./demo-page-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data } = await supabase
    .from("prospect_pipeline")
    .select("business_name, city, state")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Demo Not Found" };

  return {
    title: `${data.business_name} — RuufPro Demo`,
    description: `See what RuufPro built for ${data.business_name} in ${data.city}, ${data.state}. Live AI chatbot, instant estimates, and lead dashboard.`,
    robots: { index: false, follow: false },
  };
}

export default async function DemoPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: prospect, error } = await supabase
    .from("prospect_pipeline")
    .select(`
      id,
      contractor_id,
      business_name,
      city,
      state,
      phone,
      rating,
      reviews_count,
      extracted_services,
      website_services,
      website_service_areas,
      website_faq,
      website_about,
      owner_name,
      ai_services
    `)
    .eq("id", params.id)
    .single();

  if (error || !prospect) {
    notFound();
  }

  // Build services list — prefer AI-rewritten, then scraped, then extracted
  const services: string[] =
    prospect.ai_services?.length > 0
      ? prospect.ai_services
      : prospect.website_services?.length > 0
        ? (prospect.website_services as Array<{ name: string }>).map((s) => s.name || String(s))
        : prospect.extracted_services?.length > 0
          ? prospect.extracted_services
          : ["Roof Replacement", "Roof Repair", "Inspections"];

  // Build service areas
  const serviceAreas: string[] = prospect.website_service_areas?.length > 0
    ? prospect.website_service_areas
    : [prospect.city, prospect.state].filter(Boolean);

  const prospectData = {
    id: prospect.id,
    businessName: (prospect.business_name || "Roofing Company")
      .replace(/\s*(LLC|Inc\.?|Corp\.?|L\.?L\.?C\.?|PLLC)\s*$/i, "")
      .trim(),
    city: prospect.city || "Florida",
    state: prospect.state || "FL",
    phone: prospect.phone || "",
    rating: prospect.rating || 0,
    reviewsCount: prospect.reviews_count || 0,
    services,
    serviceAreas,
    faq: prospect.website_faq as Array<{ question: string; answer: string }> | null,
    about: prospect.website_about || null,
    ownerName: prospect.owner_name || null,
    contractorId: prospect.contractor_id || null,
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
        rel="stylesheet"
      />
      <DemoPageClient prospect={prospectData} />
    </>
  );
}
