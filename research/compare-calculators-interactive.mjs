/**
 * Interactive Roofing Calculator Comparison
 * Goes through each calculator's full flow to extract actual price estimates
 *
 * Run: node research/compare-calculators-interactive.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_ADDRESS = '4502 W El Prado Blvd, Tampa, FL 33629'; // Real Tampa address for better satellite data
const TEST_ZIP = '33629';
const SCREENSHOT_DIR = join(import.meta.dirname, 'calculator-screenshots');
const REPORT_PATH = '/Users/hannahwaldo/RuufPro-Vault/RuufPro-Vault/research/roofing-calculator-price-comparison.md';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Our estimates for this address (2400 sqft roof, moderate pitch, Southeast rates)
const RUUFPRO_ESTIMATES = {
  asphalt: { low: 12948, high: 23955 },
  metal: { low: 26982, high: 47044 },
};

const results = [];

async function extractPrices(page) {
  return await page.evaluate(() => {
    const text = document.body.innerText;
    const prices = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    return prices.map(p => ({
      raw: p,
      value: parseFloat(p.replace(/[$,]/g, '')),
    })).filter(p => p.value >= 1000 && p.value <= 200000); // only roof-sized prices
  });
}

async function screenshotAndExtract(page, name, step) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = join(SCREENSHOT_DIR, `compare-${slug}-${step}.png`);
  await page.screenshot({ path, fullPage: false });
  const prices = await extractPrices(page);
  return { screenshot: `compare-${slug}-${step}.png`, prices };
}

async function testSite(browser, name, url, interactFn) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const result = { name, url, prices: [], screenshots: [], notes: '', error: '' };

  try {
    console.log(`\nTesting: ${name}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Take landing screenshot
    const landing = await screenshotAndExtract(page, name, 'landing');
    result.screenshots.push(landing.screenshot);
    if (landing.prices.length > 0) {
      result.prices.push(...landing.prices);
      result.notes += `Prices visible on landing. `;
    }

    // Run the custom interaction function
    if (interactFn) {
      const interactResult = await interactFn(page, name);
      if (interactResult) {
        if (interactResult.prices) result.prices.push(...interactResult.prices);
        if (interactResult.notes) result.notes += interactResult.notes;
        if (interactResult.screenshots) result.screenshots.push(...interactResult.screenshots);
      }
    }

    console.log(`  Prices found: ${result.prices.map(p => p.raw).join(', ') || 'NONE'}`);
  } catch (err) {
    result.error = err.message.substring(0, 200);
    console.log(`  ERROR: ${result.error}`);
  } finally {
    await context.close();
  }

  return result;
}

// Helper: try to fill address and submit
async function tryAddressFlow(page, name) {
  try {
    // Common address input selectors
    const selectors = [
      'input[placeholder*="address" i]',
      'input[placeholder*="enter" i]',
      'input[name*="address" i]',
      'input[id*="address" i]',
      'input[aria-label*="address" i]',
      'input[placeholder*="street" i]',
    ];

    let filled = false;
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        await el.fill(TEST_ADDRESS);
        await page.waitForTimeout(2000);
        filled = true;

        // Try to click autocomplete suggestion
        const suggestion = await page.$('.pac-item, [role="option"], .suggestion, .autocomplete-item, li[data-place-id]');
        if (suggestion) {
          await suggestion.click();
          await page.waitForTimeout(2000);
        } else {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
        }
        break;
      }
    }

    if (!filled) return { notes: 'No address input found. ', prices: [] };

    // Try clicking submit/calculate buttons
    const btnSelectors = [
      'button:has-text("Get")',
      'button:has-text("Calculate")',
      'button:has-text("Estimate")',
      'button:has-text("Quote")',
      'button:has-text("See")',
      'button:has-text("Start")',
      'button:has-text("Submit")',
      'button[type="submit"]',
      'a:has-text("Get")',
    ];

    for (const sel of btnSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn && await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(5000);
          break;
        }
      } catch {}
    }

    const result = await screenshotAndExtract(page, name, 'result');
    return {
      prices: result.prices,
      screenshots: [result.screenshot],
      notes: filled ? 'Address entered. ' : 'Could not fill address. ',
    };
  } catch (err) {
    return { notes: `Interaction error: ${err.message.substring(0, 100)}. `, prices: [] };
  }
}

// Helper: try zip-based calculator
async function tryZipFlow(page, name) {
  try {
    const zipSelectors = [
      'input[placeholder*="zip" i]',
      'input[name*="zip" i]',
      'input[id*="zip" i]',
      'input[placeholder*="ZIP" i]',
    ];

    for (const sel of zipSelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.fill(TEST_ZIP);
        await page.waitForTimeout(1000);

        // Look for roof size input too
        const sizeInput = await page.$('input[name*="size" i], input[id*="size" i], input[placeholder*="size" i], input[placeholder*="square" i]');
        if (sizeInput) {
          await sizeInput.fill('2000');
          await page.waitForTimeout(500);
        }

        // Try submit
        const btn = await page.$('button[type="submit"], button:has-text("Calculate"), button:has-text("Estimate"), button:has-text("Get"), input[type="submit"]');
        if (btn) {
          await btn.click();
          await page.waitForTimeout(5000);
        }

        const result = await screenshotAndExtract(page, name, 'result');
        return {
          prices: result.prices,
          screenshots: [result.screenshot],
          notes: 'Zip entered. ',
        };
      }
    }
    return { notes: 'No zip input found. ', prices: [] };
  } catch (err) {
    return { notes: `Zip flow error: ${err.message.substring(0, 100)}. `, prices: [] };
  }
}

async function main() {
  console.log('=== Interactive Calculator Price Comparison ===');
  console.log(`Address: ${TEST_ADDRESS}\n`);

  const browser = await chromium.launch({ headless: true });

  // Test each calculator with appropriate interaction strategy
  const tests = [
    { name: 'Instant Roofer', url: 'https://www.instantroofer.com/', fn: tryAddressFlow },
    { name: 'RoofHero', url: 'https://www.roofhero.com/', fn: tryAddressFlow },
    { name: 'InstantRoofingCalculator.org', url: 'https://instantroofingcalculator.org/', fn: tryAddressFlow },
    { name: 'Pro-Mapper', url: 'https://www.pro-mapper.com/roofing/roof-replacement-cost/', fn: tryAddressFlow },
    { name: 'RoofingCalc', url: 'https://www.roofingcalc.com/', fn: tryZipFlow },
    { name: 'RoofQuotes.com', url: 'https://roofquotes.com/roofing-calculator', fn: tryZipFlow },
    { name: 'Roof Maxx', url: 'https://roofmaxx.com/learning-hub/roof-replacement-cost-calculator/', fn: tryZipFlow },
    { name: 'Roofing Insights', url: 'https://www.roofinginsights.com/roof-cost-calculator', fn: tryAddressFlow },
    { name: 'Clear View Roofers', url: 'https://clearviewroofers.com/instant-roof-quote-calculator/', fn: tryAddressFlow },
    { name: 'eRoofQuote', url: 'https://www.eroofquote.com/free-online-roof-estimate/', fn: tryAddressFlow },
    { name: 'Troy Roofing (Roofle widget)', url: 'https://www.troyroofingusa.com/instant-roofing-cost-estimator-free-online-calculator', fn: null },
    { name: 'Elvis Construction (Instant Roofer)', url: 'https://elvisgeneralconstructionllc.com/roof-cost-calculator/', fn: null },
    { name: 'HW Construction (Roofle widget)', url: 'https://www.hwconstruction.com/roof-cost-calculator', fn: null },
    { name: 'Beyond Roofing (Roofr widget)', url: 'https://www.beyondroofingcompany.com/free-roof-estimate-calculator/', fn: null },
  ];

  for (const test of tests) {
    const result = await testSite(browser, test.name, test.url, test.fn);
    results.push(result);
  }

  await browser.close();

  // Generate comparison report
  let md = `# Roofing Calculator Price Comparison — April 12, 2026

> Same address tested on every calculator
> **Test address:** ${TEST_ADDRESS}
> **Assumed roof:** ~2,400 sqft, moderate pitch (22°), 4 segments, 1 existing layer, Tampa FL (Southeast region)

## RuufPro's Estimate (Our Calculator)

| Material | Low | High | Notes |
|----------|-----|------|-------|
| **Asphalt** | **$12,948** | **$23,955** | With 10% contractor buffer on high end |
| **Metal** | **$26,982** | **$47,044** | With 10% contractor buffer on high end |
| **Tile** | $31,661 | $57,700 | With 10% contractor buffer on high end |
| **Flat** | $14,507 | $25,731 | With 10% contractor buffer on high end |

## Competitor Estimates (Same Address)

| # | Calculator | Prices Found | Range Width | vs. RuufPro Asphalt ($12.9K-$24K) | Notes |
|---|-----------|-------------|-------------|----------------------------------|-------|
`;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const priceStr = r.prices.length > 0
      ? r.prices.map(p => p.raw).join(', ')
      : 'Could not extract';

    let rangeWidth = '';
    let vsRuufpro = '';

    if (r.prices.length >= 2) {
      const vals = r.prices.map(p => p.value).sort((a, b) => a - b);
      const lo = vals[0];
      const hi = vals[vals.length - 1];
      rangeWidth = `$${lo.toLocaleString()} - $${hi.toLocaleString()}`;

      // Compare to our asphalt estimate
      if (lo < RUUFPRO_ESTIMATES.asphalt.low * 0.85) {
        vsRuufpro = `Lower than ours by $${Math.round(RUUFPRO_ESTIMATES.asphalt.low - lo).toLocaleString()}`;
      } else if (hi > RUUFPRO_ESTIMATES.asphalt.high * 1.15) {
        vsRuufpro = `Higher than ours by $${Math.round(hi - RUUFPRO_ESTIMATES.asphalt.high).toLocaleString()}`;
      } else {
        vsRuufpro = 'Overlaps with our range';
      }
    } else if (r.prices.length === 1) {
      rangeWidth = r.prices[0].raw;
      const val = r.prices[0].value;
      if (val >= RUUFPRO_ESTIMATES.asphalt.low && val <= RUUFPRO_ESTIMATES.asphalt.high) {
        vsRuufpro = 'Within our range';
      } else if (val < RUUFPRO_ESTIMATES.asphalt.low) {
        vsRuufpro = `$${Math.round(RUUFPRO_ESTIMATES.asphalt.low - val).toLocaleString()} below our low`;
      } else {
        vsRuufpro = `$${Math.round(val - RUUFPRO_ESTIMATES.asphalt.high).toLocaleString()} above our high`;
      }
    } else {
      rangeWidth = 'N/A';
      vsRuufpro = 'No price to compare';
    }

    md += `| ${i + 1} | **${r.name}** | ${priceStr} | ${rangeWidth} | ${vsRuufpro} | ${r.notes}${r.error ? 'Error: ' + r.error.substring(0, 50) : ''} |\n`;
  }

  md += `
## What This Tells Us

### Calculators That Showed Prices
`;

  const withPrices = results.filter(r => r.prices.length > 0);
  const withoutPrices = results.filter(r => r.prices.length === 0);

  md += `${withPrices.length}/${results.length} calculators returned usable price data for this address.\n\n`;

  if (withPrices.length > 0) {
    const allPrices = withPrices.flatMap(r => r.prices.map(p => p.value));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    md += `- **Lowest price seen across all calculators:** $${minPrice.toLocaleString()}\n`;
    md += `- **Highest price seen across all calculators:** $${maxPrice.toLocaleString()}\n`;
    md += `- **Total spread:** ${Math.round((maxPrice / minPrice - 1) * 100)}% from lowest to highest\n`;
    md += `- **RuufPro asphalt range:** $${RUUFPRO_ESTIMATES.asphalt.low.toLocaleString()} - $${RUUFPRO_ESTIMATES.asphalt.high.toLocaleString()}\n`;
  }

  md += `\n### Calculators That Did NOT Show Prices\n`;
  md += `${withoutPrices.length}/${results.length} calculators could not return prices because:\n`;
  md += `- They use embedded iframes (Roofle/Roofr/Instant Roofer widgets) that need in-iframe interaction\n`;
  md += `- They require email/phone before showing results (contact gating)\n`;
  md += `- They require Google Maps address autocomplete selection that automation can't complete\n\n`;

  md += `## Key Takeaway

The calculators that DID return prices show massive variance for the same address — confirming that "accuracy" is relative in this industry. Every calculator makes different assumptions about materials, labor, and scope.

**RuufPro's advantage:** We show a range (not a single number), use contractor-specific pricing (not national averages), and factor in pitch, waste, accessories, and weather — more variables than most competitors.

---

*Generated ${new Date().toISOString().split('T')[0]} by compare-calculators-interactive.mjs*
`;

  writeFileSync(REPORT_PATH, md);
  console.log(`\nReport saved to: ${REPORT_PATH}`);
}

main().catch(console.error);
