#!/usr/bin/env node

// Outreach Pipeline Orchestrator — chains all prospect tools into one flow.
//
// Full pipeline:
//   1. find_prospects.py → scrape Google Maps for roofers
//   2. scrape-prospect-site.mjs → extract content from their websites
//   3. generate-site-preview.mjs → create live preview sites in Supabase
//   4. generate_email_sequence.py → create Instantly-ready cold email CSVs
//
// Usage:
//   node tools/outreach-pipeline.mjs --city "Tampa" --state "FL" --limit 10
//   node tools/outreach-pipeline.mjs --csv .tmp/prospects/existing_batch.csv
//   node tools/outreach-pipeline.mjs --csv .tmp/prospects/existing_batch.csv --skip-scrape
//   node tools/outreach-pipeline.mjs --city "Tampa" --state "FL" --limit 10 --dry-run
//
// Flags:
//   --skip-scrape     Skip website scraping (use existing CSV data only)
//   --skip-preview    Skip preview site generation
//   --skip-emails     Skip email sequence generation
//   --dry-run         Show what would happen without making API calls or DB writes
//   --no-screenshot   Skip Playwright screenshots for preview sites
//
// IMPORTANT: Google Maps API costs ~$0.05/prospect. Always confirm with Hannah before running.

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { readCsv } from "./lib/csv.mjs";

const TOOLS_DIR = resolve(new URL(".", import.meta.url).pathname);
const PROJECT_ROOT = resolve(TOOLS_DIR, "..");
const TMP_DIR = resolve(PROJECT_ROOT, ".tmp/prospects");

// --------------- Argument Parsing ---------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--city" && args[i + 1]) opts.city = args[++i];
    else if (arg === "--state" && args[i + 1]) opts.state = args[++i];
    else if (arg === "--limit" && args[i + 1]) opts.limit = parseInt(args[++i]);
    else if (arg === "--csv" && args[i + 1]) opts.csv = args[++i];
    else if (arg === "--skip-scrape") opts.skipScrape = true;
    else if (arg === "--skip-preview") opts.skipPreview = true;
    else if (arg === "--skip-emails") opts.skipEmails = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--no-screenshot") opts.noScreenshot = true;
    else if (arg === "--filter" && args[i + 1]) opts.filter = args[++i];
  }

  return opts;
}

// --------------- Pipeline Steps ---------------

function runStep(stepName, command, dryRun = false) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  STEP: ${stepName}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dryRun) {
    console.log(`  [DRY RUN] Would execute: ${command}\n`);
    return true;
  }

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      timeout: 5 * 60 * 1000, // 5 min timeout per step
    });
    return true;
  } catch (err) {
    console.error(`\n  ✗ Step "${stepName}" failed: ${err.message}`);
    return false;
  }
}

// --------------- Main ---------------

