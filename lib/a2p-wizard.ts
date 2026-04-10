// A2P Wizard Automation — generates compliance websites via Playwright.
// Fills the A2P Wizard form at a2pwizard.com with contractor data,
// waits for generation, and extracts the compliance URL.
//
// This CANNOT run on Vercel serverless (needs a browser binary + >10s runtime).
// Run via: Inngest with a self-hosted runner, standalone script, or Browserless.io.
//
// Tested: Apr 10 2026 — reCAPTCHA v3 passed, ~15s total, no stealth needed.

import { createServerSupabase } from "./supabase-server";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface A2PWizardInput {
  contractorId: string;
  businessName: string;
  address: string;       // Full address: "123 Main St, Tampa, FL 33601"
  email: string;
  phone: string;
  city: string;
  state: string;
  logoPath?: string;     // Absolute path to logo file (max 400px)
}

interface A2PWizardResult {
  success: boolean;
  complianceUrl?: string;
  error?: string;
  screenshotPath?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const A2P_WIZARD_URL = "https://a2pwizard.com/automated-setup-trial";
const AGENCY_NAME = "RuufPro";
const AGENCY_EMAIL = "admin@getruufpro.com";

// Default logo for contractors without one (relative to project root)
const DEFAULT_LOGO_DIR = path.join(process.cwd(), "public", "images", "logos");

// ---------------------------------------------------------------------------
// Main automation function
// ---------------------------------------------------------------------------

/**
 * Automates A2P Wizard form submission for a contractor.
 * Launches a browser, fills the form, uploads logo, submits,
 * waits for generation, and extracts the compliance URL.
 *
 * Returns the compliance URL (e.g. https://businessname.nebulabrandgroup.com)
 */
export async function generateComplianceWebsite(
  input: A2PWizardInput
): Promise<A2PWizardResult> {
  // Dynamic import — playwright may not be available in all environments
  const { chromium } = await import("playwright");

  // Sanitize business name for logging (no special chars that break URLs)
  const sanitizedName = input.businessName.replace(/[&!',]/g, "");
  if (sanitizedName !== input.businessName) {
    console.warn(
      `A2P Wizard: removed special characters from "${input.businessName}" → "${sanitizedName}"`
    );
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();

    // Navigate to the form
    await page.goto(A2P_WIZARD_URL, { waitUntil: "networkidle" });

    // Build business description from contractor data
    const description = `We are a local roofing company helping residential homeowners in ${input.city}, ${input.state} with reliable, professional roofing services including inspections, repairs, and full roof replacements.`;

    // Fill form fields with human-like delays
    await page.fill("#full_name", AGENCY_NAME);
    await randomDelay(page);

    await page.fill("#email", AGENCY_EMAIL);
    await randomDelay(page);

    await page.fill("#organization", sanitizedName);
    await randomDelay(page);

    // Address field — has a random ID, use data-q attribute
    await page.fill('[data-q="single_line_61zjy"]', input.address);
    await randomDelay(page);

    // Support email
    await page.fill('[data-q="single_line_63vl8"]', input.email);
    await randomDelay(page);

    // Phone
    await page.fill('[data-q="client_business_phone"]', input.phone);
    await randomDelay(page);

    // Business description
    await page.fill('[data-q="multi_line_2dx5"]', description);
    await randomDelay(page);

    // Upload logo
    const logoPath = input.logoPath || getDefaultLogo();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(logoPath);
    await randomDelay(page);

    // Check the compliance checkbox
    await page.click("#terms_and_conditions_1_3tgrb93j8of");
    await randomDelay(page);

    // Submit the form
    await page.click('button:has-text("Submit and get your template")');

    // Wait for redirect to the loading page
    await page.waitForURL(/\/redirect\?uuid_a2p=/, { timeout: 15000 });

    // Wait for the "Assets Ready" link to appear (up to 30 seconds)
    const assetsLink = page.locator('a:has-text("Your Assets Are Ready")');
    await assetsLink.waitFor({ state: "visible", timeout: 30000 });

    // Get the results URL
    const resultsHref = await assetsLink.getAttribute("href");
    if (!resultsHref) {
      throw new Error("Assets Ready link found but no href");
    }

    // Navigate to results page
    const resultsUrl = resultsHref.startsWith("http")
      ? resultsHref
      : `https://a2pwizard.com${resultsHref}`;
    await page.goto(resultsUrl, { waitUntil: "networkidle" });

    // Extract the compliance URL from the iframe
    // The iframe contains a link matching *.nebulabrandgroup.com
    const iframe = page.frameLocator("iframe").first();
    const complianceLink = iframe.locator('a[href*="nebulabrandgroup.com"]').first();
    await complianceLink.waitFor({ state: "visible", timeout: 15000 });
    const complianceUrl = await complianceLink.getAttribute("href");

    if (!complianceUrl) {
      throw new Error("Could not extract compliance URL from results page");
    }

    // Save screenshot of results for audit trail
    const screenshotPath = path.join(
      process.cwd(),
      ".tmp",
      `a2p-wizard-${input.contractorId.slice(0, 8)}-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(
      `A2P Wizard: generated ${complianceUrl} for ${sanitizedName}`
    );

    return {
      success: true,
      complianceUrl,
      screenshotPath,
    };
  } catch (err: any) {
    console.error(`A2P Wizard automation failed for ${input.businessName}:`, err.message);

    // Try to save a failure screenshot for debugging
    try {
      const pages = browser.contexts()[0]?.pages() || [];
      if (pages.length > 0) {
        const screenshotPath = path.join(
          process.cwd(),
          ".tmp",
          `a2p-wizard-FAIL-${input.contractorId.slice(0, 8)}-${Date.now()}.png`
        );
        await pages[0].screenshot({ path: screenshotPath, fullPage: true });
      }
    } catch {
      // Can't save screenshot — don't let this mask the real error
    }

    return {
      success: false,
      error: err.message,
    };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Full pipeline: generate + save + trigger campaign registration
// ---------------------------------------------------------------------------

/**
 * End-to-end: generate compliance website for a contractor,
 * save the URL to the database, and let the existing pipeline
 * auto-trigger campaign registration.
 */
export async function generateAndSaveComplianceUrl(
  contractorId: string
): Promise<A2PWizardResult> {
  const supabase = createServerSupabase();

  // Look up contractor data
  const { data: record, error } = await supabase
    .from("sms_numbers")
    .select("*, contractors!inner(business_name, email, phone, address, city, state, zip)")
    .eq("contractor_id", contractorId)
    .single();

  if (error || !record) {
    return { success: false, error: "No SMS registration record found" };
  }

  // Don't regenerate if URL already exists
  if (record.compliance_website_url) {
    return {
      success: true,
      complianceUrl: record.compliance_website_url,
      error: "Compliance URL already exists — skipping generation",
    };
  }

  const contractor = record.contractors;
  const fullAddress = [
    contractor.address,
    contractor.city,
    contractor.state,
    contractor.zip,
  ]
    .filter(Boolean)
    .join(", ");

  // Run the automation
  const result = await generateComplianceWebsite({
    contractorId,
    businessName: contractor.business_name,
    address: fullAddress,
    email: contractor.email,
    phone: contractor.phone,
    city: contractor.city,
    state: contractor.state,
  });

  if (!result.success || !result.complianceUrl) {
    // Alert ops about the failure
    try {
      const { sendAlert } = await import("@/lib/alerts");
      await sendAlert({
        title: "A2P Wizard automation failed",
        message: `Contractor ${contractorId} (${contractor.business_name}): ${result.error}`,
        severity: "error",
      });
    } catch {
      // Non-blocking
    }
    return result;
  }

  // Save the compliance URL to the database
  const { error: updateError } = await supabase
    .from("sms_numbers")
    .update({
      compliance_website_url: result.complianceUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("contractor_id", contractorId);

  if (updateError) {
    console.error(`Failed to save compliance URL for ${contractorId}:`, updateError);
    return { success: false, error: `Generated URL but DB save failed: ${updateError.message}` };
  }

  // The existing pipeline will now auto-trigger:
  // 1. checkAllPendingRegistrations() detects URL is set
  // 2. completeCampaignRegistration() runs
  // 3. Or the webhook handler picks it up immediately

  console.log(
    `A2P Wizard: saved ${result.complianceUrl} for contractor ${contractorId}`
  );

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Random delay between 1.5-4 seconds — mimics human typing pace.
 */
async function randomDelay(page: any): Promise<void> {
  const ms = 1500 + Math.random() * 2500;
  await page.waitForTimeout(ms);
}

/**
 * Pick a random default logo from the library.
 */
function getDefaultLogo(): string {
  const fs = require("fs");
  try {
    const files = fs
      .readdirSync(DEFAULT_LOGO_DIR)
      .filter((f: string) => f.startsWith("generic-roof") && f.endsWith(".png"));
    if (files.length === 0) {
      // Fallback to the test logo
      return path.join(process.cwd(), ".tmp", "generic-roof-logo.png");
    }
    const randomFile = files[Math.floor(Math.random() * files.length)];
    return path.join(DEFAULT_LOGO_DIR, randomFile);
  } catch {
    return path.join(process.cwd(), ".tmp", "generic-roof-logo.png");
  }
}
