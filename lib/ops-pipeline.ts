// Ops pipeline types — shared between API routes and UI components.

// ── Pipeline Stages ──────────────────────────────────────────────────
// v4 flow: scrape → auto-enrich (Google+FB+email+license) → AI rewrite →
//   scrape website → build demo page → [Gate 1: approve demos] → auto-send →
//   track replies → [Gate 2: approve reply drafts] → respond
export const PIPELINE_STAGES = [
  // Automated acquisition
  "scraped",
  "enriched",
  "ai_rewritten",
  "demo_built",
  // Gate 1: Hannah approves demo pages
  "demo_approved",
  // Automated outreach
  "sent",
  // Gate 2: Hannah approves reply drafts
  "replied",
  "responded",
  // Terminal states
  "interested",
  "not_now",
  "objection",
  "unsubscribed",
  "free_signup",
  "paid",
  // Legacy stages — kept so existing DB rows don't break queries
  "site_built",
  "site_approved",
  "google_enriched",
  "awaiting_triage",
  "parked",
  "contact_lookup",
  "contact_ready",
  "outreach_approved",
  "awaiting_reply",
  "draft_ready",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// Display labels for each stage
export const STAGE_LABELS: Record<PipelineStage, string> = {
  scraped: "Scraped",
  enriched: "Enriched",
  ai_rewritten: "AI Polished",
  demo_built: "Demo Ready",
  demo_approved: "Approved",
  sent: "Sent",
  replied: "Replied",
  responded: "Responded",
  interested: "Interested",
  not_now: "Not Now",
  objection: "Objection",
  unsubscribed: "Unsub",
  free_signup: "Signup",
  paid: "Paid",
  // Legacy
  site_built: "Demo Ready",
  site_approved: "Approved",
  google_enriched: "Enriched",
  awaiting_triage: "To Triage",
  parked: "Parked",
  contact_lookup: "Looking Up",
  contact_ready: "Contacts Ready",
  outreach_approved: "Approved",
  awaiting_reply: "Waiting",
  draft_ready: "Draft",
};

// Stages shown as columns in the batch pipeline view
export const DISPLAY_STAGES: PipelineStage[] = [
  "scraped",
  "enriched",
  "ai_rewritten",
  "demo_built",
  "demo_approved",
  "sent",
  "replied",
  "responded",
  "interested",
  "free_signup",
  "paid",
];

// ── Gates ────────────────────────────────────────────────────────────
// v4: only 2 gates (demo page review + reply draft approval)
export const GATE_TYPES = ["demo_review", "draft_approval"] as const;
export type GateType = (typeof GATE_TYPES)[number];

export const GATE_LABELS: Record<GateType, string> = {
  demo_review: "Review Demo Pages",
  draft_approval: "Approve Reply Drafts",
};

// Which stage triggers each gate
export const GATE_TRIGGER_STAGE: Record<GateType, PipelineStage> = {
  demo_review: "demo_built",
  draft_approval: "replied",
};

// Which stage leads advance to after gate approval
export const GATE_APPROVED_STAGE: Record<GateType, PipelineStage> = {
  demo_review: "demo_approved",
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
  gate_type: GateType | string; // string for legacy gate types (site_review)
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
  demo_page_url: string | null;
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
  // Google enrichment (migration 057)
  google_place_id: string | null;
  photos: string[] | null;
  google_reviews: Record<string, unknown>[] | null;
  extracted_services: string[] | null;
  photos_enriched_at: string | null;
  founded_year: number | null;
  years_in_business: number | null;
  website_status: "none" | "has_website" | "broken" | null;
  // Facebook enrichment (migration 057 + 060)
  // NOTE: facebook_url (057) and facebook_page_url (060) both exist in DB.
  // facebook_page_url is canonical — used by enrichment pipeline + dashboard.
  // facebook_url is legacy from initial scrape. Do not use for new code.
  facebook_url: string | null; // legacy — prefer facebook_page_url
  facebook_page_url: string | null; // canonical
  facebook_about: string | null;
  facebook_photos: Record<string, unknown>[] | null;
  facebook_enrichment_status: "success" | "no_match" | "error" | null;
  // LinkedIn
  linkedin_url: string | null;
  // AI rewrite output
  ai_about_text: string | null;
  ai_services: string[] | null;
  ai_hero_headline: string | null;
  ai_email_subject: string | null;
  ai_email_body: string | null;
  ai_rewritten_at: string | null;
  // FL license lookup
  fl_license_type: string | null;
  fl_license_number: string | null;
  fl_license_verified_at: string | null;
  // Outreach tracking
  outreach_approved_at: string | null;
  email_sequence_id: string | null;
  // Timestamps
  scraped_at: string;
  google_enriched_at: string | null;
  enriched_at: string | null;
  demo_page_built_at: string | null;
  demo_page_approved_at: string | null;
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
