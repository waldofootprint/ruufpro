import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";
import { inngest } from "@/lib/inngest/client";
import { checkSpending, recordSpending } from "@/lib/spending-guard";

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
  google_place_id: string | null;
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
// Auth is handled by the /ops layout (admin email check).
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    // Cap at 25 per request to stay within Vercel function timeout (60s hobby / 300s pro).
    const { batch_id, limit: rawLimit = 25 } = body;
    const limit = Math.min(rawLimit, 25);

    // Scrape filters — applied post-fetch before inserting
    const filters = {
      min_rating: body.min_rating ?? 0,        // 0 = no minimum
      max_reviews: body.max_reviews ?? 999999,  // high default = no cap
      no_website_only: body.no_website_only ?? false,
    };

    const dryRun = body.dry_run === true;

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

    // ── SPENDING GUARD — check daily cap before any API calls ──
    // Worst case: limit text searches + limit detail calls
    const maxSearchCalls = cities.length * 2; // ~2 pages per city
    const maxDetailCalls = limit;
    const estimatedMaxCost = (maxSearchCalls * 0.032) + (maxDetailCalls * 0.017);

    const spendingCheck = await checkSpending(estimatedMaxCost);
    if (!spendingCheck.allowed) {
      return NextResponse.json({
        error: "Daily spending cap reached",
        details: spendingCheck.reason,
        spent_today: `$${spendingCheck.spent_today.toFixed(2)}`,
        cap: `$${spendingCheck.cap}`,
      }, { status: 429 });
    }
    const perCity = Math.ceil(limit / cities.length);

    // ── DEDUP CHECK FIRST — load existing names BEFORE any expensive API calls ──
    // Only check active/completed batches — orphaned rows from deleted batches don't count
    const { data: activeBatches } = await supabase
      .from("prospect_batches")
      .select("id")
      .in("status", ["active", "completed"]);
    const activeBatchIds = (activeBatches || []).map((b: any) => b.id);

    let existingPipeline: any[] = [];
    if (activeBatchIds.length > 0) {
      const { data } = await supabase
        .from("prospect_pipeline")
        .select("business_name, city, google_place_id")
        .in("batch_id", activeBatchIds);
      existingPipeline = data || [];
    }

    const existingNames = new Set(
      existingPipeline.map((p: any) => `${p.business_name}|${p.city}`.toLowerCase())
    );
    const existingPlaceIds = new Set(
      existingPipeline.filter((p: any) => p.google_place_id).map((p: any) => p.google_place_id)
    );

    // ── DRY RUN MODE — text search only, no details API, no inserts ──
    // Respects the limit: only searches enough pages to fill the requested count.
    // Shows ALL results from the searches we paid for — nothing gets thrown away.
    if (dryRun) {
      let searchCalls = 0;
      let detailCalls = 0;
      let newFound = 0;
      const preview: { name: string; city: string; is_duplicate: boolean; filtered_out: boolean; filter_reason?: string; place_id: string; rating?: number; reviews?: number; has_website?: boolean }[] = [];

      for (const cityName of cities) {
        if (newFound >= limit) break;

        const query = `roofing contractor in ${cityName}`;
        let pageToken: string | undefined;
        // When "no website only" is on, dig deeper — small roofers without sites
        // are buried on pages 2-3. Cap at 3 pages to limit cost.
        const maxPages = filters.no_website_only ? 3 : 1;
        let page = 0;

        while (page < maxPages && newFound < limit) {
          const results = await searchPlaces(query, pageToken);
          searchCalls++;
          page++;

          for (const place of (results.results || [])) {
            const isDuplicate = existingPlaceIds.has(place.place_id) ||
              existingNames.has(`${(place.name || "").toLowerCase()}|${cityName.toLowerCase()}`);

            const placeRating = place.rating || 0;
            const placeReviews = place.user_ratings_total || 0;
            let filteredOut = false;
            let filterReason: string | undefined;

            if (!isDuplicate) {
              if (filters.min_rating > 0 && placeRating > 0 && placeRating < filters.min_rating) {
                filteredOut = true;
                filterReason = `Rating ${placeRating}★ below min ${filters.min_rating}★`;
              } else if (placeReviews > filters.max_reviews) {
                filteredOut = true;
                filterReason = `${placeReviews} reviews exceeds max ${filters.max_reviews}`;
              }
            }

            // When "no website only" is checked, call details API to check website.
            // Pay for it in dry run so the preview is accurate.
            let hasWebsite: boolean | undefined;
            if (!isDuplicate && !filteredOut && filters.no_website_only) {
              const details = await getPlaceDetails(place.place_id);
              detailCalls++;
              hasWebsite = !!details.website;
              if (hasWebsite) {
                filteredOut = true;
                filterReason = "Has website (filtered by 'No website only')";
              }
            }

            preview.push({
              name: place.name || "Unknown",
              city: cityName,
              is_duplicate: isDuplicate,
              filtered_out: filteredOut,
              filter_reason: filterReason,
              place_id: place.place_id,
              rating: placeRating || undefined,
              reviews: placeReviews || undefined,
              has_website: hasWebsite,
            });

            if (!isDuplicate && !filteredOut) newFound++;
          }

          pageToken = results.next_page_token;
          if (!pageToken) break;
          // Google requires a delay before using next_page_token
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      const newCount = preview.filter(p => !p.is_duplicate && !p.filtered_out).length;
      const dupCount = preview.filter(p => p.is_duplicate).length;
      const filteredCount = preview.filter(p => p.filtered_out).length;
      // When no_website_only is on, details were already paid in dry run — confirm is free
      // When off, details will be paid at confirm time
      const dryRunDetailCost = detailCalls * 0.017;
      const confirmDetailCost = filters.no_website_only ? 0 : newCount * 0.017;
      const searchCost = searchCalls * 0.032;

      // Record spending for this dry run
      await recordSpending("google_text_search", searchCalls, 0.032, `Dry run: ${cities.join(", ")}`);
      if (detailCalls > 0) {
        await recordSpending("google_place_details", detailCalls, 0.017, `Dry run website check: ${cities.join(", ")}`);
      }

      return NextResponse.json({
        dry_run: true,
        found: preview.length,
        new_prospects: newCount,
        duplicates: dupCount,
        filtered_out: filteredCount,
        search_api_calls: searchCalls,
        detail_api_calls: detailCalls,
        dry_run_cost: `$${(searchCost + dryRunDetailCost).toFixed(2)}`,
        confirm_cost: `$${confirmDetailCost.toFixed(2)}`,
        total_cost: `$${(searchCost + dryRunDetailCost + confirmDetailCost).toFixed(2)}`,
        preview,
      });
    }

    const prospects: Prospect[] = [];
    let apiCalls = 0;
    let duplicatesSkippedBeforeApi = 0;

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

          // ── DEDUP BEFORE DETAILS CALL — skip the $0.017 API call entirely ──
          if (existingPlaceIds.has(place.place_id)) {
            duplicatesSkippedBeforeApi++;
            continue;
          }
          // Also check by name from the text search result (place.name is available)
          const searchName = (place.name || "").toLowerCase();
          const roughCity = city.toLowerCase();
          const nameKey = `${searchName}|${roughCity}`;
          if (existingNames.has(nameKey)) {
            duplicatesSkippedBeforeApi++;
            continue;
          }

          // ── PRE-FILTER from text search data (FREE — no API call) ──
          // Rating + review count are available in text search results
          const preRating = place.rating || 0;
          const preReviews = place.user_ratings_total || 0;
          if (filters.min_rating > 0 && preRating > 0 && preRating < filters.min_rating) continue;
          if (preReviews > filters.max_reviews) continue;

          // Only NOW call the expensive details API
          const details = await getPlaceDetails(place.place_id);
          apiCalls++;

          // Skip if no useful data
          if (!details.name) continue;
          if (details.business_status && details.business_status !== "OPERATIONAL") continue;

          // Website filter can only be checked after details call
          const hasWebsite = !!details.website;
          if (filters.no_website_only && hasWebsite) continue;

          const { city: parsedCity, state } = parseCityState(details.formatted_address || "");

          // Final dedup check with the exact name from details
          const exactKey = `${details.name}|${parsedCity || city}`.toLowerCase();
          if (existingNames.has(exactKey)) continue;

          prospects.push({
            business_name: details.name,
            phone: details.formatted_phone_number || null,
            website: details.website || null,
            address: details.formatted_address || "",
            city: parsedCity || city,
            state: state || "FL",
            rating: details.rating || null,
            reviews_count: details.user_ratings_total || null,
            google_place_id: place.place_id || null,
          });

          // Add to dedup sets so we don't double-count within this scrape
          existingNames.add(exactKey);
          existingPlaceIds.add(place.place_id);
          cityCount++;
        }

        pageToken = results.next_page_token;
        if (!pageToken) break;

        // Google requires a short delay before using next_page_token
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Insert new prospects
    let inserted = 0;
    const insertedProspectIds: string[] = [];
    for (const p of prospects) {
      const key = `${p.business_name}|${p.city}`.toLowerCase();
      if (existingNames.has(key)) continue;

      // Create contractor — user_id is NULL for prospects.
      // Claim flow sets user_id when a roofer signs up.
      const { data: contractor, error: cErr } = await supabase
        .from("contractors")
        .insert({
          user_id: null,
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
      const { data: pipeline, error: pErr } = await supabase.from("prospect_pipeline").insert({
        contractor_id: contractor.id,
        batch_id,
        business_name: p.business_name,
        city: p.city,
        state: p.state,
        phone: p.phone,
        rating: p.rating,
        reviews_count: p.reviews_count,
        address: p.address,
        google_place_id: p.google_place_id,
        stage: "scraped",
        their_website_url: p.website,
        scraped_at: new Date().toISOString(),
      }).select("id").single();

      if (!pErr && pipeline) {
        inserted++;
        insertedProspectIds.push(pipeline.id);
        existingNames.add(key);
      }
    }

    // Update batch lead count
    await supabase
      .from("prospect_batches")
      .update({ lead_count: (batch.lead_count || 0) + inserted })
      .eq("id", batch_id);

    // Fire auto-enrichment via Inngest (only if we inserted prospects with place IDs)
    const enrichableIds = insertedProspectIds.filter((_, i) => {
      // Match back to the prospect that was inserted at this index
      return true; // All scraped prospects have google_place_id from the scrape
    });

    if (enrichableIds.length > 0) {
      await inngest.send({
        name: "ops/batch.auto-enrich",
        data: {
          batchId: batch_id,
          prospectIds: enrichableIds,
        },
      });
    }

    // Record actual spending
    // Count text search calls separately from detail calls
    const textSearchCalls = cities.length; // At minimum 1 per city
    const detailCalls = apiCalls - textSearchCalls;
    await recordSpending("google_text_search", textSearchCalls, 0.032, `Scrape: ${cities.join(", ")}`);
    if (detailCalls > 0) {
      await recordSpending("google_place_details", detailCalls, 0.017, `Scrape: ${inserted} inserted`);
    }

    const estimatedCost = (textSearchCalls * 0.032 + detailCalls * 0.017).toFixed(2);

    return NextResponse.json({
      success: true,
      scraped: prospects.length,
      inserted,
      duplicates_skipped_before_api: duplicatesSkippedBeforeApi,
      duplicates_skipped_at_insert: prospects.length - inserted,
      api_calls: apiCalls,
      estimated_cost: `$${estimatedCost}`,
      estimated_saved: `$${(duplicatesSkippedBeforeApi * 0.017).toFixed(2)}`,
      auto_enrich_triggered: enrichableIds.length > 0,
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
