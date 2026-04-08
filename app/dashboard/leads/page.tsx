// Lead Dashboard — Kanban board with rich cards, three-dot menus,
// slide-over detail panel, notes, and call confirmation.

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Phone, Mail, MapPin, MessageCircle, Clock, ChevronDown, ChevronRight,
  Users, DollarSign, Zap, ExternalLink, FileText, Star, Loader2,
  MoreVertical, Eye, StickyNote, ArrowLeft, X, Lock, CalendarCheck, UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lead, LeadStatus } from "@/lib/types";
import type { PropertyData } from "@/lib/rentcast-api";
import PropertyIntelCard from "@/components/property-intel-card";
import { useDashboard } from "../DashboardContext";
import {
  KANBAN_COLUMNS,
  getColumnConfig,
  getLeadTemperature,
  getTemperatureConfig,
  getSpeedToLead,
  formatTimeAgo,
  calculateRevenue,
  getAvgResponseTime,
} from "@/lib/dashboard-utils";
import { getRoofIntel } from "@/lib/roof-intel";

// Status options for dropdowns/buttons
const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-slate-100 text-slate-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-50 text-blue-700" },
  { value: "appointment_set", label: "Appt. Set", color: "bg-teal-50 text-teal-700" },
  { value: "quoted", label: "Quoted", color: "bg-purple-50 text-purple-700" },
  { value: "won", label: "Won", color: "bg-emerald-50 text-emerald-700" },
  { value: "completed", label: "Completed", color: "bg-amber-50 text-amber-700" },
  { value: "lost", label: "Lost", color: "bg-gray-100 text-gray-500" },
];

// Tab types
type LeadTab = "all" | "address_only" | "outside_area";

