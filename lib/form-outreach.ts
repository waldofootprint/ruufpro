// Contact form auto-submission for outreach.
// Submits gift-first messages through prospect websites' contact forms.
// Uses Browserless.io (cloud) or local Playwright for browser automation.
//
// Pattern mirrors lib/a2p-wizard.ts — same CDP connection, randomDelay, try/finally.

import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormFieldMapping {
  name_field: string | null;
  email_field: string | null;
  phone_field: string | null;
  message_field: string | null;
  subject_field: string | null;
  submit_button: string | null;
}

export interface FormSubmissionInput {
  prospectId: string;
  formUrl: string;
  fieldMapping: FormFieldMapping;
  honeypotFields: string[];
  requiredSelects: Array<{ selector: string; value: string }>;
  requiredRadios: Array<{ selector: string; value: string }>;
  // Data to fill
  businessName: string;
  ownerName: string | null;
  previewSiteUrl: string;
  claimUrl: string;
  senderName: string;
  senderEmail: string;
  // Options
  dryRun?: boolean;
}

export interface FormSubmissionResult {
  success: boolean;
  status: "success" | "failed" | "captcha_blocked" | "no_form" | "dry_run";
  submittedAt?: string;
  error?: string;
  screenshotPath?: string;
}

// ---------------------------------------------------------------------------
// Message Template
// ---------------------------------------------------------------------------

/**
 * Build the outreach message for a contact form submission.
 * Single URL (claim link only) to reduce spam flag risk.
 * ~320 chars to fit most form message field limits.
 */
