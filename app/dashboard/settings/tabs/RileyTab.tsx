"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  Mail,
  MessageSquare,
  Plus,
  Power,
  Send,
  Shield,
  Star,
  Trash2,
  X,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../../DashboardContext";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuInput, NeuTextarea } from "@/components/dashboard/settings/NeuInput";
import { NeuToggle } from "@/components/dashboard/settings/NeuToggle";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

// ------- Types -------

interface ChatbotConfigState {
  greeting_message: string;
  owner_name: string;
  offers_free_inspection: boolean;
  materials_brands: string;
  process_steps: string;
  does_insurance_work: boolean;
  insurance_description: string;
  financing_provider: string;
  warranty_description: string;
  emergency_available: boolean;
  emergency_description: string;
  custom_faqs: Array<{ q: string; a: string }>;
  differentiators: string;
  team_description: string;
  payment_methods: string[];
  referral_program: string;
}

const EMPTY_CONFIG: ChatbotConfigState = {
  greeting_message: "",
  owner_name: "",
  offers_free_inspection: false,
  materials_brands: "",
  process_steps: "",
  does_insurance_work: false,
  insurance_description: "",
  financing_provider: "",
  warranty_description: "",
  emergency_available: false,
  emergency_description: "",
  custom_faqs: [],
  differentiators: "",
  team_description: "",
  payment_methods: [],
  referral_program: "",
};

const PAYMENT_OPTIONS = [
  "Cash",
  "Check",
  "Credit Card",
  "Financing",
  "ACH / Bank Transfer",
  "Zelle",
  "Venmo",
] as const;

const MIN_CORE_FIELDS_TO_ENABLE = 2;
const MAX_TEXT_LENGTH = 500;
const MAX_FAQ_COUNT = 25;

// ------- Helpers -------

function countCoreFields(c: ChatbotConfigState): number {
  let n = 0;
  if (c.materials_brands.trim()) n++;
  if (c.process_steps.trim()) n++;
  return n;
}

function countFilledFields(c: ChatbotConfigState): number {
  let n = countCoreFields(c);
  if (c.offers_free_inspection) n++;
  if (c.does_insurance_work && c.insurance_description.trim()) n++;
  if (c.financing_provider.trim()) n++;
  if (c.warranty_description.trim()) n++;
  if (c.emergency_available && c.emergency_description.trim()) n++;
  if (c.custom_faqs.some((f) => f.q.trim() && f.a.trim())) n++;
  if (c.differentiators.trim()) n++;
  if (c.team_description.trim()) n++;
  if (c.payment_methods.length > 0) n++;
  if (c.referral_program.trim()) n++;
  return n;
}

function getRelevantFieldCount(c: ChatbotConfigState): number {
  let total = 2; // core: materials + process
  total++; // free inspection
  if (c.does_insurance_work) total++;
  total++; // financing
  total++; // warranty
  if (c.emergency_available) total++;
  total += 5; // FAQs, differentiators, team, payment, referral
  return total;
}

function normalizeFromDb(data: Record<string, unknown>): ChatbotConfigState {
  return {
    greeting_message: (data.greeting_message as string) ?? "",
    owner_name: (data.owner_name as string) ?? "",
    offers_free_inspection: (data.offers_free_inspection as boolean) ?? false,
    materials_brands: Array.isArray(data.materials_brands) ? (data.materials_brands as string[]).join(", ") : "",
    process_steps: (data.process_steps as string) ?? "",
    does_insurance_work: (data.does_insurance_work as boolean) ?? false,
    insurance_description: (data.insurance_description as string) ?? "",
    financing_provider: (data.financing_provider as string) ?? "",
    warranty_description: (data.warranty_description as string) ?? "",
    emergency_available: (data.emergency_available as boolean) ?? false,
    emergency_description: (data.emergency_description as string) ?? "",
    custom_faqs: Array.isArray(data.custom_faqs) ? (data.custom_faqs as Array<{ q: string; a: string }>) : [],
    differentiators: (data.differentiators as string) ?? "",
    team_description: (data.team_description as string) ?? "",
    payment_methods: Array.isArray(data.payment_methods) ? (data.payment_methods as string[]) : [],
    referral_program: (data.referral_program as string) ?? "",
  };
}