async function main() {
  const opts = parseArgs();

  if (!opts.csv && (!opts.city || !opts.state)) {
    console.error("Usage:");
    console.error('  node tools/outreach-pipeline.mjs --city "Tampa" --state "FL" --limit 10');
    console.error("  node tools/outreach-pipeline.mjs --csv .tmp/prospects/existing_batch.csv");
    console.error("\nFlags:");
    console.error("  --skip-scrape     Skip website content scraping");
    console.error("  --skip-preview    Skip preview site generation");
    console.error("  --skip-emails     Skip email sequence generation");
    console.error("  --dry-run         Show what would happen without running");
    console.error("  --no-screenshot   Skip screenshots for preview sites");
    process.exit(1);
  }

  const limit = opts.limit || 10;
  const filter = opts.filter || "has_website"; // Default: only prospects with websites (so we can scrape them)
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  console.log("\n" + "=".repeat(60));
  console.log("  RUUFPRO OUTREACH PIPELINE");
  console.log("=".repeat(60));

  if (opts.dryRun) {
    console.log("\n  *** DRY RUN MODE — no API calls, no DB writes ***\n");
  }

  // Track file paths through the pipeline
  let prospectCsv = opts.csv || null;
  let scrapedCsv = null;

  // ============================================================
  // STEP 1: Find Prospects (Google Maps)
  // ============================================================
  if (!prospectCsv) {
    const city = opts.city;
    const state = opts.state;
    const outputFile = resolve(TMP_DIR, `${city.toLowerCase()}_${state.toLowerCase()}_${timestamp}.csv`);

    // Cost estimate
    const estimatedCost = (limit * 0.05).toFixed(2);
    console.log(`\n📍 Finding ${limit} roofers in ${city}, ${state}`);
    console.log(`   Estimated API cost: ~$${estimatedCost}`);

    if (opts.dryRun) {
      console.log(`   [DRY RUN] Would create: ${outputFile}`);
      console.log("\n   ⚠  Cannot continue pipeline without prospect data in dry-run mode.");
      console.log("   Run without --dry-run to execute, or provide --csv with existing data.\n");
      return;
    }

    const findCmd = `python3 tools/find_prospects.py --metro "${city}" --state "${state}" --limit ${limit} --filter ${filter}`;
    const success = runStep("Find Prospects (Google Maps)", findCmd);

    if (!success) {
      console.error("\n❌ Pipeline aborted at Step 1. Fix the error above and retry.\n");
      process.exit(1);
    }

    // Find the output file (find_prospects.py names it with a timestamp)
    const files = existsSync(TMP_DIR)
      ? readFileSync("/dev/stdin", { encoding: "utf-8", timeout: 100 }).catch(() => null)
      : null;

    // Look for the most recent CSV in the prospects dir
    const { readdirSync, statSync } = await import("fs");
    const prospectFiles = readdirSync(TMP_DIR)
      .filter((f) => f.endsWith(".csv") && f.includes(city.toLowerCase()))
      .map((f) => ({ name: f, path: resolve(TMP_DIR, f), mtime: statSync(resolve(TMP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (prospectFiles.length === 0) {
      console.error("\n❌ No prospect CSV found after scraping. Check find_prospects.py output.\n");
      process.exit(1);
    }

    prospectCsv = prospectFiles[0].path;
    console.log(`\n✅ Prospects saved to: ${prospectCsv}`);
  } else {
    if (!existsSync(prospectCsv)) {
      console.error(`\n❌ CSV not found: ${prospectCsv}\n`);
      process.exit(1);
    }
    console.log(`\n📄 Using existing prospect CSV: ${prospectCsv}`);
  }

  // Count prospects
  const prospects = readCsv(prospectCsv);
  const withWebsites = prospects.filter((p) => {
    const w = p.website || p.Website || "";
    return w && w !== "none" && w !== "N/A" && w !== "";
  });
  console.log(`   Total prospects: ${prospects.length}`);
  console.log(`   With websites: ${withWebsites.length}`);

  // ============================================================
  // STEP 2: Scrape Prospect Websites
  // ============================================================
  if (!opts.skipScrape) {
    scrapedCsv = prospectCsv.replace(".csv", "_scraped.csv");

    const scrapeCmd = `node tools/scrape-prospect-site.mjs --csv "${prospectCsv}" --output "${scrapedCsv}"`;
    const success = runStep("Scrape Prospect Websites", scrapeCmd, opts.dryRun);

    if (!success) {
      console.log("\n⚠  Website scraping failed. Continuing with unscraped data...\n");
      scrapedCsv = null;
    }
  } else {
    console.log("\n⏭  Skipping website scraping (--skip-scrape)");
  }

  // Use scraped CSV if available, otherwise original
  const previewCsv = scrapedCsv && existsSync(scrapedCsv) ? scrapedCsv : prospectCsv;

  // ============================================================
  // STEP 3: Generate Preview Sites
  // ============================================================
  if (!opts.skipPreview) {
    const screenshotFlag = opts.noScreenshot ? "--no-screenshot" : "";
    const previewCmd = `node tools/generate-site-preview.mjs --csv "${previewCsv}" ${screenshotFlag}`;
    const success = runStep("Generate Preview Sites", previewCmd, opts.dryRun);

    if (!success) {
      console.log("\n⚠  Preview generation failed. Check errors above.\n");
    }
  } else {
    console.log("\n⏭  Skipping preview site generation (--skip-preview)");
  }

  // ============================================================
  // STEP 4: Generate Email Sequences
  // ============================================================
  if (!opts.skipEmails) {
    const emailCmd = `python3 tools/generate_email_sequence.py --csv "${previewCsv}"`;
    const success = runStep("Generate Email Sequences", emailCmd, opts.dryRun);

    if (!success) {
      console.log("\n⚠  Email generation failed. You can run it manually later.\n");
    }
  } else {
    console.log("\n⏭  Skipping email generation (--skip-emails)");
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("  PIPELINE COMPLETE");
  console.log("=".repeat(60));
  console.log(`\n  Prospect CSV:  ${prospectCsv}`);
  if (scrapedCsv) console.log(`  Scraped CSV:   ${scrapedCsv}`);
  console.log(`  Preview CSV:   ${previewCsv}`);
  console.log(`\n  Next steps:`);
  console.log(`  1. Review preview sites at the URLs listed above`);
  console.log(`  2. Upload email CSV to Instantly for campaign launch`);
  console.log(`  3. Track outreach in Command Center dashboard`);
  console.log(`  4. Monitor replies via Slack (#reply-queue)\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
