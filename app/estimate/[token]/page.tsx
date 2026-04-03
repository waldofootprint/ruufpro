// Living Estimate — public interactive proposal page.
// Homeowners receive a shareable link to this page where they can:
// - Compare Good/Better/Best material options
// - Toggle add-ons with live price updates
// - Share with a spouse via email
// - Call the contractor to schedule inspection

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Check, Phone, Share2, Mail, Shield, Clock, Wind, Send, PenLine, CheckCircle2, Download } from "lucide-react";
import SignaturePad from "@/components/signature-pad";

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
}

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
}

interface Contractor {
  business_name: string;
  phone: string;
  city: string;
  state: string;
  license_number: string | null;
  is_insured: boolean;
  years_in_business: number | null;
  gaf_master_elite: boolean;
  owens_corning_preferred: boolean;
  certainteed_select: boolean;
  logo_url: string | null;
}

interface LivingEstimate {
  id: string;
  share_token: string;
  homeowner_name: string;
  homeowner_address: string | null;
  roof_area_sqft: number;
  pitch_degrees: number;
  num_segments: number;
  is_satellite: boolean;
  estimates: MaterialEstimate[];
  available_addons: Addon[];
  selected_material: string;
  selected_addons: string[];
  status: string;
  contractors: Contractor;
  created_at: string;
  expires_at: string | null;
  // Signature fields
  signature_data: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signer_email: string | null;
  signed_estimate_snapshot: any | null;
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  Good: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  Better: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  Best: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  Premium: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
};

