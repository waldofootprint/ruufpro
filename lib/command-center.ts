// Command Center types + helpers

export interface PlayStep {
  text: string;
  done: boolean;
}

export interface CommandPlay {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "done" | "queued";
  priority: number;
  category: "active" | "queued" | "completed";
  summary: string | null;
  vault_details: string | null;
  vault_sources: string[];
  steps: PlayStep[];
  when_to_start: string | null;
  created_at: string;
  updated_at: string;
}

export interface HormoziEquation {
  dream_outcome: string;
  likelihood: string;
  time_delay: string;
  effort: string;
}

export interface PricingTier {
  price: number;
  roofers_needed: number;
  label: string;
}

export interface CommandPositioning {
  id: string;
  current_pos: string | null;
  target_pos: string | null;
  hormozi_json: HormoziEquation;
  mrr_target: number;
  mrr_current: number;
  pricing_tiers: PricingTier[];
  notes: string | null;
  updated_at: string;
}

export interface CommandMotivation {
  id: string;
  name: string;
  story: string | null;
  vault_entry: string | null;
  type: "story" | "principle";
  sort_order: number;
}

// Status display helpers
export const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-red-500/15 text-red-400", dot: "bg-red-400" },
  in_progress: { label: "In Progress", color: "bg-amber-500/15 text-amber-400", dot: "bg-amber-400" },
  done: { label: "Done", color: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
  queued: { label: "Queued", color: "bg-slate-500/15 text-slate-400", dot: "bg-slate-400" },
} as const;

// Advisor notes + daily briefs
export interface CommandAdvisor {
  id: string;
  type: "note" | "brief";
  content: string;
  created_at: string;
}

// Outreach tracking
export type OutreachChannel = "demo_site" | "facebook" | "cold_email" | "other";
export type OutreachStatus = "sent" | "viewed" | "replied" | "call_booked" | "signed_up" | "no_response" | "declined";

export interface CommandOutreach {
  id: string;
  channel: OutreachChannel;
  company_name: string | null;
  city: string | null;
  contact_name: string | null;
  status: OutreachStatus;
  notes: string | null;
  date_sent: string;
  date_responded: string | null;
  created_at: string;
  updated_at: string;
}

// Wins & milestones
export interface CommandWin {
  id: string;
  title: string;
  description: string | null;
  milestone_type: "win" | "milestone" | "learning";
  date_achieved: string;
  created_at: string;
}

// Project status (every feature/asset)
export type ProjectStatusValue = "complete" | "in_progress" | "planned" | "needs_work";
export type ProjectCategory = "page" | "api" | "template" | "feature" | "research" | "workflow";

export interface CommandProjectStatus {
  id: string;
  feature_name: string;
  category: ProjectCategory;
  route: string | null;
  status: ProjectStatusValue;
  description: string | null;
  sort_order: number;
  updated_at: string;
}

export const OUTREACH_STATUS_CONFIG = {
  sent: { label: "Sent", color: "bg-blue-500/15 text-blue-400" },
  viewed: { label: "Viewed", color: "bg-cyan-500/15 text-cyan-400" },
  replied: { label: "Replied", color: "bg-amber-500/15 text-amber-400" },
  call_booked: { label: "Call Booked", color: "bg-purple-500/15 text-purple-400" },
  signed_up: { label: "Signed Up", color: "bg-emerald-500/15 text-emerald-400" },
  no_response: { label: "No Response", color: "bg-slate-500/15 text-slate-400" },
  declined: { label: "Declined", color: "bg-red-500/15 text-red-400" },
} as const;

