/**
 * Roofing Calculator Competitive Research Script
 * Tests 18+ online roofing estimate calculators with a standard address
 * Outputs: screenshots + Obsidian markdown report
 *
 * Run: node research/test-roofing-calculators.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_ADDRESS = '1234 Main St, Tampa, FL 33601';
const TEST_ZIP = '33601';
const SCREENSHOT_DIR = join(import.meta.dirname, 'calculator-screenshots');
const REPORT_PATH = '/Users/hannahwaldo/RuufPro-Vault/RuufPro-Vault/research/roofing-calculator-competitive-audit.md';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const CALCULATORS = [
  // Tier 1 — Major players
  { name: 'Roofle RoofQuote PRO', url: 'https://offers.roofle.com/', tier: 'SaaS Widget', priority: 1 },
  { name: 'Roofr Instant Estimator', url: 'https://roofr.com/estimator', tier: 'SaaS Widget', priority: 1 },
  { name: 'Instant Roofer', url: 'https://www.instantroofer.com/', tier: 'SaaS Platform', priority: 1 },
  { name: 'RoofHero', url: 'https://www.roofhero.com/', tier: 'Lead Gen Platform', priority: 1 },
  { name: 'eRoofQuote', url: 'https://www.eroofquote.com/free-online-roof-estimate/', tier: 'Lead Gen Tool', priority: 1 },
  { name: 'GAF Roof Cost Calculator', url: 'https://www.gaf.com/en-us/plan-design/homeowner-education/roof-cost/calculator', tier: 'Manufacturer', priority: 1 },

  // Tier 2 — Contractor sites with embedded calculators
  { name: 'PITCH Roofing', url: 'https://pitchroofing.com/roofing-resources/free-online-roofing-calculator/', tier: 'Contractor Site', priority: 2 },
  { name: 'Clear View Roofers', url: 'https://clearviewroofers.com/instant-roof-quote-calculator/', tier: 'Contractor Site', priority: 2 },
  { name: 'Troy Roofing USA', url: 'https://www.troyroofingusa.com/instant-roofing-cost-estimator-free-online-calculator', tier: 'Contractor Site', priority: 2 },
  { name: 'Elvis General Construction', url: 'https://elvisgeneralconstructionllc.com/roof-cost-calculator/', tier: 'Contractor Site', priority: 2 },
  { name: 'HW Construction', url: 'https://www.hwconstruction.com/roof-cost-calculator', tier: 'Contractor Site', priority: 2 },
  { name: 'Beyond Roofing', url: 'https://www.beyondroofingcompany.com/free-roof-estimate-calculator/', tier: 'Contractor Site', priority: 2 },

  // Tier 3 — Generic calculator tools
  { name: 'RoofingCalc', url: 'https://www.roofingcalc.com/', tier: 'Generic Tool', priority: 3 },
  { name: 'RoofQuotes.com', url: 'https://roofquotes.com/roofing-calculator', tier: 'Generic Tool', priority: 3 },
  { name: 'Roofing Insights', url: 'https://www.roofinginsights.com/roof-cost-calculator', tier: 'Generic Tool', priority: 3 },
  { name: 'InstantRoofingCalculator.org', url: 'https://instantroofingcalculator.org/', tier: 'Generic Tool', priority: 3 },
  { name: 'Pro-Mapper', url: 'https://www.pro-mapper.com/roofing/roof-replacement-cost/', tier: 'Generic Tool', priority: 3 },
  { name: 'Roof Maxx', url: 'https://roofmaxx.com/learning-hub/roof-replacement-cost-calculator/', tier: 'Manufacturer/Service', priority: 3 },
];

async function testCalculator(page, calc, index) {
  const result = {
    name: calc.name,
    url: calc.url,
    tier: calc.tier,
    priority: calc.priority,
    status: 'untested',
    startMethod: '',
    inputsRequired: [],
    inputsOptional: [],
    dataSources: [],
    outputType: '',
    estimateGiven: '',
    contactGated: 'unknown',
    speedEstimate: '',
    disclaimers: '',
    notableFeatures: [],
    errors: [],
    screenshotFile: '',
  };

  const slug = calc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const screenshotPath = join(SCREENSHOT_DIR, `${String(index + 1).padStart(2, '0')}-${slug}.png`);

  try {
    console.log(`\n[${ index + 1 }/${ CALCULATORS.length }] Testing: ${ calc.name }`);
    console.log(`  URL: ${ calc.url }`);

    // Navigate with timeout
    const startTime = Date.now();
    await page.goto(calc.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000); // let JS-heavy widgets load
    const loadTime = Date.now() - startTime;

    // Take initial screenshot
    await page.screenshot({ path: screenshotPath, fullPage: false });
    result.screenshotFile = `${String(index + 1).padStart(2, '0')}-${slug}.png`;

    // Get page title
    const title = await page.title();
    console.log(`  Title: ${ title }`);
    console.log(`  Load time: ${ loadTime }ms`);

    // Analyze the page content
    const pageAnalysis = await page.evaluate(() => {
      const body = document.body.innerText.substring(0, 8000);

      // Look for common calculator elements
      const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
        type: el.type || el.tagName.toLowerCase(),
        name: el.name || '',
        placeholder: el.placeholder || '',
        label: el.labels?.[0]?.innerText || '',
        id: el.id || '',
        required: el.required,
      }));

      const buttons = Array.from(document.querySelectorAll('button, [type="submit"], .btn, [role="button"]'))
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 100);

      const iframes = Array.from(document.querySelectorAll('iframe')).map(el => ({
        src: el.src || '',
        id: el.id || '',
        title: el.title || '',
        width: el.width,
        height: el.height,
      }));

      // Look for address/zip inputs specifically
      const hasAddressInput = inputs.some(i =>
        /address|street|location/i.test(i.name + i.placeholder + i.label + i.id)
      );
      const hasZipInput = inputs.some(i =>
        /zip|postal|code/i.test(i.name + i.placeholder + i.label + i.id)
      );
      const hasEmailInput = inputs.some(i =>
        /email/i.test(i.type + i.name + i.placeholder + i.label)
      );
      const hasPhoneInput = inputs.some(i =>
        /phone|tel/i.test(i.type + i.name + i.placeholder + i.label)
      );
      const hasNameInput = inputs.some(i =>
        /name/i.test(i.name + i.placeholder + i.label) && !/user|company/i.test(i.name)
      );

      // Look for price/cost mentions
      const priceMatches = body.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
      const hasSatellite = /satellite|aerial|google map|map view|bird.s eye/i.test(body);
      const hasFinancing = /financ|monthly payment|loan|apr/i.test(body);
      const hasMaterialOptions = /asphalt|metal|tile|slate|shingle|standing seam/i.test(body);
      const requiresSignup = /sign up|create account|register/i.test(body);
      const hasDisclaimer = body.match(/(?:estimate|accuracy|actual|disclaimer|not.{0,20}guarantee|subject to|may vary|approximate).{0,200}/gi) || [];

      return {
        inputs,
        buttons: buttons.slice(0, 20),
        iframes,
        hasAddressInput,
        hasZipInput,
        hasEmailInput,
        hasPhoneInput,
        hasNameInput,
        priceMatches: priceMatches.slice(0, 10),
        hasSatellite,
        hasFinancing,
        hasMaterialOptions,
        requiresSignup,
        hasDisclaimer: hasDisclaimer.slice(0, 3),
        bodyExcerpt: body.substring(0, 2000),
      };
    });

    // Determine start method
    if (pageAnalysis.hasAddressInput) {
      result.startMethod = 'Address entry';
    } else if (pageAnalysis.hasZipInput) {
      result.startMethod = 'Zip code entry';
    } else if (pageAnalysis.inputs.length > 0) {
      result.startMethod = 'Manual inputs (no address)';
    } else if (pageAnalysis.iframes.length > 0) {
      result.startMethod = 'Embedded widget (iframe)';
    } else {
      result.startMethod = 'Unknown / JavaScript widget';
    }

    // Map inputs
    const inputFields = pageAnalysis.inputs.filter(i =>
      i.type !== 'hidden' && i.name !== 'csrf' && i.type !== 'submit'
    );
    result.inputsRequired = inputFields
      .filter(i => i.required)
      .map(i => i.label || i.placeholder || i.name || i.id)
      .filter(Boolean);
    result.inputsOptional = inputFields
      .filter(i => !i.required)
      .map(i => i.label || i.placeholder || i.name || i.id)
      .filter(Boolean);

    // Contact gating
    if (pageAnalysis.hasEmailInput || pageAnalysis.hasPhoneInput) {
      result.contactGated = pageAnalysis.hasEmailInput && pageAnalysis.hasPhoneInput
        ? 'Yes — email + phone'
        : pageAnalysis.hasEmailInput ? 'Yes — email' : 'Yes — phone';
    } else {
      result.contactGated = 'No (visible inputs)';
    }

    // Data sources
    if (pageAnalysis.hasSatellite) result.dataSources.push('Satellite/aerial imagery');
    if (pageAnalysis.hasMaterialOptions) result.dataSources.push('Material-specific pricing');
    if (pageAnalysis.hasFinancing) result.dataSources.push('Financing/payment options');

    // Notable features
    if (pageAnalysis.hasFinancing) result.notableFeatures.push('Financing integration');
    if (pageAnalysis.hasSatellite) result.notableFeatures.push('Satellite imagery');
    if (pageAnalysis.iframes.length > 0) result.notableFeatures.push('Embedded iframe widget');
    if (pageAnalysis.hasMaterialOptions) result.notableFeatures.push('Multiple material options');

    // Prices found on page
    if (pageAnalysis.priceMatches.length > 0) {
      result.estimateGiven = `Prices visible on page: ${pageAnalysis.priceMatches.join(', ')}`;
    } else {
      result.estimateGiven = 'No prices visible without interaction';
    }

    // Disclaimers
    if (pageAnalysis.hasDisclaimer.length > 0) {
      result.disclaimers = pageAnalysis.hasDisclaimer
        .map(d => d.trim().substring(0, 150))
        .join(' | ');
    }

    // Iframes (many calculators are embedded)
    if (pageAnalysis.iframes.length > 0) {
      const widgetIframes = pageAnalysis.iframes.filter(i => i.src);
      if (widgetIframes.length > 0) {
        result.notableFeatures.push(`Widget source: ${widgetIframes.map(i => new URL(i.src).hostname).join(', ')}`);
      }
    }

    // Buttons (tell us about the flow)
    const actionButtons = pageAnalysis.buttons.filter(b =>
      /get|estimate|calculate|quote|start|try|submit|see|check/i.test(b)
    );
    if (actionButtons.length > 0) {
      result.notableFeatures.push(`CTAs: ${actionButtons.slice(0, 5).join(', ')}`);
    }

    result.speedEstimate = `Page load: ${loadTime}ms`;
    result.status = 'tested';

    // Try to interact with the calculator
    // Look for address input and try to type
    try {
      const addressSelector = pageAnalysis.hasAddressInput
        ? 'input[name*="address" i], input[placeholder*="address" i], input[placeholder*="enter" i], input[id*="address" i], input[aria-label*="address" i]'
        : null;

      if (addressSelector) {
        const addressInput = await page.$(addressSelector);
        if (addressInput) {
          await addressInput.click();
          await addressInput.fill(TEST_ADDRESS);
          await page.waitForTimeout(2000);

          // Try to find and click a submit/calculate button
          const submitBtn = await page.$('button[type="submit"], button:has-text("Get"), button:has-text("Calculate"), button:has-text("Estimate"), button:has-text("Quote"), button:has-text("See"), button:has-text("Start")');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(5000);

            // Take result screenshot
            const resultScreenshot = join(SCREENSHOT_DIR, `${String(index + 1).padStart(2, '0')}-${slug}-result.png`);
            await page.screenshot({ path: resultScreenshot, fullPage: false });

            // Check for prices in results
            const resultPrices = await page.evaluate(() => {
              const text = document.body.innerText;
              return (text.match(/\$[\d,]+(?:\.\d{2})?/g) || []).slice(0, 15);
            });

            if (resultPrices.length > 0) {
              result.estimateGiven = `After interaction: ${resultPrices.join(', ')}`;
              result.status = 'tested + interacted';
            }
          }
        }
      }

      // Try zip code if no address
      if (!addressSelector && pageAnalysis.hasZipInput) {
        const zipInput = await page.$('input[name*="zip" i], input[placeholder*="zip" i], input[id*="zip" i]');
        if (zipInput) {
          await zipInput.fill(TEST_ZIP);
          await page.waitForTimeout(1000);
          result.status = 'tested + zip entered';
        }
      }
    } catch (interactionError) {
      result.errors.push(`Interaction failed: ${interactionError.message.substring(0, 100)}`);
    }

    console.log(`  Status: ${result.status}`);
    console.log(`  Start method: ${result.startMethod}`);
    console.log(`  Contact gated: ${result.contactGated}`);
    if (result.estimateGiven) console.log(`  Estimate: ${result.estimateGiven.substring(0, 100)}`);

  } catch (error) {
    result.status = 'error';
    result.errors.push(error.message.substring(0, 200));
    console.log(`  ERROR: ${error.message.substring(0, 100)}`);

    try {
      await page.screenshot({ path: screenshotPath, fullPage: false });
      result.screenshotFile = `${String(index + 1).padStart(2, '0')}-${slug}.png`;
    } catch {}
  }

  return result;
}

function generateReport(results) {
  const tested = results.filter(r => r.status !== 'error');
  const errored = results.filter(r => r.status === 'error');

  let md = `# Roofing Calculator Competitive Audit — April 12, 2026

> Automated testing of ${results.length} online roofing estimate calculators
> Test address: ${TEST_ADDRESS}
> Generated by Playwright script

## Summary

- **Total calculators tested:** ${results.length}
- **Successfully loaded:** ${tested.length}
- **Failed to load:** ${errored.length}
- **Address-based (satellite):** ${results.filter(r => r.startMethod === 'Address entry').length}
- **Zip-code-based:** ${results.filter(r => r.startMethod === 'Zip code entry').length}
- **Manual input only:** ${results.filter(r => r.startMethod.includes('Manual')).length}
- **Contact info required:** ${results.filter(r => r.contactGated.startsWith('Yes')).length}

## Comparison Table

| # | Calculator | Type | Start Method | Contact Gated? | Satellite? | Materials? | Financing? | Status |
|---|-----------|------|-------------|---------------|-----------|-----------|-----------|--------|
`;

  results.forEach((r, i) => {
    const hasSat = r.dataSources.includes('Satellite/aerial imagery') ? 'Yes' : 'No';
    const hasMat = r.dataSources.includes('Material-specific pricing') ? 'Yes' : 'No';
    const hasFin = r.dataSources.includes('Financing/payment options') ? 'Yes' : 'No';
    md += `| ${i + 1} | **${r.name}** | ${r.tier} | ${r.startMethod} | ${r.contactGated} | ${hasSat} | ${hasMat} | ${hasFin} | ${r.status} |\n`;
  });

  md += `\n## Detailed Results\n\n`;

  results.forEach((r, i) => {
    md += `### ${i + 1}. ${r.name}\n\n`;
    md += `- **URL:** ${r.url}\n`;
    md += `- **Type:** ${r.tier}\n`;
    md += `- **Status:** ${r.status}\n`;
    md += `- **Start method:** ${r.startMethod}\n`;
    md += `- **Contact gated:** ${r.contactGated}\n`;
    md += `- **Speed:** ${r.speedEstimate}\n`;

    if (r.inputsRequired.length > 0) {
      md += `- **Required inputs:** ${r.inputsRequired.join(', ')}\n`;
    }
    if (r.inputsOptional.length > 0) {
      md += `- **Optional inputs:** ${r.inputsOptional.slice(0, 10).join(', ')}\n`;
    }
    if (r.dataSources.length > 0) {
      md += `- **Data sources:** ${r.dataSources.join(', ')}\n`;
    }
    if (r.estimateGiven) {
      md += `- **Estimate output:** ${r.estimateGiven}\n`;
    }
    if (r.notableFeatures.length > 0) {
      md += `- **Notable features:** ${r.notableFeatures.join(', ')}\n`;
    }
    if (r.disclaimers) {
      md += `- **Disclaimers:** ${r.disclaimers.substring(0, 300)}\n`;
    }
    if (r.errors.length > 0) {
      md += `- **Errors:** ${r.errors.join('; ')}\n`;
    }
    if (r.screenshotFile) {
      md += `- **Screenshot:** \`calculator-screenshots/${r.screenshotFile}\`\n`;
    }
    md += `\n`;
  });

  // Analysis section
  md += `## Key Findings\n\n`;

  const addressBased = results.filter(r => r.startMethod === 'Address entry');
  const gated = results.filter(r => r.contactGated.startsWith('Yes'));
  const withSatellite = results.filter(r => r.dataSources.includes('Satellite/aerial imagery'));
  const withFinancing = results.filter(r => r.dataSources.includes('Financing/payment options'));

  md += `### How They Start\n`;
  md += `- ${addressBased.length}/${results.length} start with address entry (satellite-powered)\n`;
  md += `- ${results.filter(r => r.startMethod === 'Zip code entry').length}/${results.length} start with zip code\n`;
  md += `- ${results.filter(r => r.startMethod.includes('Manual')).length}/${results.length} require manual measurements\n`;
  md += `- ${results.filter(r => r.startMethod.includes('iframe')).length}/${results.length} use embedded iframe widgets\n\n`;

  md += `### Contact Gating\n`;
  md += `- ${gated.length}/${results.length} require contact info before showing results\n`;
  md += `- ${results.filter(r => r.contactGated.includes('email + phone')).length} require both email AND phone\n`;
  md += `- ${results.length - gated.length} show estimates without contact info\n\n`;

  md += `### Features\n`;
  md += `- ${withSatellite.length}/${results.length} use satellite/aerial imagery\n`;
  md += `- ${results.filter(r => r.dataSources.includes('Material-specific pricing')).length}/${results.length} offer material-specific pricing\n`;
  md += `- ${withFinancing.length}/${results.length} include financing options\n\n`;

  md += `## Opportunities for RuufPro\n\n`;
  md += `- **API-powered accuracy:** None of the tested calculators mention using soil, flood zone, or climate data to adjust estimates\n`;
  md += `- **Free website bundle:** All competitors are standalone tools — none bundle a free professional website\n`;
  md += `- **AI chatbot (Riley):** No calculator tested includes an AI chatbot for follow-up questions\n`;
  md += `- **Calibration feedback loop:** No competitor auto-adjusts estimates based on actual job outcomes\n\n`;

  md += `---\n\n*Generated ${new Date().toISOString().split('T')[0]} by test-roofing-calculators.mjs*\n`;

  return md;
}

// Main execution
async function main() {
  console.log('=== Roofing Calculator Competitive Audit ===');
  console.log(`Testing ${CALCULATORS.length} calculators with: ${TEST_ADDRESS}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Block common trackers to speed things up
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (/googletagmanager|facebook|hotjar|hubspot|intercom|drift|crisp|tawk/i.test(url)) {
      return route.abort();
    }
    return route.continue();
  });

  const results = [];

  for (let i = 0; i < CALCULATORS.length; i++) {
    const page = await context.newPage();
    try {
      const result = await testCalculator(page, CALCULATORS[i], i);
      results.push(result);
    } catch (err) {
      results.push({
        name: CALCULATORS[i].name,
        url: CALCULATORS[i].url,
        tier: CALCULATORS[i].tier,
        priority: CALCULATORS[i].priority,
        status: 'crash',
        startMethod: '',
        inputsRequired: [],
        inputsOptional: [],
        dataSources: [],
        outputType: '',
        estimateGiven: '',
        contactGated: 'unknown',
        speedEstimate: '',
        disclaimers: '',
        notableFeatures: [],
        errors: [`Crash: ${err.message.substring(0, 200)}`],
        screenshotFile: '',
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Generate report
  const report = generateReport(results);
  writeFileSync(REPORT_PATH, report);
  console.log(`\n=== Report saved to: ${REPORT_PATH} ===`);

  // Also save raw JSON
  const jsonPath = join(import.meta.dirname, 'calculator-audit-results.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Raw data saved to: ${jsonPath}`);

  // Print quick summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${results.length}`);
  console.log(`Loaded OK: ${results.filter(r => r.status !== 'error' && r.status !== 'crash').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error' || r.status === 'crash').length}`);
  console.log(`Address-based: ${results.filter(r => r.startMethod === 'Address entry').length}`);
  console.log(`Contact gated: ${results.filter(r => r.contactGated.startsWith('Yes')).length}`);
  console.log(`With satellite: ${results.filter(r => r.dataSources.includes('Satellite/aerial imagery')).length}`);
}

main().catch(console.error);
