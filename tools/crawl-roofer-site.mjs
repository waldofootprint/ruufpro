// Riley URL-crawl wrapper.
// Wraps tools/scrape-prospect-site.mjs:extractSiteData with multi-page crawling
// (home + About + Services + FAQ), enrichment extractors (warranty / financing /
// payment / emergency / hours / differentiators / business hours), and a 45s
// hard budget. Returns a `ScraperOutput` matching lib/scrape-to-chatbot-config.ts.
//
// Usage:
//   import { crawlRooferSite } from "./crawl-roofer-site.mjs";
//   const scrape = await crawlRooferSite("https://example-roofing.com", { verbose: true });

import { chromium } from "playwright";
import { extractSiteData } from "./scrape-prospect-site.mjs";

const PAGE_TIMEOUT = 15000;
const HARD_BUDGET_MS = 45000;
const MAX_SUBPAGES = 3; // about + services + faq

const BLOCKED_HOSTS = new Set([
  "facebook.com", "www.facebook.com", "m.facebook.com",
  "instagram.com", "www.instagram.com",
  "yelp.com", "www.yelp.com",
  "business.google.com", "g.page",
  "linkedin.com", "www.linkedin.com",
]);

const FINANCING_BRANDS = ["Hearth", "GreenSky", "Synchrony", "Service Finance", "Acorn", "Wisetack", "Sunbit"];
const WARRANTY_RX = /(?:\d{1,3}[\s-]*(?:year|yr)\s+(?:labor|workmanship|materials|manufacturer)?\s*warranty[^.]{0,300}|\bwarranty[^.]{0,300})/i;
const EMERGENCY_RX = /\b(?:24[\s\/-]?7|emergency (?:roof|service|repair|tarp)|storm response)[^.]{0,200}/i;
const HOURS_RX = /(mon|tue|wed|thu|fri|sat|sun)[a-z]*[\s.,–-]+(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?[\s.,–-]+){1,4}/gi;

const SUBPAGE_KEYS = {
  about: /\b(about|our story|who we are|team|meet)\b/i,
  services: /\b(services|what we do|specialties|offerings)\b/i,
  faq: /\b(faq|frequently asked|q\s*&\s*a)\b/i,
};

export function isBlockedHost(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return BLOCKED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Pre-flight robots.txt — return false if Disallow: / matches our user-agent.
// Treat fetch failure as "allow" (most roofer sites have no robots.txt and we don't
// want to abort on transient network).
export async function checkRobots(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { allowed: true };
    const txt = (await res.text()).toLowerCase();
    // Cheap parse: look for any block that says "user-agent: *" with "disallow: /"
    const blocks = txt.split(/\n\s*\n/);
    for (const block of blocks) {
      if (!/user-agent:\s*\*/.test(block)) continue;
      const disallows = block.match(/disallow:\s*([^\n]*)/g) || [];
      for (const d of disallows) {
        const rule = d.replace(/disallow:\s*/i, "").trim();
        if (rule === "/") return { allowed: false, reason: "robots.txt disallows all crawlers" };
      }
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

// Discover About / Services / FAQ subpage URLs from the homepage nav.
async function discoverSubpages(page, baseUrl) {
  const links = await page.evaluate(() => {
    const out = [];
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") || "";
      const text = (a.textContent || "").trim();
      if (!href || !text || text.length > 60) continue;
      out.push({ href, text });
    }
    return out;
  });
  const baseHost = new URL(baseUrl).host;
  const found = {};
  for (const { href, text } of links) {
    let abs;
    try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
    let parsedHost;
    try { parsedHost = new URL(abs).host; } catch { continue; }
    if (parsedHost !== baseHost) continue;
    if (abs === baseUrl || abs === baseUrl + "/") continue;
    for (const [key, rx] of Object.entries(SUBPAGE_KEYS)) {
      if (found[key]) continue;
      if (rx.test(text) || rx.test(href)) {
        found[key] = abs;
      }
    }
  }
  return found;
}

// Run extractSiteData against a URL inside the existing browser context.
async function extractFromUrl(browser, url, verbose) {
  const page = await browser.newPage();
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (["image", "media", "font", "stylesheet"].includes(t)) route.abort();
    else route.continue();
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT });
    await page.waitForTimeout(1500);
    const data = await extractSiteData(page);
    const fullHtml = await page.content();
    const bodyText = await page.evaluate(() => document.body?.innerText || "");
    return { url, data, html: fullHtml, text: bodyText };
  } catch (err) {
    if (verbose) console.error(`  ✗ ${url}: ${err.message}`);
    return null;
  } finally {
    await page.close();
  }
}

