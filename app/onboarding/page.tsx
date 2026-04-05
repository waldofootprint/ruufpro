// Onboarding — 3-screen "Build Your Site" experience.
// Screen 1: Simple form (4 fields) → Screen 2: Loading animation →
// Screen 3: Full edit mode with sticky live preview.
// Magic generation: 4 fields → complete site with smart defaults.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/onboarding/loading-screen";
import LivePreview from "@/components/onboarding/live-preview";
import HeroEditor from "@/components/onboarding/hero-editor";
import SectionToggle from "@/components/onboarding/section-toggle";
import CityInput from "@/components/onboarding/city-input";

type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";
type Screen = "form" | "loading" | "editor" | "published";

const DESIGN_OPTIONS = [
  {
    id: "modern_clean" as DesignStyle,
    name: "Modern Clean",
    vibe: "Premium & polished — clean lines, elegant type, lots of white space",
    demoUrl: "/demo",
    preview: "bg-gradient-to-br from-white to-gray-100",
    selectedBorder: "border-[#1E3A5F] ring-2 ring-[#1E3A5F]",
  },
  {
    id: "bold_confident" as DesignStyle,
    name: "Bold & Confident",
    vibe: "Craft & character — dark background, handwritten feel, stands out",
    demoUrl: "/demo/chalkboard",
    preview: "bg-gradient-to-br from-[#2A2D2A] to-[#1f211f]",
    selectedBorder: "border-[#F6C453] ring-2 ring-[#F6C453]",
  },
  {
    id: "warm_trustworthy" as DesignStyle,
    name: "Warm & Trustworthy",
    vibe: "Professional & reliable — clean white with blue accents, trust-forward",
    demoUrl: "/demo/blueprint",
    preview: "bg-gradient-to-br from-[#F5F7FA] to-[#E8EFF8]",
    selectedBorder: "border-[#4A6FA5] ring-2 ring-[#4A6FA5]",
  },
];

const ALL_SERVICES = [
  "Roof Replacement", "Roof Repair", "Roof Inspections", "Storm Damage",
  "Metal Roofing", "Flat Roofing", "Gutter Installation", "Ventilation",
];

const DEFAULT_SERVICES = ["Roof Replacement", "Roof Repair", "Roof Inspections", "Gutter Installation"];

