// Lead Dashboard — roofers view, manage, and track all their leads.
// Features: Hot/Warm/Browsing tags, one-tap call + auto-status,
// speed-to-lead badges, expandable Roof Intel, revenue counter.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Phone, Mail, MapPin, Calculator, MessageSquare, MessageCircle, Clock, ChevronDown, ChevronUp, Users, DollarSign, Zap } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { useDashboard } from "../DashboardContext";
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

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-slate-100 text-slate-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-50 text-blue-700" },
  { value: "quoted", label: "Quoted", color: "bg-purple-50 text-purple-700" },
  { value: "won", label: "Won", color: "bg-emerald-50 text-emerald-700" },
  { value: "lost", label: "Lost", color: "bg-gray-100 text-gray-500" },
];

export default function LeadDashboard() {
  const { contractorId, businessName, refreshLeadCount } = useDashboard();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [expandedIntel, setExpandedIntel] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);
      setLoading(false);
    }
    loadLeads();
  }, [contractorId]);

  async function updateStatus(leadId: string, newStatus: LeadStatus) {
    const updateData: Record<string, string> = { status: newStatus };
    // Auto-set contacted_at for speed-to-lead tracking
    if (newStatus === "contacted") {
      updateData.contacted_at = new Date().toISOString();
    }

    await supabase.from("leads").update(updateData).eq("id", leadId);

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: newStatus, contacted_at: newStatus === "contacted" ? new Date().toISOString() : l.contacted_at }
          : l
      )
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        status: newStatus,
        contacted_at: newStatus === "contacted" ? new Date().toISOString() : selectedLead.contacted_at,
      });
    }
    refreshLeadCount();
  }

  // One-tap call: triggers phone + auto-updates status
  function handleCall(lead: Lead, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    window.location.href = `tel:${lead.phone}`;
    if (lead.status === "new") {
      updateStatus(lead.id, "contacted");
    }
  }

  // One-tap text: opens native SMS with pre-filled follow-up message
  function handleText(lead: Lead, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const firstName = lead.name.split(" ")[0];
    const bizName = businessName;
    const msg = encodeURIComponent(
      `Hey ${firstName}, this is ${bizName}. Thanks for getting an estimate on your roof! I'd love to set up a free inspection at your convenience. What day works best for you?`
    );
    window.location.href = `sms:${lead.phone}?body=${msg}`;
    if (lead.status === "new") {
      updateStatus(lead.id, "contacted");
    }
  }

  const filteredLeads = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const revenue = calculateRevenue(leads);
  const avgResponse = getAvgResponseTime(leads);
  const newCount = leads.filter((l) => l.status === "new").length;
  const wonCount = leads.filter((l) => l.status === "won").length;

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading leads...</div>;
  }

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total</span>
          </div>
          <p className="text-xl font-extrabold text-slate-800">{leads.length}</p>
        </div>
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">New</span>
          </div>
          <p className="text-xl font-extrabold text-slate-800">{newCount}</p>
        </div>
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Avg Response</span>
          </div>
          <p className="text-xl font-extrabold text-slate-800">{avgResponse || "—"}</p>
        </div>
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Revenue</span>
          </div>
          <p className="text-xl font-extrabold text-green-600">
            {revenue > 0 ? `$${(revenue / 1000).toFixed(1)}K` : "$0"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            filter === "all" ? "bg-slate-700 text-white" : "bg-white text-slate-500 border border-[#e2e8f0] hover:bg-slate-50"
          }`}
        >
          All ({leads.length})
        </button>
        {STATUS_OPTIONS.map((s) => {
          const count = leads.filter((l) => l.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filter === s.value ? "bg-slate-700 text-white" : "bg-white text-slate-500 border border-[#e2e8f0] hover:bg-slate-50"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Lead list */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-12 text-center">
          <p className="text-slate-400 mb-2">No leads yet</p>
          <p className="text-sm text-slate-400">
            Leads from your estimate widget and contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((lead) => {
            const temp = getLeadTemperature(lead);
            const tempConfig = getTemperatureConfig(temp);
            const speed = getSpeedToLead(lead);
            const dotColor = getStatusDotColor(lead);
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === lead.status);
            const intel = getRoofIntel(lead);
            const isIntelExpanded = expandedIntel === lead.id;

            return (
              <div
                key={lead.id}
                className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Main row */}
                <div
                  onClick={() => setSelectedLead(lead)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-slate-800">{lead.name}</span>
                        {tempConfig && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${tempConfig.className}`}>
                            {tempConfig.label}
                          </span>
                        )}
                        {speed && (
                          <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />{speed}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {lead.estimate_roof_sqft && (
                          <span className="text-[11px] text-slate-400">
                            {lead.estimate_roof_sqft.toLocaleString()} sqft
                          </span>
                        )}
                        {lead.estimate_material && (
                          <span className="text-[11px] text-slate-400">
                            {lead.estimate_material}
                          </span>
                        )}
                        {lead.address && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {lead.address.split(",")[0]}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-300">
                          {formatTimeAgo(lead.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right side: estimate + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {lead.estimate_low && lead.estimate_high && (
                        <span className="text-[13px] font-bold text-slate-800 hidden sm:block">
                          ${(lead.estimate_low / 1000).toFixed(1)}K - ${(lead.estimate_high / 1000).toFixed(1)}K
                        </span>
                      )}

                      {/* Status dropdown */}
                      <select
                        value={lead.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(lead.id, e.target.value as LeadStatus);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer hidden sm:block ${statusInfo?.color}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>

                      {/* Call + Text buttons */}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleCall(lead, e)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span className="hidden sm:inline">Call</span>
                          </button>
                          <button
                            onClick={(e) => handleText(lead, e)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Text</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile: estimate + status row */}
                  <div className="flex items-center gap-2 mt-2 sm:hidden ml-5">
                    {lead.estimate_low && lead.estimate_high && (
                      <span className="text-[12px] font-bold text-slate-800">
                        ${(lead.estimate_low / 1000).toFixed(1)}K - ${(lead.estimate_high / 1000).toFixed(1)}K
                      </span>
                    )}
                    <select
                      value={lead.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(lead.id, e.target.value as LeadStatus);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${statusInfo?.color}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile: full-width call + text buttons */}
                {lead.phone && lead.status === "new" && (
                  <div className="px-4 pb-3 sm:hidden space-y-2">
                    <button
                      onClick={() => handleCall(lead)}
                      className="flex items-center justify-center gap-2 w-full text-[14px] font-bold text-white bg-slate-800 hover:bg-slate-700 py-3 rounded-xl transition-colors min-h-[48px]"
                    >
                      <Phone className="w-4 h-4" />
                      Call {lead.name.split(" ")[0]} — {lead.phone}
                    </button>
                    <button
                      onClick={() => handleText(lead)}
                      className="flex items-center justify-center gap-2 w-full text-[14px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl transition-colors min-h-[48px]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Text {lead.name.split(" ")[0]}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">
                      Tapping calls or texts and marks as Contacted
                    </p>
                  </div>
                )}

                {/* Expandable Roof Intel */}
                {intel && (
                  <div className="border-t border-slate-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedIntel(isIntelExpanded ? null : lead.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600 w-full transition-colors"
                    >
                      {isIntelExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Roof Intel
                    </button>

                    {isIntelExpanded && (
                      <div className="px-4 pb-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <div className="text-[9px] font-semibold text-slate-400 uppercase">Area</div>
                              <div className="text-[13px] font-bold text-slate-800">{intel.areaSqft.toLocaleString()} sqft</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-semibold text-slate-400 uppercase">Pitch</div>
                              <div className="text-[13px] font-bold text-slate-800">{intel.pitchDisplay}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-semibold text-slate-400 uppercase">Complexity</div>
                              <div className="text-[13px] font-bold text-slate-800">{intel.complexityRating}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-semibold text-slate-400 uppercase">Waste</div>
                              <div className="text-[13px] font-bold text-slate-800">{intel.wastePercent}%</div>
                            </div>
                            {intel.estimatedBundles && (
                              <div>
                                <div className="text-[9px] font-semibold text-slate-400 uppercase">~Bundles</div>
                                <div className="text-[13px] font-bold text-slate-800">~{intel.estimatedBundles}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-[9px] font-semibold text-slate-400 uppercase">Ridge</div>
                              <div className="text-[13px] font-bold text-slate-800">~{intel.estimatedRidgeFt} LF</div>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-3 italic">
                            Satellite-estimated. Verify before ordering materials.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-md sm:mx-4 p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selectedLead.name}</h2>
                {(() => {
                  const temp = getLeadTemperature(selectedLead);
                  const config = getTemperatureConfig(temp);
                  const speed = getSpeedToLead(selectedLead);
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      {config && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${config.className}`}>
                          {config.label}
                        </span>
                      )}
                      {speed && (
                        <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />{speed} response
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-300 hover:text-slate-500 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Call + Text buttons — big, prominent */}
              {selectedLead.phone && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleCall(selectedLead)}
                    className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-slate-800 text-white font-bold text-[15px] hover:bg-slate-700 transition-colors min-h-[52px]"
                  >
                    <Phone className="w-4 h-4" />
                    Call {selectedLead.phone}
                  </button>
                  <button
                    onClick={() => handleText(selectedLead)}
                    className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-[14px] hover:bg-slate-200 transition-colors min-h-[48px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Text {selectedLead.name.split(" ")[0]}
                  </button>
                </div>
              )}

              {selectedLead.email && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-300" />
                  {selectedLead.email}
                </div>
              )}

              {selectedLead.address && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-300" />
                  {selectedLead.address}
                </div>
              )}

              {selectedLead.message && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">Message</p>
                  <p className="text-sm text-slate-700">{selectedLead.message}</p>
                </div>
              )}

              {selectedLead.estimate_low && selectedLead.estimate_high && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">Estimate</p>
                  <p className="text-xl font-extrabold text-slate-800">
                    ${selectedLead.estimate_low.toLocaleString()} - ${selectedLead.estimate_high.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedLead.estimate_material} · {selectedLead.estimate_roof_sqft?.toLocaleString()} sqft
                  </p>
                </div>
              )}

              {/* Roof Intel in modal */}
              {(() => {
                const intel = getRoofIntel(selectedLead);
                if (!intel) return null;
                return (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 mb-2 uppercase font-semibold">Roof Intel</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-[9px] text-slate-400 uppercase">Pitch</span><p className="text-[13px] font-bold text-slate-800">{intel.pitchDisplay}</p></div>
                      <div><span className="text-[9px] text-slate-400 uppercase">Complexity</span><p className="text-[13px] font-bold text-slate-800">{intel.complexityRating}</p></div>
                      <div><span className="text-[9px] text-slate-400 uppercase">Waste</span><p className="text-[13px] font-bold text-slate-800">{intel.wastePercent}%</p></div>
                      {intel.estimatedBundles && (
                        <div><span className="text-[9px] text-slate-400 uppercase">~Bundles</span><p className="text-[13px] font-bold text-slate-800">~{intel.estimatedBundles}</p></div>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 italic">Verify before ordering materials.</p>
                  </div>
                );
              })()}

              {/* Status buttons */}
              <div>
                <p className="text-[10px] text-slate-400 mb-2 uppercase font-semibold">Status</p>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateStatus(selectedLead.id, s.value)}
                      className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                        selectedLead.status === s.value
                          ? "bg-slate-800 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-300 text-center pt-2">
                Received {new Date(selectedLead.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
