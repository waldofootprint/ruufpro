"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Upload, LogOut, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../../DashboardContext";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuInput } from "@/components/dashboard/settings/NeuInput";
import { NeuSelect } from "@/components/dashboard/settings/NeuSelect";
import { NeuToggle } from "@/components/dashboard/settings/NeuToggle";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const TRUST_SIGNALS = [
  { key: "is_licensed", label: "Licensed", desc: "State-licensed roofing contractor" },
  { key: "is_insured", label: "Insured", desc: "Liability & workers' comp" },
  { key: "gaf_master_elite", label: "GAF Master Elite", desc: "Top 2% of roofers nationwide" },
  { key: "owens_corning_preferred", label: "Owens Corning Preferred", desc: "Factory-certified installer" },
  { key: "certainteed_select", label: "CertainTeed Select", desc: "ShingleMaster certified" },
  { key: "bbb_accredited", label: "BBB Accredited", desc: "Better Business Bureau member" },
  { key: "offers_financing", label: "Offers Financing", desc: "Payment plans available" },
] as const;

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

type DayKey = typeof DAYS[number]["key"];
type Hours = { open: string; close: string } | null;
type BusinessHours = Record<DayKey, Hours>;

interface ProfileState {
  business_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zip: string;
  years_in_business: number | null;
  license_number: string;
  warranty_years: number | null;
  logo_url: string;
  is_licensed: boolean;
  is_insured: boolean;
  gaf_master_elite: boolean;
  owens_corning_preferred: boolean;
  certainteed_select: boolean;
  bbb_accredited: boolean;
  bbb_rating: string;
  offers_financing: boolean;
  business_hours: BusinessHours;
}

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: "08:00", close: "17:00" },
  tue: { open: "08:00", close: "17:00" },
  wed: { open: "08:00", close: "17:00" },
  thu: { open: "08:00", close: "17:00" },
  fri: { open: "08:00", close: "17:00" },
  sat: null,
  sun: null,
};

const DEFAULT_STATE: ProfileState = {
  business_name: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  zip: "",
  years_in_business: null,
  license_number: "",
  warranty_years: null,
  logo_url: "",
  is_licensed: false,
  is_insured: false,
  gaf_master_elite: false,
  owens_corning_preferred: false,
  certainteed_select: false,
  bbb_accredited: false,
  bbb_rating: "",
  offers_financing: false,
  business_hours: DEFAULT_HOURS,
};

