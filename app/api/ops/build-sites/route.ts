import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_SERVICES = [
  "Roof Replacement",
  "Roof Repair",
  "Roof Inspections",
  "Gutter Installation",
];

// ── Generate a random prospect slug (never use business names) ─────
function generateProspectSlug(): string {
  return `p-${crypto.randomBytes(4).toString("hex")}`;
}

// ── Generate smart about text from scraped data ────────────────────
function generateAboutText(
  businessName: string,
  city: string,
  state: string,
  services: string[],
  yearsInBusiness?: number | null,
  reviewCount?: number | null
): string {
  let text = `${businessName} is a professional roofing contractor serving ${city}, ${state} and surrounding areas.`;

  if (yearsInBusiness && yearsInBusiness > 0) {
    text += ` With over ${yearsInBusiness} years of experience, we bring expertise and reliability to every project.`;
  }

  if (services.length > 2) {
    const listed = services.slice(0, 3).join(", ");
    text += ` We specialize in ${listed}, and more.`;
  }

  if (reviewCount && reviewCount > 10) {
    text += ` Trusted by homeowners with ${reviewCount}+ reviews.`;
  }

  return text;
}

// ── Generate headline from city ────────────────────────────────────
function generateHeadline(city: string): string {
  return `Trusted Roofing in ${city}`;
}

// ── Format Google reviews into site review format ──────────────────
function formatReviews(
  googleReviews: any[]
): { name: string; text: string; rating: number }[] {
  if (!googleReviews || googleReviews.length === 0) return [];

  return googleReviews
    .filter((r: any) => r.rating >= 4 && r.text && r.text.length > 20)
    .slice(0, 5)
    .map((r: any) => ({
      name: r.author || "Homeowner",
      text:
        r.text.length > 300
          ? r.text.slice(0, 297) + "..."
          : r.text,
      rating: r.rating,
    }));
}

