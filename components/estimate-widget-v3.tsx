// Estimate Widget V3 — True Apple design language.
// Key differences from V2:
// - Apple blue (#0071e3) for selected states and CTA
// - 2px borders with blue double-border selected effect
// - Step transitions with framer-motion crossfade
// - #1d1d1f text (not pure black), #6e6e73 secondary, #86868b tertiary
// - font-weight 400 on buttons (Apple's actual pattern)
// - Negative letter-spacing on headings
// - active:scale-[0.98] on ALL interactive elements
// - Animated price reveal on results

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Info, Check, Phone } from "lucide-react";

// ----- APPLE COLORS -----
const APPLE = {
  text: "#1d1d1f",
  textSecondary: "#6e6e73",
  textTertiary: "#86868b",
  blue: "#0071e3",
  blueHover: "#0077ed",
  border: "#d2d2d7",
  borderHover: "#86868b",
  separator: "#e8e8ed",
  bgSecondary: "#f5f5f7",
  bgTertiary: "#fbfbfd",
  red: "#ff3b30",
  green: "#34c759",
};

interface EstimateWidgetProps {
  contractorId: string;
  contractorName: string;
  contractorPhone: string;
  accentColor?: string;
}

// ----- STEP DATA -----

const PITCH_OPTIONS = [
  {
    id: "flat", label: "Flat", description: "Nearly level surface",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="30" width="50" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" rx="1" />
        <line x1="10" y1="30" x2="70" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <rect x="35" y="42" width="10" height="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="1" />
        <rect x="20" y="36" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
        <rect x="50" y="36" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "low", label: "Low", description: "Easily walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="35" width="50" height="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" rx="1" />
        <path d="M10 35 L40 22 L70 35" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <rect x="35" y="45" width="10" height="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="1" />
        <rect x="20" y="40" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
        <rect x="50" y="40" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "moderate", label: "Moderate", description: "Not easily walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="38" width="50" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" rx="1" />
        <path d="M10 38 L40 14 L70 38" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <rect x="35" y="46" width="10" height="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="1" />
        <rect x="20" y="43" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
        <rect x="50" y="43" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "steep", label: "Steep", description: "Can't be walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="42" width="50" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" rx="1" />
        <path d="M10 42 L40 8 L70 42" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <rect x="35" y="47" width="10" height="13" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="1" />
        <rect x="20" y="46" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
        <rect x="50" y="46" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" rx="0.5" />
      </svg>
    ),
  },
];

const CURRENT_MATERIALS = [
  { id: "asphalt", label: "Asphalt", description: "Shingle roof", image: "/images/materials/asphalt.jpg" },
  { id: "metal", label: "Metal", description: "Standing seam or corrugated", image: "/images/materials/metal.jpg" },
  { id: "tile", label: "Tile", description: "Clay or concrete", image: "/images/materials/tile.jpg" },
  { id: "cedar", label: "Cedar", description: "Wood shake or shingle", image: "/images/materials/cedar.jpg" },
];

const DESIRED_MATERIALS = [
  { id: "asphalt", label: "Asphalt Shingles", description: "Most popular choice", badge: "Most Popular", image: "/images/materials/asphalt.jpg" },
  { id: "metal", label: "Standing Seam Metal", description: "Durable & long-lasting", badge: null, image: "/images/materials/metal.jpg" },
  { id: "tile", label: "Tile", description: "Premium clay or concrete", badge: null, image: "/images/materials/tile.jpg" },
];

const TIMELINE_OPTIONS = [
  { id: "no_timeline", label: "No rush", description: "Just exploring" },
  { id: "1_3_months", label: "1–3 months", description: "Planning ahead" },
  { id: "now", label: "ASAP", description: "Ready to start" },
];

const FINANCING_OPTIONS = [
  { id: "yes", label: "Yes", description: "Interested in financing" },
  { id: "no", label: "No", description: "Not interested" },
  { id: "maybe", label: "Maybe", description: "Want to learn more" },
];

// ----- STEP TRANSITION -----
const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ----- MAIN WIDGET -----

