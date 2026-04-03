// Progress log — tracks daily work items with links to changed files.
// Items in "today" are automatically moved to "completed" when the date changes.

export interface ProgressItem {
  id: string;
  title: string;
  description: string;
  files: { label: string; path: string }[];
  tags: string[];
  date: string; // YYYY-MM-DD
}

// Today's date for auto-archiving
const TODAY = new Date().toISOString().split("T")[0];

// All progress items — newest first
const ALL_ITEMS: ProgressItem[] = [
  // ── Apr 3, 2026 — HQ Navigation ──────────────────────────
  {
    id: "merge-hq-into-mission-control",
    title: "Merged HQ into Mission Control — one page to rule them all",
    description:
      "Eliminated the 3-app maze (HQ + Mission Control + Command Center). Mission Control at /mission-control is now the single daily cockpit with 4 tabs: Today (progress log, sprint, quick actions), Build (features inventory, templates, automation workflows, build tools), Grow (revenue strategy, plays, outreach, positioning, live product), Library (vault, research, wins). /hq now redirects to /mission-control. Command Center still works at /command-center for the interactive database-backed panels (todos, plays, outreach, etc.) but the back-link now says 'Mission Control' instead of 'HQ'. Feature detail pages also link back to Mission Control. Workflows (previously a separate Mission Control tab) are now inside the Build tab where they belong.",
    files: [
      { label: "mission-control/page.tsx", path: "/app/mission-control/page.tsx" },
      { label: "hq/page.tsx", path: "/app/hq/page.tsx" },
      { label: "command-center/page.tsx", path: "/app/command-center/page.tsx" },
      { label: "feature/[slug]/page.tsx", path: "/app/command-center/feature/[slug]/page.tsx" },
    ],
    tags: ["navigation", "reorganization"],
    date: "2026-04-03",
  },
  {
    id: "hq-redesign",
    title: "HQ redesign — 4-tab daily cockpit (now merged into Mission Control)",
    description:
      "Redesigned /hq from a dumb link directory into a proper 4-tab dashboard organized by solopreneur intent. TODAY tab: progress log (today/completed toggle), current sprint with shipped/next items, and quick action links (inbox, todos, onboarding, marketing site). BUILD tab: full feature inventory grouped by status (12 complete, 2 in progress, 3 planned) with clickable links to feature detail pages at /command-center/feature/[slug], template grid with color swatches and status, plus deep-links to build tools (Mission Control, onboarding preview, site kanban, workflows, demos, widget). GROW tab: revenue strategy snapshot showing all 3 tiers with $50K MRR math (vault 031), links to plays, outreach pipeline, positioning, war room overview, and live product pages. LIBRARY tab: vault (50+ entries) as the hero with prominent 'Open Vault' card, research docs, feature deep-dives, wins board, and completed work archive. Quick stats row at top shows shipped today / features live / pipeline count / templates. Back-links to HQ on both Mission Control and Command Center headers. Imports real data from progress-log.ts, template-registry.ts, and features-data.ts — everything is live, not hardcoded.",
    files: [
      { label: "hq/page.tsx", path: "/app/hq/page.tsx" },
      { label: "hq/layout.tsx", path: "/app/hq/layout.tsx" },
      { label: "mission-control/page.tsx", path: "/app/mission-control/page.tsx" },
      { label: "command-center/page.tsx", path: "/app/command-center/page.tsx" },
    ],
    tags: ["navigation", "hq", "reorganization"],
    date: "2026-04-03",
  },
  // ── Apr 3, 2026 — Pricing Update ──────────────────────────
  {
    id: "pricing-live-component",
    title: "Pricing component → 3 tiers",
    description:
      "Expanded the live Ridgeline pricing component from a 2-tier layout (Free + $99 Pro) to a 3-tier layout. New tiers: Your Website (Free), Your Leads ($149/mo Pro), Your Growth ($299/mo). Grid changed from md:grid-cols-2 → md:grid-cols-3, max-w bumped from 4xl → 6xl. Added Zap icon import for Growth card. Annual toggle recalculated: Pro $119/mo ($1,428/yr, save $360), Growth $239/mo ($2,868/yr, save $720). Savings badge simplified from 'Save $240/yr' to 'Save 20%'. Copy follows vault-driven strategy (entry 031): sell outcomes not features — 'Your phone rings' instead of 'estimate widget'. Pro card keeps 'Most Popular' highlight + copper border. Growth card has subtle copper border (border-[#D4863E]/30) with 'Full Suite' pill. Bottom transparency note updated to reference both paid tiers.",
    files: [
      { label: "ridgeline/pricing.tsx", path: "/components/ridgeline/pricing.tsx" },
    ],
    tags: ["pricing", "ridgeline"],
    date: "2026-04-03",
  },
  {
    id: "pricing-competitor-comparison",
    title: "Competitor comparison — new math",
    description:
      "Updated the ROWS data and 'The Math' callout in the Ridgeline competitor comparison table. Monthly cost row changed from '$99/mo (widget)' → '$149/mo (Pro)'. Year-one math recalculated: RuufPro $149 × 12 = $1,788/yr (was $1,188). Roofle still $6,200/yr ($350/mo + $2K setup). Savings dropped from $5,012 → $4,412 but still compelling. CTA button updated from '$99/mo' → '$149/mo'. Roofr ($249–349/mo), Scorpion ($3K+), and Agency ($500–2.5K) rows unchanged — our price advantage is still dominant across all competitors.",
    files: [
      { label: "ridgeline/competitor-comparison.tsx", path: "/components/ridgeline/competitor-comparison.tsx" },
    ],
    tags: ["pricing", "ridgeline"],
    date: "2026-04-03",
  },
  {
    id: "pricing-faq",
    title: "FAQ — pricing references updated",
    description:
      "Updated 2 FAQ answers in the Ridgeline FAQ accordion. 'What's the catch?' answer: $99 → $149, added Pro plan feature list (satellite estimates + missed-call text-back + review automation), added Growth tier mention ($299/mo for SEO city pages, competitor monitoring, custom domain), percentage vs Roofle changed from 72% → 57%. 'Is the website really free?' answer: $99/month → $149/month, replaced 'That's our only paid product' with mention of both Pro and Growth tiers. Other 9 FAQ items unchanged — they don't reference pricing.",
    files: [
      { label: "ridgeline/faq.tsx", path: "/components/ridgeline/faq.tsx" },
    ],
    tags: ["pricing", "ridgeline"],
    date: "2026-04-03",
  },
  {
    id: "pricing-whats-the-catch",
    title: "What's The Catch — pricing updated",
    description:
      "Updated the left-column copy in the 'What's The Catch' transparency section. Changed from '$99/mo widget that lets homeowners see ballpark pricing' → '$149/mo Pro plan that turns website visitors into qualified leads with satellite estimates, missed-call text-back, and review automation'. Percentage changed from 72% → 57% cheaper than Roofle. Follows vault entry 015 (Ann) principle: lead with value, not price. The three promise cards on the right (no salesperson, no contract, no hidden fees) remain unchanged.",
    files: [
      { label: "ridgeline/whats-the-catch.tsx", path: "/components/ridgeline/whats-the-catch.tsx" },
    ],
    tags: ["pricing", "ridgeline"],
    date: "2026-04-03",
  },
  {
    id: "pricing-hero-meta",
    title: "Hero subtitle + SEO meta description",
    description:
      "Two customer-facing pricing references outside the pricing section. Hero subtitle (ui/hero.tsx line 115): changed '$99/mo' → '$149/mo' in the one-liner under the main headline. Layout meta description (app/layout.tsx line 41): changed from 'Add an instant estimate widget for $99/mo' → 'Upgrade to Pro for $149/mo to turn visitors into leads'. The meta description is what shows in Google search results — important for SEO consistency with the new pricing.",
    files: [
      { label: "ui/hero.tsx", path: "/components/ui/hero.tsx" },
      { label: "app/layout.tsx", path: "/app/layout.tsx" },
    ],
    tags: ["pricing", "seo"],
    date: "2026-04-03",
  },
  {
    id: "pricing-dashboard-upsell",
    title: "Dashboard upsell text updated",
    description:
      "Updated the estimate widget upsell prompt in the My Site editor (line 353). Roofers without the widget see an amber-colored message — changed from 'Requires the $99/mo widget plan' → 'Requires the $149/mo Pro plan'. This is the in-dashboard upsell that shows when has_estimate_widget is false. Follows vault entry 015 principle: upsell after value is proven, never during onboarding.",
    files: [
      { label: "dashboard/my-site/page.tsx", path: "/app/dashboard/my-site/page.tsx" },
    ],
    tags: ["pricing", "dashboard"],
    date: "2026-04-03",
  },
  {
    id: "pricing-marketing-components",
    title: "Marketing components — consistency update",
    description:
      "Updated 4 unused marketing components (light theme, not currently rendered on any route) for consistency. marketing/pricing.tsx: Pro $99 → $149, Growth $149 → $299, removed 'Coming Soon' badge → 'Full Suite', made Growth CTA active instead of disabled. marketing/features.tsx: estimator badge '$99/mo' → '$149/mo', Roofle comparison '71% cheaper' → '57% cheaper'. marketing/comparison.tsx: monthly cost '$0 – $99' → '$0 – $149', first year '$0 – $1,188' → '$0 – $1,788', subtitle percentage updated. marketing/faq.tsx: Roofle comparison answer updated with $149 price + full Pro feature list. These components exist at /components/marketing/ but aren't imported by any page currently — the Ridgeline design system is the active theme.",
    files: [
      { label: "marketing/pricing.tsx", path: "/components/marketing/pricing.tsx" },
      { label: "marketing/features.tsx", path: "/components/marketing/features.tsx" },
      { label: "marketing/comparison.tsx", path: "/components/marketing/comparison.tsx" },
      { label: "marketing/faq.tsx", path: "/components/marketing/faq.tsx" },
    ],
    tags: ["pricing", "marketing"],
    date: "2026-04-03",
  },
  {
    id: "pricing-docs",
    title: "Documentation updated",
    description:
      "Updated 2 internal docs to reflect the new 3-tier pricing. Claude.md (line 3): replaced '$99/mo estimate widget' product description with full tier breakdown — Free (website + SEO), $149/mo Pro (widget + text-back + reviews + dashboard), $299/mo Growth (city pages + competitor monitoring + domain). workflows/project_overview.md: replaced per-product pricing table ($99 widget, $99 reviews, $149 auto-reply, $149 city pages) with tier-based table matching the new bundled structure. Also updated the 'Why It Exists' paragraph from '$99/mo' → '$149/mo'. Historical research docs (go-to-market-plan.md, research-data.ts, vault-data.ts) left as-is — they're point-in-time records of analysis done at the old price point.",
    files: [
      { label: "Claude.md", path: "/Claude.md" },
      { label: "workflows/project_overview.md", path: "/workflows/project_overview.md" },
    ],
    tags: ["pricing", "docs"],
    date: "2026-04-03",
  },
  {
    id: "progress-log-system",
    title: "Mission Control — Progress Log system",
    description:
      "Built a new Progress Log section in Mission Control with tabbed UI. 'Today's Progress' tab (green) shows items logged with today's date. 'Completed' tab (purple) shows everything from previous days — items auto-archive when the date changes (compared via new Date().toISOString().split('T')[0]). Each card has: title, detailed description, clickable purple file links (open in VS Code via vscode://file protocol), and category tags. Added a 4th stat card 'Changes Today' to the quick stats row. Data lives in progress-log.ts — new items are added to the ALL_ITEMS array with the current date. ProgressCard component matches existing Mission Control dark theme (#141420 cards, rgba borders, hover effects).",
    files: [
      { label: "mission-control/progress-log.ts", path: "/app/mission-control/progress-log.ts" },
      { label: "ProgressCard.tsx", path: "/app/mission-control/components/ProgressCard.tsx" },
      { label: "mission-control/page.tsx", path: "/app/mission-control/page.tsx" },
    ],
    tags: ["mission-control", "tooling"],
    date: "2026-04-03",
  },
];

// Auto-archive: items from today go to "today", everything else is "completed"
export function getTodayItems(): ProgressItem[] {
  return ALL_ITEMS.filter((item) => item.date === TODAY);
}

export function getCompletedItems(): ProgressItem[] {
  return ALL_ITEMS.filter((item) => item.date !== TODAY);
}

export function getAllItems(): ProgressItem[] {
  return ALL_ITEMS;
}
