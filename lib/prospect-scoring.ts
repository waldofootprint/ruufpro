// Unified prospect scoring — single source of truth.
// Used by: CLI scorer, ops dashboard, pipeline API, Inngest functions.
//
// Approved tiers:
//   Gold:   0-30 reviews, 3.5+ rating, no estimate widget
//   Silver: 31-100 reviews, 3.5+ rating, no estimate widget
//   Skip:   100+ reviews OR <3.5 rating OR has estimate widget
//
// Outreach routing:
//   No website           → cold email (primary channel)
//   Has website + form   → form submission
//   Has website, no form → cold email
//   Gold + LinkedIn      → also queue LinkedIn draft

export type Tier = "gold" | "silver" | "skip";

export type OutreachMethod = "cold_email" | "form" | "linkedin_draft";

export interface ProspectInput {
  reviews_count: number | null;
  rating: number | null;
  has_estimate_widget?: boolean;
  their_website_url?: string | null;
  website_status?: string | null; // "has_website" | "directory_only" | "free_builder" | "none"
  contact_form_url?: string | null;
  has_captcha?: boolean;
  linkedin_url?: string | null;
  owner_email?: string | null;
  phone?: string | null;
  years_in_business?: number | null;
}

export interface ScoreResult {
  tier: Tier;
  reasons: string[];
  outreach_methods: OutreachMethod[];
  signals: string[];
}

export function scoreProspect(p: ProspectInput): ScoreResult {
  const reviews = p.reviews_count ?? 0;
  const rating = p.rating ?? 0;
  const reasons: string[] = [];
  const signals: string[] = [];

  // ── Skip conditions (checked first) ──────────────────────────

  if (p.has_estimate_widget) {
    reasons.push("Has estimate widget — already using Roofle/Roofr");
    return { tier: "skip", reasons, outreach_methods: [], signals };
  }

  if (reviews >= 100) {
    reasons.push(`${reviews} reviews — too established`);
    return { tier: "skip", reasons, outreach_methods: [], signals };
  }

  if (rating > 0 && rating < 3.5) {
    reasons.push(`${rating}★ — too low, quality issues`);
    return { tier: "skip", reasons, outreach_methods: [], signals };
  }

  // ── Gold: 0-30 reviews, 3.5+ rating ─────────────────────────

  if (reviews <= 30 && (rating === 0 || rating >= 3.5)) {
    if (reviews === 0) reasons.push("Zero reviews — brand new crew");
    else if (reviews <= 10) reasons.push(`${reviews} reviews — very new`);
    else reasons.push(`${reviews} reviews — small crew`);

    if (rating > 0) reasons.push(`${rating}★ rating`);

    const methods = getOutreachMethods(p, "gold");
    const sigs = getSignals(p);

    return { tier: "gold", reasons, outreach_methods: methods, signals: sigs };
  }

  // ── Silver: 31-100 reviews, 3.5+ rating ─────────────────────

  if (reviews <= 100 && (rating === 0 || rating >= 3.5)) {
    reasons.push(`${reviews} reviews — growing business`);
    if (rating > 0) reasons.push(`${rating}★ rating`);

    const methods = getOutreachMethods(p, "silver");
    const sigs = getSignals(p);

    return { tier: "silver", reasons, outreach_methods: methods, signals: sigs };
  }

  // Fallback — shouldn't hit this given checks above, but safety net
  reasons.push("Does not match any tier criteria");
  return { tier: "skip", reasons, outreach_methods: [], signals };
}

// ── Outreach method routing ──────────────────────────────────────

function getOutreachMethods(p: ProspectInput, tier: Tier): OutreachMethod[] {
  const methods: OutreachMethod[] = [];
  const hasWebsite = p.their_website_url && p.website_status !== "none";
  const hasForm = !!p.contact_form_url;

  if (hasWebsite && hasForm) {
    // Has website with a form — use form submission as primary
    methods.push("form");
  }

  // Cold email is always available if we have an email
  if (p.owner_email) {
    methods.push("cold_email");
  }

  // No website or no form — cold email is primary
  if (!hasWebsite || !hasForm) {
    if (!methods.includes("cold_email")) {
      methods.push("cold_email");
    }
  }

  // Gold prospects with LinkedIn get a draft queued
  if (tier === "gold" && p.linkedin_url) {
    methods.push("linkedin_draft");
  }

  return methods;
}

// ── Signal detection (for dashboard display) ─────────────────────

function getSignals(p: ProspectInput): string[] {
  const signals: string[] = [];

  // Website status
  if (!p.their_website_url || p.website_status === "none") {
    signals.push("No website — highest need");
  } else if (p.website_status === "free_builder") {
    signals.push("Free builder site (Wix/GoDaddy) — needs upgrade");
  } else if (p.website_status === "directory_only") {
    signals.push("Directory listing only — needs real site");
  } else {
    signals.push("Has website");
  }

  // Contact info
  if (p.phone) signals.push("Phone listed");
  if (p.owner_email) signals.push("Email found");
  if (p.linkedin_url) signals.push("LinkedIn found");

  // Form detection
  if (p.contact_form_url) {
    signals.push(p.has_captcha ? "Form found (has CAPTCHA)" : "Form found");
  }

  // Business age
  if (p.years_in_business != null) {
    if (p.years_in_business <= 2) signals.push(`${p.years_in_business}yr — startup`);
    else if (p.years_in_business <= 5) signals.push(`${p.years_in_business}yr — young business`);
    else signals.push(`${p.years_in_business}yr — established`);
  }

  return signals;
}

// ── Dashboard display helpers ────────────────────────────────────

export const TIER_STYLES = {
  gold: { bg: "bg-[#FFF8E1]", text: "text-[#92400E]", border: "border-[#FDE68A]", label: "Gold" },
  silver: { bg: "bg-[#F5F5F7]", text: "text-[#3C3C43]", border: "border-[#D1D1D6]", label: "Silver" },
  skip: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Skip" },
};

export const OUTREACH_METHOD_LABELS: Record<OutreachMethod, { label: string; color: string }> = {
  cold_email: { label: "Email", color: "bg-blue-100 text-blue-700" },
  form: { label: "Form", color: "bg-green-100 text-green-700" },
  linkedin_draft: { label: "LinkedIn", color: "bg-purple-100 text-purple-700" },
};
