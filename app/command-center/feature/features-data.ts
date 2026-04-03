export type FeatureStatus = "complete" | "in_progress" | "planned";

export interface FeatureTodoStep {
  text: string;
  done: boolean;
}

export interface FeatureDefinition {
  slug: string;
  name: string;
  status: FeatureStatus;
  businessSummary: string;
  rooferValue: string;
  revenueImpact: string;
  liveLinks: { label: string; href: string }[];
  technical: {
    stack: string;
    routes: string[];
    database: string[];
    keyFiles: string[];
    notes: string;
  };
  // Visual diagram (ASCII art) showing how the feature works
  diagram?: string;
  // Lifecycle: what keeps this feature running day-to-day
  lifecycle?: {
    trigger: string;       // What kicks it off
    flow: string[];        // Step-by-step what happens
    automation: string;    // What runs without human input
    humanInput: string;    // What still needs a person
  };
  // Safety: how we keep the automation from breaking
  safety?: {
    monitoring: string;    // How we know if it's working
    failureMode: string;   // What happens when it breaks
    recovery: string;      // How to fix it
    limits: string;        // Rate limits, quotas, costs
  };
  // For planned/in-progress features
  requirements?: string;
  vaultReasoning?: string;
  buildSteps?: FeatureTodoStep[];
}

