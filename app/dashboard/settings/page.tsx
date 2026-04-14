// Settings — Business profile, trust signals, notifications, account.

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import { Check, Eye, EyeOff, Zap, Send, Link2, Unlink, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

interface ProfileData {
  business_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zip: string;
  tagline: string;
  logo_url: string;
  years_in_business: number | null;
  license_number: string;
  warranty_years: number | null;
  // Trust signals
  is_licensed: boolean;
  is_insured: boolean;
  gaf_master_elite: boolean;
  owens_corning_preferred: boolean;
  certainteed_select: boolean;
  bbb_accredited: boolean;
  bbb_rating: string;
  offers_financing: boolean;
  // AI Chatbot
  has_ai_chatbot: boolean;
  // Integrations
  webhook_url: string;
  webhook_enabled: boolean;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const TRUST_SIGNALS = [
  { key: "is_licensed", label: "Licensed", desc: "State-licensed roofing contractor" },
  { key: "is_insured", label: "Insured", desc: "Liability and workers' comp coverage" },
  { key: "gaf_master_elite", label: "GAF Master Elite", desc: "Top 2% of roofers nationwide" },
  { key: "owens_corning_preferred", label: "Owens Corning Preferred", desc: "Factory-certified installer" },
  { key: "certainteed_select", label: "CertainTeed Select", desc: "ShingleMaster certified" },
  { key: "bbb_accredited", label: "BBB Accredited", desc: "Better Business Bureau member" },
  { key: "offers_financing", label: "Offers Financing", desc: "Payment plans available" },
];

export default function SettingsPage() {
  const { contractorId, tier } = useDashboard();
  const searchParams = useSearchParams();
  const crmConnected = searchParams.get("crm_connected");
  const crmError = searchParams.get("crm_error");
  const billingStatus = searchParams.get("billing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    business_name: "", phone: "", email: "", city: "", state: "", zip: "",
    tagline: "", logo_url: "", years_in_business: null, license_number: "",
    warranty_years: null,
    is_licensed: false, is_insured: false, gaf_master_elite: false,
    owens_corning_preferred: false, certainteed_select: false,
    bbb_accredited: false, bbb_rating: "", offers_financing: false,
    has_ai_chatbot: false,
    webhook_url: "", webhook_enabled: false,
  });

  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("contractors")
        .select("business_name, phone, email, city, state, zip, tagline, logo_url, years_in_business, license_number, warranty_years, is_licensed, is_insured, gaf_master_elite, owens_corning_preferred, certainteed_select, bbb_accredited, bbb_rating, offers_financing, has_ai_chatbot, webhook_url, webhook_enabled")
        .eq("id", contractorId)
        .single();
      if (data) {
        setProfile({
          business_name: data.business_name || "",
          phone: data.phone || "",
          email: data.email || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          tagline: data.tagline || "",
          logo_url: data.logo_url || "",
          years_in_business: data.years_in_business,
          license_number: data.license_number || "",
          warranty_years: data.warranty_years,
          is_licensed: data.is_licensed || false,
          is_insured: data.is_insured || false,
          gaf_master_elite: data.gaf_master_elite || false,
          owens_corning_preferred: data.owens_corning_preferred || false,
          certainteed_select: data.certainteed_select || false,
          bbb_accredited: data.bbb_accredited || false,
          bbb_rating: data.bbb_rating || "",
          offers_financing: data.offers_financing || false,
          has_ai_chatbot: data.has_ai_chatbot || false,
          webhook_url: data.webhook_url || "",
          webhook_enabled: data.webhook_enabled || false,
        });
      }
      setLoading(false);
    }
    load();
  }, [contractorId]);

  function updateField(key: keyof ProfileData, value: string | boolean | number | null) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const { error } = await supabase.from("contractors").update({
      business_name: profile.business_name,
      phone: profile.phone,
      city: profile.city,
      state: profile.state,
      zip: profile.zip || null,
      tagline: profile.tagline || null,
      logo_url: profile.logo_url || null,
      years_in_business: profile.years_in_business,
      license_number: profile.license_number || null,
      warranty_years: profile.warranty_years,
      is_licensed: profile.is_licensed,
      is_insured: profile.is_insured,
      gaf_master_elite: profile.gaf_master_elite,
      owens_corning_preferred: profile.owens_corning_preferred,
      certainteed_select: profile.certainteed_select,
      bbb_accredited: profile.bbb_accredited,
      bbb_rating: profile.bbb_rating || null,
      offers_financing: profile.offers_financing,
      has_ai_chatbot: profile.has_ai_chatbot,
      webhook_url: profile.webhook_url || null,
      webhook_enabled: profile.webhook_enabled,
    }).eq("id", contractorId);

    setSaving(false);
    if (error) {
      setSaveError("Failed to save. Please try again.");
      console.error("Settings save error:", error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSaved(true);
      setNewPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-[640px] mx-auto space-y-5">
      <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Settings</h1>

      {/* Billing feedback */}
      {billingStatus === "success" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-[13px] text-green-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Welcome to <strong>RuufPro Pro</strong>! Your estimate widget, Riley AI, reviews, and city pages are now active.</span>
        </div>
      )}
      {billingStatus === "cancelled" && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[13px] text-slate-600 font-medium">
          Checkout cancelled. You can upgrade anytime from Billing.
        </div>
      )}

      {/* CRM connection feedback */}
      {crmConnected && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-[13px] text-green-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          {crmConnected === "jobber" ? "Jobber" : "Housecall Pro"} connected! New leads will automatically appear in your CRM.
        </div>
      )}
      {crmError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] text-red-600 font-medium">
          {crmError === "denied" ? "Connection cancelled. You can try again anytime." :
           crmError === "token_failed" ? "Connection failed — please try again." :
           "Something went wrong. Please try connecting again."}
        </div>
      )}

      {/* Business Info */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Business Info</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Business Name</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              value={profile.business_name}
              onChange={(e) => updateField("business_name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Phone</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={profile.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Email</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-500 bg-slate-50"
                value={profile.email}
                disabled
              />
              <p className="text-[10px] text-slate-400 mt-1">Email <a href="mailto:support@ruufpro.com" className="text-[#D4863E] underline">support@ruufpro.com</a> to change</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">City</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={profile.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">State</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 bg-white"
                value={profile.state}
                onChange={(e) => updateField("state", e.target.value)}
              >
                <option value="">Select</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">ZIP</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={profile.zip}
                onChange={(e) => updateField("zip", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Tagline</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              value={profile.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="Dallas's Most Trusted Roofers Since 2019"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Years in Business</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={profile.years_in_business ?? ""}
                onChange={(e) => updateField("years_in_business", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="5"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">License #</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={profile.license_number}
                onChange={(e) => updateField("license_number", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Warranty (years)</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={profile.warranty_years ?? ""}
                onChange={(e) => updateField("warranty_years", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Trust Signals</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">These show as badges on your website. Only check what applies to you.</p>
        </div>
        <div className="p-5 space-y-1">
          {TRUST_SIGNALS.map((signal) => {
            const isChecked = profile[signal.key as keyof ProfileData] as boolean;
            return (
              <label
                key={signal.key}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors -mx-1"
              >
                <button
                  type="button"
                  onClick={() => updateField(signal.key as keyof ProfileData, !isChecked)}
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                    isChecked
                      ? "bg-slate-800 border-slate-800"
                      : "bg-white border-[#e2e8f0]"
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-slate-800">{signal.label}</div>
                  <div className="text-[11px] text-slate-400">{signal.desc}</div>
                </div>
              </label>
            );
          })}

          {/* BBB Rating (conditional) */}
          {profile.bbb_accredited && (
            <div className="pl-11 pt-1 pb-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">BBB Rating</label>
              <select
                className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-slate-800 bg-white focus:border-slate-400 focus:outline-none"
                value={profile.bbb_rating}
                onChange={(e) => updateField("bbb_rating", e.target.value)}
              >
                <option value="">Select rating</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* AI Chatbot — Riley (read-only status, managed from AI Chatbot page) */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-violet-500" />
            <div>
              <h2 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                Riley AI Chatbot
                {profile.has_ai_chatbot ? (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                ) : tier !== "free" ? (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">Off</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-600 uppercase tracking-wide">Pro</span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {profile.has_ai_chatbot
                  ? "Answering homeowner questions and capturing leads 24/7"
                  : tier === "free"
                    ? "Upgrade to Pro to unlock Riley"
                    : "Train Riley and turn her on from the AI Chatbot page"}
              </p>
            </div>
          </div>
          {tier !== "free" && (
            <a
              href="/dashboard/chatbot"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Manage →
            </a>
          )}
        </div>
      </div>

      {/* Integrations — CRM Connect */}
      <div id="integrations" className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden scroll-mt-8">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Integrations
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Connect your CRM so new leads appear automatically — no Zapier needed.</p>
        </div>
        <div className="p-5 space-y-4">
          <CrmConnections contractorId={contractorId || ""} />

          {/* Webhook fallback — collapsible */}
          <WebhookFallback
            profile={profile}
            updateField={updateField}
            contractorId={contractorId || ""}
          />
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Password</h2>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={!newPassword}
              className="px-4 py-2.5 rounded-lg bg-slate-800 text-[12px] font-semibold text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {passwordSaved ? <><Check className="w-3 h-3" /> Updated</> : "Update"}
            </button>
          </div>
          {passwordError && <p className="text-[12px] text-red-500 mt-2">{passwordError}</p>}
        </div>
      </div>

      {/* Save + Sign Out */}
      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] text-red-600 font-medium">
          {saveError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          onClick={handleLogout}
          className="text-[13px] font-medium text-slate-400 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-slate-800 text-[13px] font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {saving ? "Saving..." : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ---- CRM Connections ----

const CRM_PROVIDERS = [
  {
    id: "jobber" as const,
    name: "Jobber",
    color: "bg-[#7AC142]",
    authUrl: "https://api.getjobber.com/api/oauth/authorize",
  },
  // HCP ready but parked — need developer account + API keys first
  // {
  //   id: "housecall_pro" as const,
  //   name: "Housecall Pro",
  //   color: "bg-[#026CDF]",
  //   authUrl: "https://api.housecallpro.com/oauth/authorize",
  // },
];

interface CrmConnection {
  id: string;
  provider: string;
  status: string;
  connected_at: string;
}

function CrmConnections({ contractorId }: { contractorId: string }) {
  const [connections, setConnections] = useState<CrmConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "success" | "error">>({});

  useEffect(() => {
    async function loadConnections() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("crm_connections")
        .select("id, provider, status, connected_at")
        .eq("contractor_id", contractorId)
        .eq("status", "active");
      setConnections(data || []);
      setLoading(false);
    }
    loadConnections();
  }, [contractorId]);

  function handleConnect(provider: typeof CRM_PROVIDERS[number]) {
    const clientId = provider.id === "jobber"
      ? process.env.NEXT_PUBLIC_JOBBER_CLIENT_ID
      : process.env.NEXT_PUBLIC_HCP_CLIENT_ID;

    const redirectUri = `${window.location.origin}/api/integrations/callback`;
    const state = `${contractorId}:${provider.id}`;

    const url = `${provider.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}`;
    window.location.href = url;
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(connectionId);
    await supabase
      .from("crm_connections")
      .update({ status: "disconnected", disconnected_at: new Date().toISOString() })
      .eq("id", connectionId);
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    setDisconnecting(null);
  }

  async function handleTestLead(providerId: string) {
    setTesting(providerId);
    setTestResult((prev) => ({ ...prev, [providerId]: undefined as unknown as "success" | "error" }));
    try {
      const resp = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId, provider: providerId }),
      });
      setTestResult((prev) => ({ ...prev, [providerId]: resp.ok ? "success" : "error" }));
    } catch {
      setTestResult((prev) => ({ ...prev, [providerId]: "error" }));
    }
    setTesting(null);
    setTimeout(() => setTestResult((prev) => ({ ...prev, [providerId]: undefined as unknown as "success" | "error" })), 4000);
  }

  if (loading) {
    return <div className="text-[12px] text-slate-400">Loading connections...</div>;
  }

  return (
    <div className="space-y-3">
      {CRM_PROVIDERS.map((provider) => {
        const connection = connections.find((c) => c.provider === provider.id);

        if (connection) {
          // Connected state
          const connectedDate = new Date(connection.connected_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          });
          return (
            <div key={provider.id} className="rounded-lg border border-green-200 bg-green-50 overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${provider.color} flex items-center justify-center`}>
                    <Link2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
                      {provider.name}
                      <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Connected</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Since {connectedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestLead(provider.id)}
                    disabled={testing === provider.id}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <Send className="w-3 h-3" />
                    {testing === provider.id ? "Sending..." : "Test"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    disabled={disconnecting === connection.id}
                    className="text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <Unlink className="w-3 h-3" />
                    {disconnecting === connection.id ? "..." : "Disconnect"}
                  </button>
                </div>
              </div>
              {testResult[provider.id] === "success" && (
                <div className="px-3 pb-2 text-[11px] text-green-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Test lead sent to {provider.name}
                </div>
              )}
              {testResult[provider.id] === "error" && (
                <div className="px-3 pb-2 text-[11px] text-red-500 font-medium">
                  Failed to send test — try reconnecting
                </div>
              )}
            </div>
          );
        }

        // Not connected — show connect button
        return (
          <button
            key={provider.id}
            onClick={() => handleConnect(provider)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0] hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
          >
            <div className={`w-8 h-8 rounded-lg ${provider.color} flex items-center justify-center`}>
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-slate-800">Connect {provider.name}</div>
              <div className="text-[11px] text-slate-400">New leads auto-appear in {provider.name} — zero setup</div>
            </div>
            <span className="text-[11px] font-medium text-slate-400">→</span>
          </button>
        );
      })}
    </div>
  );
}

// ---- Webhook Fallback (collapsible) ----

function WebhookFallback({
  profile,
  updateField,
  contractorId,
}: {
  profile: ProfileData;
  updateField: (key: keyof ProfileData, value: string | boolean | number | null) => void;
  contractorId: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-slate-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Use a different CRM? Connect via webhook
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => updateField("webhook_enabled", !profile.webhook_enabled)}
              className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                profile.webhook_enabled
                  ? "bg-slate-800 border-slate-800"
                  : "bg-white border-[#e2e8f0]"
              }`}
            >
              {profile.webhook_enabled && <Check className="w-3 h-3 text-white" />}
            </button>
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Send leads via webhook</div>
              <div className="text-[11px] text-slate-400">Works with Zapier, Make, or any webhook URL</div>
            </div>
          </label>

          {profile.webhook_enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Webhook URL</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 font-mono text-[13px]"
                  value={profile.webhook_url}
                  onChange={(e) => updateField("webhook_url", e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </div>
              <WebhookTestButton webhookUrl={profile.webhook_url} contractorId={contractorId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Webhook Test Button ----

function WebhookTestButton({ webhookUrl, contractorId }: { webhookUrl: string; contractorId: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  async function handleTest() {
    if (!webhookUrl) return;
    setTesting(true);
    setResult(null);
    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lead.created",
          timestamp: new Date().toISOString(),
          test: true,
          tags: ["RuufPro", "Estimate Widget"],
          contractor: { id: contractorId, business_name: "Test Business" },
          lead: {
            name: "Test Lead",
            phone: "(555) 123-4567",
            email: "test@example.com",
            address: "123 Main St, Tampa, FL 33601",
            source: "estimate_widget",
            timeline: "1_3_months",
            financing_interest: "maybe",
            estimate: { low: 8500, high: 12000, material: "asphalt", roof_sqft: 2100 },
          },
        }),
      });
      setResult(resp.ok ? "success" : "error");
    } catch {
      setResult("error");
    }
    setTesting(false);
    setTimeout(() => setResult(null), 4000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleTest}
        disabled={testing || !webhookUrl}
        className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
      >
        <Send className="w-3 h-3" />
        {testing ? "Sending..." : "Send Test"}
      </button>
      {result === "success" && <span className="text-[12px] font-medium text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Delivered</span>}
      {result === "error" && <span className="text-[12px] font-medium text-red-500">Failed — check your URL</span>}
    </div>
  );
}
