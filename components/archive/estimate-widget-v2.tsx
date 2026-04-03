// Estimate Widget V2 — Apple-inspired clean redesign.
// Same 8-step flow and logic as V1, restyled with minimal, neutral UI.
//
// Changes from V1:
// - FlowButton → clean pill buttons with subtle hover
// - AnimatedCard selection → compact radio-style option cards
// - Softer borders, lighter touch, more whitespace
// - Apple checkout flow energy: quiet, confident, focused

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, ChevronRight, Download, Info, Check, Phone } from "lucide-react";

interface EstimateWidgetProps {
  contractorId: string;
  contractorName: string;
  contractorPhone: string;
  accentColor?: string;
}

// ----- STEP DATA (same as V1) -----

const PITCH_OPTIONS = [
  {
    id: "flat",
    label: "Flat",
    description: "Nearly level surface",
    icon: (
      <svg viewBox="0 0 80 70" className="w-16 h-11">
        <rect x="15" y="30" width="50" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <line x1="10" y1="30" x2="70" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <rect x="35" y="42" width="10" height="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="36" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="36" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "low",
    label: "Low",
    description: "Easily walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-16 h-11">
        <rect x="15" y="35" width="50" height="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <path d="M10 35 L40 22 L70 35" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <rect x="35" y="45" width="10" height="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="40" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="40" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "moderate",
    label: "Moderate",
    description: "Not easily walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-16 h-11">
        <rect x="15" y="38" width="50" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <path d="M10 38 L40 14 L70 38" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <rect x="35" y="46" width="10" height="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="43" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="43" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "steep",
    label: "Steep",
    description: "Can't be walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-16 h-11">
        <rect x="15" y="42" width="50" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <path d="M10 42 L40 8 L70 42" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <rect x="35" y="47" width="10" height="13" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="46" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="46" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
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

// ----- REUSABLE UI PIECES -----

function ContinueButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-3 rounded-full text-[15px] font-medium transition-all duration-200 flex items-center justify-center gap-2",
        disabled
          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
          : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
      )}
    >
      {children}
    </button>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-4 transition-all duration-200",
        selected
          ? "border-gray-900 bg-gray-50 shadow-sm"
          : "border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50/50",
        className
      )}
    >
      {children}
    </button>
  );
}

function ImageOptionCard({
  selected,
  onClick,
  image,
  label,
  description,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  image: string;
  label: string;
  description: string;
  badge?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border overflow-hidden transition-all duration-200",
        selected
          ? "border-gray-900 bg-gray-50 shadow-sm"
          : "border-gray-150 bg-white hover:border-gray-300"
      )}
    >
      <div className="h-20 overflow-hidden relative bg-gray-100">
        <img src={image} alt={label} className="w-full h-full object-cover" />
        {badge && (
          <span className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function CompactOptionCard({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border px-4 py-3 transition-all duration-200",
        selected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50/50"
      )}
    >
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
    </button>
  );
}

// ----- MAIN WIDGET -----

