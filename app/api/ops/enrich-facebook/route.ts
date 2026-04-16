import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = "apify/facebook-pages-scraper";

// ── POST /api/ops/enrich-facebook ──────────────────────────────────
// Body: { batch_id?, prospect_ids? }
// Searches Facebook for business pages by name + city.
// Best-effort: failures don't block pipeline advancement.
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: "APIFY_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { batch_id, prospect_ids } = await req.json();

    if (!batch_id && !prospect_ids?.length) {
      return NextResponse.json({ error: "batch_id or prospect_ids required" }, { status: 400 });
    }

    // Get prospects that don't have Facebook data yet
    let query = supabase
      .from("prospect_pipeline")
      .select("id, business_name, city, state")
      .is("facebook_page_url", null);

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
        message: "No prospects need Facebook enrichment",
      });
    }

    let enriched = 0;
    const errors: string[] = [];

    // Process each prospect individually — search Facebook by business name + city
    for (const prospect of prospects) {
      try {
        const searchQuery = `${prospect.business_name} ${prospect.city} ${prospect.state}`;

        // Run Apify actor synchronously (waits for result)
        const res = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startUrls: [],
              searchPages: [searchQuery],
              maxPages: 1,
              maxPagesPerQuery: 1,
            }),
          }
        );

        if (!res.ok) {
          errors.push(`${prospect.business_name}: Apify ${res.status}`);
          await supabase
            .from("prospect_pipeline")
            .update({ facebook_enrichment_status: "error" })
            .eq("id", prospect.id);
          continue;
        }

        const results = await res.json();

        // Take the first (best match) result
        const page = Array.isArray(results) && results.length > 0 ? results[0] : null;

        if (!page) {
          // No Facebook page found — flag it for triage visibility
          await supabase
            .from("prospect_pipeline")
            .update({ facebook_enrichment_status: "no_match" })
            .eq("id", prospect.id);
          continue;
        }

        // Update prospect with Facebook data
        const { error: updateErr } = await supabase
          .from("prospect_pipeline")
          .update({
            facebook_page_url: page.url || page.pageUrl || null,
            facebook_about: page.about || page.description || null,
            facebook_photos: (page.photos || []).slice(0, 10),
            facebook_enrichment_status: "success",
          })
          .eq("id", prospect.id);

        if (updateErr) {
          errors.push(`${prospect.business_name}: DB update failed`);
        } else {
          enriched++;
        }

        // Pause between requests to stay within Apify rate limits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err: any) {
        errors.push(`${prospect.business_name}: ${err.message}`);
        await supabase
          .from("prospect_pipeline")
          .update({ facebook_enrichment_status: "error" })
          .eq("id", prospect.id);
      }
    }

    return NextResponse.json({
      success: true,
      enriched,
      total: prospects.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Enrich Facebook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
