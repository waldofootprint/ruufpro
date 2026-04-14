import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const PLACES_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const PHOTO_BASE = "https://maps.googleapis.com/maps/api/place/photo";

// Fields: photos (for URLs) + reviews (for service mining)
const DETAIL_FIELDS = "photos,reviews";

// ── Resolve a Place photo reference to a URL ───────────────────────
function getPhotoUrl(photoRef: string, maxWidth = 800): string {
  const params = new URLSearchParams({
    photoreference: photoRef,
    maxwidth: String(maxWidth),
    key: GOOGLE_API_KEY,
  });
  return `${PHOTO_BASE}?${params}`;
}

// ── Known roofing service keywords in review text ──────────────────
const SERVICE_KEYWORDS: Record<string, string> = {
  "shingle": "Shingle Roofing",
  "metal roof": "Metal Roofing",
  "tile roof": "Tile Roofing",
  "flat roof": "Flat Roofing",
  "tpo": "TPO Roofing",
  "epdm": "EPDM Roofing",
  "storm damage": "Storm Damage Repair",
  "hurricane": "Storm Damage Repair",
  "hail damage": "Storm Damage Repair",
  "wind damage": "Storm Damage Repair",
  "leak": "Roof Leak Repair",
  "leaking": "Roof Leak Repair",
  "gutter": "Gutters",
  "soffit": "Soffit & Fascia",
  "fascia": "Soffit & Fascia",
  "skylight": "Skylights",
  "insurance claim": "Insurance Claims",
  "insurance": "Insurance Claims",
  "commercial": "Commercial Roofing",
  "roof replacement": "Roof Replacement",
  "new roof": "Roof Replacement",
  "reroof": "Roof Replacement",
  "re-roof": "Roof Replacement",
  "roof repair": "Roof Repair",
  "inspection": "Roof Inspections",
  "coating": "Roof Coatings",
  "siding": "Siding",
  "ventilation": "Attic Ventilation",
};

// ── Extract service types from review text ─────────────────────────
function extractServicesFromReviews(reviews: any[]): string[] {
  const found = new Set<string>();
  const allText = reviews.map((r) => (r.text || "").toLowerCase()).join(" ");

  for (const [keyword, service] of Object.entries(SERVICE_KEYWORDS)) {
    if (allText.includes(keyword)) {
      found.add(service);
    }
  }

  return Array.from(found);
}

// ── POST /api/ops/enrich-photos ────────────────────────────────────
// Body: { batch_id }
// Pulls photos + reviews from Google Places for prospects with a google_place_id.
// Extracts services from review text. Stores on prospect_pipeline.
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { batch_id, prospect_ids, auto_advance } = await req.json();

    if (!batch_id && !prospect_ids?.length) {
      return NextResponse.json({ error: "batch_id or prospect_ids required" }, { status: 400 });
    }

    // Get prospects that have a place_id but no photos yet
    let query = supabase
      .from("prospect_pipeline")
      .select("id, google_place_id, business_name")
      .not("google_place_id", "is", null)
      .is("photos_enriched_at", null);

    if (prospect_ids?.length) {
      query = query.in("id", prospect_ids);
    } else {
      query = query.eq("batch_id", batch_id);
    }

    const { data: prospects, error: fetchErr } = await query;

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({
        success: true,
        enriched: 0,
        message: "No prospects need photo enrichment",
      });
    }

    let enriched = 0;
    let apiCalls = 0;
    const errors: string[] = [];

    for (const prospect of prospects) {
      try {
        // Fetch place details (photos + reviews)
        const params = new URLSearchParams({
          place_id: prospect.google_place_id,
          fields: DETAIL_FIELDS,
          key: GOOGLE_API_KEY,
        });

        const res = await fetch(`${PLACES_DETAILS}?${params}`);
        apiCalls++;

        if (!res.ok) {
          errors.push(`${prospect.business_name}: Places API ${res.status}`);
          continue;
        }

        const data = await res.json();
        const result = data.result || {};

        // Build photo URLs (up to 10)
        const photoRefs = (result.photos || []).slice(0, 10);
        const photos = photoRefs.map((p: any) => ({
          url: getPhotoUrl(p.photo_reference),
          width: p.width,
          height: p.height,
          attributions: p.html_attributions || [],
        }));

        // Store raw reviews (up to 5 most relevant)
        const reviews = (result.reviews || []).slice(0, 5).map((r: any) => ({
          author: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
          relative_time: r.relative_time_description,
        }));

        // Extract services from review text
        const extractedServices = extractServicesFromReviews(result.reviews || []);

        // Update prospect
        const updateData: Record<string, unknown> = {
          photos,
          google_reviews: reviews,
          extracted_services: extractedServices,
          photos_enriched_at: new Date().toISOString(),
        };

        // Auto-advance: scraped → google_enriched → awaiting_triage
        if (auto_advance) {
          updateData.stage = "google_enriched";
          updateData.google_enriched_at = new Date().toISOString();
        }

        const { error: updateErr } = await supabase
          .from("prospect_pipeline")
          .update(updateData)
          .eq("id", prospect.id);

        if (updateErr) {
          errors.push(`${prospect.business_name}: DB update failed`);
        } else {
          enriched++;
        }

        // Brief pause to avoid rate limits
        if (prospects.indexOf(prospect) < prospects.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (err: any) {
        errors.push(`${prospect.business_name}: ${err.message}`);
      }
    }

    const estimatedCost = (apiCalls * 0.017).toFixed(2);

    return NextResponse.json({
      success: true,
      enriched,
      total: prospects.length,
      api_calls: apiCalls,
      estimated_cost: `$${estimatedCost}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Enrich photos error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
