#!/usr/bin/env node

// Prospect Scorer — takes scraped CSV, scores each prospect into tiers,
// and inserts into prospect_pipeline table for ops dashboard review.
//
// Tiers:
//   Gold   — has form, no CAPTCHA, <100 reviews, 4.0+ rating, no estimate widget
//   Silver — has form, no CAPTCHA, 100-300 reviews OR <4.0 rating
//   Bronze — has form + CAPTCHA (email fallback), or 300+ reviews
//   Skip   — no form + no email, already has estimate widget, 500+ reviews
//
// Usage:
//   node tools/score-prospects.mjs --csv .tmp/prospects/tampa_fl_scraped.csv
//   node tools/score-prospects.mjs --csv .tmp/prospects/tampa_fl_scraped.csv --dry-run
//   node tools/score-prospects.mjs --csv .tmp/prospects/tampa_fl_scraped.csv --tier gold
//
// Output: Scored CSV + inserts into prospect_pipeline (unless --dry-run).

import { readCsv, writeCsv } from "./lib/csv.mjs";
import { supabase } from "./lib/supabase-admin.mjs";
import { existsSync } from "fs";

// --------------- Config ---------------

const TIERS = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  skip: "Skip",
};

// --------------- Argument Parsing ---------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--csv" && args[i + 1]) {
      opts.csv = args[++i];
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--tier" && args[i + 1]) {
      opts.tierFilter = args[++i].toLowerCase();
    } else if (arg === "--output" && args[i + 1]) {
      opts.output = args[++i];
    }
  }

  return opts;
}

// --------------- Scoring Logic ---------------

function scoreProspect(row) {
  const reviewCount = parseInt(row.google_review_count || row.user_ratings_total || "0", 10);
  const rating = parseFloat(row.google_rating || row.rating || "0");
  const hasForm = row.scrape_status === "success" && row.contact_form_url && row.contact_form_url !== "";
  const hasCaptcha = row.has_captcha === "true";
  const hasEstimateWidget = row.has_estimate_widget === "true";
  const hasWebsite = row.website && row.website !== "none" && row.website !== "";
  const websiteStatus = row.website_status || "";

  const reasons = [];

  // ---- Skip conditions (checked first) ----

  // Already has estimate widget — they're using Roofle/Roofr, not our ICP
  if (hasEstimateWidget) {
    const providers = row.estimate_widget_providers || "unknown";
    reasons.push(`Has estimate widget (${providers})`);
    return { tier: "skip", reasons, reviewCount, rating };
  }

  // 500+ reviews = enterprise/large company
  if (reviewCount >= 500) {
    reasons.push(`${reviewCount} reviews — enterprise, not our ICP`);
    return { tier: "skip", reasons, reviewCount, rating };
  }

  // No form AND no website = can't reach them via form outreach
  if (!hasForm && !hasWebsite) {
    reasons.push("No website, no form — can't reach via form outreach");
    return { tier: "skip", reasons, reviewCount, rating };
  }

  // No form AND no contact page found
  if (!hasForm && hasWebsite) {
    reasons.push("Has website but no contact form detected — email fallback only");
    return { tier: "bronze", reasons, reviewCount, rating };
  }

  // ---- CAPTCHA is solvable via CapSolver (~$0.0015/solve) ----
  // No longer a blocker — score based on other criteria instead

  // 300-499 reviews = mid-size, less likely to need us
  if (reviewCount >= 300) {
    reasons.push(`${reviewCount} reviews — mid-size company`);
    return { tier: "bronze", reasons, reviewCount, rating };
  }

  // ---- Silver: good but not perfect ----

  // 100-299 reviews = established, may already have marketing
  if (reviewCount >= 100) {
    reasons.push(`${reviewCount} reviews — established, may have marketing`);
    return { tier: "silver", reasons, reviewCount, rating };
  }

  // Low rating = might have quality issues (our site won't fix that)
  if (rating > 0 && rating < 4.0) {
    reasons.push(`${rating} rating — low rating could indicate quality issues`);
    return { tier: "silver", reasons, reviewCount, rating };
  }

  // ---- Gold: ideal prospect ----
  reasons.push("Has form, no CAPTCHA, <100 reviews, 4.0+ rating, no widget");

  // Bonus signals
  if (!hasWebsite || websiteStatus === "none" || websiteStatus === "directory_only") {
    reasons.push("No real website — highest need");
  } else if (websiteStatus === "free_builder") {
    reasons.push("Using free website builder — needs upgrade");
  }

  if (reviewCount < 20) {
    reasons.push(`Only ${reviewCount} reviews — likely new/small crew`);
  }

  return { tier: "gold", reasons, reviewCount, rating };
}

// --------------- Pipeline Insert ---------------

