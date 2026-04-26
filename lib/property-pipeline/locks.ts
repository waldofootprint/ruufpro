import type { SupabaseClient } from "@supabase/supabase-js";

export interface LockResult {
  locked: boolean;
  reason?: "mail_cooldown" | "lead_engaged";
  availableAt?: string;
}

/**
 * Cross-contractor lockout check. Stub at MVP (N=1 contractor).
 *
 * Designed:
 *   mail-lock 180d after any contractor sends to this property
 *   lead-lock permanent after homeowner engages with another contractor
 *
 * Real impl drops in at customer #2 — see
 * decisions/property-pipeline-mvp-source-of-truth.md "Cross-contractor lockout"
 */
export async function isPropertyLocked(
  _supabase: SupabaseClient,
  _candidateId: string,
  _contractorId: string
): Promise<LockResult> {
  return { locked: false };
}
