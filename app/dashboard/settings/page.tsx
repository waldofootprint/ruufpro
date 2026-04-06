// Settings — Business profile, trust signals, notifications, account.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import { Check, Eye, EyeOff, Zap, Send } from "lucide-react";

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
  const { contractorId } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<"success" | "error" | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    business_name: "", phone: "", email: "", city: "", state: "", zip: "",
    tagline: "", logo_url: "", years_in_business: null, license_number: "",
    warranty_years: null,
    is_licensed: false, is_insured: false, gaf_master_elite: false,
    owens_corning_preferred: false, certainteed_select: false,
    bbb_accredited: false, bbb_rating: "", offers_financing: false,
  });

  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("contractors")
        .select("business_name, phone, email, city, state, zip, tagline, logo_url, years_in_business, license_number, warranty_years, is_licensed, is_insured, gaf_master_elite, owens_corning_preferred, certainteed_select, bbb_accredited, bbb_rating, offers_financing, webhook_url, webhook_enabled")
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
        });
        setWebhookUrl(data.webhook_url || "");
        setWebhookEnabled(data.webhook_enabled || false);
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
      webhook_url: webhookUrl || null,
      webhook_enabled: webhookEnabled,
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
              <p className="text-[10px] text-slate-400 mt-1">Contact support to change email</p>
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

      {/* CRM Integration */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">CRM Integration</h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Send new leads to your CRM automatically via Zapier webhook.</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Enable webhook</div>
              <div className="text-[11px] text-slate-400">Send lead data to your Zapier URL when new leads come in</div>
            </div>
            <button
              type="button"
              onClick={() => setWebhookEnabled(!webhookEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                webhookEnabled ? "bg-green-500" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  webhookEnabled ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {webhookEnabled && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Zapier Webhook URL</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
                <p className="text-[10px] text-slate-400 mt-1">Create a Zap in Zapier with a &quot;Webhooks by Zapier&quot; trigger, then paste the URL here.</p>
              </div>

              <button
                type="button"
                disabled={!webhookUrl || webhookTesting}
                onClick={async () => {
                  setWebhookTesting(true);
                  setWebhookTestResult(null);
                  try {
                    const res = await fetch(webhookUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        event: "lead.test",
                        timestamp: new Date().toISOString(),
                        data: {
                          name: "Test Lead",
                          email: "test@example.com",
                          phone: "(555) 000-0000",
                          address: "123 Test St",
                          source: "test",
                        },
                      }),
                    });
                    setWebhookTestResult(res.ok ? "success" : "error");
                  } catch {
                    setWebhookTestResult("error");
                  }
                  setWebhookTesting(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {webhookTesting ? "Sending..." : "Send Test Lead"}
              </button>

              {webhookTestResult === "success" && (
                <p className="text-[12px] text-green-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Test lead sent successfully. Check your Zapier dashboard.
                </p>
              )}
              {webhookTestResult === "error" && (
                <p className="text-[12px] text-red-500 font-medium">
                  Failed to reach webhook URL. Double-check the URL and try again.
                </p>
              )}
            </>
          )}
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
