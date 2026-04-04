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
    description: "Auto-find roofers who need websites. Use Apify Google Search Scraper to find roofers by keyword + city, then Apify Contact Info Scraper to grab email, phone, LinkedIn, Facebook, Instagram. Score and prioritize leads. Human-in-the-loop approval before deep scraping (Vault 057).",
    whyAutonomous: "Without this, you're manually Googling roofers. The machine needs to feed itself — it finds its own prospects, scores them, and queues them for demo generation.",
    approvalCheckpoint: "Approve target cities, scrape volume, and review scraped results before deep contact scraping",
    dependencies: [],
    diagramNodes: ["Pick Target Cities", "Apify Google Scraper", "Results to Airtable/Supabase", "Hannah: Scrape/Reject", "Apify Contact Scraper", "Score & Queue"],
    steps: [
      { title: "Create prospect_leads table in Supabase", description: "Schema: business_name, phone, email, city, state, website_url, linkedin, facebook, instagram, twitter, has_website, website_quality_score, source, status (new/approved/rejected/scraped), scraped_at", prerequisites: [] },
      { title: "Build Apify Google Search scraping route", description: "POST /api/scrape/google — accepts keyword + city + country, calls Apify Google Search Scraper actor. Returns titles, URLs, descriptions. $3.50 per 1000 results, $5/mo free tier. (Vault 057)", prerequisites: ["Create Apify account at apify.com ($5/mo free credits)", "Add APIFY_API_TOKEN to .env"] },
      { title: "Build human-in-the-loop approval UI", description: "Mission Control section showing scraped results: title, URL, description, approve/reject buttons. Only approved prospects get deep-scraped for contact info. Prevents wasted API calls. (Vault 057 pattern)", prerequisites: [] },
      { title: "Build Apify Contact Info scraping route", description: "POST /api/scrape/contacts — takes approved prospect URLs, calls Apify Contact Info Scraper actor. Returns email, phone, LinkedIn, Twitter, Instagram, Facebook. (Vault 057)", prerequisites: [] },
      { title: "Build prospect scoring logic", description: "Deterministic scoring (Vault 060): no website (40pts), bad website (20pts), no online estimates (30pts), few reviews (15pts), large service area (10pts). Tier: Gold/Silver/Bronze.", prerequisites: [] },
      { title: "Build cron job for scheduled scraping", description: "Daily cron via Vercel Cron that processes queued cities and scrapes new prospects automatically", prerequisites: [] },
      { title: "Build admin UI for managing target cities", description: "Section in Mission Control to add/remove target cities, set scrape frequency, view prospect pipeline with counts per status", prerequisites: [] },
    ],
    tools: [
      { name: "Supabase", have: true, note: "Database for prospect storage" },
      { name: "Apify", have: false, note: "Need account — $5/mo free tier covers ~1400 Google results (Vault 057)" },
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
    description: "Auto-generate personalized prospect preview sites for each scraped roofer. Uses their real business name, city, and phone from scraped data. Batch-creates 10-50 sites at a time. The demo IS the lead magnet — way more powerful than a generic cold email (Vault 057).",
    whyAutonomous: "Prospect preview system already exists — this just wires it to the scraping pipeline so demos generate without you lifting a finger.",
    approvalCheckpoint: "Review batch before generation (spot-check names, cities)",
    dependencies: ["roofer-scraping"],
    diagramNodes: ["Pull from Prospect Queue", "Generate Site Data", "Create Preview Pages", "Store Preview URLs", "Mark Ready for Outreach"],
    steps: [
      { title: "Build batch generation API route", description: "POST /api/prospects/generate-batch — takes prospect IDs, creates prospect_contractors entries with auto-generated site data using existing preview system", prerequisites: [] },
      { title: "Wire prospect data to template defaults", description: "Map scraped business_name, phone, city, state to contractor fields. Auto-select template based on scoring. Generate smart defaults (headline, about text, services)", prerequisites: [] },
      { title: "Build batch approval UI", description: "Table in Mission Control showing queued prospects with preview links. 'Approve Batch' button generates all at once. Spot-check before sending.", prerequisites: [] },
      { title: "Add generation status tracking", description: "Track: queued → generating → ready → sent on each prospect. Show counts in Mission Control.", prerequisites: [] },
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
    description: "3-email sequence with AI-personalized copy. Email 1: 'I built your free website' + preview link. Email 2: value nudge with competitor stats. Email 3: urgency + last chance. Each email references specific details from the roofer's website via Perplexity research (Vault 059). HTML emails with professional signature (Vault 059).",
    whyAutonomous: "Outreach is the #1 thing founders do manually and burn out on. This makes it a cron job — the system sends emails on schedule, you just approve the templates.",
    approvalCheckpoint: "Approve email templates, send schedule, and review AI-generated drafts before first batch",
    dependencies: ["bulk-demo-generation"],
    diagramNodes: ["Ready Prospects", "Perplexity Research", "AI Write Email + Subject", "Human Review", "Send Email #1", "Wait 3 Days", "Send #2", "Wait 4 Days", "Send #3"],
    steps: [
      { title: "Create email_sequences table", description: "Schema: prospect_id, sequence_position (1-3), template_id, subject_line, email_html, scheduled_at, sent_at, opened_at, clicked_at, status", prerequisites: [] },
      { title: "Build Perplexity research step", description: "For each prospect, call Perplexity API to find 5-10 facts: awards, years in business, Trustpilot score, recent news. Store as prospect_research in DB. (Vault 059)", prerequisites: ["Get Perplexity API key at perplexity.ai", "Add PERPLEXITY_API_KEY to .env"] },
      { title: "Build AI email generation", description: "Claude/GPT writes personalized email per prospect using: website summary + Perplexity research + RuufPro service description + preview link. Also generates subject line (<60 chars). (Vault 057/059 prompts)", prerequisites: ["Add ANTHROPIC_API_KEY to .env (already have for Tier 2 events)"] },
      { title: "Build human review queue", description: "AI-generated emails land in Mission Control for review before sending. Approve/edit/reject per email. Batch approve for trusted templates. (Vault 057 human-in-the-loop pattern)", prerequisites: [] },
      { title: "Design 3 HTML email templates", description: "Professional HTML with signature block (photo, name, socials, phone). Email 1: value-first intro. Email 2: competitor comparison. Email 3: urgency close. (Vault 059 template)", prerequisites: ["Review and approve email copy/templates before they go live"] },
      { title: "Build email sending API route", description: "POST /api/outreach/send-email — sends via Resend, logs to email_sequences table, handles personalization", prerequisites: [] },
      { title: "Build sequence cron job", description: "Runs daily: finds prospects due for next email in sequence, sends batch, advances sequence position. Respects daily send limits.", prerequisites: [] },
      { title: "Build sequence management UI", description: "View active sequences, pause/resume, edit templates, see send queue. Mission Control integration.", prerequisites: [] },
    ],
    tools: [
      { name: "Resend", have: true, note: "Already configured for lead notifications" },
      { name: "Perplexity API", have: false, note: "For deep research on each prospect (Vault 059)" },
      { name: "Anthropic API", have: false, note: "For AI email generation — Claude writes better cold emails than GPT (Vault 058/059)" },
      { name: "Supabase", have: true },
      { name: "Vercel Cron", have: true },
    ],
    estimateHours: 7,
  },
  {
    id: "video-outreach",
    name: "Personalized Video Outreach",
    phase: "acquire",
    difficulty: "medium",
    description: "Auto-generate personalized video per prospect: record their current website scrolling + AI voice-clone narration referencing their specific business. Pattern-interrupting outreach that doubles response rates. (Vault 058)",
    whyAutonomous: "Video converts highest but takes longest manually. This makes personalized video a cron job — input a URL, get a unique video with your voice and their website.",
    approvalCheckpoint: "Approve voice clone sample, review first batch of generated videos",
    dependencies: ["roofer-scraping"],
    diagramNodes: ["Prospect URL", "Screenshot One: Record Homepage", "Claude: Write 80-word Script", "ElevenLabs: Voice Clone", "Creatomate: Render Video", "Attach to Email"],
    steps: [
      { title: "Set up ElevenLabs voice clone", description: "Upload voice samples to ElevenLabs, create a cloned voice. Get API key.", prerequisites: ["Record 3-5 minutes of your voice speaking naturally", "Create ElevenLabs account and clone your voice", "Add ELEVENLABS_API_KEY to .env"] },
      { title: "Set up Screenshot One API", description: "Scrolling screenshot API — records prospect's homepage as a 30-second video. Free tier available.", prerequisites: ["Create Screenshot One account", "Add SCREENSHOT_ONE_API_KEY to .env"] },
      { title: "Build script generation route", description: "POST /api/outreach/generate-script — Claude writes 80-100 word personalized script per prospect using website summary. Opens with intro, references 2 specific observations, closes with soft CTA. (Vault 058)", prerequisites: [] },
      { title: "Build video rendering pipeline", description: "Orchestrate: Screenshot One records homepage → ElevenLabs narrates script → Creatomate composites video + audio + text overlay (prospect name). Store final video URL.", prerequisites: ["Create Creatomate account", "Add CREATOMATE_API_KEY to .env"] },
      { title: "Build video review queue", description: "Generated videos queue in Mission Control for review before sending. Play preview, approve/reject.", prerequisites: [] },
    ],
    tools: [
      { name: "ElevenLabs", have: false, note: "Voice cloning API — free tier available" },
      { name: "Screenshot One", have: false, note: "Scrolling screenshot API — free tier available" },
      { name: "Creatomate", have: false, note: "Video rendering API — free credits to start, ~10 cents/video" },
      { name: "Anthropic API", have: false, note: "For script generation" },
      { name: "Supabase", have: true },
    ],
    estimateHours: 6,
  },
  {
    id: "visual-outreach-assets",
    name: "AI Visual Outreach Assets",
    phase: "acquire",
    difficulty: "easy",
    description: "Generate personalized before/after images per prospect: their current (bad/missing) website vs a beautiful RuufPro site with their name on it. Attach to cold emails for visual proof. Uses Nano Banana Pro via API. ~10 cents/image. (Vault 061)",
    whyAutonomous: "Visual proof beats text claims. A side-by-side showing what their online presence COULD look like is devastating. AI generates these at scale.",
    approvalCheckpoint: "Approve image template/style, review first batch",
    dependencies: ["roofer-scraping"],
    diagramNodes: ["Prospect Data", "Screenshot Current Site", "Generate RuufPro Preview", "Nano Banana: Composite Image", "Store in DB", "Attach to Email"],
    steps: [
      { title: "Build before/after image pipeline", description: "Screenshot prospect's current website (or 'no website found' placeholder) → screenshot their RuufPro preview site → composite side-by-side with prospect business name as headline. (Vault 061)", prerequisites: ["Create Krea.ai account for Nano Banana API access", "Add KREA_API_KEY to .env"] },
      { title: "Design image template", description: "JSON prompt template: left side = current site, right side = RuufPro site, text overlay = business name + 'Your website could look like this'. Consistent style per batch.", prerequisites: [] },
      { title: "Build batch image generation", description: "Process all approved prospects, generate image per prospect, store URL in prospect_leads table. Polling loop for render completion. (Vault 061 pattern)", prerequisites: [] },
      { title: "Wire to email templates", description: "Email template includes inline image or linked preview. Before/after image as the hero of Email 1.", prerequisites: [] },
    ],
    tools: [
      { name: "Krea.ai (Nano Banana API)", have: false, note: "Free credits to start, ~10 cents per generation" },
      { name: "Screenshot One", have: false, note: "For capturing current prospect websites" },
      { name: "Supabase", have: true },
    ],
    estimateHours: 4,
  },
  {
    id: "outreach-tracking",
    name: "Outreach Analytics & Auto-Follow-Up",
    phase: "acquire",
    difficulty: "medium",
    description: "Track email opens, preview page views, video watches, and link clicks. Auto-categorize prospects (cold, warm, hot) based on engagement. Trigger follow-up actions: hot prospects get a text, warm get email #2 faster, cold get dropped after sequence. Human-in-the-loop approval before any SMS goes out. (Vault 057 pattern)",
    whyAutonomous: "Without tracking, you're sending into the void. This closes the loop — every outreach action has a measurable outcome that feeds the next action.",
    approvalCheckpoint: "Review weekly outreach report (sent, opened, clicked, converted)",
    dependencies: ["cold-email-sequences"],
    diagramNodes: ["Track Opens/Clicks/Views", "Score Engagement", "Categorize (Hot/Warm/Cold)", "Trigger Actions", "Weekly Report"],
    steps: [
      { title: "Add open/click tracking to emails", description: "Embed tracking pixel for opens. Wrap links with redirect through /api/outreach/track/[token] for click tracking.", prerequisites: [] },
      { title: "Build engagement scoring", description: "Deterministic scoring (Vault 060): opened (+10), clicked preview (+30), watched video (+40), visited multiple pages (+20), returned (+15). Gold (50+), Silver (20-49), Bronze (<20).", prerequisites: [] },
      { title: "Wire preview page view tracking", description: "The /preview/[slug] route already tracks views via /api/preview-track. Connect this to the prospect scoring pipeline.", prerequisites: [] },
      { title: "Build auto-follow-up triggers", description: "Gold prospects: auto-send SMS via Twilio ('Someone just viewed your free website — claim it before someone else does'). Silver: accelerate email sequence. Bronze after 3 emails: mark as no_response.", prerequisites: [] },
      { title: "Build weekly report generation", description: "Cron job generates weekly summary: emails sent, opens, clicks, video watches, conversions, hot prospects. Posts to Mission Control activity feed.", prerequisites: [] },
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
  {
    id: "lead-scoring",
    name: "Lead Scoring & Qualification",
    phase: "acquire",
    difficulty: "easy",
    description: "Deterministic scoring engine for incoming leads — not AI/probabilistic. Onboarding form answers map to weighted scores: jobs/month, current website quality, revenue range. Gold tier gets instant attention, Silver gets automated sequence, Bronze gets nurture only. (Vault 060)",
    whyAutonomous: "Stops you from wasting time on tire-kickers. The system decides who's worth a phone call and who gets an automated drip — before any human looks at the lead.",
    approvalCheckpoint: "Set scoring weights and tier thresholds",
    dependencies: [],
    diagramNodes: ["Lead Submits Form", "Code Module: Score", "Assign Tier", "Route: Gold → Call, Silver → Sequence, Bronze → Nurture"],
    steps: [
      { title: "Add qualifying questions to onboarding", description: "Add 2 optional fields: 'How many jobs do you do per month?' (dropdown: 1-5, 6-15, 16-30, 30+) and 'Do you currently get leads from your website?' (yes/no/no website). Store on contractors table.", prerequisites: ["Decide which qualifying questions to ask"] },
      { title: "Build deterministic scoring function", description: "Code-based scoring (NOT AI): jobs_per_month weight 0.4 + has_website weight 0.3 + engagement weight 0.3. Returns numeric score + tier (Gold/Silver/Bronze). Same input always gives same output. (Vault 060)", prerequisites: ["Set scoring weights and tier thresholds"] },
      { title: "Build lead routing logic", description: "Gold: flag for immediate attention + push notification to Hannah. Silver: enter automated email sequence with Loom/preview link. Bronze: nurture-only drip. All automatic.", prerequisites: [] },
      { title: "Add scoring dashboard to Mission Control", description: "Show lead pipeline by tier, conversion rates per tier, adjust thresholds. Business Pulse gets new metric: 'Gold Leads This Week'.", prerequisites: [] },
    ],
    tools: [
      { name: "Supabase", have: true },
      { name: "Push Notifications", have: true, note: "Already configured for lead alerts" },
      { name: "Resend", have: true, note: "For automated sequences" },
    ],
    estimateHours: 3,
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
