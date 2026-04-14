// Revenue API — returns daily velocity, weekly momentum, hot prospects, and bottleneck.
// Single endpoint that fetches all prospect_pipeline rows and computes metrics in JS.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FUNNEL_STAGES, BOTTLENECK_ACTIONS } from "@/lib/ops-revenue";
import type { VelocityCounts, HotProspect, Bottleneck, RevenueResponse } from "@/lib/ops-revenue";
import { requireOpsAuth, softOpsAuth } from "@/lib/ops-auth";

// ── Date helpers ──────────────────────────────────────────────────────
function dayStart(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function inRange(ts: string | null, start: Date, end: Date): boolean {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  return t >= start.getTime() && t < end.getTime();
}

// ── Count velocity from timestamp columns ────────────────────────────
function countVelocity(
  rows: any[],
  views: any[],
  start: Date,
  end: Date
): VelocityCounts {
  let scraped = 0, sites_built = 0, sent = 0, replies = 0, interested = 0, signups = 0;

  for (const r of rows) {
    if (inRange(r.scraped_at, start, end)) scraped++;
    if (inRange(r.site_built_at, start, end)) sites_built++;
    if (inRange(r.sent_at, start, end)) sent++;
    if (inRange(r.replied_at, start, end)) replies++;
    // For interested/signups, check converted_at or stage_entered_at with matching stage
    if (r.stage === "interested" && inRange(r.stage_entered_at, start, end)) interested++;
    if (r.stage === "free_signup" && inRange(r.stage_entered_at, start, end)) signups++;
    if (r.stage === "paid" && inRange(r.converted_at, start, end)) signups++;
  }

  // Count views
  const viewCount = views.filter((v: any) => inRange(v.viewed_at, start, end)).length;

  return { scraped, sites_built, sent, replies, interested, signups, views: viewCount };
}

// ── Compute streak ───────────────────────────────────────────────────
function computeStreak(rows: any[]): number {
  let streak = 0;
  for (let daysAgo = 0; daysAgo < 60; daysAgo++) {
    const start = dayStart(daysAgo);
    const end = dayStart(daysAgo - 1); // end of that day = start of next day
    const hadActivity = rows.some(
      (r: any) =>
        inRange(r.sent_at, start, end) ||
        inRange(r.replied_at, start, end) ||
        inRange(r.responded_at, start, end) ||
        inRange(r.scraped_at, start, end)
    );
    if (hadActivity) {
      streak++;
    } else if (daysAgo > 0) {
      // Allow today to be empty (day isn't over), break on any past empty day
      break;
    }
  }
  return streak;
}

// ── Compute bottleneck ───────────────────────────────────────────────
function computeBottleneck(rows: any[]): Bottleneck | null {
  if (rows.length === 0) return null;

  // Map funnel stage → timestamp field
  const stageTimestamp: Record<string, string> = {
    scraped: "scraped_at",
    site_built: "site_built_at",
    sent: "sent_at",
    replied: "replied_at",
    interested: "stage_entered_at", // no dedicated timestamp
    free_signup: "converted_at",
    paid: "converted_at",
  };

  // Count how many prospects have reached each funnel stage
  const reached: Record<string, number> = {};
  for (const stage of FUNNEL_STAGES) {
    if (stage === "interested") {
      reached[stage] = rows.filter((r: any) =>
        ["interested", "free_signup", "paid"].includes(r.stage)
      ).length;
    } else if (stage === "free_signup") {
      reached[stage] = rows.filter((r: any) =>
        ["free_signup", "paid"].includes(r.stage)
      ).length;
    } else if (stage === "paid") {
      reached[stage] = rows.filter((r: any) => r.stage === "paid").length;
    } else {
      // Count by timestamp existence (more accurate than current stage)
      const tsField = stageTimestamp[stage];
      reached[stage] = rows.filter((r: any) => r[tsField] != null).length;
    }
  }

  let worstRate = Infinity;
  let worstPair: { from: string; to: string; rate: number; stuck: number } | null = null;

  for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
    const from = FUNNEL_STAGES[i];
    const to = FUNNEL_STAGES[i + 1];
    const fromCount = reached[from];
    const toCount = reached[to];

    if (fromCount === 0) continue; // can't compute rate with 0 denominator

    const rate = (toCount / fromCount) * 100;
    if (rate < worstRate) {
      worstRate = rate;
      worstPair = { from, to, rate, stuck: fromCount - toCount };
    }
  }

  if (!worstPair) return null;

  const key = `${worstPair.from}→${worstPair.to}`;
  const actionInfo = BOTTLENECK_ACTIONS[key] || { action: "Investigate this step", href: "/ops" };

  return {
    from_stage: worstPair.from,
    to_stage: worstPair.to,
    conversion_pct: Math.round(worstPair.rate),
    stuck_count: worstPair.stuck,
    action: actionInfo.action,
    action_href: actionInfo.href,
  };
}

