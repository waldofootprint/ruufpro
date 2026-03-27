// Lead Dashboard — roofers view, manage, and track all their leads.
// Shows leads from both the contact form and estimate widget.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Phone, Mail, MapPin, Calculator, MessageSquare, Clock } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  { value: "quoted", label: "Quoted", color: "bg-purple-100 text-purple-700" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-700" },
  { value: "lost", label: "Lost", color: "bg-gray-100 text-gray-500" },
];

export default function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: contractor } = await supabase
        .from("contractors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!contractor) return;
      setContractorId(contractor.id);

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractor.id)
        .order("created_at", { ascending: false });

      setLeads((data as Lead[]) || []);
      setLoading(false);
    }
    loadLeads();
  }, []);

  async function updateStatus(leadId: string, newStatus: LeadStatus) {
    await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  }

  const filteredLeads = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    won: leads.filter((l) => l.status === "won").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Leads</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
          <p className="text-xs text-gray-500 mt-1">New (uncontacted)</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <p className="text-2xl font-bold text-green-600">{stats.won}</p>
          <p className="text-xs text-gray-500 mt-1">Jobs Won</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s.value ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Lead list */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-100 p-12 text-center">
          <p className="text-gray-400 mb-2">No leads yet</p>
          <p className="text-sm text-gray-400">
            Leads from your estimate widget and contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((lead) => {
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === lead.status);
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="rounded-xl bg-white border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Name + contact */}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {lead.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Source badge */}
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                      {lead.source === "estimate_widget" ? (
                        <><Calculator className="w-3 h-3" /> Estimate</>
                      ) : (
                        <><MessageSquare className="w-3 h-3" /> Contact</>
                      )}
                    </span>

                    {/* Estimate range */}
                    {lead.estimate_low && lead.estimate_high && (
                      <span className="text-xs font-medium text-gray-700">
                        ${lead.estimate_low.toLocaleString()} - ${lead.estimate_high.toLocaleString()}
                      </span>
                    )}

                    {/* Status */}
                    <select
                      value={lead.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(lead.id, e.target.value as LeadStatus);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border-0 cursor-pointer ${statusInfo?.color}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    {/* Time ago */}
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      {timeAgo(lead.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail panel */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{selectedLead.name}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedLead.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm hover:bg-brand-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call: {selectedLead.phone}
                </a>
              )}

              {selectedLead.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selectedLead.email}
                </div>
              )}

              {selectedLead.address && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {selectedLead.address}
                </div>
              )}

              {selectedLead.message && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Message</p>
                  <p className="text-sm text-gray-700">{selectedLead.message}</p>
                </div>
              )}

              {selectedLead.estimate_low && selectedLead.estimate_high && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Estimate</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${selectedLead.estimate_low.toLocaleString()} - ${selectedLead.estimate_high.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLead.estimate_material} · {selectedLead.estimate_roof_sqft?.toLocaleString()} sqft
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-2">Status</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateStatus(selectedLead.id, s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedLead.status === s.value
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-gray-400 text-center pt-2">
                Received {new Date(selectedLead.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
