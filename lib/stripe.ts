// Stripe integration — checkout, webhooks, billing portal.
// Prices are created in Stripe Dashboard, IDs stored here.
// Single paid tier: Pro ($149/mo) = everything.

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

// Stripe Price IDs — set these in Stripe Dashboard, store in env vars.
export const PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
} as const;

export type PlanKey = keyof typeof PRICES;

// Feature flags that Pro enables.
export const PRO_FLAGS: Record<string, boolean> = {
  has_estimate_widget: true,
  has_review_automation: true,
  has_auto_reply: true,
  has_ai_chatbot: true,
  has_seo_pages: true,
  has_custom_domain: true,
};

// Map a Stripe price ID to tier.
export function getTierFromPriceId(priceId: string): "pro" | null {
  if (priceId === PRICES.pro_monthly || priceId === PRICES.pro_yearly) return "pro";
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
