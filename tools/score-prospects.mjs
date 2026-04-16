#!/usr/bin/env node

// Prospect Scorer — takes scraped CSV, scores each prospect into NFC tiers,
// and inserts into prospect_pipeline table for ops dashboard review.
//
// Scoring mirrors lib/nfc-scoring.ts (single source of truth).
//
// NFC Tiers:
//   Platinum — 14+ points, top prospects
//   Gold     — 10-13 points, strong prospects
//   Silver   — 7-9 points, maybe
//   Skip     — <7 points, <4.0 rating, 0-2 reviews, 50+ reviews, or has estimate widget
//
// Outreach routing:
//   Direct mail is primary channel
//   Has website, no form → cold_email
//   Gold + LinkedIn      → linkedin_draft (secondary)
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
  const hasEstimateWidget = row.has_estimate_widget === "true";
  const hasWebsite = row.website && row.website !== "none" && row.website !== "";
  const hasPhone = row.phone && row.phone !== "" && row.phone !== "unknown";
  const hasFacebook = row.facebook_page_url && row.facebook_page_url !== "";
  const hasLicense = row.fl_license_type && row.fl_license_type !== "";

  const reasons = [];
  const outreachMethod = "direct_mail";

  // ── Auto-skip conditions (mirrors lib/nfc-scoring.ts) ────────

  if (hasEstimateWidget) {
    reasons.push("Has estimate widget — using competitor");
    return { tier: "skip", reasons, reviewCount, rating, outreachMethod: null };
  }

  if (rating > 0 && rating < 4.0) {
    reasons.push(`${rating}★ — below 4.0 threshold`);
    return { tier: "skip", reasons, reviewCount, rating, outreachMethod: null };
  }

  if (reviewCount <= 2) {
    reasons.push(`${reviewCount} reviews — too new, possible side hustle`);
    return { tier: "skip", reasons, reviewCount, rating, outreachMethod: null };
  }

  if (reviewCount >= 50) {
    reasons.push(`${reviewCount} reviews — too established for NFC card`);
    return { tier: "skip", reasons, reviewCount, rating, outreachMethod: null };
  }

  // ── Point scoring (mirrors lib/nfc-scoring.ts) ───────────────

  let score = 0;

  // Website: no website = +3 (highest need), has website = -3
  if (!hasWebsite) { score += 3; reasons.push("+3 No website — highest need"); }
  else { score -= 3; reasons.push("-3 Has website"); }

  // Review count sweet spot
  if (reviewCount >= 5 && reviewCount <= 25) { score += 2; reasons.push(`+2 ${reviewCount} reviews — sweet spot`); }
  else if (reviewCount >= 3 && reviewCount <= 4) { score += 1; reasons.push(`+1 ${reviewCount} reviews — very new`); }
  else if (reviewCount >= 26 && reviewCount <= 49) { score += 0; reasons.push(`+0 ${reviewCount} reviews — growing`); }

  // Rating
  if (rating >= 4.8) { score += 2; reasons.push(`+2 ${rating}★ — excellent`); }
  else if (rating >= 4.5) { score += 1; reasons.push(`+1 ${rating}★ — good`); }

  // FL license
  if (hasLicense) { score += 2; reasons.push("+2 FL Licensed"); }

  // Phone
  if (hasPhone) { score += 1; reasons.push("+1 Has phone"); }

  // Facebook
  if (hasFacebook) { score += 1; reasons.push("+1 Has Facebook"); }

  // ── Tier assignment ──────────────────────────────────────────

  let tier;
  if (score >= 14) tier = "platinum";
  else if (score >= 10) tier = "gold";
  else if (score >= 7) tier = "silver";
  else tier = "skip";

  reasons.unshift(`Score: ${score} → ${tier.toUpperCase()}`);
  return { tier, reasons, reviewCount, rating, outreachMethod };
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

    // Check for duplicate by phone number
    const phone = row.phone || row.scraped_phone || null;
    if (phone) {
      const { data: existing } = await supabase
        .from("prospect_pipeline")
        .select("id")
        .eq("phone", phone)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  Skipped duplicate: ${row.business_name} (phone: ${phone})`);
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
      phone: phone,
      rating: row.google_rating ? parseFloat(row.google_rating) : null,
      reviews_count: row.google_review_count ? parseInt(row.google_review_count, 10) : null,
      owner_name: row.owner_name || null,
      owner_email: row.email || null,
      their_website_url: row.website !== "none" ? row.website : null,
      scraped_at: now.toISOString(),
      // Outreach routing
      outreach_method: row.outreach_method || null,
      // Form detection data
      contact_form_url: row.contact_form_url || null,
      form_field_mapping: row.form_field_mapping ? JSON.parse(row.form_field_mapping) : null,
      has_captcha: row.has_captcha === "true",
      form_detected_at: row.contact_form_url ? now.toISOString() : null,
      // Business age
      years_in_business: row.years_in_business ? parseInt(row.years_in_business, 10) : null,
      founded_year: row.founded_year ? parseInt(row.founded_year, 10) : null,
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
    const { tier, reasons, reviewCount, rating, outreachMethod } = scoreProspect(row);
    return {
      ...row,
      tier,
      tier_reasons: reasons.join("; "),
      review_count_parsed: reviewCount,
      rating_parsed: rating,
      outreach_method: outreachMethod,
    };
  });

  // Summary
  const tierCounts = { gold: 0, silver: 0, skip: 0 };
  const methodCounts = { form: 0, cold_email: 0, linkedin_draft: 0 };
  for (const row of scored) {
    tierCounts[row.tier]++;
    if (row.outreach_method) methodCounts[row.outreach_method]++;
  }

  console.log("┌─────────────────────────────────┐");
  console.log("│       PROSPECT SCORING          │");
  console.log("├─────────┬───────┬───────────────┤");
  console.log(`│  Gold   │  ${String(tierCounts.gold).padStart(3)}  │ Best fit      │`);
  console.log(`│  Silver │  ${String(tierCounts.silver).padStart(3)}  │ Good fit      │`);
  console.log(`│  Skip   │  ${String(tierCounts.skip).padStart(3)}  │ Not a fit     │`);
  console.log("├─────────┼───────┼───────────────┤");
  console.log(`│  Total  │  ${String(scored.length).padStart(3)}  │               │`);
  console.log("└─────────┴───────┴───────────────┘");
  console.log("");
  console.log("┌─────────────────────────────────┐");
  console.log("│     OUTREACH ROUTING            │");
  console.log("├──────────────┬───────┬──────────┤");
  console.log(`│  Cold Email  │  ${String(methodCounts.cold_email).padStart(3)}  │ Primary  │`);
  console.log(`│  Form Submit │  ${String(methodCounts.form).padStart(3)}  │ Auto     │`);
  console.log("└──────────────┴───────┴──────────┘");

  // Show details per tier
  for (const tier of ["gold", "silver", "skip"]) {
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
