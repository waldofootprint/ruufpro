// Prospect Scoring — single source of truth for ICP scoring across all outreach.
// Targets roofers WITH websites (more data for Riley AI training).
// Auto-skips competitors, franchises, review automation, low quality, inactive businesses.
//
// Used by: /direct-mail skill, /prospect-scorer skill, ops dashboard, CLI tools, API routes.
// Also re-exported by lib/nfc-scoring.ts for backwards-compat (single ICP, NFC is a tactic).
//
// ICP locked 2026-04-25: rich website + 1-10 crew (proxy: not multi-state/franchise) +
// 4.0+ rating + 20-100 reviews + active in last 90 days + organic review pattern +
// no competitor chatbot/widget/review platform.
//
// Auto-SKIP: no website, has competitor widget/chatbot/review platform,
//            franchise, multi-state, review automation, <4.0★, <20 or >100 reviews,
//            no review activity in last 90 days.
//
// Tiers (by point total, max ~23):
//   Platinum: 16+   → first demo pages + NFC cards
//   Gold:     12-15 → next batch
//   Silver:   8-11  → only if capacity remains
//   Skip:     <8    → don't bother

export type ProspectTier = "platinum" | "gold" | "silver" | "skip";

export interface DemoScoreResult {
  tier: ProspectTier;
  score: number;
  reasons: string[];
  autoSkipReason: string | null;
  reviewAutomationSuspected: boolean;
}

export interface DemoProspectInput {
  google_place_id?: string | null;
  rating: number | null;
  reviews_count: number | null;
  their_website_url?: string | null;
  phone?: string | null;
  facebook_page_url?: string | null;
  business_name?: string | null;
  google_reviews?: Array<{
    time?: number;
    relative_time_description?: string;
    rating?: number;
    text?: string;
  }> | null;
  // Website scrape data (Phase 2 will populate these)
  website_faq?: any[] | null;
  website_services?: any[] | null;
  website_about?: string | null;
  owner_name?: string | null;
  website_service_areas?: string[] | null;
  website_testimonials?: any[] | null;
  competitor_tools?: string[] | null;
  // Franchise/multi-state detection
  is_franchise?: boolean;
  is_multi_state?: boolean;
}

// ── Competitor tool lists ─────────────────────────────────────────

const ESTIMATE_WIDGETS = ["roofle", "roofr", "iroofing", "roofquote", "instantroofer"];
const CHATBOT_WIDGETS = ["intercom", "drift", "tidio", "livechat", "crisp", "hubspot", "zendesk", "tawk"];
const REVIEW_PLATFORMS = ["podium", "birdeye", "nicejob", "gatherup", "grade.us"];
const GHL_MARKERS = ["highlevel", "gohighlevel", "leadconnector"];

const FRANCHISE_NAMES = [
  "mighty dog", "storm guard", "centimark", "leaf home", "bone dry",
  "erie metal", "long roofing", "baker roofing", "tecta america",
  "nations roof", "roofing corp of america", "roof connect",
];

export function hasCompetitorTool(tools: string[] | null | undefined): string | null {
  if (!tools || tools.length === 0) return null;
  const lower = tools.map((t) => t.toLowerCase());
  for (const t of lower) {
    if (ESTIMATE_WIDGETS.some((w) => t.includes(w))) return `estimate_widget:${t}`;
    if (CHATBOT_WIDGETS.some((w) => t.includes(w))) return `chatbot:${t}`;
    if (REVIEW_PLATFORMS.some((w) => t.includes(w))) return `review_platform:${t}`;
    if (GHL_MARKERS.some((w) => t.includes(w))) return `ghl:${t}`;
  }
  return null;
}

export function isFranchise(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return FRANCHISE_NAMES.some((f) => lower.includes(f));
}

// ── Review automation detection ───────────────────────────────────
// Reused from nfc-scoring.ts — looks at date gaps between reviews.
// If spacing is suspiciously regular AND frequency is high, the roofer
// likely uses Podium/Birdeye/NiceJob.

