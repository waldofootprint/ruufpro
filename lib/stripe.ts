// Stripe integration — checkout, webhooks, billing portal.
// Prices are created in Stripe Dashboard, IDs stored here.
// Tier mapping: Pro ($149/mo) = estimate widget + Riley + reviews + CRM.
//               Growth ($299/mo) = Pro + SEO city pages + custom domain.

import Stripe from "stripe";

// Lazy-init to avoid build-time crash when env var isn't set.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

// Use getStripe() in all API routes instead of a module-level constant.

// Stripe Price IDs — set these in Stripe Dashboard, store in env vars.
// Monthly and yearly for each tier.
export const PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
  growth_yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY!,
} as const;

export type PlanKey = keyof typeof PRICES;

// Which feature flags each tier enables.
export const TIER_FLAGS: Record<string, Record<string, boolean>> = {
  pro: {
    has_estimate_widget: true,
    has_review_automation: true,
    has_auto_reply: true,
    has_ai_chatbot: true,
  },
  growth: {
    has_estimate_widget: true,
    has_review_automation: true,
    has_auto_reply: true,
    has_ai_chatbot: true,
    has_seo_pages: true,
    has_custom_domain: true,
  },
};

// Map a Stripe price ID to a tier name.
export function getTierFromPriceId(priceId: string): "pro" | "growth" | null {
  if (priceId === PRICES.pro_monthly || priceId === PRICES.pro_yearly) return "pro";
  if (priceId === PRICES.growth_monthly || priceId === PRICES.growth_yearly) return "growth";
  return null;
}

// Feature flags to disable when a subscription ends.
export const FREE_FLAGS: Record<string, boolean> = {
  has_estimate_widget: false,
  has_review_automation: false,
  has_auto_reply: false,
  has_ai_chatbot: false,
  has_seo_pages: false,
  has_custom_domain: false,
};
