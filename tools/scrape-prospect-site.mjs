#!/usr/bin/env node

// Prospect Website Scraper — extracts structured business data from a roofer's
// existing website to populate their RuufPro preview site with real content.
//
// Usage:
//   node tools/scrape-prospect-site.mjs --url "https://example-roofing.com"
//   node tools/scrape-prospect-site.mjs --csv .tmp/prospects/tampa_fl.csv
//   node tools/scrape-prospect-site.mjs --csv .tmp/prospects/tampa_fl.csv --output .tmp/prospects/tampa_enriched.csv
//
// Output: JSON to stdout (single URL) or enriched CSV (batch mode).
// Extracted fields: tagline, services, about_text, reviews, phone, service_areas

import { chromium } from "playwright";
import { readCsv, writeCsv } from "./lib/csv.mjs";
import { existsSync } from "fs";

// --------------- Config ---------------

const TIMEOUT = 15000; // 15s page load timeout
const MAX_CONCURRENT = 3; // parallel browser tabs
const DELAY_BETWEEN = 1500; // ms between scrapes (be polite)

// --------------- Argument Parsing ---------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--url" && args[i + 1]) {
      opts.url = args[++i];
    } else if (arg === "--csv" && args[i + 1]) {
      opts.csv = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      opts.output = args[++i];
    } else if (arg === "--verbose") {
      opts.verbose = true;
    }
  }

  return opts;
}

// --------------- Extraction Logic ---------------

/**
 * Extract structured business data from a webpage.
 * Uses DOM queries + text pattern matching to find common roofer site elements.
 */
