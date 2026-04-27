// Shared mapping: scraped roofer-website data -> chatbot_config patch + per-field provenance.
//
// One contract used by BOTH:
//   1. .claude/skills/demo-page-build (prospect demo pages)
//   2. app/api/onboarding/crawl (post-signup Riley pre-fill)
//
// Why shared: prevents drift between what Riley says on a demo page and what Riley
// says after the roofer signs up. Same source data must produce the same fields.
//
// What this file does NOT do:
//   - Network/scraping (lives in tools/scrape-prospect-site.mjs + tools/crawl-roofer-site.mjs)
//   - FAQ generation (lives in lib/riley-faq-generator.ts)
//   - Writing to Supabase (caller does that)
//   - Mapping fields that belong on `sites` or `contractors` tables — see SitesPatch / ContractorsPatch
//     types below. Caller routes those columns to the right table.

export type FieldConfidence = "high" | "med" | "low";

// Mirrors the shape returned by tools/scrape-prospect-site.mjs:extractSiteData
// plus enrichments added by tools/crawl-roofer-site.mjs (FAQs, financing brand, hours, etc.).
export type ScraperOutput = {
  url?: string | null;
  // Pages actually fetched, used by callers for analytics + crawl_state.scrape_pages_crawled.
  pages_crawled?: string[];

  // Raw text fields
  tagline?: string | null;
  hero_headline?: string | null;
  about_text?: string | null;
  phone?: string | null;

  // Lists
  services?: string[];
  reviews?: Array<{ author?: string; text?: string; rating?: number }>;
  service_areas?: string[]; // city names from footer / "areas we serve"

  // About-page extracts
  owner_name?: string | null;
  founded_year?: number | null;
  team_description?: string | null; // from About first 1-2 paragraphs

  // FAQ entries scraped from a real FAQ page on the roofer's site (roofer-authored).
  // These are pre-checked in the review UI per locked decision #2.
  faq?: Array<{ q: string; a: string; source_url?: string }>;

  // Optional enrichments — populated by crawl-roofer-site.mjs when present.
  differentiators_bullets?: string[]; // from "Why Choose Us" sections
  warranty_excerpt?: string | null; // exact-quote span
  financing_brand?: string | null; // matched brand name
  payment_methods?: string[]; // from footer card logos / "We accept"
  emergency_excerpt?: string | null;
  business_hours?: string | null; // schema.org openingHours or footer hours block
  competitor_tools?: string[];
  contact_form_url?: string | null;

  // Source-URL map: which page each field came from (best-effort).
  source_urls?: Partial<Record<MappedFieldName, string>>;
};

// Field names this mapper writes to chatbot_config. NOT a complete list of chatbot_config
// columns — only the ones we attempt to auto-fill from a website crawl.
export type MappedFieldName =
  | "owner_name" // NOTE: lives on contractors, not chatbot_config — see ContractorsPatch
  | "team_description"
  | "differentiators"
  | "warranty_description"
  | "financing_provider"
  | "payment_methods"
  | "emergency_available"
  | "emergency_description"
  | "business_hours"
  | "service_area_cities"
  | "custom_faqs"
  | "services" // NOTE: lives on sites, not chatbot_config — see SitesPatch
  | "materials_brands"
  | "offers_free_inspection"
  | "does_insurance_work"
  | "insurance_description"
  | "process_steps";

// Patch for chatbot_config columns. All optional — caller merges into UPSERT.
export type ChatbotConfigPatch = {
  team_description?: string | null;
  differentiators?: string | null;
  warranty_description?: string | null;
  financing_provider?: string | null;
  payment_methods?: string[];
  emergency_available?: boolean;
  emergency_description?: string | null;
  business_hours?: string | null;
  service_area_cities?: string[];
  custom_faqs?: Array<{
    q: string;
    a: string;
    source?: "scraped" | "generated";
    source_url?: string;
    pre_checked?: boolean;
  }>;
  materials_brands?: string[];
  offers_free_inspection?: boolean;
  does_insurance_work?: boolean;
  insurance_description?: string | null;
  process_steps?: string | null;
  source_website_url?: string | null;
};