export async function GET() {
  const auth = await softOpsAuth();
  if (!auth.authorized) return auth.response;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Parallel queries ───────────────────────────────────────────────
  const [pipelineResult, viewsResult, repliesResult, metricsResult] = await Promise.all([
    supabase
      .from("prospect_pipeline")
      .select("id, stage, batch_id, owner_name, owner_email, preview_site_url, reply_category, stage_entered_at, scraped_at, enriched_at, site_built_at, site_approved_at, outreach_approved_at, sent_at, replied_at, responded_at, converted_at, contractors(business_name, city, state)")
      .order("stage_entered_at", { ascending: false }),
    supabase
      .from("prospect_views")
      .select("viewed_at"),
    supabase
      .from("outreach_replies")
      .select("category, created_at, status"),
    supabase
      .from("business_metrics")
      .select("metric_key, metric_value")
      .in("metric_key", ["mrr", "active_trials", "total_signups"]),
  ]);

  const pipeline = pipelineResult.data || [];
  const views = viewsResult.data || [];
  const metrics = metricsResult.data || [];

  // ── Date boundaries ────────────────────────────────────────────────
  const todayStart = dayStart(0);
  const todayEnd = dayStart(-1);
  const yesterdayStart = dayStart(1);
  const thisWeekStart = getMonday(new Date());
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  // ── Compute velocity ───────────────────────────────────────────────
  const today = countVelocity(pipeline, views, todayStart, todayEnd);
  const yesterday = countVelocity(pipeline, views, yesterdayStart, todayStart);
  const this_week = countVelocity(pipeline, views, thisWeekStart, todayEnd);
  const last_week = countVelocity(pipeline, views, lastWeekStart, thisWeekStart);

  // ── Hot prospects ──────────────────────────────────────────────────
  const HOT_STAGES = ["interested", "free_signup", "replied"];
  const stageOrder: Record<string, number> = { free_signup: 0, interested: 1, replied: 2 };

  const hot_prospects: HotProspect[] = pipeline
    .filter((r: any) => HOT_STAGES.includes(r.stage))
    .sort((a: any, b: any) => (stageOrder[a.stage] ?? 99) - (stageOrder[b.stage] ?? 99))
    .slice(0, 10)
    .map((r: any) => {
      const contractor = r.contractors as any;
      const daysInStage = r.stage_entered_at
        ? Math.floor((Date.now() - new Date(r.stage_entered_at).getTime()) / 86400000)
        : 0;
      return {
        id: r.id,
        name: r.owner_name || contractor?.business_name || "Unknown",
        business_name: contractor?.business_name || "",
        city: contractor?.city || "",
        stage: r.stage,
        reply_category: r.reply_category,
        preview_url: r.preview_site_url,
        email: r.owner_email,
        days_in_stage: daysInStage,
      };
    });

  // ── Bottleneck ─────────────────────────────────────────────────────
  const bottleneck = computeBottleneck(pipeline);

  // ── MRR from business_metrics ──────────────────────────────────────
  const mrrMetric = metrics.find((m: any) => m.metric_key === "mrr");
  const mrr = mrrMetric ? Number(mrrMetric.metric_value) : 0;

  // ── Streak ─────────────────────────────────────────────────────────
  const streak_days = computeStreak(pipeline);

  const response: RevenueResponse = {
    today,
    yesterday,
    this_week,
    last_week,
    hot_prospects,
    bottleneck,
    mrr,
    goal_mrr: 5000,
    streak_days,
  };

  return NextResponse.json(response);
}
