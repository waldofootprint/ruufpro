// Train Riley — Dashboard page where contractors teach Riley about their business.
// 3 collapsible sections matching chatbot_config tiers.
// Progress bar tracks completion %. Pro+ tier gate.
// Enable/disable toggle + hard gate (can't enable without training).
// Test Riley preview modal.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Check,
  DollarSign,
  Shield,
  Star,
  Plus,
  Trash2,
  Power,
  MessageSquare,
  Send,
  X,
  Copy,
  Mail,
  AlertTriangle,
  ExternalLink,
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

// Core fields = the essentials Riley actually needs to be useful
const CORE_FIELDS = ["price_range", "typical_timeline_days", "materials_brands", "process_steps"] as const;
const MIN_CORE_FIELDS_TO_ENABLE = 3; // Need at least 3 core fields to enable Riley

const MAX_TEXT_LENGTH = 500;
const MAX_FAQ_COUNT = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countCoreFields(c: ChatbotConfigState): number {
  let count = 0;
  if (c.price_range_low && c.price_range_high) count++; // price_range
  if (c.typical_timeline_days.trim()) count++;
  if (c.materials_brands.trim()) count++;
  if (c.process_steps.trim()) count++;
  return count;
}

function countFilledFields(c: ChatbotConfigState): number {
  let count = countCoreFields(c);
  if (c.offers_free_inspection) count++;
  if (c.does_insurance_work && c.insurance_description.trim()) count++;
  if (c.financing_provider.trim() || c.financing_terms.trim()) count++;
  if (c.warranty_description.trim()) count++;
  if (c.emergency_available && c.emergency_description.trim()) count++;
  if (c.custom_faqs.some((f) => f.q.trim() && f.a.trim())) count++;
  if (c.differentiators.trim()) count++;
  if (c.team_description.trim()) count++;
  if (c.payment_methods.trim()) count++;
  if (c.current_promotions.trim()) count++;
  if (c.referral_program.trim()) count++;
  return count;
}

