#!/usr/bin/env node

// Site Preview Generator — creates prospect contractor/site records in Supabase
// and takes Playwright screenshots for cold email outreach.
//
// Usage:
//   node tools/generate-site-preview.mjs --name "Joe's Roofing" --city "Dallas" --state "TX" --phone "(214) 555-0123"
//   node tools/generate-site-preview.mjs --csv .tmp/prospects/batch.csv
//   node tools/generate-site-preview.mjs --csv .tmp/prospects/batch.csv --template chalkboard
//   node tools/generate-site-preview.mjs --cleanup   # remove expired prospects (>30 days)

import { supabase } from "./lib/supabase-admin.mjs";
import { generateProspectSlug } from "./lib/slugify.mjs";
import { readCsv } from "./lib/csv.mjs";
import { existsSync, statSync, mkdirSync } from "fs";
import { resolve } from "path";

// --------------- Config ---------------

const MOCKUP_DIR = resolve(new URL(".", import.meta.url).pathname, "../.tmp/mockups");
const VALID_TEMPLATES = ["modern_clean", "chalkboard", "blueprint"];
const DEFAULT_TEMPLATE = "modern_clean";
const SCREENSHOT_DELAY = 2000; // ms between screenshots in batch mode
const MIN_SCREENSHOT_SIZE = 10000; // bytes — catches blank/error pages

// --------------- Argument Parsing ---------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cleanup") {
      opts.cleanup = true;
    } else if (arg === "--name" && args[i + 1]) {
      opts.name = args[++i];
    } else if (arg === "--city" && args[i + 1]) {
      opts.city = args[++i];
    } else if (arg === "--state" && args[i + 1]) {
      opts.state = args[++i];
    } else if (arg === "--phone" && args[i + 1]) {
      opts.phone = args[++i];
    } else if (arg === "--template" && args[i + 1]) {
      opts.template = args[++i];
    } else if (arg === "--csv" && args[i + 1]) {
      opts.csv = args[++i];
    } else if (arg === "--base-url" && args[i + 1]) {
      opts.baseUrl = args[++i];
    } else if (arg === "--no-screenshot") {
      opts.noScreenshot = true;
    }
  }

  return opts;
}

// --------------- Prospect Creation ---------------

async function createProspect({ name, city, state, phone, template }) {
  // Check for duplicate
  const { data: existing } = await supabase
    .from("contractors")
    .select("id, business_name")
    .eq("business_name", name)
    .eq("city", city)
    .eq("is_prospect", true)
    .maybeSingle();

  if (existing) {
    console.log(`  ⚠ Duplicate found: "${name}" in ${city} — skipping creation`);
    // Look up existing site
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id, slug")
      .eq("contractor_id", existing.id)
      .maybeSingle();
    return { contractorId: existing.id, siteId: existingSite?.id, slug: existingSite?.slug, skipped: true };
  }

  const slug = await generateProspectSlug(name);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Create contractor record
  const { data: contractor, error: cErr } = await supabase
    .from("contractors")
    .insert({
      user_id: null,
      email: "",
      business_name: name,
      phone: phone || "",
      city,
      state,
      business_type: "residential",
      is_prospect: true,
      prospect_expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (cErr) {
    console.error(`  ✗ Failed to create contractor: ${cErr.message}`);
    return null;
  }

  // Create site record
  const { data: site, error: sErr } = await supabase
    .from("sites")
    .insert({
      contractor_id: contractor.id,
      slug,
      template: template || DEFAULT_TEMPLATE,
      published: true,
    })
    .select("id, slug")
    .single();

  if (sErr) {
    console.error(`  ✗ Failed to create site: ${sErr.message}`);
    // Clean up the contractor we just created
    await supabase.from("contractors").delete().eq("id", contractor.id);
    return null;
  }

  return { contractorId: contractor.id, siteId: site.id, slug: site.slug, skipped: false };
}

// --------------- Screenshots ---------------

async function takeScreenshots(browser, slug, baseUrl) {
  const url = `${baseUrl}/preview/${slug}`;
  const heroPath = resolve(MOCKUP_DIR, `${slug}.png`);
  const fullPath = resolve(MOCKUP_DIR, `${slug}-full.png`);

  // Skip if hero screenshot already exists (resume support)
  if (existsSync(heroPath)) {
    const size = statSync(heroPath).size;
    if (size > MIN_SCREENSHOT_SIZE) {
      console.log(`  ⏭ Screenshot exists for ${slug} — skipping`);
      return { heroPath, fullPath, skipped: true };
    }
  }

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // Wait for hero content to render
    await page.waitForTimeout(1500);

    // Hero screenshot (viewport only)
    await page.screenshot({ path: heroPath, type: "png" });

    // Full page screenshot
    await page.screenshot({ path: fullPath, fullPage: true, type: "png" });

    // Validate screenshot size
    const heroSize = statSync(heroPath).size;
    if (heroSize < MIN_SCREENSHOT_SIZE) {
      console.warn(`  ⚠ Screenshot seems small (${heroSize} bytes) — page may not have rendered`);
    }

    return { heroPath, fullPath, skipped: false };
  } catch (err) {
    console.error(`  ✗ Screenshot failed: ${err.message}`);
    return null;
  } finally {
    await page.close();
  }
}

async function checkDevServer(baseUrl) {
  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
    return res.ok || res.status === 404; // 404 is fine — server is running
  } catch {
    return false;
  }
}

// --------------- Cleanup ---------------

