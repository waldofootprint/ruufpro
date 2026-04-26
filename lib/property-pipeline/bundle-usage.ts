import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pricing model — locked 2026-04-26, recalibrated after Lob first-piece live quote.
 *
 * Bundle defaults to 75/mo (most generous tier per source-of-truth lookup table
 * for Lob ≤ $1.05/card). Tighten down to 60 or 50 once live quote returns.
 *
 * Overage cost = Lob actual + $0.10 processing fee. Lob 6x11 standard at
 * Developer tier = $1.026 → ~$1.13 per overage card. Update LOB_BASE_COST_CENTS
 * once Hannah's account tier is known.
 */
export const MONTHLY_BUNDLE = 75;
export const LOB_BASE_COST_CENTS = 105;
export const PROCESSING_FEE_CENTS = 10;
export const OVERAGE_COST_CENTS = LOB_BASE_COST_CENTS + PROCESSING_FEE_CENTS;

export interface MonthlyUsage {
  used: number;
  bundled: number;
  remaining: number;
  isOverage: boolean;
  overageCostCents: number;
}

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function getMonthlyUsage(
  supabase: SupabaseClient,
  contractorId: string
): Promise<MonthlyUsage> {
  const { count, error } = await supabase
    .from("mailing_history")
    .select("id", { count: "exact", head: true })
    .eq("contractor_id", contractorId)
    .gte("sent_at", startOfMonthIso());

  if (error) throw error;

  const used = count ?? 0;
  const remaining = Math.max(0, MONTHLY_BUNDLE - used);
  const isOverage = used >= MONTHLY_BUNDLE;

  return {
    used,
    bundled: MONTHLY_BUNDLE,
    remaining,
    isOverage,
    overageCostCents: isOverage ? OVERAGE_COST_CENTS : 0,
  };
}