async function insertIntoPipeline(rows) {
  // Generate a batch ID for this import
  const now = new Date();
  const weekNumber = getWeekNumber(now);

  // Create batch
  const { data: batch, error: batchErr } = await supabase
    .from("prospect_batches")
    .insert({
      week_number: weekNumber,
      week_year: now.getFullYear(),
      week_start: getWeekStart(now).toISOString(),
      week_end: getWeekEnd(now).toISOString(),
      city_targets: [...new Set(rows.map((r) => r.city).filter(Boolean))],
      lead_count: rows.length,
      status: "active",
    })
    .select("id")
    .single();

  if (batchErr) {
    console.error("Failed to create batch:", batchErr.message);
    return { inserted: 0, skipped: 0, errors: [batchErr.message] };
  }

  console.log(`\nCreated batch ${batch.id} (week ${weekNumber})`);

  // Insert prospects
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const row of rows) {
    // Check for duplicate by website URL
    if (row.website && row.website !== "none") {
      const { data: existing } = await supabase
        .from("prospect_pipeline")
        .select("id")
        .eq("their_website_url", row.website)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  Skipped duplicate: ${row.business_name} (${row.website})`);
        skipped++;
        continue;
      }
    }

    const prospect = {
      batch_id: batch.id,
      stage: "scraped",
      stage_entered_at: now.toISOString(),
      business_name: row.business_name || row.name || "Unknown",
      city: row.city || "",
      state: row.state || "FL",
      phone: row.phone || row.scraped_phone || null,
      rating: row.google_rating ? parseFloat(row.google_rating) : null,
      reviews_count: row.google_review_count ? parseInt(row.google_review_count, 10) : null,
      owner_name: row.owner_name || null,
      owner_email: row.email || null,
      their_website_url: row.website !== "none" ? row.website : null,
      scraped_at: now.toISOString(),
      // Form detection data
      contact_form_url: row.contact_form_url || null,
      form_field_mapping: row.form_field_mapping ? JSON.parse(row.form_field_mapping) : null,
      has_captcha: row.has_captcha === "true",
      form_detected_at: row.contact_form_url ? now.toISOString() : null,
    };

    const { error: insertErr } = await supabase
      .from("prospect_pipeline")
      .insert(prospect);

    if (insertErr) {
      console.error(`  Failed: ${row.business_name} — ${insertErr.message}`);
      errors.push(`${row.business_name}: ${insertErr.message}`);
    } else {
      inserted++;
    }
  }

  return { inserted, skipped, errors, batchId: batch.id };
}

// --------------- Helpers ---------------

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

// --------------- Main ---------------

async function main() {
  const opts = parseArgs();

  if (!opts.csv) {
    console.error("Usage:");
    console.error("  node tools/score-prospects.mjs --csv .tmp/prospects/batch_scraped.csv");
    console.error("  node tools/score-prospects.mjs --csv .tmp/prospects/batch_scraped.csv --dry-run");
    console.error("  node tools/score-prospects.mjs --csv .tmp/prospects/batch_scraped.csv --tier gold");
    process.exit(1);
  }

  if (!existsSync(opts.csv)) {
    console.error(`CSV file not found: ${opts.csv}`);
    process.exit(1);
  }

  const rows = readCsv(opts.csv);
  console.log(`\nScoring ${rows.length} prospects...\n`);

  // Score each prospect
  const scored = rows.map((row) => {
    const { tier, reasons, reviewCount, rating } = scoreProspect(row);
    return {
      ...row,
      tier,
      tier_reasons: reasons.join("; "),
      review_count_parsed: reviewCount,
      rating_parsed: rating,
    };
  });

  // Summary
  const tierCounts = { gold: 0, silver: 0, bronze: 0, skip: 0 };
  for (const row of scored) {
    tierCounts[row.tier]++;
  }

  console.log("┌─────────────────────────────────┐");
  console.log("│       PROSPECT SCORING          │");
  console.log("├─────────┬───────┬───────────────┤");
  console.log(`│  Gold   │  ${String(tierCounts.gold).padStart(3)}  │ Best fit      │`);
  console.log(`│  Silver │  ${String(tierCounts.silver).padStart(3)}  │ Good fit      │`);
  console.log(`│  Bronze │  ${String(tierCounts.bronze).padStart(3)}  │ Maybe         │`);
  console.log(`│  Skip   │  ${String(tierCounts.skip).padStart(3)}  │ Not a fit     │`);
  console.log("├─────────┼───────┼───────────────┤");
  console.log(`│  Total  │  ${String(scored.length).padStart(3)}  │               │`);
  console.log("└─────────┴───────┴───────────────┘");

  // Show details per tier
  for (const tier of ["gold", "silver", "bronze", "skip"]) {
    const tierRows = scored.filter((r) => r.tier === tier);
    if (tierRows.length === 0) continue;

    console.log(`\n${TIERS[tier]} (${tierRows.length}):`);
    for (const row of tierRows) {
      const name = row.business_name || row.name || "Unknown";
      const reviews = row.review_count_parsed || 0;
      const rating = row.rating_parsed || "?";
      console.log(`  ${name} — ${rating}★ ${reviews} reviews — ${row.tier_reasons}`);
    }
  }

  // Write scored CSV
  const outputPath = opts.output || opts.csv.replace(".csv", "_scored.csv");
  writeCsv(outputPath, scored);

  // Filter by tier if requested
  const toInsert = opts.tierFilter
    ? scored.filter((r) => r.tier === opts.tierFilter)
    : scored.filter((r) => r.tier !== "skip");

  if (opts.dryRun) {
    console.log(`\n[DRY RUN] Would insert ${toInsert.length} prospects into pipeline.`);
    console.log("Run without --dry-run to insert into the database.");
    return;
  }

  if (toInsert.length === 0) {
    console.log("\nNo prospects to insert (all scored as Skip or filtered out).");
    return;
  }

  console.log(`\nInserting ${toInsert.length} prospects into pipeline...`);
  const result = await insertIntoPipeline(toInsert);
  console.log(`\nDone: ${result.inserted} inserted, ${result.skipped} duplicates skipped.`);
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
