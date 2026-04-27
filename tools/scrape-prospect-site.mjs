#!/usr/bin/env node

// Prospect Website Scraper — extracts structured business data from a roofer's
// existing website to populate their RuufPro preview site with real content.
//
// Refactored 2026-04-27 (session 4) — Firecrawl REST replaces Playwright so the
// crawler runs on Vercel serverless (no chromium binary required).
//
// Usage:
//   node tools/scrape-prospect-site.mjs --url "https://example-roofing.com"
//   node tools/scrape-prospect-site.mjs --csv .tmp/prospects/tampa_fl.csv

import { load as cheerioLoad } from "cheerio";
import { readCsv, writeCsv } from "./lib/csv.mjs";
import { existsSync } from "fs";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const FIRECRAWL_TIMEOUT_MS = 25000;
const DELAY_BETWEEN = 1500;

// --------------- Firecrawl REST helper ---------------

/**
 * Scrape a URL via Firecrawl REST. Returns { ok, html, markdown, links, title, url }
 * on success or { ok: false, reason } on failure.
 *
 * Firecrawl handles JS rendering by default and returns rendered HTML — covers
 * Wix / SquareSpace / GoDaddy / Webflow sites that vanilla fetch can't see.
 */
export async function firecrawlScrape(targetUrl, opts = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing_firecrawl_key" };
  }
  const { timeoutMs = FIRECRAWL_TIMEOUT_MS } = opts;

  let normalized = targetUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  const ctrl = AbortSignal.timeout(timeoutMs);
  let res;
  try {
    res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: normalized,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
        // Wait briefly for JS-rendered content (matches old Playwright wait).
        waitFor: 1500,
      }),
      signal: ctrl,
    });
  } catch (err) {
    return { ok: false, reason: `firecrawl_fetch_failed: ${err.message}` };
  }

  if (!res.ok) {
    let body = "";
    try { body = (await res.text()).slice(0, 200); } catch {}
    return { ok: false, reason: `firecrawl_http_${res.status}: ${body}` };
  }

  let json;
  try { json = await res.json(); } catch (err) {
    return { ok: false, reason: `firecrawl_bad_json: ${err.message}` };
  }
  if (!json?.success || !json?.data) {
    return { ok: false, reason: `firecrawl_no_data` };
  }

  const data = json.data;
  return {
    ok: true,
    url: data?.metadata?.sourceURL || data?.metadata?.url || normalized,
    title: data?.metadata?.title || "",
    description: data?.metadata?.description || "",
    html: data?.html || "",
    markdown: data?.markdown || "",
    links: Array.isArray(data?.links) ? data.links : [],
  };
}

// --------------- Argument Parsing ---------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--url" && args[i + 1]) opts.url = args[++i];
    else if (arg === "--csv" && args[i + 1]) opts.csv = args[++i];
    else if (arg === "--output" && args[i + 1]) opts.output = args[++i];
    else if (arg === "--verbose") opts.verbose = true;
  }
  return opts;
}

// --------------- Cheerio extraction ---------------

/**
 * Extract structured business data from rendered HTML.
 *
 * Signature CHANGED 2026-04-27 (session 4): now takes a Firecrawl scrape object
 * (`{ html, markdown, title, description, url }`) instead of a Playwright Page.
 * All callers updated. Same return shape as before — see lib/scrape-to-chatbot-config.ts:ScraperOutput.
 */
