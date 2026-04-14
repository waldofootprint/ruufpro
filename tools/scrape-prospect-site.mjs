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
// Also detects contact forms for outreach automation.

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

    // ---- Estimate Widget Detection ----
    // Check if they already have Roofle, Roofr, EagleView, or similar estimate tools
    const htmlLower = document.documentElement.innerHTML.toLowerCase();
    const estimateWidgets = [];

    if (htmlLower.includes("roofle") || htmlLower.includes("roofle.com")) estimateWidgets.push("roofle");
    if (htmlLower.includes("roofr") || htmlLower.includes("roofr.com")) estimateWidgets.push("roofr");
    if (htmlLower.includes("eagleview") || htmlLower.includes("eagle view")) estimateWidgets.push("eagleview");
    if (htmlLower.includes("roofquote") || htmlLower.includes("roof-quote")) estimateWidgets.push("roofquote");
    if (htmlLower.includes("instant estimate") || htmlLower.includes("instant quote") || htmlLower.includes("online estimate")) {
      // Check for iframes (common embed pattern)
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        const src = (iframe.getAttribute("src") || "").toLowerCase();
        if (src.includes("roofle") || src.includes("roofr") || src.includes("eagleview") || src.includes("estimate")) {
          estimateWidgets.push("iframe_widget");
          break;
        }
      }
    }

    result.has_estimate_widget = estimateWidgets.length > 0;
    result.estimate_widget_providers = estimateWidgets;

    return result;
  });
}

// --------------- Contact Form Detection ---------------

/**
 * Find the contact page URL by checking nav links and common paths.
 * Returns the URL to navigate to, or null if no contact page found.
 */
async function findContactPageUrl(page) {
  // First check nav links for contact-related hrefs
  const contactHref = await page.evaluate(() => {
    const links = document.querySelectorAll("a");
    const patterns = /\/(contact|contact-us|get-in-touch|reach-us|get-a-quote|free-estimate|request)/i;
    const textPatterns = /^(contact|contact us|get in touch|reach us|get a quote|free estimate|request)/i;

    for (const link of links) {
      const href = link.getAttribute("href") || "";
      const text = link.textContent?.trim() || "";
      if (patterns.test(href) || textPatterns.test(text)) {
        // Return absolute or relative href
        return href;
      }
    }
    return null;
  });

  return contactHref;
}

/**
 * Detect contact forms on the current page.
 * Runs entirely inside page.evaluate() for speed.
 * Returns structured form data including field mapping, honeypot detection, and CAPTCHA status.
 */