export default function LivingEstimatePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<LivingEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSending, setShareSending] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signing, setSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/living-estimate?token=${token}`);
      if (!res.ok) {
        setError("This estimate was not found or has expired.");
        setLoading(false);
        return;
      }
      const est = await res.json();
      setData(est);
      setSelectedMaterial(est.selected_material || est.estimates?.[0]?.material || "");
      setSelectedAddons(est.selected_addons || []);
      setIsSigned(est.status === "signed");
      setSignerName(est.signer_name || est.homeowner_name || "");
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  // Debounced selection sync
  const syncSelections = useCallback(async (material: string, addons: string[]) => {
    await fetch("/api/living-estimate/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ share_token: token, selected_material: material, selected_addons: addons }),
    });
  }, [token]);

  function handleMaterialSelect(material: string) {
    setSelectedMaterial(material);
    syncSelections(material, selectedAddons);
  }

  function handleAddonToggle(addonId: string) {
    const updated = selectedAddons.includes(addonId)
      ? selectedAddons.filter((a) => a !== addonId)
      : [...selectedAddons, addonId];
    setSelectedAddons(updated);
    syncSelections(selectedMaterial, updated);
  }

  async function handleShare() {
    if (!shareEmail) return;
    setShareSending(true);
    await fetch("/api/living-estimate/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        share_token: token,
        recipient_email: shareEmail,
        sender_name: data?.homeowner_name,
      }),
    });
    setShareSending(false);
    setShareSuccess(true);
    setTimeout(() => { setShowShareModal(false); setShareSuccess(false); setShareEmail(""); }, 2000);
  }

  async function handleSign() {
    if (!signatureData || !signerName) return;
    setSigning(true);
    try {
      const res = await fetch("/api/living-estimate/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_token: token,
          signature_data: signatureData,
          signer_name: signerName,
          signer_email: signerEmail || undefined,
        }),
      });
      if (res.ok) {
        setIsSigned(true);
      }
    } catch (err) {
      console.error("Sign error:", err);
    }
    setSigning(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading your estimate...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Estimate Not Found</h1>
          <p className="text-slate-500">{error || "This estimate link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  const contractor = data.contractors;
  const selectedEst = data.estimates.find((e) => e.material === selectedMaterial) || data.estimates[0];
  const addonsTotal = data.available_addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const totalLow = selectedEst.price_low + addonsTotal;
  const totalHigh = selectedEst.price_high + addonsTotal;

  const pitchDisplay = `${Math.round(Math.tan((data.pitch_degrees * Math.PI) / 180) * 12)}/12`;
  const certs: string[] = [];
  if (contractor.gaf_master_elite) certs.push("GAF Master Elite");
  if (contractor.owens_corning_preferred) certs.push("Owens Corning Preferred");
  if (contractor.certainteed_select) certs.push("CertainTeed SELECT");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0f172a] text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{contractor.business_name}</h1>
              <p className="text-slate-400 text-sm">{contractor.city}, {contractor.state}</p>
            </div>
            <a
              href={`tel:${contractor.phone.replace(/\D/g, "")}`}
              className="flex items-center gap-2 bg-white text-[#0f172a] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {contractor.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Prepared for */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Prepared for</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{data.homeowner_name}</p>
              {data.homeowner_address && (
                <p className="text-sm text-slate-500 mt-0.5">{data.homeowner_address}</p>
              )}
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Roof data */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Roof Measurements</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.roof_area_sqft?.toLocaleString()}</p>
              <p className="text-xs text-slate-400">sq ft</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{pitchDisplay}</p>
              <p className="text-xs text-slate-400">pitch</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.num_segments}</p>
              <p className="text-xs text-slate-400">segments</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.is_satellite ? "Satellite" : "Manual"}</p>
              <p className="text-xs text-slate-400">source</p>
            </div>
          </div>
        </div>

        {/* G/B/B Material Cards */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Choose Your Material</p>
          <div className="space-y-3">
            {data.estimates.map((est) => {
              const isSelected = selectedMaterial === est.material;
              const tier = TIER_COLORS[est.tier] || TIER_COLORS.Good;
              return (
                <button
                  key={est.material}
                  onClick={() => handleMaterialSelect(est.material)}
                  className={`w-full text-left rounded-xl p-5 border-2 transition-all ${
                    isSelected ? `${tier.bg} ${tier.border}` : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${tier.badge}`}>
                        {est.tier}
                      </span>
                      <span className="text-[15px] font-bold text-slate-800">{est.label}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-slate-800 mb-2">{est.range_display}</p>

                  <p className="text-sm text-slate-500 mb-3">{est.description}</p>

                  <div className="flex gap-6">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{est.warranty}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{est.wind_rating}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{est.lifespan}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add-ons */}
        {data.available_addons.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Optional Add-Ons</p>
            <div className="space-y-2">
              {data.available_addons.map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => handleAddonToggle(addon.id)}
                    className={`w-full text-left rounded-xl p-4 border-2 transition-all flex items-start gap-3 ${
                      isChecked ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      isChecked ? "bg-slate-800 border-slate-800" : "border-slate-300"
                    }`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{addon.name}</span>
                        <span className="text-sm font-bold text-slate-800">+${addon.price.toLocaleString()}</span>
                      </div>
                      {addon.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{addon.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Running total — sticky on mobile */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sticky bottom-4 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-500">
              {selectedEst.label}
              {addonsTotal > 0 && ` + ${selectedAddons.length} add-on${selectedAddons.length > 1 ? "s" : ""}`}
            </p>
            <p className="text-[10px] text-slate-400">Ballpark estimate</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
          </p>
          <a
            href={`tel:${contractor.phone.replace(/\D/g, "")}`}
            className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 rounded-xl bg-[#0f172a] text-white font-bold text-[15px] hover:bg-slate-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Schedule Free Inspection
          </a>
        </div>

        {/* E-Signature Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {isSigned ? (
            // Signed confirmation
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-emerald-700">Estimate Accepted</p>
                  <p className="text-[11px] text-slate-400">
                    Signed by {data.signer_name || signerName}
                    {data.signed_at && ` on ${new Date(data.signed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>
              </div>

              {/* Show frozen snapshot summary */}
              {data.signed_estimate_snapshot && (
                <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Accepted Terms</p>
                  <p className="text-sm text-emerald-800 font-bold">
                    {data.signed_estimate_snapshot.material?.label} — ${data.signed_estimate_snapshot.total_low?.toLocaleString()} – ${data.signed_estimate_snapshot.total_high?.toLocaleString()}
                  </p>
                  {data.signed_estimate_snapshot.addons?.length > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">
                      + {data.signed_estimate_snapshot.addons.map((a: any) => a.name).join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Display stored signature */}
              {data.signature_data && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <img
                    src={data.signature_data}
                    alt="Signature"
                    className="max-h-20 mx-auto"
                  />
                </div>
              )}

              {/* Download signed PDF */}
              <a
                href={`/api/living-estimate/pdf?token=${token}`}
                className="flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Signed Estimate (PDF)
              </a>
            </div>
          ) : (
            // Sign form
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <PenLine className="w-4 h-4 text-slate-400" />
                <p className="text-[15px] font-bold text-slate-800">Accept This Estimate</p>
              </div>
              <p className="text-xs text-slate-400 mb-5 ml-[26px]">
                Sign below to accept this ballpark estimate and move forward with a free inspection.
                This is not a binding contract.
              </p>

              <div className="space-y-4">
                {/* Signer name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                {/* Signer email (optional) */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Email <span className="text-slate-300 font-normal normal-case">(optional — to receive a copy)</span>
                  </label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                {/* Signature pad */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Signature
                  </label>
                  <SignaturePad onSignatureChange={setSignatureData} />
                </div>

                {/* Sign button */}
                <button
                  onClick={handleSign}
                  disabled={!signatureData || !signerName || signing}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-[15px] hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PenLine className="w-4 h-4" />
                  {signing ? "Signing..." : "Sign & Accept Estimate"}
                </button>

                <p className="text-[10px] text-slate-300 text-center leading-relaxed">
                  By signing, you acknowledge this is a ballpark estimate — not a binding contract.
                  Final pricing will be determined after an in-person inspection.
                  Your signature, name, and timestamp are recorded for your records.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">About {contractor.business_name}</p>
          <div className="flex flex-wrap gap-2">
            {contractor.is_insured && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">Fully Insured</span>
            )}
            {contractor.license_number && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">Licensed #{contractor.license_number}</span>
            )}
            {contractor.years_in_business && contractor.years_in_business > 0 && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{contractor.years_in_business}+ Years</span>
            )}
            {certs.map((cert) => (
              <span key={cert} className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{cert}</span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-100 rounded-xl p-4">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-500">Important:</strong> This is a ballpark estimate based on{" "}
            {data.is_satellite ? "satellite imagery" : "the information provided"}, not a final quote or contract.
            Your actual price depends on roof condition, number of existing layers, decking integrity, access
            requirements, code compliance, and other factors assessed during an in-person inspection.
            Material prices are subject to market fluctuations. This estimate is valid for 30 days.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 pb-8">
          Powered by{" "}
          <a href="https://ruufpro.com" className="text-slate-400 hover:text-slate-500 transition-colors">
            RuufPro
          </a>
        </p>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-1">Share this estimate</h3>
            <p className="text-sm text-slate-500 mb-4">Send a link to someone who needs to see this — no login required.</p>

            {shareSuccess ? (
              <div className="flex items-center gap-2 text-emerald-600 font-semibold py-4">
                <Check className="w-5 h-5" />
                Sent! They&apos;ll receive an email shortly.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Their email address"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors"
                  />
                  <button
                    onClick={handleShare}
                    disabled={!shareEmail || shareSending}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0f172a] text-white font-semibold text-sm hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {shareSending ? "Sending..." : "Send"}
                  </button>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
