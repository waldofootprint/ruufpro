"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "./DashboardContext";
import { supabase } from "@/lib/supabase";
import { calculateHeatScore } from "@/lib/heat-score";
import { StatCard, StatCardGrid } from "@/components/dashboard/stat-cards";
import { LeadList, type LeadWithDetails } from "@/components/dashboard/lead-list";
import StormAlertBanner from "@/components/dashboard/StormAlertBanner";
import { Flame, Clock, MessageSquare, AlertTriangle, DollarSign } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";

export default function DashboardHome() {
  const { contractorId, businessName, tier } = useDashboard();
  const [leads, setLeads] = useState<LeadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = businessName.split("'")[0].split(" ")[0];

  useEffect(() => {
    if (!contractorId) return;
    loadLeads();
  }, [contractorId]);

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

    // Fetch chat conversations for these leads
    const leadIds = rawLeads.map((l) => l.id);
    const { data: chats } = await supabase
      .from("chat_conversations")
      .select("lead_id, messages, updated_at")
      .in("lead_id", leadIds.length > 0 ? leadIds : ["__none__"])
      .order("updated_at", { ascending: false });

    const chatByLead = new Map<string, typeof chats>();
    chats?.forEach((c) => {
      if (!chatByLead.has(c.lead_id)) chatByLead.set(c.lead_id, []);
      chatByLead.get(c.lead_id)!.push(c);
    });

    // Build enriched leads
    const enriched: LeadWithDetails[] = rawLeads.map((lead) => {
      const pd = lead.property_data_cache;
      const leadChats = chatByLead.get(lead.id) || [];
      const latestChat = leadChats[0];

      // Parse chat messages
      let chatMessages: { role: string; content: string }[] = [];
      let chatStage = "unknown";
      let chatTopics: string[] = [];
      if (latestChat?.messages) {
        try {
          const msgs = typeof latestChat.messages === "string" ? JSON.parse(latestChat.messages) : latestChat.messages;
          if (Array.isArray(msgs)) {
            chatMessages = msgs.filter((m: any) => m.role && m.content).slice(-5);
          }
        } catch {}
      }

      // Calculate most recent activity
      const activityDates = [
        lead.created_at,
        lead.contacted_at,
        latestChat?.updated_at,
      ].filter(Boolean) as string[];
      const lastActivity = activityDates.length > 0
        ? activityDates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
        : lead.created_at;

      // Heat score
      const { score } = calculateHeatScore({
        widgetViews: 0, // TODO: wire up when widget_events table exists
        lastViewAt: null,
        materialSwitches: 0,
        chatDepthTier: chatMessages.length > 10 ? "high_intent" : chatMessages.length > 4 ? "engaged" : chatMessages.length > 0 ? "browsing" : null,
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

      return {
        ...lead,
        heatScore: score,
        propertyData: pd || undefined,
        chatPreview: latestChat ? {
          messages: chatMessages,
          stage: chatStage,
          messageCount: chatMessages.length,
          topics: chatTopics,
        } : undefined,
        signals: {
          widgetViews: 0,
          materialSwitches: 0,
          chatDepthTier: chatMessages.length > 10 ? "high_intent" : chatMessages.length > 4 ? "engaged" : chatMessages.length > 0 ? "browsing" : undefined,
          priceAdjustments: 0,
        },
        alerts,
      };
    });

    setLeads(enriched);
    setLoading(false);
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
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Hello, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {leads.length > 0
            ? `You have ${leads.length} lead${leads.length !== 1 ? "s" : ""} · ${hotLeads} hot · $${(pipelineValue / 1000).toFixed(0)}K pipeline`
            : "Your pipeline is empty — leads will show up here as homeowners engage."}
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
      <LeadList leads={leads} />
    </div>
  );
}