async function detectFormOnPage(page) {
  return await page.evaluate(() => {
    const result = {
      found: false,
      form_url: window.location.href,
      form_type: "unknown",
      has_captcha: false,
      field_mapping: null,
      honeypot_fields: [],
      required_selects: [],
      required_radios: [],
    };

    // ---- CAPTCHA detection (check early, save time) ----
    const html = document.documentElement.innerHTML;
    if (
      html.includes("grecaptcha") ||
      html.includes("data-sitekey") ||
      html.includes("g-recaptcha") ||
      html.includes("cf-turnstile") ||
      html.includes("cloudflare") && html.includes("challenge") ||
      html.includes("hcaptcha") ||
      html.includes("data-netlify-recaptcha")
    ) {
      result.has_captcha = true;
    }

    // ---- Find forms ----
    const forms = document.querySelectorAll("form");
    if (forms.length === 0) {
      // Check for Wix forms (inside iframes — can't automate)
      const wixForm = document.querySelector('[data-mesh-id] form, [id*="comp-"] form');
      if (wixForm) {
        result.has_captcha = true; // Flag as non-automatable
        result.form_type = "wix";
      }
      // Check for Jotform iframes
      const jotformIframe = document.querySelector('iframe[src*="jotform"]');
      if (jotformIframe) {
        result.has_captcha = true;
        result.form_type = "jotform_iframe";
      }
      return result;
    }

    // ---- Pick the best form (skip search forms, newsletter forms) ----
    let bestForm = null;
    for (const form of forms) {
      const action = (form.getAttribute("action") || "").toLowerCase();
      const id = (form.id || "").toLowerCase();
      const className = (form.className || "").toLowerCase();
      const inputs = form.querySelectorAll("input, textarea, select");

      // Skip search forms
      if (action.includes("search") || id.includes("search") || className.includes("search")) continue;
      // Skip newsletter/subscribe forms (usually just email)
      if (id.includes("subscribe") || id.includes("newsletter") || className.includes("subscribe")) continue;
      // Skip login forms
      if (id.includes("login") || id.includes("signin") || action.includes("login")) continue;
      // Must have at least 2 inputs (name + email minimum) or a textarea
      const hasTextarea = form.querySelector("textarea");
      if (inputs.length < 2 && !hasTextarea) continue;

      // Prefer forms with textareas (message field = contact form)
      if (!bestForm || hasTextarea) {
        bestForm = form;
        if (hasTextarea) break; // Textarea is strong signal, stop looking
      }
    }

    if (!bestForm) return result;
    result.found = true;

    // ---- Detect form builder type ----
    const formHtml = bestForm.outerHTML.toLowerCase();
    const formClass = (bestForm.className || "").toLowerCase();
    const formId = (bestForm.id || "").toLowerCase();

    if (formClass.includes("wpcf7") || formHtml.includes("wpcf7")) {
      result.form_type = "cf7";
    } else if (formClass.includes("gform") || formHtml.includes("gform") || formId.includes("gform")) {
      result.form_type = "gravity";
    } else if (formClass.includes("wpforms") || formHtml.includes("wpforms")) {
      result.form_type = "wpforms";
    } else if (bestForm.closest("[data-form-id]") || formHtml.includes("data-form-id")) {
      result.form_type = "squarespace";
    } else if (formClass.includes("gdw-form") || formHtml.includes("gdw-form")) {
      result.form_type = "godaddy";
    } else if (formHtml.includes("elementor")) {
      result.form_type = "elementor";
    } else {
      result.form_type = "custom";
    }

    // ---- Helper: check if an element is visually hidden (honeypot) ----
    function isHoneypot(el) {
      const style = window.getComputedStyle(el);
      if (style.display === "none") return true;
      if (style.visibility === "hidden") return true;
      if (style.opacity === "0") return true;
      if (parseInt(style.height) === 0 && style.overflow === "hidden") return true;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return true;
      if (rect.left < -500 || rect.top < -500) return true;

      // Check parent container too
      const parent = el.closest("div, span, p, li");
      if (parent && parent !== document.body) {
        const pStyle = window.getComputedStyle(parent);
        if (pStyle.display === "none" || pStyle.visibility === "hidden" || pStyle.opacity === "0") return true;
        if (parseInt(pStyle.height) === 0 && pStyle.overflow === "hidden") return true;
        const pRect = parent.getBoundingClientRect();
        if (pRect.left < -500 || pRect.top < -500) return true;
      }

      // Common honeypot naming patterns
      const name = (el.getAttribute("name") || "").toLowerCase();
      if (name.includes("honeypot") || name.includes("hp-") || name === "website" || name === "url") return true;
      // CF7 specific honeypot
      if (name.includes("_wpcf7_") && !name.includes("your-")) return true;

      return false;
    }

    // ---- Helper: check if a field is a CSRF/nonce token (preserve, don't fill) ----
    function isCsrfField(el) {
      const name = (el.getAttribute("name") || "").toLowerCase();
      return name.includes("nonce") || name.includes("token") || name.includes("_wp") ||
        name.includes("csrf") || name.includes("_state") || name.includes("action") ||
        el.type === "hidden";
    }

    // ---- Helper: get best CSS selector for an element ----
    function getSelector(el) {
      if (el.id) return `#${el.id}`;
      if (el.getAttribute("name")) return `[name="${el.getAttribute("name")}"]`;
      if (el.getAttribute("data-q")) return `[data-q="${el.getAttribute("data-q")}"]`;
      // Fall back to nth-of-type within form
      const tag = el.tagName.toLowerCase();
      const siblings = bestForm.querySelectorAll(tag);
      const idx = Array.from(siblings).indexOf(el);
      return `form ${tag}:nth-of-type(${idx + 1})`;
    }

    // ---- Helper: classify a field by what it's asking for ----
    function classifyField(el) {
      const name = (el.getAttribute("name") || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
      const type = (el.type || "").toLowerCase();
      const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();

      // Find associated label
      let labelText = "";
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) labelText = label.textContent.trim().toLowerCase();
      }
      // Also check wrapping label
      const wrapLabel = el.closest("label");
      if (wrapLabel) labelText = labelText || wrapLabel.textContent.trim().toLowerCase();

      const all = `${name} ${id} ${placeholder} ${type} ${labelText} ${ariaLabel}`;

      if (type === "email" || all.includes("email")) return "email";
      if (type === "tel" || all.includes("phone") || all.includes("tel")) return "phone";
      if (el.tagName === "TEXTAREA" || all.includes("message") || all.includes("comment") || all.includes("question") || all.includes("details")) return "message";
      if (all.includes("name") && !all.includes("company") && !all.includes("business")) return "name";
      if (all.includes("subject")) return "subject";
      if (all.includes("company") || all.includes("business")) return "company";

      return "unknown";
    }

    // ---- Map all fields ----
    const mapping = {
      name_field: null,
      email_field: null,
      phone_field: null,
      message_field: null,
      subject_field: null,
      submit_button: null,
    };

    const allInputs = bestForm.querySelectorAll("input, textarea");
    for (const el of allInputs) {
      // Skip hidden CSRF/nonce tokens
      if (isCsrfField(el) && el.type === "hidden") continue;

      // Check for honeypot
      if (isHoneypot(el)) {
        result.honeypot_fields.push(getSelector(el));
        continue;
      }

      const field = classifyField(el);
      const selector = getSelector(el);

      if (field === "name" && !mapping.name_field) mapping.name_field = selector;
      else if (field === "email" && !mapping.email_field) mapping.email_field = selector;
      else if (field === "phone" && !mapping.phone_field) mapping.phone_field = selector;
      else if (field === "message" && !mapping.message_field) mapping.message_field = selector;
      else if (field === "subject" && !mapping.subject_field) mapping.subject_field = selector;
    }

    // ---- Detect required selects ----
    const selects = bestForm.querySelectorAll("select");
    for (const sel of selects) {
      if (isHoneypot(sel)) continue;
      const isRequired = sel.hasAttribute("required") || sel.getAttribute("aria-required") === "true";
      const options = sel.querySelectorAll("option");
      // Find first non-placeholder option
      let defaultValue = null;
      for (const opt of options) {
        const val = opt.value;
        const text = opt.textContent.trim().toLowerCase();
        // Skip placeholders
        if (!val || val === "" || text.includes("select") || text.includes("choose") || text.includes("---") || text.includes("please")) continue;
        defaultValue = val;
        break;
      }
      if (defaultValue) {
        result.required_selects.push({
          selector: getSelector(sel),
          value: defaultValue,
          required: isRequired,
        });
      }
    }

    // ---- Detect required radio groups ----
    const radioGroups = {};
    const radios = bestForm.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
      const name = radio.getAttribute("name");
      if (!name || radioGroups[name]) continue;
      radioGroups[name] = {
        selector: `[name="${name}"]`,
        value: radio.value,
      };
    }
    result.required_radios = Object.values(radioGroups);

    // ---- Find submit button ----
    // Priority: button[type=submit], input[type=submit], button with submit-like text
    const submitBtn = bestForm.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      mapping.submit_button = getSelector(submitBtn);
    } else {
      // Look for buttons with submit-like text
      const buttons = bestForm.querySelectorAll("button, [role='button']");
      for (const btn of buttons) {
        const btnText = btn.textContent.trim().toLowerCase();
        if (btnText.includes("submit") || btnText.includes("send") || btnText.includes("contact") || btnText.includes("get") || btnText.includes("request")) {
          mapping.submit_button = getSelector(btn);
          break;
        }
      }
    }

    // ---- Validate: need at minimum a message field and a submit button ----
    if (!mapping.message_field && !mapping.email_field) {
      result.found = false;
      return result;
    }

    result.field_mapping = mapping;
    return result;
  });
}

