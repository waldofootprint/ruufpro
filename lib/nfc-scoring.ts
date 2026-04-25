// DEPRECATED 2026-04-25 — single ICP locked across all outreach.
// NFC card is a tactic, not a separate audience. This file re-exports the unified
// scorer in lib/demo-prospect-scoring.ts so existing imports keep working.
//
// ICP locked: rich website + 1-10 crew + 4.0+ rating + 20-100 reviews +
// active in last 90 days + organic review pattern + no competitor tools.
//
// Migration path: replace `scoreNfcProspect` with `scoreDemoProspect` and
// `NfcProspectInput`/`NfcScoreResult`/`NfcTier` with the `Demo*` equivalents.

import {
  scoreDemoProspect,
  detectReviewAutomation as detectReviewAutomationUnified,
  PROSPECT_TIER_STYLES,
  type DemoProspectInput,
  type DemoScoreResult,
  type ProspectTier,
} from "./demo-prospect-scoring";

export type NfcTier = ProspectTier;
export type NfcScoreResult = DemoScoreResult;

// NFC scorer historically accepted a few fields the unified scorer doesn't use directly
// (has_estimate_widget, website_status, fl_license_type, photos). They're kept on the
// type for back-compat but ignored — competitor detection now flows through `competitor_tools`.
export interface NfcProspectInput extends DemoProspectInput {
  has_estimate_widget?: boolean;
  website_status?: string | null;
  fl_license_type?: string | null;
  photos?: any[] | null;
}

export const detectReviewAutomation = detectReviewAutomationUnified;

export function scoreNfcProspect(p: NfcProspectInput): NfcScoreResult {
  // Map legacy `has_estimate_widget` flag into the unified competitor_tools array
  const competitor_tools = p.competitor_tools ?? [];
  if (p.has_estimate_widget && !competitor_tools.some((t) => t.toLowerCase().includes("widget"))) {
    competitor_tools.push("estimate_widget:legacy_flag");
  }
  return scoreDemoProspect({ ...p, competitor_tools });
}

export const NFC_TIER_STYLES = PROSPECT_TIER_STYLES;
