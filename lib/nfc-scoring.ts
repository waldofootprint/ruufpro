// NFC Card Prospect Scoring — determines which prospects deserve a physical NFC card.
// These cards are limited (198 usable) so scoring is tighter than pipeline Gold/Silver/Skip.
//
// Used by: /direct-mail skill, ops dashboard NFC tier chips
//
// Auto-SKIP: no place ID, has competitor widget, review automation suspected,
//            rating < 4.0, 0-2 reviews, 50+ reviews
//
// NFC Tiers (by point total):
//   Platinum: 14+    → first cards go here
//   Gold:     10-13  → next batch
//   Silver:   7-9    → only if cards remain
//   Skip:     <7     → email only, save the card

export type NfcTier = "platinum" | "gold" | "silver" | "skip";

export interface NfcScoreResult {
  tier: NfcTier;
  score: number;
  reasons: string[];
  autoSkipReason: string | null;
  reviewAutomationSuspected: boolean;
}

export interface NfcProspectInput {
  google_place_id?: string | null;
  has_estimate_widget?: boolean;
  rating: number | null;
  reviews_count: number | null;
  their_website_url?: string | null;
  website_status?: string | null;
  fl_license_type?: string | null;
  photos?: any[] | null;
  google_reviews?: Array<{ time?: number; relative_time_description?: string; rating?: number; text?: string }> | null;
  phone?: string | null;
  facebook_page_url?: string | null;
  business_name?: string | null;
}

// ── Review automation detection ────────────────────────────────────
// Looks at date gaps between reviews. If spacing is suspiciously regular
// AND frequency is high (3+/month), the roofer likely uses Podium/Birdeye/NiceJob.

export function detectReviewAutomation(reviews: NfcProspectInput["google_reviews"]): {
  suspected: boolean;
  reason: string | null;
} {
  if (!reviews || reviews.length < 3) {
    return { suspected: false, reason: null };
  }

  // Extract timestamps and sort descending (most recent first)
  const timestamps = reviews
    .filter((r) => r.time && r.time > 0)
    .map((r) => r.time!)
    .sort((a, b) => b - a);

  if (timestamps.length < 3) {
    return { suspected: false, reason: null };
  }

  // Calculate gaps between consecutive reviews (in days)
  const gaps: number[] = [];
  for (let i = 0; i < timestamps.length - 1; i++) {
    const gapDays = (timestamps[i] - timestamps[i + 1]) / (60 * 60 * 24);
    gaps.push(gapDays);
  }

  // Average gap and standard deviation
  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Check frequency: reviews per month based on the time span
  const timeSpanDays = (timestamps[0] - timestamps[timestamps.length - 1]) / (60 * 60 * 24);
  const timeSpanMonths = Math.max(timeSpanDays / 30, 0.5); // avoid division by zero
  const reviewsPerMonth = timestamps.length / timeSpanMonths;

  // Suspected automation: regular cadence (low std dev relative to avg) AND high frequency
  // A coefficient of variation (stdDev/avgGap) below 0.5 with 3+/month = suspicious
  const coeffOfVariation = avgGap > 0 ? stdDev / avgGap : 0;

  if (reviewsPerMonth >= 3 && coeffOfVariation < 0.5) {
    return {
      suspected: true,
      reason: `${reviewsPerMonth.toFixed(1)} reviews/mo, regular cadence (CV: ${coeffOfVariation.toFixed(2)})`,
    };
  }

  // Also flag if reviews are almost exactly weekly/biweekly
  if (avgGap >= 5 && avgGap <= 16 && stdDev < 3 && reviewsPerMonth >= 2) {
    return {
      suspected: true,
      reason: `Reviews every ~${avgGap.toFixed(0)} days (±${stdDev.toFixed(0)}d) — looks automated`,
    };
  }

  return { suspected: false, reason: null };
}

// ── Main NFC scoring function ──────────────────────────────────────