// Pull "differentiators" bullets from "Why Choose Us"-style sections.
function extractDifferentiators(html) {
  const out = [];
  const sectionRx = /<(h[1-4])[^>]*>[^<]*\b(?:why choose|why us|what sets us apart|our promise)\b[^<]*<\/\1>([\s\S]{0,2000}?)(?=<h[1-4]|$)/gi;
  let m;
  while ((m = sectionRx.exec(html)) && out.length < 8) {
    const block = m[2];
    const lis = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => stripTags(x[1]).trim());
    for (const li of lis) {
      if (li.length >= 3 && li.length <= 120) out.push(li);
    }
  }
  return [...new Set(out)].slice(0, 6);
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Detect a financing brand mention.
function detectFinancingBrand(corpus) {
  for (const b of FINANCING_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, "i").test(corpus)) return b;
  }
  return null;
}

// Pull a warranty quote span if present.
function extractWarrantyExcerpt(corpus) {
  const m = corpus.match(WARRANTY_RX);
  return m ? m[0].trim().slice(0, 400) : null;
}

// Pull an emergency-service excerpt if present.
function extractEmergencyExcerpt(corpus) {
  const m = corpus.match(EMERGENCY_RX);
  return m ? m[0].trim().slice(0, 300) : null;
}

// Detect schema.org openingHours; fall back to footer-style hour blocks.
function extractBusinessHours(html, text) {
  // Try schema.org first
  const schemaMatches = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const sm of schemaMatches) {
    try {
      const data = JSON.parse(sm[1]);
      const blocks = Array.isArray(data) ? data : [data];
      for (const block of blocks) {
        const hours = block?.openingHours || block?.openingHoursSpecification;
        if (typeof hours === "string") return hours.slice(0, 200);
        if (Array.isArray(hours) && hours.length) {
          if (typeof hours[0] === "string") return hours.join("; ").slice(0, 200);
          // openingHoursSpecification objects
          const formatted = hours.map((h) => {
            const day = Array.isArray(h?.dayOfWeek) ? h.dayOfWeek.join("/") : h?.dayOfWeek || "";
            return `${day} ${h?.opens || ""}-${h?.closes || ""}`.trim();
          }).filter(Boolean).join("; ");
          if (formatted) return formatted.slice(0, 200);
        }
      }
    } catch {}
  }
  // Fallback: regex on visible text
  const m = text.match(HOURS_RX);
  if (m && m.length) return m.slice(0, 7).join("; ").slice(0, 200);
  return null;
}

// Detect payment-method tokens from text.
function extractPaymentMethods(corpus) {
  const tokens = [
    [/\bvisa\b/i, "Visa"],
    [/\bmastercard\b/i, "Mastercard"],
    [/\bamex\b|\bamerican express\b/i, "American Express"],
    [/\bdiscover\b/i, "Discover"],
    [/\bcheck\b/i, "Check"],
    [/\bcash\b/i, "Cash"],
    [/\bach\b|\bbank transfer\b/i, "ACH"],
    [/\bfinancing\b/i, "Financing"],
  ];
  const found = [];
  for (const [rx, label] of tokens) {
    if (rx.test(corpus)) found.push(label);
  }
  return [...new Set(found)];
}

// Pull a 1-2 paragraph team description from About text.
function extractTeamDescription(aboutText) {
  if (!aboutText) return null;
  const trimmed = aboutText.trim();
  if (trimmed.length >= 80 && trimmed.length <= 1200) {
    // Prefer first 500 chars worth of complete sentences
    if (trimmed.length <= 500) return trimmed;
    const cut = trimmed.slice(0, 500);
    const lastDot = cut.lastIndexOf(". ");
    return lastDot > 200 ? cut.slice(0, lastDot + 1) : cut;
  }
  return null;
}

