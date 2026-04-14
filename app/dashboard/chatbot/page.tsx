// Train Riley — Dashboard page where contractors teach Riley about their business.
// 3 collapsible sections matching chatbot_config tiers.
// Progress bar tracks completion %. Pro+ tier gate.

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  DollarSign,
  Shield,
  Star,
  Plus,
  Trash2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatbotConfigState {
  greeting_message: string;
  price_range_low: string;
  price_range_high: string;
  offers_free_inspection: boolean;
  typical_timeline_days: string;
  materials_brands: string;
  process_steps: string;
  does_insurance_work: boolean;
  insurance_description: string;
  financing_provider: string;
  financing_terms: string;
  warranty_description: string;
  emergency_available: boolean;
  emergency_description: string;
  custom_faqs: Array<{ q: string; a: string }>;
  differentiators: string;
  team_description: string;
  payment_methods: string;
  current_promotions: string;
  referral_program: string;
}

const EMPTY_CONFIG: ChatbotConfigState = {
  greeting_message: "",
  price_range_low: "",
  price_range_high: "",
  offers_free_inspection: false,
  typical_timeline_days: "",
  materials_brands: "",
  process_steps: "",
  does_insurance_work: false,
  insurance_description: "",
  financing_provider: "",
  financing_terms: "",
  warranty_description: "",
  emergency_available: false,
  emergency_description: "",
  custom_faqs: [],
  differentiators: "",
  team_description: "",
  payment_methods: "",
  current_promotions: "",
  referral_program: "",
};

const TOTAL_FIELDS = 17;
const MAX_TEXT_LENGTH = 500;
const MAX_FAQ_COUNT = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countFilledFields(c: ChatbotConfigState): number {
  let count = 0;
  if (c.price_range_low && c.price_range_high) count++;
  if (c.offers_free_inspection) count++;
  if (c.typical_timeline_days.trim()) count++;
  if (c.materials_brands.trim()) count++;
  if (c.process_steps.trim()) count++;
  if (c.does_insurance_work) count++;
  if (c.insurance_description.trim()) count++;
  if (c.financing_provider.trim() || c.financing_terms.trim()) count++;
  if (c.warranty_description.trim()) count++;
  if (c.emergency_available) count++;
  if (c.emergency_description.trim()) count++;
  if (c.custom_faqs.some((f) => f.q.trim() && f.a.trim())) count++;
  if (c.differentiators.trim()) count++;
  if (c.team_description.trim()) count++;
  if (c.payment_methods.trim()) count++;
  if (c.current_promotions.trim()) count++;
  if (c.referral_program.trim()) count++;
  return count;
}

function normalizeFromDb(data: Record<string, unknown>): ChatbotConfigState {
  return {
    greeting_message: (data.greeting_message as string) ?? "",
    price_range_low: data.price_range_low != null ? String(data.price_range_low) : "",
    price_range_high: data.price_range_high != null ? String(data.price_range_high) : "",
    offers_free_inspection: (data.offers_free_inspection as boolean) ?? false,
    typical_timeline_days: (data.typical_timeline_days as string) ?? "",
    materials_brands: Array.isArray(data.materials_brands) ? (data.materials_brands as string[]).join(", ") : "",
    process_steps: (data.process_steps as string) ?? "",
    does_insurance_work: (data.does_insurance_work as boolean) ?? false,
    insurance_description: (data.insurance_description as string) ?? "",
    financing_provider: (data.financing_provider as string) ?? "",
    financing_terms: (data.financing_terms as string) ?? "",
    warranty_description: (data.warranty_description as string) ?? "",
    emergency_available: (data.emergency_available as boolean) ?? false,
    emergency_description: (data.emergency_description as string) ?? "",
    custom_faqs: Array.isArray(data.custom_faqs) ? (data.custom_faqs as Array<{ q: string; a: string }>) : [],
    differentiators: (data.differentiators as string) ?? "",
    team_description: (data.team_description as string) ?? "",
    payment_methods: Array.isArray(data.payment_methods) ? (data.payment_methods as string[]).join(", ") : "",
    current_promotions: (data.current_promotions as string) ?? "",
    referral_program: (data.referral_program as string) ?? "",
  };
}