function getRelevantFieldCount(c: ChatbotConfigState): number {
  // Only count fields that are relevant to this roofer's situation
  let total = 4; // core fields always count
  total++; // offers_free_inspection
  if (c.does_insurance_work) total++; // insurance_description only if they do insurance
  total++; // financing (provider or terms)
  total++; // warranty
  if (c.emergency_available) total++; // emergency_description only if they offer emergency
  total++; // custom_faqs
  total++; // differentiators
  total++; // team_description
  total++; // payment_methods
  total++; // current_promotions
  total++; // referral_program
  return total;
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
  // Strip non-numeric from price inputs (handles $, commas, spaces)
  const rawLow = c.price_range_low.replace(/[^0-9]/g, "");
  const rawHigh = c.price_range_high.replace(/[^0-9]/g, "");
  let priceLow = rawLow ? Math.max(0, Math.min(parseInt(rawLow, 10) || 0, 999999)) : null;
  let priceHigh = rawHigh ? Math.max(0, Math.min(parseInt(rawHigh, 10) || 0, 999999)) : null;
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

// Format number with commas for display
function formatPrice(val: string): string {
  const digits = val.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString();
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
  const { contractorId, tier, businessName } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [openSection, setOpenSection] = useState<number | null>(1);
  const [config, setConfig] = useState<ChatbotConfigState>(EMPTY_CONFIG);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showEmbedDetails, setShowEmbedDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load chatbot config + enabled status on mount
  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const [configRes, contractorRes] = await Promise.all([
        supabase
          .from("chatbot_config")
          .select("*")
          .eq("contractor_id", contractorId)
          .maybeSingle(),
        supabase
          .from("contractors")
          .select("has_ai_chatbot")
          .eq("id", contractorId)
          .single(),
      ]);
      if (configRes.data) setConfig(normalizeFromDb(configRes.data));
      if (contractorRes.data) setIsEnabled(contractorRes.data.has_ai_chatbot || false);
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

  // Toggle Riley on/off — with hard gate
  async function handleToggle() {
    if (!contractorId) return;
    const newState = !isEnabled;

    // Hard gate: can't enable without minimum training
    if (newState && countCoreFields(config) < MIN_CORE_FIELDS_TO_ENABLE) {
      setSaveError(`Fill in at least ${MIN_CORE_FIELDS_TO_ENABLE} of the 4 core fields (pricing, timeline, materials, process) before enabling Riley.`);
      setTimeout(() => setSaveError(""), 5000);
      return;
    }

    const { error } = await supabase
      .from("contractors")
      .update({ has_ai_chatbot: newState })
      .eq("id", contractorId);

    if (!error) {
      setIsEnabled(newState);
    }
  }

  // --- Tier gate ---
  if (tier === "free") {
    return (
      <div className="max-w-[480px] mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
          <Bot className="w-7 h-7 text-violet-500" />
        </div>
        <h2 className="text-[18px] font-extrabold text-slate-800">Riley AI Chatbot — Pro Feature</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[360px] mx-auto">
          Riley is your 24/7 AI assistant that answers homeowner questions, captures leads,
          and knows your business inside out. Included in the $149/mo Pro plan.
        </p>
        <div className="bg-slate-50 rounded-lg p-4 max-w-[360px] mx-auto text-left space-y-2">
          <p className="text-[12px] font-semibold text-slate-700">What Riley does for you:</p>
          <ul className="text-[12px] text-slate-500 space-y-1.5">
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> Answers homeowner questions 24/7</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> Captures leads with name, phone, and address</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> Gives instant satellite-measured roof estimates</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> Sounds like she works for YOUR business</li>
          </ul>
        </div>
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

  const coreCount = countCoreFields(config);
  const completedCount = countFilledFields(config);
  const relevantTotal = getRelevantFieldCount(config);
  const completionPct = Math.round((completedCount / relevantTotal) * 100);
  const canEnable = coreCount >= MIN_CORE_FIELDS_TO_ENABLE;

  const progressMessage =
    coreCount === 0
      ? "Start with your pricing and timeline — Riley needs the basics to help homeowners."
      : coreCount < MIN_CORE_FIELDS_TO_ENABLE
        ? `${MIN_CORE_FIELDS_TO_ENABLE - coreCount} more core field${MIN_CORE_FIELDS_TO_ENABLE - coreCount > 1 ? "s" : ""} needed before you can turn Riley on.`
        : completionPct < 60
          ? "Riley has the essentials — she's ready to go! Add more to make her even better."
          : completionPct < 100
            ? "Almost there — custom FAQs make Riley unbeatable."
            : "Riley is fully trained and ready to convert leads!";

  const embedCode = `<script src="https://ruufpro.com/riley.js" data-contractor-id="${contractorId}"></script>`;

  return (
    <div className="max-w-[680px] mx-auto space-y-5">
      {/* Header + Enable Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-extrabold text-slate-800">Riley AI Chatbot</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Your 24/7 AI assistant that answers homeowner questions and captures leads.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Test Riley button */}
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-200 text-[12px] font-semibold text-violet-600 hover:bg-violet-50 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Test Riley
          </button>
          {/* Enable toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={!canEnable && !isEnabled}
              title={!canEnable && !isEnabled ? `Fill in at least ${MIN_CORE_FIELDS_TO_ENABLE} core fields first` : isEnabled ? "Click to turn Riley off" : "Click to turn Riley on"}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isEnabled ? "bg-emerald-500" : canEnable ? "bg-slate-200 hover:bg-slate-300" : "bg-slate-100 cursor-not-allowed"
              }`}
            >
              <span
                className="absolute top-1 rounded-full bg-white shadow transition-transform"
                style={{
                  width: 20,
                  height: 20,
                  transform: isEnabled ? "translateX(24px)" : "translateX(3px)",
                }}
              />
            </button>
            <span className={`text-[12px] font-bold ${isEnabled ? "text-emerald-600" : "text-slate-400"}`}>
              {isEnabled ? "LIVE" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {isEnabled ? (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-semibold text-emerald-700">Riley is live on your website — answering questions and capturing leads 24/7</span>
        </div>
      ) : canEnable ? (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Power className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-[12px] font-medium text-amber-700">
            Riley is trained and ready. Flip the switch above to put her on your website.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-[12px] font-medium text-slate-500">
            Fill in at least {MIN_CORE_FIELDS_TO_ENABLE} of the 4 core fields below (pricing, timeline, materials, process) to enable Riley.
          </span>
        </div>
      )}

      {/* Custom Greeting */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <label className={labelClass}>Riley&apos;s Greeting Message</label>
        <textarea
          rows={2}
          maxLength={200}
          placeholder={`Hi! I'm Riley, an AI assistant for ${businessName || "your business"}. I can answer questions about our roofing services, pricing, and availability. What can I help you with?`}
          value={config.greeting_message}
          onChange={(e) => updateField("greeting_message", e.target.value)}
          className={textareaClass}
        />
        <p className={hintClass}>
          {config.greeting_message.length}/200 · Leave blank for default greeting
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-slate-600">Training Progress</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Core: {coreCount}/4</span>
            <span className="text-[12px] font-bold text-violet-600">{completionPct}%</span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${canEnable ? "bg-violet-500" : "bg-amber-400"}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">{progressMessage}</p>
      </div>

      {/* Section 1: Pricing & Services (CORE) */}
      <CollapsibleSection
        number={1}
        title="Pricing & Services"
        subtitle="Core fields — Riley needs these to be useful"
        icon={<DollarSign className="w-4 h-4" />}
        open={openSection === 1}
        onToggle={() => setOpenSection(openSection === 1 ? null : 1)}
        badge={coreCount >= 2 ? "ready" : "needs-work"}
      >
        <div className="space-y-4">
          {/* Price range */}
          <div>
            <label className={labelClass}>Typical project price range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="5,000"
                  value={formatPrice(config.price_range_low)}
                  onChange={(e) => updateField("price_range_low", e.target.value.replace(/[^0-9]/g, ""))}
                  className={`${inputClass} pl-7`}
                />
              </div>
              <span className="text-[12px] text-slate-400 font-medium">to</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="25,000"
                  value={formatPrice(config.price_range_high)}
                  onChange={(e) => updateField("price_range_high", e.target.value.replace(/[^0-9]/g, ""))}
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
        subtitle="The details that lock in customers"
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

      {/* SMS consent explanation */}
      <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-violet-900">About lead capture</p>
            <p className="text-[11px] text-violet-700 mt-1 leading-relaxed">
              When homeowners chat with Riley, she&apos;ll ask for their name and phone number after a few messages.
              They&apos;ll also see an &quot;OK to text me&quot; checkbox — if they check it, you have permission to text them back.
              All leads show up in your Leads dashboard with their chat details.
            </p>
          </div>
        </div>
      </div>

      {/* Embed code for external sites — simplified */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-800 mb-1">Add Riley to Your Own Website</h3>
        <p className="text-[12px] text-slate-500 mb-3">
          Riley already appears on your RuufPro site. To add her to your own website too:
        </p>

        <div className="space-y-2">
          {/* Option 1: Send to web person */}
          <button
            onClick={() => {
              const subject = encodeURIComponent("Add Riley AI chatbot to our website");
              const body = encodeURIComponent(
                `Hi,\n\nPlease add this one line of code to our website, right before the </body> tag on every page:\n\n${embedCode}\n\nThis adds our AI chatbot (Riley) that answers customer questions 24/7.\n\nIf you're on WordPress: Install the "Insert Headers and Footers" plugin, then paste the code in the Footer section.\n\nIf you're on Wix: Go to Settings → Custom Code → Add Code → paste in the Footer.\n\nIf you're on Squarespace: Go to Settings → Advanced → Code Injection → Footer → paste.\n\nThanks!`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left"
          >
            <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div>
              <span className="text-[13px] font-semibold text-slate-800 block">Email instructions to your web person</span>
              <span className="text-[11px] text-slate-400">Pre-written email with the code + platform instructions</span>
            </div>
          </button>

          {/* Option 2: Copy code */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(embedCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left"
          >
            <Copy className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div>
              <span className="text-[13px] font-semibold text-slate-800 block">
                {copied ? "Copied!" : "Copy the embed code"}
              </span>
              <span className="text-[11px] text-slate-400">If you know how to edit your website&apos;s HTML</span>
            </div>
          </button>

          {/* Expandable: Platform instructions + raw code */}
          <button
            onClick={() => setShowEmbedDetails(!showEmbedDetails)}
            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            {showEmbedDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showEmbedDetails ? "Hide" : "Show"} platform instructions & code
          </button>

          {showEmbedDetails && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="space-y-2 text-[11px] text-slate-600">
                <p><strong>WordPress:</strong> Install the &quot;Insert Headers and Footers&quot; plugin → Settings → paste code in Footer section → Save.</p>
                <p><strong>Wix:</strong> Settings → Custom Code → Add Code → paste code → choose &quot;Body - end&quot; → Apply.</p>
                <p><strong>Squarespace:</strong> Settings → Advanced → Code Injection → Footer → paste code → Save.</p>
                <p><strong>Any other site:</strong> Paste this code right before the &lt;/body&gt; tag.</p>
              </div>
              <code className="block bg-white border border-slate-200 rounded-lg p-3 text-[11px] text-slate-700 break-all font-mono">
                {embedCode}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Config change note */}
      <p className="text-[12px] text-slate-500 text-center bg-slate-50 rounded-lg py-2 px-4">
        Changes take effect on new conversations. Active chats will continue with previous settings.
      </p>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 -mx-5 px-5 py-3 lg:-mx-8 lg:px-8 flex items-center justify-between z-10">
        <div className="text-[12px] flex-1 min-w-0">
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

      {/* Test Riley Modal */}
      {showTestModal && (
        <TestRileyModal
          contractorId={contractorId!}
          businessName={businessName || "Your Business"}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test Riley Modal
// ---------------------------------------------------------------------------

function TestRileyModal({
  contractorId,
  businessName,
  onClose,
}: {
  contractorId: string;
  businessName: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add greeting on mount
  useEffect(() => {
    setMessages([{
      role: "assistant",
      text: `Hi! I'm Riley, an AI assistant for ${businessName}. I can answer questions about our roofing services, pricing, and availability. What can I help you with?`,
    }]);
  }, [businessName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      // Use a test session ID that won't save to the database
      const testSessionId = `${contractorId}-test-${crypto.randomUUID()}`;
      const apiMessages = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.text,
        })),
        { role: "user" as const, content: userMsg },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          contractorId,
          sessionId: testSessionId,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", text: "Having trouble connecting — but this is just a preview! Riley will work fine on your website." }]);
      } else {
        // Read the stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        // Add empty assistant message to fill
        setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Extract text from SSE data lines
            const lines = chunk.split("\n");
            for (const line of lines) {
              // UI message stream format: look for text content
              if (line.startsWith("0:")) {
                try {
                  const text = JSON.parse(line.slice(2));
                  if (typeof text === "string") {
                    fullText += text;
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = { role: "assistant", text: fullText };
                      return updated;
                    });
                  }
                } catch {
                  // skip non-JSON lines
                }
              }
            }
          }
        }

        if (!fullText) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", text: "Riley is thinking... If this is empty, make sure your Anthropic API key is set up in Vercel." };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Connection error — but don't worry, this is just a preview!" }]);
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] max-w-[95vw] h-[560px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-violet-600 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[13px] font-bold">R</div>
            <div>
              <div className="text-white text-[14px] font-semibold">Test Riley</div>
              <div className="text-white/60 text-[11px]">Preview — not visible to homeowners</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] font-medium text-amber-700 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          This is a preview. Conversations here are NOT saved and homeowners can&apos;t see them.
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}
              >
                {msg.text || (loading ? "..." : "")}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {["How much does a new roof cost?", "Do you offer free inspections?", "My roof is leaking!"].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-[11px] font-medium hover:bg-violet-100 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="border-t border-slate-200 px-4 py-3 flex gap-2 flex-shrink-0"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Riley something..."
            maxLength={2000}
            className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-40 transition hover:bg-violet-700"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
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
  badge,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: "ready" | "needs-work";
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
            {badge === "ready" && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Ready</span>
            )}
            {badge === "needs-work" && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Needs info</span>
            )}
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