// Patch for `sites` row (1:1 with contractor). Caller routes these.
export type SitesPatch = {
  services?: Array<{ title: string; description?: string }>;
  hero_headline?: string | null;
  about_text?: string | null;
  reviews?: Array<{ author?: string; text?: string; rating?: number }>;
};

// Patch for `contractors` row.
export type ContractorsPatch = {
  owner_name?: string | null;
  service_area_cities?: string[]; // source-of-truth copy
  phone?: string | null;
};

export type CrawlStateField = {
  field: MappedFieldName;
  source_url: string | null;
  confidence: FieldConfidence;
  auto_filled: boolean;
  manually_edited: boolean;
  raw_excerpt: string | null;
};

export type MapResult = {
  // Goes to chatbot_config.*
  chatbotConfig: ChatbotConfigPatch;
  // Goes to sites.*
  sites: SitesPatch;
  // Goes to contractors.*
  contractors: ContractorsPatch;
  // Goes to chatbot_config.crawl_state.fields[*]
  crawlState: CrawlStateField[];
};

// ---- Constants ----------------------------------------------------------

const FINANCING_BRANDS = ["Hearth", "GreenSky", "Synchrony", "Service Finance", "Acorn", "Wisetack", "Sunbit"] as const;
const PAYMENT_METHOD_TOKENS: Array<{ token: RegExp; label: string }> = [
  { token: /\bvisa\b/i, label: "Visa" },
  { token: /\bmastercard\b/i, label: "Mastercard" },
  { token: /\bamex|american express\b/i, label: "American Express" },
  { token: /\bdiscover\b/i, label: "Discover" },
  { token: /\bcheck\b/i, label: "Check" },
  { token: /\bcash\b/i, label: "Cash" },
  { token: /\bach|bank transfer\b/i, label: "ACH" },
  { token: /\bfinancing\b/i, label: "Financing" },
];
const MATERIAL_BRANDS = [
  "GAF", "Owens Corning", "CertainTeed", "TAMKO", "Atlas", "Malarkey",
  "IKO", "DECRA", "Boral", "Eagle", "DaVinci", "F-Wave",
] as const;
const FREE_INSPECTION_RX = /\bfree (inspection|estimate|quote|consultation)\b/i;
const INSURANCE_RX = /\binsurance (claim|company|carrier|adjust)/i;
const EMERGENCY_RX = /\b(24[\s\/-]?7|emergency (?:roof|service|repair|tarp)|storm response)\b/i;
const WARRANTY_RX = /(\d{1,3})[\s-]*(?:year|yr)\s+(?:labor|workmanship|materials|manufacturer)?\s*warranty|\bwarranty[^.]{0,200}/i;

// ---- Main entry point ---------------------------------------------------