export function extractSiteData(scrape) {
  const html = scrape?.html || "";
  const markdown = scrape?.markdown || "";
  const pageTitle = scrape?.title || "";
  const metaDescription = scrape?.description || "";
  const baseUrl = scrape?.url || "";

  const $ = cheerioLoad(html);

  // Plain-text approximation of body innerText (cheerio doesn't compute layout
  // so this is best-effort — markdown is usually a cleaner read of visible text).
  const bodyText = (markdown || $("body").text() || "").replace(/ /g, " ");

  const result = {
    tagline: null,
    hero_headline: null,
    about_text: null,
    services: [],
    reviews: [],
    phone: null,
    service_areas: [],
  };

  const t = (el) => ($(el).text() || "").trim();

  // ---- Phone ----
  const telLink = $('a[href^="tel:"]').first();
  if (telLink.length) {
    result.phone = (telLink.attr("href") || "").replace("tel:", "").replace(/\s+/g, "");
  } else {
    const m = bodyText.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    if (m) result.phone = m[0];
  }

  // ---- Hero Headline ----
  const h1 = $("h1").first();
  if (h1.length) {
    const h1Text = t(h1);
    if (h1Text.length > 5 && h1Text.length < 200) result.hero_headline = h1Text;
  }

  // ---- Tagline ----
  if (metaDescription && metaDescription.length > 10 && metaDescription.length < 300) {
    result.tagline = metaDescription;
  } else {
    const meta = $('meta[name="description"]').attr("content");
    if (meta && meta.trim().length > 10 && meta.trim().length < 300) result.tagline = meta.trim();
  }

  // Subtitle near hero
  if (h1.length) {
    const sib = h1.next();
    if (sib.length && ["P", "SPAN", "DIV", "H2"].includes(sib.prop("tagName"))) {
      const sibText = t(sib);
      if (sibText.length > 10 && sibText.length < 200 && !result.tagline) {
        result.tagline = sibText;
      }
    }
  }

  // ---- Services ----
  const servicePatterns = /services|what we do|our work|specialties|offerings/i;
  let serviceHeading = null;
  $("h2, h3, h4").each((_, el) => {
    if (serviceHeading) return;
    const $el = $(el);
    if (servicePatterns.test(t($el)) || servicePatterns.test($el.attr("id") || "")) {
      serviceHeading = $el;
    }
  });
  if (serviceHeading) {
    const parent = serviceHeading.closest("section");
    const scope = parent.length ? parent : serviceHeading.parent();
    const lis = scope.find("li");
    lis.each((_, li) => {
      const txt = t(li);
      if (txt.length > 2 && txt.length < 100 && !txt.includes("©")) {
        result.services.push(txt.split("\n")[0].trim());
      }
    });
    if (result.services.length === 0) {
      scope.find("h3, h4, h5").each((_, sh) => {
        const txt = t(sh);
        if (txt.length > 2 && txt.length < 80) result.services.push(txt);
      });
    }
  }
  // Fallback: scan all li for roofing terms
  if (result.services.length === 0) {
    const roofingTerms = /roof|shingle|gutter|siding|repair|install|replace|inspect|leak|storm|metal roof|flat roof|tile|slate|commercial|residential/i;
    $("li").each((_, li) => {
      const txt = t(li);
      if (roofingTerms.test(txt) && txt.length > 3 && txt.length < 80) {
        result.services.push(txt.split("\n")[0].trim());
      }
    });
  }
  result.services = [...new Set(result.services)].slice(0, 12);

  // ---- About Text ----
  const aboutPatterns = /about us|about|who we are|our story|our company|why choose/i;
  let aboutHeading = null;
  $("h2, h3, h4").each((_, el) => {
    if (aboutHeading) return;
    const $el = $(el);
    if (aboutPatterns.test(t($el))) aboutHeading = $el;
  });
  if (aboutHeading) {
    const parent = aboutHeading.closest("section");
    const scope = parent.length ? parent : aboutHeading.parent();
    const aboutParts = [];
    scope.find("p").each((_, p) => {
      const txt = t(p);
      if (txt.length > 30 && txt.length < 800 && !txt.includes("©")) aboutParts.push(txt);
    });
    if (aboutParts.length) result.about_text = aboutParts.slice(0, 3).join(" ");
  }
  if (!result.about_text && result.tagline) result.about_text = result.tagline;

  // ---- Years in Business ----
  result.years_in_business = null;
  result.founded_year = null;
  const currentYear = new Date().getFullYear();
  const sinceMatch = bodyText.match(/(?:since|established|founded|est\.?)\s*(?:in\s+)?(\d{4})/i);
  if (sinceMatch) {
    const y = parseInt(sinceMatch[1]);
    if (y >= 1950 && y <= currentYear) {
      result.founded_year = y;
      result.years_in_business = currentYear - y;
    }
  }
  if (!result.years_in_business) {
    const ym = bodyText.match(/(\d{1,2})\+?\s*years?\s*(?:of\s+)?(?:experience|serving|service|in business|in the industry|in roofing)/i);
    if (ym) {
      const yrs = parseInt(ym[1]);
      if (yrs >= 1 && yrs <= 75) {
        result.years_in_business = yrs;
        result.founded_year = currentYear - yrs;
      }
    }
  }
  if (!result.years_in_business) {
    const om = bodyText.match(/over\s+(\d{1,2})\s*years/i);
    if (om) {
      const yrs = parseInt(om[1]);
      if (yrs >= 1 && yrs <= 75) {
        result.years_in_business = yrs;
        result.founded_year = currentYear - yrs;
      }
    }
  }

  // ---- Reviews ----
  const reviewPatterns = /reviews|testimonials|what (our |people |customers )?say|feedback|ratings/i;
  let reviewHeading = null;
  $("h2, h3, h4").each((_, el) => {
    if (reviewHeading) return;
    const $el = $(el);
    if (reviewPatterns.test(t($el))) reviewHeading = $el;
  });
  if (reviewHeading) {
    const parent = reviewHeading.closest("section");
    const scope = parent.length ? parent : reviewHeading.parent();
    const blocks = scope.find("blockquote, .review, .testimonial, [class*='review'], [class*='testimonial']");
    blocks.each((_, b) => {
      const txt = t(b);
      if (txt.length > 15 && txt.length < 500) {
        result.reviews.push({ name: "Happy Customer", text: txt.replace(/^["'""]|["'""]$/g, "").trim(), rating: 5 });
      }
    });
    if (result.reviews.length === 0) {
      scope.find("p").each((_, p) => {
        const txt = t(p);
        if (
          txt.length > 20 && txt.length < 400 &&
          (txt.startsWith('"') || txt.startsWith("“") || /great|recommend|professional/i.test(txt))
        ) {
          result.reviews.push({ name: "Happy Customer", text: txt.replace(/^["'""]|["'""]$/g, "").trim(), rating: 5 });
        }
      });
    }
    // Names
    if (result.reviews.length) {
      const names = [];
      scope.find("cite, .author, .name, [class*='author'], [class*='name'], strong").each((_, n) => {
        const nm = t(n);
        if (nm.length > 2 && nm.length < 40 && !nm.includes("©") && !/\d{3}/.test(nm)) {
          names.push(nm.replace(/^[-–—]/, "").trim());
        }
      });
      for (let i = 0; i < Math.min(names.length, result.reviews.length); i++) {
        result.reviews[i].name = names[i];
      }
    }
  }
  result.reviews = result.reviews.slice(0, 5);

  // ---- Service Areas ----
  const areaPatterns = /service area|areas (we )?serve|serving|locations|coverage|communities/i;
  $("h2, h3, h4").each((_, el) => {
    if (result.service_areas.length) return;
    const $el = $(el);
    if (!areaPatterns.test(t($el))) return;
    const parent = $el.closest("section");
    const scope = parent.length ? parent : $el.parent();
    scope.find("li").each((_, li) => {
      const txt = t(li);
      if (txt.length > 2 && txt.length < 60) result.service_areas.push(txt);
    });
  });
  result.service_areas = result.service_areas.slice(0, 20);

  // ---- Competitor Tool Detection ----
  const htmlLower = html.toLowerCase();
  const competitorTools = [];
  if (/\broofle\b|roofle\.com/.test(htmlLower)) competitorTools.push("roofle");
  if (/\broofr\b|roofr\.com/.test(htmlLower)) competitorTools.push("roofr");
  if (htmlLower.includes("iroofing")) competitorTools.push("iroofing");
  if (/roofquote|roof-quote/.test(htmlLower)) competitorTools.push("roofquote");
  if (htmlLower.includes("instantroofer")) competitorTools.push("instantroofer");
  if (htmlLower.includes("intercom")) competitorTools.push("intercom");
  if (/drift\.com|drift-widget/.test(htmlLower)) competitorTools.push("drift");
  if (/tidio|tidiochat/.test(htmlLower)) competitorTools.push("tidio");
  if (/livechat|livechatinc/.test(htmlLower)) competitorTools.push("livechat");
  if (/crisp\.chat|crisp-client/.test(htmlLower)) competitorTools.push("crisp");
  if (htmlLower.includes("hubspot") && /chat|conversations/.test(htmlLower)) competitorTools.push("hubspot_chat");
  if (htmlLower.includes("zendesk") && htmlLower.includes("chat")) competitorTools.push("zendesk_chat");
  if (/tawk\.to|tawk/.test(htmlLower)) competitorTools.push("tawk");
  if (htmlLower.includes("podium")) competitorTools.push("podium");
  if (htmlLower.includes("birdeye")) competitorTools.push("birdeye");
  if (htmlLower.includes("nicejob")) competitorTools.push("nicejob");
  if (htmlLower.includes("gatherup")) competitorTools.push("gatherup");
  if (htmlLower.includes("grade.us")) competitorTools.push("grade.us");
  if (/highlevel|gohighlevel|leadconnector/.test(htmlLower)) competitorTools.push("ghl");
  $("iframe").each((_, f) => {
    const src = ($(f).attr("src") || "").toLowerCase();
    if (/roofle|roofr|estimate/.test(src)) competitorTools.push("iframe_widget");
    if (/tidio|intercom|drift/.test(src)) competitorTools.push("iframe_chat");
  });
  result.has_estimate_widget = competitorTools.some(t => ["roofle","roofr","iroofing","roofquote","instantroofer","iframe_widget"].includes(t));
  result.estimate_widget_providers = competitorTools.filter(t => ["roofle","roofr","iroofing","roofquote","instantroofer","iframe_widget"].includes(t));
  result.competitor_tools = [...new Set(competitorTools)];

  // ---- FAQ Extraction ----
  result.faq = [];
  // FAQ schema first (regardless of section)
  $('script[type="application/ld+json"]').each((_, s) => {
    if (result.faq.length) return;
    try {
      const data = JSON.parse($(s).html() || "");
      const blocks = Array.isArray(data) ? data : [data];
      for (const block of blocks) {
        if (block?.["@type"] === "FAQPage" && Array.isArray(block.mainEntity)) {
          for (const item of block.mainEntity) {
            result.faq.push({
              question: item.name || "",
              answer: (item.acceptedAnswer?.text || "").slice(0, 500),
            });
          }
        }
      }
    } catch {}
  });
  // Then look for an FAQ section in DOM
  if (result.faq.length === 0) {
    const faqPatterns = /faq|frequently asked|common questions|q\s*&\s*a/i;
    let faqHeading = null;
    $("h2, h3, h4").each((_, el) => {
      if (faqHeading) return;
      const $el = $(el);
      if (faqPatterns.test(t($el)) || faqPatterns.test($el.attr("id") || "")) faqHeading = $el;
    });
    if (faqHeading) {
      const parent = faqHeading.closest("section");
      const scope = parent.length ? parent : faqHeading.parent();
      // dt/dd
      const dts = scope.find("dt").toArray();
      const dds = scope.find("dd").toArray();
      for (let i = 0; i < Math.min(dts.length, dds.length); i++) {
        result.faq.push({
          question: t(dts[i]).slice(0, 200),
          answer: t(dds[i]).slice(0, 500),
        });
      }
      // accordion summary/button
      if (result.faq.length === 0) {
        scope.find("summary, button[aria-expanded], [class*='accordion']").each((_, summary) => {
          const $sum = $(summary);
          const q = t($sum).slice(0, 200);
          let sib = $sum.next();
          if (!sib.length) sib = $sum.parent().find("p, div").first();
          const a = sib.length ? t(sib).slice(0, 500) : "";
          if (q.length > 5 && a.length > 5) result.faq.push({ question: q, answer: a });
        });
      }
      // heading + paragraph w/ ?
      if (result.faq.length === 0) {
        scope.find("h3, h4, h5, strong").each((_, sh) => {
          const $sh = $(sh);
          const q = t($sh);
          if (q.includes("?") && q.length > 10) {
            const nextP = $sh.next();
            const a = nextP.length ? t(nextP).slice(0, 500) : "";
            if (a.length > 10) result.faq.push({ question: q, answer: a });
          }
        });
      }
    }
  }
  result.faq = result.faq.slice(0, 15);

  // ---- Owner / Founder Name ----
  result.owner_name = null;
  const ownerPatterns = /owner|founder|president|ceo|principal|proprietor/i;
  if (aboutHeading) {
    const parent = aboutHeading.closest("section");
    const scope = parent.length ? parent : aboutHeading.parent();
    const aboutFullText = scope.text() || "";
    const om = aboutFullText.match(/(?:owner|founder|president|ceo|principal)[:\s,]*([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (om) result.owner_name = om[1];
  }
  if (!result.owner_name) {
    $('script[type="application/ld+json"]').each((_, s) => {
      if (result.owner_name) return;
      try {
        const data = JSON.parse($(s).html() || "");
        const blocks = Array.isArray(data) ? data : [data];
        for (const block of blocks) {
          if (block?.["@type"] === "LocalBusiness" && block.founder) {
            result.owner_name = typeof block.founder === "string" ? block.founder : block.founder.name;
          }
          if (block?.["@type"] === "Person" && block.jobTitle && ownerPatterns.test(block.jobTitle)) {
            result.owner_name = block.name;
          }
        }
      } catch {}
    });
  }
  if (!result.owner_name) {
    const footer = $("footer").first();
    if (footer.length) {
      const ftext = footer.text() || "";
      const fm = ftext.match(/(?:owner|founder|president)[:\s,]*([A-Z][a-z]+ [A-Z][a-z]+)/);
      if (fm) result.owner_name = fm[1];
    }
  }

  // ---- Franchise Detection ----
  const franchiseNames = [
    "mighty dog","storm guard","centimark","leaf home","bone dry",
    "erie metal","long roofing","baker roofing","tecta america",
    "nations roof","roofing corp of america","roof connect",
  ];
  const titleLower = (pageTitle || "").toLowerCase();
  const businessNameLower = (result.hero_headline || titleLower).toLowerCase();
  result.is_franchise = franchiseNames.some(f => businessNameLower.includes(f));
  if (!result.is_franchise) {
    const lt = bodyText.toLowerCase();
    result.is_franchise = lt.includes("franchise") && (lt.includes("locations nationwide") || lt.includes("corporate office"));
  }

  // ---- Multi-State Detection ----
  result.is_multi_state = false;
  const stateAbbrs = bodyText.match(/\b[A-Z]{2}\b/g) || [];
  const usStates = new Set(["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]);
  const statesFound = new Set(stateAbbrs.filter(s => usStates.has(s)));
  if (statesFound.size >= 5) result.is_multi_state = true;

  return result;
}

// --------------- Form detection (HTML-only, post-Playwright) ---------------

/**
 * Best-effort form detection from rendered HTML. The deep field-mapping +
 * honeypot + visibility analysis the old Playwright version did is no longer
 * possible without a live browser — this is a degraded shape that still
 * answers "is there a contact form here?" for the outreach skills.
 */
function detectFormFromHtml(scrape) {
  const html = scrape?.html || "";
  const $ = cheerioLoad(html);
  const result = {
    found: false,
    form_url: scrape?.url || "",
    form_type: "unknown",
    has_captcha: false,
    field_mapping: null,
    honeypot_fields: [],
    required_selects: [],
    required_radios: [],
  };

  if (
    /grecaptcha|data-sitekey|g-recaptcha|cf-turnstile|hcaptcha|data-netlify-recaptcha/.test(html) ||
    (/cloudflare/i.test(html) && /challenge/i.test(html))
  ) {
    result.has_captcha = true;
  }

  const forms = $("form");
  if (forms.length === 0) {
    if ($('iframe[src*="jotform"]').length) {
      result.has_captcha = true;
      result.form_type = "jotform_iframe";
    }
    return result;
  }

  let bestForm = null;
  forms.each((_, f) => {
    if (bestForm && bestForm.find("textarea").length) return;
    const $f = $(f);
    const action = ($f.attr("action") || "").toLowerCase();
    const id = ($f.attr("id") || "").toLowerCase();
    const className = ($f.attr("class") || "").toLowerCase();
    if (/search/.test(action + id + className)) return;
    if (/subscribe|newsletter/.test(id + className)) return;
    if (/login|signin/.test(id + action)) return;
    const inputs = $f.find("input, textarea, select");
    const hasTextarea = $f.find("textarea").length > 0;
    if (inputs.length < 2 && !hasTextarea) return;
    if (!bestForm || hasTextarea) bestForm = $f;
  });

  if (!bestForm) return result;
  result.found = true;

  const formHtml = ($.html(bestForm) || "").toLowerCase();
  const formClass = (bestForm.attr("class") || "").toLowerCase();
  if (/wpcf7/.test(formClass + formHtml)) result.form_type = "cf7";
  else if (/gform/.test(formClass + formHtml)) result.form_type = "gravity";
  else if (/wpforms/.test(formClass + formHtml)) result.form_type = "wpforms";
  else if (/data-form-id/.test(formHtml)) result.form_type = "squarespace";
  else if (/gdw-form/.test(formClass + formHtml)) result.form_type = "godaddy";
  else if (/elementor/.test(formHtml)) result.form_type = "elementor";
  else result.form_type = "custom";

  // Field mapping (degraded — no visibility checks, no honeypot detection)
  const mapping = {
    name_field: null,
    email_field: null,
    phone_field: null,
    message_field: null,
    subject_field: null,
    submit_button: null,
  };
  const sel = (el) => {
    const $el = $(el);
    const id = $el.attr("id");
    if (id) return `#${id}`;
    const name = $el.attr("name");
    if (name) return `[name="${name}"]`;
    return null;
  };
  bestForm.find("input, textarea").each((_, el) => {
    const $el = $(el);
    const name = ($el.attr("name") || "").toLowerCase();
    const placeholder = ($el.attr("placeholder") || "").toLowerCase();
    const type = ($el.attr("type") || "").toLowerCase();
    if (type === "hidden") return;
    const all = `${name} ${placeholder} ${type}`;
    const s = sel(el);
    if (!s) return;
    if ((type === "email" || /email/.test(all)) && !mapping.email_field) mapping.email_field = s;
    else if ((type === "tel" || /phone|\btel\b/.test(all)) && !mapping.phone_field) mapping.phone_field = s;
    else if ((el.name === "textarea" || /message|comment|details/.test(all)) && !mapping.message_field) mapping.message_field = s;
    else if (/name/.test(all) && !/company|business/.test(all) && !mapping.name_field) mapping.name_field = s;
    else if (/subject/.test(all) && !mapping.subject_field) mapping.subject_field = s;
  });
  const submit = bestForm.find('button[type="submit"], input[type="submit"]').first();
  if (submit.length) mapping.submit_button = sel(submit) || null;
  if (!mapping.message_field && !mapping.email_field) {
    result.found = false;
    return result;
  }
  result.field_mapping = mapping;
  return result;
}

/**
 * Best-effort: find a contact page URL in the homepage links.
 */
function findContactPageUrl(scrape) {
  const html = scrape?.html || "";
  const baseUrl = scrape?.url || "";
  const $ = cheerioLoad(html);
  const patterns = /\/(contact|contact-us|get-in-touch|reach-us|get-a-quote|free-estimate|request)/i;
  const textPatterns = /^(contact|contact us|get in touch|reach us|get a quote|free estimate|request)/i;
  let found = null;
  $("a").each((_, a) => {
    if (found) return;
    const href = $(a).attr("href") || "";
    const txt = ($(a).text() || "").trim();
    if (patterns.test(href) || textPatterns.test(txt)) {
      try { found = new URL(href, baseUrl).toString(); } catch { /* skip */ }
    }
  });
  return found;
}

/**
 * Scrape a single prospect URL via Firecrawl + extract structured data.
 * Returns same shape the old Playwright `scrapeSite` returned.
 */
export async function scrapeSite(url, opts = {}) {
  const { verbose = false } = opts;
  let fullUrl = url;
  if (!fullUrl?.startsWith("http")) fullUrl = `https://${fullUrl}`;
  if (verbose) console.log(`  Fetching: ${fullUrl}`);

  const home = await firecrawlScrape(fullUrl, { timeoutMs: FIRECRAWL_TIMEOUT_MS });
  if (!home.ok) return { success: false, url: fullUrl, error: home.reason };

  const data = extractSiteData(home);
  if (!data.hero_headline && home.title && home.title.length > 3) {
    data.hero_headline = home.title.split("|")[0].split("-")[0].trim();
  }

  // Form detection — try contact page first, fall back to home.
  let formScrape = home;
  const contactUrl = findContactPageUrl(home);
  if (contactUrl && contactUrl !== home.url) {
    if (verbose) console.log(`    → Contact page: ${contactUrl}`);
    const contact = await firecrawlScrape(contactUrl, { timeoutMs: FIRECRAWL_TIMEOUT_MS });
    if (contact.ok) formScrape = contact;
  }
  const formData = detectFormFromHtml(formScrape);
  if (verbose) {
    if (formData.found) {
      const fc = Object.values(formData.field_mapping || {}).filter(Boolean).length;
      console.log(`    📋 Form (${formData.form_type}): ${fc} fields mapped${formData.has_captcha ? " ⚠️ CAPTCHA" : ""}`);
    } else {
      console.log(`    📋 No contact form found`);
    }
  }

  return { success: true, url: fullUrl, ...data, form: formData };
}

// --------------- Main (CLI) ---------------

async function main() {
  const opts = parseArgs();
  if (!opts.url && !opts.csv) {
    console.error("Usage:");
    console.error('  node tools/scrape-prospect-site.mjs --url "https://example-roofing.com"');
    console.error("  node tools/scrape-prospect-site.mjs --csv .tmp/prospects/batch.csv");
    process.exit(1);
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error("FIRECRAWL_API_KEY not set in environment");
    process.exit(1);
  }

  if (opts.url) {
    const result = await scrapeSite(opts.url, { verbose: true });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!existsSync(opts.csv)) {
    console.error(`CSV file not found: ${opts.csv}`);
    process.exit(1);
  }
  const rows = readCsv(opts.csv);
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
    const data = await scrapeSite(url, { verbose: opts.verbose });
    if (data.success) {
      scraped++;
      const form = data.form || {};
      console.log(`  ✓ ${(data.services||[]).length} services, ${(data.faq||[]).length} FAQ, ${(data.reviews||[]).length} reviews, phone: ${data.phone || "none"}, form: ${form.found ? form.form_type : "none"}`);
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
        contact_form_url: form.found ? form.form_url : "",
        form_field_mapping: form.found ? JSON.stringify(form.field_mapping) : "",
        has_captcha: form.has_captcha ? "true" : "false",
        form_type: form.form_type || "",
        form_honeypot_fields: "",
        form_required_selects: "",
        form_required_radios: "",
        has_estimate_widget: data.has_estimate_widget ? "true" : "false",
        estimate_widget_providers: (data.estimate_widget_providers || []).join("; "),
        years_in_business: data.years_in_business || "",
        founded_year: data.founded_year || "",
        competitor_tools: (data.competitor_tools || []).join("; "),
        scraped_faq: JSON.stringify(data.faq || []),
        scraped_owner_name: data.owner_name || "",
        is_franchise: data.is_franchise ? "true" : "false",
        is_multi_state: data.is_multi_state ? "true" : "false",
      });
    } else {
      failed++;
      console.log(`  ✗ Failed: ${data.error}`);
      results.push({ ...row, scrape_status: "failed", scrape_error: data.error });
    }
    if (i < rows.length - 1) await new Promise(r => setTimeout(r, DELAY_BETWEEN));
  }

  const inputCols = Object.keys(rows[0] || {});
  const enrichedCols = [
    ...inputCols,
    "scraped_tagline","scraped_hero_headline","scraped_about_text",
    "scraped_services","scraped_reviews","scraped_phone","scraped_service_areas",
    "scrape_status","contact_form_url","form_field_mapping","has_captcha",
    "form_type","form_honeypot_fields","form_required_selects","form_required_radios",
    "has_estimate_widget","estimate_widget_providers",
    "years_in_business","founded_year",
    "competitor_tools","scraped_faq","scraped_owner_name",
    "is_franchise","is_multi_state",
  ].filter((c, i, arr) => arr.indexOf(c) === i);
  const outputPath = opts.output || opts.csv.replace(".csv", "_scraped.csv");
  writeCsv(outputPath, results, enrichedCols);
  console.log(`\n✅ Done: ${scraped} scraped, ${failed} failed, ${rows.length - scraped - failed} skipped`);
  console.log(`📄 Output: ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