/**
 * Detect contact form on a prospect's website.
 * Navigates to contact page if found, then runs form detection.
 * Called from scrapeSite() in the same browser session (zero extra cost).
 */
async function detectContactForm(page, verbose = false) {
  try {
    // Step 1: Check current page for a contact page link
    const contactHref = await findContactPageUrl(page);

    // Step 2: Navigate to contact page if found
    if (contactHref) {
      try {
        const contactUrl = contactHref.startsWith("http")
          ? contactHref
          : new URL(contactHref, page.url()).href;

        if (verbose) console.log(`    → Contact page: ${contactUrl}`);
        await page.goto(contactUrl, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
        await page.waitForTimeout(1500); // Wait for JS-rendered forms
      } catch (navErr) {
        if (verbose) console.log(`    → Contact page nav failed: ${navErr.message}`);
        // Fall through — detect on current page instead
      }
    }

    // Step 3: Run detection on current page
    const detection = await detectFormOnPage(page);

    if (verbose) {
      if (detection.found) {
        const fieldCount = Object.values(detection.field_mapping || {}).filter(Boolean).length;
        console.log(`    📋 Form found (${detection.form_type}): ${fieldCount} fields mapped${detection.has_captcha ? " ⚠️ CAPTCHA" : ""}`);
        if (detection.honeypot_fields.length > 0) {
          console.log(`    🍯 ${detection.honeypot_fields.length} honeypot field(s) detected`);
        }
        if (detection.required_selects.length > 0) {
          console.log(`    📝 ${detection.required_selects.length} required select(s) detected`);
        }
      } else {
        console.log(`    📋 No contact form found`);
      }
    }

    return detection;
  } catch (err) {
    if (verbose) console.log(`    📋 Form detection failed: ${err.message}`);
    return { found: false, has_captcha: false, error: err.message };
  }
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

    // Detect contact form (same browser session, zero extra cost)
    const formData = await detectContactForm(page, verbose);

    return { success: true, url: fullUrl, ...data, form: formData };
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
        const form = data.form || {};
        const serviceCount = data.services?.length || 0;
        const reviewCount = data.reviews?.length || 0;
        const formStatus = form.found ? (form.has_captcha ? "CAPTCHA" : `${form.form_type}`) : "none";
        console.log(`  ✓ Found: ${serviceCount} services, ${reviewCount} reviews, phone: ${data.phone || "none"}, form: ${formStatus}`);
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
          // Form detection fields
          contact_form_url: form.found ? form.form_url : "",
          form_field_mapping: form.found ? JSON.stringify(form.field_mapping) : "",
          has_captcha: form.has_captcha ? "true" : "false",
          form_type: form.form_type || "",
          form_honeypot_fields: form.honeypot_fields?.length ? JSON.stringify(form.honeypot_fields) : "",
          form_required_selects: form.required_selects?.length ? JSON.stringify(form.required_selects) : "",
          form_required_radios: form.required_radios?.length ? JSON.stringify(form.required_radios) : "",
          has_estimate_widget: data.has_estimate_widget ? "true" : "false",
          estimate_widget_providers: (data.estimate_widget_providers || []).join("; "),
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

    // Write enriched CSV — explicitly list all columns so rows without form data
    // (no_website, failed) don't truncate the column set via Object.keys(records[0])
    const inputCols = Object.keys(rows[0] || {});
    const enrichedCols = [
      ...inputCols,
      "scraped_tagline", "scraped_hero_headline", "scraped_about_text",
      "scraped_services", "scraped_reviews", "scraped_phone", "scraped_service_areas",
      "scrape_status", "contact_form_url", "form_field_mapping", "has_captcha",
      "form_type", "form_honeypot_fields", "form_required_selects", "form_required_radios",
      "has_estimate_widget", "estimate_widget_providers",
    ].filter((c, i, arr) => arr.indexOf(c) === i); // dedupe
    const outputPath = opts.output || opts.csv.replace(".csv", "_scraped.csv");
    writeCsv(outputPath, results, enrichedCols);

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