async function cleanupExpired() {
  const now = new Date().toISOString();

  // Find expired prospects
  const { data: expired } = await supabase
    .from("contractors")
    .select("id, business_name, city")
    .eq("is_prospect", true)
    .lt("prospect_expires_at", now);

  if (!expired || expired.length === 0) {
    console.log("No expired prospects to clean up.");
    return;
  }

  console.log(`Found ${expired.length} expired prospect(s):`);

  for (const c of expired) {
    // Delete sites first (cascade should handle this, but be explicit)
    await supabase.from("sites").delete().eq("contractor_id", c.id);
    // Delete prospect views
    const { data: sites } = await supabase
      .from("sites")
      .select("slug")
      .eq("contractor_id", c.id);
    if (sites) {
      for (const s of sites) {
        await supabase.from("prospect_views").delete().eq("slug", s.slug);
      }
    }
    // Delete contractor
    await supabase.from("contractors").delete().eq("id", c.id);
    console.log(`  ✓ Removed: ${c.business_name} (${c.city})`);
  }

  console.log(`\nCleaned up ${expired.length} expired prospect(s).`);
}

// --------------- Main ---------------

async function main() {
  const opts = parseArgs();

  // Cleanup mode
  if (opts.cleanup) {
    await cleanupExpired();
    return;
  }

  // Validate template
  const template = opts.template || DEFAULT_TEMPLATE;
  if (!VALID_TEMPLATES.includes(template)) {
    console.error(`Invalid template: ${template}. Options: ${VALID_TEMPLATES.join(", ")}`);
    process.exit(1);
  }

  // Build prospect list
  let prospects = [];

  if (opts.csv) {
    if (!existsSync(opts.csv)) {
      console.error(`CSV file not found: ${opts.csv}`);
      process.exit(1);
    }
    const rows = readCsv(opts.csv);
    // Expected columns: name (or business_name), city, state, phone (optional)
    prospects = rows.map((row) => ({
      name: row.name || row.business_name || row.Name || row["Business Name"],
      city: row.city || row.City,
      state: row.state || row.State,
      phone: row.phone || row.Phone || "",
      template,
    }));
  } else if (opts.name && opts.city && opts.state) {
    prospects = [{ name: opts.name, city: opts.city, state: opts.state, phone: opts.phone || "", template }];
  } else {
    console.error("Usage:");
    console.error('  node tools/generate-site-preview.mjs --name "Joe\'s Roofing" --city "Dallas" --state "TX"');
    console.error("  node tools/generate-site-preview.mjs --csv .tmp/prospects/batch.csv");
    console.error("  node tools/generate-site-preview.mjs --cleanup");
    process.exit(1);
  }

  // Validate prospects
  const valid = prospects.filter((p) => p.name && p.city && p.state);
  if (valid.length === 0) {
    console.error("No valid prospects found. Each needs: name, city, state.");
    process.exit(1);
  }

  console.log(`\n🏗  Generating ${valid.length} prospect site(s)...\n`);

  // Ensure mockup directory exists
  mkdirSync(MOCKUP_DIR, { recursive: true });

  // Check dev server + set up Playwright (unless --no-screenshot)
  const baseUrl = opts.baseUrl || "http://localhost:3000";
  let browser = null;

  if (!opts.noScreenshot) {
    const serverUp = await checkDevServer(baseUrl);
    if (!serverUp) {
      console.log(`⚠ Dev server not responding at ${baseUrl}`);
      console.log("  Start it with: npm run dev");
      console.log("  Or use --no-screenshot to skip screenshots\n");
      console.log("  Continuing without screenshots...\n");
      opts.noScreenshot = true;
    } else {
      const { chromium } = await import("playwright");
      browser = await chromium.launch();
    }
  }

  // Process each prospect
  const results = [];

  for (let i = 0; i < valid.length; i++) {
    const p = valid[i];
    const progress = `[${i + 1}/${valid.length}]`;

    console.log(`${progress} ${p.name} (${p.city}, ${p.state})`);

    const result = await createProspect(p);
    if (!result) {
      results.push({ ...p, status: "failed" });
      continue;
    }

    const previewUrl = `${baseUrl}/preview/${result.slug}`;
    console.log(`  ✓ ${result.skipped ? "Already exists" : "Created"}: ${previewUrl}`);

    // Take screenshots
    let screenshots = null;
    if (!opts.noScreenshot && browser && !result.skipped) {
      screenshots = await takeScreenshots(browser, result.slug, baseUrl);
      if (screenshots && !screenshots.skipped) {
        console.log(`  📸 Hero: ${screenshots.heroPath}`);
        console.log(`  📸 Full: ${screenshots.fullPath}`);
      }
    }

    results.push({
      ...p,
      slug: result.slug,
      contractorId: result.contractorId,
      siteId: result.siteId,
      previewUrl,
      heroScreenshot: screenshots?.heroPath || null,
      status: "created",
    });

    // Delay between screenshots in batch mode
    if (i < valid.length - 1 && !opts.noScreenshot) {
      await new Promise((r) => setTimeout(r, SCREENSHOT_DELAY));
    }
  }

  // Cleanup Playwright
  if (browser) await browser.close();

  // Summary
  const created = results.filter((r) => r.status === "created").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n✅ Done: ${created} created, ${failed} failed`);
  console.log(`\nPreview URLs:`);
  for (const r of results.filter((r) => r.slug)) {
    console.log(`  ${r.name}: ${r.previewUrl}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
