"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "./DashboardContext";
import { Users, Clock, DollarSign, Zap, ChevronRight, Share2, Star, MessageSquare } from "lucide-react";
import type { Lead } from "@/lib/types";
import {
  getLeadTemperature,
  getTemperatureConfig,
  getStatusDotColor,
  getSpeedToLead,
  formatTimeAgo,
  calculateRevenue,
  getAvgResponseTime,
} from "@/lib/dashboard-utils";
import { getRoofIntel } from "@/lib/roof-intel";

export default function DashboardHome() {
  const { contractorId, businessName } = useDashboard();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({ sent: 0, clicked: 0, reviewed: 0 });
  const [smsCount, setSmsCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);

      // Load review request stats (fail gracefully if tables empty or RLS blocks)
      try {
        const { data: reviews } = await supabase
          .from("review_requests")
          .select("status")
          .eq("contractor_id", contractorId);
        if (reviews) {
          setReviewStats({
            sent: reviews.length,
            clicked: reviews.filter((r: { status: string }) => r.status === "clicked" || r.status === "reviewed").length,
            reviewed: reviews.filter((r: { status: string }) => r.status === "reviewed").length,
          });
        }
      } catch { /* tables may not exist yet */ }

      // Load SMS count this month
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("sms_messages")
          .select("id", { count: "exact", head: true })
          .eq("contractor_id", contractorId)
          .gte("created_at", monthStart.toISOString());
        setSmsCount(count || 0);
      } catch { /* tables may not exist yet */ }

      setLoading(false);
    }
    load();
  }, [contractorId]);

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading dashboard...</div>;
  }

  const newCount = leads.filter((l) => l.status === "new").length;
  const wonCount = leads.filter((l) => l.status === "won").length;
  const revenue = calculateRevenue(leads);
  const avgResponse = getAvgResponseTime(leads);
  const recentLeads = leads.slice(0, 5);
  const latestWithEstimate = leads.find((l) => l.estimate_roof_sqft && l.estimate_pitch_degrees);
  const roofIntel = latestWithEstimate ? getRoofIntel(latestWithEstimate) : null;

  // Pipeline value: sum of estimate midpoints for non-lost leads
  const pipelineValue = leads
    .filter((l) => l.status !== "lost" && l.status !== "won" && l.estimate_low && l.estimate_high)
    .reduce((sum, l) => sum + ((l.estimate_low! + l.estimate_high!) / 2), 0);

  const closeRate = leads.length > 0
    ? Math.round((wonCount / leads.filter((l) => l.status === "won" || l.status === "lost").length) * 100) || 0
    : 0;

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

      {/* Stat cards — 3 across */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* New Leads */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">New Leads</span>
          </div>
          <div className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {newCount}
          </div>
          {newCount > 0 && (
            <p className="text-[11px] text-green-600 font-semibold mt-1">Action needed</p>
          )}
        </div>

        {/* Avg Response */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Avg Response</span>
          </div>
          <div className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {avgResponse || "—"}
          </div>
          {avgResponse && (
            <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
              <Zap className="w-3 h-3" />
              Top 10%
            </div>
          )}
        </div>

        {/* Revenue */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Revenue (Won)</span>
          </div>
          <div className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {revenue > 0 ? `$${(revenue / 1000).toFixed(1)}K` : "$0"}
          </div>
          {wonCount > 0 && (
            <p className="text-[11px] text-slate-400 mt-1">{wonCount} closed job{wonCount > 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* Review & SMS metrics */}
      {(reviewStats.sent > 0 || smsCount > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Reviews Sent</span>
            </div>
            <p className="text-xl font-extrabold text-slate-800">{reviewStats.sent}</p>
          </div>
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Click Rate</span>
            </div>
            <p className="text-xl font-extrabold text-slate-800">
              {reviewStats.sent > 0 ? `${Math.round((reviewStats.clicked / reviewStats.sent) * 100)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Reviews</span>
            </div>
            <p className="text-xl font-extrabold text-amber-600">{reviewStats.reviewed}</p>
          </div>
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">SMS This Month</span>
            </div>
            <p className="text-xl font-extrabold text-slate-800">{smsCount}</p>
          </div>
        </div>
      )}

      {/* Main grid: leads list + roof intel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Recent Leads — spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Recent Leads</span>
            <a href="/dashboard/leads" className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {recentLeads.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-8 text-center">No leads yet. They'll appear here when homeowners use your estimate widget.</p>
          ) : (
            <div className="space-y-0">
              {recentLeads.map((lead) => {
                const temp = getLeadTemperature(lead);
                const tempConfig = getTemperatureConfig(temp);
                const speed = getSpeedToLead(lead);
                const dotColor = getStatusDotColor(lead);

                return (
                  <a
                    key={lead.id}
                    href="/dashboard/leads"
                    className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />

                    {/* Info */}
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
                      <p className="text-[11px] text-slate-400 truncate">
                        {lead.estimate_roof_sqft ? `${lead.estimate_roof_sqft.toLocaleString()} sqft · ` : ""}
                        {lead.estimate_material || "Contact form"}
                        {lead.address ? ` · ${lead.address.split(",")[0]}` : ""}
                      </p>
                    </div>

                    {/* Estimate + time */}
                    <div className="text-right flex-shrink-0">
                      {lead.estimate_low && lead.estimate_high ? (
                        <p className="text-[12px] font-bold text-slate-800">
                          ${(lead.estimate_low / 1000).toFixed(1)}K - ${(lead.estimate_high / 1000).toFixed(1)}K
                        </p>
                      ) : null}
                      <p className="text-[10px] text-slate-400">{formatTimeAgo(lead.created_at)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Roof Intel panel */}
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Roof Intel{latestWithEstimate ? ` — ${latestWithEstimate.name.split(" ")[0]}` : ""}
          </span>

          {roofIntel ? (
            <div className="mt-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Area</div>
                    <div className="text-[14px] font-bold text-slate-800">{roofIntel.areaSqft.toLocaleString()} sqft</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Pitch</div>
                    <div className="text-[14px] font-bold text-slate-800">{roofIntel.pitchDisplay}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Segments</div>
                    <div className="text-[14px] font-bold text-slate-800">{roofIntel.segments}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Complexity</div>
                    <div className="text-[14px] font-bold text-slate-800">{roofIntel.complexityRating}</div>
                  </div>
                  {roofIntel.estimatedBundles && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">~Bundles</div>
                      <div className="text-[14px] font-bold text-slate-800">~{roofIntel.estimatedBundles}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Waste</div>
                    <div className="text-[14px] font-bold text-slate-800">{roofIntel.wastePercent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Ridge</div>
                    <div className="text-[14px] font-bold text-slate-800">~{roofIntel.estimatedRidgeFt} LF</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Source</div>
                    <div className="text-[14px] font-bold text-slate-800">{roofIntel.isSatellite ? "Satellite" : "Estimated"}</div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 italic leading-relaxed">
                Satellite-estimated. Verify with professional measurement before ordering materials.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-slate-400 mt-4 py-6 text-center">
              Roof data will appear here when leads come through the estimate widget.
            </p>
          )}
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pipeline</span>
              <span className="text-[15px] font-extrabold text-slate-800 ml-2">
                {pipelineValue > 0 ? `$${(pipelineValue / 1000).toFixed(1)}K` : "$0"}
              </span>
            </div>
            <div className="w-px h-5 bg-slate-100" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Close Rate</span>
              <span className="text-[15px] font-extrabold text-slate-800 ml-2">
                {closeRate > 0 ? `${closeRate}%` : "—"}
              </span>
            </div>
            <div className="w-px h-5 bg-slate-100" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Leads</span>
              <span className="text-[15px] font-extrabold text-slate-800 ml-2">{leads.length}</span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`https://ruufpro.com/widget/${contractorId}`);
              alert("Widget link copied!");
            }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-[#e2e8f0] px-3 py-1.5 rounded-lg transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Share Widget Link
          </button>
        </div>
      </div>
    </div>
  );
}