export function ProfileTab() {
  const { contractorId } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ProfileState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    if (!contractorId) return;
    (async () => {
      const { data } = await supabase
        .from("contractors")
        .select(
          "business_name, phone, email, city, state, zip, years_in_business, license_number, warranty_years, logo_url, is_licensed, is_insured, gaf_master_elite, owens_corning_preferred, certainteed_select, bbb_accredited, bbb_rating, offers_financing, business_hours"
        )
        .eq("id", contractorId)
        .single();

      if (data) {
        setState({
          ...DEFAULT_STATE,
          business_name: data.business_name || "",
          phone: data.phone || "",
          email: data.email || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          years_in_business: data.years_in_business,
          license_number: data.license_number || "",
          warranty_years: data.warranty_years,
          logo_url: data.logo_url || "",
          is_licensed: !!data.is_licensed,
          is_insured: !!data.is_insured,
          gaf_master_elite: !!data.gaf_master_elite,
          owens_corning_preferred: !!data.owens_corning_preferred,
          certainteed_select: !!data.certainteed_select,
          bbb_accredited: !!data.bbb_accredited,
          bbb_rating: data.bbb_rating || "",
          offers_financing: !!data.offers_financing,
          business_hours: (data.business_hours as BusinessHours) || DEFAULT_HOURS,
        });
      }
      setLoading(false);
    })();
  }, [contractorId]);

  function update<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: DayKey) {
    setState((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: prev.business_hours[day] ? null : { open: "08:00", close: "17:00" },
      },
    }));
  }

  function updateHours(day: DayKey, field: "open" | "close", value: string) {
    setState((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: { ...(prev.business_hours[day] || { open: "08:00", close: "17:00" }), [field]: value },
      },
    }));
  }

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    setErr("");
    const form = new FormData();
    form.append("file", file);
    try {
      const resp = await fetch("/api/dashboard/upload-logo", { method: "POST", body: form });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Upload failed");
      update("logo_url", json.logoUrl);
    } catch (e: any) {
      setErr(e.message || "Logo upload failed");
    }
    setLogoUploading(false);
  }

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setErr("");

    const { error } = await supabase
      .from("contractors")
      .update({
        business_name: state.business_name,
        phone: state.phone,
        city: state.city,
        state: state.state,
        zip: state.zip || null,
        years_in_business: state.years_in_business,
        license_number: state.license_number || null,
        warranty_years: state.warranty_years,
        is_licensed: state.is_licensed,
        is_insured: state.is_insured,
        gaf_master_elite: state.gaf_master_elite,
        owens_corning_preferred: state.owens_corning_preferred,
        certainteed_select: state.certainteed_select,
        bbb_accredited: state.bbb_accredited,
        bbb_rating: state.bbb_rating || null,
        offers_financing: state.offers_financing,
        business_hours: state.business_hours,
      })
      .eq("id", contractorId);

    setSaving(false);
    if (error) {
      setErr("Failed to save. Try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handlePasswordChange() {
    setPwErr("");
    if (newPassword.length < 6) {
      setPwErr("Min 6 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwErr(error.message);
    } else {
      setPwSaved(true);
      setNewPassword("");
      setTimeout(() => setPwSaved(false), 2500);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="py-12 text-center text-sm neu-muted">Loading profile…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Business Basics */}
      <SettingsSection title="Business Basics" description="The core info Riley, estimates, and emails use.">
        <NeuInput
          label="Business Name"
          value={state.business_name}
          onChange={(e) => update("business_name", e.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <NeuInput
            label="Phone"
            value={state.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <NeuInput
            label="Email"
            value={state.email}
            disabled
            hint="Email support@ruufpro.com to change"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <NeuInput
            label="City"
            value={state.city}
            onChange={(e) => update("city", e.target.value)}
          />
          <NeuSelect
            label="State"
            value={state.state}
            onChange={(e) => update("state", e.target.value)}
          >
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </NeuSelect>
          <NeuInput
            label="ZIP"
            value={state.zip}
            onChange={(e) => update("zip", e.target.value)}
          />
        </div>
      </SettingsSection>

      {/* Credentials */}
      <SettingsSection title="Credentials" description="Shown on Riley chats and estimates.">
        <div className="grid gap-4 md:grid-cols-3">
          <NeuInput
            label="Years in Business"
            type="number"
            placeholder="5"
            value={state.years_in_business ?? ""}
            onChange={(e) => update("years_in_business", e.target.value ? parseInt(e.target.value) : null)}
          />
          <NeuInput
            label="License #"
            placeholder="Optional"
            value={state.license_number}
            onChange={(e) => update("license_number", e.target.value)}
          />
          <NeuInput
            label="Warranty (years)"
            type="number"
            placeholder="10"
            value={state.warranty_years ?? ""}
            onChange={(e) => update("warranty_years", e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
      </SettingsSection>

      {/* Logo */}
      <SettingsSection title="Logo" description="PNG / JPG / SVG, max 5MB.">
        <div className="flex items-center gap-5">
          <div
            className="neu-inset flex h-24 w-24 items-center justify-center overflow-hidden"
            style={{ borderRadius: 14 }}
          >
            {state.logo_url ? (
              <Image
                src={state.logo_url}
                alt="Logo"
                width={96}
                height={96}
                className="h-full w-full object-contain p-2"
                unoptimized
              />
            ) : (
              <span className="text-[11px] neu-muted">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />
            <NeuButton
              variant="flat"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
            >
              <Upload className="h-4 w-4" />
              {logoUploading ? "Uploading…" : state.logo_url ? "Replace Logo" : "Upload Logo"}
            </NeuButton>
            {state.logo_url && (
              <button
                onClick={() => update("logo_url", "")}
                className="text-[12px] neu-muted hover:opacity-80 text-left"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Trust Signals */}
      <SettingsSection
        title="Trust Signals"
        description="Shown as badges to homeowners. Only toggle on what applies."
      >
        <div className="space-y-1">
          {TRUST_SIGNALS.map((signal) => (
            <div
              key={signal.key}
              className="flex items-center gap-4 py-2"
            >
              <div className="flex-1">
                <NeuToggle
                  checked={state[signal.key as keyof ProfileState] as boolean}
                  onChange={(v) => update(signal.key as keyof ProfileState, v as any)}
                  label={signal.label}
                  description={signal.desc}
                />
              </div>
            </div>
          ))}
          {state.bbb_accredited && (
            <div className="pt-2">
              <NeuSelect
                label="BBB Rating"
                value={state.bbb_rating}
                onChange={(e) => update("bbb_rating", e.target.value)}
                wrapperClassName="max-w-[200px]"
              >
                <option value="">Select rating</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
              </NeuSelect>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Business Hours */}
      <SettingsSection
        title="Business Hours"
        description="Riley uses these to greet homeowners differently after hours."
      >
        <div className="space-y-1.5">
          {DAYS.map(({ key, label }) => {
            const hrs = state.business_hours[key];
            return (
              <div key={key} className="flex items-center gap-3 py-1.5">
                <div className="w-10">
                  <NeuToggle checked={!!hrs} onChange={() => toggleDay(key)} />
                </div>
                <span
                  className="w-24 text-[13px] font-medium"
                  style={{ color: "var(--neu-text)" }}
                >
                  {label}
                </span>
                {hrs ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hrs.open}
                      onChange={(e) => updateHours(key, "open", e.target.value)}
                      className="neu-inset-deep bg-transparent px-2.5 py-1.5 text-[13px] outline-none"
                      style={{ color: "var(--neu-text)" }}
                    />
                    <span className="text-[12px] neu-muted">to</span>
                    <input
                      type="time"
                      value={hrs.close}
                      onChange={(e) => updateHours(key, "close", e.target.value)}
                      className="neu-inset-deep bg-transparent px-2.5 py-1.5 text-[13px] outline-none"
                      style={{ color: "var(--neu-text)" }}
                    />
                  </div>
                ) : (
                  <span className="text-[12px] neu-muted">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="Account" description="Change your password or sign out.">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide neu-muted">
            New Password
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                className="neu-inset-deep w-full bg-transparent px-3.5 py-2.5 pr-10 text-[14px] outline-none"
                style={{ color: "var(--neu-text)" }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 neu-muted hover:opacity-75"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <NeuButton variant="accent" onClick={handlePasswordChange} disabled={!newPassword}>
              {pwSaved ? (
                <>
                  <Check className="h-4 w-4" /> Updated
                </>
              ) : (
                "Update"
              )}
            </NeuButton>
          </div>
          {pwErr && <p className="mt-1.5 text-[12px] text-red-500">{pwErr}</p>}
        </div>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[13px] font-medium neu-muted hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </SettingsSection>

      {/* Save bar */}
      <div
        className="neu-flat sticky bottom-4 flex items-center justify-between gap-3 px-5 py-3"
        style={{ borderRadius: 14 }}
      >
        <div className="text-[12px] neu-muted">
          {err ? (
            <span className="text-red-500 font-medium">{err}</span>
          ) : saved ? (
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--neu-accent)" }}>
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : (
            "Unsaved changes will be lost if you close this tab."
          )}
        </div>
        <NeuButton variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </NeuButton>
      </div>
    </div>
  );
}
