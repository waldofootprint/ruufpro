"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "./DashboardContext";
import { supabase } from "@/lib/supabase";
import { calculateHeatScore } from "@/lib/heat-score";
import { detectIntent, type ChatMessage } from "@/lib/intent-detection";
import { StatCard, StatCardGrid } from "@/components/dashboard/stat-cards";
import { LeadList, type LeadWithDetails } from "@/components/dashboard/lead-list";
import StormAlertBanner from "@/components/dashboard/StormAlertBanner";
import { Flame, Clock, MessageSquare, AlertTriangle, DollarSign } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { useDemoMode } from "@/lib/use-demo-mode";
import { DEMO_LEADS, DEMO_STATS } from "@/lib/demo-data";

export default function DashboardHome() {
  const { contractorId, businessName, tier } = useDashboard();
  const isDemo = useDemoMode();
  const [leads, setLeads] = useState<LeadWithDetails[]>(isDemo ? DEMO_LEADS : []);
  const [loading, setLoading] = useState(!isDemo);

  const firstName = businessName.split("'")[0].split(" ")[0];

  useEffect(() => {
    if (isDemo) return; // Demo data already loaded via useState default
    if (!contractorId) return;
    loadLeads();
  }, [contractorId, isDemo]);

  async function loadLeads() {
    setLoading(true);

    // Fetch leads with property data join
    const { data: rawLeads, error } = await supabase
      .from("leads")
      .select(`
        *,
        property_data_cache (
          estimated_value, value_range_low, value_range_high,
          year_built, estimated_roof_age_years, is_original_roof, in_replacement_window,
          owner_names, owner_occupied,
          last_sale_date, last_sale_price,
          square_footage, flood_zone,
          fema_disaster_count, county_name
        )
      `)
      .eq("contractor_id", contractorId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !rawLeads) {
      console.error("Failed to load leads:", error);
      setLoading(false);
      return;
    }

    // Fetch chat conversations + widget events in parallel
    const leadIds = rawLeads.map((l) => l.id);
    const safeLeadIds = leadIds.length > 0 ? leadIds : ["__none__"];

    const [{ data: chats }, { data: widgetEvents }] = await Promise.all([
      supabase
        .from("chat_conversations")
        .select("lead_id, messages, updated_at")
        .in("lead_id", safeLeadIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("widget_events")
        .select("lead_id, event_type, metadata, created_at")
        .eq("contractor_id", contractorId)
        .in("lead_id", safeLeadIds)
        .order("created_at", { ascending: false }),
    ]);

    const chatByLead = new Map<string, typeof chats>();
    chats?.forEach((c) => {
      if (!chatByLead.has(c.lead_id)) chatByLead.set(c.lead_id, []);
      chatByLead.get(c.lead_id)!.push(c);
    });

    // Group widget events by lead
    const eventsByLead = new Map<string, typeof widgetEvents>();
    widgetEvents?.forEach((e) => {
      if (!e.lead_id) return;
      if (!eventsByLead.has(e.lead_id)) eventsByLead.set(e.lead_id, []);
      eventsByLead.get(e.lead_id)!.push(e);
    });

    // Build enriched leads
    const enriched: LeadWithDetails[] = rawLeads.map((lead) => {
      const pd = lead.property_data_cache;
      const leadChats = chatByLead.get(lead.id) || [];
      const latestChat = leadChats[0];
      const leadEvents = eventsByLead.get(lead.id) || [];

      // Parse chat messages + run intent detection
      let chatMessages: ChatMessage[] = [];
      let chatStage = "unknown";
      let chatTopics: string[] = [];
      let chatDepthTier: string | undefined;
      if (latestChat?.messages) {
        try {
          const msgs = typeof latestChat.messages === "string" ? JSON.parse(latestChat.messages) : latestChat.messages;
          if (Array.isArray(msgs)) {
            chatMessages = msgs.filter((m: any) => m.role && (m.content || m.parts));
          }
        } catch {}
      }

      // Run intent detection on full conversation
      if (chatMessages.length > 0) {
        const intent = detectIntent(chatMessages);
        chatStage = intent.stage;
        chatTopics = intent.questionTypes;
        // Map stage to chat depth tier
        if (intent.stage === "decision" || intent.stage === "close") {
          chatDepthTier = "high_intent";
        } else if (intent.stage === "consideration") {
          chatDepthTier = "engaged";
        } else if (chatMessages.filter(m => m.role === "user").length > 0) {
          chatDepthTier = "browsing";
        }
      }

      // Aggregate widget events
      const viewEvents = leadEvents.filter(
        (e) => e.event_type === "widget_view" || e.event_type === "living_estimate_view"
      );
      const materialEvents = leadEvents.filter((e) => e.event_type === "material_switch");
      const priceEvents = leadEvents.filter((e) => e.event_type === "price_adjustment");

      const widgetViews = viewEvents.length;
      const lastViewAt = viewEvents[0]?.created_at || null;
      const materialSwitches = materialEvents.length;
      const priceAdjustments = priceEvents.length;

      // Extract unique materials compared
      const materialsCompared = Array.from(
        new Set(
          materialEvents.flatMap((e) => {
            const meta = e.metadata as any;
            return [meta?.previous_material, meta?.new_material].filter(Boolean);
          })
        )
      );

      // Calculate most recent activity
      const activityDates = [
        lead.created_at,
        lead.contacted_at,
        latestChat?.updated_at,
        lastViewAt,
      ].filter(Boolean) as string[];
      const lastActivity = activityDates.length > 0
        ? activityDates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
        : lead.created_at;

      // Heat score — now with real widget data
      const { score } = calculateHeatScore({
        widgetViews,
        lastViewAt,
        materialSwitches,
        chatDepthTier: chatDepthTier || null,
        lastActivityAt: lastActivity,
        estimateHigh: lead.estimate_high,
        homeValue: pd?.estimated_value,
        lastSaleDate: pd?.last_sale_date,
      });

      // Alert badges
      const alerts: LeadWithDetails["alerts"] = [];
      if (!lead.contacted_at && lead.status === "new") {
        const hoursSinceCreated = (Date.now() - new Date(lead.created_at).getTime()) / (60 * 60 * 1000);
        if (hoursSinceCreated >= 48) {
          alerts.push({ type: "stale", label: "48h+ no contact" });
        }
      }
      if (pd?.last_sale_date) {
        const monthsSinceSale = (Date.now() - new Date(pd.last_sale_date).getTime()) / (30 * 24 * 60 * 60 * 1000);
        if (monthsSinceSale < 12) {
          alerts.push({ type: "new_homeowner", label: "New homeowner" });
        }
      }
      if (pd?.in_replacement_window) {
        alerts.push({ type: "replacement", label: "Replacement window" });
      }
      if (widgetViews >= 4) {
        alerts.push({ type: "hot_activity", label: `Viewed ${widgetViews}x` });
      }

      // Display-ready chat messages (last 5 for preview)
      const previewMessages = chatMessages
        .filter((m: any) => m.role && (m.content || m.parts))
        .slice(-5)
        .map((m: any) => ({
          role: m.role,
          content: m.content || m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "",
        }));

      return {
        ...lead,
        heatScore: score,
        propertyData: pd || undefined,
        chatPreview: chatMessages.length > 0 ? {
          messages: previewMessages,
          stage: chatStage,
          messageCount: chatMessages.filter(m => m.role === "user").length,
          topics: chatTopics,
        } : undefined,
        signals: {
          widgetViews,
          lastViewAt: lastViewAt || undefined,
          materialSwitches,
          materialsCompared: materialsCompared.length > 0 ? materialsCompared : undefined,
          chatDepthTier,
          priceAdjustments,
        },
        alerts,
      };
    });

    setLeads(enriched);
    setLoading(false);
  }

  async function handleStatusChange(leadId: string, newStatus: string) {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
    );

    if (isDemo) return; // Demo mode: local state only, no DB write

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId)
      .eq("contractor_id", contractorId);

    if (error) {
      console.error("Failed to update status:", error);
      // Revert on failure
      loadLeads();
    }
  }

  // Computed stats
  const hotLeads = leads.filter((l) => l.heatScore >= 70).length;
  const pipelineValue = leads
    .filter((l) => ["new", "contacted", "quoted", "appointment_set"].includes(l.status))
    .reduce((sum, l) => sum + (l.estimate_high || 0), 0);
  const avgResponse = (() => {
    const contacted = leads.filter((l) => l.contacted_at && l.created_at);
    if (contacted.length === 0) return "—";
    const avgMs = contacted.reduce((sum, l) => {
      return sum + (new Date(l.contacted_at!).getTime() - new Date(l.created_at).getTime());
    }, 0) / contacted.length;
    const hrs = avgMs / (60 * 60 * 1000);
    return hrs < 1 ? `${Math.round(hrs * 60)}m` : `${hrs.toFixed(1)}h`;
  })();
  const staleLeads = leads.filter((l) => {
    if (l.contacted_at || l.status !== "new") return false;
    return (Date.now() - new Date(l.created_at).getTime()) > 48 * 60 * 60 * 1000;
  }).length;

  // Pipeline health score (0-100)
  const pipelineHealth = Math.min(100, Math.round(
    (hotLeads > 0 ? 30 : 0) +
    (leads.length > 0 ? 20 : 0) +
    (staleLeads === 0 ? 20 : Math.max(0, 20 - staleLeads * 5)) +
    (avgResponse !== "—" ? 15 : 0) +
    (pipelineValue > 50000 ? 15 : pipelineValue > 10000 ? 10 : pipelineValue > 0 ? 5 : 0)
  ));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading your leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-7">
      {/* Greeting */}
      <div className="relative">
        <span
          className="neu-glow-orange"
          style={{ width: 480, height: 240, top: -80, left: -120 }}
          aria-hidden
        />
        <div className="neu-eyebrow mb-3 flex items-center gap-2 relative z-[1]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "#16a34a", boxShadow: "0 0 0 3px rgba(22,163,74,0.18)" }}
          />
          <span>Live · {new Date().toLocaleDateString("en-US", { weekday: "long" })}, {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
        <h1
          className="font-bold mb-2 relative z-[1]"
          style={{ color: "var(--neu-text)", fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.04em" }}
        >
          Hello, <em className="neu-em">{firstName}</em>.
        </h1>
        <p className="text-[15px] leading-relaxed max-w-[580px] relative z-[1]" style={{ color: "var(--neu-text-muted)" }}>
          {leads.length > 0 ? (
            <>
              You have <strong style={{ color: "var(--neu-text)", fontWeight: 600 }}>{leads.length} lead{leads.length !== 1 ? "s" : ""}</strong> in your pipeline · <strong style={{ color: "var(--neu-text)", fontWeight: 600 }}>{hotLeads} hot</strong> · <strong style={{ color: "var(--neu-text)", fontWeight: 600 }}>${(pipelineValue / 1000).toFixed(0)}K</strong> potential.
            </>
          ) : (
            "Your pipeline is empty — leads will show up here as homeowners engage."
          )}
        </p>
      </div>

      {/* Stat Cards */}
      <StatCardGrid>
        <StatCard
          label="Pipeline"
          value={`$${(pipelineValue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Hot Leads"
          value={hotLeads}
          subtitle="Scored 70+"
          icon={Flame}
          iconColor="bg-orange-50 text-orange-500"
        />
        <StatCard
          label="Avg Response"
          value={avgResponse}
          icon={Clock}
          iconColor="bg-blue-50 text-blue-500"
        />
        <StatCard
          label="Stale"
          value={staleLeads}
          subtitle="48h+ no contact"
          icon={AlertTriangle}
          iconColor={staleLeads > 0 ? "bg-red-50 text-red-500" : "bg-muted text-muted-foreground"}
        />
      </StatCardGrid>

      {/* Storm Banner */}
      <StormAlertBanner contractorId={contractorId} />

      {/* Lead List */}
      <LeadList leads={leads} onStatusChange={handleStatusChange} />
    </div>
  );
}
