import type { PipelineStage, ProspectBatch } from "@/lib/ops-pipeline";
import { STAGE_LABELS } from "@/lib/ops-pipeline";
import { scoreProspect, TIER_STYLES } from "@/lib/prospect-scoring";
import type { ProspectInput } from "@/lib/prospect-scoring";

// ── Formatters ────────────────────────────────────────────────────
export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function fmtBatch(batchNumber: number, b: ProspectBatch) {
  return `Batch ${batchNumber} · ${fmtDate(b.week_start)}–${fmtDate(b.week_end)}`;
}
export function fmtTimestamp(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export function daysSince(d: string | null): number {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

// ── Stage styling ─────────────────────────────────────────────────
export function stageColor(stage: PipelineStage, count: number): string {
  if (count === 0) return "text-[#D1D1D6]";
  const hot: PipelineStage[] = ["interested", "free_signup", "paid"];
  const warn: PipelineStage[] = ["site_built"];
  if (hot.includes(stage)) return "text-[#34C759] font-extrabold";
  if (warn.includes(stage)) return "text-[#FF9F0A]";
  return "text-[#3C3C43]";
}

export const STAGE_PILL: Record<string, string> = {
  scraped: "bg-gray-100 text-gray-500",
  google_enriched: "bg-blue-50 text-blue-600",
  awaiting_triage: "bg-[#FFF8E1] text-[#F57F17]",
  parked: "bg-[#FFF3E0] text-[#E65100]",
  enriched: "bg-blue-50 text-blue-600",
  site_built: "bg-[#EDE7F6] text-[#5E35B1]",
  site_approved: "bg-teal-50 text-teal-600",
  contact_lookup: "bg-indigo-50 text-indigo-600",
  contact_ready: "bg-indigo-100 text-indigo-700",
  outreach_approved: "bg-cyan-50 text-cyan-600",
  sent: "bg-[#E0F7FA] text-[#00838F]",
  awaiting_reply: "bg-[#FFF8E1] text-[#F57F17]",
  replied: "bg-[#E8F5E9] text-[#2E7D32]",
  draft_ready: "bg-[#F3E5F5] text-[#7B1FA2]",
  responded: "bg-emerald-50 text-emerald-600",
  interested: "bg-[#C8E6C9] text-[#1B5E20]",
  free_signup: "bg-green-200 text-green-800",
  paid: "bg-green-300 text-green-900",
  not_now: "bg-gray-100 text-gray-500",
  objection: "bg-red-50 text-red-500",
  unsubscribed: "bg-red-100 text-red-600",
};

// ── ICP scoring ───────────────────────────────────────────────────
export function getIcpScore(lead: any) {
  const input: ProspectInput = {
    reviews_count: lead.reviews_count ?? null,
    rating: lead.rating ?? null,
    has_estimate_widget: false,
    their_website_url: lead.their_website_url ?? null,
    website_status: lead.their_website_url ? "has_website" : "none",
    contact_form_url: lead.contact_form_url ?? null,
    has_captcha: lead.has_captcha ?? false,
    linkedin_url: lead.linkedin_url ?? null,
    owner_email: lead.owner_email ?? null,
    phone: lead.phone ?? null,
    years_in_business: lead.years_in_business ?? null,
  };
  const result = scoreProspect(input);
  return { tier: result.tier, signals: result.signals, outreach_methods: result.outreach_methods, reasons: result.reasons };
}

export const ICP_STYLES = TIER_STYLES;

// ── Types ─────────────────────────────────────────────────────────
export interface AttentionItem {
  id: string;
  batch_id: string;
  gate_key: string | null;
  business_name: string;
  location: string;
  context: string;
  days: number;
  urgency: "ok" | "warn" | "urgent";
  batch_label: string;
  type: "reply_wait" | "draft_pending" | "site_review" | "parked_revival" | "triage_pending";
}
