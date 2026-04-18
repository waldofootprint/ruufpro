// Deterministic aggregations for /dashboard/insights.
// Pure functions — no Supabase calls. Feed them already-fetched data.

import type { Lead, LeadStatus } from "@/lib/types";
import { detectIntent, type ChatMessage, type QuestionType } from "@/lib/intent-detection";

const WON_STATUSES: LeadStatus[] = ["won", "completed"];
const DECIDED_STATUSES: LeadStatus[] = ["won", "completed", "lost"];
const PIPELINE_STATUSES: LeadStatus[] = ["quoted", "appointment_set"];
const RILEY_SOURCES = ["ai_chatbot", "riley", "chat"];

function midpoint(lead: Pick<Lead, "estimate_low" | "estimate_high">): number {
  const low = lead.estimate_low || 0;
  const high = lead.estimate_high || 0;
  if (!low && !high) return 0;
  if (!low) return high;
  if (!high) return low;
  return Math.round((low + high) / 2);
}

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function formatUSD(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export function formatUSDFull(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

// ── 1. Scoreboard ──────────────────────────────────────────────────────

export interface ScoreboardStats {
  closedThisWeekCount: number;
  closedThisWeekRevenue: number;
  pipelineCount: number;
  pipelineValue: number;
  closeRatePct: number | null;
  forecastRevenue: number | null;
}

export function computeScoreboard(
  leads: Array<Pick<Lead, "status" | "estimate_low" | "estimate_high" | "contacted_at" | "created_at">>
): ScoreboardStats {
  const weekStart = startOfWeek();

  const closedThisWeek = leads.filter((l) => {
    if (!WON_STATUSES.includes(l.status)) return false;
    const ts = l.contacted_at || l.created_at;
    return ts ? new Date(ts) >= weekStart : false;
  });

  const pipeline = leads.filter((l) => PIPELINE_STATUSES.includes(l.status));
  const decided = leads.filter((l) => DECIDED_STATUSES.includes(l.status));
  const won = leads.filter((l) => WON_STATUSES.includes(l.status));

  const closeRatePct = decided.length >= 5
    ? Math.round((won.length / decided.length) * 100)
    : null;

  const pipelineValue = pipeline.reduce((sum, l) => sum + midpoint(l), 0);

  return {
    closedThisWeekCount: closedThisWeek.length,
    closedThisWeekRevenue: closedThisWeek.reduce((sum, l) => sum + midpoint(l), 0),
    pipelineCount: pipeline.length,
    pipelineValue,
    closeRatePct,
    forecastRevenue: closeRatePct !== null ? Math.round((pipelineValue * closeRatePct) / 100) : null,
  };
}

// ── 2. Money Left on the Table ─────────────────────────────────────────

export interface MoneyLeftLead {
  id: string;
  name: string;
  estimateLow: number | null;
  estimateHigh: number | null;
  estimateMaterial: string | null;
  heatScore: number;
  hoursSinceCreated: number;
  widgetViews: number;
  reason: string;
}

export interface MoneyLeftStats {
  leads: MoneyLeftLead[];
  totalEstimatedValue: number;
}

export interface MoneyLeftInput {
  id: string;
  name: string;
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_material: string | null;
  status: LeadStatus;
  contacted_at: string | null;
  created_at: string;
  heatScore: number;
  widgetViews?: number;
}

export function computeMoneyLeft(leads: MoneyLeftInput[]): MoneyLeftStats {
  const candidates = leads.filter((l) => {
    if (l.status !== "new") return false;
    if (l.contacted_at) return false;
    const hours = (Date.now() - new Date(l.created_at).getTime()) / 3600000;
    // Hot: never contacted, any age. Warm: stale (48h+).
    if (l.heatScore >= 60) return true;
    if (hours >= 48) return true;
    return false;
  });

  const ranked = candidates
    .map((l) => ({
      id: l.id,
      name: l.name,
      estimateLow: l.estimate_low,
      estimateHigh: l.estimate_high,
      estimateMaterial: l.estimate_material,
      heatScore: l.heatScore,
      hoursSinceCreated: (Date.now() - new Date(l.created_at).getTime()) / 3600000,
      widgetViews: l.widgetViews || 0,
      reason: l.heatScore >= 60
        ? `Heat ${l.heatScore} · viewed ${l.widgetViews || 0}× · not contacted`
        : `${Math.round((Date.now() - new Date(l.created_at).getTime()) / 86400000)}d+ no contact`,
    }))
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, 5);

  const totalEstimatedValue = ranked.reduce((sum, l) => sum + midpoint({ estimate_low: l.estimateLow, estimate_high: l.estimateHigh }), 0);

  return { leads: ranked, totalEstimatedValue };
}

// ── 3. What Homeowners Want ────────────────────────────────────────────

export interface QuestionBreakdown {
  type: QuestionType;
  label: string;
  count: number;
  pct: number;
}

export interface HomeownersWantStats {
  totalConvos: number;
  questions: QuestionBreakdown[];
  topMaterial: { name: string; pct: number } | null;
  financingInterestPct: number | null;
}

const QUESTION_LABELS: Record<QuestionType, string> = {
  price_seeking: "Pricing",
  timeline_seeking: "Timeline",
  trust_seeking: "Warranty & Trust",
  emergency: "Emergency",
  insurance: "Insurance",
  comparison: "Comparing",
  general_info: "General Info",
  scheduling: "Scheduling",
};

export interface RileyConvoInput {
  messages: ChatMessage[] | string | null;
  updated_at?: string | null;
}

export function computeHomeownersWant(
  convos: RileyConvoInput[],
  leads: Array<Pick<Lead, "estimate_material" | "financing_interest" | "source">>
): HomeownersWantStats {
  const qCounts = new Map<QuestionType, number>();

  for (const c of convos) {
    let msgs: ChatMessage[] = [];
    try {
      msgs = typeof c.messages === "string" ? JSON.parse(c.messages) : (c.messages as ChatMessage[]) || [];
    } catch { continue; }
    if (!Array.isArray(msgs) || msgs.length === 0) continue;
    const intent = detectIntent(msgs);
    for (const q of intent.questionTypes) {
      qCounts.set(q, (qCounts.get(q) || 0) + 1);
    }
  }

  const totalQs = Array.from(qCounts.values()).reduce((a, b) => a + b, 0);
  const questions: QuestionBreakdown[] = Array.from(qCounts.entries())
    .map(([type, count]) => ({
      type,
      label: QUESTION_LABELS[type],
      count,
      pct: totalQs > 0 ? Math.round((count / totalQs) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Material interest — from lead's estimate_material
  const matCounts = new Map<string, number>();
  for (const l of leads) {
    if (!l.estimate_material) continue;
    matCounts.set(l.estimate_material, (matCounts.get(l.estimate_material) || 0) + 1);
  }
  const matTotal = Array.from(matCounts.values()).reduce((a, b) => a + b, 0);
  const topMat = Array.from(matCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topMaterial = topMat && matTotal > 0
    ? { name: topMat[0], pct: Math.round((topMat[1] / matTotal) * 100) }
    : null;

  // Financing — from leads where financing_interest is set
  const withFinancingField = leads.filter((l) => l.financing_interest !== null && l.financing_interest !== undefined);
  const interested = withFinancingField.filter((l) => l.financing_interest === "yes" || l.financing_interest === "maybe");
  const financingInterestPct = withFinancingField.length >= 3
    ? Math.round((interested.length / withFinancingField.length) * 100)
    : null;

  return {
    totalConvos: convos.length,
    questions,
    topMaterial,
    financingInterestPct,
  };
}

// ── 4. Speed Game ──────────────────────────────────────────────────────

export interface SpeedBucket {
  label: string;
  range: string;
  leadCount: number;
  closedCount: number;
  closeRatePct: number | null;
}

export interface SpeedGameStats {
  avgReplyMinutes: number | null;
  fastestCloses: { minutes: number; count: number } | null;
  buckets: SpeedBucket[];
  totalContacted: number;
}

export function computeSpeedGame(
  leads: Array<Pick<Lead, "status" | "created_at" | "contacted_at">>
): SpeedGameStats {
  const contacted = leads.filter((l) => l.contacted_at && l.created_at);
  if (contacted.length < 3) {
    return { avgReplyMinutes: null, fastestCloses: null, buckets: [], totalContacted: contacted.length };
  }

  const withMinutes = contacted.map((l) => {
    const minutes = (new Date(l.contacted_at!).getTime() - new Date(l.created_at).getTime()) / 60000;
    return { minutes, won: WON_STATUSES.includes(l.status) };
  }).filter((x) => x.minutes >= 0); // skip clock-skew oddities

  const avg = withMinutes.reduce((s, x) => s + x.minutes, 0) / withMinutes.length;

  const fast = [...withMinutes].sort((a, b) => a.minutes - b.minutes).slice(0, 3);
  const fastWons = fast.filter((x) => x.won);
  const fastestCloses = fastWons.length > 0
    ? { minutes: Math.round(Math.max(...fastWons.map((x) => x.minutes))), count: fastWons.length }
    : null;

  const bucketDefs = [
    { label: "fast", range: "< 30 min", min: 0, max: 30 },
    { label: "mid", range: "30m – 2h", min: 30, max: 120 },
    { label: "slow", range: "2h+", min: 120, max: Infinity },
  ];

  const buckets: SpeedBucket[] = bucketDefs.map((b) => {
    const inBucket = withMinutes.filter((x) => x.minutes >= b.min && x.minutes < b.max);
    const wonInBucket = inBucket.filter((x) => x.won).length;
    return {
      label: b.label,
      range: b.range,
      leadCount: inBucket.length,
      closedCount: wonInBucket,
      closeRatePct: inBucket.length >= 3 ? Math.round((wonInBucket / inBucket.length) * 100) : null,
    };
  });

  return {
    avgReplyMinutes: Math.round(avg),
    fastestCloses,
    buckets,
    totalContacted: contacted.length,
  };
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

// ── 5. Riley ROI ───────────────────────────────────────────────────────

export type RileyROIState = "hidden" | "building" | "pipeline" | "first_close" | "ongoing";

export interface RileyROIStats {
  state: RileyROIState;
  convoCount: number;
  leadsCaptured: number;
  pipelineValue: number;
  wonCount: number;
  wonRevenue: number;
  roiMultiplier: number | null; // revenue / $149
}

const RILEY_MONTHLY_COST = 149;

export function computeRileyROI(
  leads: Array<Pick<Lead, "source" | "status" | "estimate_low" | "estimate_high">>,
  rileyConvoCount: number
): RileyROIStats {
  const rileyLeads = leads.filter((l) => l.source && RILEY_SOURCES.includes(l.source));
  const pipeline = rileyLeads.filter((l) => PIPELINE_STATUSES.includes(l.status) || l.status === "new" || l.status === "contacted");
  const won = rileyLeads.filter((l) => WON_STATUSES.includes(l.status));

  const pipelineValue = pipeline.reduce((sum, l) => sum + midpoint(l), 0);
  const wonRevenue = won.reduce((sum, l) => sum + midpoint(l), 0);
  const roi = wonRevenue > 0 ? Math.round(wonRevenue / RILEY_MONTHLY_COST) : null;

  let state: RileyROIState = "hidden";
  if (rileyConvoCount === 0) state = "hidden";
  else if (won.length === 0 && rileyLeads.length < 10) state = "building";
  else if (won.length === 0) state = "pipeline";
  else if (won.length === 1) state = "first_close";
  else state = "ongoing";

  return {
    state,
    convoCount: rileyConvoCount,
    leadsCaptured: rileyLeads.length,
    pipelineValue,
    wonCount: won.length,
    wonRevenue,
    roiMultiplier: roi,
  };
}

// ── 6. Review Momentum ─────────────────────────────────────────────────

export interface ReviewMomentumStats {
  newThisMonth: number;
  totalReviewed: number;
  totalSent: number;
  clickRatePct: number;
  reviewRatePct: number;
  unrequestedCompleted: number;
  recentReviewed: Array<{ leadName: string; sentAgo: string }>;
}

// ── 7. Customer DNA ────────────────────────────────────────────────────

export interface CustomerDNAStats {
  wonCount: number;
  unlocked: boolean;
  avgRoofAge: number | null;
  topMaterial: { name: string; pct: number } | null;
  avgHomeValue: number | null;
  avgWidgetViews: number | null;
  newHomeownerPct: number | null;
  financingPct: number | null;
}

export interface DNALeadInput {
  status: LeadStatus;
  estimate_material: string | null;
  financing_interest: string | null;
  roofAgeYears?: number | null;
  homeValue?: number | null;
  widgetViews?: number;
  lastSaleDate?: string | null;
}

export function computeCustomerDNA(leads: DNALeadInput[]): CustomerDNAStats {
  const won = leads.filter((l) => WON_STATUSES.includes(l.status));
  const wonCount = won.length;
  const unlocked = wonCount >= 10;

  if (!unlocked) {
    return {
      wonCount,
      unlocked,
      avgRoofAge: null,
      topMaterial: null,
      avgHomeValue: null,
      avgWidgetViews: null,
      newHomeownerPct: null,
      financingPct: null,
    };
  }

  const roofAges = won.map((l) => l.roofAgeYears).filter((n): n is number => typeof n === "number");
  const homeValues = won.map((l) => l.homeValue).filter((n): n is number => typeof n === "number");
  const views = won.map((l) => l.widgetViews || 0);

  const matCounts = new Map<string, number>();
  for (const l of won) {
    if (!l.estimate_material) continue;
    matCounts.set(l.estimate_material, (matCounts.get(l.estimate_material) || 0) + 1);
  }
  const topMat = Array.from(matCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  const now = Date.now();
  const newHomeowners = won.filter((l) => {
    if (!l.lastSaleDate) return false;
    const months = (now - new Date(l.lastSaleDate).getTime()) / (30 * 86400000);
    return months <= 12;
  }).length;

  const financing = won.filter((l) => l.financing_interest === "yes" || l.financing_interest === "maybe").length;
  const financingBase = won.filter((l) => l.financing_interest !== null && l.financing_interest !== undefined).length;

  return {
    wonCount,
    unlocked,
    avgRoofAge: roofAges.length > 0 ? Math.round(roofAges.reduce((a, b) => a + b, 0) / roofAges.length) : null,
    topMaterial: topMat ? { name: topMat[0], pct: Math.round((topMat[1] / wonCount) * 100) } : null,
    avgHomeValue: homeValues.length > 0 ? Math.round(homeValues.reduce((a, b) => a + b, 0) / homeValues.length) : null,
    avgWidgetViews: views.length > 0 ? Math.round((views.reduce((a, b) => a + b, 0) / views.length) * 10) / 10 : null,
    newHomeownerPct: Math.round((newHomeowners / wonCount) * 100),
    financingPct: financingBase >= 5 ? Math.round((financing / financingBase) * 100) : null,
  };
}