export function mapScrapeToConfig(scrape: ScraperOutput): MapResult {
  const chatbotConfig: ChatbotConfigPatch = {};
  const sites: SitesPatch = {};
  const contractors: ContractorsPatch = {};
  const crawlState: CrawlStateField[] = [];
  const url = (k: MappedFieldName) => scrape.source_urls?.[k] ?? scrape.url ?? null;

  // Helper to log per-field provenance.
  const log = (
    field: MappedFieldName,
    confidence: FieldConfidence,
    autoFilled: boolean,
    rawExcerpt: string | null,
  ) => {
    crawlState.push({
      field,
      source_url: url(field),
      confidence,
      auto_filled: autoFilled,
      manually_edited: false,
      raw_excerpt: rawExcerpt ? rawExcerpt.slice(0, 400) : null,
    });
  };

  // services -> sites.services (NOT chatbot_config). Auto-fill if >=3.
  if (scrape.services && scrape.services.length >= 3) {
    sites.services = scrape.services.map((s) => ({ title: s }));
    log("services", "high", true, scrape.services.slice(0, 3).join(" | "));
  }

  // hero_headline / about_text / reviews -> sites.* (NOT chatbot_config). Pass-through, no flagging.
  if (scrape.hero_headline) sites.hero_headline = scrape.hero_headline;
  if (scrape.about_text) sites.about_text = scrape.about_text;
  if (scrape.reviews?.length) sites.reviews = scrape.reviews;

  // service_area_cities -> BOTH contractors (source of truth) AND chatbot_config (denormalized for prompt).
  if (scrape.service_areas && scrape.service_areas.length >= 2) {
    const cities = uniq(scrape.service_areas).slice(0, 30);
    chatbotConfig.service_area_cities = cities;
    contractors.service_area_cities = cities;
    log("service_area_cities", "high", true, cities.slice(0, 5).join(", "));
  }

  // owner_name -> contractors.owner_name. Always SUGGEST, never auto-fill (decision #3).
  // Wrong owner_name in Riley's mouth = credibility fire.
  if (scrape.owner_name) {
    contractors.owner_name = null; // never auto-write
    log("owner_name", "med", false, scrape.owner_name);
  }

  // team_description -> chatbot_config.team_description. Auto if 80-500 chars + team mention.
  if (scrape.team_description) {
    const t = scrape.team_description.trim();
    const teamMention = /\b(team|crew|staff|family|owner|founder|since \d{4}|years)\b/i.test(t);
    if (t.length >= 80 && t.length <= 500 && teamMention) {
      chatbotConfig.team_description = t;
      log("team_description", "med", true, t);
    } else if (t.length > 0) {
      log("team_description", "low", false, t);
    }
  }

  // differentiators -> chatbot_config.differentiators. Auto if >=2 distinct bullets.
  if (scrape.differentiators_bullets && scrape.differentiators_bullets.length >= 2) {
    const joined = uniq(scrape.differentiators_bullets).join(", ");
    chatbotConfig.differentiators = joined;
    log("differentiators", "med", true, joined);
  }

  // warranty_description -> chatbot_config.warranty_description. Auto if scraper found a quoted span.
  if (scrape.warranty_excerpt && WARRANTY_RX.test(scrape.warranty_excerpt)) {
    chatbotConfig.warranty_description = scrape.warranty_excerpt.trim();
    log("warranty_description", "high", true, scrape.warranty_excerpt);
  }

  // financing_provider -> chatbot_config.financing_provider. Auto if brand match.
  if (scrape.financing_brand) {
    const matched = FINANCING_BRANDS.find(
      (b) => b.toLowerCase() === scrape.financing_brand!.toLowerCase(),
    );
    if (matched) {
      chatbotConfig.financing_provider = matched;
      log("financing_provider", "high", true, matched);
    }
  } else if (scrape.about_text) {
    // Fallback: detect brand mention anywhere in about/services text.
    const hit = FINANCING_BRANDS.find((b) => new RegExp(`\\b${b}\\b`, "i").test(scrape.about_text!));
    if (hit) {
      chatbotConfig.financing_provider = hit;
      log("financing_provider", "med", true, hit);
    }
  }

  // payment_methods -> chatbot_config.payment_methods.
  if (scrape.payment_methods && scrape.payment_methods.length >= 1) {
    chatbotConfig.payment_methods = uniq(scrape.payment_methods);
    log("payment_methods", "med", true, scrape.payment_methods.join(", "));
  } else {
    // Fallback: regex over about + tagline + hero
    const corpus = [scrape.about_text, scrape.tagline, scrape.hero_headline].filter(Boolean).join(" ");
    const detected = PAYMENT_METHOD_TOKENS.filter(({ token }) => token.test(corpus)).map((t) => t.label);
    if (detected.length >= 1) {
      chatbotConfig.payment_methods = uniq(detected);
      log("payment_methods", "low", false, detected.join(", "));
    }
  }

  // emergency_available + emergency_description.
  // Auto-true if explicit excerpt present OR pattern matches in 2+ places.
  if (scrape.emergency_excerpt) {
    chatbotConfig.emergency_available = true;
    chatbotConfig.emergency_description = scrape.emergency_excerpt.trim();
    log("emergency_available", "med", true, scrape.emergency_excerpt);
    log("emergency_description", "med", true, scrape.emergency_excerpt);
  } else {
    const corpus = [scrape.about_text, scrape.tagline, scrape.hero_headline].filter(Boolean).join(" ");
    const matches = corpus.match(new RegExp(EMERGENCY_RX.source, "gi")) ?? [];
    if (matches.length >= 2) {
      chatbotConfig.emergency_available = true;
      log("emergency_available", "med", true, matches.slice(0, 2).join(" | "));
    }
  }

  // business_hours -> chatbot_config.business_hours. Auto if scraper parsed schema.org openingHours.
  if (scrape.business_hours) {
    chatbotConfig.business_hours = scrape.business_hours;
    log("business_hours", "high", true, scrape.business_hours);
  }

  // materials_brands -> chatbot_config.materials_brands. Detect brand mentions in services + about.
  {
    const corpus = [scrape.about_text, ...(scrape.services ?? [])].filter(Boolean).join(" ");
    const hits = MATERIAL_BRANDS.filter((b) => new RegExp(`\\b${b}\\b`, "i").test(corpus));
    if (hits.length >= 1) {
      chatbotConfig.materials_brands = hits;
      log("materials_brands", "med", true, hits.join(", "));
    }
  }

  // offers_free_inspection -> chatbot_config. Boolean from regex.
  {
    const corpus = [scrape.about_text, scrape.tagline, scrape.hero_headline, ...(scrape.services ?? [])]
      .filter(Boolean)
      .join(" ");
    if (FREE_INSPECTION_RX.test(corpus)) {
      chatbotConfig.offers_free_inspection = true;
      const m = corpus.match(FREE_INSPECTION_RX);
      log("offers_free_inspection", "high", true, m ? m[0] : null);
    }
  }

  // does_insurance_work + insurance_description.
  {
    const corpus = [scrape.about_text, scrape.tagline, ...(scrape.faq?.map((f) => `${f.q} ${f.a}`) ?? [])]
      .filter(Boolean)
      .join(" ");
    if (INSURANCE_RX.test(corpus)) {
      chatbotConfig.does_insurance_work = true;
      const m = corpus.match(INSURANCE_RX);
      log("does_insurance_work", "med", true, m ? m[0] : null);
    }
  }

  // custom_faqs (scraped FAQ page only — Haiku-generated FAQs are merged in by the API route).
  // Per decision #2: scraped FAQs all pre-checked. Cap at 20 here to leave room for generated.
  if (scrape.faq && scrape.faq.length) {
    const scraped = scrape.faq.slice(0, 20).map((f) => ({
      q: f.q,
      a: f.a,
      source: "scraped" as const,
      source_url: f.source_url ?? url("custom_faqs") ?? undefined,
      pre_checked: true,
    }));
    chatbotConfig.custom_faqs = scraped;
    log("custom_faqs", "high", true, `${scraped.length} scraped FAQ entries`);
  }

  // source_website_url — always recorded for the on-demand re-crawl (decision #4).
  if (scrape.url) chatbotConfig.source_website_url = scrape.url;

  return { chatbotConfig, sites, contractors, crawlState };
}