export function buildOutreachMessage(opts: {
  businessName: string;
  ownerName: string | null;
  claimUrl: string;
}): string {
  // Extract first name from owner_name if available
  let greeting = "there";
  if (opts.ownerName) {
    const firstName = opts.ownerName.split(" ")[0];
    if (firstName && firstName.length > 1) {
      greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
  }

  const message = `Hi ${greeting},

I built ${opts.businessName} a free professional roofing website with your services and a quote calculator for your customers. Takes 30 seconds to look at.

Claim it here: ${opts.claimUrl}

If not relevant, no worries at all.

— Hannah, RuufPro`;

  // Enforce 500 char limit (truncate business name section if needed)
  if (message.length > 500) {
    return message.slice(0, 497) + "...";
  }

  return message;
}

// ---------------------------------------------------------------------------
// Form Submission
// ---------------------------------------------------------------------------

/**
 * Submit a contact form on a prospect's website via Playwright/Browserless.
 *
 * Flow:
 * 1. Connect to Browserless (cloud) or launch local Chromium
 * 2. Navigate to the form URL
 * 3. Fill fields using stored CSS selectors (skip honeypots)
 * 4. Fill required selects/radios with stored defaults
 * 5. Click submit
 * 6. Verify success via URL change, DOM mutation, or network response
 * 7. Screenshot for audit trail
 */
export async function submitContactForm(
  input: FormSubmissionInput
): Promise<FormSubmissionResult> {
  const { chromium } = await import("playwright");

  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  const browser = browserlessToken
    ? await chromium.connectOverCDP(
        `wss://chrome.browserless.io?token=${browserlessToken}`
      )
    : await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

  const isCloud = !!browserlessToken;
  console.log(
    `Form submit [${input.prospectId.slice(0, 8)}]: using ${isCloud ? "Browserless.io" : "local Chromium"}`
  );

  try {
    const context = isCloud
      ? browser.contexts()[0] || (await browser.newContext())
      : await browser.newContext({
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          viewport: { width: 1280, height: 900 },
        });

    const page = await context.newPage();

    // Navigate to the form page
    await page.goto(input.formUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000); // Let JS-rendered forms load

    // Build the message
    const message = buildOutreachMessage({
      businessName: input.businessName,
      ownerName: input.ownerName,
      claimUrl: input.claimUrl,
    });

    const { fieldMapping } = input;

    // ---- Fill text fields (with human-like delays) ----
    if (fieldMapping.name_field) {
      try {
        await page.fill(fieldMapping.name_field, input.senderName);
        await randomDelay(page);
      } catch (e) {
        console.warn(`Form submit: name field failed (${fieldMapping.name_field}): ${(e as Error).message}`);
      }
    }

    if (fieldMapping.email_field) {
      try {
        await page.fill(fieldMapping.email_field, input.senderEmail);
        await randomDelay(page);
      } catch (e) {
        console.warn(`Form submit: email field failed: ${(e as Error).message}`);
      }
    }

    if (fieldMapping.phone_field) {
      try {
        await page.fill(fieldMapping.phone_field, ""); // Leave phone empty — not needed
        await randomDelay(page);
      } catch {
        // Phone is optional, don't warn
      }
    }

    if (fieldMapping.subject_field) {
      try {
        await page.fill(fieldMapping.subject_field, `Free website for ${input.businessName}`);
        await randomDelay(page);
      } catch {
        // Subject is optional
      }
    }

    if (fieldMapping.message_field) {
      try {
        await page.fill(fieldMapping.message_field, message);
        await randomDelay(page);
      } catch (e) {
        // Message field is critical — if this fails, abort
        return {
          success: false,
          status: "failed",
          error: `Message field fill failed: ${(e as Error).message}`,
        };
      }
    } else {
      return {
        success: false,
        status: "failed",
        error: "No message field in mapping",
      };
    }

    // ---- Fill required selects ----
    for (const sel of input.requiredSelects) {
      try {
        await page.selectOption(sel.selector, sel.value);
        await randomDelay(page);
      } catch {
        // Non-critical — form might still submit
      }
    }

    // ---- Fill required radios ----
    for (const radio of input.requiredRadios) {
      try {
        await page.click(`${radio.selector}[value="${radio.value}"]`);
        await randomDelay(page);
      } catch {
        // Non-critical
      }
    }

    // ---- Solve CAPTCHA if present ----
    const captchaSolved = await solveCaptchaIfPresent(page, input.formUrl);
    if (captchaSolved === "failed") {
      return {
        success: false,
        status: "captcha_blocked",
        error: "CAPTCHA detected but solver failed",
      };
    }
    if (captchaSolved === "solved") {
      console.log(`Form submit [${input.prospectId.slice(0, 8)}]: CAPTCHA solved via CapSolver`);
    }

    // ---- Dry run: screenshot filled form without submitting ----
    if (input.dryRun) {
      const screenshotPath = path.join(
        process.cwd(),
        ".tmp",
        `form-dryrun-${input.prospectId.slice(0, 8)}-${Date.now()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Form submit [${input.prospectId.slice(0, 8)}]: DRY RUN — screenshot saved`);
      return {
        success: true,
        status: "dry_run",
        screenshotPath,
      };
    }

    // ---- Set up AJAX-aware success detection BEFORE clicking submit ----
    const preSubmitUrl = page.url();
    let networkSuccess = false;
    let domSuccess = false;

    // Listen for XHR/fetch responses that indicate success
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      // POST responses with 200 or 302 to the same domain = likely form success
      if (
        response.request().method() === "POST" &&
        (status === 200 || status === 302 || status === 301) &&
        url.includes(new URL(input.formUrl).hostname)
      ) {
        networkSuccess = true;
      }
    });

    // ---- Click submit ----
    if (!fieldMapping.submit_button) {
      return {
        success: false,
        status: "failed",
        error: "No submit button in mapping",
      };
    }

    try {
      await page.click(fieldMapping.submit_button);
    } catch (e) {
      return {
        success: false,
        status: "failed",
        error: `Submit button click failed: ${(e as Error).message}`,
      };
    }

    // ---- Verify success (10 second window) ----
    // Check three signals: URL change, DOM success text, network response
    const successPatterns = /thank\s*you|message\s*sent|received|successfully|been\s*submitted|we('ll| will)\s*(get\s*back|respond|contact)/i;

    let verified = false;
    const deadline = Date.now() + 10000;

    while (Date.now() < deadline && !verified) {
      // Signal 1: URL changed (redirect to thank-you page)
      const currentUrl = page.url();
      if (currentUrl !== preSubmitUrl) {
        verified = true;
        break;
      }

      // Signal 2: DOM mutation — new success text appeared
      try {
        domSuccess = await page.evaluate((pattern) => {
          const body = document.body?.innerText || "";
          return new RegExp(pattern).test(body);
        }, successPatterns.source);

        if (domSuccess) {
          verified = true;
          break;
        }
      } catch {
        // Page might be navigating
      }

      // Signal 3: Network response already caught
      if (networkSuccess) {
        // Give DOM a moment to update
        await page.waitForTimeout(1000);
        verified = true;
        break;
      }

      await page.waitForTimeout(500);
    }

    // ---- Screenshot final state ----
    const screenshotPath = path.join(
      process.cwd(),
      ".tmp",
      `form-${verified ? "ok" : "FAIL"}-${input.prospectId.slice(0, 8)}-${Date.now()}.png`
    );
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch {
      // Non-critical — page may have navigated away
    }

    if (verified) {
      console.log(`Form submit [${input.prospectId.slice(0, 8)}]: ✓ Success`);
      return {
        success: true,
        status: "success",
        submittedAt: new Date().toISOString(),
        screenshotPath,
      };
    } else {
      console.log(`Form submit [${input.prospectId.slice(0, 8)}]: ✗ No success signal detected`);
      return {
        success: false,
        status: "failed",
        error: "No success signal detected within 10s (no URL change, no success text, no network confirmation)",
        screenshotPath,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Form submit [${input.prospectId.slice(0, 8)}]: Fatal error: ${message}`);

    return {
      success: false,
      status: "failed",
      error: message,
    };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Random delay between 0.8-2.2 seconds — mimics human interaction pace.
 * Keeps total form fill within Browserless 60s session limit.
 */
async function randomDelay(page: { waitForTimeout: (ms: number) => Promise<void> }): Promise<void> {
  const ms = 800 + Math.random() * 1400;
  await page.waitForTimeout(ms);
}

// ---------------------------------------------------------------------------
// CAPTCHA Solving via CapSolver
// ---------------------------------------------------------------------------

/**
 * Detect and solve reCAPTCHA/hCaptcha on the current page.
 * Returns "solved", "none" (no CAPTCHA found), or "failed".
 *
 * Flow:
 * 1. Check page for reCAPTCHA v2/v3 or hCaptcha sitekey
 * 2. Send solve request to CapSolver API
 * 3. Poll for solution (up to 60s)
 * 4. Inject the token into the page's hidden response field
 */
async function solveCaptchaIfPresent(
  page: { evaluate: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown>; waitForTimeout: (ms: number) => Promise<void> },
  formUrl: string
): Promise<"solved" | "none" | "failed"> {
  const apiKey = process.env.CAPSOLVER_API_KEY;
  if (!apiKey) return "none"; // No key = skip CAPTCHA solving silently

  // Detect CAPTCHA type and sitekey from the page
  const captchaInfo = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;

    // reCAPTCHA v2 (checkbox)
    const recaptchaV2 = document.querySelector(".g-recaptcha");
    if (recaptchaV2) {
      const sitekey = recaptchaV2.getAttribute("data-sitekey");
      if (sitekey) return { type: "recaptcha_v2", sitekey };
    }

    // reCAPTCHA v2 invisible
    const recaptchaInvisible = document.querySelector('[data-sitekey][data-size="invisible"]');
    if (recaptchaInvisible) {
      const sitekey = recaptchaInvisible.getAttribute("data-sitekey");
      if (sitekey) return { type: "recaptcha_v2_invisible", sitekey };
    }

    // reCAPTCHA v3 (script-based, no visible widget)
    const v3Match = html.match(/grecaptcha\.execute\(['"]([^'"]+)['"]/);
    if (v3Match) return { type: "recaptcha_v3", sitekey: v3Match[1] };

    // Fallback: any data-sitekey attribute
    const anySitekey = document.querySelector("[data-sitekey]");
    if (anySitekey) {
      const sitekey = anySitekey.getAttribute("data-sitekey");
      if (sitekey) return { type: "recaptcha_v2", sitekey };
    }

    // hCaptcha
    const hcaptcha = document.querySelector(".h-captcha");
    if (hcaptcha) {
      const sitekey = hcaptcha.getAttribute("data-sitekey");
      if (sitekey) return { type: "hcaptcha", sitekey };
    }

    // Check for reCAPTCHA script loaded but no visible element
    if (html.includes("recaptcha/api.js") || html.includes("recaptcha/enterprise.js")) {
      const scriptMatch = html.match(/render[=:][\s'"]*([a-zA-Z0-9_-]{20,})/);
      if (scriptMatch) return { type: "recaptcha_v3", sitekey: scriptMatch[1] };
    }

    return null;
  }) as { type: string; sitekey: string } | null;

  if (!captchaInfo) return "none";

  console.log(`CAPTCHA detected: ${captchaInfo.type} (sitekey: ${captchaInfo.sitekey.slice(0, 20)}...)`);

  try {
    // Create task with CapSolver
    const taskType =
      captchaInfo.type === "hcaptcha"
        ? "HCaptchaTaskProxyLess"
        : captchaInfo.type === "recaptcha_v3"
          ? "ReCaptchaV3TaskProxyLess"
          : "ReCaptchaV2TaskProxyLess";

    const createBody: Record<string, unknown> = {
      clientKey: apiKey,
      task: {
        type: taskType,
        websiteURL: formUrl,
        websiteKey: captchaInfo.sitekey,
      },
    };

    // v3 needs page action and minimum score
    if (captchaInfo.type === "recaptcha_v3") {
      (createBody.task as Record<string, unknown>).pageAction = "submit";
      (createBody.task as Record<string, unknown>).minScore = 0.5;
    }

    const createRes = await fetch("https://api.capsolver.com/createTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createBody),
    });
    const createData = (await createRes.json()) as { errorId: number; taskId?: string; errorDescription?: string };

    if (createData.errorId !== 0 || !createData.taskId) {
      console.warn(`CapSolver createTask failed: ${createData.errorDescription || "unknown error"}`);
      return "failed";
    }

    // Poll for result (up to 60 seconds)
    const taskId = createData.taskId;
    const deadline = Date.now() + 60000;

    while (Date.now() < deadline) {
      await page.waitForTimeout(3000);

      const pollRes = await fetch("https://api.capsolver.com/getTaskResult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey: apiKey, taskId }),
      });
      const pollData = (await pollRes.json()) as {
        status: string;
        solution?: { gRecaptchaResponse?: string; token?: string };
        errorDescription?: string;
      };

      if (pollData.status === "ready" && pollData.solution) {
        const token =
          pollData.solution.gRecaptchaResponse || pollData.solution.token || "";

        if (!token) {
          console.warn("CapSolver returned empty token");
          return "failed";
        }

        // Inject the token into the page
        await page.evaluate((solveToken: unknown) => {
          const t = solveToken as string;
          // reCAPTCHA response textarea
          const textarea = document.querySelector(
            "#g-recaptcha-response, [name='g-recaptcha-response']"
          ) as HTMLTextAreaElement | null;
          if (textarea) {
            textarea.style.display = "block";
            textarea.value = t;
          }

          // Also try all textareas with recaptcha in the name (some forms have multiple)
          document
            .querySelectorAll("textarea[name*='recaptcha']")
            .forEach((el) => {
              (el as HTMLTextAreaElement).value = t;
            });

          // hCaptcha response
          const hResponse = document.querySelector(
            "[name='h-captcha-response']"
          ) as HTMLTextAreaElement | null;
          if (hResponse) hResponse.value = t;

          // Call grecaptcha callback if it exists
          const w = window as unknown as Record<string, unknown>;
          if (w.___grecaptcha_cfg) {
            const cfg = w.___grecaptcha_cfg as Record<string, Record<string, unknown>>;
            const clients = cfg.clients;
            if (clients) {
              for (const key of Object.keys(clients)) {
                const client = clients[key] as Record<string, unknown>;
                // Walk the client object to find callback
                const findCallback = (obj: Record<string, unknown>): ((token: string) => void) | null => {
                  for (const k of Object.keys(obj)) {
                    const v = obj[k];
                    if (typeof v === "function" && k.length < 3) return v as (token: string) => void;
                    if (v && typeof v === "object") {
                      const found = findCallback(v as Record<string, unknown>);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const cb = findCallback(client);
                if (cb) cb(t);
              }
            }
          }
        }, token);

        return "solved";
      }

      if (pollData.status === "failed") {
        console.warn(`CapSolver task failed: ${pollData.errorDescription || "unknown"}`);
        return "failed";
      }
    }

    console.warn("CapSolver: timed out waiting for solution");
    return "failed";
  } catch (err) {
    console.warn(`CapSolver error: ${err instanceof Error ? err.message : "unknown"}`);
    return "failed";
  }
}