// ── POST /api/ops/build-sites ──────────────────────────────────────
// Body: { batch_id }
// For each prospect in the batch at "enriched" stage (or "scraped" if
// no enrichment needed), creates a contractor record + site record
// using the Modern Clean template, then advances to "site_built".
export async function POST(req: NextRequest) {
  try {
    const { batch_id } = await req.json();

    if (!batch_id) {
      return NextResponse.json({ error: "batch_id required" }, { status: 400 });
    }

    // Get prospects ready for site building:
    // - Must be enriched (or scraped if we're skipping enrichment)
    // - Must NOT already have a preview site
    const { data: prospects, error: fetchErr } = await supabase
      .from("prospect_pipeline")
      .select("*")
      .eq("batch_id", batch_id)
      .in("stage", ["scraped", "enriched"])
      .is("preview_site_url", null);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({
        success: true,
        built: 0,
        message: "No prospects need sites built",
      });
    }

    // Get admin user_id for contractor records (same pattern as scrape)
    const { data: existingContractor } = await supabase
      .from("contractors")
      .select("user_id")
      .limit(1)
      .single();

    if (!existingContractor) {
      return NextResponse.json(
        { error: "No existing user found for contractor records" },
        { status: 500 }
      );
    }

    const userId = existingContractor.user_id;
    let built = 0;
    const errors: string[] = [];

    for (const prospect of prospects) {
      try {
        const businessName = prospect.business_name || "Roofing Contractor";
        const city = prospect.city || "Your City";
        const state = prospect.state || "FL";
        const phone = prospect.phone || "";

        // Determine services: extracted from reviews > default
        const services: string[] =
          prospect.extracted_services && prospect.extracted_services.length > 0
            ? prospect.extracted_services
            : DEFAULT_SERVICES;

        // Format reviews for the site
        const reviews = formatReviews(prospect.google_reviews || []);

        // Generate about text
        const aboutText = generateAboutText(
          businessName,
          city,
          state,
          services,
          prospect.founded_year
            ? new Date().getFullYear() - prospect.founded_year
            : null,
          prospect.reviews_count
        );

        // Generate random slug (never use business name in URL)
        const slug = generateProspectSlug();

        // If the prospect already has a contractor_id (from scrape), use it.
        // Otherwise create a new contractor record.
        let contractorId = prospect.contractor_id;

        if (contractorId) {
          // Update the existing contractor with richer data
          await supabase
            .from("contractors")
            .update({
              business_name: businessName,
              phone: phone || "unknown",
              city,
              state,
              service_area_cities: [city],
              years_in_business: prospect.founded_year
                ? new Date().getFullYear() - prospect.founded_year
                : null,
            })
            .eq("id", contractorId);
        } else {
          // Create new contractor record
          const { data: newContractor, error: cErr } = await supabase
            .from("contractors")
            .insert({
              user_id: userId,
              email: `prospect-${crypto.randomBytes(4).toString("hex")}@placeholder.com`,
              business_name: businessName,
              phone: phone || "unknown",
              city,
              state,
              business_type: "residential",
              service_area_cities: [city],
              years_in_business: prospect.founded_year
                ? new Date().getFullYear() - prospect.founded_year
                : null,
            })
            .select("id")
            .single();

          if (cErr || !newContractor) {
            errors.push(`${businessName}: Failed to create contractor`);
            continue;
          }
          contractorId = newContractor.id;

          // Link contractor to pipeline
          await supabase
            .from("prospect_pipeline")
            .update({ contractor_id: contractorId })
            .eq("id", prospect.id);
        }

        // Create site record with Modern Clean template
        const { error: siteErr } = await supabase.from("sites").insert({
          contractor_id: contractorId,
          slug,
          template: "modern_clean",
          published: true,
          hero_headline: generateHeadline(city),
          hero_subheadline: `Professional roofing services for ${city} homeowners`,
          hero_cta_text: "Get Your Free Estimate",
          about_text: aboutText,
          services,
          reviews,
        });

        if (siteErr) {
          // Slug collision — try once more with a new slug
          if (siteErr.message.includes("duplicate")) {
            const retrySlug = generateProspectSlug();
            const { error: retryErr } = await supabase.from("sites").insert({
              contractor_id: contractorId,
              slug: retrySlug,
              template: "modern_clean",
              published: true,
              hero_headline: generateHeadline(city),
              hero_subheadline: `Professional roofing services for ${city} homeowners`,
              hero_cta_text: "Get Your Free Estimate",
              about_text: aboutText,
              services,
              reviews,
            });

            if (retryErr) {
              errors.push(`${businessName}: Site creation failed (retry)`);
              continue;
            }

            // Update pipeline with preview URL
            await supabase
              .from("prospect_pipeline")
              .update({
                preview_site_url: `/site/${retrySlug}`,
                stage: "site_built",
                stage_entered_at: new Date().toISOString(),
                site_built_at: new Date().toISOString(),
              })
              .eq("id", prospect.id);

            built++;
            continue;
          }

          errors.push(`${businessName}: ${siteErr.message}`);
          continue;
        }

        // Update pipeline with preview URL and advance stage
        await supabase
          .from("prospect_pipeline")
          .update({
            preview_site_url: `/site/${slug}`,
            stage: "site_built",
            stage_entered_at: new Date().toISOString(),
            site_built_at: new Date().toISOString(),
          })
          .eq("id", prospect.id);

        built++;
      } catch (err: any) {
        errors.push(
          `${prospect.business_name || "Unknown"}: ${err.message}`
        );
      }
    }

    // Auto-create site_review gate if any sites were built
    if (built > 0) {
      const { data: existingGate } = await supabase
        .from("pipeline_gates")
        .select("id")
        .eq("batch_id", batch_id)
        .eq("gate_type", "site_review")
        .maybeSingle();

      if (!existingGate) {
        await supabase.from("pipeline_gates").insert({
          batch_id,
          gate_type: "site_review",
          status: "pending",
          items_pending: built,
          items_approved: 0,
          items_rejected: 0,
        });
      } else {
        // Update existing gate count
        await supabase
          .from("pipeline_gates")
          .update({
            items_pending: built,
            status: "pending",
          })
          .eq("id", existingGate.id);
      }
    }

    return NextResponse.json({
      success: true,
      built,
      total: prospects.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Build sites error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
