"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "./DashboardContext";
import { Users, Zap, DollarSign, ChevronRight, Phone, MessageSquare, Star, AlertCircle } from "lucide-react";
import type { Lead } from "@/lib/types";
import {
  getLeadTemperature,
  getTemperatureConfig,
  getSpeedToLead,
  formatTimeAgo,
  getAvgResponseTime,
} from "@/lib/dashboard-utils";

export default function DashboardHome() {
  const { contractorId, businessName } = useDashboard();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);
      setLoading(false);
    }
    load();
  }, [contractorId]);

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading dashboard...</div>;
  }

  const newCount = leads.filter((l) => l.status === "new").length;
  const avgResponse = getAvgResponseTime(leads);

  // Pipeline value: sum of estimate midpoints for non-lost leads
  const pipelineValue = leads
    .filter((l) => l.status !== "lost" && l.status !== "won" && l.estimate_low && l.estimate_high)
    .reduce((sum, l) => sum + ((l.estimate_low! + l.estimate_high!) / 2), 0);

  // Open items — actionable things that need attention
  const unrepliedLeads = leads.filter((l) => l.status === "new");
  const quotedNotSigned = leads.filter((l) => l.status === "quoted");
  const contactedNoFollowup = leads.filter((l) => l.status === "contacted");
  const completedNoReview = leads.filter((l) => l.status === "completed" || l.status === "won");

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = businessName.split(" ")[0];

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-[13px] text-slate-400 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          {newCount > 0 && ` · ${newCount} new lead${newCount > 1 ? "s" : ""} waiting`}
        </p>
      </div>

      {/* Action cards — 3 across */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Waiting Leads — always orange accent */}
        <a
          href="/dashboard/leads"
          className="rounded-xl bg-[#FFF7ED] border-l-4 border-l-[#D4863E] border border-orange-200 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-[#D4863E]" />
            <span className="text-[11px] font-semibold text-[#D4863E] uppercase tracking-wide">
              {newCount > 0 ? "Waiting for you" : "Leads"}
            </span>
          </div>
          <div className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {newCount}
          </div>
          <p className="text-[12px] text-[#D4863E] font-semibold mt-2 flex items-center gap-1">
            {newCount > 0
              ? `${newCount} homeowner${newCount > 1 ? "s" : ""} waiting for your call`
              : "All caught up — nice work"}
            <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </a>

        {/* Response Speed — always gamified green accent */}
        <div className="rounded-xl bg-emerald-50 border-l-4 border-l-emerald-500 border border-emerald-200 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Response Speed</span>
          </div>
          <div className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {avgResponse || "—"}
          </div>
          <p className="text-[12px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            {avgResponse ? (
              <>
                <Zap className="w-3 h-3" />
                Faster than 90% of roofers
              </>
            ) : (
              "Respond to your first lead to start tracking"
            )}
          </p>
        </div>

        {/* Open Estimates — always navy accent */}
        <a
          href="/dashboard/leads"
          className="rounded-xl bg-[#F0F4F8] border-l-4 border-l-[#1B3A4B] border border-[#D1D9E0] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-[#1B3A4B]" />
            <span className="text-[11px] font-semibold text-[#1B3A4B] uppercase tracking-wide">Open Estimates</span>
          </div>
          <div className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {pipelineValue > 0 ? `$${(pipelineValue / 1000).toFixed(1)}K` : "$0"}
          </div>
          <p className="text-[12px] text-[#1B3A4B]/70 font-semibold mt-2 flex items-center gap-1">
            {pipelineValue > 0
              ? `${leads.filter((l) => l.status !== "lost" && l.status !== "won" && l.estimate_low).length} estimates waiting for follow-up`
              : "Estimates appear as leads come in"}
            <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </a>
      </div>

      {/* Main grid: leads list + open items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Leads by status — spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Your Leads</span>
            <a href="/dashboard/leads" className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {leads.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-8 text-center">No leads yet. They&apos;ll appear here when homeowners use your estimate widget.</p>
          ) : (
            <div className="space-y-5">
              {/* Group leads by status */}
              {([
                { key: "new", label: "Needs Response", color: "text-[#D4863E]", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-[#D4863E]" },
                { key: "contacted", label: "Contacted", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
                { key: "quoted", label: "Quoted", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
                { key: "won", label: "Won", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
              ] as const).map((group) => {
                const groupLeads = leads.filter((l) => l.status === group.key).slice(0, 3);
                if (groupLeads.length === 0) return null;
                return (
                  <div key={group.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${group.dot}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${group.color}`}>
                        {group.label}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${group.bg} ${group.border} border ${group.color}`}>
                        {leads.filter((l) => l.status === group.key).length}
                      </span>
                    </div>
                    <div className={`rounded-lg border ${group.border} ${group.bg} overflow-hidden`}>
                      {groupLeads.map((lead, i) => {
                        const temp = getLeadTemperature(lead);
                        const tempConfig = getTemperatureConfig(temp);
                        const speed = getSpeedToLead(lead);
                        return (
                          <a
                            key={lead.id}
                            href="/dashboard/leads"
                            className={`flex items-center gap-3 py-3 px-3 hover:bg-white/60 transition-colors ${
                              i < groupLeads.length - 1 ? `border-b ${group.border}` : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-slate-800 truncate">{lead.name}</span>
                                {tempConfig && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tempConfig.className} uppercase`}>
                                    {tempConfig.label}
                                  </span>
                                )}
                                {speed && (
                                  <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5" />{speed}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {lead.estimate_roof_sqft ? `${lead.estimate_roof_sqft.toLocaleString()} sqft · ` : ""}
                                {lead.estimate_material || "Contact form"}
                                {lead.address ? ` · ${lead.address.split(",")[0]}` : ""}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {lead.estimate_low && lead.estimate_high ? (
                                <p className="text-[12px] font-bold text-slate-800">
                                  ${(lead.estimate_low / 1000).toFixed(1)}K–${(lead.estimate_high / 1000).toFixed(1)}K
                                </p>
                              ) : null}
                              <p className="text-[10px] text-slate-400">{formatTimeAgo(lead.created_at)}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Open Items — what needs your attention */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">To-Do</span>
          </div>

          <div className="space-y-2">
            {/* Unreplied leads */}
            <a
              href="/dashboard/leads"
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 ${
                unrepliedLeads.length > 0
                  ? "bg-orange-50 border border-orange-200 hover:shadow-md"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Phone className={`w-3.5 h-3.5 ${unrepliedLeads.length > 0 ? "text-[#D4863E]" : "text-slate-300"}`} />
                <span className={`text-[12px] font-semibold ${unrepliedLeads.length > 0 ? "text-slate-800" : "text-slate-400"}`}>
                  Leads with no response
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                unrepliedLeads.length > 0 ? "bg-[#D4863E] text-white" : "bg-slate-200 text-slate-400"
              }`}>
                {unrepliedLeads.length}
              </span>
            </a>

            {/* Contacted but no quote yet */}
            <a
              href="/dashboard/leads"
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 ${
                contactedNoFollowup.length > 0
                  ? "bg-blue-50 border border-blue-200 hover:shadow-md"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-3.5 h-3.5 ${contactedNoFollowup.length > 0 ? "text-blue-500" : "text-slate-300"}`} />
                <span className={`text-[12px] font-semibold ${contactedNoFollowup.length > 0 ? "text-slate-800" : "text-slate-400"}`}>
                  Contacted — send a quote
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                contactedNoFollowup.length > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
              }`}>
                {contactedNoFollowup.length}
              </span>
            </a>

            {/* Quoted but not signed */}
            <a
              href="/dashboard/leads"
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 ${
                quotedNotSigned.length > 0
                  ? "bg-purple-50 border border-purple-200 hover:shadow-md"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className={`w-3.5 h-3.5 ${quotedNotSigned.length > 0 ? "text-purple-500" : "text-slate-300"}`} />
                <span className={`text-[12px] font-semibold ${quotedNotSigned.length > 0 ? "text-slate-800" : "text-slate-400"}`}>
                  Quoted — waiting on signature
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                quotedNotSigned.length > 0 ? "bg-purple-500 text-white" : "bg-slate-200 text-slate-400"
              }`}>
                {quotedNotSigned.length}
              </span>
            </a>

            {/* Won jobs — ask for review */}
            <a
              href="/dashboard/leads"
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 ${
                completedNoReview.length > 0
                  ? "bg-amber-50 border border-amber-200 hover:shadow-md"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className={`w-3.5 h-3.5 ${completedNoReview.length > 0 ? "text-amber-500" : "text-slate-300"}`} />
                <span className={`text-[12px] font-semibold ${completedNoReview.length > 0 ? "text-slate-800" : "text-slate-400"}`}>
                  Won jobs — ask for a review
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                completedNoReview.length > 0 ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400"
              }`}>
                {completedNoReview.length}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
