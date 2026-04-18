// /dashboard/insights data aggregator.
// Fetches leads (+property join), Riley conversations, widget events, review stats.
// Enriches leads with heat score, then computes all 7 sections.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateHeatScore } from "@/lib/heat-score";
import { detectIntent, type ChatMessage } from "@/lib/intent-detection";
import {
  computeScoreboard,
  computeMoneyLeft,
  computeHomeownersWant,
  computeSpeedGame,
  computeRileyROI,
  computeCustomerDNA,
  type ReviewMomentumStats,
} from "@/lib/insights";

export async function GET() {
  try {
    const cookieStore = cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch { /* read-only */ }
          },
        },
      }
    );

    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });

    const contractorId = contractor.id;

    // Parallel fetch — leads w/ property, Riley convos, widget events, review requests
    const [{ data: rawLeads }, { data: convos }, { data: events }, { data: reviewReqs }] = await Promise.all([
      supabase
        .from("leads")
        .select(`
          id, name, source, status,
          estimate_low, estimate_high, estimate_material,
          financing_interest, timeline, temperature,
          contacted_at, created_at,
          property_data_cache (
            estimated_value, year_built, estimated_roof_age_years,
            last_sale_date
          )
        `)
        .eq("contractor_id", contractorId)
        .limit(500),
      supabase
        .from("chat_conversations")
        .select("messages, updated_at, lead_id")
        .eq("contractor_id", contractorId)
        .eq("type", "riley")
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("widget_events")
        .select("lead_id, event_type")
        .eq("contractor_id", contractorId)
        .limit(2000),
      supabase
        .from("review_requests")
        .select("status, sent_at, clicked_at, reviewed_at, created_at, leads(name)")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false }),
    ]);

    const leads = rawLeads || [];

    // Group events + convos by lead
    const viewsByLead = new Map<string, number>();
    for (const e of events || []) {
      if (!e.lead_id) continue;
      if (e.event_type === "widget_view" || e.event_type === "living_estimate_view") {
        viewsByLead.set(e.lead_id, (viewsByLead.get(e.lead_id) || 0) + 1);
      }
    }

    const convoByLead = new Map<string, any>();
    for (const c of convos || []) {
      if (c.lead_id && !convoByLead.has(c.lead_id)) convoByLead.set(c.lead_id, c);
    }

    // Enrich leads w/ heat score + views + roof age
    const enriched = leads.map((l: any) => {
      const pd = l.property_data_cache;
      const widgetViews = viewsByLead.get(l.id) || 0;

      // Determine chat depth tier
      let chatDepthTier: string | null = null;
      const convo = convoByLead.get(l.id);
      if (convo?.messages) {
        try {
          const msgs: ChatMessage[] = typeof convo.messages === "string" ? JSON.parse(convo.messages) : convo.messages;
          if (Array.isArray(msgs) && msgs.length > 0) {
            const intent = detectIntent(msgs);
            if (intent.stage === "decision" || intent.stage === "close") chatDepthTier = "high_intent";
            else if (intent.stage === "consideration") chatDepthTier = "engaged";
            else chatDepthTier = "browsing";
          }
        } catch {}
      }

      const { score } = calculateHeatScore({
        widgetViews,
        materialSwitches: 0,
        chatDepthTier,
        lastActivityAt: l.contacted_at || l.created_at,
        estimateHigh: l.estimate_high,
        homeValue: pd?.estimated_value,
        lastSaleDate: pd?.last_sale_date,
      });

      return {
        ...l,
        heatScore: score,
        widgetViews,
        roofAgeYears: pd?.estimated_roof_age_years ?? null,
        homeValue: pd?.estimated_value ?? null,
        lastSaleDate: pd?.last_sale_date ?? null,
      };
    });

    // Compute each section
    const scoreboard = computeScoreboard(enriched);
    const moneyLeft = computeMoneyLeft(enriched);
    const homeownersWant = computeHomeownersWant(convos || [], enriched);
    const speedGame = computeSpeedGame(enriched);
    const rileyROI = computeRileyROI(enriched, (convos || []).length);
    const customerDNA = computeCustomerDNA(enriched.map((l: any) => ({
      status: l.status,
      estimate_material: l.estimate_material,
      financing_interest: l.financing_interest,
      roofAgeYears: l.roofAgeYears,
      homeValue: l.homeValue,
      widgetViews: l.widgetViews,
      lastSaleDate: l.lastSaleDate,
    })));

    // Review momentum
    const allReqs = reviewReqs || [];
    const sent = allReqs.filter((r: any) => r.status !== "pending");
    const clicked = allReqs.filter((r: any) => r.clicked_at);
    const reviewed = allReqs.filter((r: any) => r.status === "reviewed");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = reviewed.filter((r: any) => new Date(r.reviewed_at || r.created_at) >= monthStart).length;
    const wonIds = new Set(enriched.filter((l: any) => l.status === "won" || l.status === "completed").map((l: any) => l.id));
    const requestedLeadIds = new Set(allReqs.map((r: any) => (r as any).lead_id).filter(Boolean));
    const unrequestedCompleted = Array.from(wonIds).filter((id) => !requestedLeadIds.has(id)).length;

    const recentReviewed = reviewed.slice(0, 3).map((r: any) => ({
      leadName: (r.leads as any)?.name || "A customer",
      sentAgo: formatTimeAgo(r.reviewed_at || r.created_at),
    }));

    const reviewMomentum: ReviewMomentumStats = {
      newThisMonth,
      totalReviewed: reviewed.length,
      totalSent: sent.length,
      clickRatePct: sent.length > 0 ? Math.round((clicked.length / sent.length) * 100) : 0,
      reviewRatePct: sent.length > 0 ? Math.round((reviewed.length / sent.length) * 100) : 0,
      unrequestedCompleted,
      recentReviewed,
    };

    return NextResponse.json({
      scoreboard,
      moneyLeft,
      homeownersWant,
      speedGame,
      rileyROI,
      reviewMomentum,
      customerDNA,
    });
  } catch (err) {
    console.error("Insights API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