export default function LeadDashboard() {
  const { contractorId, businessName, tier, refreshLeadCount } = useDashboard();
  const isPro = tier === "pro" || tier === "growth";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeadTab>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [livingEstimates, setLivingEstimates] = useState<Record<string, { share_token: string; status: string }>>({});
  const [propertyData, setPropertyData] = useState<Record<string, PropertyData>>({});
  const [reviewRequests, setReviewRequests] = useState<Record<string, { id: string; status: string }>>({});
  const [requestingReview, setRequestingReview] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [callConfirm, setCallConfirm] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<LeadStatus>>(new Set());
  const [showAddLead, setShowAddLead] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({
    name: "", phone: "", email: "", address: "", message: "",
    estimate_material: "", estimate_roof_sqft: "", estimate_low: "", estimate_high: "",
    timeline: "" as string, financing_interest: "" as string, notes: "",
  });
  const [addLeadSaving, setAddLeadSaving] = useState(false);

  // Load leads + related data
  useEffect(() => {
    async function loadLeads() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) || []);

      // Load living estimate statuses
      const leadIds = (data || []).filter((l: Lead) => l.living_estimate_id).map((l: Lead) => l.living_estimate_id);
      if (leadIds.length > 0) {
        const { data: les } = await supabase
          .from("living_estimates")
          .select("id, share_token, status")
          .in("id", leadIds);
        if (les) {
          const map: Record<string, { share_token: string; status: string }> = {};
          les.forEach((le: { id: string; share_token: string; status: string }) => { map[le.id] = le; });
          setLivingEstimates(map);
        }
      }

      // Load cached property data
      const propIds = (data || []).filter((l: Lead) => l.property_data_id).map((l: Lead) => l.property_data_id);
      if (propIds.length > 0) {
        const { data: props } = await supabase
          .from("property_data_cache")
          .select("*")
          .in("id", propIds);
        if (props) {
          const pmap: Record<string, PropertyData> = {};
          props.forEach((p: any) => { pmap[p.id] = p; });
          setPropertyData(pmap);
        }
      }

      // Load review request statuses
      try {
        const { data: reviews } = await supabase
          .from("review_requests")
          .select("id, lead_id, status")
          .eq("contractor_id", contractorId);
        if (reviews) {
          const rmap: Record<string, { id: string; status: string }> = {};
          reviews.forEach((r: { id: string; lead_id: string; status: string }) => { rmap[r.lead_id] = r; });
          setReviewRequests(rmap);
        }
      } catch { /* table may not have data yet */ }

      setLoading(false);
    }
    loadLeads();
  }, [contractorId]);

  // ---- Actions ----

  async function updateStatus(leadId: string, newStatus: LeadStatus) {
    const updateData: Record<string, string> = { status: newStatus };
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
      setSelectedLead((prev) => prev ? {
        ...prev,
        status: newStatus,
        contacted_at: newStatus === "contacted" ? new Date().toISOString() : prev.contacted_at,
      } : null);
    }
    refreshLeadCount();
    setStatusMenuId(null);
    setMenuOpenId(null);

    if (newStatus === "completed" && !reviewRequests[leadId]) {
      handleRequestReview(leadId, true);
    }
  }

  async function handleRequestReview(leadId: string, silent = false) {
    setRequestingReview(leadId);
    try {
      const res = await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewRequests((prev) => ({
          ...prev,
          [leadId]: { id: data.reviewRequestId, status: "sms_sent" },
        }));
      } else if (!silent) {
        alert(data.error || "Failed to send review request");
      }
    } catch {
      if (!silent) alert("Failed to send review request");
    }
    setRequestingReview(null);
  }

  function handleCallClick(lead: Lead, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setCallConfirm(lead);
    setMenuOpenId(null);
  }

  function confirmCall(lead: Lead) {
    window.location.href = `tel:${lead.phone}`;
    if (lead.status === "new") {
      updateStatus(lead.id, "contacted");
    }
    setCallConfirm(null);
  }

  function handleText(lead: Lead, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const firstName = lead.name.split(" ")[0];
    const msg = encodeURIComponent(
      `Hey ${firstName}, this is ${businessName}. Thanks for getting an estimate on your roof! I'd love to set up a free inspection at your convenience. What day works best for you?`
    );
    window.location.href = `sms:${lead.phone}?body=${msg}`;
    if (lead.status === "new") {
      updateStatus(lead.id, "contacted");
    }
    setMenuOpenId(null);
  }

  function handleViewEstimate(lead: Lead) {
    if (lead.living_estimate_id && livingEstimates[lead.living_estimate_id]) {
      window.open(`/estimate/${livingEstimates[lead.living_estimate_id].share_token}`, "_blank");
    }
    setMenuOpenId(null);
  }

  async function saveNote(leadId: string) {
    setSavingNote(true);
    await supabase.from("leads").update({ notes: noteText }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, notes: noteText } : l));
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, notes: noteText } : null);
    }
    setSavingNote(false);
  }

  function openLeadDetail(lead: Lead) {
    setSelectedLead(lead);
    setNoteText(lead.notes || "");
    setMenuOpenId(null);
  }

  function toggleColumn(status: LeadStatus) {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

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
    refreshLeadCount();
  }

  // ---- Derived ----

  const revenue = calculateRevenue(leads);
  const avgResponse = getAvgResponseTime(leads);

  // Group leads by status for Kanban
  const columnLeads: Record<LeadStatus, Lead[]> = {
    new: [], contacted: [], appointment_set: [], quoted: [], won: [], completed: [], lost: [],
  };
  leads.forEach((l) => {
    if (columnLeads[l.status]) columnLeads[l.status].push(l);
  });

  // Pipeline value per column
  function columnPipeline(status: LeadStatus): number {
    return columnLeads[status]
      .filter((l) => l.estimate_low && l.estimate_high)
      .reduce((sum, l) => sum + ((l.estimate_low! + l.estimate_high!) / 2), 0);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Tabs + Add Lead button */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setShowAddLead(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1B3A4B] text-white hover:bg-[#1B3A4B]/90 transition-colors mr-2"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Lead
        </button>
        {([
          { key: "all" as LeadTab, label: "All Leads", count: leads.length },
          { key: "address_only" as LeadTab, label: "Address Only", count: 0 },
          { key: "outside_area" as LeadTab, label: "Outside Area", count: 0 },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-[#1B3A4B] text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Address Only / Outside Area placeholder tabs */}
      {activeTab !== "all" && (
        <div className="rounded-xl bg-white border border-[#e2e8f0] p-12 text-center">
          <div className="text-[32px] mb-3">{activeTab === "address_only" ? "📍" : "🌍"}</div>
          <p className="text-[14px] font-bold text-slate-800 mb-1">
            {activeTab === "address_only" ? "Address-Only Leads" : "Outside Service Area"}
          </p>
          <p className="text-[13px] text-slate-400 max-w-md mx-auto">
            {activeTab === "address_only"
              ? "Homeowners who entered their address in your widget but didn't complete the form. Coming soon — we'll capture these automatically."
              : "Leads from outside your service area. Coming soon — you'll set your service radius in Settings."}
          </p>
        </div>
      )}

      {/* Kanban Board */}
      {activeTab === "all" && (
        <>
          {leads.length === 0 ? (
            // Empty state — onboarding checklist
            <div className="rounded-xl bg-white border border-[#e2e8f0] p-8 max-w-lg mx-auto text-center">
              <div className="text-[40px] mb-4">🏠</div>
              <h2 className="text-[18px] font-bold text-slate-800 mb-2">Get your first lead</h2>
              <p className="text-[13px] text-slate-400 mb-6">Complete these steps and leads will start flowing in.</p>
              <div className="text-left space-y-3">
                {[
                  { label: "Create your account", done: true, href: "#" },
                  { label: "Set your pricing rates", done: false, href: "/dashboard/estimate-settings" },
                  { label: "Customize your website", done: false, href: "/dashboard/my-site" },
                  { label: "Share your widget link", done: false, href: "/dashboard/estimate-settings" },
                ].map((step, i) => (
                  <a
                    key={i}
                    href={step.href}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      step.done ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[13px] font-semibold ${step.done ? "text-emerald-700 line-through" : "text-slate-700"}`}>
                      {step.label}
                    </span>
                    {!step.done && <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: horizontal columns */}
              <div className="hidden lg:grid lg:grid-cols-6 gap-3">
                {KANBAN_COLUMNS.map((col) => {
                  const colLeads = columnLeads[col.status];
                  const pipeline = columnPipeline(col.status);
                  return (
                    <div key={col.status} className="min-h-[200px]">
                      {/* Column header */}
                      <div className={`rounded-t-xl ${col.headerBg} px-3 py-2.5 border border-b-0 ${col.border}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                          <span className={`text-[11px] font-bold uppercase tracking-wide ${col.color}`}>
                            {col.label}
                          </span>
                        </div>
                        {pipeline > 0 && (
                          <p className={`text-[13px] font-bold mt-0.5 ${col.color}`}>
                            ${(pipeline / 1000).toFixed(1)}K
                          </p>
                        )}
                      </div>

                      {/* Cards */}
                      <div className={`rounded-b-xl border ${col.border} ${col.bg} p-2 space-y-2 min-h-[150px]`}>
                        {colLeads.length === 0 && (
                          <p className="text-[11px] text-slate-400 text-center py-6 italic">No leads</p>
                        )}
                        {colLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            isPro={isPro}
                            livingEstimates={livingEstimates}
                            reviewRequests={reviewRequests}
                            menuOpenId={menuOpenId}
                            statusMenuId={statusMenuId}
                            requestingReview={requestingReview}
                            onOpenMenu={(id) => { setMenuOpenId(menuOpenId === id ? null : id); setStatusMenuId(null); }}
                            onOpenStatusMenu={(id) => setStatusMenuId(statusMenuId === id ? null : id)}
                            onCallClick={handleCallClick}
                            onText={handleText}
                            onViewEstimate={handleViewEstimate}
                            onOpenDetail={openLeadDetail}
                            onUpdateStatus={updateStatus}
                            onRequestReview={handleRequestReview}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile: stacked collapsible columns */}
              <div className="lg:hidden space-y-2">
                {KANBAN_COLUMNS.map((col) => {
                  const colLeads = columnLeads[col.status];
                  const pipeline = columnPipeline(col.status);
                  const isCollapsed = collapsedColumns.has(col.status);
                  // Auto-expand "new" column, collapse others by default on first render
                  const shouldShow = colLeads.length > 0;
                  if (!shouldShow) return null;

                  return (
                    <div key={col.status} className={`rounded-xl border ${col.border} overflow-hidden`}>
                      {/* Collapsible header */}
                      <button
                        onClick={() => toggleColumn(col.status)}
                        className={`w-full flex items-center justify-between px-4 py-3 ${col.headerBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                              <span className={`text-[11px] font-bold uppercase tracking-wide ${col.color}`}>
                                {col.label}
                              </span>
                            </div>
                            {pipeline > 0 && (
                              <p className={`text-[13px] font-bold mt-0.5 ${col.color}`}>
                                ${(pipeline / 1000).toFixed(1)}K
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
                      </button>

                      {/* Cards */}
                      {!isCollapsed && (
                        <div className={`${col.bg} p-2 space-y-2`}>
                          {colLeads.map((lead) => (
                            <LeadCard
                              key={lead.id}
                              lead={lead}
                              isPro={isPro}
                              livingEstimates={livingEstimates}
                              reviewRequests={reviewRequests}
                              menuOpenId={menuOpenId}
                              statusMenuId={statusMenuId}
                              requestingReview={requestingReview}
                              onOpenMenu={(id) => { setMenuOpenId(menuOpenId === id ? null : id); setStatusMenuId(null); }}
                              onOpenStatusMenu={(id) => setStatusMenuId(statusMenuId === id ? null : id)}
                              onCallClick={handleCallClick}
                              onText={handleText}
                              onViewEstimate={handleViewEstimate}
                              onOpenDetail={openLeadDetail}
                              onUpdateStatus={updateStatus}
                              onRequestReview={handleRequestReview}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ===== CENTERED LEAD DETAIL MODAL ===== */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop — click anywhere to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedLead(null)}
            />

            {/* Centered modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
            >
              <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg sm:mx-4 max-h-[90vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with close button */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                  <h2 className="text-[18px] font-bold text-slate-800">{selectedLead.name}</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                {/* Badges */}
                <div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const temp = getLeadTemperature(selectedLead);
                      const config = getTemperatureConfig(temp);
                      return config ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${config.className}`}>
                          {config.label}
                        </span>
                      ) : null;
                    })()}
                    {(() => {
                      const speed = getSpeedToLead(selectedLead);
                      return speed ? (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Zap className="w-3 h-3" />{speed} response
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Call + Text buttons */}
                {selectedLead.phone && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCallClick(selectedLead)}
                      className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#1B3A4B] text-white font-bold text-[14px] hover:bg-[#1B3A4B]/90 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                    {isPro ? (
                      <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[14px]">
                        <Zap className="w-4 h-4" />
                        Auto-texted
                      </div>
                    ) : (
                      <button
                        onClick={() => handleText(selectedLead)}
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-[14px] hover:bg-slate-200 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Text
                      </button>
                    )}
                  </div>
                )}

                {/* Contact info */}
                <div className="space-y-2">
                  {selectedLead.phone && (
                    <div className="flex items-center gap-3 text-[13px] text-slate-600">
                      <Phone className="w-4 h-4 text-slate-300" />
                      {selectedLead.phone}
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="flex items-center gap-3 text-[13px] text-slate-600">
                      <Mail className="w-4 h-4 text-slate-300" />
                      {selectedLead.email}
                    </div>
                  )}
                  {selectedLead.address && (
                    <div className="flex items-center gap-3 text-[13px] text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-300" />
                      {selectedLead.address}
                    </div>
                  )}
                </div>

                {/* Satellite thumbnail */}
                {selectedLead.address && (
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(selectedLead.address)}&zoom=19&size=400x200&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}`}
                      alt="Property satellite view"
                      className="w-full h-[160px] object-cover"
                    />
                  </div>
                )}

                {/* Message */}
                {selectedLead.message && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">Message</p>
                    <p className="text-[13px] text-slate-700">{selectedLead.message}</p>
                  </div>
                )}

                {/* Estimate */}
                {selectedLead.estimate_low && selectedLead.estimate_high && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">Estimate</p>
                    <p className="text-[20px] font-extrabold text-slate-800">
                      ${selectedLead.estimate_low.toLocaleString()} - ${selectedLead.estimate_high.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {selectedLead.estimate_material} · {selectedLead.estimate_roof_sqft?.toLocaleString()} sqft
                    </p>
                  </div>
                )}

                {/* Living Estimate link */}
                {selectedLead.living_estimate_id && livingEstimates[selectedLead.living_estimate_id] && (() => {
                  const le = livingEstimates[selectedLead.living_estimate_id!];
                  return (
                    <a
                      href={`/estimate/${le.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-blue-50 text-blue-700 font-semibold text-[14px] hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Interactive Estimate
                    </a>
                  );
                })()}

                {/* Roof Intel */}
                {(() => {
                  const intel = getRoofIntel(selectedLead);
                  if (!intel) return null;
                  return (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 mb-2 uppercase font-semibold">Roof Intel</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div><span className="text-[9px] text-slate-400 uppercase">Pitch</span><p className="text-[13px] font-bold text-slate-800">{intel.pitchDisplay}</p></div>
                        <div><span className="text-[9px] text-slate-400 uppercase">Complexity</span><p className="text-[13px] font-bold text-slate-800">{intel.complexityRating}</p></div>
                        <div><span className="text-[9px] text-slate-400 uppercase">Waste</span><p className="text-[13px] font-bold text-slate-800">{intel.wastePercent}%</p></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Property Intel */}
                {selectedLead.address && (
                  <PropertyIntelCard
                    leadId={selectedLead.id}
                    address={selectedLead.address}
                    initialData={selectedLead.property_data_id ? propertyData[selectedLead.property_data_id] || null : null}
                    onDataFetched={(data) => {
                      if (data.id) {
                        setPropertyData((prev) => ({ ...prev, [data.id]: data }));
                        setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, property_data_id: data.id } : l));
                      }
                    }}
                  />
                )}

                {/* Notes */}
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-2 uppercase font-semibold flex items-center gap-1">
                    <StickyNote className="w-3 h-3" />
                    Notes
                  </p>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="w-full text-[13px] text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]"
                  />
                  {noteText !== (selectedLead.notes || "") && (
                    <button
                      onClick={() => saveNote(selectedLead.id)}
                      disabled={savingNote}
                      className="mt-2 px-4 py-1.5 text-[12px] font-semibold bg-[#1B3A4B] text-white rounded-lg hover:bg-[#1B3A4B]/90 disabled:opacity-50"
                    >
                      {savingNote ? "Saving..." : "Save Note"}
                    </button>
                  )}
                </div>

                {/* Status buttons */}
                <div>
                  <p className="text-[10px] text-slate-400 mb-2 uppercase font-semibold">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => updateStatus(selectedLead.id, s.value)}
                        className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                          selectedLead.status === s.value
                            ? "bg-[#1B3A4B] text-white"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review request */}
                {selectedLead.phone && (selectedLead.status === "completed" || selectedLead.status === "won") && (
                  <div>
                    {reviewRequests[selectedLead.id] ? (
                      <div className="flex items-center justify-center gap-2 w-full p-3 rounded-xl text-[13px] font-semibold bg-violet-50 text-violet-700">
                        <Star className="w-4 h-4" />
                        Review {reviewRequests[selectedLead.id].status === "reviewed" ? "Received" :
                                reviewRequests[selectedLead.id].status === "clicked" ? "Link Clicked" : "Request Sent"}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRequestReview(selectedLead.id)}
                        disabled={requestingReview === selectedLead.id}
                        className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-amber-50 text-amber-700 font-semibold text-[14px] hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        {requestingReview === selectedLead.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : (
                          <><Star className="w-4 h-4" /> Request Google Review</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-300 text-center pt-2">
                  Received {new Date(selectedLead.created_at).toLocaleString()}
                </p>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== CALL CONFIRMATION DIALOG ===== */}
      <AnimatePresence>
        {callConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setCallConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-[#1B3A4B] flex items-center justify-center mx-auto mb-4">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                Call {callConfirm.name}?
              </h3>
              <p className="text-[14px] text-slate-500 mb-5">{callConfirm.phone}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCallConfirm(null)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmCall(callConfirm)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white bg-[#1B3A4B] hover:bg-[#1B3A4B]/90 transition-colors"
                >
                  Call Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contact Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Name *</label>
                      <input type="text" value={addLeadForm.name} onChange={(e) => setAddLeadForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mike Rodriguez" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
                      <input type="tel" value={addLeadForm.phone} onChange={(e) => setAddLeadForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(813) 555-1234" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                      <input type="email" value={addLeadForm.email} onChange={(e) => setAddLeadForm((f) => ({ ...f, email: e.target.value }))} placeholder="mike@email.com" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Address</label>
                      <input type="text" value={addLeadForm.address} onChange={(e) => setAddLeadForm((f) => ({ ...f, address: e.target.value }))} placeholder="1234 Oak St, Tampa, FL" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-2">Estimate Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Material</label>
                      <select value={addLeadForm.estimate_material} onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_material: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] bg-white">
                        <option value="">Select...</option>
                        <option value="asphalt">Asphalt Shingle</option>
                        <option value="metal">Metal</option>
                        <option value="tile">Tile</option>
                        <option value="flat">Flat</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Roof Sqft</label>
                      <input type="number" value={addLeadForm.estimate_roof_sqft} onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_roof_sqft: e.target.value }))} placeholder="2,400" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Estimate Low ($)</label>
                      <input type="number" value={addLeadForm.estimate_low} onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_low: e.target.value }))} placeholder="12500" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Estimate High ($)</label>
                      <input type="number" value={addLeadForm.estimate_high} onChange={(e) => setAddLeadForm((f) => ({ ...f, estimate_high: e.target.value }))} placeholder="18200" className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E]" />
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-2">Qualification</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Timeline</label>
                      <select value={addLeadForm.timeline} onChange={(e) => setAddLeadForm((f) => ({ ...f, timeline: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] bg-white">
                        <option value="">Select...</option>
                        <option value="now">ASAP</option>
                        <option value="1_3_months">1-3 Months</option>
                        <option value="no_timeline">Just Exploring</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Financing</label>
                      <select value={addLeadForm.financing_interest} onChange={(e) => setAddLeadForm((f) => ({ ...f, financing_interest: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] bg-white">
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Message / Notes</label>
                    <textarea value={addLeadForm.message} onChange={(e) => setAddLeadForm((f) => ({ ...f, message: e.target.value }))} placeholder="Called about storm damage on the back slope..." rows={2} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4863E]/30 focus:border-[#D4863E] resize-none" />
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

      {/* Close menus when clicking elsewhere */}
      {(menuOpenId || statusMenuId) && (
        <div className="fixed inset-0 z-10" onClick={() => { setMenuOpenId(null); setStatusMenuId(null); }} />
      )}
    </div>
  );
}

// ===== LEAD CARD COMPONENT =====

interface LeadCardProps {
  lead: Lead;
  isPro: boolean;
  livingEstimates: Record<string, { share_token: string; status: string }>;
  reviewRequests: Record<string, { id: string; status: string }>;
  menuOpenId: string | null;
  statusMenuId: string | null;
  requestingReview: string | null;
  onOpenMenu: (id: string) => void;
  onOpenStatusMenu: (id: string) => void;
  onCallClick: (lead: Lead, e?: React.MouseEvent) => void;
  onText: (lead: Lead, e?: React.MouseEvent) => void;
  onViewEstimate: (lead: Lead) => void;
  onOpenDetail: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onRequestReview: (leadId: string) => void;
}

function LeadCard({
  lead, isPro, livingEstimates, reviewRequests, menuOpenId, statusMenuId, requestingReview,
  onOpenMenu, onOpenStatusMenu, onCallClick, onText, onViewEstimate, onOpenDetail, onUpdateStatus, onRequestReview,
}: LeadCardProps) {
  const temp = getLeadTemperature(lead);
  const tempConfig = getTemperatureConfig(temp);
  const speed = getSpeedToLead(lead);
  const isMenuOpen = menuOpenId === lead.id;
  const isStatusOpen = statusMenuId === lead.id;
  const hasEstimate = lead.living_estimate_id && livingEstimates[lead.living_estimate_id];
  const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all relative"
      onClick={() => onOpenDetail(lead)}
    >
      {/* Pulsing dot for untouched new leads */}
      {lead.status === "new" && !lead.contacted_at && (
        <span className="absolute top-2 left-2 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4863E] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4863E]" />
        </span>
      )}

      {/* Top: avatar + name + temp badge */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#1B3A4B] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-800 truncate">{lead.name}</span>
            {tempConfig && (
              <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase flex-shrink-0 ${tempConfig.className}`}>
                {tempConfig.label}
              </span>
            )}
          </div>
          {speed && (
            <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5">
              <Zap className="w-2.5 h-2.5" />{speed}
            </span>
          )}
        </div>
      </div>

      {/* Estimate + material */}
      <div className="space-y-1.5 mb-3">
        {lead.estimate_low && lead.estimate_high && (
          <p className="text-[12px] font-bold text-slate-800">
            ${(lead.estimate_low / 1000).toFixed(1)}K - ${(lead.estimate_high / 1000).toFixed(1)}K
          </p>
        )}
        <p className="text-[11px] text-slate-500 truncate">
          {[
            lead.estimate_material,
            lead.estimate_roof_sqft ? `${lead.estimate_roof_sqft.toLocaleString()} sqft` : null,
          ].filter(Boolean).join(" · ") || "Contact form"}
        </p>
        {lead.address && (
          <p className="text-[10px] text-slate-400 truncate">{lead.address.split(",")[0]}</p>
        )}
      </div>

      {/* Time + badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] text-slate-400">{formatTimeAgo(lead.created_at)}</span>
        {hasEstimate && (
          <span className="text-[9px] font-semibold text-blue-500 bg-blue-50 px-1 py-0.5 rounded flex items-center gap-0.5">
            <FileText className="w-2.5 h-2.5" />
            {livingEstimates[lead.living_estimate_id!].status === "viewed" ? "Viewed" : "Estimate"}
          </span>
        )}
        {reviewRequests[lead.id] && (
          <span className="text-[9px] font-semibold text-violet-600 bg-violet-50 px-1 py-0.5 rounded flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5" />
            {reviewRequests[lead.id].status === "reviewed" ? "Reviewed" : "Requested"}
          </span>
        )}
      </div>

      {/* Action buttons: Call + Text + Three-dot */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        {lead.phone && (
          <>
            <button
              onClick={(e) => onCallClick(lead, e)}
              className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#1B3A4B] hover:bg-[#1B3A4B]/90 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Phone className="w-3 h-3" />
              Call
            </button>
            {isPro ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                <Zap className="w-3 h-3" />
                Auto-texted
              </span>
            ) : (
              <button
                onClick={(e) => onText(lead, e)}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                Text
              </button>
            )}
          </>
        )}

        {/* Three-dot menu */}
        <div className="relative ml-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenMenu(lead.id); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-30 overflow-hidden">
              {lead.phone && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCallClick(lead, e); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 w-full"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Call Lead
                </button>
              )}
              {lead.phone && (
                <button
                  onClick={(e) => { e.stopPropagation(); onText(lead, e); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 w-full border-t border-slate-100"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                  Text Lead
                </button>
              )}
              {hasEstimate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onViewEstimate(lead); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 w-full border-t border-slate-100"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  View Estimate
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onOpenDetail(lead); }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 w-full border-t border-slate-100"
              >
                <StickyNote className="w-3.5 h-3.5 text-slate-400" />
                Add Note
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenStatusMenu(lead.id); }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 w-full border-t border-slate-100"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                Change Status
              </button>
              {lead.phone && (lead.status === "completed" || lead.status === "won") && !reviewRequests[lead.id] && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestReview(lead.id); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-amber-700 hover:bg-amber-50 w-full border-t border-slate-100"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Request Review
                </button>
              )}

              {/* Status submenu */}
              {isStatusOpen && (
                <div className="border-t border-slate-100 bg-slate-50 p-1.5">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={(e) => { e.stopPropagation(); onUpdateStatus(lead.id, s.value); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                        lead.status === s.value
                          ? "bg-[#1B3A4B] text-white"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
