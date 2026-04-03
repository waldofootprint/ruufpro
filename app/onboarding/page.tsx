// Onboarding flow — 5-step "Build Your Site" experience.
// The roofer feels like they're building a website, not filling out a form.
// Every input shows up in a live preview. Construction-themed language.

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MiniPreview from "@/components/onboarding/mini-preview";
import SectionToggle from "@/components/onboarding/section-toggle";
import CityInput from "@/components/onboarding/city-input";

type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";

const DESIGN_OPTIONS = [
  {
    id: "modern_clean" as DesignStyle,
    name: "Modern Clean",
    vibe: "Premium & polished — clean lines, elegant type, lots of white space",
    demoUrl: "/demo",
    preview: "bg-gradient-to-br from-white to-gray-100",
    selectedBorder: "border-[#1E3A5F] ring-2 ring-[#1E3A5F]",
    colors: { bg: "#FFFFFF", accent: "#1E3A5F", text: "#0F172A" },
  },
  {
    id: "bold_confident" as DesignStyle,
    name: "Bold & Confident",
    vibe: "Craft & character — dark background, handwritten feel, stands out",
    demoUrl: "/demo/chalkboard",
    preview: "bg-gradient-to-br from-[#2A2D2A] to-[#1f211f]",
    selectedBorder: "border-[#F6C453] ring-2 ring-[#F6C453]",
    colors: { bg: "#2A2D2A", accent: "#F6C453", text: "#E8E5D8" },
  },
  {
    id: "warm_trustworthy" as DesignStyle,
    name: "Warm & Trustworthy",
    vibe: "Professional & reliable — clean white with blue accents, trust-forward",
    demoUrl: "/demo/blueprint",
    preview: "bg-gradient-to-br from-[#F5F7FA] to-[#E8EFF8]",
    selectedBorder: "border-[#4A6FA5] ring-2 ring-[#4A6FA5]",
    colors: { bg: "#F5F7FA", accent: "#4A6FA5", text: "#0F172A" },
  },
];

const DEFAULT_SERVICES = [
  "Roof Replacement", "Roof Repair", "Roof Inspections", "Gutter Installation",
];

const ALL_SERVICES = [
  "Roof Replacement", "Roof Repair", "Roof Inspections", "Storm Damage",
  "Metal Roofing", "Flat Roofing", "Gutter Installation", "Ventilation",
];