export default function EstimateWidgetV3({
  contractorId,
  contractorName,
  contractorPhone,
}: EstimateWidgetProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState("");
  const [pitchCategory, setPitchCategory] = useState("");
  const [currentMaterial, setCurrentMaterial] = useState("");
  const [desiredMaterial, setDesiredMaterial] = useState("");
  const [timeline, setTimeline] = useState("");
  const [financing, setFinancing] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToSms, setAgreedToSms] = useState(false);
  const [estimate, setEstimate] = useState<{
    price_low: number; price_high: number; range_display: string;
    detail_display: string; roof_area_sqft: number; pitch_degrees: number; is_satellite: boolean;
  } | null>(null);

  const nextStep = () => { setDirection(1); setStep((s) => s + 1); setError(""); };
  const prevStep = () => { setDirection(-1); setStep((s) => Math.max(1, s - 1)); setError(""); };

  const handleSubmit = async () => {
    if (!agreedToTerms) { setError("Please agree to the Terms of Service."); return; }
    if (!name || !email || !phone) { setError("Please fill in all contact fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId, address, pitch_category: pitchCategory,
          current_material: currentMaterial, material: desiredMaterial,
          shingle_layers: "not_sure", timeline, financing_interest: financing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimate failed");
      setEstimate(data);
      fetch("/api/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId, lead_name: name, lead_email: email,
          lead_phone: phone, lead_address: address,
          estimate_range: data.range_display, material: desiredMaterial,
        }),
      }).catch(() => {});
      const { error: leadErr } = await supabase.from("leads").insert({
        contractor_id: contractorId, name, email, phone, address,
        source: "estimate_widget", estimate_low: data.price_low,
        estimate_high: data.price_high, estimate_material: desiredMaterial,
        estimate_roof_sqft: data.roof_area_sqft,
      });
      if (leadErr) console.error("Lead insert failed:", leadErr);
      setDirection(1); setStep(8);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  const totalSteps = 7;
  const progress = step === 1 || step === 8 ? 0 : ((step - 1) / totalSteps) * 100;

  return (
    <div
      className="mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl bg-white"
      style={{
        boxShadow: `0 0 0 1px ${APPLE.separator}, 0 2px 12px rgba(0,0,0,0.06)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <div className="px-7 pt-7 pb-9">

        {/* Progress bar */}
        {step > 1 && step < 8 && (
          <div className="mb-6">
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: APPLE.separator }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: APPLE.blue }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        )}

        {/* Back button */}
        {step > 1 && step < 8 && (
          <button
            onClick={prevStep}
            className="flex items-center gap-1 text-[14px] mb-5 -ml-0.5 transition-colors duration-300 active:scale-[0.97]"
            style={{ color: APPLE.blue, letterSpacing: "-0.016em" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl px-4 py-3 text-[14px] flex items-start gap-2.5" style={{ background: "#fff2f2", color: APPLE.red }}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Step content with crossfade transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ x: direction > 0 ? undefined : undefined }}
            custom={direction}
          >

        {/* ===== STEP 1: Landing ===== */}
        {step === 1 && (
          <div className="text-center py-8">
            <p className="text-[12px] font-semibold uppercase mb-3" style={{ color: APPLE.textTertiary, letterSpacing: "0.06em" }}>
              {contractorName}
            </p>
            <h1 className="text-[28px] font-semibold mb-3" style={{ color: APPLE.text, letterSpacing: "-0.003em", lineHeight: 1.1 }}>
              Get a free instant estimate
            </h1>
            <p className="text-[17px] max-w-xs mx-auto mb-10" style={{ color: APPLE.textSecondary, letterSpacing: "-0.022em", lineHeight: 1.47 }}>
              Satellite-measured roof data combined with local pricing. Takes about 2 minutes.
            </p>
            <button
              onClick={nextStep}
              className="w-full py-3 rounded-[980px] text-[17px] text-white transition-all duration-300 active:scale-[0.98]"
              style={{ background: APPLE.blue, letterSpacing: "-0.022em", fontWeight: 400, minHeight: 44 }}
              onMouseEnter={(e) => e.currentTarget.style.background = APPLE.blueHover}
              onMouseLeave={(e) => e.currentTarget.style.background = APPLE.blue}
            >
              Get Started
            </button>
          </div>
        )}

        {/* ===== STEP 2: Address ===== */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                What&rsquo;s your address?
              </h2>
              <p className="text-[14px]" style={{ color: APPLE.textSecondary, letterSpacing: "-0.016em" }}>
                We&rsquo;ll use satellite data to measure your roof.
              </p>
            </div>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full px-4 py-3 rounded-xl text-[17px] outline-none transition-all duration-300"
              style={{
                color: APPLE.text,
                background: APPLE.bgSecondary,
                border: `1px solid transparent`,
                letterSpacing: "-0.022em",
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.border = `1px solid ${APPLE.blue}`;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,113,227,0.15)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = APPLE.bgSecondary;
                e.currentTarget.style.border = "1px solid transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            <div className="rounded-xl overflow-hidden h-36 flex items-center justify-center" style={{ background: APPLE.bgSecondary }}>
              <p className="text-[12px]" style={{ color: APPLE.textTertiary }}>Map preview</p>
            </div>

            <button
              onClick={nextStep}
              disabled={address.length < 5}
              className={cn(
                "w-full py-3 rounded-[980px] text-[17px] transition-all duration-300 active:scale-[0.98]",
                address.length < 5 ? "cursor-not-allowed" : ""
              )}
              style={{
                background: address.length < 5 ? APPLE.separator : APPLE.blue,
                color: address.length < 5 ? APPLE.textTertiary : "#fff",
                letterSpacing: "-0.022em", fontWeight: 400, minHeight: 44,
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ===== STEP 3: Roof Pitch ===== */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                How steep is your roof?
              </h2>
              <p className="text-[14px]" style={{ color: APPLE.textSecondary, letterSpacing: "-0.016em" }}>
                Select the closest match.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PITCH_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setPitchCategory(opt.id); nextStep(); }}
                  className="text-left rounded-xl p-4 transition-all duration-300 active:scale-[0.97]"
                  style={{
                    border: `2px solid ${pitchCategory === opt.id ? APPLE.blue : APPLE.border}`,
                    boxShadow: pitchCategory === opt.id ? `0 0 0 1px ${APPLE.blue}` : "none",
                    background: "#fff",
                  }}
                  onMouseEnter={(e) => {
                    if (pitchCategory !== opt.id) e.currentTarget.style.borderColor = APPLE.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    if (pitchCategory !== opt.id) e.currentTarget.style.borderColor = APPLE.border;
                  }}
                >
                  <div style={{ color: APPLE.textTertiary }} className="mb-2">{opt.icon}</div>
                  <p className="text-[14px] font-semibold" style={{ color: APPLE.text }}>{opt.label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: APPLE.textTertiary }}>{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 4: Current Material ===== */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                What&rsquo;s currently on your roof?
              </h2>
              <p className="text-[14px]" style={{ color: APPLE.textSecondary, letterSpacing: "-0.016em" }}>
                Select your current roofing material.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CURRENT_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => { setCurrentMaterial(mat.id); nextStep(); }}
                  className="text-left rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.97]"
                  style={{
                    border: `2px solid ${currentMaterial === mat.id ? APPLE.blue : APPLE.border}`,
                    boxShadow: currentMaterial === mat.id ? `0 0 0 1px ${APPLE.blue}` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (currentMaterial !== mat.id) e.currentTarget.style.borderColor = APPLE.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    if (currentMaterial !== mat.id) e.currentTarget.style.borderColor = APPLE.border;
                  }}
                >
                  <div className="h-20 overflow-hidden" style={{ background: APPLE.bgSecondary }}>
                    <img src={mat.image} alt={mat.label} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[14px] font-semibold" style={{ color: APPLE.text }}>{mat.label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: APPLE.textTertiary }}>{mat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 5: Desired Material ===== */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                What type of roof would you like?
              </h2>
              <p className="text-[14px]" style={{ color: APPLE.textSecondary, letterSpacing: "-0.016em" }}>
                Choose your new roofing material.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {DESIRED_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => { setDesiredMaterial(mat.id); nextStep(); }}
                  className="text-left rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.97]"
                  style={{
                    border: `2px solid ${desiredMaterial === mat.id ? APPLE.blue : APPLE.border}`,
                    boxShadow: desiredMaterial === mat.id ? `0 0 0 1px ${APPLE.blue}` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (desiredMaterial !== mat.id) e.currentTarget.style.borderColor = APPLE.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    if (desiredMaterial !== mat.id) e.currentTarget.style.borderColor = APPLE.border;
                  }}
                >
                  <div className="h-16 overflow-hidden relative" style={{ background: APPLE.bgSecondary }}>
                    <img src={mat.image} alt={mat.label} className="w-full h-full object-cover" />
                    {mat.badge && (
                      <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: APPLE.text, backdropFilter: "blur(8px)" }}>
                        {mat.badge}
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[12px] font-semibold" style={{ color: APPLE.text }}>{mat.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: APPLE.textTertiary }}>{mat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 6: Timeline + Financing ===== */}
        {step === 6 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                When would you like to start?
              </h2>
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                {TIMELINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTimeline(opt.id)}
                    className="text-left rounded-xl px-3.5 py-3 transition-all duration-300 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${timeline === opt.id ? APPLE.blue : APPLE.border}`,
                      boxShadow: timeline === opt.id ? `0 0 0 1px ${APPLE.blue}` : "none",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => {
                      if (timeline !== opt.id) e.currentTarget.style.borderColor = APPLE.borderHover;
                    }}
                    onMouseLeave={(e) => {
                      if (timeline !== opt.id) e.currentTarget.style.borderColor = APPLE.border;
                    }}
                  >
                    <p className="text-[14px] font-semibold" style={{ color: APPLE.text }}>{opt.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: APPLE.textTertiary }}>{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "-0.022em" }}>
                Interested in financing?
              </h3>
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                {FINANCING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFinancing(opt.id)}
                    className="text-left rounded-xl px-3.5 py-3 transition-all duration-300 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${financing === opt.id ? APPLE.blue : APPLE.border}`,
                      boxShadow: financing === opt.id ? `0 0 0 1px ${APPLE.blue}` : "none",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => {
                      if (financing !== opt.id) e.currentTarget.style.borderColor = APPLE.borderHover;
                    }}
                    onMouseLeave={(e) => {
                      if (financing !== opt.id) e.currentTarget.style.borderColor = APPLE.border;
                    }}
                  >
                    <p className="text-[14px] font-semibold" style={{ color: APPLE.text }}>{opt.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: APPLE.textTertiary }}>{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!timeline || !financing}
              className="w-full py-3 rounded-[980px] text-[17px] transition-all duration-300 active:scale-[0.98]"
              style={{
                background: !timeline || !financing ? APPLE.separator : APPLE.blue,
                color: !timeline || !financing ? APPLE.textTertiary : "#fff",
                letterSpacing: "-0.022em", fontWeight: 400, minHeight: 44,
                cursor: !timeline || !financing ? "not-allowed" : "pointer",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ===== STEP 7: Contact Info ===== */}
        {step === 7 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: APPLE.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                Where should we send your estimate?
              </h2>
              <p className="text-[14px]" style={{ color: APPLE.textSecondary, letterSpacing: "-0.016em" }}>
                We&rsquo;ll never share your information.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { value: name, set: setName, placeholder: "Full name", type: "text" },
                { value: email, set: setEmail, placeholder: "Email address", type: "email" },
                { value: phone, set: setPhone, placeholder: "Phone number", type: "tel" },
              ].map((field) => (
                <input
                  key={field.placeholder}
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl text-[17px] outline-none transition-all duration-300"
                  style={{
                    color: APPLE.text,
                    background: APPLE.bgSecondary,
                    border: "1px solid transparent",
                    letterSpacing: "-0.022em",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.border = `1px solid ${APPLE.blue}`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,113,227,0.15)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = APPLE.bgSecondary;
                    e.currentTarget.style.border = "1px solid transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0071e3]"
                />
                <span className="text-[12px] leading-relaxed" style={{ color: APPLE.textSecondary }}>
                  I agree to the{" "}
                  <a href="#" style={{ color: APPLE.blue }} className="hover:underline">Terms of Service</a> and{" "}
                  <a href="#" style={{ color: APPLE.blue }} className="hover:underline">Privacy Policy</a>
                  <span style={{ color: APPLE.red }} className="ml-0.5">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToSms}
                  onChange={(e) => setAgreedToSms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0071e3]"
                />
                <span className="text-[11px] leading-relaxed" style={{ color: APPLE.textTertiary }}>
                  I consent to receive SMS messages from {contractorName}. Msg & data rates may apply. Reply STOP to unsubscribe.
                </span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !name || !email || !phone || !agreedToTerms}
              className="w-full py-3 rounded-[980px] text-[17px] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: loading || !name || !email || !phone || !agreedToTerms ? APPLE.separator : APPLE.blue,
                color: loading || !name || !email || !phone || !agreedToTerms ? APPLE.textTertiary : "#fff",
                letterSpacing: "-0.022em", fontWeight: 400, minHeight: 44,
                cursor: loading || !name || !email || !phone || !agreedToTerms ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Get my estimate"
              )}
            </button>
          </div>
        )}

        {/* ===== STEP 8: Results ===== */}
        {step === 8 && estimate && (
          <div className="space-y-6 py-2">
            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase mb-6" style={{ color: APPLE.textTertiary, letterSpacing: "0.06em" }}>
                {estimate.is_satellite ? "Satellite-Measured" : "Estimated"} Roof Analysis
              </p>

              <p className="text-[12px] font-semibold uppercase mb-3" style={{ color: APPLE.textSecondary, letterSpacing: "0.04em" }}>
                Ballpark Estimate
              </p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
                className="mb-3"
              >
                <span className="text-[44px] md:text-[52px] font-semibold" style={{ color: APPLE.text, letterSpacing: "-0.003em", lineHeight: 1.08 }}>
                  {estimate.range_display}
                </span>
              </motion.div>

              <p className="text-[17px]" style={{ color: APPLE.textSecondary, letterSpacing: "-0.022em" }}>
                for {DESIRED_MATERIALS.find((m) => m.id === desiredMaterial)?.label || desiredMaterial}
              </p>
              <p className="text-[12px] mt-1" style={{ color: APPLE.textTertiary }}>
                {estimate.detail_display}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl px-4 py-3.5 flex gap-3" style={{ background: APPLE.bgSecondary }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: APPLE.textTertiary }} />
              <p className="text-[12px] leading-relaxed" style={{ color: APPLE.textSecondary }}>
                <strong style={{ color: APPLE.text }}>Note:</strong> This is a ballpark estimate,
                not a final quote. Actual price depends on roof condition, access, and
                other factors assessed during a free inspection.
              </p>
            </div>

            <div className="pt-2 space-y-3" style={{ borderTop: `1px solid ${APPLE.separator}` }}>
              <p className="text-center text-[17px] font-semibold pt-3 mb-4" style={{ color: APPLE.text }}>
                Want your exact price?
              </p>

              <a
                href={`tel:${contractorPhone.replace(/\D/g, "")}`}
                className="w-full py-3 rounded-[980px] text-[17px] text-white flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
                style={{ background: APPLE.blue, fontWeight: 400, minHeight: 44 }}
              >
                <Phone className="w-4 h-4" />
                Schedule Free Inspection
              </a>

              <button
                onClick={async () => {
                  const res = await fetch("/api/report", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contractor_id: contractorId, homeowner_name: name, homeowner_address: address,
                      roof_area_sqft: estimate?.roof_area_sqft, pitch_degrees: estimate?.pitch_degrees,
                      material: desiredMaterial, price_low: estimate?.price_low,
                      price_high: estimate?.price_high, is_satellite: estimate?.is_satellite,
                    }),
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `RuufPro-Estimate-${name}.pdf`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-3 rounded-[980px] text-[17px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
                style={{
                  border: `1px solid ${APPLE.border}`, color: APPLE.blue,
                  fontWeight: 400, minHeight: 44, background: "transparent",
                }}
              >
                <Download className="w-4 h-4" />
                Download Estimate PDF
              </button>
            </div>

            <div className="flex items-center justify-center gap-5 text-[12px]" style={{ color: APPLE.textTertiary }}>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" style={{ color: APPLE.green }} />
                Free Inspection
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" style={{ color: APPLE.green }} />
                No Obligation
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" style={{ color: APPLE.green }} />
                Licensed & Insured
              </span>
            </div>

            <p className="text-center text-[12px]" style={{ color: APPLE.textTertiary }}>
              Powered by{" "}
              <a href="https://ruufpro.com" style={{ color: APPLE.blue }} className="hover:underline">
                RuufPro
              </a>
            </p>
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
