// Riley URL-crawl wrapper.
// Refactored 2026-04-27 (session 4) — Firecrawl REST replaces Playwright so the
// crawler runs on Vercel serverless (no chromium binary required).
//
// Wraps tools/scrape-prospect-site.mjs:extractSiteData over multiple pages
// (home + About + Services + FAQ), runs enrichment extractors (warranty /
// financing / payment / emergency / hours / differentiators / business hours),
// and a 45s hard budget. Returns a `ScraperOutput` matching lib/scrape-to-chatbot-config.ts.
//
// Usage:
//   import { crawlRooferSite } from "./crawl-roofer-site.mjs";
//   const scrape = await crawlRooferSite("https://example-roofing.com", { verbose: true });

import { load as cheerioLoad } from "cheerio";
import { extractSiteData, firecrawlScrape } from "./scrape-prospect-site.mjs";

const HARD_BUDGET_MS = 45000;
const PER_PAGE_TIMEOUT_MS = 25000;
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
// Treat fetch failure as "allow" (most roofer sites have no robots.txt).
export async function checkRobots(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { allowed: true };
    const txt = (await res.text()).toLowerCase();
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

// Discover About / Services / FAQ subpage URLs from the homepage HTML.
function discoverSubpagesFromHtml(html, baseUrl) {
  const $ = cheerioLoad(html);
  let baseHost;
  try { baseHost = new URL(baseUrl).host; } catch { return {}; }
  const found = {};
  $("a[href]").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href") || "";
    const text = ($a.text() || "").trim();
    if (!href || !text || text.length > 60) return;
    let abs;
    try { abs = new URL(href, baseUrl).toString(); } catch { return; }
    let parsedHost;
    try { parsedHost = new URL(abs).host; } catch { return; }
    if (parsedHost !== baseHost) return;
    if (abs === baseUrl || abs === baseUrl + "/") return;
    for (const [key, rx] of Object.entries(SUBPAGE_KEYS)) {
      if (found[key]) continue;
      if (rx.test(text) || rx.test(href)) found[key] = abs;
    }
  });
  return found;
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

function detectFinancingBrand(corpus) {
  for (const b of FINANCING_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, "i").test(corpus)) return b;
  }
  return null;
}

function extractWarrantyExcerpt(corpus) {
  const m = corpus.match(WARRANTY_RX);
  return m ? m[0].trim().slice(0, 400) : null;
}

function extractEmergencyExcerpt(corpus) {
  const m = corpus.match(EMERGENCY_RX);
  return m ? m[0].trim().slice(0, 300) : null;
}

function extractBusinessHours(html, text) {
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
          const formatted = hours.map((h) => {
            const day = Array.isArray(h?.dayOfWeek) ? h.dayOfWeek.join("/") : h?.dayOfWeek || "";
            return `${day} ${h?.opens || ""}-${h?.closes || ""}`.trim();
          }).filter(Boolean).join("; ");
          if (formatted) return formatted.slice(0, 200);
        }
      }
    } catch {}
  }
  const m = text.match(HOURS_RX);
  if (m && m.length) return m.slice(0, 7).join("; ").slice(0, 200);
  return null;
}

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

function extractTeamDescription(aboutText) {
  if (!aboutText) return null;
  const trimmed = aboutText.trim();
  if (trimmed.length >= 80 && trimmed.length <= 1200) {
    if (trimmed.length <= 500) return trimmed;
    const cut = trimmed.slice(0, 500);
    const lastDot = cut.lastIndexOf(". ");
    return lastDot > 200 ? cut.slice(0, lastDot + 1) : cut;
  }
  return null;
}

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
 * @returns {Promise<{ ok: true, scrape: object, partial?: boolean } | { ok: false, reason: string }>}
 */
export async function crawlRooferSite(targetUrl, opts = {}) {
  const { verbose = false, timeoutMs = HARD_BUDGET_MS } = opts;
  const startTs = Date.now();
  const elapsed = () => Date.now() - startTs;
  const budgetExpired = () => elapsed() >= timeoutMs;
  const remainingBudget = () => Math.max(2000, Math.min(PER_PAGE_TIMEOUT_MS, timeoutMs - elapsed()));

  let url = targetUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  if (isBlockedHost(url)) return { ok: false, reason: "blocked_host" };

  const robots = await checkRobots(url);
  if (!robots.allowed) return { ok: false, reason: "robots_disallow" };

  if (!process.env.FIRECRAWL_API_KEY) {
    return { ok: false, reason: "missing_firecrawl_key" };
  }

  try {
    // Step 1: homepage via Firecrawl
    const home = await firecrawlScrape(url, { timeoutMs: remainingBudget() });
    if (!home.ok) {
      if (verbose) console.error(`  ✗ home ${url}: ${home.reason}`);
      return { ok: false, reason: "homepage_fetch_failed" };
    }
    const homeData = extractSiteData(home);
    const homeUrl = home.url || url;
    const pagesCrawled = [homeUrl];
    const sourceUrls = {};

    const tagFromHome = (k) => { sourceUrls[k] = homeUrl; };
    if (homeData.services?.length) tagFromHome("services");
    if (homeData.service_areas?.length) tagFromHome("service_area_cities");
    if (homeData.about_text) tagFromHome("team_description");
    if (homeData.owner_name) tagFromHome("owner_name");

    // Step 2: discover subpages from homepage HTML
    const aggHtml = [home.html];
    const aggText = [home.markdown || ""];
    const subpages = budgetExpired() ? {} : discoverSubpagesFromHtml(home.html, homeUrl);

    let extraFaqs = [];
    let extraServices = [];
    let extraAbout = null;
    let crawledCount = 0;
    for (const [key, subUrl] of Object.entries(subpages)) {
      if (crawledCount >= MAX_SUBPAGES) break;
      if (budgetExpired()) break;
      const sub = await firecrawlScrape(subUrl, { timeoutMs: remainingBudget() });
      if (!sub.ok) {
        if (verbose) console.error(`  ✗ ${subUrl}: ${sub.reason}`);
        continue;
      }
      crawledCount++;
      const subData = extractSiteData(sub);
      pagesCrawled.push(sub.url || subUrl);
      aggHtml.push(sub.html);
      aggText.push(sub.markdown || "");

      if (key === "faq" && subData.faq?.length) {
        extraFaqs = subData.faq;
        sourceUrls.custom_faqs = sub.url || subUrl;
      }
      if (key === "services" && subData.services?.length) {
        extraServices = subData.services;
        if (!sourceUrls.services) sourceUrls.services = sub.url || subUrl;
      }
      if (key === "about") {
        if (subData.about_text && (!homeData.about_text || subData.about_text.length > homeData.about_text.length)) {
          extraAbout = subData.about_text;
          sourceUrls.team_description = sub.url || subUrl;
        }
        if (subData.owner_name && !homeData.owner_name) {
          homeData.owner_name = subData.owner_name;
          sourceUrls.owner_name = sub.url || subUrl;
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

    const allServices = [...new Set([...(homeData.services || []), ...extraServices])].slice(0, 12);

    const allFaqs = [
      ...normalizeFaq(homeData.faq, homeUrl),
      ...normalizeFaq(extraFaqs, sourceUrls.custom_faqs ?? homeUrl),
    ];
    const seenQ = new Set();
    const dedupedFaqs = [];
    for (const f of allFaqs) {
      const k = f.q.toLowerCase().slice(0, 80);
      if (seenQ.has(k)) continue;
      seenQ.add(k);
      dedupedFaqs.push(f);
    }

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