export const PROJECT_STATUS_CONFIG = {
  complete: { label: "Complete", color: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
  in_progress: { label: "In Progress", color: "bg-amber-500/15 text-amber-400", dot: "bg-amber-400" },
  planned: { label: "Planned", color: "bg-blue-500/15 text-blue-400", dot: "bg-blue-400" },
  needs_work: { label: "Needs Work", color: "bg-red-500/15 text-red-400", dot: "bg-red-400" },
} as const;

export const WIN_TYPE_CONFIG = {
  win: { label: "Win", color: "bg-emerald-500/15 text-emerald-400", icon: "🏆" },
  milestone: { label: "Milestone", color: "bg-purple-500/15 text-purple-400", icon: "🎯" },
  learning: { label: "Learning", color: "bg-blue-500/15 text-blue-400", icon: "💡" },
} as const;

// Vault lesson types
export type VaultRelevance = "high" | "medium" | "low";
export type VaultTopic = "sales_pricing" | "lead_gen" | "client_acquisition" | "marketing_content" | "case_studies" | "product_delivery" | "tools_technical";

export interface VaultEntry {
  entry: string;
  title: string;
  speaker: string;
  relevance: VaultRelevance;
  topic: VaultTopic;
  summary: string;
  ruufpro: string;
}

export const RELEVANCE_CONFIG = {
  high: { label: "High Relevance", color: "bg-emerald-500/15 text-emerald-400", border: "border-l-emerald-500/40", dot: "bg-emerald-400" },
  medium: { label: "Medium", color: "bg-amber-500/15 text-amber-400", border: "border-l-amber-500/40", dot: "bg-amber-400" },
  low: { label: "Reference", color: "bg-slate-500/15 text-slate-400", border: "border-l-slate-500/40", dot: "bg-slate-400" },
} as const;

export const TOPIC_LABELS: Record<VaultTopic, string> = {
  sales_pricing: "Sales & Pricing",
  lead_gen: "Lead Generation",
  client_acquisition: "Client Acquisition",
  marketing_content: "Marketing & Content",
  case_studies: "Case Studies",
  product_delivery: "Product & Delivery",
  tools_technical: "Tools & Technical",
};

// To-do items
export interface CommandTodo {
  id: string;
  title: string;
  description: string | null;
  is_shortlist: boolean;
  shortlist_rank: number | null;
  status: "pending" | "in_progress" | "done";
  source: string | null;
  created_at: string;
  updated_at: string;
}

// Inbox items
export interface CommandInboxItem {
  id: string;
  type: "text" | "file" | "transcript" | "note" | "screenshot";
  title: string | null;
  content: string | null;
  file_name: string | null;
  file_url: string | null;
  status: "new" | "processing" | "processed" | "filed";
  processed_summary: string | null;
  filed_location: string | null;
  created_at: string;
  processed_at: string | null;
}

export const INBOX_STATUS_CONFIG = {
  new: { label: "New", color: "bg-amber-500/15 text-amber-400", dot: "bg-amber-400" },
  processing: { label: "Processing", color: "bg-blue-500/15 text-blue-400", dot: "bg-blue-400" },
  processed: { label: "Processed", color: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
  filed: { label: "Filed", color: "bg-slate-500/15 text-slate-400", dot: "bg-slate-400" },
} as const;

// Tab configuration
export const TABS = [
  { id: "overview", label: "Overview" },
  { id: "onboarding", label: "Onboarding" },
  { id: "inbox", label: "Inbox" },
  { id: "todos", label: "To-Do" },
  { id: "plays", label: "Plays" },
  { id: "sites", label: "Sites" },
  { id: "outreach", label: "Outreach" },
  { id: "vault", label: "Vault" },
  { id: "project", label: "Project Status" },
  { id: "research", label: "Research" },
  { id: "positioning", label: "Positioning" },
  { id: "motivation", label: "Motivation" },
] as const;

export type TabId = typeof TABS[number]["id"];

// Calculate step completion percentage
export function stepProgress(steps: PlayStep[]): number {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

// Site Kanban
export type KanbanCol = "edit_requested" | "in_progress" | "review" | "done";
export type SitePriority = "urgent" | "normal" | "low";

export interface CommandSiteCard {
  id: string;
  site_name: string;
  city: string | null;
  template: string | null;
  edit_request: string | null;
  priority: SitePriority;
  site_url: string | null;
  notes: string | null;
  col: KanbanCol;
  created_at: string;
  updated_at: string;
}

export const KANBAN_COLUMNS: { id: KanbanCol; label: string; color: string }[] = [
  { id: "edit_requested", label: "Edit Requested", color: "border-amber-500/30" },
  { id: "in_progress", label: "In Progress", color: "border-blue-500/30" },
  { id: "review", label: "Ready for Review", color: "border-purple-500/30" },
  { id: "done", label: "Done", color: "border-emerald-500/30" },
];

export const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-500/15 text-red-400" },
  normal: { label: "Normal", color: "bg-slate-500/15 text-slate-400" },
  low: { label: "Low", color: "bg-blue-500/15 text-blue-400" },
} as const;

export const TEMPLATE_OPTIONS = [
  { value: "modern_clean", label: "Modern Clean", route: "/demo" },
  { value: "chalkboard", label: "Chalkboard", route: "/demo/chalkboard" },
  { value: "forge", label: "Forge", route: "/demo/forge" },
  { value: "blueprint", label: "Blueprint", route: "/demo/blueprint" },
  { value: "classic", label: "Classic", route: "/demo/classic" },
  { value: "apex", label: "Apex", route: null },
];

// Progress log items (DB-backed)
export interface ProgressLogItem {
  id: string;
  title: string;
  description: string | null;
  files: { label: string; path: string }[];
  tags: string[];
  logged_date: string;
  created_at: string;
}

// Sprint items (DB-backed)
export type SprintStatus = "next" | "in_progress" | "shipped" | "dropped";

export interface SprintItem {
  id: string;
  title: string;
  status: SprintStatus;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const SPRINT_STATUS_CONFIG = {
  next: { label: "Next", color: "rgba(245,158,11,0.12)", text: "#fbbf24", dot: "#f59e0b" },
  in_progress: { label: "In Progress", color: "rgba(99,102,241,0.12)", text: "#818cf8", dot: "#6366f1" },
  shipped: { label: "Shipped", color: "rgba(34,197,94,0.12)", text: "#4ade80", dot: "#22c55e" },
  dropped: { label: "Dropped", color: "rgba(100,116,139,0.12)", text: "#94a3b8", dot: "#64748b" },
} as const;

// Business metrics (DB-backed key-value)
export interface BusinessMetric {
  id: string;
  metric_key: string;
  metric_value: number;
  metric_label: string;
  category: string;
  updated_at: string;
}

// Quick links for the dashboard
export const QUICK_LINKS = [
  { label: "RuufPro Dashboard", href: "/dashboard", external: false },
  { label: "Marketing Site", href: "/", external: false },
  { label: "Demo Site", href: "/demo", external: false },
  { label: "3D Preview", href: "/preview-3d", external: false },
  { label: "Widget Compare", href: "/widget-compare", external: false },
  { label: "Vercel Dashboard", href: "https://vercel.com/dashboard", external: true },
  { label: "Supabase Dashboard", href: "https://supabase.com/dashboard", external: true },
];