export function scoreNfcProspect(p: NfcProspectInput): NfcScoreResult {
  const reviews = p.reviews_count ?? 0;
  const rating = p.rating ?? 0;
  const reasons: string[] = [];

  // ── Auto-skip checks ────────────────────────────────────────────

  if (!p.google_place_id) {
    return {
      tier: "skip",
      score: 0,
      reasons: ["No Google Place ID — NFC card can't link to review page"],
      autoSkipReason: "no_place_id",
      reviewAutomationSuspected: false,
    };
  }

  if (p.has_estimate_widget) {
    return {
      tier: "skip",
      score: 0,
      reasons: ["Already has estimate widget — using competitor"],
      autoSkipReason: "has_competitor_widget",
      reviewAutomationSuspected: false,
    };
  }

  if (rating > 0 && rating < 4.0) {
    return {
      tier: "skip",
      score: 0,
      reasons: [`${rating}★ — below 4.0 threshold`],
      autoSkipReason: "low_rating",
      reviewAutomationSuspected: false,
    };
  }

  if (reviews <= 2) {
    return {
      tier: "skip",
      score: 0,
      reasons: [`${reviews} reviews — too new, possible side hustle`],
      autoSkipReason: "too_few_reviews",
      reviewAutomationSuspected: false,
    };
  }

  if (reviews >= 50) {
    return {
      tier: "skip",
      score: 0,
      reasons: [`${reviews} reviews — too established for NFC card`],
      autoSkipReason: "too_many_reviews",
      reviewAutomationSuspected: false,
    };
  }

  // Review automation check
  const automation = detectReviewAutomation(p.google_reviews);
  if (automation.suspected) {
    return {
      tier: "skip",
      score: 0,
      reasons: [`Review automation suspected: ${automation.reason}`],
      autoSkipReason: "review_automation",
      reviewAutomationSuspected: true,
    };
  }

  // ── Point scoring ───────────────────────────────────────────────

  let score = 0;

  // Website status
  if (!p.their_website_url || p.website_status === "none") {
    score += 3;
    reasons.push("+3 No website — highest motivation");
  } else if (p.website_status === "free_builder" || p.website_status === "directory_only") {
    score += 2;
    reasons.push("+2 Bad/free website — needs upgrade");
  } else {
    score -= 1;
    reasons.push("-1 Has website — but ours is likely better");
  }

  // Review count sweet spot
  if (reviews >= 5 && reviews <= 25) {
    score += 2;
    reasons.push(`+2 ${reviews} reviews — sweet spot`);
  } else if (reviews >= 26 && reviews <= 40) {
    score += 1;
    reasons.push(`+1 ${reviews} reviews — growing`);
  } else if (reviews >= 3 && reviews <= 4) {
    score -= 1;
    reasons.push(`-1 ${reviews} reviews — borderline new`);
  }
  // 41-49 reviews = 0 points (no boost, no penalty)

  // Rating
  if (rating >= 4.5) {
    score += 2;
    reasons.push(`+2 ${rating}★ — takes pride in work`);
  } else if (rating >= 4.0) {
    score += 1;
    reasons.push(`+1 ${rating}★ — good rating`);
  }
  // rating === 0 means no rating data — no points either way

  // FL license
  if (p.fl_license_type) {
    score += 2;
    reasons.push(`+2 FL licensed (${p.fl_license_type})`);
  }

  // Organic review pattern
  if (!automation.suspected && p.google_reviews && p.google_reviews.length >= 3) {
    score += 2;
    reasons.push("+2 Organic review pattern confirmed");
  }

  // Photos
  if (p.photos && p.photos.length > 0) {
    score += 1;
    reasons.push(`+1 Has ${p.photos.length} photos on Google`);
  }

  // Phone
  if (p.phone && p.phone !== "unknown") {
    score += 1;
    reasons.push("+1 Phone number listed");
  }

  // Facebook
  if (p.facebook_page_url) {
    score += 1;
    reasons.push("+1 Has Facebook page");
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

  // ── Determine tier ──────────────────────────────────────────────

  let tier: NfcTier;
  if (score >= 14) tier = "platinum";
  else if (score >= 10) tier = "gold";
  else if (score >= 7) tier = "silver";
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

export const NFC_TIER_STYLES: Record<NfcTier, { bg: string; text: string; border: string; label: string }> = {
  platinum: { bg: "bg-[#F3E8FF]", text: "text-[#6B21A8]", border: "border-[#D8B4FE]", label: "NFC Platinum" },
  gold: { bg: "bg-[#FFF8E1]", text: "text-[#92400E]", border: "border-[#FDE68A]", label: "NFC Gold" },
  silver: { bg: "bg-[#F5F5F7]", text: "text-[#3C3C43]", border: "border-[#D1D1D6]", label: "NFC Silver" },
  skip: { bg: "bg-[#FEF2F2]", text: "text-[#991B1B]", border: "border-[#FECACA]", label: "NFC Skip" },
};
