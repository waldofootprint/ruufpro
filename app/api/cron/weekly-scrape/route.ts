// Weekly auto-scrape cron — runs every Monday at 6am ET (10:00 UTC)
// Creates a new batch and scrapes 500 leads from Google Maps.
// City targets carry forward from the previous batch.

import { NextRequest, NextResponse } from "next/server";

const WEEKLY_TARGET = 500;
const DEFAULT_CITIES = ["Tampa", "Orlando", "Jacksonville", "St. Petersburg", "Miami"];

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruufpro.com";

  try {
    // Step 1: Get previous batch's city targets
    let cities = DEFAULT_CITIES;
    try {
      const pipelineRes = await fetch(`${baseUrl}/api/ops/pipeline`, {
        headers: { cookie: req.headers.get("cookie") || "" },
      });
      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        if (data.batches?.length > 0 && data.batches[0].city_targets?.length > 0) {
          cities = data.batches[0].city_targets;
        }
      }
    } catch {
      // Fall back to defaults
    }

    // Step 2: Create batch
    const batchRes = await fetch(`${baseUrl}/api/ops/pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city_targets: cities }),
    });

    if (!batchRes.ok) {
      const err = await batchRes.json();
      return NextResponse.json({ error: `Batch creation failed: ${err.error}` }, { status: 500 });
    }

    const { batch } = await batchRes.json();

    // Step 3: Scrape leads
    const scrapeRes = await fetch(`${baseUrl}/api/ops/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch_id: batch.id, limit: WEEKLY_TARGET, cities }),
    });

    const scrapeData = await scrapeRes.json();

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      week: batch.week_number,
      cities,
      leads_scraped: scrapeData.inserted || 0,
      duplicates_skipped: scrapeData.duplicates_skipped || 0,
      estimated_cost: scrapeData.estimated_cost || "unknown",
    });
  } catch (err: any) {
    console.error("Weekly scrape cron failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
