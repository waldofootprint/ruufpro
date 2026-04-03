// My Website — Section-based editor (Option C + A-style inline forms).
// Each section is a row with toggle, status, and expandable edit fields.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import {
  Home,
  ImageIcon,
  Camera,
  Clock,
  Star,
  Wrench,
  Calculator,
  User,
  MessageSquare,
  Mail,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  GripVertical,
  X,
} from "lucide-react";

interface SiteData {
  id: string;
  slug: string;
  published: boolean;
  hero_headline: string | null;
  hero_cta_text: string | null;
  about_text: string | null;
  services: string[] | null;
  gallery_images: string[] | null;
  reviews: { name: string; text: string; rating: number }[];
  meta_title: string | null;
  meta_description: string | null;
}

interface ContractorData {
  business_name: string;
  phone: string;
  city: string;
  state: string;
  tagline: string | null;
  service_area_cities: string[] | null;
  has_estimate_widget: boolean;
  logo_url: string | null;
  business_hours: Record<string, { open: string; close: string } | null> | null;
}

export default function MySitePage() {
  const { contractorId } = useDashboard();
  const [site, setSite] = useState<SiteData | null>(null);
  const [contractor, setContractor] = useState<ContractorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Editable fields
  const [headline, setHeadline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [tagline, setTagline] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceAreaCities, setServiceAreaCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string } | null>>({
    mon: { open: "8:00", close: "17:00" },
    tue: { open: "8:00", close: "17:00" },
    wed: { open: "8:00", close: "17:00" },
    thu: { open: "8:00", close: "17:00" },
    fri: { open: "8:00", close: "17:00" },
    sat: null,
    sun: null,
  });
  const [trustSignals, setTrustSignals] = useState({
    is_licensed: false,
    is_insured: false,
    gaf_master_elite: false,
    owens_corning_preferred: false,
    certainteed_select: false,
    bbb_accredited: false,
    offers_financing: false,
  });

  useEffect(() => {
    async function load() {
      if (!contractorId) return;

      const { data: siteData } = await supabase
        .from("sites")
        .select("*")
        .eq("contractor_id", contractorId)
        .single();

      const { data: contractorData } = await supabase
        .from("contractors")
        .select("business_name, phone, city, state, tagline, service_area_cities, has_estimate_widget, logo_url, business_hours, is_licensed, is_insured, gaf_master_elite, owens_corning_preferred, certainteed_select, bbb_accredited, offers_financing")
        .eq("id", contractorId)
        .single();

      if (siteData) {
        setSite(siteData);
        setHeadline(siteData.hero_headline || "");
        setCtaText(siteData.hero_cta_text || "Get Your Free Estimate");
        setAboutText(siteData.about_text || "");
        setServices(siteData.services || []);
        setGalleryImages(siteData.gallery_images || []);
      }

      if (contractorData) {
        setContractor(contractorData);
        setTagline(contractorData.tagline || "");
        setPhone(contractorData.phone || "");
        setServiceAreaCities(contractorData.service_area_cities || (contractorData.city ? [contractorData.city] : []));
        setLogoUrl(contractorData.logo_url || null);
        if (contractorData.business_hours) setBusinessHours(contractorData.business_hours);
        setTrustSignals({
          is_licensed: contractorData.is_licensed || false,
          is_insured: contractorData.is_insured || false,
          gaf_master_elite: contractorData.gaf_master_elite || false,
          owens_corning_preferred: contractorData.owens_corning_preferred || false,
          certainteed_select: contractorData.certainteed_select || false,
          bbb_accredited: contractorData.bbb_accredited || false,
          offers_financing: contractorData.offers_financing || false,
        });
      }

      setLoading(false);
    }
    load();
  }, [contractorId]);

  async function handleSave() {
    if (!site || !contractorId) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    // Update site content
    const { error: siteErr } = await supabase.from("sites").update({
      hero_headline: headline || null,
      hero_cta_text: ctaText || null,
      about_text: aboutText || null,
      services: services.length > 0 ? services : null,
    }).eq("id", site.id);

    // Update contractor info + trust signals
    const { error: contractorErr } = await supabase.from("contractors").update({
      tagline: tagline || null,
      phone: phone || null,
      service_area_cities: serviceAreaCities.length > 0 ? serviceAreaCities : null,
      business_hours: businessHours,
      ...trustSignals,
    }).eq("id", contractorId);

    setSaving(false);
    if (siteErr || contractorErr) {
      setSaveError("Failed to save. Please try again.");
      console.error("My site save error:", siteErr || contractorErr);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !contractorId) return;
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("contractorId", contractorId);
      const res = await fetch("/api/dashboard/upload-logo", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.logoUrl) {
        setLogoUrl(data.logoUrl);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload failed. Please try again.");
    }
    setLogoUploading(false);
    e.target.value = "";
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !site) return;
    setGalleryUploading(true);
    for (const file of files) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("siteId", site.id);
        const res = await fetch("/api/dashboard/upload-photo", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok && data.gallery) setGalleryImages(data.gallery);
      } catch (err) { console.error("Photo upload failed:", err); }
    }
    setGalleryUploading(false);
    e.target.value = "";
  }

  async function removePhoto(url: string) {
    if (!site) return;
    const res = await fetch("/api/dashboard/upload-photo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: site.id, photoUrl: url }),
    });
    const data = await res.json();
    if (res.ok && data.gallery) setGalleryImages(data.gallery);
  }

  function toggleDay(day: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "8:00", close: "17:00" },
    }));
  }

  function updateHours(day: string, field: "open" | "close", value: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "8:00", close: "17:00", [field]: value },
    }));
  }

  function addService() {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  }

  function removeService(s: string) {
    setServices(services.filter((svc) => svc !== s));
  }

  function toggleSection(id: string) {
    setExpandedSection(expandedSection === id ? null : id);
  }

  function copyEmbedCode() {
    navigator.clipboard.writeText(`<script src="https://ruufpro.com/widget.js" data-contractor="${contractorId}"></script>`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading website editor...</div>;
  }

  if (!site) {
    return (
      <div className="max-w-[700px] mx-auto text-center py-12">
        <p className="text-slate-400 mb-2">No website found</p>
        <p className="text-sm text-slate-400">Complete onboarding to create your free website.</p>
      </div>
    );
  }

  // Section definitions
  const sections = [
    {
      id: "logo",
      icon: <ImageIcon className="w-4 h-4" />,
      iconBg: "bg-violet-50 text-violet-600",
      name: "Logo",
      desc: logoUrl ? "Uploaded" : "No logo yet",
      status: logoUrl ? "live" : "empty",
      content: (
        <div>
          <p className="text-[12px] text-slate-400 mb-3">Your logo appears in the navigation bar and is used for SEO social sharing images.</p>
          {logoUrl && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg flex items-center gap-4">
              <img src={logoUrl} alt="Current logo" className="h-16 w-auto max-w-[200px] object-contain rounded" />
              <div>
                <p className="text-[12px] text-slate-600 font-medium">Current logo</p>
                <button
                  onClick={() => document.getElementById("logo-input")?.click()}
                  className="text-[11px] text-violet-600 hover:text-violet-700 font-semibold mt-1"
                >
                  Replace
                </button>
              </div>
            </div>
          )}
          <label
            htmlFor="logo-input"
            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              logoUploading ? "border-slate-200 bg-slate-50" : "border-[#e2e8f0] hover:border-violet-300 hover:bg-violet-50/30"
            }`}
          >
            <ImageIcon className="w-6 h-6 text-slate-300" />
            <span className="text-[13px] text-slate-500 font-medium">
              {logoUploading ? "Uploading..." : logoUrl ? "Drop a new logo or click to replace" : "Drop your logo here or click to upload"}
            </span>
            <span className="text-[11px] text-slate-400">PNG, JPG, WebP, or SVG — max 5MB</span>
          </label>
          <input
            id="logo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoUpload}
            disabled={logoUploading}
          />
        </div>
      ),
    },
    {
      id: "photos",
      icon: <Camera className="w-4 h-4" />,
      iconBg: "bg-teal-50 text-teal-600",
      name: "Project Photos",
      desc: `${galleryImages.length} photo${galleryImages.length !== 1 ? "s" : ""}`,
      status: galleryImages.length > 0 ? "live" : "empty",
      content: (
        <div>
          <p className="text-[12px] text-slate-400 mb-3">Show off your completed roofing projects. These appear in the gallery section of your website.</p>
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {galleryImages.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden aspect-[4/3]">
                  <img src={url} alt={`Project ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label
            htmlFor="photo-input"
            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              galleryUploading ? "border-slate-200 bg-slate-50" : "border-[#e2e8f0] hover:border-teal-300 hover:bg-teal-50/30"
            }`}
          >
            <Camera className="w-6 h-6 text-slate-300" />
            <span className="text-[13px] text-slate-500 font-medium">
              {galleryUploading ? "Uploading..." : "Drop photos here or click to upload"}
            </span>
            <span className="text-[11px] text-slate-400">PNG, JPG, or WebP — max 10MB each</span>
          </label>
          <input
            id="photo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={galleryUploading}
          />
        </div>
      ),
    },
    {
      id: "hero",
      icon: <Home className="w-4 h-4" />,
      iconBg: "bg-blue-50 text-blue-600",
      name: "Hero",
      desc: "Business name, tagline, CTA button",
      status: headline || tagline ? "live" : "default",
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Headline</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={`${contractor?.city}'s Most Trusted Roofers`}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Tagline</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Shows below your business name"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">CTA Button Text</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Get Your Free Estimate"
            />
          </div>
        </div>
      ),
    },
    {
      id: "hours",
      icon: <Clock className="w-4 h-4" />,
      iconBg: "bg-orange-50 text-orange-600",
      name: "Business Hours",
      desc: Object.values(businessHours).filter(Boolean).length + " days open",
      status: Object.values(businessHours).some(Boolean) ? "live" : "empty",
      content: (
        <div>
          <p className="text-[12px] text-slate-400 mb-3">Set your weekly hours. These appear on your website and in Google search results.</p>
          <div className="space-y-1.5">
            {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => {
              const dayNames: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
              const hours = businessHours[day];
              return (
                <div key={day} className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                      hours ? "bg-slate-800 border-slate-800" : "bg-white border-[#e2e8f0]"
                    }`}
                  >
                    {hours && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="text-[13px] font-medium text-slate-700 w-24">{dayNames[day]}</span>
                  {hours ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="px-2 py-1.5 rounded border border-[#e2e8f0] text-[13px] text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                      <span className="text-slate-400 text-[12px]">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="px-2 py-1.5 rounded border border-[#e2e8f0] text-[13px] text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-[12px] text-slate-400">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: "trust-signals",
      icon: <Shield className="w-4 h-4" />,
      iconBg: "bg-amber-50 text-amber-600",
      name: "Trust Signals",
      desc: `${Object.values(trustSignals).filter(Boolean).length} badge${Object.values(trustSignals).filter(Boolean).length !== 1 ? "s" : ""} active — shown on your website`,
      status: Object.values(trustSignals).some(Boolean) ? "live" : "empty",
      content: (
        <div>
          <p className="text-[12px] text-slate-400 mb-3">Select the badges to display on your website. Only check what applies to your business.</p>
          <div className="space-y-1">
            {([
              { key: "is_licensed", label: "Licensed", desc: "State-licensed roofing contractor" },
              { key: "is_insured", label: "Insured", desc: "Liability and workers' comp coverage" },
              { key: "gaf_master_elite", label: "GAF Master Elite", desc: "Top 2% of roofers nationwide" },
              { key: "owens_corning_preferred", label: "Owens Corning Preferred", desc: "Factory-certified installer" },
              { key: "certainteed_select", label: "CertainTeed Select", desc: "ShingleMaster certified" },
              { key: "bbb_accredited", label: "BBB Accredited", desc: "Better Business Bureau member" },
              { key: "offers_financing", label: "Offers Financing", desc: "Payment plans available for homeowners" },
            ] as const).map((signal) => {
              const isChecked = trustSignals[signal.key as keyof typeof trustSignals];
              return (
                <label
                  key={signal.key}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setTrustSignals((prev) => ({ ...prev, [signal.key]: !isChecked }))}
                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                      isChecked ? "bg-slate-800 border-slate-800" : "bg-white border-[#e2e8f0]"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">{signal.label}</div>
                    <div className="text-[11px] text-slate-400">{signal.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
          {Object.values(trustSignals).some(Boolean) && (
            <div className="mt-4 pt-3 border-t border-slate-50">
              <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wide">Preview on your site</p>
              <div className="flex flex-wrap gap-2">
                {trustSignals.is_licensed && <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-md">Licensed</span>}
                {trustSignals.is_insured && <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-md">Insured</span>}
                {trustSignals.gaf_master_elite && <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">GAF Master Elite</span>}
                {trustSignals.owens_corning_preferred && <span className="text-[11px] font-semibold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-md">Owens Corning Preferred</span>}
                {trustSignals.certainteed_select && <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">CertainTeed Select</span>}
                {trustSignals.bbb_accredited && <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">BBB Accredited</span>}
                {trustSignals.offers_financing && <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">Financing Available</span>}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "services",
      icon: <Wrench className="w-4 h-4" />,
      iconBg: "bg-indigo-50 text-indigo-600",
      name: "Services",
      desc: `${services.length} service${services.length !== 1 ? "s" : ""} listed`,
      status: services.length > 0 ? "live" : "empty",
      content: (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {services.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600 bg-slate-50 border border-[#e2e8f0] rounded-lg px-2.5 py-1.5">
                {s}
                <button onClick={() => removeService(s)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addService()}
              placeholder="Add a service..."
            />
            <button onClick={addService} className="px-4 py-2 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
              Add
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "estimate-widget",
      icon: <Calculator className="w-4 h-4" />,
      iconBg: "bg-green-50 text-green-600",
      name: "Estimate Widget",
      desc: "Instant estimate calculator for homeowners",
      status: contractor?.has_estimate_widget ? "live" : "paid",
      content: (
        <div>
          {contractor?.has_estimate_widget ? (
            <div>
              <p className="text-[13px] text-slate-500 mb-3">Your estimate widget is active and embedded on your site.</p>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">Embed Code (for other websites)</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] text-slate-600 bg-white border border-[#e2e8f0] rounded px-2 py-1.5 overflow-x-auto font-mono">
                    {`<script src="https://ruufpro.com/widget.js" data-contractor="${contractorId}"></script>`}
                  </code>
                  <button onClick={copyEmbedCode} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5 flex-shrink-0">
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-slate-500 mb-2">The estimate widget lets homeowners get instant roof estimates directly on your site.</p>
              <p className="text-[13px] text-amber-600 font-semibold">Requires the $149/mo Pro plan.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "about",
      icon: <User className="w-4 h-4" />,
      iconBg: "bg-pink-50 text-pink-600",
      name: "About",
      desc: "Your story and business background",
      status: aboutText ? "live" : "empty",
      content: (
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">About Your Business</label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all resize-vertical min-h-[100px]"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="Tell homeowners about your business — how you got started, what makes you different, why they should trust you..."
          />
          <p className="text-[11px] text-slate-400 mt-1.5">This appears in the "About" section of your website.</p>
        </div>
      ),
    },
    {
      id: "reviews",
      icon: <MessageSquare className="w-4 h-4" />,
      iconBg: "bg-slate-100 text-slate-500",
      name: "Reviews",
      desc: `${site.reviews?.length || 0} review${(site.reviews?.length || 0) !== 1 ? "s" : ""} added`,
      status: site.reviews?.length > 0 ? "live" : "empty",
      content: (
        <div>
          {site.reviews?.length > 0 ? (
            <div className="space-y-2">
              {site.reviews.map((r, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[12px] text-amber-500 mb-1">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <p className="text-[13px] text-slate-600 leading-relaxed">"{r.text}"</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">— {r.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-slate-500">No reviews yet. Add customer testimonials to build trust with homeowners.</p>
          )}
          <p className="text-[11px] text-slate-400 mt-3">Review management coming soon. For now, reviews can be added during onboarding.</p>
        </div>
      ),
    },
    {
      id: "contact",
      icon: <Mail className="w-4 h-4" />,
      iconBg: "bg-slate-100 text-slate-500",
      name: "Contact Form",
      desc: "Name, email, phone, message — sends to your dashboard",
      status: "live",
      content: (
        <div className="space-y-4">
          <p className="text-[13px] text-slate-500">The contact form is always active. Submissions appear as leads in your dashboard.</p>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Business Phone</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 234-5678"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Service Area Cities</label>
            <p className="text-[11px] text-slate-400 mb-2">Each city gets its own SEO landing page at <span className="text-slate-600">{site?.slug}.ruufpro.com/city-name</span></p>
            <div className="flex flex-wrap gap-2 mb-2">
              {serviceAreaCities.map((city, i) => {
                const isPrimary = city === contractor?.city;
                const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                return (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-[13px] text-slate-700">
                    <span>{city}</span>
                    <span className="text-[10px] text-slate-400">/{slug}</span>
                    {isPrimary ? (
                      <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded ml-1">Primary</span>
                    ) : (
                      <button onClick={() => setServiceAreaCities(serviceAreaCities.filter((_, j) => j !== i))} className="ml-1 text-slate-300 hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCity.trim()) {
                    e.preventDefault();
                    if (!serviceAreaCities.includes(newCity.trim())) {
                      setServiceAreaCities([...serviceAreaCities, newCity.trim()]);
                    }
                    setNewCity("");
                  }
                }}
                placeholder="Add a city..."
              />
              <button
                onClick={() => {
                  if (newCity.trim() && !serviceAreaCities.includes(newCity.trim())) {
                    setServiceAreaCities([...serviceAreaCities, newCity.trim()]);
                    setNewCity("");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  function getStatusBadge(status: string) {
    if (status === "live") return <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Live</span>;
    if (status === "empty") return <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Empty</span>;
    if (status === "paid") return <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Paid</span>;
    return <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Default</span>;
  }

  return (
    <div className="max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Website Sections</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {site.slug}.ruufpro.com &middot; Click a section to edit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/site/${site.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#e2e8f0] text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Preview Site
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-slate-800 text-[12px] font-semibold text-white hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? "Saving..." : saved ? <><Check className="w-3 h-3" /> Saved</> : "Save & Publish"}
          </button>
        </div>
      </div>

      {/* Live status banner */}
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[13px] font-semibold text-green-700">Your site is live</span>
        </div>
        <a
          href={`/site/${site.slug}`}
          target="_blank"
          className="text-[12px] font-semibold text-green-700 hover:text-green-800"
        >
          Visit site &rarr;
        </a>
      </div>

      {/* Section list */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          return (
            <div
              key={section.id}
              className={`rounded-xl bg-white border transition-all ${
                isExpanded ? "border-slate-300 shadow-sm" : "border-[#e2e8f0] hover:border-slate-300"
              }`}
            >
              {/* Section header row */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <GripVertical className="w-4 h-4 text-slate-200 flex-shrink-0 hidden sm:block" />
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${section.iconBg}`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-800">{section.name}</div>
                  <div className="text-[11px] text-slate-400">{section.desc}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(section.status)}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </button>

              {/* Expanded edit content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 sm:pl-[68px]">
                  <div className="border-t border-slate-50 pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error feedback */}
      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] text-red-600 font-medium mt-4">
          {saveError}
        </div>
      )}

      {/* Save bar (sticky on mobile) */}
      <div className="sticky bottom-20 lg:bottom-4 mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-slate-800 text-[13px] font-semibold text-white hover:bg-slate-700 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
        >
          {saving ? "Saving..." : saved ? <><Check className="w-4 h-4" /> Changes Saved</> : "Save & Publish"}
        </button>
      </div>
    </div>
  );
}
