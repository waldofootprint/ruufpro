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
// Dry run: searches Google, saves results to scrape_preview_cache
// Confirm: reads from cache, inserts — ZERO Google API calls
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { batch_id } = body;
    const dryRun = body.dry_run === true;

    if (!batch_id) {
      return NextResponse.json({ error: "batch_id required" }, { status: 400 });
    }

    // Get batch
    const { data: batch, error: batchErr } = await supabase
      .from("prospect_batches")
      .select("*")
      .eq("id", batch_id)
      .single();

    if (batchErr || !batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIRM PATH — read from cache, no Google API calls
    // ═══════════════════════════════════════════════════════════════
    if (!dryRun) {
      // Look up cached preview
      const { data: cache, error: cacheErr } = await supabase
        .from("scrape_preview_cache")
        .select("*")
        .eq("batch_id", batch_id)
        .eq("consumed", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cacheErr || !cache) {
        return NextResponse.json(
          { error: "Preview expired or not found. Run dry run again." },
          { status: 409 }
        );
      }

      // Mark consumed IMMEDIATELY — prevents double-click
      const { error: consumeErr } = await supabase
        .from("scrape_preview_cache")
        .update({ consumed: true })
        .eq("id", cache.id)
        .eq("consumed", false); // Extra guard against race

      if (consumeErr) {
        return NextResponse.json(
          { error: "Preview already consumed (double-click?)" },
          { status: 409 }
        );
      }

      // Read prospects from cache — these are EXACTLY what the dry run showed
      const prospects: Prospect[] = cache.prospects || [];

      // Insert prospects
      let inserted = 0;
      const insertErrors: { name: string; city: string; reason: string }[] = [];
      const insertedProspectIds: string[] = [];

      for (const p of prospects) {
        // Create contractor
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

        if (cErr || !contractor) {
          console.error("[scrape/confirm] contractor insert failed", {
            business_name: p.business_name,
            error: cErr?.message,
          });
          insertErrors.push({
            name: p.business_name,
            city: p.city,
            reason: cErr?.message || "contractor insert failed",
          });
          continue;
        }

        // Create pipeline entry
        const { data: pipeline, error: pErr } = await supabase
          .from("prospect_pipeline")
          .insert({
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
          })
          .select("id")
          .single();

        if (pErr || !pipeline) {
          console.error("[scrape/confirm] pipeline insert failed", {
            business_name: p.business_name,
            error: pErr?.message,
          });
          insertErrors.push({
            name: p.business_name,
            city: p.city,
            reason: pErr?.message || "pipeline insert failed",
          });
          continue;
        }

        inserted++;
        insertedProspectIds.push(pipeline.id);
      }

      // Update batch
      await supabase
        .from("prospect_batches")
        .update({
          lead_count: (batch.lead_count || 0) + inserted,
          scrape_status: "confirmed",
        })
        .eq("id", batch_id);

      // Fire auto-enrichment
      if (insertedProspectIds.length > 0) {
        await inngest.send({
          name: "ops/batch.auto-enrich",
          data: {
            batchId: batch_id,
            prospectIds: insertedProspectIds,
          },
        });
      }

      // NO spending recorded — already paid during dry run
      return NextResponse.json({
        success: true,
        inserted,
        insert_errors: insertErrors,
        error_count: insertErrors.length,
        from_cache: true,
        auto_enrich_triggered: insertedProspectIds.length > 0,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // DRY RUN PATH — search Google, save results to cache
    // ═══════════════════════════════════════════════════════════════
    const { limit: rawLimit = 25 } = body;
    const limit = Math.min(rawLimit, 25);

    const filters = {
      min_rating: body.min_rating ?? 0,
      max_reviews: body.max_reviews ?? 999999,
      no_website_only: body.no_website_only ?? false,
    };

    const cities: string[] = body.cities || batch.city_targets || ["Tampa"];

    // Spending guard
    const maxSearchCalls = cities.length * 2;
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

    // Load dedup sets
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

    // Search Google + apply filters + build toInsert list
    let searchCalls = 0;
    let detailCalls = 0;
    let newFound = 0;
    const toInsert: Prospect[] = [];
    const preview: {
      name: string; city: string; is_duplicate: boolean;
      filtered_out: boolean; filter_reason?: string; place_id: string;
      rating?: number; reviews?: number; has_website?: boolean;
    }[] = [];

    for (const cityName of cities) {
      if (newFound >= limit) break;

      const query = `roofing contractor in ${cityName}`;
      let pageToken: string | undefined;
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

          // When "no website only" — call details API to check website
          let hasWebsite: boolean | undefined;
          let detailsData: any = null;
          if (!isDuplicate && !filteredOut && filters.no_website_only) {
            detailsData = await getPlaceDetails(place.place_id);
            detailCalls++;
            hasWebsite = !!detailsData.website;
            if (hasWebsite) {
              filteredOut = true;
              filterReason = "Has website (filtered by 'No website only')";
            }
          }

          // For prospects that pass all filters, get full details if we don't have them yet
          if (!isDuplicate && !filteredOut) {
            if (!detailsData) {
              detailsData = await getPlaceDetails(place.place_id);
              detailCalls++;
            }

            // Skip non-operational businesses
            if (detailsData.business_status && detailsData.business_status !== "OPERATIONAL") {
              filteredOut = true;
              filterReason = `Business status: ${detailsData.business_status}`;
            } else {
              const { city: parsedCity, state } = parseCityState(detailsData.formatted_address || "");

              // Final dedup with exact name from details
              const exactKey = `${detailsData.name}|${parsedCity || cityName}`.toLowerCase();
              if (existingNames.has(exactKey)) {
                // Mark as duplicate in preview but don't add to toInsert
                preview.push({
                  name: detailsData.name || place.name || "Unknown",
                  city: cityName,
                  is_duplicate: true,
                  filtered_out: false,
                  place_id: place.place_id,
                  rating: placeRating || undefined,
                  reviews: placeReviews || undefined,
                  has_website: hasWebsite,
                });
                continue;
              }

              toInsert.push({
                business_name: detailsData.name || place.name,
                phone: detailsData.formatted_phone_number || null,
                website: detailsData.website || null,
                address: detailsData.formatted_address || "",
                city: parsedCity || cityName,
                state: state || "FL",
                rating: detailsData.rating || null,
                reviews_count: detailsData.user_ratings_total || null,
                google_place_id: place.place_id || null,
              });

              existingNames.add(exactKey);
              existingPlaceIds.add(place.place_id);
              newFound++;
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
        }

        pageToken = results.next_page_token;
        if (!pageToken) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const newCount = toInsert.length;
    const dupCount = preview.filter(p => p.is_duplicate).length;
    const filteredCount = preview.filter(p => p.filtered_out).length;
    const searchCost = searchCalls * 0.032;
    const detailCost = detailCalls * 0.017;

    // Record spending
    await recordSpending("google_text_search", searchCalls, 0.032, `Dry run: ${cities.join(", ")}`);
    if (detailCalls > 0) {
      await recordSpending("google_place_details", detailCalls, 0.017, `Dry run details: ${cities.join(", ")}`);
    }

    // ── SAVE TO CACHE — this is the key change ──
    // Delete any existing unconsumed preview for this batch first
    await supabase
      .from("scrape_preview_cache")
      .delete()
      .eq("batch_id", batch_id)
      .eq("consumed", false);

    const { error: cacheInsertErr } = await supabase
      .from("scrape_preview_cache")
      .insert({
        batch_id,
        filters,
        prospects: toInsert,
        preview_meta: {
          new_count: newCount,
          dup_count: dupCount,
          filtered_count: filteredCount,
          search_calls: searchCalls,
          detail_calls: detailCalls,
          costs: {
            search: searchCost,
            detail: detailCost,
            total: searchCost + detailCost,
          },
        },
      });

    if (cacheInsertErr) {
      console.error("[scrape/dry-run] cache insert failed", cacheInsertErr);
      // Still return the preview — just warn that confirm won't work
      return NextResponse.json({
        dry_run: true,
        cache_error: "Failed to save preview — confirm will require a new dry run",
        found: preview.length,
        new_prospects: newCount,
        duplicates: dupCount,
        filtered_out: filteredCount,
        search_api_calls: searchCalls,
        detail_api_calls: detailCalls,
        dry_run_cost: `$${(searchCost + detailCost).toFixed(2)}`,
        confirm_cost: "$0.00",
        total_cost: `$${(searchCost + detailCost).toFixed(2)}`,
        preview,
      });
    }

    return NextResponse.json({
      dry_run: true,
      cached: true,
      found: preview.length,
      new_prospects: newCount,
      duplicates: dupCount,
      filtered_out: filteredCount,
      search_api_calls: searchCalls,
      detail_api_calls: detailCalls,
      dry_run_cost: `$${(searchCost + detailCost).toFixed(2)}`,
      confirm_cost: "$0.00",
      total_cost: `$${(searchCost + detailCost).toFixed(2)}`,
      preview,
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/ops/scrape ──────────────────────────────────────────
// Cleanup: delete empty batches when user cancels without confirming
export async function DELETE(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batch_id");

    if (!batchId) {
      return NextResponse.json({ error: "batch_id required" }, { status: 400 });
    }

    // Only delete empty pending batches
    const { data: batch } = await supabase
      .from("prospect_batches")
      .select("id, lead_count, scrape_status")
      .eq("id", batchId)
      .single();

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if ((batch.lead_count || 0) > 0 || batch.scrape_status === "confirmed") {
      return NextResponse.json(
        { error: "Cannot delete batch with leads or confirmed scrape" },
        { status: 400 }
      );
    }

    // Delete batch (cascade deletes cache rows)
    await supabase
      .from("prospect_batches")
      .delete()
      .eq("id", batchId);

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    console.error("Scrape delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
