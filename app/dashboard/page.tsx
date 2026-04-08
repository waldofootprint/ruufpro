"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "./DashboardContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users, Zap, DollarSign, ChevronRight, Star, Link2, UserPlus,
  MessageCircle, Eye, Bell, CheckCircle, X, Phone, TrendingUp,
  Target, BarChart3, Trophy, Flame, Share2, Search, Calendar, Plus,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import {
  getAvgResponseTime,
  getSpeedToLead,
  formatTimeAgo,
  calculateRevenue,
} from "@/lib/dashboard-utils";

interface ActivityEvent {
  id: string;
  icon: "auto_text" | "review_request" | "estimate_view" | "new_lead";
  description: string;
  time: string;
}

type PopupType = "waiting" | "speed" | "pipeline" | "reviews" | null;

export default function DashboardHome() {
  const { contractorId, businessName, tier, refreshLeadCount } = useDashboard();
  const isPro = tier === "pro" || tier === "growth";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewClicked, setReviewClicked] = useState(0);
  const [reviewCompleted, setReviewCompleted] = useState(0);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [smsMessages, setSmsMessages] = useState<any[]>([]);
  const [showAddLead, setShowAddLead] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({
    name: "", phone: "", email: "", address: "", message: "",
    estimate_material: "", estimate_roof_sqft: "", estimate_low: "", estimate_high: "",
    timeline: "" as string, financing_interest: "" as string, notes: "",
  });
  const [addLeadSaving, setAddLeadSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "activity">("overview");
  const [selectedNewLead, setSelectedNewLead] = useState<Lead | null>(null);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;

      // Fetch leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });
      setLeads((leadsData as Lead[]) || []);

      // Fetch review request stats
      try {
        const { data: reviews } = await supabase
          .from("review_requests")
          .select("id, status")
          .eq("contractor_id", contractorId);
        if (reviews) {
          setReviewCount(reviews.length);
          setReviewClicked(reviews.filter((r: any) => r.status === "clicked" || r.status === "reviewed").length);
          setReviewCompleted(reviews.filter((r: any) => r.status === "reviewed").length);
        }
      } catch { /* table may not exist yet */ }

      // Fetch SMS messages for speed timeline
      try {
        const { data: sms } = await supabase
          .from("sms_messages")
          .select("id, created_at, lead_id, direction, message_type")
          .eq("contractor_id", contractorId)
          .order("created_at", { ascending: false })
          .limit(50);
        setSmsMessages(sms || []);
      } catch { /* table may not exist */ }

      // Build activity feed
      const events: ActivityEvent[] = [];

      (leadsData || []).slice(0, 5).forEach((l: Lead) => {
        events.push({
          id: `lead-${l.id}`,
          icon: "new_lead",
          description: `New estimate request from ${l.name}`,
          time: l.created_at,
        });
      });

      try {
        const { data: smsData } = await supabase
          .from("sms_messages")
          .select("id, created_at, lead_id, message_type")
          .eq("contractor_id", contractorId)
          .eq("direction", "outbound")
          .order("created_at", { ascending: false })
          .limit(10);
        if (smsData) {
          smsData.forEach((sms: any) => {
            events.push({
              id: `sms-${sms.id}`,
              icon: "auto_text",
              description: sms.message_type === "review_request"
                ? "Review request sent via SMS"
                : "Auto-texted estimate link to lead",
              time: sms.created_at,
            });
          });
        }
      } catch { /* table may not exist yet */ }

      try {
        const { data: reviewData } = await supabase
          .from("review_requests")
          .select("id, created_at, status")
          .eq("contractor_id", contractorId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (reviewData) {
          reviewData.forEach((rr: any) => {
            events.push({
              id: `review-${rr.id}`,
              icon: "review_request",
              description: rr.status === "reviewed"
                ? "Google review received!"
                : rr.status === "clicked"
                ? "Review link clicked by homeowner"
                : "Review request sent",
              time: rr.created_at,
            });
          });
        }
      } catch { /* table may not exist yet */ }

      events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivityEvents(events.slice(0, 10));

      setLoading(false);
    }
    load();
  }, [contractorId]);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ---- Derived data ----

  const newLeads = leads.filter((l) => l.status === "new");
  const newCount = newLeads.length;
  const avgResponse = getAvgResponseTime(leads);

  // Industry benchmark: avg roofer responds in ~3 hours (180 min)
  // Source: roofing industry reports on speed-to-lead
  const INDUSTRY_AVG_MINS = 180;
  const contactedLeads = leads.filter((l) => l.contacted_at);
  const avgResponseMins = contactedLeads.length > 0
    ? Math.floor(contactedLeads.reduce((sum, l) => {
        return sum + (new Date(l.contacted_at!).getTime() - new Date(l.created_at).getTime());
      }, 0) / contactedLeads.length / 60000)
    : null;
  const fasterThanPct = avgResponseMins !== null && avgResponseMins < INDUSTRY_AVG_MINS
    ? Math.min(99, Math.round(((INDUSTRY_AVG_MINS - avgResponseMins) / INDUSTRY_AVG_MINS) * 100))
    : null;

  const pipelineLeads = leads.filter(
    (l) => l.status !== "lost" && l.status !== "won" && l.estimate_low && l.estimate_high
  );
  const pipelineValue = pipelineLeads.reduce(
    (sum, l) => sum + ((l.estimate_low! + l.estimate_high!) / 2), 0
  );
  const pipelineCount = pipelineLeads.length;

  const wonLeads = leads.filter((l) => l.status === "won");
  const revenue = calculateRevenue(leads);
  const conversionRate = leads.length > 0
    ? Math.round((wonLeads.length / leads.length) * 100)
    : 0;

  const avgEstimate = pipelineLeads.length > 0
    ? pipelineLeads.reduce((sum, l) => sum + ((l.estimate_low! + l.estimate_high!) / 2), 0) / pipelineLeads.length
    : 0;

  const highestEstimate = leads.reduce((max, l) => {
    if (l.estimate_high && l.estimate_high > max) return l.estimate_high;
    return max;
  }, 0);

  // Leads with living estimates
  const leadsWithEstimates = leads.filter((l) => l.living_estimate_id);

  const automationCount = activityEvents.filter(
    (e) => e.icon === "auto_text" || e.icon === "review_request"
  ).length;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = businessName.split(" ")[0];

  async function saveNewLead() {
    if (!addLeadForm.name.trim()) return;
    setAddLeadSaving(true);
    const lowNum = addLeadForm.estimate_low ? parseFloat(addLeadForm.estimate_low) : null;
    const highNum = addLeadForm.estimate_high ? parseFloat(addLeadForm.estimate_high) : null;
    const sqftNum = addLeadForm.estimate_roof_sqft ? parseFloat(addLeadForm.estimate_roof_sqft) : null;
    const { data } = await supabase
      .from("leads")
      .insert({
        contractor_id: contractorId,
        name: addLeadForm.name.trim(),
        phone: addLeadForm.phone.trim() || null,
        email: addLeadForm.email.trim() || null,
        address: addLeadForm.address.trim() || null,
        message: addLeadForm.message.trim() || null,
        estimate_material: addLeadForm.estimate_material || null,
        estimate_roof_sqft: sqftNum,
        estimate_low: lowNum,
        estimate_high: highNum,
        timeline: addLeadForm.timeline || null,
        financing_interest: addLeadForm.financing_interest || null,
        notes: addLeadForm.notes.trim() || null,
        source: "contact_form",
        status: "new",
      })
      .select()
      .single();
    if (data) {
      setLeads((prev) => [data as Lead, ...prev]);
    }
    setAddLeadForm({
      name: "", phone: "", email: "", address: "", message: "",
      estimate_material: "", estimate_roof_sqft: "", estimate_low: "", estimate_high: "",
      timeline: "", financing_interest: "", notes: "",
    });
    setAddLeadSaving(false);
    setShowAddLead(false);
  }

  function copyWidgetLink() {
    const link = `${window.location.origin}/widget/${contractorId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Lead heat: Hot (ASAP + new), Warm (1-3mo or contacted), Cool (exploring or stale)
  function getLeadHeat(lead: Lead): "hot" | "warm" | "cool" {
    const isNew = lead.status === "new";
    const isAsap = lead.timeline === "now";
    const isSoon = lead.timeline === "1_3_months";
    const isContacted = lead.status === "contacted" || lead.status === "appointment_set";

    if (isNew && isAsap) return "hot";
    if (isNew && isSoon) return "warm";
    if (isNew) return "warm"; // new with no timeline = warm by default
    if (isContacted) return "warm";
    return "cool";
  }

  const heatConfig = {
    hot: { label: "Hot", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    warm: { label: "Warm", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    cool: { label: "Cool", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
  };

  async function acknowledgeLead(leadId: string) {
    await supabase.from("leads").update({ status: "contacted" }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: "contacted" } : l));
    refreshLeadCount();
  }

  function getEventIcon(icon: ActivityEvent["icon"]) {
    switch (icon) {
      case "auto_text": return <Zap className="w-3.5 h-3.5 text-emerald-500" />;
      case "review_request": return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case "estimate_view": return <Eye className="w-3.5 h-3.5 text-blue-500" />;
      case "new_lead": return <Bell className="w-3.5 h-3.5 text-[#D4863E]" />;
    }
  }

  // Speed timeline for a lead
  function getLeadTimeline(lead: Lead) {
    const leadArrived = new Date(lead.created_at);
    const autoText = smsMessages.find(
      (sms) => sms.lead_id === lead.id && sms.direction === "outbound"
    );
    const autoTextTime = autoText ? new Date(autoText.created_at) : null;
    const calledTime = lead.contacted_at ? new Date(lead.contacted_at) : null;

    return { leadArrived, autoTextTime, calledTime };
  }

  function formatTimeDiff(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "—";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "<1m";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m`;
    return `${Math.floor(hours / 24)}d`;
  }

  // ---- Main render ----

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="max-w-[1060px] mx-auto">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{todayStr}</p>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold bg-[#1B3A4B] text-white hover:bg-[#162f3d] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-8">
        {(["overview", "leads", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-semibold capitalize rounded-md transition-all ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Waiting Leads */}
            <button
              onClick={() => setActivePopup("waiting")}
              className="rounded-xl bg-white border border-slate-200 p-5 text-left transition-all hover:shadow-sm hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-slate-400">Waiting Leads</span>
                <Users className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
                {newCount}
              </div>
              <p className="text-[11px] font-medium text-emerald-600 mt-2">
                {newCount > 0 ? `${newCount} homeowner${newCount > 1 ? "s" : ""} waiting` : "All caught up"}
              </p>
            </button>

            {/* Response Speed */}
            <button
              onClick={() => setActivePopup("speed")}
              className="rounded-xl bg-white border border-slate-200 p-5 text-left transition-all hover:shadow-sm hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-slate-400">Avg Response Time</span>
                <Zap className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
                {avgResponse || "—"}
              </div>
              <p className="text-[11px] font-medium text-emerald-600 mt-2">
                {fasterThanPct
                  ? `Faster than ${fasterThanPct}% of roofers`
                  : avgResponse
                  ? "Industry avg: 3 hours"
                  : "Respond to start tracking"}
              </p>
            </button>

            {/* Pipeline */}
            <button
              onClick={() => setActivePopup("pipeline")}
              className="rounded-xl bg-white border border-slate-200 p-5 text-left transition-all hover:shadow-sm hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-slate-400">Pipeline Value</span>
                <TrendingUp className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
                {pipelineValue > 0 ? `$${(pipelineValue / 1000).toFixed(1)}K` : "$0"}
              </div>
              <p className="text-[11px] font-medium text-emerald-600 mt-2">
                {pipelineCount > 0 ? `${pipelineCount} open estimate${pipelineCount > 1 ? "s" : ""}` : "Estimates appear with leads"}
              </p>
            </button>

            {/* Reviews */}
            <button
              onClick={() => setActivePopup("reviews")}
              className="rounded-xl bg-white border border-slate-200 p-5 text-left transition-all hover:shadow-sm hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-slate-400">Review Requests</span>
                <Star className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
                {reviewCount}
              </div>
              <p className="text-[11px] font-medium text-emerald-600 mt-2">
                {reviewCount > 0 ? `${reviewClicked} clicked · ${reviewCompleted} reviewed` : "Auto-sent after completed jobs"}
              </p>
            </button>
          </div>

          {/* Two-column: Leads + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* New Leads — wider column */}
            <div className="lg:col-span-3 rounded-xl bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">New Leads</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">Check off leads as you respond to them</p>
                </div>
                <a href="/dashboard/leads" className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
              {newLeads.length === 0 && leads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-slate-400">No leads yet</p>
                  <p className="text-[12px] text-slate-300 mt-1">Share your widget link to start getting estimates</p>
                </div>
              ) : newLeads.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-slate-400">All caught up!</p>
                  <p className="text-[12px] text-slate-300 mt-1">No new leads waiting for a response</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {newLeads.slice(0, 6).map((lead) => {
                    const heat = getLeadHeat(lead);
                    const hc = heatConfig[heat];
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-lg hover:bg-slate-50 transition-colors -mx-1 group"
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => acknowledgeLead(lead.id)}
                          className="w-4 h-4 rounded border-[1.5px] border-slate-300 flex items-center justify-center flex-shrink-0 hover:border-blue-500 hover:bg-blue-50 transition-colors group-hover:border-slate-400"
                        >
                          <CheckCircle className="w-3 h-3 text-transparent group-hover:text-slate-500 transition-colors" />
                        </button>

                        {/* Lead info — click to open detail */}
                        <button
                          onClick={() => setSelectedNewLead(lead)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-semibold text-slate-800 truncate block">{lead.name}</span>
                            <p className="text-[11px] text-slate-400 truncate">
                              {lead.estimate_material || "Contact form"}
                              {lead.address ? ` · ${lead.address.split(",")[0]}` : ""}
                            </p>
                          </div>

                          {/* Heat pill */}
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${hc.bg} ${hc.text} flex-shrink-0`}>
                            {hc.label}
                          </span>

                          {/* Estimate value + date */}
                          <div className="text-right flex-shrink-0">
                            {lead.estimate_low && lead.estimate_high ? (
                              <p className="text-[12px] font-bold text-slate-900">
                                ${((lead.estimate_low + lead.estimate_high) / 2 / 1000).toFixed(1)}K
                              </p>
                            ) : null}
                            <p className="text-[10px] text-slate-400">{formatTimeAgo(lead.created_at)}</p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Feed — narrower column */}
            <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 p-6">
              <div className="mb-5">
                <h3 className="text-[15px] font-bold text-slate-900">Activity</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {automationCount > 0
                    ? `${automationCount} automation${automationCount > 1 ? "s" : ""} recently`
                    : "RuufPro works while you work"}
                </p>
              </div>
              {activityEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-slate-400">No activity yet</p>
                  <p className="text-[12px] text-slate-300 mt-1">Auto-texts, reviews, estimate views</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activityEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 py-2.5">
                      <div className="mt-0.5 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                        {getEventIcon(event.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-slate-700 leading-snug">{event.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatTimeAgo(event.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== LEADS TAB ===== */}
      {activeTab === "leads" && (
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">All Leads</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">{leads.length} total lead{leads.length !== 1 ? "s" : ""}</p>
            </div>
            <a href="/dashboard/leads" className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#1B3A4B] text-white hover:bg-[#162f3d] transition-colors">
              Open Pipeline <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="space-y-1">
            {leads.slice(0, 10).map((lead) => {
              const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const statusColors: Record<string, string> = {
                new: "bg-[#D4863E]/10 text-[#D4863E]",
                contacted: "bg-blue-50 text-blue-600",
                appointment_set: "bg-teal-50 text-teal-600",
                quoted: "bg-purple-50 text-purple-600",
                won: "bg-emerald-50 text-emerald-600",
                completed: "bg-amber-50 text-amber-600",
                lost: "bg-slate-100 text-slate-400",
              };
              return (
                <a key={lead.id} href="/dashboard/leads" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors -mx-1">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-slate-800 truncate block">{lead.name}</span>
                    <p className="text-[11px] text-slate-400 truncate">
                      {lead.estimate_material || "Contact form"}
                      {lead.address ? ` · ${lead.address.split(",")[0]}` : ""}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${statusColors[lead.status] || "bg-slate-100 text-slate-400"}`}>
                    {lead.status.replace("_", " ")}
                  </span>
                  <div className="text-right flex-shrink-0 w-20">
                    {lead.estimate_low && lead.estimate_high ? (
                      <p className="text-[12px] font-bold text-slate-900">
                        ${(lead.estimate_low / 1000).toFixed(1)}K–${(lead.estimate_high / 1000).toFixed(1)}K
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-300">—</p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ACTIVITY TAB ===== */}
      {activeTab === "activity" && (
        <div className="rounded-xl bg-white border border-slate-200 p-6 max-w-2xl">
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-slate-900">All Activity</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Everything RuufPro has done for you</p>
          </div>
          {activityEvents.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-slate-400">No activity yet</p>
              <p className="text-[12px] text-slate-300 mt-1">Auto-texts, review requests, and estimate views will appear here</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {activityEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                    {getEventIcon(event.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 leading-snug">{event.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{formatTimeAgo(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ADD LEAD MODAL ===== */}
      <AnimatePresence>
        {showAddLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowAddLead(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
            >
              <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md sm:mx-4 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#1B3A4B]" />
                    <h3 className="text-[16px] font-bold text-slate-800">Add Lead</h3>
                  </div>
                  <button onClick={() => setShowAddLead(false)} className="text-slate-300 hover:text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Contact info */}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contact Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Name *</label>
                      <input
                        type="text"
                        value={addLeadForm.name}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Mike Rodriguez"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
                      <input
                        type="tel"
                        value={addLeadForm.phone}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="(813) 555-1234"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        value={addLeadForm.email}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="mike@email.com"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Address</label>
                      <input
                        type="text"
                        value={addLeadForm.address}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="1234 Oak St, Tampa, FL"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                  </div>

                  {/* Estimate info */}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-2">Estimate Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Material</label>
                      <select
                        value={addLeadForm.estimate_material}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_material: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="asphalt">Asphalt Shingle</option>
                        <option value="metal">Metal</option>
                        <option value="tile">Tile</option>
                        <option value="flat">Flat</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Roof Sqft</label>
                      <input
                        type="number"
                        value={addLeadForm.estimate_roof_sqft}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_roof_sqft: e.target.value }))}
                        placeholder="2,400"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Estimate Low ($)</label>
                      <input
                        type="number"
                        value={addLeadForm.estimate_low}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_low: e.target.value }))}
                        placeholder="12500"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Estimate High ($)</label>
                      <input
                        type="number"
                        value={addLeadForm.estimate_high}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_high: e.target.value }))}
                        placeholder="18200"
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                      />
                    </div>
                  </div>

                  {/* Qualification */}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-2">Qualification</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Timeline</label>
                      <select
                        value={addLeadForm.timeline}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, timeline: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="now">ASAP</option>
                        <option value="1_3_months">1-3 Months</option>
                        <option value="no_timeline">Just Exploring</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Financing</label>
                      <select
                        value={addLeadForm.financing_interest}
                        onChange={(e) => setAddLeadForm((f) => ({ ...f, financing_interest: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Message / Notes</label>
                    <textarea
                      value={addLeadForm.message}
                      onChange={(e) => setAddLeadForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Called about storm damage on the back slope..."
                      rows={2}
                      className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] resize-none"
                    />
                  </div>

                  <button
                    onClick={saveNewLead}
                    disabled={!addLeadForm.name.trim() || addLeadSaving}
                    className="w-full py-3 rounded-xl text-[14px] font-bold text-white bg-[#1B3A4B] hover:bg-[#1B3A4B]/90 transition-colors disabled:opacity-50"
                  >
                    {addLeadSaving ? "Saving..." : "Add Lead"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== LEAD DETAIL POPUP ===== */}
      <AnimatePresence>
        {selectedNewLead && (() => {
          const lead = selectedNewLead;
          const heat = getLeadHeat(lead);
          const hc = heatConfig[heat];
          const timelineLabels: Record<string, string> = {
            now: "ASAP",
            "1_3_months": "1-3 Months",
            no_timeline: "Just Exploring",
          };
          const financingLabels: Record<string, string> = {
            yes: "Interested",
            no: "Not interested",
            maybe: "Maybe",
          };
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={() => setSelectedNewLead(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
              >
                <div
                  className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md sm:mx-4 pointer-events-auto max-h-[85vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-500">
                        {lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-slate-800">{lead.name}</h3>
                        <p className="text-[11px] text-slate-400">{formatTimeAgo(lead.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${hc.bg} ${hc.text}`}>
                        {hc.label}
                      </span>
                      <button onClick={() => setSelectedNewLead(null)} className="text-slate-300 hover:text-slate-500">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact actions */}
                  <div className="px-5 py-4 flex gap-2">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold bg-[#1B3A4B] text-white hover:bg-[#162f3d] transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call {lead.name.split(" ")[0]}
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Email
                      </a>
                    )}
                  </div>

                  {/* Details */}
                  <div className="px-5 pb-5 space-y-4">
                    {/* Estimate */}
                    {lead.estimate_low && lead.estimate_high && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Estimate</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[22px] font-extrabold text-slate-900">
                            ${lead.estimate_low.toLocaleString()}
                          </span>
                          <span className="text-[14px] text-slate-400">–</span>
                          <span className="text-[22px] font-extrabold text-slate-900">
                            ${lead.estimate_high.toLocaleString()}
                          </span>
                        </div>
                        {lead.estimate_material && (
                          <p className="text-[12px] text-slate-500 mt-1">{lead.estimate_material}</p>
                        )}
                        {lead.estimate_roof_sqft && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{lead.estimate_roof_sqft.toLocaleString()} sq ft</p>
                        )}
                      </div>
                    )}

                    {/* Contact info */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Contact</p>
                      <div className="space-y-2">
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[13px] text-slate-700">{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[13px] text-slate-700">{lead.email}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[13px] text-slate-700">{lead.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="grid grid-cols-2 gap-3">
                      {lead.timeline && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Timeline</p>
                          <p className="text-[13px] font-semibold text-slate-800 mt-1">{timelineLabels[lead.timeline] || lead.timeline}</p>
                        </div>
                      )}
                      {lead.financing_interest && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Financing</p>
                          <p className="text-[13px] font-semibold text-slate-800 mt-1">{financingLabels[lead.financing_interest] || lead.financing_interest}</p>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {lead.message && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Message</p>
                        <p className="text-[13px] text-slate-700 leading-relaxed">{lead.message}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {lead.notes && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                        <p className="text-[13px] text-slate-700 leading-relaxed">{lead.notes}</p>
                      </div>
                    )}

                    {/* Mark as contacted */}
                    <button
                      onClick={() => { acknowledgeLead(lead.id); setSelectedNewLead(null); }}
                      className="w-full py-3 rounded-xl text-[13px] font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Contacted
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ===== POPUP MODALS ===== */}
      <AnimatePresence>
        {activePopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setActivePopup(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
            >
              <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md sm:mx-4 max-h-[85vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ---- WAITING POPUP ---- */}
                {activePopup === "waiting" && (
                  <div>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D4863E]" />
                        <h3 className="text-[16px] font-bold text-slate-800">Waiting Leads</h3>
                      </div>
                      <button onClick={() => setActivePopup(null)} className="text-slate-300 hover:text-slate-500">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-5">
                      {newLeads.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="text-[32px] mb-2">🎉</div>
                          <p className="text-[14px] font-bold text-slate-800">All caught up!</p>
                          <p className="text-[12px] text-slate-400 mt-1">No new leads waiting for a response.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {newLeads.map((lead) => {
                            const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                            return (
                              <div key={lead.id} className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-[#1B3A4B] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                                    {initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-bold text-slate-800">{lead.name}</p>
                                    <p className="text-[12px] text-slate-500 mt-0.5">
                                      {lead.estimate_material || "Contact form"}
                                      {lead.estimate_roof_sqft ? ` · ${lead.estimate_roof_sqft.toLocaleString()} sqft` : ""}
                                    </p>
                                    {lead.estimate_low && lead.estimate_high && (
                                      <p className="text-[13px] font-bold text-slate-800 mt-1">
                                        ${(lead.estimate_low / 1000).toFixed(1)}K – ${(lead.estimate_high / 1000).toFixed(1)}K
                                      </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(lead.created_at)}</p>
                                  </div>
                                </div>
                                {lead.phone && (() => {
                                  const autoText = smsMessages.find(
                                    (sms) => sms.lead_id === lead.id && sms.direction === "outbound" && sms.message_type === "lead_auto_response"
                                  );
                                  return (
                                    <div className="grid grid-cols-2 gap-2">
                                      <a
                                        href={`tel:${lead.phone}`}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1B3A4B] text-white text-[12px] font-bold hover:bg-[#1B3A4B]/90 transition-colors"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                        Call
                                      </a>
                                      {isPro && autoText ? (
                                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>Estimate texted {formatTimeAgo(autoText.created_at)}</span>
                                        </div>
                                      ) : (
                                        <a
                                          href={`sms:${lead.phone}?body=${encodeURIComponent(
                                            `Hey ${lead.name.split(" ")[0]}, this is ${businessName}. Thanks for requesting a roof estimate! When's a good day for a free inspection?`
                                          )}`}
                                          className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-bold hover:bg-slate-200 transition-colors"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          Text
                                        </a>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---- SPEED POPUP ---- */}
                {activePopup === "speed" && (
                  <div>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-[16px] font-bold text-slate-800">Response Speed</h3>
                      </div>
                      <button onClick={() => setActivePopup(null)} className="text-slate-300 hover:text-slate-500">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-5">
                      {/* Overall stat */}
                      <div className="text-center mb-5 pb-5 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Avg Response Time</p>
                        <p className="text-[36px] font-extrabold text-emerald-600 leading-none">{avgResponse || "—"}</p>
                        {fasterThanPct ? (
                          <p className="text-[11px] text-emerald-600 font-semibold mt-2">Faster than {fasterThanPct}% of roofers</p>
                        ) : avgResponse ? (
                          <p className="text-[11px] text-slate-400 font-semibold mt-2">Industry avg: 3 hours</p>
                        ) : null}
                      </div>

                      {/* Per-lead timelines */}
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-3">Lead Timeline</p>
                      <div className="space-y-4">
                        {leads.filter((l) => l.contacted_at).slice(0, 5).map((lead) => {
                          const timeline = getLeadTimeline(lead);
                          const speed = getSpeedToLead(lead);
                          return (
                            <div key={lead.id} className="rounded-lg bg-slate-50 p-3">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-[13px] font-bold text-slate-800">{lead.name}</p>
                                {speed && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                    ⚡ {speed}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                {/* Lead arrived */}
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-[#D4863E] flex items-center justify-center flex-shrink-0">
                                    <Bell className="w-3 h-3 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[11px] font-semibold text-slate-700">Lead came in</p>
                                    <p className="text-[10px] text-slate-400">
                                      {timeline.leadArrived.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>

                                {/* Auto-text */}
                                {timeline.autoTextTime && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                      <Zap className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[11px] font-semibold text-slate-700">Auto-text sent</p>
                                      <p className="text-[10px] text-slate-400">
                                        {formatTimeDiff(timeline.leadArrived, timeline.autoTextTime)} after lead
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Roofer called */}
                                {timeline.calledTime && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#1B3A4B] flex items-center justify-center flex-shrink-0">
                                      <Phone className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[11px] font-semibold text-slate-700">You responded</p>
                                      <p className="text-[10px] text-slate-400">
                                        {formatTimeDiff(timeline.leadArrived, timeline.calledTime)} after lead
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {leads.filter((l) => l.contacted_at).length === 0 && (
                          <div className="text-center py-6">
                            <Zap className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-[12px] text-slate-400">Respond to your first lead to see your speed timeline</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- PIPELINE POPUP ---- */}
                {activePopup === "pipeline" && (
                  <div>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#1B3A4B]" />
                        <h3 className="text-[16px] font-bold text-slate-800">Pipeline Stats</h3>
                      </div>
                      <button onClick={() => setActivePopup(null)} className="text-slate-300 hover:text-slate-500">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-5">
                      {/* Big pipeline value */}
                      <div className="text-center mb-5 pb-5 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Total Pipeline</p>
                        <p className="text-[36px] font-extrabold text-[#1B3A4B] leading-none">
                          ${(pipelineValue / 1000).toFixed(1)}K
                        </p>
                      </div>

                      {/* Gamified stats grid */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-[20px] mb-1">📊</p>
                          <p className="text-[18px] font-extrabold text-slate-800">{leads.length}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Leads</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-[20px] mb-1">🎯</p>
                          <p className="text-[18px] font-extrabold text-slate-800">{pipelineCount}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Open Estimates</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-[20px] mb-1">💰</p>
                          <p className="text-[18px] font-extrabold text-slate-800">
                            {avgEstimate > 0 ? `$${(avgEstimate / 1000).toFixed(1)}K` : "—"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Avg Estimate</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-[20px] mb-1">🏆</p>
                          <p className="text-[18px] font-extrabold text-slate-800">
                            {highestEstimate > 0 ? `$${(highestEstimate / 1000).toFixed(1)}K` : "—"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Highest Estimate</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-[20px] mb-1">🔥</p>
                          <p className="text-[18px] font-extrabold text-slate-800">{conversionRate}%</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Close Rate</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-[20px] mb-1">✅</p>
                          <p className="text-[18px] font-extrabold text-emerald-600 font-extrabold">
                            {revenue > 0 ? `$${(revenue / 1000).toFixed(1)}K` : "$0"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Revenue Won</p>
                        </div>
                      </div>

                      {/* Engagement stats */}
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-3">📈 Engagement</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-500" />
                            <span className="text-[12px] font-semibold text-slate-700">Estimates with living links</span>
                          </div>
                          <span className="text-[13px] font-bold text-blue-600">{leadsWithEstimates.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                          <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-purple-500" />
                            <span className="text-[12px] font-semibold text-slate-700">Leads with materials selected</span>
                          </div>
                          <span className="text-[13px] font-bold text-purple-600">
                            {leads.filter((l) => l.estimate_material).length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <span className="text-[12px] font-semibold text-slate-700">Leads with financing interest</span>
                          </div>
                          <span className="text-[13px] font-bold text-amber-600">
                            {leads.filter((l) => l.financing_interest === "yes").length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- REVIEWS POPUP ---- */}
                {activePopup === "reviews" && (
                  <div>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <h3 className="text-[16px] font-bold text-slate-800">Review Stats</h3>
                      </div>
                      <button onClick={() => setActivePopup(null)} className="text-slate-300 hover:text-slate-500">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-5">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="rounded-xl bg-amber-50 p-3 text-center">
                          <p className="text-[20px] mb-1">📤</p>
                          <p className="text-[20px] font-extrabold text-slate-800">{reviewCount}</p>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase">Sent</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3 text-center">
                          <p className="text-[20px] mb-1">👆</p>
                          <p className="text-[20px] font-extrabold text-slate-800">{reviewClicked}</p>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase">Clicked</p>
                        </div>
                        <div className="rounded-xl bg-violet-50 p-3 text-center">
                          <p className="text-[20px] mb-1">⭐</p>
                          <p className="text-[20px] font-extrabold text-slate-800">{reviewCompleted}</p>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase">Reviewed</p>
                        </div>
                      </div>

                      {/* Conversion funnel */}
                      {reviewCount > 0 && (
                        <div className="mb-5 pb-5 border-b border-slate-100">
                          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-3">📊 Conversion Funnel</p>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-slate-500">Sent → Clicked</span>
                                <span className="text-[11px] font-bold text-slate-700">
                                  {reviewCount > 0 ? Math.round((reviewClicked / reviewCount) * 100) : 0}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${reviewCount > 0 ? (reviewClicked / reviewCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-slate-500">Clicked → Reviewed</span>
                                <span className="text-[11px] font-bold text-slate-700">
                                  {reviewClicked > 0 ? Math.round((reviewCompleted / reviewClicked) * 100) : 0}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-500 rounded-full transition-all"
                                  style={{ width: `${reviewClicked > 0 ? (reviewCompleted / reviewClicked) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Google Reviews teaser */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                        <p className="text-[24px] mb-2">🔗</p>
                        <p className="text-[13px] font-bold text-slate-800 mb-1">Connect Google Reviews</p>
                        <p className="text-[11px] text-slate-400 mb-3">
                          See your latest Google reviews right here and reply with one click.
                        </p>
                        <span className="text-[11px] font-semibold text-[#1B3A4B] bg-[#1B3A4B]/10 px-3 py-1.5 rounded-lg">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