function prepareForDb(c: ChatbotConfigState) {
  return {
    greeting_message: c.greeting_message.trim() || null,
    owner_name: c.owner_name.trim() || null,
    offers_free_inspection: c.offers_free_inspection,
    materials_brands: c.materials_brands.trim()
      ? c.materials_brands.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    process_steps: c.process_steps.trim() || null,
    does_insurance_work: c.does_insurance_work,
    insurance_description: c.insurance_description.trim() || null,
    financing_provider: c.financing_provider.trim() || null,
    warranty_description: c.warranty_description.trim() || null,
    emergency_available: c.emergency_available,
    emergency_description: c.emergency_description.trim() || null,
    custom_faqs: c.custom_faqs.filter((f) => f.q.trim() || f.a.trim()),
    differentiators: c.differentiators.trim() || null,
    team_description: c.team_description.trim() || null,
    payment_methods: c.payment_methods.length > 0 ? c.payment_methods : null,
    referral_program: c.referral_program.trim() || null,
  };
}

// ------- Main Tab -------

export function RileyTab() {
  const { contractorId, tier, businessName } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ChatbotConfigState>(EMPTY_CONFIG);
  const [isEnabled, setIsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [openSection, setOpenSection] = useState<number | null>(1);
  const [showTest, setShowTest] = useState(false);
  const [showEmbedDetails, setShowEmbedDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!contractorId) return;
    (async () => {
      const [cfgRes, contrRes] = await Promise.all([
        supabase.from("chatbot_config").select("*").eq("contractor_id", contractorId).maybeSingle(),
        supabase.from("contractors").select("has_ai_chatbot").eq("id", contractorId).single(),
      ]);
      if (cfgRes.data) setConfig(normalizeFromDb(cfgRes.data));
      if (contrRes.data) setIsEnabled(contrRes.data.has_ai_chatbot || false);
      setLoading(false);
    })();
  }, [contractorId]);

  const update = useCallback(
    <K extends keyof ChatbotConfigState>(key: K, value: ChatbotConfigState[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setErr("");
    const { error } = await supabase
      .from("chatbot_config")
      .upsert(
        { contractor_id: contractorId, ...prepareForDb(config), updated_at: new Date().toISOString() },
        { onConflict: "contractor_id" }
      );
    setSaving(false);
    if (error) setErr("Failed to save. Try again.");
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleToggleEnabled(next: boolean) {
    if (!contractorId) return;
    if (next && countCoreFields(config) < MIN_CORE_FIELDS_TO_ENABLE) {
      setErr(`Fill ${MIN_CORE_FIELDS_TO_ENABLE} core fields before turning Riley on.`);
      setTimeout(() => setErr(""), 4000);
      return;
    }
    const { error } = await supabase
      .from("contractors")
      .update({ has_ai_chatbot: next })
      .eq("id", contractorId);
    if (!error) setIsEnabled(next);
  }

  // Tier gate
  if (tier === "free") {
    return (
      <SettingsSection title="Riley — Pro Feature">
        <div className="flex flex-col items-center py-6 text-center gap-4">
          <div className="neu-flat h-14 w-14 flex items-center justify-center" style={{ borderRadius: 14 }}>
            <Bot className="h-7 w-7" style={{ color: "var(--neu-accent)" }} />
          </div>
          <p className="max-w-sm text-[13px] neu-muted">
            Riley is your 24/7 AI assistant — answers homeowner questions, captures leads, and knows your business.
            Included in the $149/mo Pro plan.
          </p>
          <NeuButton
            variant="accent"
            onClick={async () => {
              const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "pro_monthly" }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
          >
            Upgrade to Pro
          </NeuButton>
        </div>
      </SettingsSection>
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-sm neu-muted">Loading Riley…</div>;
  }

  const coreCount = countCoreFields(config);
  const completedCount = countFilledFields(config);
  const relevantTotal = getRelevantFieldCount(config);
  const completionPct = Math.round((completedCount / relevantTotal) * 100);
  const canEnable = coreCount >= MIN_CORE_FIELDS_TO_ENABLE;

  const progressMessage =
    coreCount === 0
      ? "Start with materials and your process — Riley needs the basics."
      : coreCount < MIN_CORE_FIELDS_TO_ENABLE
      ? `${MIN_CORE_FIELDS_TO_ENABLE - coreCount} more core field${MIN_CORE_FIELDS_TO_ENABLE - coreCount > 1 ? "s" : ""} needed before turning Riley on.`
      : completionPct < 60
      ? "Riley has the essentials — she's ready. Add more to make her better."
      : completionPct < 100
      ? "Almost there — custom FAQs make Riley unbeatable."
      : "Riley is fully trained.";

  const progressGradient = "linear-gradient(90deg, #ef4444 0%, #f97316 50%, #f59e0b 100%)";

  const embedCode = `<script src="https://ruufpro.com/riley.js" data-contractor-id="${contractorId}"></script>`;
  const chatPageUrl = `https://ruufpro.com/chat/${contractorId}`;

  return (
    <div className="space-y-5">
      {/* Status card */}
      <SettingsSection
        title="Riley Status"
        description="Turn Riley on once she's trained. Homeowners chat with her on your embed and standalone page."
        action={
          <NeuButton variant="flat" onClick={() => setShowTest(true)}>
            <MessageSquare className="h-4 w-4" />
            Test Riley
          </NeuButton>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold" style={{ color: "var(--neu-text)" }}>
                {isEnabled ? "Riley is live" : canEnable ? "Ready to go live" : "Needs training"}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1"
                style={{
                  borderRadius: 999,
                  color: isEnabled ? "var(--neu-accent)" : "var(--neu-text-muted)",
                  background: "var(--neu-bg)",
                  boxShadow:
                    "inset 1.5px 1.5px 3px var(--neu-inset-dark), inset -1.5px -1.5px 3px var(--neu-inset-light)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: isEnabled ? "var(--neu-accent)" : "var(--neu-text-muted)",
                    boxShadow: isEnabled ? "0 0 6px var(--neu-accent)" : "none",
                  }}
                />
                {isEnabled ? "Live" : "Off"}
              </span>
            </div>
            <p className="text-[12px] neu-muted mt-0.5">{progressMessage}</p>
          </div>
          <NeuToggle checked={isEnabled} onChange={handleToggleEnabled} disabled={!canEnable && !isEnabled} />
        </div>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide neu-muted">Training Progress</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="neu-muted">Core {coreCount}/2</span>
              <span className="font-bold" style={{ color: "var(--neu-accent)" }}>{completionPct}%</span>
            </div>
          </div>
          <div className="neu-inset-deep h-2.5 overflow-hidden" style={{ borderRadius: 999 }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: progressGradient,
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Greeting */}
      <SettingsSection
        title="Greeting Message"
        description="The first thing Riley says. Leave blank for the smart default."
      >
        <NeuTextarea
          rows={2}
          maxLength={200}
          placeholder={`Hi! I'm Riley, an AI assistant for ${businessName || "your business"}. What can I help with?`}
          value={config.greeting_message}
          onChange={(e) => update("greeting_message", e.target.value)}
          hint={`${config.greeting_message.length}/200`}
        />
      </SettingsSection>

      {/* Owner name */}
      <SettingsSection
        title="Owner's First Name"
        description="When set, Riley can reference you by name (e.g. “Mike and the crew”). Leave blank and Riley stays generic (“our team”)."
      >
        <NeuInput
          placeholder="Mike"
          maxLength={40}
          value={config.owner_name}
          onChange={(e) => update("owner_name", e.target.value)}
        />
      </SettingsSection>

      {/* Collapsibles */}
      <CollapsibleNeu
        number={1}
        title="Services & Process"
        subtitle="Core fields — Riley needs these"
        icon={<DollarSign className="h-4 w-4" />}
        open={openSection === 1}
        onToggle={() => setOpenSection(openSection === 1 ? null : 1)}
        badge={coreCount >= MIN_CORE_FIELDS_TO_ENABLE ? "ready" : "needs-work"}
      >
        <div className="space-y-4">
          <NeuToggle
            checked={config.offers_free_inspection}
            onChange={(v) => update("offers_free_inspection", v)}
            label="Do you offer free inspections?"
          />

          <NeuInput
            label="Brands you install or are certified in"
            hint="Separate with commas. Riley references these when homeowners ask about materials."
            placeholder="GAF Timberline HDZ, Owens Corning Duration"
            value={config.materials_brands}
            onChange={(e) => update("materials_brands", e.target.value)}
          />

          <NeuTextarea
            label="Your roofing process"
            rows={3}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="1. Free on-site inspection  2. Detailed written estimate  3. Material selection & scheduling  4. Tear-off and installation  5. Full-site cleanup & magnet sweep  6. Final walkthrough with the owner"
            value={config.process_steps}
            onChange={(e) => update("process_steps", e.target.value)}
            hint={`${config.process_steps.length}/${MAX_TEXT_LENGTH}`}
          />

          <div
            className="neu-inset px-3.5 py-3 text-[11px] leading-relaxed"
            style={{ color: "var(--neu-text-muted)", borderRadius: 10 }}
          >
            <strong style={{ color: "var(--neu-text)" }}>Why no pricing or timeline fields?</strong>
            {" "}Any specific number Riley states can legally bind us as a quote. Riley is trained to always redirect pricing and timeline questions to a free inspection — which protects you and wins more jobs.
          </div>
        </div>
      </CollapsibleNeu>

      <CollapsibleNeu
        number={2}
        title="Insurance & Financing"
        subtitle="High-value trust builders"
        icon={<Shield className="h-4 w-4" />}
        open={openSection === 2}
        onToggle={() => setOpenSection(openSection === 2 ? null : 2)}
      >
        <div className="space-y-4">
          <NeuToggle
            checked={config.does_insurance_work}
            onChange={(v) => update("does_insurance_work", v)}
            label="Do you work with insurance companies?"
          />
          {config.does_insurance_work && (
            <NeuTextarea
              label="Insurance process"
              rows={2}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="We handle the entire claim — meet the adjuster, document damage, fight for full coverage."
              value={config.insurance_description}
              onChange={(e) => update("insurance_description", e.target.value)}
              hint={`${config.insurance_description.length}/${MAX_TEXT_LENGTH}`}
            />
          )}

          <NeuInput
            label="Financing provider"
            hint="Riley will mention the provider and direct homeowners to your team for current rates and terms."
            placeholder="Acorn Finance, GreenSky, Hearth"
            value={config.financing_provider}
            onChange={(e) => update("financing_provider", e.target.value)}
          />
          <NeuTextarea
            label="Warranty details"
            rows={2}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="10-year workmanship + 50-year GAF manufacturer warranty"
            value={config.warranty_description}
            onChange={(e) => update("warranty_description", e.target.value)}
            hint={`${config.warranty_description.length}/${MAX_TEXT_LENGTH}`}
          />

          <NeuToggle
            checked={config.emergency_available}
            onChange={(v) => update("emergency_available", v)}
            label="Do you offer emergency roofing services?"
          />
          {config.emergency_available && (
            <NeuInput
              label="Emergency service details"
              placeholder="24/7 tarping and board-up for active leaks"
              value={config.emergency_description}
              onChange={(e) => update("emergency_description", e.target.value)}
            />
          )}
        </div>
      </CollapsibleNeu>

      <CollapsibleNeu
        number={3}
        title="What Makes You Different"
        subtitle="The details that lock in customers"
        icon={<Star className="h-4 w-4" />}
        open={openSection === 3}
        onToggle={() => setOpenSection(openSection === 3 ? null : 3)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide neu-muted">
              Custom FAQs
            </label>
            <p className="mb-3 text-[11px] neu-muted">Questions homeowners ask + your best answers</p>
            <div className="space-y-3">
              {config.custom_faqs.map((faq, i) => (
                <div key={i} className="neu-inset p-3 space-y-2">
                  <NeuInput
                    placeholder="Question"
                    maxLength={200}
                    value={faq.q}
                    onChange={(e) => {
                      const next = [...config.custom_faqs];
                      next[i] = { ...faq, q: e.target.value };
                      update("custom_faqs", next);
                    }}
                  />
                  <NeuTextarea
                    rows={2}
                    maxLength={MAX_TEXT_LENGTH}
                    placeholder="Answer"
                    value={faq.a}
                    onChange={(e) => {
                      const next = [...config.custom_faqs];
                      next[i] = { ...faq, a: e.target.value };
                      update("custom_faqs", next);
                    }}
                  />
                  <button
                    onClick={() => update("custom_faqs", config.custom_faqs.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:opacity-80"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
            {config.custom_faqs.length < MAX_FAQ_COUNT ? (
              <NeuButton
                variant="flat"
                onClick={() => update("custom_faqs", [...config.custom_faqs, { q: "", a: "" }])}
                className="mt-3"
              >
                <Plus className="h-4 w-4" />
                Add FAQ ({config.custom_faqs.length}/{MAX_FAQ_COUNT})
              </NeuButton>
            ) : (
              <p className="mt-3 text-[11px] neu-muted">Max {MAX_FAQ_COUNT} FAQs reached</p>
            )}
          </div>

          <NeuTextarea
            label="What sets you apart?"
            rows={2}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Family-owned 15 years, same crew every job, only roofer in Tampa with in-house sheet metal"
            value={config.differentiators}
            onChange={(e) => update("differentiators", e.target.value)}
            hint={`${config.differentiators.length}/${MAX_TEXT_LENGTH}`}
          />
          <NeuTextarea
            label="About your team"
            rows={2}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Locally owned. Same crew on every job — no subs, no surprises. You'll meet the owner at your inspection."
            value={config.team_description}
            onChange={(e) => update("team_description", e.target.value)}
            hint={`${config.team_description.length}/${MAX_TEXT_LENGTH}`}
          />

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide neu-muted">
              Payment methods you accept
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const active = config.payment_methods.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      update(
                        "payment_methods",
                        active
                          ? config.payment_methods.filter((m) => m !== opt)
                          : [...config.payment_methods, opt]
                      )
                    }
                    className={`px-3 py-1.5 text-[12px] font-semibold transition ${
                      active ? "neu-inset-deep" : "neu-flat hover:opacity-90"
                    }`}
                    style={{
                      borderRadius: 999,
                      color: active ? "var(--neu-accent)" : "var(--neu-text-muted)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <NeuInput
            label="Referral program"
            placeholder="$250 gift card for every neighbor referral that signs"
            value={config.referral_program}
            onChange={(e) => update("referral_program", e.target.value)}
          />
        </div>
      </CollapsibleNeu>

      {/* Standalone page */}
      <SettingsSection
        title="Standalone Chat Page"
        description="Your ready-to-share Riley link. Great for QR codes, business cards, and texts."
      >
        <div className="flex items-center justify-between gap-3">
          <code
            className="neu-inset-deep flex-1 truncate px-3 py-2.5 text-[13px] font-mono"
            style={{ color: "var(--neu-text)" }}
          >
            {chatPageUrl}
          </code>
          <a
            href={chatPageUrl}
            target="_blank"
            rel="noreferrer"
            className="neu-flat inline-flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold hover:opacity-90"
            style={{ borderRadius: 12, color: "var(--neu-text)" }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
        </div>
      </SettingsSection>

      {/* Embed */}
      <SettingsSection
        title="Add Riley to Your Website"
        description="Riley already works on your RuufPro site. To add to an external site too:"
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              const subject = encodeURIComponent("Add Riley AI chatbot to our website");
              const body = encodeURIComponent(
                `Hi,\n\nPlease add this one line of code to our website, right before the </body> tag:\n\n${embedCode}\n\nThis adds our AI chatbot (Riley) that answers customer questions 24/7.\n\nWordPress: Install "Insert Headers and Footers" plugin → paste in Footer.\nWix: Settings → Custom Code → paste in Footer.\nSquarespace: Settings → Advanced → Code Injection → Footer.\n\nThanks!`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="neu-flat w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-95"
            style={{ borderRadius: 12 }}
          >
            <Mail className="h-5 w-5 neu-muted" />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                Email instructions to your web person
              </div>
              <div className="text-[11px] neu-muted">Pre-written email with code + platform instructions</div>
            </div>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(embedCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="neu-flat w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-95"
            style={{ borderRadius: 12 }}
          >
            <Copy className="h-5 w-5 neu-muted" />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                {copied ? "Copied!" : "Copy the embed code"}
              </div>
              <div className="text-[11px] neu-muted">If you can edit your site&apos;s HTML</div>
            </div>
          </button>

          <button
            onClick={() => setShowEmbedDetails(!showEmbedDetails)}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold neu-muted hover:opacity-80"
          >
            {showEmbedDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showEmbedDetails ? "Hide" : "Show"} platform instructions &amp; code
          </button>

          {showEmbedDetails && (
            <div className="neu-inset p-4 space-y-3 text-[11px]" style={{ color: "var(--neu-text-muted)" }}>
              <p><strong>WordPress:</strong> Install &quot;Insert Headers and Footers&quot; plugin → paste in Footer.</p>
              <p><strong>Wix:</strong> Settings → Custom Code → paste in Footer.</p>
              <p><strong>Squarespace:</strong> Settings → Advanced → Code Injection → Footer.</p>
              <p><strong>Other:</strong> Paste before the &lt;/body&gt; tag.</p>
              <code className="neu-inset-deep block px-3 py-2 text-[11px] font-mono break-all" style={{ color: "var(--neu-text)" }}>
                {embedCode}
              </code>
            </div>
          )}
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
              <Check className="h-4 w-4" /> Saved — Riley updated
            </span>
          ) : (
            "Changes take effect on new conversations."
          )}
        </div>
        <NeuButton variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </NeuButton>
      </div>

      {/* Test modal */}
      {showTest && contractorId && (
        <TestRileyModal
          contractorId={contractorId}
          businessName={businessName || "Your Business"}
          onClose={() => setShowTest(false)}
        />
      )}
    </div>
  );
}

// ------- Collapsible (neu-styled) -------

function CollapsibleNeu({
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
    <section className="neu-raised overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition hover:opacity-95"
      >
        <div
          className="neu-flat h-9 w-9 flex items-center justify-center flex-shrink-0"
          style={{ borderRadius: 12, color: "var(--neu-accent)" }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="neu-inset text-[10px] font-bold px-1.5 py-0.5"
              style={{ color: "var(--neu-accent)" }}
            >
              {number}/3
            </span>
            <span className="text-[14px] font-bold" style={{ color: "var(--neu-text)" }}>{title}</span>
            {badge === "ready" && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Ready</span>
            )}
            {badge === "needs-work" && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600">Needs info</span>
            )}
          </div>
          <p className="text-[12px] neu-muted mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 neu-muted" /> : <ChevronDown className="h-4 w-4 neu-muted" />}
      </button>
      {open && (
        <div
          className="px-5 pb-5 pt-4"
          style={{ borderTop: "1px solid var(--neu-border)" }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

// ------- Test Riley Modal -------

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text: `Hi! I'm Riley, an AI assistant for ${businessName}. What can I help with?`,
      },
    ]);
  }, [businessName]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || loading) return;
    if (!preset) setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const sessionId = `${contractorId}-${crypto.randomUUID()}`;
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, parts: [{ type: "text", text: m.text }] })),
        { role: "user" as const, parts: [{ type: "text", text }] },
      ];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, contractorId, sessionId, testMode: true }),
      });
      if (!res.ok) {
        setMessages((p) => [...p, { role: "assistant", text: "Connection error — Riley will work fine in production." }]);
      } else {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let buffer = "";
        setMessages((p) => [...p, { role: "assistant", text: "" }]);
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";
            for (const event of events) {
              const line = event.split("\n").find((l) => l.startsWith("data: "));
              if (!line) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const obj = JSON.parse(payload);
                if (obj.type === "text-delta" && typeof obj.delta === "string") {
                  full += obj.delta;
                  setMessages((p) => {
                    const next = [...p];
                    next[next.length - 1] = { role: "assistant", text: full };
                    return next;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      setMessages((p) => [...p, { role: "assistant", text: "Connection error — but this is only a preview." }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative flex h-[560px] w-[400px] max-h-[85vh] max-w-[95vw] flex-col overflow-hidden"
        style={{
          borderRadius: 18,
          background: "var(--neu-bg)",
          boxShadow: "0 24px 60px -12px rgba(0,0,0,0.35), 0 8px 20px -6px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--neu-border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: "var(--neu-accent)" }}
            >
              R
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--neu-text)" }}>
                Test Riley
              </div>
              <div className="text-[11px] neu-muted">Preview — not visible to homeowners</div>
            </div>
          </div>
          <button onClick={onClose} className="neu-muted hover:opacity-75">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user" ? "text-white" : ""
                }`}
                style={{
                  background: msg.role === "user" ? "var(--neu-accent)" : "var(--neu-bg)",
                  color: msg.role === "user" ? "#fff" : "var(--neu-text)",
                  borderRadius: 14,
                  boxShadow:
                    msg.role === "user"
                      ? "2px 2px 6px var(--neu-shadow-dark)"
                      : "inset 2px 2px 4px var(--neu-inset-dark), inset -2px -2px 4px var(--neu-inset-light)",
                }}
              >
                {msg.text || (loading ? "…" : "")}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 flex gap-1.5 neu-inset"
                style={{ borderRadius: 14 }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full animate-bounce"
                    style={{ background: "var(--neu-text-muted)", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {["How much does a new roof cost?", "Do you offer free inspections?", "My roof is leaking!"].map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="neu-flat px-3 py-1.5 text-[11px] font-medium hover:opacity-90"
                style={{ borderRadius: 999, color: "var(--neu-accent)" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--neu-border)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Riley something…"
            maxLength={2000}
            className="neu-inset-deep flex-1 bg-transparent px-3 py-2 text-[13px] outline-none"
            style={{ color: "var(--neu-text)" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="neu-accent-btn px-3 py-2 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
