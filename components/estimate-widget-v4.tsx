// Estimate Widget V4 — Glass + 3D Hybrid (Combo E)
// Frosted glass containers with tactile 3D depth.
// All colors use rgba white — no brand colors — works on any dark background.
// Cards lift on hover and press inward when selected.
// Inputs feel carved into glass. Buttons have physical weight.
//
// V4.1 — Good/Better/Best: calculates ALL priced materials and shows
// comparison cards on the results screen. No more single-material picker.

"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Info, Check, Phone } from "lucide-react";
import { usePlacesAutocomplete } from "@/lib/use-places-autocomplete";
import SatelliteView from "@/components/satellite-view";

// ----- GLASS COLOR SYSTEM -----
const GLASS = {
  // Text
  text: "#f5f5f7",
  textSecondary: "rgba(255,255,255,0.6)",
  textTertiary: "rgba(255,255,255,0.4)",
  // Surfaces
  container: "rgba(255,255,255,0.12)",
  containerBorder: "rgba(255,255,255,0.18)",
  inputBg: "rgba(255,255,255,0.08)",
  inputBgFocus: "rgba(255,255,255,0.12)",
  inputBorder: "rgba(255,255,255,0.15)",
  inputBorderFocus: "rgba(255,255,255,0.3)",
  // Cards
  cardBg: "rgba(255,255,255,0.08)",
  cardBorder: "rgba(255,255,255,0.1)",
  cardHoverBg: "rgba(255,255,255,0.12)",
  cardHoverBorder: "rgba(255,255,255,0.2)",
  cardSelectedBg: "rgba(255,255,255,0.15)",
  cardSelectedBorder: "rgba(255,255,255,0.35)",
  // Buttons
  primaryBg: "rgba(255,255,255,0.95)",
  primaryText: "#1B3A4B",
  secondaryBg: "rgba(255,255,255,0.06)",
  secondaryBorder: "rgba(255,255,255,0.2)",
  secondaryText: "rgba(255,255,255,0.6)",
  // Progress
  trackBg: "rgba(255,255,255,0.1)",
  fillBg: "rgba(255,255,255,0.7)",
  fillGlow: "rgba(255,255,255,0.3)",
  // Pills
  pillBg: "rgba(255,255,255,0.06)",
  pillBorder: "rgba(255,255,255,0.12)",
  pillText: "rgba(255,255,255,0.55)",
  pillSelectedBg: "rgba(255,255,255,0.15)",
  pillSelectedBorder: "rgba(255,255,255,0.3)",
  pillSelectedText: "#f5f5f7",
  // Utility
  separator: "rgba(255,255,255,0.1)",
  red: "#ff453a",
  green: "#30d158",
};

