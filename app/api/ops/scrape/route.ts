import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const PLACES_TEXT_SEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACES_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const DETAIL_FIELDS = "name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,business_status";

interface Prospect {
  business_name: string;
  phone: string | null;
  website: string | null;
  address: string;
  city: string;
  state: string;
  rating: number | null;
  reviews_count: number | null;
}

// ── Google Maps: text search for roofers ────────────────────────────
async function searchPlaces(query: string, pageToken?: string): Promise<any> {
  const params = new URLSearchParams({
    query,
    key: GOOGLE_API_KEY,
    type: "roofing_contractor",
  });
  if (pageToken) params.set("pagetoken", pageToken);

  const res = await fetch(`${PLACES_TEXT_SEARCH}?${params}`);
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  return res.json();
}

// ── Google Maps: get place details ──────────────────────────────────
async function getPlaceDetails(placeId: string): Promise<any> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: DETAIL_FIELDS,
    key: GOOGLE_API_KEY,
  });

  const res = await fetch(`${PLACES_DETAILS}?${params}`);
  if (!res.ok) throw new Error(`Place details failed: ${res.status}`);
  const data = await res.json();
  return data.result || {};
}

// ── Parse city/state from address ───────────────────────────────────
function parseCityState(address: string): { city: string; state: string } {
  // "123 Main St, Tampa, FL 33601, USA"
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    const city = parts[parts.length - 3] || "";
    const stateZip = parts[parts.length - 2] || "";
    const state = stateZip.split(" ")[0] || "";
    return { city, state };
  }
  return { city: "", state: "" };
}

// ── POST /api/ops/scrape ────────────────────────────────────────────
// Body: { batch_id, limit, cities? }
// Scrapes Google Maps, creates contractors + pipeline entries
export async function POST(req: NextRequest) {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { batch_id, limit = 25 } = body;

    if (!batch_id) {
      return NextResponse.json({ error: "batch_id required" }, { status: 400 });
    }

    // Get batch to find city targets
    const { data: batch, error: batchErr } = await supabase
      .from("prospect_batches")
      .select("*")
      .eq("id", batch_id)
      .single();

    if (batchErr || !batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const cities: string[] = body.cities || batch.city_targets || ["Tampa"];
    const perCity = Math.ceil(limit / cities.length);

    // Get existing user_id for contractor records (admin user)
    const { data: existingContractor } = await supabase
      .from("contractors")
      .select("user_id")
      .limit(1)
      .single();

    if (!existingContractor) {
      return NextResponse.json({ error: "No existing user found for contractor records" }, { status: 500 });
    }

    const userId = existingContractor.user_id;
    const prospects: Prospect[] = [];
    let apiCalls = 0;

    // Scrape each city
    for (const city of cities) {
      if (prospects.length >= limit) break;

      const query = `roofing contractor in ${city}`;
      let pageToken: string | undefined;
      let cityCount = 0;

      while (cityCount < perCity && prospects.length < limit) {
        const results = await searchPlaces(query, pageToken);
        apiCalls++;

        if (!results.results || results.results.length === 0) break;

        for (const place of results.results) {
          if (prospects.length >= limit) break;

          // Get details
          const details = await getPlaceDetails(place.place_id);
          apiCalls++;

          // Skip if no useful data
          if (!details.name) continue;
          if (details.business_status && details.business_status !== "OPERATIONAL") continue;

          const { city: parsedCity, state } = parseCityState(details.formatted_address || "");

          prospects.push({
            business_name: details.name,
            phone: details.formatted_phone_number || null,
            website: details.website || null,
            address: details.formatted_address || "",
            city: parsedCity || city,
            state: state || "FL",
            rating: details.rating || null,
            reviews_count: details.user_ratings_total || null,
          });

          cityCount++;
        }

        pageToken = results.next_page_token;
        if (!pageToken) break;

        // Google requires a short delay before using next_page_token
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Check for duplicates (by business name + city)
    const { data: existingPipeline } = await supabase
      .from("prospect_pipeline")
      .select("contractor_id, contractors!inner(business_name, city)")
      .eq("batch_id", batch_id);

    const existingNames = new Set(
      (existingPipeline || []).map((p: any) => `${p.contractors?.business_name}|${p.contractors?.city}`.toLowerCase())
    );

    // Insert new prospects
    let inserted = 0;
    for (const p of prospects) {
      const key = `${p.business_name}|${p.city}`.toLowerCase();
      if (existingNames.has(key)) continue;

      // Create contractor
      const { data: contractor, error: cErr } = await supabase
        .from("contractors")
        .insert({
          user_id: userId,
          email: `prospect-${Date.now()}-${inserted}@placeholder.com`,
          business_name: p.business_name,
          phone: p.phone || "unknown",
          city: p.city,
          state: p.state,
          business_type: "residential",
        })
        .select("id")
        .single();

      if (cErr || !contractor) continue;

      // Create pipeline entry
      const { error: pErr } = await supabase.from("prospect_pipeline").insert({
        contractor_id: contractor.id,
        batch_id,
        stage: "scraped",
        their_website_url: p.website,
        scraped_at: new Date().toISOString(),
      });

      if (!pErr) {
        inserted++;
        existingNames.add(key);
      }
    }

    // Update batch lead count
    await supabase
      .from("prospect_batches")
      .update({ lead_count: (batch.lead_count || 0) + inserted })
      .eq("id", batch_id);

    const estimatedCost = (apiCalls * 0.03).toFixed(2);

    return NextResponse.json({
      success: true,
      scraped: prospects.length,
      inserted,
      duplicates_skipped: prospects.length - inserted,
      api_calls: apiCalls,
      estimated_cost: `$${estimatedCost}`,
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