export const FEATURES: FeatureDefinition[] = [
  // ===== COMPLETE =====
  {
    slug: "estimate-widget",
    name: "Estimate Widget V4",
    status: "complete",
    businessSummary: "A 7-step interactive calculator that homeowners use to get instant roofing estimates. Roofers set their pricing per material (asphalt, metal, tile, flat), and the widget uses satellite/solar data to calculate roof area automatically. Generates PDF reports with digital signatures.",
    rooferValue: "Roofers convert more leads because homeowners get instant pricing without waiting for a callback. Solves the #1 pain point: 'I lose leads because I can't respond fast enough.' Also satisfies Google's Online Estimates filter — roofers without this are being hidden from 1 in 5 searches.",
    revenueImpact: "This is the $99/mo paid product. Every roofer paying for RuufPro is paying for this widget. It's also what differentiates from competitors — Roofle charges $350/mo for a similar widget.",
    liveLinks: [
      { label: "Widget Preview", href: "/widget-preview" },
      { label: "Widget Compare (V1-V4)", href: "/widget-compare" },
      { label: "Living Estimate Demo", href: "/estimate" },
    ],
    technical: {
      stack: "React, Google Solar API, Google Maps API, RentCast API, React-PDF",
      routes: ["/widget/[contractorId]", "/estimate/[token]", "/api/estimate", "/api/living-estimate", "/api/living-estimate/update", "/api/living-estimate/share", "/api/living-estimate/sign", "/api/living-estimate/pdf", "/api/report"],
      database: ["estimates", "living_estimates", "estimate_signatures", "roof_data_cache", "property_cache"],
      keyFiles: ["components/estimate-widget-v4.tsx", "lib/estimate.ts", "lib/solar-api.ts", "lib/rentcast-api.ts", "components/signed-estimate.tsx", "components/signature-pad.tsx"],
      notes: "V4 is production. V1 = iframe embed, V2 = archived, V3 = shared generic. Living estimates allow homeowners to compare Good/Better/Best materials, toggle add-ons, share via email, and sign digitally."
    },
  },
  {
    slug: "lead-capture",
    name: "Lead Capture (Contact Form)",
    status: "complete",
    businessSummary: "Every roofer website includes a contact form that captures homeowner leads. When a lead submits, the roofer gets an instant email notification via Resend. Leads appear in the dashboard with temperature (hot/warm/browsing), timeline, and source tracking.",
    rooferValue: "Roofers never miss a lead from their website. Every form submission is captured, categorized, and delivered to their inbox immediately. This replaces the 'contact us and we'll get back to you' dead end.",
    revenueImpact: "Part of the free website — it's what makes the free site valuable enough to attract roofers. Also feeds the dashboard (paid feature) with data.",
    liveLinks: [
      { label: "Demo Site Contact Form", href: "/demo" },
      { label: "Dashboard Leads View", href: "/dashboard/leads" },
    ],
    technical: {
      stack: "Next.js API routes, Supabase, Resend email",
      routes: ["/api/notify", "/dashboard/leads"],
      database: ["leads"],
      keyFiles: ["app/api/notify/route.ts", "app/dashboard/leads/page.tsx"],
      notes: "Leads are typed by source (contact_form, estimate_widget, external_widget), status (new, contacted, quoted, won, lost), temperature, and timeline."
    },
  },
  {
    slug: "sms-twilio",
    name: "SMS / Twilio 10DLC",
    status: "complete",
    businessSummary: "Full SMS infrastructure with Twilio: 10DLC brand registration (required for US business texting), send/receive messages, missed-call text-back, and review request automation. Dashboard shows registration progress and message history.",
    rooferValue: "When a roofer misses a call (they're on the roof), the system automatically texts the homeowner: 'Sorry we missed you! Here's a link to book an estimate.' Saves leads that would otherwise go to a competitor. Also auto-sends review requests after job completion.",
    revenueImpact: "Speed-to-lead auto-reply is a $149/mo add-on. Review automation is $99/mo. Both use this SMS infrastructure.",
    liveLinks: [
      { label: "SMS Dashboard", href: "/dashboard/sms" },
    ],
    technical: {
      stack: "Twilio, Next.js API routes, Supabase",
      routes: ["/api/sms/send", "/api/sms/register", "/api/sms/resend-otp", "/api/sms/webhook", "/api/sms/voice-webhook", "/api/sms/webhook/trusthub-status", "/api/cron/check-10dlc-status"],
      database: ["sms_messages", "sms_workflows", "sms_consent"],
      keyFiles: ["lib/twilio.ts", "lib/twilio-10dlc.ts", "lib/sms-workflows.ts", "app/dashboard/sms/page.tsx"],
      notes: "10DLC registration is a multi-step process (Trust Profile → Brand Registration → Campaign Approval → Active). Cron job polls Twilio for status updates."
    },
  },
  {
    slug: "review-automation",
    name: "Review Automation",
    status: "complete",
    businessSummary: "After a roofing job is marked complete, automatically sends an SMS to the homeowner asking for a review. Tracks when they click the review link. Infrastructure for Google review response automation.",
    rooferValue: "More Google reviews = higher Maps ranking = more leads. Most roofers never ask for reviews. This does it automatically. Each 5-star review with keywords like 'roof replacement [city]' is SEO gold.",
    revenueImpact: "Part of the $99/mo review automation add-on. The vault [052] shows this alone can justify the monthly fee. Could be expanded into the full sentiment-based review system from vault entry 052.",
    liveLinks: [
      { label: "SMS & Reviews Dashboard", href: "/dashboard/sms" },
    ],
    technical: {
      stack: "Twilio SMS, Supabase, Next.js API",
      routes: ["/api/reviews/request", "/api/reviews/track/[token]", "/api/cron/review-followups"],
      database: ["reviews"],
      keyFiles: ["app/api/reviews/request/route.ts", "app/api/reviews/track/[token]/route.ts"],
      notes: "Currently sends review request + tracks clicks. Future: sentiment detection, AI-drafted SEO reviews, auto-response to all Google reviews (per vault 052)."
    },
  },
  {
    slug: "push-notifications",
    name: "Push Notifications",
    status: "complete",
    businessSummary: "Web push notifications alert roofers instantly when a new lead comes in, even if they don't have the dashboard open. Works on desktop and mobile browsers.",
    rooferValue: "Roofers on a job site get a push notification on their phone the moment a homeowner submits a form. Speed-to-lead is everything — the first roofer to respond wins 78% of the time.",
    revenueImpact: "Part of the free dashboard experience — increases perceived value and retention.",
    liveLinks: [
      { label: "Dashboard (enable notifications)", href: "/dashboard" },
    ],
    technical: {
      stack: "Web Push API, VAPID keys, Service Worker",
      routes: ["/api/push/subscribe", "/api/push/send"],
      database: ["push_subscriptions"],
      keyFiles: ["app/api/push/subscribe/route.ts", "app/api/push/send/route.ts", "public/sw.js"],
      notes: "Uses VAPID keys for authentication. Service worker registered on dashboard load."
    },
  },
  {
    slug: "property-intelligence",
    name: "Property Intelligence",
    status: "complete",
    businessSummary: "When a homeowner enters their address in the estimate widget, RuufPro pulls satellite data (roof area, pitch, segments) from Google Solar API and property details from RentCast. This gives instant, accurate estimates without a site visit.",
    rooferValue: "Roofers can provide accurate estimates in seconds instead of scheduling a site visit. Homeowners are impressed by the instant accuracy, increasing conversion rates.",
    revenueImpact: "Core technology that makes the estimate widget accurate and impressive. Without this, estimates would just be generic calculators.",
    liveLinks: [],
    technical: {
      stack: "Google Solar API, RentCast API, Supabase caching",
      routes: ["/api/property-intel"],
      database: ["roof_data_cache", "property_cache"],
      keyFiles: ["lib/solar-api.ts", "lib/rentcast-api.ts", "app/api/property-intel/route.ts"],
      notes: "Results are cached in Supabase to avoid repeated API calls for the same address. Solar API provides roof geometry and sun exposure data."
    },
  },
  {
    slug: "digital-signatures",
    name: "Digital Signatures",
    status: "complete",
    businessSummary: "Homeowners can digitally sign estimates on their phone or computer. Captures signature data, signer name, email, and timestamp. Signed estimates can be downloaded as PDF.",
    rooferValue: "Close deals faster — homeowner reviews the estimate, picks their materials, signs on the spot. No printing, scanning, or mailing. Professional and modern.",
    revenueImpact: "Part of the living estimate experience. Increases conversion from 'browsing' to 'signed' by removing friction.",
    liveLinks: [],
    technical: {
      stack: "Canvas-based signature capture, React-PDF",
      routes: ["/api/living-estimate/sign"],
      database: ["estimate_signatures"],
      keyFiles: ["components/signature-pad.tsx", "components/signed-estimate.tsx"],
      notes: "Signature stored as canvas data URL. Snapshot of estimate at signing time preserved for legal purposes."
    },
  },
  {
    slug: "living-estimates",
    name: "Living Estimates",
    status: "complete",
    businessSummary: "Interactive proposal pages shared with homeowners via email link. They can compare Good/Better/Best material options (with warranty, wind rating, lifespan, price ranges), toggle add-ons, see prices update live, share with their spouse, and sign.",
    rooferValue: "Replaces the PDF estimate email that homeowners ignore. Instead, they get an interactive page where they can explore options and self-close. Spouses can be looped in with one click.",
    revenueImpact: "Premium feature of the estimate widget. Makes RuufPro estimates feel like a $10K custom tool, not a $99/mo widget.",
    liveLinks: [],
    technical: {
      stack: "Next.js dynamic pages, Supabase real-time, React-PDF, Resend",
      routes: ["/estimate/[token]", "/api/living-estimate", "/api/living-estimate/update", "/api/living-estimate/share", "/api/living-estimate/sign", "/api/living-estimate/pdf"],
      database: ["living_estimates", "estimate_signatures"],
      keyFiles: ["app/estimate/[token]/page.tsx"],
      notes: "Share tokens are unique per estimate. Estimates track selected material, add-ons, signature status. PDF generation uses React-PDF renderer."
    },
  },
  {
    slug: "pdf-reports",
    name: "PDF Estimate Reports",
    status: "complete",
    businessSummary: "Professional PDF reports generated from estimate data. Include contractor branding, material breakdown, pricing, add-ons, and digital signatures. Downloadable by both the roofer and homeowner.",
    rooferValue: "Roofers look professional without doing any design work. Branded PDFs make a $99/mo tool feel like a premium service.",
    revenueImpact: "Part of the estimate widget value prop. Professional output justifies the monthly cost.",
    liveLinks: [],
    technical: {
      stack: "React-PDF Renderer (@react-pdf/renderer)",
      routes: ["/api/report", "/api/living-estimate/pdf"],
      database: [],
      keyFiles: ["app/api/report/route.ts", "components/signed-estimate.tsx"],
      notes: "Two PDF endpoints: legacy report from widget and living estimate PDF with signature support."
    },
  },
  {
    slug: "prospect-preview",
    name: "Prospect Preview Sites",
    status: "complete",
    businessSummary: "Personalized preview pages for cold email prospects. Shows their business name on a RuufPro-powered site with a 'Claim This Site' banner. Tracks page views to measure engagement.",
    rooferValue: "N/A — this is a sales tool for acquiring roofer customers, not a roofer-facing feature.",
    revenueImpact: "This IS the demo-as-lead-magnet (Play 1). When you build a roofer's site and send it to them, this is what they see. The 'Claim This Site' CTA converts them from prospect to customer.",
    liveLinks: [
      { label: "Preview Route", href: "/preview" },
    ],
    technical: {
      stack: "Next.js dynamic pages, Supabase",
      routes: ["/preview/[slug]", "/api/claim-site", "/api/preview-track"],
      database: ["prospect_contractors"],
      keyFiles: ["app/preview/[slug]/page.tsx", "app/api/claim-site/route.ts", "app/api/preview-track/route.ts"],
      notes: "Uses prospect_contractors table (is_prospect = true). No RuufPro branding shown. Preview tracks pageviews for analytics."
    },
  },
  {
    slug: "website-generator",
    name: "Website Generator (5 Templates + Onboarding v3)",
    status: "complete",
    businessSummary: "Roofers enter 4 fields (name, phone, city, design style) and the system magic-generates a complete site with smart defaults. Then they enter a full edit mode with template picker, hero editor, services chips, trust signal toggles, about textarea, and city tag input — all with a live preview showing the REAL template at 0.32 scale. 5 complete templates: Modern Clean, Chalkboard, Forge, Blueprint, Classic.",
    rooferValue: "A professional website in 2 minutes with zero design or technical skills. The 3-screen onboarding (simple form → magic generation → full edit mode) means roofers launch with a COMPLETE site, not an empty shell. Live preview builds confidence — they see exactly what they're getting.",
    revenueImpact: "The free website is what gets roofers in the door. It's the top of the funnel for all paid features. Competitors charge $500-3,000+ for this.",
    liveLinks: [
      { label: "Modern Clean Demo", href: "/demo" },
      { label: "Forge Demo", href: "/demo/forge" },
      { label: "Onboarding Flow", href: "/onboarding" },
    ],
    technical: {
      stack: "Next.js, Tailwind CSS, Framer Motion, dynamic [slug] routing",
      routes: ["/site/[slug]", "/site/[slug]/services", "/site/[slug]/services/[service]", "/onboarding"],
      database: ["contractors", "sites"],
      keyFiles: ["app/onboarding/page.tsx", "components/onboarding/live-preview.tsx", "components/templates/modern-clean.tsx", "components/templates/chalkboard.tsx", "components/templates/forge.tsx", "components/templates/blueprint.tsx", "components/templates/classic.tsx", "components/contractor-sections/", "lib/themes.ts", "lib/defaults.ts"],
      notes: "Onboarding v3: 3-screen flow with magic generation + full edit mode. Live preview uses IntersectionObserver for scroll sync. handlePublish saves all fields (hero headline, CTA, services, trust signals, about, cities). Service sub-pages auto-create from selected services. Auth bypass active for dev (search 'preview-mode' — REVERT before deploy). Templates compose reusable sections from components/contractor-sections/. JSON-LD structured data for SEO."
    },
  },
  {
    slug: "widget-embed",
    name: "Widget Embed System",
    status: "complete",
    businessSummary: "Roofers can embed the estimate widget on their existing website (if they have one) using a simple script tag or iframe. The widget settings page provides the embed code.",
    rooferValue: "Roofers who already have a website they like can still use the estimate widget without switching to RuufPro's generated site.",
    revenueImpact: "Expands the addressable market — roofers who won't switch websites can still pay $99/mo for just the widget.",
    liveLinks: [
      { label: "Widget Settings", href: "/dashboard/estimate-settings" },
    ],
    technical: {
      stack: "Next.js, iframe embed",
      routes: ["/widget/[contractorId]", "/dashboard/estimate-settings"],
      database: [],
      keyFiles: ["app/widget/[contractorId]/page.tsx", "app/dashboard/estimate-settings/page.tsx"],
      notes: "Hosted widget page renders EstimateWidget component for specified contractor. Embed code generated in estimate-settings page."
    },
  },

  // ===== IN PROGRESS =====
  {
    slug: "leads-management",
    name: "Leads Management Page",
    status: "in_progress",
    businessSummary: "Full leads table in the dashboard with filtering, sorting, status updates, and detailed lead views. Roofers can manage their entire pipeline from one screen.",
    rooferValue: "Replaces spreadsheets and sticky notes. Roofers see all leads, filter by status (new, contacted, quoted, won, lost), and update pipeline in real-time.",
    revenueImpact: "Core dashboard feature — makes the paid experience sticky. Roofers who rely on this for pipeline management don't churn.",
    liveLinks: [
      { label: "Dashboard Leads", href: "/dashboard/leads" },
    ],
    technical: {
      stack: "Next.js, Supabase, Tailwind",
      routes: ["/dashboard/leads"],
      database: ["leads"],
      keyFiles: ["app/dashboard/leads/page.tsx"],
      notes: "Page exists but needs polish — filtering, bulk actions, and detailed lead view need completion."
    },
    requirements: "Full CRUD for leads: filter by status/source/date, bulk status updates, detailed lead view with contact history, one-click call/text actions.",
    vaultReasoning: "Gal [019] emphasizes 'action dashboards' — one-click reactivation, follow-up, notifications. The leads page should let roofers ACT, not just observe. James [023]: 'speed-to-lead' is everything.",
    buildSteps: [
      { text: "Add column sorting and status filter dropdowns", done: false },
      { text: "Add detailed lead view panel (click to expand)", done: false },
      { text: "Add one-click actions: call, text, update status", done: false },
      { text: "Add bulk status update for multiple leads", done: false },
      { text: "Add date range filter", done: false },
      { text: "Test with demo data and polish responsive layout", done: false },
    ],
  },
  {
    slug: "command-center",
    name: "Command Center Dashboard",
    status: "in_progress",
    businessSummary: "Admin-only business dashboard for tracking revenue plays, outreach, vault insights, site builds, and overall business progress. This page.",
    rooferValue: "N/A — internal tool for business management.",
    revenueImpact: "Indirectly drives everything by keeping strategy organized and execution tracked.",
    liveLinks: [
      { label: "Command Center", href: "/command-center" },
    ],
    technical: {
      stack: "Next.js, Supabase, Tailwind",
      routes: ["/command-center", "/api/command-center/*"],
      database: ["command_plays", "command_positioning", "command_motivation", "command_advisor", "command_outreach", "command_wins", "command_project_status", "command_site_kanban", "command_todos"],
      keyFiles: ["app/command-center/page.tsx", "lib/command-center.ts"],
      notes: "Auth-guarded to admin email only. Currently in active development."
    },
    requirements: "Complete all tabs: Overview (approval queue + stats), To-Do, Plays, Sites, Outreach, Vault, Project Status, Research, Positioning, Motivation. Run migrations. Deploy.",
    vaultReasoning: "This is the operational backbone. The vault [041] executive assistant concept + [006] Taproot session memory concept, adapted for business management instead of coding.",
    buildSteps: [
      { text: "Run Supabase migrations (021-024)", done: false },
      { text: "Seed data (plays, positioning, motivation, project status)", done: false },
      { text: "Set NEXT_PUBLIC_ADMIN_EMAIL in env", done: true },
      { text: "Re-enable auth guard", done: true },
      { text: "Build all 11 tabs (Overview, Inbox, To-Do, Plays, Sites, Outreach, Vault, Project Status, Research, Positioning, Motivation)", done: true },
      { text: "Add feature detail pages with business context, technical docs, and build steps", done: true },
      { text: "Rework remaining sections with collaborative approval pattern", done: false },
      { text: "Deploy to Vercel", done: false },
    ],
  },

  // ===== PLANNED =====
  {
    slug: "seo-city-pages",
    name: "SEO City Pages",
    status: "planned",
    businessSummary: "Auto-generated pages like 'Roof Replacement in Tampa' and 'Storm Damage Repair in Orlando' for each roofer's service area. Each page is SEO-optimized to rank for '[service] in [city]' searches.",
    rooferValue: "Roofers rank for dozens of local search terms without writing a single word. Each city page is a new opportunity to capture homeowners searching for roofing services in their area.",
    revenueImpact: "$149/mo add-on. Compounds over time — more pages = more rankings = more leads. Creates long-term lock-in because SEO results take months to build and roofers won't want to lose them.",
    liveLinks: [],
    technical: {
      stack: "Next.js dynamic routes, Supabase, SEO metadata",
      routes: ["/site/[slug]/[city]"],
      database: ["sites (service_area_cities)"],
      keyFiles: [],
      notes: "Framework exists (service_area_cities on contractors table). Needs template for city pages, content generation, and SEO metadata."
    },
    requirements: "Auto-generate one page per city in the roofer's service area. Each page needs: unique H1 targeting '[service] in [city]', 300-500 words of localized content, embedded estimate widget, local trust signals, internal links to other city pages. Must be SEO-optimized with meta tags, JSON-LD, and canonical URLs.",
    vaultReasoning: "Programmatic SEO [042] shows the pattern: auto-generate content at scale with quality controls. The 8-step conversion blueprint [050] applies to each city page. Google Estimates filter research shows roofers need online presence in EVERY city they serve.",
    buildSteps: [
      { text: "Design city page template with SEO-optimized structure", done: false },
      { text: "Build content generation pipeline (AI-written, localized per city)", done: false },
      { text: "Create dynamic route /site/[slug]/[city]", done: false },
      { text: "Add JSON-LD LocalBusiness schema per city", done: false },
      { text: "Add sitemap generation for all city pages", done: false },
      { text: "Add to dashboard: toggle cities on/off, preview each page", done: false },
      { text: "Test with demo data across 5 cities", done: false },
    ],
  },
  {
    slug: "gbp-sync",
    name: "Google Business Profile Sync",
    status: "planned",
    businessSummary: "Connect a roofer's Google Business Profile to automatically sync business hours, photos, reviews, and service area. Keep the RuufPro website and GBP in sync without manual updates.",
    rooferValue: "Update once, publish everywhere. Roofers hate managing multiple platforms. This makes their online presence consistent with zero effort.",
    revenueImpact: "Part of a premium bundle. Increases perceived value and retention — roofers who sync their GBP are deeply integrated and less likely to churn.",
    liveLinks: [],
    technical: {
      stack: "Google Business Profile API, OAuth2, Supabase",
      routes: [],
      database: [],
      keyFiles: [],
      notes: "Infrastructure preparation exists but no implementation yet. Requires Google Business Profile API access and OAuth flow."
    },
    requirements: "OAuth connection to GBP. Sync: business name, address, phone, hours, photos, reviews, categories, service area. Two-way where possible (RuufPro changes → GBP, GBP reviews → RuufPro). Dashboard UI for managing the connection.",
    vaultReasoning: "Reduces roofer effort (Hormozi value equation [025]: minimize effort/sacrifice). Makes the platform stickier. Review sync pairs with review automation [052] for a complete review management system.",
    buildSteps: [
      { text: "Research Google Business Profile API access and OAuth requirements", done: false },
      { text: "Build OAuth connection flow in dashboard", done: false },
      { text: "Implement one-way sync: GBP → RuufPro (reviews, hours, photos)", done: false },
      { text: "Implement one-way sync: RuufPro → GBP (business info updates)", done: false },
      { text: "Add GBP status card to dashboard", done: false },
      { text: "Test with a real GBP account", done: false },
    ],
  },
  {
    slug: "stripe-billing",
    name: "Stripe Billing / Payments",
    status: "planned",
    businessSummary: "Accept payments for the $99/mo widget and add-ons. Stripe Checkout for signup, Stripe Billing for recurring charges, customer portal for managing subscription.",
    rooferValue: "Seamless upgrade from free to paid. Roofers click 'Upgrade', enter card, done. No invoices, no manual payments.",
    revenueImpact: "THIS IS THE MONEY MACHINE. Without Stripe, you can't collect revenue. Every dollar of MRR flows through this. Priority: critical for revenue.",
    liveLinks: [],
    technical: {
      stack: "Stripe Checkout, Stripe Billing, Stripe Customer Portal, Webhooks",
      routes: [],
      database: ["contractors (stripe_customer_id, stripe_subscription_id, plan)"],
      keyFiles: [],
      notes: "Contractor table already has stripe-related column placeholders. Needs full implementation: checkout session creation, webhook handler for subscription events, customer portal, feature gating based on plan."
    },
    requirements: "Stripe Checkout for initial signup. Stripe Billing for recurring $99/mo (and future tiers). Webhook handler for: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed. Feature gating: free users see the website, paid users get the widget + dashboard features. Customer portal link in settings for managing subscription.",
    vaultReasoning: "Can't reach $50K MRR without a way to charge money. Hormozi [031]: recurring revenue is everything. The vault's pricing psychology suggests testing $199-299 tiers — Stripe makes multi-tier easy. Andy [032] charges $999/mo for a similar bundle.",
    buildSteps: [
      { text: "Create Stripe account and configure products/prices ($99, $199, $299 tiers)", done: false },
      { text: "Build /api/stripe/checkout — create Checkout Session", done: false },
      { text: "Build /api/stripe/webhook — handle subscription lifecycle events", done: false },
      { text: "Build /api/stripe/portal — customer self-service portal", done: false },
      { text: "Add upgrade CTA to dashboard with Stripe Checkout redirect", done: false },
      { text: "Implement feature gating: check subscription status before showing paid features", done: false },
      { text: "Add subscription status to settings page", done: false },
      { text: "Test full flow: signup → checkout → paid → cancel → downgrade", done: false },
    ],
  },
];