// Translate an extractSiteData FAQ entry (q.question/answer) to contract shape (q/a).
function normalizeFaq(rawFaq, sourceUrl) {
  if (!Array.isArray(rawFaq)) return [];
  return rawFaq
    .map((f) => ({
      q: (f.question || f.q || "").trim(),
      a: (f.answer || f.a || "").trim(),
      source_url: sourceUrl,
    }))
    .filter((f) => f.q.length >= 5 && f.a.length >= 5)
    .slice(0, 20);
}

// Translate review entries (.name → .author).
function normalizeReviews(rawReviews) {
  if (!Array.isArray(rawReviews)) return [];
  return rawReviews
    .map((r) => ({
      author: r.author || r.name || undefined,
      text: r.text,
      rating: r.rating,
    }))
    .filter((r) => r.text);
}

/**
 * Crawl a roofer's website and return data shaped for lib/scrape-to-chatbot-config.ts.
 * Hard 45s budget. Best-effort: returns whatever was salvaged on partial failure.
 *
 * @param {string} targetUrl
 * @param {{ verbose?: boolean, timeoutMs?: number }} [opts]
 * @returns {Promise<{ ok: true, scrape: object } | { ok: false, reason: string, scrape?: object }>}
 */
export async function crawlRooferSite(targetUrl, opts = {}) {
  const { verbose = false, timeoutMs = HARD_BUDGET_MS } = opts;
  const startTs = Date.now();
  const elapsed = () => Date.now() - startTs;
  const budgetExpired = () => elapsed() >= timeoutMs;

  // Normalize URL
  let url = targetUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  if (isBlockedHost(url)) {
    return { ok: false, reason: "blocked_host" };
  }

  const robots = await checkRobots(url);
  if (!robots.allowed) {
    return { ok: false, reason: "robots_disallow" };
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    return { ok: false, reason: `playwright_launch_failed: ${err.message}` };
  }

  try {
    // Step 1: homepage
    const homeRes = await extractFromUrl(browser, url, verbose);
    if (!homeRes) {
      return { ok: false, reason: "homepage_fetch_failed" };
    }
    const homeData = homeRes.data;
    const homeUrl = homeRes.url;
    const pagesCrawled = [homeUrl];
    const sourceUrls = {};

    // Map known fields to homepage URL by default.
    const tagFromHome = (k) => { sourceUrls[k] = homeUrl; };
    if (homeData.services?.length) tagFromHome("services");
    if (homeData.service_areas?.length) tagFromHome("service_area_cities");
    if (homeData.about_text) tagFromHome("team_description");
    if (homeData.owner_name) tagFromHome("owner_name");

    // Step 2: discover + crawl subpages
    const aggHtml = [homeRes.html];
    const aggText = [homeRes.text];
    let subpages = {};
    if (!budgetExpired()) {
      const homePage = await browser.newPage();
      await homePage.route("**/*", (route) => {
        const t = route.request().resourceType();
        if (["image", "media", "font", "stylesheet"].includes(t)) route.abort();
        else route.continue();
      });
      try {
        await homePage.goto(homeUrl, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT });
        subpages = await discoverSubpages(homePage, homeUrl);
      } catch {
        // ignore — subpage discovery is best-effort
      } finally {
        await homePage.close();
      }
    }

    let extraFaqs = [];
    let extraServices = [];
    let extraAbout = null;
    let crawledCount = 0;
    for (const [key, subUrl] of Object.entries(subpages)) {
      if (crawledCount >= MAX_SUBPAGES) break;
      if (budgetExpired()) break;
      const sub = await extractFromUrl(browser, subUrl, verbose);
      if (!sub) continue;
      crawledCount++;
      pagesCrawled.push(sub.url);
      aggHtml.push(sub.html);
      aggText.push(sub.text);

      if (key === "faq" && sub.data.faq?.length) {
        extraFaqs = sub.data.faq;
        sourceUrls.custom_faqs = sub.url;
      }
      if (key === "services" && sub.data.services?.length) {
        extraServices = sub.data.services;
        if (!sourceUrls.services) sourceUrls.services = sub.url;
      }
      if (key === "about") {
        if (sub.data.about_text && (!homeData.about_text || sub.data.about_text.length > homeData.about_text.length)) {
          extraAbout = sub.data.about_text;
          sourceUrls.team_description = sub.url;
        }
        if (sub.data.owner_name && !homeData.owner_name) {
          homeData.owner_name = sub.data.owner_name;
          sourceUrls.owner_name = sub.url;
        }
      }
    }

    // Step 3: enrichments off the aggregated corpus
    const corpus = aggText.join("\n\n");
    const fullHtml = aggHtml.join("\n");

    const differentiators = extractDifferentiators(fullHtml);
    if (differentiators.length) sourceUrls.differentiators = sourceUrls.differentiators ?? homeUrl;

    const warrantyExcerpt = extractWarrantyExcerpt(corpus);
    if (warrantyExcerpt) sourceUrls.warranty_description = homeUrl;

    const financingBrand = detectFinancingBrand(corpus);
    if (financingBrand) sourceUrls.financing_provider = homeUrl;

    const paymentMethods = extractPaymentMethods(corpus);
    if (paymentMethods.length) sourceUrls.payment_methods = homeUrl;

    const emergencyExcerpt = extractEmergencyExcerpt(corpus);
    if (emergencyExcerpt) {
      sourceUrls.emergency_available = homeUrl;
      sourceUrls.emergency_description = homeUrl;
    }

    const businessHours = extractBusinessHours(fullHtml, corpus);
    if (businessHours) sourceUrls.business_hours = homeUrl;

    const aboutText = extraAbout || homeData.about_text || null;
    const teamDescription = extractTeamDescription(aboutText);

    // Merge services from home + services subpage
    const allServices = [...new Set([...(homeData.services || []), ...extraServices])].slice(0, 12);

    const allFaqs = [
      ...normalizeFaq(homeData.faq, homeUrl),
      ...normalizeFaq(extraFaqs, sourceUrls.custom_faqs ?? homeUrl),
    ];
    // de-dupe by question
    const seenQ = new Set();
    const dedupedFaqs = [];
    for (const f of allFaqs) {
      const k = f.q.toLowerCase().slice(0, 80);
      if (seenQ.has(k)) continue;
      seenQ.add(k);
      dedupedFaqs.push(f);
    }

    // Step 4: shape into ScraperOutput
    const scrape = {
      url: homeUrl,
      pages_crawled: pagesCrawled,
      tagline: homeData.tagline ?? null,
      hero_headline: homeData.hero_headline ?? null,
      about_text: aboutText,
      phone: homeData.phone ?? null,
      services: allServices,
      reviews: normalizeReviews(homeData.reviews),
      service_areas: homeData.service_areas ?? [],
      owner_name: homeData.owner_name ?? null,
      founded_year: homeData.founded_year ?? null,
      team_description: teamDescription,
      faq: dedupedFaqs,
      differentiators_bullets: differentiators,
      warranty_excerpt: warrantyExcerpt,
      financing_brand: financingBrand,
      payment_methods: paymentMethods,
      emergency_excerpt: emergencyExcerpt,
      business_hours: businessHours,
      competitor_tools: homeData.competitor_tools ?? [],
      contact_form_url: null,
      source_urls: sourceUrls,
    };

    return { ok: true, scrape, partial: budgetExpired() };
  } catch (err) {
    if (verbose) console.error(`crawlRooferSite error: ${err.stack || err.message}`);
    return { ok: false, reason: `crawl_error: ${err.message}` };
  } finally {
    try { await browser.close(); } catch {}
  }
}

// CLI entry — node tools/crawl-roofer-site.mjs --url https://...
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const urlIdx = args.indexOf("--url");
  if (urlIdx === -1 || !args[urlIdx + 1]) {
    console.error("Usage: node tools/crawl-roofer-site.mjs --url <url> [--verbose]");
    process.exit(1);
  }
  const verbose = args.includes("--verbose");
  crawlRooferSite(args[urlIdx + 1], { verbose }).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 2);
  });
}
