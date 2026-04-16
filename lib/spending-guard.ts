// Spending Guard — tracks and limits all paid API costs.
// Every paid API call MUST go through this before executing.
// Refuses to proceed if daily cap is exceeded.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Daily spending cap in dollars — hard limit, system refuses past this
const DAILY_CAP_DOLLARS = 10;

// Known costs per API call
export const API_COSTS: Record<string, number> = {
  "google_text_search": 0.032,
  "google_place_details": 0.017,
  "google_place_photos": 0.017,
  "apollo_enrich": 0.00,       // Free tier (50/mo), but track usage
  "apify_facebook": 0.01,      // ~$0.01/actor run
  "anthropic_chat": 0.01,      // ~$0.01/message average
  "resend_email": 0.00,        // Free tier
};

export interface SpendingCheck {
  allowed: boolean;
  spent_today: number;
  remaining: number;
  cap: number;
  reason?: string;
}

export interface CostEstimate {
  service: string;
  calls: number;
  cost_per_call: number;
  total: number;
}

// ── Check if we can afford to make API calls ────────────────────────
export async function checkSpending(estimatedCost: number): Promise<SpendingCheck> {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("api_spending_daily")
    .select("total_cost")
    .eq("date", today)
    .single();

  const spentToday = data?.total_cost || 0;
  const remaining = DAILY_CAP_DOLLARS - spentToday;

  if (spentToday + estimatedCost > DAILY_CAP_DOLLARS) {
    return {
      allowed: false,
      spent_today: spentToday,
      remaining,
      cap: DAILY_CAP_DOLLARS,
      reason: `Daily cap $${DAILY_CAP_DOLLARS} would be exceeded. Spent today: $${spentToday.toFixed(2)}. This operation: ~$${estimatedCost.toFixed(2)}.`,
    };
  }

  return {
    allowed: true,
    spent_today: spentToday,
    remaining,
    cap: DAILY_CAP_DOLLARS,
  };
}

// ── Record actual spending after API calls complete ─────────────────
export async function recordSpending(
  service: string,
  calls: number,
  costPerCall: number,
  context?: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const totalCost = calls * costPerCall;

  // Upsert daily total
  const { data: existing } = await supabase
    .from("api_spending_daily")
    .select("total_cost, call_count, breakdown")
    .eq("date", today)
    .single();

  if (existing) {
    const breakdown = existing.breakdown || {};
    breakdown[service] = (breakdown[service] || 0) + totalCost;

    await supabase
      .from("api_spending_daily")
      .update({
        total_cost: existing.total_cost + totalCost,
        call_count: existing.call_count + calls,
        breakdown,
        updated_at: new Date().toISOString(),
      })
      .eq("date", today);
  } else {
    await supabase
      .from("api_spending_daily")
      .insert({
        date: today,
        total_cost: totalCost,
        call_count: calls,
        breakdown: { [service]: totalCost },
      });
  }

  // Also log individual entry for audit trail
  await supabase.from("api_spending_log").insert({
    service,
    calls,
    cost_per_call: costPerCall,
    total_cost: totalCost,
    context: context || null,
  });
}

// ── Estimate cost before running ────────────────────────────────────
export function estimateCost(items: CostEstimate[]): {
  total: number;
  breakdown: string;
} {
  let total = 0;
  const parts: string[] = [];

  for (const item of items) {
    const cost = item.calls * item.cost_per_call;
    total += cost;
    parts.push(`${item.service}: ${item.calls} calls × $${item.cost_per_call} = $${cost.toFixed(2)}`);
  }

  return { total, breakdown: parts.join("\n") };
}

// ── Get today's spending summary ────────────────────────────────────
export async function getTodaySpending(): Promise<{
  total: number;
  remaining: number;
  cap: number;
  breakdown: Record<string, number>;
}> {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("api_spending_daily")
    .select("total_cost, breakdown")
    .eq("date", today)
    .single();

  return {
    total: data?.total_cost || 0,
    remaining: DAILY_CAP_DOLLARS - (data?.total_cost || 0),
    cap: DAILY_CAP_DOLLARS,
    breakdown: data?.breakdown || {},
  };
}