export default function OnboardingPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Track which edit section is in view for live preview
  const [activeSection, setActiveSection] = useState("template");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // === FORM STATE ===

  // Screen 1 (required)
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Editor — template
  const [designStyle, setDesignStyle] = useState<DesignStyle>("modern_clean");

  // Editor — hero
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("Get Your Free Estimate");

  // Editor — services
  const [services, setServices] = useState<string[]>([...DEFAULT_SERVICES]);

  // Editor — trust signals
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
  const [legalEntityType, setLegalEntityType] = useState("sole_proprietor");

  // Editor — about
  const [showAbout, setShowAbout] = useState(true);
  const [aboutText, setAboutText] = useState("");

  // Editor — cities
  const [serviceAreaCities, setServiceAreaCities] = useState<string[]>([]);

  // Derived
  const slug = generateSlug(businessName);
  const defaultHeadline = "Your Roof. Done Right.";
  const defaultSubtitle = city
    ? `Roof replacements, repairs, and inspections for ${city} homeowners. Upfront pricing, clean job sites, and work that's done right.`
    : "Roof replacements, repairs, and inspections done right — upfront pricing, clean job sites, and no pressure.";
  const defaultAbout = businessName && city
    ? `We're a locally owned roofing company proudly serving ${city} and the surrounding ${state || "area"}. We deliver quality workmanship on every project, from repairs to full replacements.`
    : "";

  // Generate smart defaults when transitioning to editor
  function generateDefaults() {
    if (!headline) setHeadline(defaultHeadline);
    if (!subtitle) setSubtitle(defaultSubtitle);
    if (!aboutText && defaultAbout) setAboutText(defaultAbout);
    if (city && serviceAreaCities.length === 0) setServiceAreaCities([city]);
  }

  // IntersectionObserver for tracking active section
  useEffect(() => {
    if (screen !== "editor") return;

    // Use a narrow strip near the top of the viewport to detect which section
    // is "active". rootMargin crops the observation zone to just the top ~200px.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute("data-section") || "template");
          }
        }
      },
      { threshold: 0, rootMargin: "-10% 0px -80% 0px" }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [screen]);

  // Auth check
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
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 63);
  }

  function toggleService(service: string) {
    setServices((prev) => prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]);
  }

  function setSectionRef(name: string) {
    return (el: HTMLDivElement | null) => { sectionRefs.current[name] = el; };
  }

  async function handlePublish() {
    if (!userId) {
      router.push("/signup");
      return;
    }
    setError("");
    setLoading(true);

    if (!slug) { setError("Please enter a valid business name."); setLoading(false); return; }

    const finalAbout = showAbout ? (aboutText || defaultAbout) : null;
    const finalCities = serviceAreaCities.length > 0 ? serviceAreaCities : [city];
    const finalHeadline = headline || defaultHeadline;
    const finalCtaText = ctaText || "Get Your Free Estimate";

    const { data: contractor, error: contractorErr } = await supabase
      .from("contractors")
      .insert({
        user_id: userId,
        email: (await supabase.auth.getUser()).data.user?.email || "",
        business_name: businessName, phone, city, state,
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
      .select().single();

    if (contractorErr) {
      setError(contractorErr.message.includes("duplicate") ? "You already have an account set up." : contractorErr.message);
      setLoading(false);
      return;
    }

    const { error: siteErr } = await supabase.from("sites").insert({
      contractor_id: contractor.id, slug, template: designStyle, published: true,
      services, about_text: finalAbout, hero_headline: finalHeadline, hero_subheadline: subtitle || null, hero_cta_text: finalCtaText,
    });

    if (siteErr) {
      setError(siteErr.message.includes("duplicate") ? `The URL "${slug}.ruufpro.com" is taken.` : siteErr.message);
      setLoading(false);
      return;
    }

    // Schedule onboarding email sequence (fire-and-forget — don't block the UI)
    fetch("/api/email/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractorId: contractor.id }),
    }).catch(() => {}); // Silent fail — emails are important but not blocking

    setLoading(false);
    setScreen("published");
  }

  if (!userId) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Loading...</p></main>;
  }

  // ============================================================
  // SCREEN 1: Simple Form
  // ============================================================
  if (screen === "form") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's build your website</h1>
            <p className="text-gray-600">Four fields. Two minutes. A professional site that gets you found on Google.</p>
          </div>

          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Business Name *</span>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                placeholder="Joe's Roofing" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Phone Number *</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                placeholder="(555) 123-4567" />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block col-span-2">
                <span className="text-sm font-medium text-gray-700">City *</span>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  placeholder="Tampa" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">State *</span>
                <select value={state} onChange={(e) => setState(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  <option value="">--</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <button
              onClick={() => {
                if (!businessName || !phone || !city || !state) { setError("Please fill in all fields."); return; }
                setError("");
                generateDefaults();
                setScreen("loading");
              }}
              className="w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:-translate-y-[1px] active:scale-[0.98]"
            >
              Build My Site →
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Free forever. No credit card. Your site is optimized for Google from day one.
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // SCREEN 2: Loading Animation
  // ============================================================
  if (screen === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingScreen onComplete={() => setScreen("editor")} />
      </main>
    );
  }

  // ============================================================
  // SCREEN 3: Edit Mode — Two-column with sticky preview
  // ============================================================
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your site is ready. Customize anything below.</h1>
          <p className="text-gray-500 text-sm mt-1">
            Everything is pre-filled with smart defaults. Edit what you want, skip what you don't.
            <span className="ml-2 text-indigo-600 font-medium">{slug}.ruufpro.com</span>
          </p>
        </div>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          {/* LEFT: Edit Panel */}
          <div className="space-y-6">

            {/* Template */}
            <div ref={setSectionRef("template")} data-section="template" className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Design Style</h2>
              <div className="space-y-2">
                {DESIGN_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDesignStyle(d.id)}
                    className={`w-full text-left rounded-lg border-2 p-3 transition-all ${designStyle === d.id ? d.selectedBorder + " bg-white" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${d.preview} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                        <div className="text-xs text-gray-500 truncate">{d.vibe}</div>
                      </div>
                      <a href={d.demoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0">
                        Demo →
                      </a>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero */}
            <div ref={setSectionRef("hero")} data-section="hero" className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Hero Section</h2>
              <HeroEditor
                headline={headline} onHeadlineChange={setHeadline}
                subtitle={subtitle} onSubtitleChange={setSubtitle}
                ctaText={ctaText} onCtaTextChange={setCtaText}
              />
            </div>

            {/* Services */}
            <div ref={setSectionRef("services")} data-section="services" className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Services</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_SERVICES.map((s) => {
                  const active = services.includes(s);
                  return (
                    <button key={s} onClick={() => toggleService(s)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                        border: `1px solid ${active ? "#6366f1" : "#d1d5db"}`,
                        background: active ? "rgba(99,102,241,0.08)" : "#fff",
                        color: active ? "#4f46e5" : "#6b7280", cursor: "pointer",
                      }}>
                      {active ? "✓ " : ""}{s}
                    </button>
                  );
                })}
              </div>
              {services.length === 0 && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>Select at least one service</p>}
            </div>

            {/* Trust Signals */}
            <div ref={setSectionRef("trust")} data-section="trust" className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionToggle
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                title="Trust Badges"
                description="Licensed, insured, certifications. Shows as a proof bar on your site."
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
                    <button key={label} onClick={() => setter(!val)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                        border: `1px solid ${val ? "#22c55e" : "#d1d5db"}`,
                        background: val ? "rgba(34,197,94,0.08)" : "#fff",
                        color: val ? "#15803d" : "#6b7280", cursor: "pointer",
                      }}>
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
            </div>

            {/* About */}
            <div ref={setSectionRef("about")} data-section="about" className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionToggle
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                title="About Your Company"
                description="A short paragraph about your team. Builds trust with homeowners."
                enabled={showAbout}
                onToggle={setShowAbout}
              >
                <textarea value={aboutText} onChange={(e) => setAboutText(e.target.value)} rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  placeholder="Tell homeowners about your company..." />
                <p className="text-xs text-gray-400 mt-1">We wrote a default — edit it or leave it.</p>
              </SectionToggle>
            </div>

            {/* Service Area */}
            <div ref={setSectionRef("cities")} data-section="cities" className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Service Area</h2>
              <p className="text-xs text-gray-500 mb-3">Each city gets its own Google-friendly page on your site.</p>
              <CityInput cities={serviceAreaCities} onChange={setServiceAreaCities} primaryCity={city} slug={slug} />
            </div>

            {/* Publish */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <button
                onClick={() => {
                  if (services.length === 0) { setError("Select at least one service."); return; }
                  handlePublish();
                }}
                disabled={loading}
                className="w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publishing..." : "Publish My Site — It's Free"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Your site will be live at <span className="text-indigo-600 font-medium">{slug}.ruufpro.com</span> — optimized for Google.
              </p>
            </div>

          </div>

          {/* RIGHT: Sticky Live Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <LivePreview
                designStyle={designStyle}
                businessName={businessName}
                city={city}
                state={state}
                phone={phone}
                slug={slug}
                activeSection={activeSection}
                services={services}
                isLicensed={showTrust ? isLicensed : false}
                isInsured={showTrust ? isInsured : false}
                offersFinancing={showTrust ? offersFinancing : false}
                warrantyYears={showTrust ? warrantyYears : null}
                yearsInBusiness={showTrust ? yearsInBusiness : null}
                gafMasterElite={showTrust ? gafMasterElite : false}
                bbbAccredited={showTrust ? bbbAccredited : false}
                aboutText={aboutText}
                serviceAreaCities={serviceAreaCities}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  // ============================================================
  // SCREEN 4: Published — Celebration + Next Steps
  // ============================================================
  if (screen === "published") {
    const siteUrl = `https://${slug}.ruufpro.com`;
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          {/* Celebration */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your site is live!</h1>
            <p className="text-gray-600">
              {businessName} now has a professional roofing website. Homeowners can find you, call you, and request estimates.
            </p>
          </div>

          {/* Live URL */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">Your website address</p>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-blue-600 hover:text-blue-700 break-all"
            >
              {slug}.ruufpro.com
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(siteUrl); }}
              className="mt-3 block mx-auto text-sm font-medium text-gray-500 hover:text-gray-700 underline"
            >
              Copy link
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all"
            >
              View Your Site →
            </a>
            <a
              href="/dashboard"
              className="block w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 transition-all"
            >
              Go to Dashboard
            </a>
          </div>

          {/* What's next */}
          <div className="mt-8 text-left bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">What to do next</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Your site is live</strong> — homeowners can find it on Google</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">○</span>
                <span>Add real project photos from your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">○</span>
                <span>Upload your logo in Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">○</span>
                <span>Set up your estimate widget to show pricing</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    );
  }
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
];
