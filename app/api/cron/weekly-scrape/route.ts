// Daily auto-scrape cron — runs Mon-Fri at 6am ET (10:00 UTC)
// Adds 100 leads/day to the current week's batch.
// Creates a new batch on Monday, reuses it Tue-Fri.
// City targets carry forward from the previous batch.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DAILY_TARGET = 100;
const DEFAULT_CITIES = ["Tampa", "Orlando", "Jacksonville", "St. Petersburg", "Miami"];

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Calculate current ISO week
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const weekNumber = Math.ceil((days + jan1.getDay() + 1) / 7);
    const weekYear = now.getFullYear();

    // Step 1: Check if batch exists for this week
    const { data: existingBatch } = await supabase
      .from("prospect_batches")
      .select("*")
      .eq("week_number", weekNumber)
      .eq("week_year", weekYear)
      .single();

    let batch = existingBatch;
    let cities = DEFAULT_CITIES;

    if (batch) {
      // Tue-Fri: reuse existing batch, use its cities
      cities = batch.city_targets?.length > 0 ? batch.city_targets : DEFAULT_CITIES;
    } else {
      // Monday: create new batch
      // Get cities from last batch
      const { data: prevBatch } = await supabase
        .from("prospect_batches")
        .select("city_targets")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (prevBatch?.city_targets?.length > 0) {
        cities = prevBatch.city_targets;
      }

      // Calculate week start (Monday) and end (Sunday)
      const dayOfWeek = now.getDay() || 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { data: newBatch, error: batchErr } = await supabase
        .from("prospect_batches")
        .insert({
          week_number: weekNumber,
          week_year: weekYear,
          week_start: weekStart.toISOString().slice(0, 10),
          week_end: weekEnd.toISOString().slice(0, 10),
          city_targets: cities,
          lead_count: 0,
          status: "active",
        })
        .select()
        .single();

      if (batchErr || !newBatch) {
        return NextResponse.json({ error: `Batch creation failed: ${batchErr?.message}` }, { status: 500 });
      }

      batch = newBatch;
    }

    // Step 2: Scrape leads into the batch
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruufpro.com";
    const scrapeRes = await fetch(`${baseUrl}/api/ops/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch_id: batch.id, limit: DAILY_TARGET, cities }),
    });

    const scrapeData = await scrapeRes.json();

    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

    return NextResponse.json({
      success: true,
      day: dayName,
      batch_id: batch.id,
      week: weekNumber,
      is_new_batch: !existingBatch,
      cities,
      leads_scraped: scrapeData.inserted || 0,
      duplicates_skipped: scrapeData.duplicates_skipped || 0,
      estimated_cost: scrapeData.estimated_cost || "unknown",
      batch_total: (batch.lead_count || 0) + (scrapeData.inserted || 0),
    });
  } catch (err: any) {
    console.error("Daily scrape cron failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
