// Revenue page types and constants — shared between API route and page component.

export interface VelocityCounts {
  scraped: number;
  sites_built: number;
  sent: number;
  replies: number;
  interested: number;
  signups: number;
  views: number;
}

export interface HotProspect {
  id: string;
  name: string;
  business_name: string;
  city: string;
  stage: string;
  reply_category: string | null;
  preview_url: string | null;
  email: string | null;
  days_in_stage: number;
}

export interface Bottleneck {
  from_stage: string;
  to_stage: string;
  conversion_pct: number;
  stuck_count: number;
  action: string;
  action_href: string;
}

export interface RevenueResponse {
  today: VelocityCounts;
  yesterday: VelocityCounts;
  this_week: VelocityCounts;
  last_week: VelocityCounts;
  hot_prospects: HotProspect[];
  bottleneck: Bottleneck | null;
  mrr: number;
  goal_mrr: number;
  streak_days: number;
}

// Funnel stages in order (simplified for revenue tracking — skip intermediate stages)
export const FUNNEL_STAGES = [
  "scraped",
  "demo_built",
  "sent",
  "replied",
  "interested",
  "free_signup",
  "paid",
] as const;

// What to do when each funnel step is the bottleneck
export const BOTTLENECK_ACTIONS: Record<string, { action: string; href: string }> = {
  "scraped→demo_built":       { action: "Build demo pages for scraped prospects", href: "/ops" },
  "demo_built→sent":          { action: "Approve demos + outreach in Pipeline gates", href: "/ops" },
  "sent→replied":             { action: "Low reply rate — test new subject lines", href: "https://app.instantly.ai" },
  "replied→interested":       { action: "Replies aren't converting — review reply handler", href: "/ops" },
  "interested→free_signup":   { action: "Interested but not signing up — reduce friction", href: "/ops/settings" },
  "free_signup→paid":         { action: "Free users not paying — connect Stripe", href: "/ops/settings" },
};
