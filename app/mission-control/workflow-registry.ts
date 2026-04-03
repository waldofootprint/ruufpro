// Autonomous workflow pipeline — every workflow RuufPro needs
// to run fully autonomously from outreach to fulfillment.
//
// STATIC DATA lives here (descriptions, tools, diagrams, prerequisites).
// LIVE STATUS lives in Supabase (workflow_status + workflow_step_status tables).
// Use mergeWithDbState() to combine them for the UI.

export type WorkflowPhase = "acquire" | "convert" | "fulfill" | "retain";
export type WorkflowDifficulty = "trivial" | "easy" | "medium";

// DB status types (must match CHECK constraints in 026_workflow_steps.sql)
export type WorkflowStatus = "not_started" | "in_progress" | "awaiting_review" | "complete";
export type StepStatus = "pending" | "approved_to_build" | "building" | "review" | "revision" | "approved" | "skipped";

export interface WorkflowStep {
  title: string;
  description: string;
  prerequisites: string[]; // things Hannah must do before this step starts
}

export interface WorkflowTool {
  name: string;
  have: boolean;
  note?: string;
}

// Static data — doesn't change at runtime
export interface WorkflowItem {
  id: string;
  name: string;
  phase: WorkflowPhase;
  difficulty: WorkflowDifficulty;
  description: string;
  whyAutonomous: string;
  approvalCheckpoint: string;
  dependencies: string[];
  diagramNodes: string[];
  steps: WorkflowStep[];
  tools: WorkflowTool[];
  estimateHours: number;
}