const STEP_LABELS = ["Pick Your Look", "Your Brand", "Your Sections", "Your Pages", "Go Live"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1
  const [designStyle, setDesignStyle] = useState<DesignStyle>("modern_clean");

  // Step 2
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [legalEntityType, setLegalEntityType] = useState("sole_proprietor");

  // Step 3
  const [services, setServices] = useState<string[]>([...DEFAULT_SERVICES]);
  const [showTrust, setShowTrust] = useState(true);
  const [isLicensed, setIsLicensed] = useState(true);
  const [isInsured, setIsInsured] = useState(true);
  const [gafMasterElite, setGafMasterElite] = useState(false);
  const [owensCorningPreferred, setOwensCorningPreferred] = useState(false);
  const [certainteedSelect, setCertainteedSelect] = useState(false);
  const [bbbAccredited, setBbbAccredited] = useState(false);
  const [bbbRating, setBbbRating] = useState("");
  const [offersFinancing, setOffersFinancing] = useState(false);
  const [warrantyYears, setWarrantyYears] = useState<number | null>(null);
  const [yearsInBusiness, setYearsInBusiness] = useState<number | null>(null);
  const [showAbout, setShowAbout] = useState(true);
  const [aboutText, setAboutText] = useState("");

  // Step 4
  const [serviceAreaCities, setServiceAreaCities] = useState<string[]>([]);

  // Derived
  const slug = generateSlug(businessName);
  const defaultAbout = businessName && city
    ? `We're a locally owned roofing company proudly serving ${city} and the surrounding ${state || "area"}. We deliver quality workmanship on every project, from repairs to full replacements.`
    : "";

  // Keep serviceAreaCities in sync with primary city
  useEffect(() => {
    if (city && serviceAreaCities.length === 0) {
      setServiceAreaCities([city]);
    }
  }, [city]);

  // Set default about text when business name or city changes
  useEffect(() => {
    if (!aboutText && defaultAbout) {
      setAboutText(defaultAbout);
    }
  }, [defaultAbout]);

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/signup");
      } else {
        setUserId(data.user.id);
      }
    });
  }, [router]);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);
  }

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  async function handlePublish() {
    if (!userId) return;
    setError("");
    setLoading(true);

    if (!slug) {
      setError("Please enter a valid business name.");
      setLoading(false);
      return;
    }

    const finalAbout = showAbout ? (aboutText || defaultAbout) : null;
    const finalCities = serviceAreaCities.length > 0 ? serviceAreaCities : [city];

    // Create contractor
    const { data: contractor, error: contractorErr } = await supabase
      .from("contractors")
      .insert({
        user_id: userId,
        email: (await supabase.auth.getUser()).data.user?.email || "",
        business_name: businessName,
        phone,
        city,
        state,
        business_type: "residential",
        legal_entity_type: legalEntityType,
        is_licensed: showTrust ? isLicensed : false,
        is_insured: showTrust ? isInsured : false,
        gaf_master_elite: showTrust ? gafMasterElite : false,
        owens_corning_preferred: showTrust ? owensCorningPreferred : false,
        certainteed_select: showTrust ? certainteedSelect : false,
        bbb_accredited: showTrust ? bbbAccredited : false,
        bbb_rating: showTrust && bbbAccredited ? bbbRating : null,
        offers_financing: showTrust ? offersFinancing : false,
        warranty_years: showTrust ? warrantyYears : null,
        years_in_business: showTrust ? yearsInBusiness : null,
        service_area_cities: finalCities,
      })
      .select()
      .single();

    if (contractorErr) {
      if (contractorErr.message.includes("duplicate")) {
        setError("You already have an account set up.");
      } else {
        setError(contractorErr.message);
      }
      setLoading(false);
      return;
    }

    // Create site
    const { error: siteErr } = await supabase.from("sites").insert({
      contractor_id: contractor.id,
      slug,
      template: designStyle,
      published: true,
      services,
      about_text: finalAbout,
    });

    if (siteErr) {
      if (siteErr.message.includes("duplicate")) {
        setError(`The URL "${slug}.ruufpro.com" is taken. Try a different business name.`);
      } else {
        setError(siteErr.message);
      }
      setLoading(false);
      return;
    }

    router.push(`/site/${slug}`);
  }

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const btnPrimary = "flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-[1px] active:scale-[0.98]";
  const btnSecondary = "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]";

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-5xl pt-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`h-2 w-10 sm:w-16 rounded-full transition-colors ${i + 1 <= step ? "bg-gray-900" : "bg-gray-200"}`} />
                {i < STEP_LABELS.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 font-medium">
            {STEP_LABELS[step - 1]} — Step {step} of 5
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* ===== STEP 1: Pick Your Look ===== */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">What should your site feel like?</h1>
            <p className="text-gray-600 mb-6">Each design is fully built and mobile-ready. Pick the one that matches your brand.</p>

            <div className="space-y-4">
              {DESIGN_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesignStyle(d.id)}
                  className={`w-full text-left rounded-lg border-2 p-5 transition-all ${designStyle === d.id ? d.selectedBorder + " bg-white" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Color swatches */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className={`h-14 w-14 rounded-lg ${d.preview}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{d.name}</div>
                      <div className="mt-0.5 text-sm text-gray-600">{d.vibe}</div>
                    </div>
                    <a
                      href={d.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap shrink-0"
                    >
                      See live demo →
                    </a>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setStep(2)} className={`mt-6 w-full ${btnPrimary}`}>
              Start Building
            </button>
          </div>
        )}

        {/* ===== STEP 2: Your Brand ===== */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Add your name to the building</h1>
              <p className="text-gray-600 mb-6">Type your business name and watch it appear on your site.</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Business Name *</span>
                  <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                    placeholder="Joe's Roofing" />
                  {slug && <span className="text-xs text-gray-400 mt-1 block">Your URL: {slug}.ruufpro.com</span>}
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Phone Number *</span>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                    placeholder="(555) 123-4567" />
                  <span className="text-xs text-gray-400 mt-1 block">Appears on your site header and CTA buttons</span>
                </label>

                <div className="grid grid-cols-3 gap-4">
                  <label className="block col-span-2">
                    <span className="text-sm font-medium text-gray-700">City *</span>
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                      placeholder="Dallas" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">State *</span>
                    <select required value={state} onChange={(e) => setState(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
                      <option value="">--</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Business Structure</span>
                  <select value={legalEntityType} onChange={(e) => setLegalEntityType(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
                    <option value="sole_proprietor">Sole Proprietor</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                  <span className="text-xs text-gray-400 mt-1 block">Used to set up your business texting number</span>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(1)} className={btnSecondary}>Back</button>
                <button
                  onClick={() => {
                    if (!businessName || !phone || !city || !state) { setError("Please fill in all required fields."); return; }
                    setError("");
                    if (city && !serviceAreaCities.includes(city)) setServiceAreaCities([city]);
                    setStep(3);
                  }}
                  className={btnPrimary}
                >
                  Keep Building
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="hidden lg:block pt-10">
              <MiniPreview designStyle={designStyle} businessName={businessName} city={city} state={state} phone={phone} slug={slug} />
            </div>
          </div>
        )}

        {/* ===== STEP 3: Your Sections ===== */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose what's on your site</h1>
            <p className="text-gray-600 mb-6">Toggle sections on or off. Everything you turn on becomes a real section on your homepage.</p>

            <div className="space-y-3">
              {/* Services — required, locked ON */}
              <SectionToggle
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>}
                title="Your Services"
                description="What you do. Appears as a grid of service cards on your homepage."
                enabled={true}
                onToggle={() => {}}
                locked
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ALL_SERVICES.map((s) => {
                    const active = services.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleService(s)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 500,
                          border: `1px solid ${active ? "#6366f1" : "#d1d5db"}`,
                          background: active ? "rgba(99,102,241,0.08)" : "#fff",
                          color: active ? "#4f46e5" : "#6b7280",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {active ? "✓ " : ""}{s}
                      </button>
                    );
                  })}
                </div>
                {services.length === 0 && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>Select at least one service</p>
                )}
              </SectionToggle>

              {/* Trust Badges */}
              <SectionToggle
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                title="Trust Badges"
                description="Licensed, insured, certifications. Shows as a proof bar below your hero."
                enabled={showTrust}
                onToggle={setShowTrust}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {([
                    ["Licensed", isLicensed, setIsLicensed],
                    ["Insured", isInsured, setIsInsured],
                    ["GAF Master Elite", gafMasterElite, setGafMasterElite],
                    ["Owens Corning", owensCorningPreferred, setOwensCorningPreferred],
                    ["CertainTeed SELECT", certainteedSelect, setCertainteedSelect],
                    ["BBB Accredited", bbbAccredited, setBbbAccredited],
                    ["Financing Available", offersFinancing, setOffersFinancing],
                  ] as [string, boolean, (v: boolean) => void][]).map(([label, val, setter]) => (
                    <button
                      key={label}
                      onClick={() => setter(!val)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500,
                        border: `1px solid ${val ? "#22c55e" : "#d1d5db"}`,
                        background: val ? "rgba(34,197,94,0.08)" : "#fff",
                        color: val ? "#15803d" : "#6b7280",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {val ? "✓ " : ""}{label}
                    </button>
                  ))}
                </div>

                {bbbAccredited && (
                  <label className="block mb-3">
                    <span className="text-xs font-medium text-gray-600">BBB Rating</span>
                    <input type="text" value={bbbRating} onChange={(e) => setBbbRating(e.target.value)} placeholder="A+"
                      className="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900" />
                  </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">Years in Business</span>
                    <input type="number" min="1" max="100" value={yearsInBusiness || ""} onChange={(e) => setYearsInBusiness(e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 15"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">Warranty (years)</span>
                    <input type="number" min="1" max="50" value={warrantyYears || ""} onChange={(e) => setWarrantyYears(e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 10"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900" />
                  </label>
                </div>
              </SectionToggle>

              {/* About */}
              <SectionToggle
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                title="About Your Company"
                description="A short paragraph about your team. Builds trust with homeowners."
                enabled={showAbout}
                onToggle={setShowAbout}
              >
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  placeholder="Tell homeowners about your company..."
                />
                <p className="text-xs text-gray-400 mt-1">We've written a default — edit it or leave it as-is.</p>
              </SectionToggle>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className={btnSecondary}>Back</button>
              <button
                onClick={() => {
                  if (services.length === 0) { setError("Select at least one service."); return; }
                  setError("");
                  setStep(4);
                }}
                className={btnPrimary}
              >
                Add Your Service Area
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Your Pages ===== */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add pages to your site</h1>
            <p className="text-gray-600 mb-6">Each city gets its own SEO-optimized page. Homeowners in those cities will find you on Google.</p>

            <CityInput
              cities={serviceAreaCities}
              onChange={setServiceAreaCities}
              primaryCity={city}
              slug={slug}
            />

            <div className="mt-6 flex gap-3 items-center">
              <button onClick={() => setStep(3)} className={btnSecondary}>Back</button>
              <button onClick={() => setStep(5)} className={btnPrimary}>
                Preview Your Site
              </button>
            </div>
            <button
              onClick={() => setStep(5)}
              className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              I'll add cities later
            </button>
          </div>
        )}

        {/* ===== STEP 5: Go Live ===== */}
        {step === 5 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your site is ready</h1>
            <p className="text-gray-600 mb-6">Review your details below. When it looks good, hit publish.</p>

            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Business</span>
                <span className="text-sm font-medium text-gray-900">{businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm font-medium text-gray-900">{city}, {state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Design</span>
                <span className="text-sm font-medium text-gray-900">
                  {DESIGN_OPTIONS.find((d) => d.id === designStyle)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Your URL</span>
                <span className="text-sm font-medium text-indigo-600">{slug}.ruufpro.com</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3">
                <span className="text-sm text-gray-500">Services</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {services.map((s) => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              {showTrust && (isLicensed || isInsured || offersFinancing || yearsInBusiness || warrantyYears) && (
                <div className="border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-500">Trust Signals</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {isLicensed && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Licensed</span>}
                    {isInsured && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Insured</span>}
                    {offersFinancing && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Financing</span>}
                    {yearsInBusiness && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{yearsInBusiness}+ yrs</span>}
                    {warrantyYears && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{warrantyYears}-yr warranty</span>}
                  </div>
                </div>
              )}
              {serviceAreaCities.length > 1 && (
                <div className="border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-500">City Pages ({serviceAreaCities.length})</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {serviceAreaCities.map((c) => (
                      <span key={c} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className={btnSecondary}>Back to editing</button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publishing..." : "Publish My Site — It's Free"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
];