export default function EstimateWidgetV2({
  contractorId,
  contractorName,
  contractorPhone,
}: EstimateWidgetProps) {
  const [step, setStep] = useState(1);
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
    price_low: number;
    price_high: number;
    range_display: string;
    detail_display: string;
    roof_area_sqft: number;
    pitch_degrees: number;
    is_satellite: boolean;
  } | null>(null);

  const nextStep = () => { setStep((s) => s + 1); setError(""); };
  const prevStep = () => { setStep((s) => Math.max(1, s - 1)); setError(""); };

  const handleSubmit = async () => {
    if (!agreedToTerms) { setError("Please agree to the Terms of Service."); return; }
    if (!name || !email || !phone) { setError("Please fill in all contact fields."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId,
          address,
          pitch_category: pitchCategory,
          current_material: currentMaterial,
          material: desiredMaterial,
          shingle_layers: "not_sure",
          timeline,
          financing_interest: financing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimate failed");
      setEstimate(data);

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId,
          lead_name: name,
          lead_email: email,
          lead_phone: phone,
          lead_address: address,
          estimate_range: data.range_display,
          material: desiredMaterial,
        }),
      }).catch(() => {});

      const { error: leadErr } = await supabase.from("leads").insert({
        contractor_id: contractorId,
        name, email, phone, address,
        source: "estimate_widget",
        estimate_low: data.price_low,
        estimate_high: data.price_high,
        estimate_material: desiredMaterial,
        estimate_roof_sqft: data.roof_area_sqft,
        sms_consent: agreedToSms,
      });
      if (leadErr) console.error("Lead insert failed:", leadErr);

      setStep(8);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 7;
  const progress = step === 1 || step === 8 ? 0 : ((step - 1) / totalSteps) * 100;

  return (
    <div className="mx-auto w-full max-w-[480px] rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-6 pt-6 pb-8 md:px-8 md:pt-8 md:pb-10">

        {/* Progress bar */}
        {step > 1 && step < 8 && (
          <div className="mb-6">
            <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Back button */}
        {step > 1 && step < 8 && (
          <button
            onClick={prevStep}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-5 -ml-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* ===== STEP 1: Landing ===== */}
        {step === 1 && (
          <div className="text-center py-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              {contractorName}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              Get a free instant estimate
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto mb-8">
              Satellite-measured roof data combined with local pricing.
              Takes about 2 minutes.
            </p>
            <ContinueButton onClick={nextStep} disabled={false}>
              Get Started
              <ChevronRight className="w-4 h-4" />
            </ContinueButton>
          </div>
        )}

        {/* ===== STEP 2: Address ===== */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                What&rsquo;s your address?
              </h2>
              <p className="text-sm text-gray-400">
                We&rsquo;ll use satellite data to measure your roof.
              </p>
            </div>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-[15px] placeholder-gray-300 focus:border-gray-400 focus:ring-0 focus:outline-none transition-colors bg-gray-50/50"
            />

            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-40 flex items-center justify-center">
              <p className="text-xs text-gray-300">Map preview</p>
            </div>

            <ContinueButton onClick={nextStep} disabled={address.length < 5}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </ContinueButton>
          </div>
        )}

        {/* ===== STEP 3: Roof Pitch ===== */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                How steep is your roof?
              </h2>
              <p className="text-sm text-gray-400">Select the closest match.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PITCH_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.id}
                  selected={pitchCategory === opt.id}
                  onClick={() => { setPitchCategory(opt.id); nextStep(); }}
                >
                  <div className="text-gray-300 mb-2">{opt.icon}</div>
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{opt.description}</p>
                </OptionCard>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 4: Current Material ===== */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                What&rsquo;s currently on your roof?
              </h2>
              <p className="text-sm text-gray-400">Select your current roofing material.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CURRENT_MATERIALS.map((mat) => (
                <ImageOptionCard
                  key={mat.id}
                  selected={currentMaterial === mat.id}
                  onClick={() => { setCurrentMaterial(mat.id); nextStep(); }}
                  image={mat.image}
                  label={mat.label}
                  description={mat.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 5: Desired Material ===== */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                What type of roof would you like?
              </h2>
              <p className="text-sm text-gray-400">Choose your new roofing material.</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {DESIRED_MATERIALS.map((mat) => (
                <ImageOptionCard
                  key={mat.id}
                  selected={desiredMaterial === mat.id}
                  onClick={() => { setDesiredMaterial(mat.id); nextStep(); }}
                  image={mat.image}
                  label={mat.label}
                  description={mat.description}
                  badge={mat.badge}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 6: Timeline + Financing ===== */}
        {step === 6 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                When would you like to start?
              </h2>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {TIMELINE_OPTIONS.map((opt) => (
                  <CompactOptionCard
                    key={opt.id}
                    selected={timeline === opt.id}
                    onClick={() => setTimeline(opt.id)}
                    label={opt.label}
                    description={opt.description}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Interested in financing?
              </h3>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {FINANCING_OPTIONS.map((opt) => (
                  <CompactOptionCard
                    key={opt.id}
                    selected={financing === opt.id}
                    onClick={() => setFinancing(opt.id)}
                    label={opt.label}
                    description={opt.description}
                  />
                ))}
              </div>
            </div>

            <ContinueButton onClick={nextStep} disabled={!timeline || !financing}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </ContinueButton>
          </div>
        )}

        {/* ===== STEP 7: Contact Info ===== */}
        {step === 7 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Where should we send your estimate?
              </h2>
              <p className="text-sm text-gray-400">We&rsquo;ll never share your info.</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-[15px] placeholder-gray-300 focus:border-gray-400 focus:ring-0 focus:outline-none transition-colors bg-gray-50/50"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-[15px] placeholder-gray-300 focus:border-gray-400 focus:ring-0 focus:outline-none transition-colors bg-gray-50/50"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-[15px] placeholder-gray-300 focus:border-gray-400 focus:ring-0 focus:outline-none transition-colors bg-gray-50/50"
              />
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-500 transition-colors">
                  I agree to the{" "}
                  <a href="#" className="text-gray-600 underline underline-offset-2">Terms of Service</a> and{" "}
                  <a href="#" className="text-gray-600 underline underline-offset-2">Privacy Policy</a>
                  <span className="text-red-400 ml-0.5">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToSms}
                  onChange={(e) => setAgreedToSms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[11px] text-gray-400 leading-relaxed group-hover:text-gray-500 transition-colors">
                  I consent to receive SMS messages from {contractorName}. Msg & data rates may apply. Reply STOP to unsubscribe.
                </span>
              </label>
            </div>

            <ContinueButton
              onClick={handleSubmit}
              disabled={loading || !name || !email || !phone || !agreedToTerms}
            >
              {loading ? "Calculating..." : "Get my estimate"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </ContinueButton>
          </div>
        )}

        {/* ===== STEP 8: Results ===== */}
        {step === 8 && estimate && (
          <div className="space-y-6 py-2">
            <div className="text-center">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-5">
                {estimate.is_satellite ? "Satellite-Measured" : "Estimated"} Roof Analysis
              </p>

              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Ballpark Estimate
              </p>

              <div className="mb-3">
                <span className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                  {estimate.range_display}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                for {DESIRED_MATERIALS.find((m) => m.id === desiredMaterial)?.label || desiredMaterial}
              </p>
              <p className="text-xs text-gray-300">
                {estimate.detail_display}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl bg-gray-50 px-4 py-3.5 flex gap-3">
              <Info className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-500">Note:</strong> This is a ballpark estimate,
                not a final quote. Actual price depends on roof condition, access, and
                other factors assessed during a free inspection.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-3">
              <p className="text-center text-sm font-medium text-gray-900 mb-4">
                Want your exact price?
              </p>

              <a
                href={`tel:${contractorPhone.replace(/\D/g, "")}`}
                className="w-full py-3 rounded-full bg-gray-900 text-white text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all duration-200"
              >
                <Phone className="w-4 h-4" />
                Schedule Free Inspection
              </a>

              <button
                onClick={async () => {
                  const res = await fetch("/api/report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contractor_id: contractorId,
                      homeowner_name: name,
                      homeowner_address: address,
                      roof_area_sqft: estimate?.roof_area_sqft,
                      pitch_degrees: estimate?.pitch_degrees,
                      material: desiredMaterial,
                      price_low: estimate?.price_low,
                      price_high: estimate?.price_high,
                      is_satellite: estimate?.is_satellite,
                    }),
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `RuufPro-Estimate-${name}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-3 rounded-full border border-gray-200 text-gray-500 text-[15px] font-medium flex items-center justify-center gap-2 hover:border-gray-300 hover:text-gray-700 active:scale-[0.98] transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download Estimate PDF
              </button>
            </div>

            <div className="flex items-center justify-center gap-5 text-[11px] text-gray-300">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Free Inspection
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                No Obligation
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Licensed & Insured
              </span>
            </div>

            <p className="text-center text-[11px] text-gray-300 pt-1">
              Powered by{" "}
              <a href="https://ruufpro.com" className="text-gray-400 hover:underline">
                RuufPro
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