async function extractSiteData(page) {
  return await page.evaluate(() => {
    const result = {
      tagline: null,
      hero_headline: null,
      about_text: null,
      services: [],
      reviews: [],
      phone: null,
      service_areas: [],
    };

    // Helper: get visible text content, trimmed
    const text = (el) => el?.textContent?.trim() || "";
    const allText = document.body?.innerText || "";

    // ---- Phone ----
    // Look for tel: links first (most reliable)
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    if (telLinks.length > 0) {
      result.phone = telLinks[0].href.replace("tel:", "").replace(/\s+/g, "");
    } else {
      // Regex fallback on full page text
      const phoneMatch = allText.match(
        /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
      );
      if (phoneMatch) result.phone = phoneMatch[0];
    }

    // ---- Hero Headline ----
    // First h1 on the page is usually the hero
    const h1 = document.querySelector("h1");
    if (h1) {
      const h1Text = text(h1);
      if (h1Text.length > 5 && h1Text.length < 200) {
        result.hero_headline = h1Text;
      }
    }

    // ---- Tagline ----
    // Look for meta description, subtitle near h1, or slogan-like text
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const desc = metaDesc.getAttribute("content")?.trim();
      if (desc && desc.length > 10 && desc.length < 300) {
        result.tagline = desc;
      }
    }

    // Also check for subtitle/tagline near hero
    if (h1) {
      const sibling = h1.nextElementSibling;
      if (sibling && ["P", "SPAN", "DIV", "H2"].includes(sibling.tagName)) {
        const sibText = text(sibling);
        if (sibText.length > 10 && sibText.length < 200) {
          // If no tagline from meta, use this
          if (!result.tagline) result.tagline = sibText;
        }
      }
    }

    // ---- Services ----
    // Strategy 1: Look for sections with "service" in heading or id
    const servicePatterns = /services|what we do|our work|specialties|offerings/i;
    const allHeadings = document.querySelectorAll("h2, h3, h4");
    let serviceSection = null;

    for (const heading of allHeadings) {
      if (servicePatterns.test(text(heading)) || servicePatterns.test(heading.id || "")) {
        serviceSection = heading;
        break;
      }
    }

    if (serviceSection) {
      // Look for list items or card-like elements after the heading
      const parent = serviceSection.closest("section") || serviceSection.parentElement;
      if (parent) {
        // Check for list items
        const lis = parent.querySelectorAll("li");
        if (lis.length > 0) {
          for (const li of lis) {
            const t = text(li);
            if (t.length > 2 && t.length < 100 && !t.includes("©")) {
              result.services.push(t.split("\n")[0].trim());
            }
          }
        }

        // Check for card headings (h3, h4 inside the section)
        if (result.services.length === 0) {
          const subHeadings = parent.querySelectorAll("h3, h4, h5");
          for (const sh of subHeadings) {
            const t = text(sh);
            if (t.length > 2 && t.length < 80) {
              result.services.push(t);
            }
          }
        }
      }
    }

    // Strategy 2: Fallback — scan all list items for roofing-related services
    if (result.services.length === 0) {
      const roofingTerms = /roof|shingle|gutter|siding|repair|install|replace|inspect|leak|storm|metal roof|flat roof|tile|slate|commercial|residential/i;
      const allLis = document.querySelectorAll("li");
      for (const li of allLis) {
        const t = text(li);
        if (roofingTerms.test(t) && t.length > 3 && t.length < 80) {
          result.services.push(t.split("\n")[0].trim());
        }
      }
    }

    // Deduplicate services and limit
    result.services = [...new Set(result.services)].slice(0, 12);

    // ---- About Text ----
    // Look for "about" section
    const aboutPatterns = /about us|about|who we are|our story|our company|why choose/i;
    let aboutSection = null;

    for (const heading of allHeadings) {
      if (aboutPatterns.test(text(heading))) {
        aboutSection = heading;
        break;
      }
    }

    if (aboutSection) {
      const parent = aboutSection.closest("section") || aboutSection.parentElement;
      if (parent) {
        const paragraphs = parent.querySelectorAll("p");
        const aboutParts = [];
        for (const p of paragraphs) {
          const t = text(p);
          if (t.length > 30 && t.length < 800 && !t.includes("©")) {
            aboutParts.push(t);
          }
        }
        if (aboutParts.length > 0) {
          result.about_text = aboutParts.slice(0, 3).join(" ");
        }
      }
    }

    // Fallback: use meta description as about text if nothing found
    if (!result.about_text && result.tagline) {
      result.about_text = result.tagline;
    }

    // ---- Reviews ----
    // Look for review/testimonial sections
    const reviewPatterns = /reviews|testimonials|what (our |people |customers )?say|feedback|ratings/i;
    let reviewSection = null;

    for (const heading of allHeadings) {
      if (reviewPatterns.test(text(heading))) {
        reviewSection = heading;
        break;
      }
    }

    if (reviewSection) {
      const parent = reviewSection.closest("section") || reviewSection.parentElement;
      if (parent) {
        // Look for blockquotes, review cards, or paragraphs with quotes
        const blocks = parent.querySelectorAll("blockquote, .review, .testimonial, [class*='review'], [class*='testimonial']");

        if (blocks.length > 0) {
          for (const block of blocks) {
            const reviewText = text(block);
            if (reviewText.length > 15 && reviewText.length < 500) {
              result.reviews.push({
                name: "Happy Customer",
                text: reviewText.replace(/^["'""]|["'""]$/g, "").trim(),
                rating: 5,
              });
            }
          }
        }

        // Fallback: paragraphs that look like quotes
        if (result.reviews.length === 0) {
          const paragraphs = parent.querySelectorAll("p");
          for (const p of paragraphs) {
            const t = text(p);
            if (
              t.length > 20 && t.length < 400 &&
              (t.startsWith('"') || t.startsWith("\u201C") || t.includes("great") || t.includes("recommend") || t.includes("professional"))
            ) {
              result.reviews.push({
                name: "Happy Customer",
                text: t.replace(/^["'""]|["'""]$/g, "").trim(),
                rating: 5,
              });
            }
          }
        }
      }
    }

    // Try to extract reviewer names from nearby elements
    if (result.reviews.length > 0 && reviewSection) {
      const parent = reviewSection.closest("section") || reviewSection.parentElement;
      const nameEls = parent.querySelectorAll("cite, .author, .name, [class*='author'], [class*='name'], strong");
      const names = [];
      for (const el of nameEls) {
        const n = text(el);
        if (n.length > 2 && n.length < 40 && !n.includes("©") && !/\d{3}/.test(n)) {
          names.push(n.replace(/^[-–—]/, "").trim());
        }
      }
      // Assign names to reviews
      for (let i = 0; i < Math.min(names.length, result.reviews.length); i++) {
        result.reviews[i].name = names[i];
      }
    }

    result.reviews = result.reviews.slice(0, 5);

    // ---- Service Areas ----
    // Look for "areas we serve", "service area", city lists
    const areaPatterns = /service area|areas (we )?serve|serving|locations|coverage|communities/i;
    for (const heading of allHeadings) {
      if (areaPatterns.test(text(heading))) {
        const parent = heading.closest("section") || heading.parentElement;
        if (parent) {
          const lis = parent.querySelectorAll("li");
          for (const li of lis) {
            const t = text(li);
            if (t.length > 2 && t.length < 60) {
              result.service_areas.push(t);
            }
          }
        }
        break;
      }
    }

    result.service_areas = result.service_areas.slice(0, 20);

    return result;
  });
}

/**
 * Scrape a single prospect URL and return structured data.
 */
async function scrapeSite(browser, url, verbose = false) {
  const page = await browser.newPage();

  // Block images/fonts/media to speed up scraping
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "media", "font", "stylesheet"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  try {
    // Normalize URL
    let fullUrl = url;
    if (!fullUrl.startsWith("http")) {
      fullUrl = `https://${fullUrl}`;
    }

    if (verbose) console.log(`  Fetching: ${fullUrl}`);

    await page.goto(fullUrl, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    // Wait a bit for JS-rendered content
    await page.waitForTimeout(2000);

    const data = await extractSiteData(page);

    // Also grab the page title as fallback
    const title = await page.title();
    if (!data.hero_headline && title && title.length > 3) {
      data.hero_headline = title.split("|")[0].split("-")[0].trim();
    }

    return { success: true, url: fullUrl, ...data };
  } catch (err) {
    if (verbose) console.error(`  ✗ Failed: ${err.message}`);
    return { success: false, url, error: err.message };
  } finally {
    await page.close();
  }
}

// --------------- Main ---------------

async function main() {
  const opts = parseArgs();

  if (!opts.url && !opts.csv) {
    console.error("Usage:");
    console.error('  node tools/scrape-prospect-site.mjs --url "https://example-roofing.com"');
    console.error("  node tools/scrape-prospect-site.mjs --csv .tmp/prospects/batch.csv");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // Single URL mode — output JSON to stdout
    if (opts.url) {
      const result = await scrapeSite(browser, opts.url, true);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // CSV batch mode
    if (!existsSync(opts.csv)) {
      console.error(`CSV file not found: ${opts.csv}`);
      process.exit(1);
    }

    const rows = readCsv(opts.csv);
    const urlField = rows[0]?.website || rows[0]?.Website || rows[0]?.url || rows[0]?.URL;
    if (!urlField && !rows[0]?.website && !rows[0]?.Website) {
      console.error("CSV must have a 'website' or 'url' column");
      process.exit(1);
    }

    console.log(`\n🔍 Scraping ${rows.length} prospect website(s)...\n`);

    const results = [];
    let scraped = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const url = row.website || row.Website || row.url || row.URL;
      const name = row.name || row.business_name || row.Name || row["Business Name"] || "Unknown";

      const progress = `[${i + 1}/${rows.length}]`;

      if (!url || url === "N/A" || url === "" || url === "none") {
        console.log(`${progress} ${name} — no website, skipping`);
        results.push({ ...row, scrape_status: "no_website" });
        continue;
      }

      console.log(`${progress} ${name} — ${url}`);
      const data = await scrapeSite(browser, url, opts.verbose);

      if (data.success) {
        scraped++;
        const serviceCount = data.services?.length || 0;
        const reviewCount = data.reviews?.length || 0;
        console.log(`  ✓ Found: ${serviceCount} services, ${reviewCount} reviews, phone: ${data.phone || "none"}`);

        results.push({
          ...row,
          scraped_tagline: data.tagline || "",
          scraped_hero_headline: data.hero_headline || "",
          scraped_about_text: data.about_text || "",
          scraped_services: (data.services || []).join("; "),
          scraped_reviews: JSON.stringify(data.reviews || []),
          scraped_phone: data.phone || "",
          scraped_service_areas: (data.service_areas || []).join("; "),
          scrape_status: "success",
        });
      } else {
        failed++;
        console.log(`  ✗ Failed: ${data.error}`);
        results.push({ ...row, scrape_status: "failed", scrape_error: data.error });
      }

      // Be polite — delay between requests
      if (i < rows.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN));
      }
    }

    // Write enriched CSV
    const outputPath = opts.output || opts.csv.replace(".csv", "_scraped.csv");
    writeCsv(outputPath, results);

    console.log(`\n✅ Done: ${scraped} scraped, ${failed} failed, ${rows.length - scraped - failed} skipped`);
    console.log(`📄 Output: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