function prepareForDb(c: ChatbotConfigState) {
  let priceLow = c.price_range_low ? Math.max(0, Math.min(parseInt(c.price_range_low, 10) || 0, 999999)) : null;
  let priceHigh = c.price_range_high ? Math.max(0, Math.min(parseInt(c.price_range_high, 10) || 0, 999999)) : null;
  // Swap if inverted so Riley never says "$50K to $5K"
  if (priceLow && priceHigh && priceLow > priceHigh) {
    [priceLow, priceHigh] = [priceHigh, priceLow];
  }
  return {
    greeting_message: c.greeting_message.trim() || null,
    price_range_low: priceLow || null,
    price_range_high: priceHigh || null,
    offers_free_inspection: c.offers_free_inspection,
    typical_timeline_days: c.typical_timeline_days.trim() || null,
    materials_brands: c.materials_brands.trim()
      ? c.materials_brands.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    process_steps: c.process_steps.trim() || null,
    does_insurance_work: c.does_insurance_work,
    insurance_description: c.insurance_description.trim() || null,
    financing_provider: c.financing_provider.trim() || null,
    financing_terms: c.financing_terms.trim() || null,
    warranty_description: c.warranty_description.trim() || null,
    emergency_available: c.emergency_available,
    emergency_description: c.emergency_description.trim() || null,
    custom_faqs: c.custom_faqs.filter((f) => f.q.trim() || f.a.trim()),
    differentiators: c.differentiators.trim() || null,
    team_description: c.team_description.trim() || null,
    payment_methods: c.payment_methods.trim()
      ? c.payment_methods.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    current_promotions: c.current_promotions.trim() || null,
    referral_program: c.referral_program.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputClass =
  "w-full px-3 py-2.5 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition";
const textareaClass = `${inputClass} resize-none`;
const labelClass = "block text-[12px] font-semibold text-slate-600 mb-1";
const hintClass = "text-[11px] text-slate-400 mt-1";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatbotPage() {
  const { contractorId, tier } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [openSection, setOpenSection] = useState<number | null>(1);
  const [config, setConfig] = useState<ChatbotConfigState>(EMPTY_CONFIG);

  // Load chatbot config on mount
  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("chatbot_config")
        .select("*")
        .eq("contractor_id", contractorId)
        .maybeSingle();
      if (data) setConfig(normalizeFromDb(data));
      setLoading(false);
    }
    load();
  }, [contractorId]);

  const updateField = useCallback(
    <K extends keyof ChatbotConfigState>(key: K, value: ChatbotConfigState[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Save — upsert by contractor_id
  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const { error } = await supabase
      .from("chatbot_config")
      .upsert(
        {
          contractor_id: contractorId,
          ...prepareForDb(config),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "contractor_id" }
      );

    setSaving(false);
    if (error) {
      setSaveError("Failed to save. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // --- Tier gate ---
  if (tier === "free") {
    return (
      <div className="max-w-[480px] mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
          <Bot className="w-7 h-7 text-violet-500" />
        </div>
        <h2 className="text-[18px] font-extrabold text-slate-800">Train Riley — Pro Feature</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[360px] mx-auto">
          Riley is your 24/7 AI assistant that answers homeowner questions, captures leads,
          and knows your business inside out. Train her with your pricing, process, and FAQs.
        </p>
        <p className="text-[13px] font-semibold text-amber-600">Requires the $149/mo Pro plan.</p>
        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: "pro_monthly" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-[13px] font-semibold hover:bg-violet-700 transition"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = countFilledFields(config);
  const completionPct = Math.round((completedCount / TOTAL_FIELDS) * 100);

  const progressMessage =
    completionPct < 30
      ? "Start with your pricing and process — Riley will give much better answers."
      : completionPct < 70
        ? "Good progress! Add insurance and warranty details next."
        : completionPct < 100
          ? "Almost there — custom FAQs make Riley unbeatable."
          : "Riley is fully trained and ready to convert leads!";

  return (
    <div className="max-w-[680px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-slate-800">Train Riley</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            The more Riley knows, the more leads she captures.
          </p>
        </div>
        <button
          disabled
          title="Coming soon — will auto-fill from your website"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-400 cursor-not-allowed opacity-60"
        >
          <Sparkles className="w-3 h-3" />
          Smart Pre-fill
          <span className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase tracking-wide text-slate-400 ml-1">
            Soon
          </span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-slate-600">Riley&apos;s Training Progress</span>
          <span className="text-[12px] font-bold text-violet-600">{completionPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">{progressMessage}</p>
      </div>

      {/* Custom Greeting */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <label className={labelClass}>Riley&apos;s Greeting Message</label>
        <textarea
          rows={2}
          maxLength={200}
          placeholder={`Hi! I'm Riley, an AI assistant for ${"{your business}"}. I can answer questions about our roofing services, pricing, and availability. What can I help you with?`}
          value={config.greeting_message}
          onChange={(e) => updateField("greeting_message", e.target.value)}
          className={textareaClass}
        />
        <p className={hintClass}>
          {config.greeting_message.length}/200 · Leave blank for default greeting
        </p>
      </div>

      {/* Section 1: Pricing & Services */}
      <CollapsibleSection
        number={1}
        title="Pricing & Services"
        subtitle="What homeowners ask first"
        icon={<DollarSign className="w-4 h-4" />}
        open={openSection === 1}
        onToggle={() => setOpenSection(openSection === 1 ? null : 1)}
      >
        <div className="space-y-4">
          {/* Price range */}
          <div>
            <label className={labelClass}>Typical project price range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">$</span>
                <input
                  type="number"
                  placeholder="5,000"
                  value={config.price_range_low}
                  onChange={(e) => updateField("price_range_low", e.target.value)}
                  className={`${inputClass} pl-7`}
                />
              </div>
              <span className="text-[12px] text-slate-400 font-medium">to</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">$</span>
                <input
                  type="number"
                  placeholder="25,000"
                  value={config.price_range_high}
                  onChange={(e) => updateField("price_range_high", e.target.value)}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>
            <p className={hintClass}>Riley will say &quot;projects typically range from $X to $Y&quot;</p>
          </div>

          {/* Free inspection toggle */}
          <ToggleField
            label="Do you offer free inspections?"
            checked={config.offers_free_inspection}
            onChange={(v) => updateField("offers_free_inspection", v)}
          />

          {/* Timeline */}
          <div>
            <label className={labelClass}>Typical project timeline</label>
            <input
              placeholder="Most jobs done in 1-3 days, repairs same-day"
              value={config.typical_timeline_days}
              onChange={(e) => updateField("typical_timeline_days", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Materials */}
          <div>
            <label className={labelClass}>Materials & brands you use</label>
            <input
              placeholder="GAF Timberline HDZ, Owens Corning Duration, IKO Cambridge"
              value={config.materials_brands}
              onChange={(e) => updateField("materials_brands", e.target.value)}
              className={inputClass}
            />
            <p className={hintClass}>Separate with commas</p>
          </div>

          {/* Process */}
          <div>
            <label className={labelClass}>Your roofing process (step by step)</label>
            <textarea
              rows={3}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="1. Free inspection  2. Written estimate  3. Schedule install  4. Roof day  5. Final walkthrough & cleanup"
              value={config.process_steps}
              onChange={(e) => updateField("process_steps", e.target.value)}
              className={textareaClass}
            />
            <p className={hintClass}>{config.process_steps.length}/{MAX_TEXT_LENGTH}</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: Insurance & Financing */}
      <CollapsibleSection
        number={2}
        title="Insurance & Financing"
        subtitle="High-value trust builders"
        icon={<Shield className="w-4 h-4" />}
        open={openSection === 2}
        onToggle={() => setOpenSection(openSection === 2 ? null : 2)}
      >
        <div className="space-y-4">
          {/* Insurance toggle + description */}
          <ToggleField
            label="Do you work with insurance companies?"
            checked={config.does_insurance_work}
            onChange={(v) => updateField("does_insurance_work", v)}
          />
          {config.does_insurance_work && (
            <div>
              <label className={labelClass}>Describe your insurance process</label>
              <textarea
                rows={2}
                maxLength={MAX_TEXT_LENGTH}
                placeholder="We handle the entire claim — meet the adjuster, document damage, submit supplements, and fight for full coverage."
                value={config.insurance_description}
                onChange={(e) => updateField("insurance_description", e.target.value)}
                className={textareaClass}
              />
              <p className={hintClass}>{config.insurance_description.length}/{MAX_TEXT_LENGTH}</p>
            </div>
          )}

          {/* Financing */}
          <div>
            <label className={labelClass}>Financing provider</label>
            <input
              placeholder="Acorn Finance, GreenSky, Hearth"
              value={config.financing_provider}
              onChange={(e) => updateField("financing_provider", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Financing terms</label>
            <input
              placeholder="0% APR for 18 months, loans up to $100K"
              value={config.financing_terms}
              onChange={(e) => updateField("financing_terms", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Warranty */}
          <div>
            <label className={labelClass}>Warranty details</label>
            <textarea
              rows={2}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="10-year workmanship warranty + 50-year GAF manufacturer warranty backed by Golden Pledge"
              value={config.warranty_description}
              onChange={(e) => updateField("warranty_description", e.target.value)}
              className={textareaClass}
            />
            <p className={hintClass}>{config.warranty_description.length}/{MAX_TEXT_LENGTH}</p>
          </div>

          {/* Emergency */}
          <ToggleField
            label="Do you offer emergency roofing services?"
            checked={config.emergency_available}
            onChange={(v) => updateField("emergency_available", v)}
          />
          {config.emergency_available && (
            <div>
              <label className={labelClass}>Emergency service details</label>
              <input
                placeholder="24/7 emergency tarping and board-up for active leaks"
                value={config.emergency_description}
                onChange={(e) => updateField("emergency_description", e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Section 3: What Makes You Different */}
      <CollapsibleSection
        number={3}
        title="What Makes You Different"
        subtitle="Lock in customers with unique details"
        icon={<Star className="w-4 h-4" />}
        open={openSection === 3}
        onToggle={() => setOpenSection(openSection === 3 ? null : 3)}
      >
        <div className="space-y-4">
          {/* Custom FAQs */}
          <div>
            <label className={labelClass}>Custom FAQs</label>
            <p className={hintClass + " mb-2"}>Add questions homeowners ask you + your best answers</p>
            <div className="space-y-3">
              {config.custom_faqs.map((faq, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-2 bg-slate-50/50">
                  <input
                    placeholder="Question (e.g. Do you offer free estimates?)"
                    maxLength={200}
                    value={faq.q}
                    onChange={(e) => {
                      const updated = [...config.custom_faqs];
                      updated[i] = { ...faq, q: e.target.value };
                      updateField("custom_faqs", updated);
                    }}
                    className={inputClass}
                  />
                  <textarea
                    rows={2}
                    maxLength={MAX_TEXT_LENGTH}
                    placeholder="Your answer..."
                    value={faq.a}
                    onChange={(e) => {
                      const updated = [...config.custom_faqs];
                      updated[i] = { ...faq, a: e.target.value };
                      updateField("custom_faqs", updated);
                    }}
                    className={textareaClass}
                  />
                  <button
                    onClick={() => {
                      const updated = config.custom_faqs.filter((_, idx) => idx !== i);
                      updateField("custom_faqs", updated);
                    }}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {config.custom_faqs.length < MAX_FAQ_COUNT ? (
              <button
                onClick={() => updateField("custom_faqs", [...config.custom_faqs, { q: "", a: "" }])}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-[12px] font-semibold text-slate-500 hover:border-violet-300 hover:text-violet-600 transition"
              >
                <Plus className="w-3 h-3" />
                Add FAQ ({config.custom_faqs.length}/{MAX_FAQ_COUNT})
              </button>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">Maximum {MAX_FAQ_COUNT} FAQs reached</p>
            )}
          </div>

          {/* Differentiators */}
          <div>
            <label className={labelClass}>What sets you apart?</label>
            <textarea
              rows={2}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Family-owned for 15 years, same crew on every job, we pull all permits, only roofer in Tampa with in-house sheet metal"
              value={config.differentiators}
              onChange={(e) => updateField("differentiators", e.target.value)}
              className={textareaClass}
            />
            <p className={hintClass}>{config.differentiators.length}/{MAX_TEXT_LENGTH}</p>
          </div>

          {/* Team */}
          <div>
            <label className={labelClass}>About your team</label>
            <textarea
              rows={2}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Owner-operated by Mike (25 years experience), 5 W-2 crews, OSHA-10 certified"
              value={config.team_description}
              onChange={(e) => updateField("team_description", e.target.value)}
              className={textareaClass}
            />
            <p className={hintClass}>{config.team_description.length}/{MAX_TEXT_LENGTH}</p>
          </div>

          {/* Payment methods */}
          <div>
            <label className={labelClass}>Payment methods accepted</label>
            <input
              placeholder="Cash, Check, Credit Card, Financing, Zelle"
              value={config.payment_methods}
              onChange={(e) => updateField("payment_methods", e.target.value)}
              className={inputClass}
            />
            <p className={hintClass}>Separate with commas</p>
          </div>

          {/* Promotions */}
          <div>
            <label className={labelClass}>Current promotions</label>
            <input
              placeholder="10% off for first responders and military through Dec 2026"
              value={config.current_promotions}
              onChange={(e) => updateField("current_promotions", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Referral program */}
          <div>
            <label className={labelClass}>Referral program</label>
            <input
              placeholder="$250 gift card for every neighbor referral that signs a contract"
              value={config.referral_program}
              onChange={(e) => updateField("referral_program", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Embed code for external sites */}
      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-[14px] font-bold text-slate-800 mb-1">Embed Riley on Your Website</h3>
        <p className="text-[12px] text-slate-500 mb-3">
          Paste this one line before &lt;/body&gt; on any page. Works on WordPress, Wix, Squarespace, or any HTML site.
          Add <code className="text-violet-600">data-accent-color</code> to match your brand.
        </p>
        <div className="relative">
          <code className="block bg-white border border-slate-200 rounded-lg p-3 text-[11px] text-slate-700 break-all font-mono">
            {`<script src="https://ruufpro.com/riley.js" data-contractor-id="${contractorId}" data-accent-color="#6366f1"></script>`}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `<script src="https://ruufpro.com/riley.js" data-contractor-id="${contractorId}" data-accent-color="#6366f1"></script>`
              );
            }}
            className="absolute top-2 right-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-semibold text-slate-600 transition"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Config change note */}
      <p className="text-[11px] text-slate-400 text-center mt-2">
        Changes take effect on new conversations. Active chats may show updated info.
      </p>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 -mx-5 px-5 py-3 lg:-mx-8 lg:px-8 flex items-center justify-between z-10">
        <div className="text-[12px]">
          {saveError && <span className="text-red-500 font-medium">{saveError}</span>}
          {saved && (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved — Riley is updated!
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-violet-600 text-white rounded-lg text-[13px] font-semibold hover:bg-violet-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  number,
  title,
  subtitle,
  icon,
  open,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">
              {number}/3
            </span>
            <span className="text-[14px] font-bold text-slate-800">{title}</span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle Field
// ---------------------------------------------------------------------------

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${
          checked ? "bg-violet-500" : "bg-slate-200"
        }`}
        style={{ width: 40, height: 22 }}
      >
        <span
          className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
          style={{
            width: 18,
            height: 18,
            transform: checked ? "translateX(20px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}