// ----- SHADOW PRESETS -----
const SHADOW = {
  container: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
  inputInset: "inset 2px 2px 6px rgba(0,0,0,0.15), inset -1px -1px 3px rgba(255,255,255,0.05)",
  inputFocus: "inset 2px 2px 6px rgba(0,0,0,0.15), 0 0 0 3px rgba(255,255,255,0.08)",
  cardRaised: "0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
  cardHover: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.1)",
  cardSelected: "inset 2px 2px 6px rgba(0,0,0,0.12), inset -1px -1px 3px rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.15)",
  btnPrimary: "0 4px 16px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)",
  btnPrimaryHover: "0 6px 20px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)",
  btnPrimaryActive: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(0,0,0,0.05)",
  btnSecondary: "0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
  pillRaised: "0 2px 8px rgba(0,0,0,0.08)",
  pillSelected: "inset 2px 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)",
  trackInset: "inset 1px 1px 3px rgba(0,0,0,0.15)",
  fillGlow: "0 0 8px rgba(255,255,255,0.3)",
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
        <rect x="15" y="30" width="50" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <line x1="10" y1="30" x2="70" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <rect x="35" y="42" width="10" height="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="36" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="36" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "low", label: "Low", description: "Easily walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="35" width="50" height="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <path d="M10 35 L40 22 L70 35" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <rect x="35" y="45" width="10" height="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="40" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="40" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "moderate", label: "Moderate", description: "Not easily walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="38" width="50" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <path d="M10 38 L40 14 L70 38" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <rect x="35" y="46" width="10" height="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="1" />
        <rect x="20" y="43" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
        <rect x="50" y="43" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" rx="0.5" />
      </svg>
    ),
  },
  {
    id: "steep", label: "Steep", description: "Can't be walked on",
    icon: (
      <svg viewBox="0 0 80 70" className="w-14 h-10">
        <rect x="15" y="42" width="50" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" rx="1" />
        <path d="M10 42 L40 8 L70 42" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
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

// ----- TYPES -----

interface MaterialEstimate {
  material: string;
  tier: string;
  label: string;
  description: string;
  warranty: string;
  wind_rating: string;
  lifespan: string;
  price_low: number;
  price_high: number;
  range_display: string;
  roof_area_sqft: number;
  pitch_degrees: number;
  num_segments: number;
  is_satellite: boolean;
}

interface EstimateResponse {
  estimates: MaterialEstimate[];
  roof_data: {
    roof_area_sqft: number;
    pitch_degrees: number;
    num_segments: number;
    is_satellite: boolean;
    detail_display: string;
  };
}

// ----- STEP TRANSITION (enhanced with scale for 3D feel) -----
const stepVariants = {
  enter: { opacity: 0, x: 16, scale: 0.98 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -16, scale: 0.98 },
};

// ----- TIER BADGE COLORS -----
const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Good: { bg: "rgba(48,209,88,0.2)", text: "#30d158" },
  Better: { bg: "rgba(100,160,255,0.2)", text: "#64a0ff" },
  Best: { bg: "rgba(255,214,10,0.2)", text: "#ffd60a" },
  Premium: { bg: "rgba(191,90,242,0.2)", text: "#bf5af2" },
};

// ----- MAIN WIDGET -----

export default function EstimateWidgetV4({
  contractorId,
  contractorName,
  contractorPhone,
}: EstimateWidgetProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSelectedFromDropdown, setAddressSelectedFromDropdown] = useState(false);
  const [propertyCoords, setPropertyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [buildingPolygon, setBuildingPolygon] = useState<{ lat: number; lng: number }[] | null>(null);
  const { suggestions, search: searchPlaces, clearSuggestions, isLoaded: placesLoaded, getPlaceDetails } = usePlacesAutocomplete();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [pitchCategory, setPitchCategory] = useState("");
  const [currentMaterial, setCurrentMaterial] = useState("");
  const [timeline, setTimeline] = useState("");
  const [financing, setFinancing] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToSms, setAgreedToSms] = useState(false);

  // G/B/B estimate results
  const [estimateData, setEstimateData] = useState<EstimateResponse | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [livingEstimateUrl, setLivingEstimateUrl] = useState("");

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
          current_material: currentMaterial,
          shingle_layers: "not_sure", timeline, financing_interest: financing,
          lat: propertyCoords?.lat, lng: propertyCoords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimate failed");
      setEstimateData(data);

      // Default selection = first (cheapest) material
      const primaryMaterial = data.estimates[0]?.material || "asphalt";
      setSelectedMaterial(primaryMaterial);
      const primaryEst = data.estimates[0];

      // Notify contractor
      fetch("/api/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId, lead_name: name, lead_email: email,
          lead_phone: phone, lead_address: address,
          source: "estimate_widget",
          estimate_low: primaryEst?.price_low, estimate_high: primaryEst?.price_high,
          estimate_material: primaryMaterial, estimate_roof_sqft: data.roof_data?.roof_area_sqft,
          timeline: timeline || null,
        }),
      }).catch(() => {});

      // Insert lead with full G/B/B data
      const estimateMaterials = data.estimates.map((e: MaterialEstimate) => ({
        material: e.material, tier: e.tier, label: e.label,
        price_low: e.price_low, price_high: e.price_high,
        warranty: e.warranty, lifespan: e.lifespan,
      }));

      const { error: leadErr } = await supabase.from("leads").insert({
        contractor_id: contractorId, name, email, phone, address,
        source: "estimate_widget",
        estimate_low: primaryEst?.price_low,
        estimate_high: primaryEst?.price_high,
        estimate_material: primaryMaterial,
        estimate_roof_sqft: data.roof_data?.roof_area_sqft,
        estimate_materials: estimateMaterials,
        timeline: timeline || null,
        financing_interest: financing || null,
        estimate_pitch_degrees: data.roof_data?.pitch_degrees || null,
        estimate_segments: data.roof_data?.num_segments || null,
        sms_consent: agreedToSms,
      });
      if (leadErr) console.error("Lead insert failed:", leadErr);

      // Create living estimate for interactive proposal page
      try {
        const leadData = await supabase
          .from("leads")
          .select("id")
          .eq("contractor_id", contractorId)
          .eq("email", email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const leRes = await fetch("/api/living-estimate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractor_id: contractorId,
            lead_id: leadData.data?.id || null,
            homeowner_name: name, homeowner_email: email,
            homeowner_phone: phone, homeowner_address: address,
            roof_area_sqft: data.roof_data?.roof_area_sqft,
            pitch_degrees: data.roof_data?.pitch_degrees,
            num_segments: data.roof_data?.num_segments,
            is_satellite: data.roof_data?.is_satellite,
            estimates: data.estimates,
          }),
        });
        if (leRes.ok) {
          const leData = await leRes.json();
          setLivingEstimateUrl(leData.url || "");
        }
      } catch (e) { console.error("Living estimate creation failed:", e); }

      setDirection(1); setStep(7);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  // Steps: 1=Landing, 2=Address, 3=Pitch, 4=Current Material, 5=Timeline+Financing, 6=Contact, 7=Results
  const totalSteps = 6;
  const progress = step === 1 || step === 7 ? 0 : ((step - 1) / totalSteps) * 100;

  // Shared input style
  const inputStyle = {
    color: GLASS.text,
    background: GLASS.inputBg,
    border: `1px solid ${GLASS.inputBorder}`,
    boxShadow: SHADOW.inputInset,
    letterSpacing: "-0.022em",
  };

  const inputFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.background = GLASS.inputBgFocus;
      e.currentTarget.style.borderColor = GLASS.inputBorderFocus;
      e.currentTarget.style.boxShadow = SHADOW.inputFocus;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.background = GLASS.inputBg;
      e.currentTarget.style.borderColor = GLASS.inputBorder;
      e.currentTarget.style.boxShadow = SHADOW.inputInset;
    },
  };

  // Address validation — encourage dropdown selection, but allow manual entry for rural
  const addressValid = addressSelectedFromDropdown || (address.length >= 10 && address.includes(","));

  // Disabled button check
  const isSubmitDisabled = loading || !name || !email || !phone || !agreedToTerms;

  return (
    <div
      className="mx-auto w-full max-w-[480px] overflow-hidden rounded-3xl"
      style={{
        background: GLASS.container,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${GLASS.containerBorder}`,
        boxShadow: SHADOW.container,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <div className="px-7 pt-7 pb-9">

        {/* Progress bar — inset track with glowing fill */}
        {step > 1 && step < 7 && (
          <div className="mb-6">
            <div
              className="h-[4px] rounded-full overflow-hidden"
              style={{ background: GLASS.trackBg, boxShadow: SHADOW.trackInset }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: GLASS.fillBg, boxShadow: SHADOW.fillGlow }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        )}

        {/* Back button — glass secondary style */}
        {step > 1 && step < 7 && (
          <motion.button
            onClick={prevStep}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-[14px] mb-5 -ml-0.5 px-3 py-1.5 rounded-lg transition-colors duration-300"
            style={{
              color: GLASS.secondaryText,
              background: GLASS.secondaryBg,
              border: `1px solid ${GLASS.secondaryBorder}`,
              letterSpacing: "-0.016em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = GLASS.secondaryText;
              e.currentTarget.style.borderColor = GLASS.secondaryBorder;
              e.currentTarget.style.background = GLASS.secondaryBg;
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>
        )}

        {/* Error — translucent red on glass */}
        {error && (
          <div
            className="mb-5 rounded-xl px-4 py-3 text-[14px] flex items-start gap-2.5"
            style={{
              background: "rgba(255,69,58,0.15)",
              color: GLASS.red,
              border: "1px solid rgba(255,69,58,0.25)",
            }}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Step content with crossfade + scale transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            custom={direction}
          >

        {/* ===== STEP 1: Landing ===== */}
        {step === 1 && (
          <div className="text-center py-8">
            <p className="text-[12px] font-semibold uppercase mb-3" style={{ color: GLASS.textTertiary, letterSpacing: "0.06em" }}>
              {contractorName}
            </p>
            <h1 className="text-[28px] font-semibold mb-3" style={{ color: GLASS.text, letterSpacing: "-0.003em", lineHeight: 1.1 }}>
              Get a free instant estimate
            </h1>
            <p className="text-[17px] max-w-xs mx-auto mb-10" style={{ color: GLASS.textSecondary, letterSpacing: "-0.022em", lineHeight: 1.47 }}>
              Satellite-measured roof data combined with local pricing. Takes about 2 minutes.
            </p>
            <motion.button
              onClick={nextStep}
              whileHover={{ y: -1, boxShadow: SHADOW.btnPrimaryHover }}
              whileTap={{ y: 1, boxShadow: SHADOW.btnPrimaryActive }}
              className="w-full py-3 rounded-xl text-[17px] transition-colors duration-300"
              style={{
                background: GLASS.primaryBg,
                color: GLASS.primaryText,
                boxShadow: SHADOW.btnPrimary,
                letterSpacing: "-0.022em",
                fontWeight: 600,
                minHeight: 44,
              }}
            >
              Get Started
            </motion.button>
          </div>
        )}

        {/* ===== STEP 2: Address ===== */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: GLASS.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                What&rsquo;s your address?
              </h2>
              <p className="text-[14px]" style={{ color: GLASS.textSecondary, letterSpacing: "-0.016em" }}>
                We&rsquo;ll use satellite data to measure your roof.
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  const val = e.target.value;
                  setAddress(val);
                  searchPlaces(val);
                  setShowSuggestions(true);
                  // Reset satellite state if user edits after selecting
                  if (addressSelectedFromDropdown) {
                    setAddressSelectedFromDropdown(false);
                    setPropertyCoords(null);
                    setBuildingPolygon(null);
                  }
                }}
                onFocus={(e) => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                  e.currentTarget.style.background = GLASS.inputBgFocus;
                  e.currentTarget.style.borderColor = GLASS.inputBorderFocus;
                }}
                onBlur={(e) => {
                  // Delay hiding so clicks on suggestions register
                  setTimeout(() => setShowSuggestions(false), 200);
                  e.currentTarget.style.background = GLASS.inputBg;
                  e.currentTarget.style.borderColor = GLASS.inputBorder;
                }}
                placeholder={placesLoaded ? "Start typing your address..." : "123 Main St, City, State"}
                className="w-full px-4 py-3 rounded-xl text-[17px] outline-none transition-all duration-300 placeholder:text-white/30"
                style={inputStyle}
                autoComplete="off"
              />

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(30,30,40,0.95)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${GLASS.containerBorder}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.placeId}
                      type="button"
                      onClick={async () => {
                        setAddress(s.description);
                        setShowSuggestions(false);
                        setAddressSelectedFromDropdown(true);
                        clearSuggestions();

                        // Get lat/lng from placeId (included in session billing)
                        const coords = await getPlaceDetails(s.placeId);
                        if (coords) {
                          setPropertyCoords(coords);
                          // Fetch building outline in background
                          fetch("/api/geocode-building", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              address: s.description,
                              lat: coords.lat,
                              lng: coords.lng,
                            }),
                          })
                            .then((res) => res.json())
                            .then((data) => {
                              if (data.polygon) setBuildingPolygon(data.polygon);
                              // Use geocoded coords for map center (aligns with building outline)
                              if (data.lat && data.lng) {
                                setPropertyCoords({ lat: data.lat, lng: data.lng });
                              }
                            })
                            .catch(() => {});
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-[15px] transition-colors duration-150 hover:bg-white/10 flex items-start gap-3"
                      style={{ color: GLASS.text, borderBottom: `1px solid ${GLASS.separator}` }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{s.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Satellite property view — appears after address selection */}
            <AnimatePresence>
              {propertyCoords && (
                <SatelliteView
                  lat={propertyCoords.lat}
                  lng={propertyCoords.lng}
                  buildingPolygon={buildingPolygon}
                />
              )}
            </AnimatePresence>

            <motion.button
              onClick={nextStep}
              disabled={!addressValid}
              whileHover={addressValid ? { y: -1, boxShadow: SHADOW.btnPrimaryHover } : undefined}
              whileTap={addressValid ? { y: 1, boxShadow: SHADOW.btnPrimaryActive } : undefined}
              className={cn(
                "w-full py-3 rounded-xl text-[17px] transition-all duration-300",
                !addressValid ? "cursor-not-allowed opacity-40" : ""
              )}
              style={{
                background: !addressValid ? GLASS.separator : GLASS.primaryBg,
                color: !addressValid ? GLASS.textTertiary : GLASS.primaryText,
                boxShadow: !addressValid ? "none" : SHADOW.btnPrimary,
                letterSpacing: "-0.022em", fontWeight: 600, minHeight: 44,
              }}
            >
              Continue
            </motion.button>
          </div>
        )}

        {/* ===== STEP 3: Roof Pitch ===== */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: GLASS.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                How steep is your roof?
              </h2>
              <p className="text-[14px]" style={{ color: GLASS.textSecondary, letterSpacing: "-0.016em" }}>
                Select the closest match.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PITCH_OPTIONS.map((opt) => {
                const isSelected = pitchCategory === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => { setPitchCategory(opt.id); nextStep(); }}
                    whileHover={!isSelected ? { y: -2 } : undefined}
                    whileTap={{ scale: 0.97 }}
                    className="text-left rounded-xl p-4 transition-all duration-300"
                    style={{
                      background: isSelected ? GLASS.cardSelectedBg : GLASS.cardBg,
                      border: `1px solid ${isSelected ? GLASS.cardSelectedBorder : GLASS.cardBorder}`,
                      boxShadow: isSelected ? SHADOW.cardSelected : SHADOW.cardRaised,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = GLASS.cardHoverBg;
                        e.currentTarget.style.borderColor = GLASS.cardHoverBorder;
                        e.currentTarget.style.boxShadow = SHADOW.cardHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = GLASS.cardBg;
                        e.currentTarget.style.borderColor = GLASS.cardBorder;
                        e.currentTarget.style.boxShadow = SHADOW.cardRaised;
                      }
                    }}
                  >
                    <div style={{ color: GLASS.textTertiary }} className="mb-2">{opt.icon}</div>
                    <p className="text-[14px] font-semibold" style={{ color: GLASS.text }}>{opt.label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: GLASS.textTertiary }}>{opt.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== STEP 4: Current Material ===== */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: GLASS.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                What&rsquo;s currently on your roof?
              </h2>
              <p className="text-[14px]" style={{ color: GLASS.textSecondary, letterSpacing: "-0.016em" }}>
                Select your current roofing material.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CURRENT_MATERIALS.map((mat) => {
                const isSelected = currentMaterial === mat.id;
                return (
                  <motion.button
                    key={mat.id}
                    onClick={() => { setCurrentMaterial(mat.id); nextStep(); }}
                    whileHover={!isSelected ? { y: -2 } : undefined}
                    whileTap={{ scale: 0.97 }}
                    className="text-left rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      background: isSelected ? GLASS.cardSelectedBg : GLASS.cardBg,
                      border: `1px solid ${isSelected ? GLASS.cardSelectedBorder : GLASS.cardBorder}`,
                      boxShadow: isSelected ? SHADOW.cardSelected : SHADOW.cardRaised,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = GLASS.cardHoverBorder;
                        e.currentTarget.style.boxShadow = SHADOW.cardHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = GLASS.cardBorder;
                        e.currentTarget.style.boxShadow = SHADOW.cardRaised;
                      }
                    }}
                  >
                    <div className="h-20 overflow-hidden" style={{ background: GLASS.cardBg }}>
                      <img src={mat.image} alt={mat.label} className="w-full h-full object-cover opacity-85" />
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[14px] font-semibold" style={{ color: GLASS.text }}>{mat.label}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: GLASS.textTertiary }}>{mat.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== STEP 5: Timeline + Financing (was Step 6) ===== */}
        {step === 5 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: GLASS.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                When would you like to start?
              </h2>
              <div className="flex flex-wrap gap-2.5 mt-4">
                {TIMELINE_OPTIONS.map((opt) => {
                  const isSelected = timeline === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => setTimeline(opt.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-full px-5 py-2.5 text-[14px] font-medium transition-all duration-300"
                      style={{
                        background: isSelected ? GLASS.pillSelectedBg : GLASS.pillBg,
                        border: `1px solid ${isSelected ? GLASS.pillSelectedBorder : GLASS.pillBorder}`,
                        color: isSelected ? GLASS.pillSelectedText : GLASS.pillText,
                        boxShadow: isSelected ? SHADOW.pillSelected : SHADOW.pillRaised,
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    >
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold mb-1" style={{ color: GLASS.text, letterSpacing: "-0.022em" }}>
                Interested in financing?
              </h3>
              <div className="flex flex-wrap gap-2.5 mt-4">
                {FINANCING_OPTIONS.map((opt) => {
                  const isSelected = financing === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => setFinancing(opt.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-full px-5 py-2.5 text-[14px] font-medium transition-all duration-300"
                      style={{
                        background: isSelected ? GLASS.pillSelectedBg : GLASS.pillBg,
                        border: `1px solid ${isSelected ? GLASS.pillSelectedBorder : GLASS.pillBorder}`,
                        color: isSelected ? GLASS.pillSelectedText : GLASS.pillText,
                        boxShadow: isSelected ? SHADOW.pillSelected : SHADOW.pillRaised,
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    >
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.button
              onClick={nextStep}
              disabled={!timeline || !financing}
              whileHover={timeline && financing ? { y: -1, boxShadow: SHADOW.btnPrimaryHover } : undefined}
              whileTap={timeline && financing ? { y: 1, boxShadow: SHADOW.btnPrimaryActive } : undefined}
              className="w-full py-3 rounded-xl text-[17px] transition-all duration-300"
              style={{
                background: !timeline || !financing ? GLASS.separator : GLASS.primaryBg,
                color: !timeline || !financing ? GLASS.textTertiary : GLASS.primaryText,
                boxShadow: !timeline || !financing ? "none" : SHADOW.btnPrimary,
                letterSpacing: "-0.022em", fontWeight: 600, minHeight: 44,
                cursor: !timeline || !financing ? "not-allowed" : "pointer",
                opacity: !timeline || !financing ? 0.4 : 1,
              }}
            >
              Continue
            </motion.button>
          </div>
        )}

        {/* ===== STEP 6: Contact Info (was Step 7) ===== */}
        {step === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[21px] font-semibold mb-1" style={{ color: GLASS.text, letterSpacing: "0.011em", lineHeight: 1.19 }}>
                Where should we send your estimate?
              </h2>
              <p className="text-[14px]" style={{ color: GLASS.textSecondary, letterSpacing: "-0.016em" }}>
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
                  className="w-full px-4 py-3 rounded-xl text-[17px] outline-none transition-all duration-300 placeholder:text-white/30"
                  style={inputStyle}
                  {...inputFocusHandlers}
                />
              ))}
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200"
                  style={{
                    background: agreedToTerms ? GLASS.cardSelectedBg : GLASS.inputBg,
                    border: `1.5px solid ${agreedToTerms ? GLASS.cardSelectedBorder : GLASS.inputBorder}`,
                    boxShadow: agreedToTerms ? "none" : "inset 1px 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {agreedToTerms && <Check className="w-3 h-3" style={{ color: GLASS.text }} />}
                </button>
                <span className="text-[12px] leading-relaxed" style={{ color: GLASS.textSecondary }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" style={{ color: "rgba(255,255,255,0.7)" }} className="hover:underline">Terms of Service</a> and{" "}
                  <a href="/privacy" target="_blank" style={{ color: "rgba(255,255,255,0.7)" }} className="hover:underline">Privacy Policy</a>
                  <span style={{ color: GLASS.red }} className="ml-0.5">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => setAgreedToSms(!agreedToSms)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200"
                  style={{
                    background: agreedToSms ? GLASS.cardSelectedBg : GLASS.inputBg,
                    border: `1.5px solid ${agreedToSms ? GLASS.cardSelectedBorder : GLASS.inputBorder}`,
                    boxShadow: agreedToSms ? "none" : "inset 1px 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {agreedToSms && <Check className="w-3 h-3" style={{ color: GLASS.text }} />}
                </button>
                <span className="text-[11px] leading-relaxed" style={{ color: GLASS.textTertiary }}>
                  I consent to receive SMS messages from {contractorName}. Msg & data rates may apply. Reply STOP to unsubscribe.
                </span>
              </label>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              whileHover={!isSubmitDisabled ? { y: -1, boxShadow: SHADOW.btnPrimaryHover } : undefined}
              whileTap={!isSubmitDisabled ? { y: 1, boxShadow: SHADOW.btnPrimaryActive } : undefined}
              className="w-full py-3 rounded-xl text-[17px] transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                background: isSubmitDisabled ? GLASS.separator : GLASS.primaryBg,
                color: isSubmitDisabled ? GLASS.textTertiary : GLASS.primaryText,
                boxShadow: isSubmitDisabled ? "none" : SHADOW.btnPrimary,
                letterSpacing: "-0.022em", fontWeight: 600, minHeight: 44,
                cursor: isSubmitDisabled ? "not-allowed" : "pointer",
                opacity: isSubmitDisabled ? 0.4 : 1,
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 rounded-full"
                  style={{ borderColor: "rgba(27,58,75,0.3)", borderTopColor: GLASS.primaryText }}
                />
              ) : (
                "Get my estimate"
              )}
            </motion.button>
          </div>
        )}

        {/* ===== STEP 7: Good/Better/Best Results ===== */}
        {step === 7 && estimateData && (
          <div className="space-y-5 py-2">
            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase mb-2" style={{ color: GLASS.textTertiary, letterSpacing: "0.06em" }}>
                {estimateData.roof_data.is_satellite ? "Satellite-Measured" : "Estimated"} Roof Analysis
              </p>
              <p className="text-[12px]" style={{ color: GLASS.textTertiary }}>
                {estimateData.roof_data.detail_display}
              </p>
            </div>

            {/* G/B/B Material Cards — stacked for mobile-first */}
            <div className="space-y-3">
              {estimateData.estimates.map((est, i) => {
                const isSelected = selectedMaterial === est.material;
                const tierColor = TIER_COLORS[est.tier] || TIER_COLORS.Good;
                return (
                  <button
                    key={est.material}
                    onClick={() => setSelectedMaterial(est.material)}
                    className="w-full text-left rounded-xl p-4 transition-all duration-300"
                    style={{
                      background: isSelected ? GLASS.cardSelectedBg : GLASS.cardBg,
                      border: `1px solid ${isSelected ? GLASS.cardSelectedBorder : GLASS.cardBorder}`,
                      boxShadow: isSelected ? SHADOW.cardSelected : SHADOW.cardRaised,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = GLASS.cardHoverBg;
                        e.currentTarget.style.borderColor = GLASS.cardHoverBorder;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = GLASS.cardBg;
                        e.currentTarget.style.borderColor = GLASS.cardBorder;
                      }
                    }}
                  >
                    {/* Header row: tier badge + material name */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                          style={{
                            background: tierColor.bg,
                            color: tierColor.text,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {est.tier}
                        </span>
                        <span className="text-[15px] font-semibold" style={{ color: GLASS.text }}>
                          {est.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4" style={{ color: GLASS.green }} />
                      )}
                    </div>

                    {/* Price range */}
                    <p
                      className="text-[24px] font-semibold mb-2"
                      style={{ color: GLASS.text, letterSpacing: "-0.003em" }}
                    >
                      {est.range_display}
                    </p>

                    {/* Specs row */}
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] uppercase" style={{ color: GLASS.textTertiary, letterSpacing: "0.03em" }}>Warranty</p>
                        <p className="text-[12px] font-medium" style={{ color: GLASS.textSecondary }}>{est.warranty}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase" style={{ color: GLASS.textTertiary, letterSpacing: "0.03em" }}>Wind</p>
                        <p className="text-[12px] font-medium" style={{ color: GLASS.textSecondary }}>{est.wind_rating}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase" style={{ color: GLASS.textTertiary, letterSpacing: "0.03em" }}>Lifespan</p>
                        <p className="text-[12px] font-medium" style={{ color: GLASS.textSecondary }}>{est.lifespan}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-xl px-4 py-3.5 flex gap-3"
              style={{
                background: GLASS.cardBg,
                border: `1px solid ${GLASS.cardBorder}`,
              }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GLASS.textTertiary }} />
              <p className="text-[12px] leading-relaxed" style={{ color: GLASS.textSecondary }}>
                <strong style={{ color: GLASS.text }}>Note:</strong> These are ballpark estimates,
                not final quotes. Actual price depends on roof condition, access, and
                other factors assessed during a free inspection.
              </p>
            </div>

            <div className="pt-2 space-y-3" style={{ borderTop: `1px solid ${GLASS.separator}` }}>
              <p className="text-center text-[17px] font-semibold pt-3 mb-4" style={{ color: GLASS.text }}>
                Want your exact price?
              </p>

              <motion.a
                href={`tel:${contractorPhone.replace(/\D/g, "")}`}
                whileHover={{ y: -1, boxShadow: SHADOW.btnPrimaryHover }}
                whileTap={{ y: 1, boxShadow: SHADOW.btnPrimaryActive }}
                className="w-full py-3 rounded-xl text-[17px] flex items-center justify-center gap-2 transition-all duration-300"
                style={{
                  background: GLASS.primaryBg,
                  color: GLASS.primaryText,
                  boxShadow: SHADOW.btnPrimary,
                  fontWeight: 600, minHeight: 44,
                }}
              >
                <Phone className="w-4 h-4" />
                Schedule Free Inspection
              </motion.a>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  const primary = estimateData.estimates.find((e) => e.material === selectedMaterial) || estimateData.estimates[0];
                  const res = await fetch("/api/report", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contractor_id: contractorId, homeowner_name: name, homeowner_address: address,
                      lat: propertyCoords?.lat, lng: propertyCoords?.lng,
                      roof_area_sqft: estimateData.roof_data.roof_area_sqft,
                      pitch_degrees: estimateData.roof_data.pitch_degrees,
                      num_segments: estimateData.roof_data.num_segments,
                      material: primary.material, price_low: primary.price_low,
                      price_high: primary.price_high, is_satellite: estimateData.roof_data.is_satellite,
                      all_estimates: estimateData.estimates.map((e) => ({
                        material: e.material, label: e.label, price_low: e.price_low,
                        price_high: e.price_high, warranty: e.warranty,
                        wind_rating: e.wind_rating, lifespan: e.lifespan, description: e.description,
                      })),
                    }),
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `RuufPro-Estimate-${name}.pdf`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-3 rounded-xl text-[17px] flex items-center justify-center gap-2 transition-all duration-300"
                style={{
                  background: GLASS.secondaryBg,
                  border: `1px solid ${GLASS.secondaryBorder}`,
                  color: GLASS.secondaryText,
                  boxShadow: SHADOW.btnSecondary,
                  fontWeight: 500, minHeight: 44,
                }}
              >
                <Download className="w-4 h-4" />
                Download Estimate PDF
              </motion.button>

            </div>

            <div className="flex items-center justify-center gap-5 text-[12px]" style={{ color: GLASS.textTertiary }}>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" style={{ color: GLASS.green }} />
                Free Inspection
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" style={{ color: GLASS.green }} />
                No Obligation
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" style={{ color: GLASS.green }} />
                Licensed & Insured
              </span>
            </div>

            <p className="text-center text-[12px]" style={{ color: GLASS.textTertiary }}>
              Powered by{" "}
              <a href="https://ruufpro.com" style={{ color: "rgba(255,255,255,0.5)" }} className="hover:underline hover:text-white/70 transition-colors">
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