export function detectReviewAutomation(reviews: DemoProspectInput["google_reviews"]): {
  suspected: boolean;
  reason: string | null;
} {
  if (!reviews || reviews.length < 3) {
    return { suspected: false, reason: null };
  }

  const timestamps = reviews
    .filter((r) => r.time && r.time > 0)
    .map((r) => r.time!)
    .sort((a, b) => b - a);

  if (timestamps.length < 3) {
    return { suspected: false, reason: null };
  }

  const gaps: number[] = [];
  for (let i = 0; i < timestamps.length - 1; i++) {
    const gapDays = (timestamps[i] - timestamps[i + 1]) / (60 * 60 * 24);
    gaps.push(gapDays);
  }

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  const timeSpanDays = (timestamps[0] - timestamps[timestamps.length - 1]) / (60 * 60 * 24);
  const timeSpanMonths = Math.max(timeSpanDays / 30, 0.5);
  const reviewsPerMonth = timestamps.length / timeSpanMonths;

  const coeffOfVariation = avgGap > 0 ? stdDev / avgGap : 0;

  if (reviewsPerMonth >= 3 && coeffOfVariation < 0.5) {
    return {
      suspected: true,
      reason: `${reviewsPerMonth.toFixed(1)} reviews/mo, regular cadence (CV: ${coeffOfVariation.toFixed(2)})`,
    };
  }

  if (avgGap >= 5 && avgGap <= 16 && stdDev < 3 && reviewsPerMonth >= 2) {
    return {
      suspected: true,
      reason: `Reviews every ~${avgGap.toFixed(0)} days (±${stdDev.toFixed(0)}d) — looks automated`,
    };
  }

  return { suspected: false, reason: null };
}

// ── Main scoring function ─────────────────────────────────────────