// DB row types (what comes back from Supabase)
export interface DbWorkflowStatus {
  id: string;
  workflow_id: string;
  status: WorkflowStatus;
  priority: number;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface DbStepStatus {
  id: string;
  workflow_id: string;
  sort_order: number;
  status: StepStatus;
  review_notes: string | null;
  context_notes: string | null;
  build_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Merged type — static + DB state combined for the UI
export interface MergedWorkflow extends WorkflowItem {
  dbStatus: WorkflowStatus;
  dbPriority: number;
  dbCurrentStep: number;
  mergedSteps: MergedStep[];
}

export interface MergedStep extends WorkflowStep {
  dbId: string;          // step UUID from Supabase (needed for PATCH calls)
  sortOrder: number;
  status: StepStatus;
  reviewNotes: string | null;
  contextNotes: string | null;
  buildSummary: string | null;
}

// === CONFIG LOOKUPS ===

export const PHASE_CONFIG: Record<WorkflowPhase, { label: string; color: string; bg: string; description: string }> = {
  acquire: { label: "Acquire", color: "#818cf8", bg: "rgba(129,140,248,0.12)", description: "Find roofers, generate demos, send outreach — all automated" },
  convert: { label: "Convert", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", description: "Self-serve signup and payment — zero manual intervention" },
  fulfill: { label: "Fulfill", color: "#34d399", bg: "rgba(52,211,153,0.12)", description: "Website delivery and customization — roofer self-service" },
  retain: { label: "Retain", color: "#f472b6", bg: "rgba(244,114,182,0.12)", description: "Keep roofers engaged, prevent churn, drive upgrades" },
};

export const STATUS_CONFIG: Record<WorkflowStatus, { label: string; color: string; bg: string; dot: string }> = {
  not_started: { label: "Not Started", color: "#666", bg: "rgba(255,255,255,0.04)", dot: "#555" },
  in_progress: { label: "In Progress", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", dot: "#fbbf24" },
  awaiting_review: { label: "Awaiting Review", color: "#818cf8", bg: "rgba(129,140,248,0.12)", dot: "#818cf8" },
  complete: { label: "Complete", color: "#22c55e", bg: "rgba(34,197,94,0.12)", dot: "#22c55e" },
};

export const STEP_STATUS_CONFIG: Record<StepStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#555", bg: "rgba(255,255,255,0.04)" },
  approved_to_build: { label: "Approved to Build", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  building: { label: "Building", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  review: { label: "Ready for Review", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  revision: { label: "Needs Revision", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  approved: { label: "Approved", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  skipped: { label: "Skipped", color: "#666", bg: "rgba(255,255,255,0.04)" },
};

export const DIFFICULTY_CONFIG: Record<WorkflowDifficulty, { label: string; color: string; bg: string }> = {
  trivial: { label: "Trivial", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  easy: { label: "Easy", color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
};

// === STATIC WORKFLOW DATA ===

export const WORKFLOWS: WorkflowItem[] = [
  // ===== ACQUIRE =====
  {
    id: "roofer-scraping",
    name: "Roofer Discovery Pipeline",
    phase: "acquire",
    difficulty: "medium",
    description: "Auto-find roofers who need websites. Scrape Google Business Profile and Yelp for roofers with no website, bad websites, or no online estimate capability. Score and prioritize leads by market size and competition.",
    whyAutonomous: "Without this, you're manually Googling roofers. The machine needs to feed itself — it finds its own prospects, scores them, and queues them for demo generation.",
    approvalCheckpoint: "Approve target cities and weekly scrape volume",
    dependencies: [],
    diagramNodes: ["Pick Target Cities", "Scrape GBP/Yelp", "Filter & Score", "Queue Prospects", "Store in DB"],
    steps: [
      { title: "Create prospect_leads table in Supabase", description: "Schema: business_name, phone, city, state, website_url, gbp_url, has_website, website_quality_score, source, scraped_at", prerequisites: [] },
      { title: "Build GBP scraping API route", description: "POST /api/scrape/gbp — accepts city+state, returns roofers with business info. Uses Google Places API (or SerpAPI for scraping search results)", prerequisites: ["Get Google Places API key (or decide on SerpAPI)", "Add API key to .env"] },
      { title: "Build Yelp scraping API route", description: "POST /api/scrape/yelp — accepts city+state, returns roofers from Yelp. Uses Yelp Fusion API", prerequisites: ["Create Yelp Fusion API account (free tier: 5,000 calls/day)", "Add YELP_API_KEY to .env"] },
      { title: "Build prospect scoring logic", description: "Score each roofer 0-100 based on: no website (high), bad website (medium), no online estimates (high), few reviews (medium), large service area (high)", prerequisites: [] },
      { title: "Build cron job for scheduled scraping", description: "Daily cron via Vercel Cron that processes queued cities and scrapes new prospects automatically", prerequisites: [] },
      { title: "Build admin UI for managing target cities", description: "Section in Command Center to add/remove target cities, set scrape frequency, view prospect pipeline", prerequisites: [] },
    ],
    tools: [
      { name: "Supabase", have: true, note: "Database for prospect storage" },
      { name: "Google Places API", have: false, note: "Need API key — or use SerpAPI as alternative" },
      { name: "Yelp Fusion API", have: false, note: "Free tier: 5,000 calls/day" },
      { name: "Vercel Cron", have: true, note: "Already using for other crons" },
      { name: "Next.js API Routes", have: true },
    ],
    estimateHours: 6,
  },
  {
    id: "bulk-demo-generation",
    name: "Bulk Demo Site Generation",
    phase: "acquire",
    difficulty: "easy",
    description: "Auto-generate personalized prospect preview sites for each scraped roofer. Uses their real business name, city, and phone from GBP data. Batch-creates 10-50 sites at a time.",
    whyAutonomous: "Prospect preview system already exists — this just wires it to the scraping pipeline so demos generate without you lifting a finger.",
    approvalCheckpoint: "Review batch before generation (spot-check names, cities)",
    dependencies: ["roofer-scraping"],
    diagramNodes: ["Pull from Prospect Queue", "Generate Site Data", "Create Preview Pages", "Store Preview URLs", "Mark Ready for Outreach"],
    steps: [
      { title: "Build batch generation API route", description: "POST /api/prospects/generate-batch — takes prospect IDs, creates prospect_contractors entries with auto-generated site data using existing preview system", prerequisites: [] },
      { title: "Wire prospect data to template defaults", description: "Map scraped business_name, phone, city, state to contractor fields. Auto-select template based on scoring. Generate smart defaults (headline, about text, services)", prerequisites: [] },
      { title: "Build batch approval UI", description: "Table in Command Center showing queued prospects with preview links. 'Approve Batch' button generates all at once. Spot-check before sending.", prerequisites: [] },
      { title: "Add generation status tracking", description: "Track: queued → generating → ready → sent on each prospect. Show counts in Command Center overview.", prerequisites: [] },
    ],
    tools: [
      { name: "Prospect Preview System", have: true, note: "/preview/[slug] route already built" },
      { name: "prospect_contractors table", have: true, note: "Already exists with is_prospect flag" },
      { name: "Template defaults", have: true, note: "lib/defaults.ts has smart defaults" },
      { name: "Supabase", have: true },
    ],
    estimateHours: 3,
  },
  {
    id: "cold-email-sequences",
    name: "Cold Email Sequences",
    phase: "acquire",
    difficulty: "medium",
    description: "Auto-send personalized cold emails with the roofer's live preview link. 3-email sequence: intro (day 0), value nudge (day 3), last chance (day 7). Uses Resend for delivery. Personalized with business name, city, and preview URL.",
    whyAutonomous: "Outreach is the #1 thing founders do manually and burn out on. This makes it a cron job — the system sends emails on schedule, you just approve the templates.",
    approvalCheckpoint: "Approve email templates and send schedule",
    dependencies: ["bulk-demo-generation"],
    diagramNodes: ["Ready Prospects", "Send Email #1", "Wait 3 Days", "Send Email #2", "Wait 4 Days", "Send Email #3", "Track Results"],
    steps: [
      { title: "Create email_sequences table", description: "Schema: prospect_id, sequence_position (1-3), template_id, scheduled_at, sent_at, opened_at, clicked_at, status", prerequisites: [] },
      { title: "Design 3 email templates", description: "Email 1: 'I built your website' with preview link. Email 2: 'Your competitors are online' with value stats. Email 3: 'Last chance to claim' with urgency. All personalized.", prerequisites: ["Review and approve email copy/templates before they go live"] },
      { title: "Build email sending API route", description: "POST /api/outreach/send-email — sends via Resend, logs to email_sequences table, handles personalization", prerequisites: [] },
      { title: "Build sequence cron job", description: "Runs daily: finds prospects due for next email in sequence, sends batch, advances sequence position. Respects daily send limits.", prerequisites: [] },
      { title: "Build sequence management UI", description: "View active sequences, pause/resume, edit templates, see send queue. Command Center integration.", prerequisites: [] },
    ],
    tools: [
      { name: "Resend", have: true, note: "Already configured for lead notifications" },
      { name: "Supabase", have: true },
      { name: "Vercel Cron", have: true },
      { name: "React Email", have: false, note: "For beautiful HTML email templates — optional, can use inline HTML" },
    ],
    estimateHours: 5,
  },
  {
    id: "outreach-tracking",
    name: "Outreach Analytics & Auto-Follow-Up",
    phase: "acquire",
    difficulty: "medium",
    description: "Track email opens, preview page views, and link clicks. Auto-categorize prospects (cold, warm, hot) based on engagement. Trigger follow-up actions: hot prospects get a text, warm get email #2 faster, cold get dropped after sequence.",
    whyAutonomous: "Without tracking, you're sending into the void. This closes the loop — every outreach action has a measurable outcome that feeds the next action.",
    approvalCheckpoint: "Review weekly outreach report (sent, opened, clicked, converted)",
    dependencies: ["cold-email-sequences"],
    diagramNodes: ["Track Opens/Clicks", "Score Engagement", "Categorize (Hot/Warm/Cold)", "Trigger Actions", "Weekly Report"],
    steps: [
      { title: "Add open/click tracking to emails", description: "Embed tracking pixel for opens. Wrap links with redirect through /api/outreach/track/[token] for click tracking.", prerequisites: [] },
      { title: "Build engagement scoring", description: "Score formula: opened (+10), clicked preview (+30), visited multiple pages (+20), returned (+15). Thresholds: hot (50+), warm (20-49), cold (<20).", prerequisites: [] },
      { title: "Wire preview page view tracking", description: "The /preview/[slug] route already tracks views via /api/preview-track. Connect this to the prospect scoring pipeline.", prerequisites: [] },
      { title: "Build auto-follow-up triggers", description: "Hot prospects: auto-send SMS via Twilio. Warm prospects: accelerate email sequence. Cold after 3 emails: mark as no_response.", prerequisites: [] },
      { title: "Build weekly report generation", description: "Cron job generates weekly summary: emails sent, opens, clicks, conversions, hot prospects. Posts to Command Center advisor notes.", prerequisites: [] },
    ],
    tools: [
      { name: "Resend (webhooks)", have: true, note: "Supports open/click webhooks" },
      { name: "Preview tracking", have: true, note: "/api/preview-track already exists" },
      { name: "Twilio SMS", have: true, note: "Already configured for missed-call text-back" },
      { name: "Supabase", have: true },
      { name: "Vercel Cron", have: true },
    ],
    estimateHours: 5,
  },

  // ===== CONVERT =====
  {
    id: "stripe-billing",
    name: "Stripe Billing & Payments",
    phase: "convert",
    difficulty: "medium",
    description: "Self-serve Stripe Checkout for Pro ($149/mo) and Growth ($299/mo). Webhook handler for subscription lifecycle. Customer portal for managing billing. Feature gating based on plan tier.",
    whyAutonomous: "Can't collect revenue without this. Roofer clicks upgrade, enters card, done. No invoices, no manual follow-up, no payment reminders — Stripe handles everything.",
    approvalCheckpoint: "Set pricing tiers and approve which features gate behind each tier",
    dependencies: [],
    diagramNodes: ["Roofer Clicks Upgrade", "Stripe Checkout", "Webhook Confirms", "Update DB Plan", "Gate Features"],
    steps: [
      { title: "Create Stripe account + products", description: "Set up Stripe account, create 2 products: Pro ($149/mo) and Growth ($299/mo). Get API keys.", prerequisites: ["Create Stripe account at stripe.com", "Create Pro product ($149/mo) and Growth product ($299/mo)", "Copy Secret Key, Publishable Key, and Webhook Secret"] },
      { title: "Install stripe package + add env vars", description: "npm install stripe, add STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET to .env and Vercel", prerequisites: ["Paste Stripe keys into .env", "Add same keys to Vercel Environment Variables dashboard"] },
      { title: "Build /api/stripe/checkout", description: "Creates Stripe Checkout Session with correct price_id, success/cancel URLs. Attaches contractor_id as metadata.", prerequisites: [] },
      { title: "Build /api/stripe/webhook", description: "Handle: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed", prerequisites: [] },
      { title: "Build /api/stripe/portal", description: "Creates Stripe Customer Portal session — roofers manage their own billing, update card, cancel.", prerequisites: [] },
      { title: "Add upgrade CTA to dashboard", description: "Banner + button in roofer dashboard that redirects to Stripe Checkout. Shows current plan, what they unlock.", prerequisites: [] },
      { title: "Implement feature gating", description: "Middleware that checks contractor.plan before allowing access to paid features (widget, SMS, reviews, city pages).", prerequisites: ["Decide which features go in Free vs Pro vs Growth tiers"] },
      { title: "Build pricing page", description: "Public /pricing page with tier comparison table, feature checkmarks, and Checkout buttons for each tier.", prerequisites: [] },
    ],
    tools: [
      { name: "Stripe", have: false, note: "Need account + API keys from Hannah" },
      { name: "stripe npm package", have: false, note: "npm install stripe" },
      { name: "Supabase", have: true, note: "contractors table already has stripe columns" },
      { name: "Next.js API Routes", have: true },
      { name: "Vercel (env vars)", have: true, note: "Need to add Stripe keys" },
    ],
    estimateHours: 6,
  },
  {
    id: "auth-fix",
    name: "Fix Auth Bypass",
    phase: "convert",
    difficulty: "trivial",
    description: "Revert the dev auth bypass on the onboarding page so real signups work. Currently set to 'preview-mode' which blocks actual user creation and publishing.",
    whyAutonomous: "The signup funnel is broken without this. Real users can't create accounts or publish sites.",
    approvalCheckpoint: "None — just needs to be done before any real traffic",
    dependencies: [],
    diagramNodes: ["Remove preview-mode", "Redirect to /signup", "Test Full Flow", "Deploy"],
    steps: [
      { title: "Revert auth bypass in onboarding", description: "In app/onboarding/page.tsx ~line 151: change setUserId('preview-mode') back to router.push('/signup').", prerequisites: [] },
      { title: "Test signup → onboarding → publish flow", description: "Full end-to-end test: create account, complete onboarding, publish site, verify site is live.", prerequisites: [] },
      { title: "Deploy to production", description: "vercel --prod after confirming flow works", prerequisites: [] },
    ],
    tools: [
      { name: "Supabase Auth", have: true, note: "Already configured" },
      { name: "Signup page", have: true, note: "/signup route exists" },
    ],
    estimateHours: 0.5,
  },

  // ===== FULFILL =====
  {
    id: "dashboard-editing",
    name: "Roofer Dashboard Editing",
    phase: "fulfill",
    difficulty: "medium",
    description: "Self-service editing in the roofer dashboard: upload logo, add photos, edit business hours, manage reviews display, update about text, change hero content.",
    whyAutonomous: "Right now, roofers publish and can't change anything. Without self-service editing, every customization request becomes a support ticket — which doesn't scale.",
    approvalCheckpoint: "None — roofers manage their own sites",
    dependencies: [],
    diagramNodes: ["Roofer Logs In", "Dashboard Editor", "Edit Fields", "Save to DB", "Site Updates Live"],
    steps: [
      { title: "Build logo upload with Supabase Storage", description: "Image upload component in dashboard. Store in Supabase Storage bucket. Update contractors.logo_url.", prerequisites: [] },
      { title: "Build photo gallery manager", description: "Upload multiple project photos. Drag to reorder. Display in site gallery section.", prerequisites: [] },
      { title: "Build business hours editor", description: "Day-of-week grid with open/close times. Store as JSON in contractors.business_hours.", prerequisites: [] },
      { title: "Build hero content editor", description: "Edit headline, subtitle, CTA text, CTA link. Live preview of changes.", prerequisites: [] },
      { title: "Build about text editor", description: "Rich textarea for about section. Save to sites.about_text.", prerequisites: [] },
      { title: "Build service area manager", description: "Add/remove cities from service area. Each city auto-generates SEO page.", prerequisites: [] },
      { title: "Build reviews display settings", description: "Toggle reviews section on/off. Set review source (Google, manual). Enter Google Place ID for auto-pull.", prerequisites: [] },
    ],
    tools: [
      { name: "Supabase Storage", have: true, note: "For image uploads (logo, photos)" },
      { name: "Supabase DB", have: true, note: "contractors + sites tables ready" },
      { name: "Dashboard", have: true, note: "/dashboard route exists with layout" },
      { name: "Next.js API Routes", have: true },
    ],
    estimateHours: 8,
  },
  {
    id: "seo-city-pages",
    name: "SEO City Page Auto-Generation",
    phase: "fulfill",
    difficulty: "medium",
    description: "Auto-generate '[service] in [city]' pages for every city in a roofer's service area. Each page gets unique H1, localized content, embedded estimate widget, JSON-LD schema, and sitemap entry.",
    whyAutonomous: "Programmatic SEO at scale. Roofer adds cities during onboarding → pages generate instantly → they start ranking.",
    approvalCheckpoint: "None — pages auto-generate from onboarding city selections",
    dependencies: [],
    diagramNodes: ["Roofer Adds Cities", "Generate Page Content", "Create Dynamic Route", "Add JSON-LD Schema", "Add to Sitemap"],
    steps: [
      { title: "Design city page template", description: "SEO-optimized layout: H1 '[Service] in [City]', localized hero, trust signals, embedded estimate widget, FAQ, internal links.", prerequisites: [] },
      { title: "Build content generation", description: "Template-based content that inserts city name, state, service type. 300-500 words per page.", prerequisites: [] },
      { title: "Create dynamic route /site/[slug]/[city]", description: "Next.js dynamic route that renders the city page template. Falls back to 404 for invalid cities.", prerequisites: [] },
      { title: "Add JSON-LD LocalBusiness schema", description: "Each city page gets structured data: business name, address, phone, services, hours, reviews.", prerequisites: [] },
      { title: "Build sitemap generation", description: "Auto-generate sitemap.xml entries for all city pages across all roofer sites.", prerequisites: [] },
      { title: "Add city page management to dashboard", description: "Toggle cities on/off, preview each page, see which cities are indexed.", prerequisites: [] },
    ],
    tools: [
      { name: "Next.js Dynamic Routes", have: true },
      { name: "service_area_cities field", have: true, note: "Already on contractors table" },
      { name: "Contractor sections", have: true, note: "Reusable components in components/contractor-sections/" },
      { name: "JSON-LD", have: true, note: "Already implemented on main site pages" },
    ],
    estimateHours: 6,
  },

  // ===== RETAIN =====
  {
    id: "churn-prevention",
    name: "Churn Prevention & Re-Engagement",
    phase: "retain",
    difficulty: "medium",
    description: "Monitor roofer activity. Auto-send check-in emails when engagement drops. Weekly performance reports. Re-engagement SMS. Cancel-save flow with discount offer.",
    whyAutonomous: "Every churned customer is revenue lost. This system detects disengagement early and intervenes automatically.",
    approvalCheckpoint: "Approve check-in email templates and discount thresholds for save offers",
    dependencies: ["stripe-billing"],
    diagramNodes: ["Track Activity", "Score Engagement", "Detect Drop-off", "Send Check-in", "Cancel-Save Flow"],
    steps: [
      { title: "Build activity tracking", description: "Log dashboard logins, lead responses, site edits to activity_log table.", prerequisites: [] },
      { title: "Build engagement scoring cron", description: "Weekly cron: active, passive, disengaged, at-risk based on login + action frequency.", prerequisites: [] },
      { title: "Build weekly performance email", description: "'Your site this week: X views, Y leads.' Sent every Monday via Resend.", prerequisites: ["Review and approve weekly email template"] },
      { title: "Build re-engagement SMS flow", description: "After 14 days inactive: 'You had X leads this month. Log in to respond.'", prerequisites: [] },
      { title: "Build cancel-save flow", description: "Intercept cancel with stats + 30% discount for 3 months.", prerequisites: ["Set discount percentage and duration for save offers"] },
    ],
    tools: [
      { name: "Supabase", have: true },
      { name: "Resend", have: true, note: "For weekly reports and check-in emails" },
      { name: "Twilio SMS", have: true, note: "For re-engagement texts" },
      { name: "Stripe", have: false, note: "Cancel-save flow needs Stripe integration first" },
      { name: "Vercel Cron", have: true },
    ],
    estimateHours: 6,
  },
  {
    id: "upsell-prompts",
    name: "Usage-Based Upsell Prompts",
    phase: "retain",
    difficulty: "easy",
    description: "Trigger upgrade prompts when roofers hit plan limits or demonstrate high engagement. Smart, contextual — never annoying.",
    whyAutonomous: "Expansion revenue without sales calls. The product sells itself by showing value at the moment the roofer is most likely to say yes.",
    approvalCheckpoint: "Set trigger thresholds and approve upsell copy",
    dependencies: ["stripe-billing", "dashboard-editing"],
    diagramNodes: ["Monitor Usage", "Hit Threshold", "Show Contextual Prompt", "One-Click Upgrade", "Activate Feature"],
    steps: [
      { title: "Define upsell triggers", description: "Config: trigger condition → upsell message → target plan. e.g., leads >= 5 && plan === 'free' → 'Unlock SMS auto-reply' → Pro", prerequisites: ["Decide trigger thresholds for each upsell", "Write upsell copy for each trigger"] },
      { title: "Build trigger evaluation cron", description: "Daily cron checks each contractor against triggers. Queues prompts. Never shows same prompt twice.", prerequisites: [] },
      { title: "Build upsell prompt component", description: "Non-intrusive dashboard banner: what they'd unlock, current usage, one-click upgrade button.", prerequisites: [] },
      { title: "Build prompt management UI", description: "Admin view: which prompts firing, conversion rates, adjust thresholds.", prerequisites: [] },
    ],
    tools: [
      { name: "Stripe", have: false, note: "Needs Stripe for one-click upgrade" },
      { name: "Supabase", have: true },
      { name: "Dashboard", have: true, note: "Banner component renders in dashboard layout" },
      { name: "Vercel Cron", have: true },
    ],
    estimateHours: 4,
  },
];

// === MERGE FUNCTION ===
// Combines static registry data with live DB state for the UI

export function mergeWithDbState(
  dbWorkflows: DbWorkflowStatus[],
  dbSteps: DbStepStatus[]
): MergedWorkflow[] {
  return WORKFLOWS.map((w) => {
    const dbW = dbWorkflows.find((d) => d.workflow_id === w.id);
    const wSteps = dbSteps.filter((s) => s.workflow_id === w.id).sort((a, b) => a.sort_order - b.sort_order);

    const mergedSteps: MergedStep[] = w.steps.map((staticStep, i) => {
      const dbStep = wSteps.find((s) => s.sort_order === i);
      return {
        ...staticStep,
        dbId: dbStep?.id || "",
        sortOrder: i,
        status: dbStep?.status || "pending",
        reviewNotes: dbStep?.review_notes || null,
        contextNotes: dbStep?.context_notes || null,
        buildSummary: dbStep?.build_summary || null,
      };
    });

    return {
      ...w,
      dbStatus: dbW?.status || "not_started",
      dbPriority: dbW?.priority || 50,
      dbCurrentStep: dbW?.current_step || 0,
      mergedSteps,
    };
  });
}

// === HELPERS ===

export function getNextPendingStep(workflow: MergedWorkflow): MergedStep | null {
  return workflow.mergedSteps.find((s) => s.status === "pending") || null;
}

export function getStepInReview(workflow: MergedWorkflow): MergedStep | null {
  return workflow.mergedSteps.find((s) => s.status === "review") || null;
}

export function getBlockingCount(workflowId: string, allWorkflows: MergedWorkflow[]): number {
  // Count how many downstream workflow steps are blocked because this workflow isn't complete
  let count = 0;
  for (const w of allWorkflows) {
    if (w.dependencies.includes(workflowId) && w.dbStatus !== "complete") {
      count += w.mergedSteps.filter((s) => s.status === "pending").length;
    }
  }
  return count;
}

export function getPhaseStats(workflows: MergedWorkflow[]) {
  const phases: WorkflowPhase[] = ["acquire", "convert", "fulfill", "retain"];
  return phases.map((phase) => {
    const items = workflows.filter((w) => w.phase === phase);
    return {
      phase,
      total: items.length,
      complete: items.filter((w) => w.dbStatus === "complete").length,
      inProgress: items.filter((w) => w.dbStatus === "in_progress" || w.dbStatus === "awaiting_review").length,
      notStarted: items.filter((w) => w.dbStatus === "not_started").length,
    };
  });
}
