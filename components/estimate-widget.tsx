// Estimate Widget — 8-step flow (landing + 7 functional steps).
// Premium design with 21st.dev components.
//
// Flow: Landing → Address → Pitch → Current Material → Desired Material →
//       Timeline+Financing → Contact Info → Estimate Reveal
//
// Price is gated behind contact info to maximize lead capture.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { FlowButton } from "@/components/ui/flow-button";

interface EstimateWidgetProps {
  contractorId: string;
  contractorName: string;
  contractorPhone: string;
  accentColor?: string;
}

// ----- STEP DATA -----

const PITCH_OPTIONS = [
  {
    id: "flat",
    label: "Flat",
    description: "Nearly level surface",
    icon: (
      <svg viewBox="0 0 64 40" className="w-16 h-10">
        <rect x="8" y="20" width="48" height="4" rx="1" fill="currentColor" opacity="0.15" />
        <rect x="8" y="18" width="48" height="2" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="4" y="24" width="56" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "low",
    label: "Low",
    description: "Easily walked on",
    icon: (
      <svg viewBox="0 0 64 40" className="w-16 h-10">
        <path d="M8 28 L32 18 L56 28" fill="currentColor" opacity="0.15" />
        <path d="M8 28 L32 18 L56 28" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <rect x="4" y="28" width="56" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "moderate",
    label: "Moderate",
    description: "Not easily walked on",
    icon: (
      <svg viewBox="0 0 64 40" className="w-16 h-10">
        <path d="M8 32 L32 12 L56 32" fill="currentColor" opacity="0.15" />
        <path d="M8 32 L32 12 L56 32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <rect x="4" y="32" width="56" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "steep",
    label: "Steep",
    description: "Can't be walked on",
    icon: (
      <svg viewBox="0 0 64 40" className="w-16 h-10">
        <path d="M12 36 L32 6 L52 36" fill="currentColor" opacity="0.15" />
        <path d="M12 36 L32 6 L52 36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <rect x="8" y="36" width="48" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
  },
];

const CURRENT_MATERIALS = [
  { id: "asphalt", label: "Asphalt", color: "from-gray-700 to-gray-800" },
  { id: "metal", label: "Metal", color: "from-slate-400 to-slate-500" },
  { id: "tile", label: "Tile", color: "from-amber-600 to-amber-700" },
  { id: "flat", label: "Flat Roof", color: "from-gray-500 to-gray-600" },
];

const DESIRED_MATERIALS = [
  { id: "asphalt", label: "Asphalt Shingles", badge: "Most Popular", color: "from-gray-700 to-gray-800" },
  { id: "metal", label: "Standing Seam Metal", badge: null, color: "from-slate-400 to-slate-500" },
  { id: "tile", label: "Tile", badge: null, color: "from-amber-600 to-amber-700" },
];

const TIMELINE_OPTIONS = [
  { id: "no_timeline", label: "No timeline", description: "I don't have a timeline in mind yet" },
  { id: "1_3_months", label: "In 1-3 months", description: "Not urgent, but I'd like to start soon" },
  { id: "now", label: "Now", description: "I would like to start immediately" },
];

const FINANCING_OPTIONS = [
  { id: "yes", label: "Yes", description: "I am interested in financing" },
  { id: "no", label: "No", description: "I am not interested in financing" },
  { id: "maybe", label: "Maybe", description: "I would like to learn more" },
];

export default function EstimateWidget({
  contractorId,
  contractorName,
  contractorPhone,
}: EstimateWidgetProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
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

  // Result state
  const [estimate, setEstimate] = useState<{
    price_low: number;
    price_high: number;
    range_display: string;
    detail_display: string;
    roof_area_sqft: number;
    is_satellite: boolean;
  } | null>(null);

  function nextStep() {
    setError("");
    setStep((s) => s + 1);
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!name || !email || !phone) {
      setError("Please fill in all contact fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call our estimate API
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
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Save the lead to Supabase
      await supabase.from("leads").insert({
        contractor_id: contractorId,
        name,
        email,
        phone,
        address,
        source: "estimate_widget",
        estimate_low: data.estimate.price_low,
        estimate_high: data.estimate.price_high,
        estimate_material: desiredMaterial,
        estimate_roof_sqft: data.estimate.roof_area_sqft,
      });

      setEstimate(data.estimate);
      setStep(8);
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="w-full max-w-[540px] mx-auto">
      <div className="overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-xl transition-shadow duration-500 hover:shadow-2xl relative">
        {/* Subtle border accent */}
        <div className="absolute inset-0 rounded-3xl border border-gray-200/60 pointer-events-none" />

        {/* Progress bar (hidden on landing) */}
        {step > 1 && step < 8 && (
          <div className="h-1 bg-gray-100 rounded-full mb-8 -mt-2">
            <div
              className="h-1 bg-gray-900 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 7) * 100}%` }}
            />
          </div>
        )}

        {/* Back button + step indicator (hidden on landing and results) */}
        {step > 2 && step < 8 && (
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={prevStep}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-400">Step {step - 1} of 7</span>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===== STEP 1: Landing ===== */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center py-6">
            {/* Contractor name/logo placeholder */}
            <p className="text-sm font-semibold text-gray-800 uppercase tracking-widest mb-10">
              {contractorName}
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Get a <span className="italic">free</span> instant estimate
            </h2>

            <p className="text-gray-500 text-base leading-relaxed max-w-sm mb-10">
              We use satellite imagery to measure your roof and provide an instant estimate for your roof replacement
            </p>

            <FlowButton text="Get Started" onClick={nextStep} />

            <p className="mt-8 text-xs text-gray-400">
              Powered by{" "}
              <a href="https://roofready.com" className="text-brand-500 hover:underline">
                RoofReady
              </a>
            </p>
          </div>
        )}

        {/* ===== STEP 2: Address ===== */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              What&#39;s your address?
            </h2>

            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your street address"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all text-base"
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50 h-52 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Satellite view will appear here</p>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={address.length < 5}
              className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-base hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* ===== STEP 3: Roof Steepness ===== */}
        {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                How steep is your roof?
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PITCH_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setPitchCategory(opt.id);
                      nextStep();
                    }}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      pitchCategory === opt.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-150 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-gray-500 mb-3">{opt.icon}</div>
                    <span className="font-semibold text-gray-900 text-sm">{opt.label}</span>
                    <span className="text-xs text-gray-400 mt-1 text-center">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* ===== STEP 4: Current Material ===== */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              What's currently on your roof?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CURRENT_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => {
                    setCurrentMaterial(mat.id);
                    nextStep();
                  }}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-md aspect-[4/3] ${
                    currentMaterial === mat.id
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-gray-150 hover:border-gray-300"
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${mat.color}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-white font-semibold text-sm">
                    {mat.label} ↗
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 5: Desired Material ===== */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              What type of roof would you like?
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {DESIRED_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => {
                    setDesiredMaterial(mat.id);
                    nextStep();
                  }}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-md aspect-[4/3] ${
                    desiredMaterial === mat.id
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-gray-150 hover:border-gray-300"
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${mat.color}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {mat.badge && (
                    <span className="absolute top-2 right-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {mat.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 text-white font-semibold text-sm">
                    {mat.label} ↗
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 6: Timeline + Financing ===== */}
        {step === 6 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                When would you like to start?
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {TIMELINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTimeline(opt.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
                      timeline === opt.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-150 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold text-gray-900 text-sm block">{opt.label}</span>
                    <span className="text-xs text-gray-400 mt-1 block">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Are you interested in financing?
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {FINANCING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFinancing(opt.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
                      financing === opt.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-150 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold text-gray-900 text-sm block">{opt.label}</span>
                    <span className="text-xs text-gray-400 mt-1 block">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!timeline || !financing}
              className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* ===== STEP 7: Contact Info ===== */}
        {step === 7 && (
          <div className="space-y-5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Where should we send your estimate?
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-brand-600 hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>.
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToSms}
                  onChange={(e) => setAgreedToSms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-gray-400 leading-relaxed">
                  To ensure you're getting the best offers and pricing, {contractorName} may
                  need to contact you by text/call. By checking this box, you agree to these
                  communications, including marketing and promotional messages. Message and data
                  rates may apply. You can reply STOP to opt-out of future messaging; reply HELP
                  for messaging help. Message frequency may vary.
                </span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !agreedToTerms || !name || !email || !phone}
              className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Calculating...
                </span>
              ) : (
                "Get my estimate"
              )}
            </button>
          </div>
        )}

        {/* ===== STEP 8: Results ===== */}
        {step === 8 && estimate && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">
                Based on {estimate.is_satellite ? "satellite" : "estimated"} roof measurement
              </p>
              <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Ballpark Roof Estimate
              </h2>

              <div className="mb-2">
                <span className="text-4xl md:text-5xl font-bold text-gray-900">
                  {estimate.range_display}
                </span>
              </div>
              <p className="text-lg text-gray-600 mb-1">
                for {DESIRED_MATERIALS.find((m) => m.id === desiredMaterial)?.label || desiredMaterial}
              </p>
              <p className="text-sm text-gray-400">
                {estimate.detail_display}
              </p>
            </div>

            {/* Disclaimer — visible, not fine print */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">Note:</strong> This is a ballpark estimate,
                  not a final quote. Your actual price depends on roof condition, access, and
                  other factors assessed during a free inspection. Final pricing may be higher or lower.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 text-center">
              <p className="text-lg font-semibold text-gray-900 mb-4">
                Want your exact price?
              </p>
              <a
                href={`tel:${contractorPhone.replace(/\D/g, "")}`}
                className="block w-full py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors text-center"
              >
                Schedule Free Inspection
              </a>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Free Inspection
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  No Obligation
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Licensed & Insured
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              Powered by{" "}
              <a href="https://roofready.com" className="text-brand-500 hover:underline">
                RoofReady
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