// ---- Helpers ------------------------------------------------------------

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

// Convenience: build the crawl_state jsonb blob to write into chatbot_config.crawl_state.
// Caller persists this directly to the column.
export function buildCrawlStateJson(
  fields: CrawlStateField[],
  pagesCrawled: number,
): {
  fields: Record<string, Omit<CrawlStateField, "field">>;
  scrape_completed_at: string;
  scrape_pages_crawled: number;
} {
  const map: Record<string, Omit<CrawlStateField, "field">> = {};
  for (const f of fields) {
    const { field, ...rest } = f;
    map[field] = rest;
  }
  return {
    fields: map,
    scrape_completed_at: new Date().toISOString(),
    scrape_pages_crawled: pagesCrawled,
  };
}

// Convenience: merge a Haiku-generated FAQ list into an existing scraped-FAQ list.
// Per decision #2: cap total at 20; first 5 generated are pre-checked, rest surfaced unchecked.
export function mergeGeneratedFaqs(
  scraped: ChatbotConfigPatch["custom_faqs"] = [],
  generated: Array<{ q: string; a: string; source_excerpt?: string }>,
  opts: { totalCap?: number; preCheckCount?: number } = {},
): NonNullable<ChatbotConfigPatch["custom_faqs"]> {
  const totalCap = opts.totalCap ?? 20;
  const preCheckCount = opts.preCheckCount ?? 5;
  const generatedSlots = Math.max(0, totalCap - scraped.length);
  const genSlice = generated.slice(0, Math.min(10, generatedSlots));
  const formatted = genSlice.map((f, i) => ({
    q: f.q,
    a: f.a,
    source: "generated" as const,
    pre_checked: i < preCheckCount,
  }));
  return [...scraped, ...formatted].slice(0, totalCap);
}
