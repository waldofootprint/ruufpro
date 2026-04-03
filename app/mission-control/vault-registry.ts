// Vault registry — knowledge entries from Skool community, frameworks, and research.
// Add new entries here and they'll appear on the LEARN tab automatically.

export interface VaultEntry {
  id: string;           // Unique entry ID (e.g., "031", "skool-2026-04-05")
  title: string;        // Entry title
  speaker: string;      // Who taught/presented this
  source: string;       // "skool" | "research" | "book" | "other"
  date: string;         // YYYY-MM-DD when processed
  hook: string;         // One-line summary — the "why this matters"
  summary: string[];    // Bullet point summary (3-5 bullets)
  details: string[];    // Detailed bullet points (key takeaways, frameworks, specifics)
  diagram?: string;     // ASCII/text diagram or Mermaid syntax (optional)
  links: { label: string; href: string }[];  // Related links (vault entries, features, external)
  tags: string[];       // Categorization tags
  featured: boolean;    // Show in Key Frameworks section
  revenuePlay?: string; // If this maps to a specific revenue play, describe it
}

// ─── All vault entries — newest first ──────────────────────────

export const VAULT_ENTRIES: VaultEntry[] = [
  // ── Recent Entries ──────────────────────────────────────────
  {
    id: "056",
    title: "Enterprise AI Architecture & AI Factories",
    speaker: "Onorio Padron",
    source: "skool",
    date: "2026-04-03",
    hook: "AI fails without operational model change. Productize your consulting — codify, diagnose, prescribe.",
    summary: [
      "Enterprise AI failing because companies implement point solutions without changing ops model",
      "3 AI Factory platforms will dominate: C3, Palantir, IBM Watson X",
      "Big data lakes are dead — virtualize data real-time from source via ontology layer",
      "Onorio productized his consulting: 76 drivers, 7 towers, $250K diagnostic → self-funding use cases",
    ],
    details: [
      "The Solow Paradox: tech benefits don't materialize without operational model redesign — happened with ERP, happening again with AI",
      "Companies buying per-department AI tools see no enterprise ROI — CEO sees millions spent, no aggregate benefit",
      "Data commoditization killed McKinsey's model — you can verify best practices in 15 minutes with AI now",
      "Shell runs 100+ use cases on C3, gets $1B/yr benefit, pays <1% to the platform",
      "Start with 15 top drivers + 2 use cases that each return $1.5M+ — payback in ~13 months",
      "RuufPro parallel: 'Digital Readiness Score' diagnostic that prescribes RuufPro as the fix",
      "Zero latency for roofers: missed call → lost $8K job. RuufPro = zero gap between need and lead capture",
    ],
    links: [
      { label: "Vault Entry 056", href: "/command-center/vault/056" },
      { label: "Related: Selling Software Not Automations", href: "/command-center/vault/010" },
    ],
    tags: ["enterprise", "architecture", "strategy", "consulting", "productization"],
    featured: false,
    revenuePlay: "Productize a 'Digital Readiness Score' for roofers — free diagnostic that prescribes RuufPro. Codify consulting like Onorio's 76-driver framework.",
  },
  {
    id: "055",
    title: "AI Social Media Automation (Telegram Bot)",
    speaker: "Jack",
    source: "skool",
    date: "2026-04-03",
    hook: "Voice/text → Telegram bot → AI orchestrator → platform-specific posts + AI images. Zero manual steps.",
    summary: [
      "Telegram bot as interface — voice or text message triggers full content pipeline",
      "AI orchestrator parses intent, routes to news research + content gen + image gen",
      "Platform-specific output for LinkedIn, X/Twitter, Instagram",
      "Replicate AI models generate custom images per post",
    ],
    details: [
      "No dashboard needed — conversational interface via Telegram",
      "News research layer makes posts timely and relevant, not generic",
      "Each platform gets tailored content: tone, length, hashtags, formatting",
      "End-to-end: idea → research → copy → image → publish with zero manual steps",
      "RuufPro opportunity: 'text us your job photos → we create a social post for you' as premium upsell",
      "Roofers hate creating content but know they need it — this removes all friction",
    ],
    links: [
      { label: "Vault Entry 055", href: "/command-center/vault/055" },
      { label: "Related: Content Repurposing Factory", href: "/command-center/vault/045" },
    ],
    tags: ["automation", "social-media", "content", "telegram", "ai-agents"],
    featured: false,
    revenuePlay: "Premium add-on: roofers text job photos to a bot → auto-generated social posts for Facebook/Instagram. $49-99/mo upsell.",
  },

  // ── Existing Key Frameworks (migrated from hardcoded) ────────
  {
    id: "031",
    title: "$100M Offers — Pricing Psychology",
    speaker: "Hormozi",
    source: "skool",
    date: "2026-01-15",
    hook: "Niching = 100x price. $149 bundle > $99 per feature.",
    summary: [
      "Niche down to charge premium — generic = commodity pricing",
      "Bundle features into a single offer, not à la carte",
      "$149 bundle beats $99/feature every time",
    ],
    details: [
      "The more specific your niche, the more you can charge — 'roofing websites' > 'contractor websites' > 'small business websites'",
      "Bundling creates perceived value that exceeds sum of parts",
      "Price anchoring: show the $299 tier first, $149 feels like a deal",
      "Never compete on price — compete on specificity and outcome",
    ],
    links: [
      { label: "Vault Entry 031", href: "/command-center/vault/031" },
      { label: "Pricing Strategy", href: "/command-center?tab=positioning" },
    ],
    tags: ["pricing", "hormozi", "strategy"],
    featured: true,
    revenuePlay: "Bundle at $149 > individual features at $99. Use niche specificity to justify premium.",
  },
  {
    id: "025",
    title: "Grand Slam Offer — Value Equation",
    speaker: "Hormozi",
    source: "skool",
    date: "2026-01-10",
    hook: "Dream outcome × likelihood ÷ (time delay × effort). Position as done-for-you.",
    summary: [
      "Value = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort)",
      "Maximize top, minimize bottom — done-for-you wins",
      "RuufPro: instant site (low delay) + zero effort (done-for-you) = high value",
    ],
    details: [
      "Dream outcome: more roofing leads and jobs",
      "Perceived likelihood: show social proof, case studies, ROI calc",
      "Time delay: onboarding in 3 minutes, site live same day",
      "Effort & sacrifice: zero — we build it, they approve it",
      "Position every feature through this lens",
    ],
    links: [
      { label: "Vault Entry 025", href: "/command-center/vault/025" },
    ],
    tags: ["hormozi", "value-equation", "positioning"],
    featured: true,
  },
  {
    id: "005",
    title: "Local Lead Abundance System",
    speaker: "Jack",
    source: "skool",
    date: "2025-12-01",
    hook: "60K pre-scraped leads. Build sites as lead magnet, send via contact forms.",
    summary: [
      "60K+ roofing leads already scraped and ready",
      "Free site = the hook to get them in the door",
      "Outreach via contact forms at scale",
    ],
    details: [
      "Lead magnet is the free website itself — not a PDF or webinar",
      "Contact form outreach has 3x reply rate vs cold email to info@ addresses",
      "Target secondary cities first — less competition, same conversion",
      "Volume play: 1,000 contacts/day is the baseline",
    ],
    links: [
      { label: "Vault Entry 005", href: "/command-center/vault/005" },
      { label: "Outreach Pipeline", href: "/command-center?tab=outreach" },
    ],
    tags: ["leads", "outreach", "acquisition"],
    featured: true,
    revenuePlay: "Free site as lead magnet → outreach to 60K scraped leads → convert to $149/mo after value proven.",
  },
  {
    id: "023",
    title: "$40K/mo AI Sales",
    speaker: "James",
    source: "skool",
    date: "2026-01-05",
    hook: "ONE focused offer. Don't feature-sprawl. Sell the outcome.",
    summary: [
      "One offer, one outcome, one price — simplicity sells",
      "Feature sprawl kills conversions",
      "Sell the result (more roofing jobs), not the tool (website builder)",
    ],
    details: [
      "James hit $40K/mo by narrowing to a single AI service offering",
      "Every feature you add dilutes the message",
      "Roofers don't buy 'website + SEO + reviews + SMS' — they buy 'more jobs'",
      "The product page should read like a results guarantee, not a feature list",
    ],
    links: [
      { label: "Vault Entry 023", href: "/command-center/vault/023" },
    ],
    tags: ["sales", "focus", "positioning"],
    featured: true,
  },
  {
    id: "032",
    title: "ROI Calculator Close",
    speaker: "Andy Steuer",
    source: "skool",
    date: "2026-01-20",
    hook: "$32K/month in missed calls = $999/mo solution is obvious.",
    summary: [
      "Quantify the pain in dollars — make the ROI undeniable",
      "Missed calls × average job value = money left on table",
      "When the cost of inaction > your price, closing is easy",
    ],
    details: [
      "Average roofing job: $8-12K. Missing 3-4 calls/month = $32K+ lost",
      "ROI calculator on the sales page does the math for them",
      "Frame price as % of recovered revenue, not absolute cost",
      "'$149/mo to recover $32K/mo in missed opportunities'",
    ],
    links: [
      { label: "Vault Entry 032", href: "/command-center/vault/032" },
    ],
    tags: ["sales", "roi", "conversion"],
    featured: true,
    revenuePlay: "Build ROI calculator into sales flow. Show missed-call revenue vs subscription cost.",
  },
  {
    id: "033",
    title: "Cold Email at Scale",
    speaker: "Skool",
    source: "skool",
    date: "2026-01-22",
    hook: "1,000/day system. 3x reply rates targeting secondary cities.",
    summary: [
      "1,000 emails/day is the volume target",
      "Secondary cities = 3x reply rates vs metro areas",
      "Warm up domains, rotate senders, personalize at scale",
    ],
    details: [
      "Infrastructure: multiple domains, warm-up period, sender rotation",
      "Secondary cities have less inbox competition — roofers actually read email",
      "Personalization: city name + company name + specific pain point",
      "Follow-up sequence: 3 touches over 7 days, then move to next batch",
    ],
    links: [
      { label: "Vault Entry 033", href: "/command-center/vault/033" },
      { label: "Outreach Pipeline", href: "/command-center?tab=outreach" },
    ],
    tags: ["outreach", "email", "acquisition"],
    featured: true,
  },
  {
    id: "052",
    title: "Review Collection + AI Response",
    speaker: "Skool",
    source: "skool",
    date: "2026-02-15",
    hook: "After job → sentiment → SEO review → Google link. Automated.",
    summary: [
      "Automated review collection after every completed job",
      "AI sentiment check before asking for public review",
      "Direct Google review link = frictionless 5-star pipeline",
    ],
    details: [
      "Trigger: job marked complete → SMS to homeowner",
      "Sentiment gate: if negative, route to private feedback (don't publish)",
      "If positive: auto-generate SEO-friendly review draft, send Google review link",
      "AI responds to every Google review within 24hrs — signals active business to Google",
    ],
    links: [
      { label: "Vault Entry 052", href: "/command-center/vault/052" },
    ],
    tags: ["reviews", "seo", "automation", "retention"],
    featured: true,
    revenuePlay: "Automated review pipeline = SEO compound interest. More reviews → more visibility → more leads.",
  },
  {
    id: "019",
    title: "Clinic Management Pattern",
    speaker: "Gal",
    source: "skool",
    date: "2025-12-20",
    hook: "Walk in, observe pain, build action dashboard. That's Mission Control.",
    summary: [
      "Best products come from observing the workflow, not asking what they want",
      "Build the dashboard they'd build themselves if they could code",
      "Action-oriented: every screen should have a clear next action",
    ],
    details: [
      "Gal's approach: shadow the clinic, watch what they do, build the tool around their actual workflow",
      "Applied to RuufPro: Mission Control IS this — the roofer's daily cockpit",
      "Every panel should answer 'what do I do next?' not 'here's your data'",
      "Reduce decision fatigue: surface the one thing that matters most right now",
    ],
    links: [
      { label: "Vault Entry 019", href: "/command-center/vault/019" },
    ],
    tags: ["product", "ux", "philosophy"],
    featured: true,
  },
];

// ─── Helper functions ──────────────────────────────────────────

export function getFeaturedEntries(): VaultEntry[] {
  return VAULT_ENTRIES.filter((e) => e.featured);
}

export function getRecentEntries(count: number = 10): VaultEntry[] {
  return [...VAULT_ENTRIES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}

export function getEntriesByTag(tag: string): VaultEntry[] {
  return VAULT_ENTRIES.filter((e) => e.tags.includes(tag));
}

export function getEntriesBySource(source: string): VaultEntry[] {
  return VAULT_ENTRIES.filter((e) => e.source === source);
}

export function getVaultStats() {
  return {
    total: VAULT_ENTRIES.length,
    featured: VAULT_ENTRIES.filter((e) => e.featured).length,
    withRevenuePlays: VAULT_ENTRIES.filter((e) => e.revenuePlay).length,
    tags: Array.from(new Set(VAULT_ENTRIES.flatMap((e) => e.tags))),
    sources: Array.from(new Set(VAULT_ENTRIES.map((e) => e.source))),
  };
}
