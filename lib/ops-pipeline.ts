// Ops pipeline types — shared between API routes and UI components.

// ── Pipeline Stages ──────────────────────────────────────────────────
// New flow (v2): scrape → auto-enrich (Google+FB) → triage → build sites →
//   review sites (Gate 1) → auto contact lookup (Apollo) → approve outreach (Gate 2) →
//   send → monitor → reply → draft → approve (Gate 3) → track
export const PIPELINE_STAGES = [
  // Acquisition & enrichment (automated)
  "scraped",
  "google_enriched",
  "awaiting_triage",
  "parked",
  // Legacy stage — kept for existing batches
  "enriched",
  // Site building & review
  "site_built",
  "site_approved",
  // Contact lookup & outreach (Apollo runs here now, not early)
  "contact_lookup",
  "contact_ready",
  "outreach_approved",
  // Sending & monitoring
  "sent",
  "awaiting_reply",
  "replied",
  "draft_ready",
  "responded",
  // Terminal states
  "interested",
  "not_now",
  "objection",
  "unsubscribed",
  "free_signup",
  "paid",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// Display labels for each stage
export const STAGE_LABELS: Record<PipelineStage, string> = {
  scraped: "Scraped",
  google_enriched: "Enriched",
  awaiting_triage: "To Triage",
  parked: "Parked",
  enriched: "Enriched (legacy)",
  site_built: "Site Built",
  site_approved: "Site OK",
  contact_lookup: "Looking Up",
  contact_ready: "Contacts Ready",
  outreach_approved: "Approved",
  sent: "Sent",
  awaiting_reply: "Waiting",
  replied: "Replied",
  draft_ready: "Draft",
  responded: "Responded",
  interested: "Interested",
  not_now: "Not Now",
  objection: "Objection",
  unsubscribed: "Unsub",
  free_signup: "Signup",
  paid: "Paid",
};

// Stages shown as columns in the batch pipeline view
export const DISPLAY_STAGES: PipelineStage[] = [
  "scraped",
  "awaiting_triage",
  "site_built",
  "site_approved",
  "contact_ready",
  "outreach_approved",
  "sent",
  "replied",
  "draft_ready",
  "interested",
  "free_signup",
  "paid",
];

// ── Gates ────────────────────────────────────────────────────────────
export const GATE_TYPES = ["triage_review", "site_review", "outreach_approval", "draft_approval"] as const;
export type GateType = (typeof GATE_TYPES)[number];

export const GATE_LABELS: Record<GateType, string> = {
  triage_review: "Triage Prospects",
  site_review: "Review Sites",
  outreach_approval: "Approve Outreach",
  draft_approval: "Approve Drafts",
};

// Which stage triggers each gate
export const GATE_TRIGGER_STAGE: Record<GateType, PipelineStage> = {
  triage_review: "awaiting_triage",
  site_review: "site_built",
  outreach_approval: "contact_ready",
  draft_approval: "replied",
};

// Which stage leads advance to after gate approval
export const GATE_APPROVED_STAGE: Record<GateType, PipelineStage> = {
  triage_review: "site_built",
  site_review: "site_approved",
  outreach_approval: "outreach_approved",
  draft_approval: "responded",
};

// ── Batch Types ──────────────────────────────────────────────────────
export interface ProspectBatch {
  id: string;
  week_number: number;
  week_year: number;
  week_start: string;
  week_end: string;
  city_targets: string[];
  lead_count: number;
  status: "active" | "completed" | "archived";
  created_at: string;
  // Computed on read
  stage_counts: Record<PipelineStage, number>;
  gates: GateStatus[];
  progress: number; // % of leads past "sent" stage
}

export interface GateStatus {
  id: string;
  gate_type: GateType;
  items_pending: number;
  items_approved: number;
  items_rejected: number;
  status: "pending" | "approved" | "partial" | "skipped";
}

// ── Prospect (individual lead in the pipeline) ───────────────────────
export interface PipelineProspect {
  id: string;
  contractor_id: string;
  batch_id: string | null;
  stage: PipelineStage;
  stage_entered_at: string;
  // Business info (from contractors table)
  business_name: string;
  city: string;
  state: string;
  phone: string | null;
  rating: number | null;
  reviews_count: number | null;
  // Pipeline data
  owner_name: string | null;
  owner_email: string | null;
  preview_site_url: string | null;
  their_website_url: string | null;
  emails_sent_count: number;
  reply_category: string | null;
  reply_text: string | null;
  draft_response: string | null;
  draft_status: "none" | "pending" | "approved" | "sent" | "skipped";
  // Form outreach fields
  contact_form_url: string | null;
  form_field_mapping: Record<string, unknown> | null;
  has_captcha: boolean;
  form_detected_at: string | null;
  outreach_method: "form" | "cold_email" | "linkedin_draft" | null;
  form_submitted_at: string | null;
  form_submission_status: "pending" | "success" | "failed" | "captcha_blocked" | "duplicate_skipped" | null;
  form_submission_error: string | null;
  form_submission_attempts: number;
  // Triage fields (v2 flow)
  triage_decision: "selected" | "parked" | "skipped" | null;
  triage_decided_at: string | null;
  parked_until: string | null;
  parked_reason: string | null;
  // Facebook enrichment
  facebook_page_url: string | null;
  facebook_about: string | null;
  facebook_photos: Record<string, unknown>[] | null;
  // Facebook enrichment tracking
  facebook_enrichment_status: "success" | "no_match" | "error" | null;
  // LinkedIn
  linkedin_url: string | null;
  // Timestamps
  scraped_at: string;
  google_enriched_at: string | null;
  enriched_at: string | null;
  site_built_at: string | null;
  site_approved_at: string | null;
  contact_lookup_at: string | null;
  contact_ready_at: string | null;
  sent_at: string | null;
  replied_at: string | null;
}

// ── API Response Types ───────────────────────────────────────────────
export interface PipelineResponse {
  batches: ProspectBatch[];
  totals: Record<PipelineStage, number>;
  pending_gates: GateStatus[];
}

export interface GateActionRequest {
  gate_type: GateType;
  batch_id: string;
  action: "approve_all" | "approve_selected" | "reject_selected";
  prospect_ids?: string[];
}