export function scoreDemoProspect(p: DemoProspectInput): DemoScoreResult {
  const reviews = p.reviews_count ?? 0;
  const rating = p.rating ?? 0;
  const reasons: string[] = [];

  // ── Auto-skip checks ────────────────────────────────────────────

  if (!p.google_place_id) {
    return {
      tier: "skip", score: 0,
      reasons: ["No Google Place ID — can't link NFC card"],
      autoSkipReason: "no_place_id",
      reviewAutomationSuspected: false,
    };
  }

  // Must have a website (we need it for Riley training data)
  if (!p.their_website_url) {
    return {
      tier: "skip", score: 0,
      reasons: ["No website — need site data for Riley AI training"],
      autoSkipReason: "no_website",
      reviewAutomationSuspected: false,
    };
  }

  // Competitor tool detection
  const competitorTool = hasCompetitorTool(p.competitor_tools);
  if (competitorTool) {
    return {
      tier: "skip", score: 0,
      reasons: [`Has competitor tool: ${competitorTool}`],
      autoSkipReason: "has_competitor_tool",
      reviewAutomationSuspected: false,
    };
  }

  // Franchise detection
  if (p.is_franchise || isFranchise(p.business_name)) {
    return {
      tier: "skip", score: 0,
      reasons: ["Franchise brand — targeting small local crews only"],
      autoSkipReason: "franchise",
      reviewAutomationSuspected: false,
    };
  }

  // Multi-state
  if (p.is_multi_state) {
    return {
      tier: "skip", score: 0,
      reasons: ["Multi-state company — targeting local crews only"],
      autoSkipReason: "multi_state",
      reviewAutomationSuspected: false,
    };
  }

  // Rating threshold
  if (rating > 0 && rating < 4.0) {
    return {
      tier: "skip", score: 0,
      reasons: [`${rating}★ — below 4.0 threshold`],
      autoSkipReason: "low_rating",
      reviewAutomationSuspected: false,
    };
  }

  // Review count bounds (ICP: 20-100)
  if (reviews < 20) {
    return {
      tier: "skip", score: 0,
      reasons: [`${reviews} reviews — below 20, too new/small for $149/mo fit`],
      autoSkipReason: "too_few_reviews",
      reviewAutomationSuspected: false,
    };
  }

  if (reviews > 100) {
    return {
      tier: "skip", score: 0,
      reasons: [`${reviews} reviews — above 100, likely 10+ crew or has tech stack`],
      autoSkipReason: "too_many_reviews",
      reviewAutomationSuspected: false,
    };
  }

  // Review automation check
  const automation = detectReviewAutomation(p.google_reviews);
  if (automation.suspected) {
    return {
      tier: "skip", score: 0,
      reasons: [`Review automation suspected: ${automation.reason}`],
      autoSkipReason: "review_automation",
      reviewAutomationSuspected: true,
    };
  }

  // Active in last 90 days (latest review timestamp)
  if (p.google_reviews && p.google_reviews.length > 0) {
    const ninetyDaysAgo = Date.now() / 1000 - 90 * 24 * 60 * 60;
    const hasActivity = p.google_reviews.some((r) => r.time && r.time > ninetyDaysAgo);
    if (!hasActivity) {
      return {
        tier: "skip", score: 0,
        reasons: ["No review activity in last 90 days — business may be dormant"],
        autoSkipReason: "inactive_90d",
        reviewAutomationSuspected: false,
      };
    }
  }

  // Review platform in competitor_tools also triggers skip
  // (handled above in competitor tool check)

  // ── Point scoring (max ~23) ─────────────────────────────────────

  let score = 0;

  // Website data richness — highest value signals for Riley training
  if (p.website_faq && p.website_faq.length > 0) {
    score += 3;
    reasons.push(`+3 FAQ content (${p.website_faq.length} Q&As)`);
  }

  if (p.website_services && p.website_services.length > 0) {
    score += 3;
    reasons.push(`+3 Services detail (${p.website_services.length} services)`);
  }

  // Social/identity signals
  if (p.facebook_page_url) {
    score += 2;
    reasons.push("+2 Facebook business page");
  }

  if (p.owner_name) {
    score += 2;
    reasons.push(`+2 Owner name found: ${p.owner_name}`);
  }

  if (p.website_about) {
    score += 2;
    reasons.push("+2 About page / company story");
  }

  if (p.website_service_areas && p.website_service_areas.length > 0) {
    score += 1;
    reasons.push(`+1 Service areas listed (${p.website_service_areas.length})`);
  }

  if (p.website_testimonials && p.website_testimonials.length > 0) {
    score += 1;
    reasons.push(`+1 Testimonials on site (${p.website_testimonials.length})`);
  }

  // Review count sweet spot — 30-60 = highest-conversion ICP shape
  // (established enough to afford $149, hungry enough to need help)
  if (reviews >= 30 && reviews <= 60) {
    score += 3;
    reasons.push(`+3 ${reviews} reviews — ICP sweet spot`);
  } else if (reviews >= 20 && reviews <= 29) {
    score += 1;
    reasons.push(`+1 ${reviews} reviews — early-stage, hungry for growth`);
  } else if (reviews >= 61 && reviews <= 100) {
    score += 1;
    reasons.push(`+1 ${reviews} reviews — established but borderline upper bound`);
  }

  // Organic review pattern
  if (!automation.suspected && p.google_reviews && p.google_reviews.length >= 3) {
    score += 2;
    reasons.push("+2 Organic review pattern confirmed");
  }

  // Rating
  if (rating >= 4.5) {
    score += 2;
    reasons.push(`+2 ${rating}★ — takes pride in work`);
  } else if (rating >= 4.0) {
    score += 1;
    reasons.push(`+1 ${rating}★ — good rating`);
  }

  // Recent reviews (within 6 months)
  if (p.google_reviews && p.google_reviews.length > 0) {
    const sixMonthsAgo = Date.now() / 1000 - 180 * 24 * 60 * 60;
    const hasRecent = p.google_reviews.some((r) => r.time && r.time > sixMonthsAgo);
    if (hasRecent) {
      score += 1;
      reasons.push("+1 Recent reviews (last 6 months)");
    }
  }

  // Phone
  if (p.phone && p.phone !== "unknown") {
    score += 1;
    reasons.push("+1 Phone number listed");
  }

  // ── Determine tier ──────────────────────────────────────────────

  let tier: ProspectTier;
  if (score >= 16) tier = "platinum";
  else if (score >= 12) tier = "gold";
  else if (score >= 8) tier = "silver";
  else tier = "skip";

  return {
    tier,
    score,
    reasons,
    autoSkipReason: null,
    reviewAutomationSuspected: false,
  };
}

// ── Display helpers ────────────────────────────────────────────────

export const PROSPECT_TIER_STYLES: Record<ProspectTier, { bg: string; text: string; border: string; label: string }> = {
  platinum: { bg: "bg-[#F3E8FF]", text: "text-[#6B21A8]", border: "border-[#D8B4FE]", label: "Platinum" },
  gold: { bg: "bg-[#FFF8E1]", text: "text-[#92400E]", border: "border-[#FDE68A]", label: "Gold" },
  silver: { bg: "bg-[#F5F5F7]", text: "text-[#3C3C43]", border: "border-[#D1D1D6]", label: "Silver" },
  skip: { bg: "bg-[#FEF2F2]", text: "text-[#991B1B]", border: "border-[#FECACA]", label: "Skip" },
};
