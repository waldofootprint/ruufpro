// Roofer pricing dashboard — where roofers configure their estimate widget.
//
// This page lets a roofer:
// 1. Set their $/sqft rates per material (with regional suggestions)
// 2. Set their service area ZIP codes
// 3. See a live preview of what the estimate looks like
// 4. Copy their embed code for external sites
//
// "use client" because it has form state and interactive elements.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  getRegionalDefaults,
  getRegionName,
} from "@/lib/regional-pricing";
import { useDashboard } from "../DashboardContext";

interface Rates {
  asphalt_low: string;
  asphalt_high: string;
  metal_low: string;
  metal_high: string;
  tile_low: string;
  tile_high: string;
  flat_low: string;
  flat_high: string;
}

const MATERIALS = [
  { key: "asphalt", label: "Asphalt Shingles", desc: "Most common residential roofing" },
  { key: "metal", label: "Standing Seam Metal", desc: "Durable, premium option" },
  { key: "tile", label: "Tile (Clay/Concrete)", desc: "Southwest & Mediterranean style" },
  { key: "flat", label: "Flat Roof (TPO/EPDM)", desc: "Commercial & low-slope residential" },
];

export default function EstimateSettingsPage() {
  const { contractorId: ctxContractorId } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [contractorState, setContractorState] = useState("TX");
  const [serviceZips, setServiceZips] = useState("");
  const [buffer, setBuffer] = useState(10); // default 10% buffer

  const [rates, setRates] = useState<Rates>({
    asphalt_low: "", asphalt_high: "",
    metal_low: "", metal_high: "",
    tile_low: "", tile_high: "",
    flat_low: "", flat_high: "",
  });

  // Load contractor data and existing settings
  useEffect(() => {
    async function loadData() {
      if (!ctxContractorId) return;

      // Get contractor state for regional defaults
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id, state")
        .eq("id", ctxContractorId)
        .single();

      if (!contractor) return;

      setContractorId(contractor.id);
      setContractorState(contractor.state || "TX");

      // Check for existing settings
      const { data: settings } = await supabase
        .from("estimate_settings")
        .select("*")
        .eq("contractor_id", contractor.id)
        .single();

      if (settings) {
        // Load existing rates
        setRates({
          asphalt_low: settings.asphalt_low?.toString() || "",
          asphalt_high: settings.asphalt_high?.toString() || "",
          metal_low: settings.metal_low?.toString() || "",
          metal_high: settings.metal_high?.toString() || "",
          tile_low: settings.tile_low?.toString() || "",
          tile_high: settings.tile_high?.toString() || "",
          flat_low: settings.flat_low?.toString() || "",
          flat_high: settings.flat_high?.toString() || "",
        });
        setServiceZips(settings.service_zips?.join(", ") || "");
      } else {
        // Pre-fill with regional defaults
        const defaults = getRegionalDefaults(contractor.state || "TX");
        setRates({
          asphalt_low: defaults.asphalt_low.toString(),
          asphalt_high: defaults.asphalt_high.toString(),
          metal_low: defaults.metal_low.toString(),
          metal_high: defaults.metal_high.toString(),
          tile_low: defaults.tile_low.toString(),
          tile_high: defaults.tile_high.toString(),
          flat_low: defaults.flat_low.toString(),
          flat_high: defaults.flat_high.toString(),
        });
      }

      setLoading(false);
    }
    loadData();
  }, [ctxContractorId]);

  async function handleSave() {
    if (!contractorId) return;
    setError("");
    setSuccess("");
    setSaving(true);

    const zipsArray = serviceZips
      .split(",")
      .map((z) => z.trim())
      .filter((z) => z.length > 0);

    const { error: saveErr } = await supabase
      .from("estimate_settings")
      .upsert({
        contractor_id: contractorId,
        asphalt_low: parseFloat(rates.asphalt_low) || null,
        asphalt_high: parseFloat(rates.asphalt_high) || null,
        metal_low: parseFloat(rates.metal_low) || null,
        metal_high: parseFloat(rates.metal_high) || null,
        tile_low: parseFloat(rates.tile_low) || null,
        tile_high: parseFloat(rates.tile_high) || null,
        flat_low: parseFloat(rates.flat_low) || null,
        flat_high: parseFloat(rates.flat_high) || null,
        service_zips: zipsArray.length > 0 ? zipsArray : null,
      });

    if (saveErr) {
      setError(saveErr.message);
    } else {
      setSuccess("Settings saved! Your estimate widget is ready.");
    }
    setSaving(false);
  }

  function updateRate(key: keyof Rates, value: string) {
    setRates((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const regionName = getRegionName(contractorState);
  const defaults = getRegionalDefaults(contractorState);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1B3A4B] mb-2">
        Estimate Widget Settings
      </h1>
      <p className="text-[#1B3A4B]/60 mb-8">
        Set your pricing per square foot for each material. These rates are
        used to calculate instant estimates for homeowners.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-200/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1B3A4B]">
            Pricing Per Square Foot
          </h2>
          <span className="text-xs text-[#1B3A4B]/40">
            Regional average: {regionName}
          </span>
        </div>

        <div className="space-y-6">
          {MATERIALS.map((mat) => (
            <div key={mat.key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-[#1B3A4B]">
                    {mat.label}
                  </span>
                  <span className="ml-2 text-xs text-[#1B3A4B]/40">
                    {mat.desc}
                  </span>
                </div>
                <span className="text-xs text-[#1B3A4B]/40">
                  Avg: ${defaults[`${mat.key}_low` as keyof typeof defaults]}-
                  ${defaults[`${mat.key}_high` as keyof typeof defaults]}/sqft
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-[#1B3A4B]/50">Low $/sqft</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={rates[`${mat.key}_low` as keyof Rates]}
                    onChange={(e) =>
                      updateRate(
                        `${mat.key}_low` as keyof Rates,
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200/60 px-3 py-2 text-[#1B3A4B] focus:border-[#D4863E] focus:outline-none focus:ring-1 focus:ring-[#D4863E]"
                    placeholder={defaults[`${mat.key}_low` as keyof typeof defaults].toString()}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-[#1B3A4B]/50">High $/sqft</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={rates[`${mat.key}_high` as keyof Rates]}
                    onChange={(e) =>
                      updateRate(
                        `${mat.key}_high` as keyof Rates,
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200/60 px-3 py-2 text-[#1B3A4B] focus:border-[#D4863E] focus:outline-none focus:ring-1 focus:ring-[#D4863E]"
                    placeholder={defaults[`${mat.key}_high` as keyof typeof defaults].toString()}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200/60 p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1B3A4B] mb-2">
          Estimate Buffer
        </h2>
        <p className="text-sm text-[#1B3A4B]/50 mb-4">
          Widens the high end of your estimate range to account for unknowns
          you typically find during inspection (decking, access, code issues).
          Most roofers use 10-15%.
        </p>
        <div className="flex gap-2">
          {[0, 5, 10, 15, 20].map((pct) => (
            <button
              key={pct}
              onClick={() => setBuffer(pct)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                buffer === pct
                  ? "bg-[#D4863E] text-white"
                  : "bg-[#1B3A4B]/5 text-[#1B3A4B]/70 hover:bg-[#1B3A4B]/10"
              }`}
            >
              {pct === 0 ? "None" : `+${pct}%`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#1B3A4B]/40">
          Example: With a 15% buffer, a $10,000-$14,000 estimate becomes $10,000-$16,100.
          The low end stays the same — only the high end widens.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-gray-200/60 p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1B3A4B] mb-2">
          Service Area
        </h2>
        <p className="text-sm text-[#1B3A4B]/50 mb-4">
          Enter the ZIP codes you serve, separated by commas. Estimates
          requested from outside these areas will still work, but this helps
          us show your widget to the right homeowners.
        </p>
        <input
          type="text"
          value={serviceZips}
          onChange={(e) => setServiceZips(e.target.value)}
          className="block w-full rounded-lg border border-gray-200/60 px-3 py-2 text-[#1B3A4B] placeholder-[#1B3A4B]/30 focus:border-[#D4863E] focus:outline-none focus:ring-1 focus:ring-[#D4863E]"
          placeholder="75201, 75202, 75203, 75204"
        />
      </div>

      {contractorId && (
        <div className="rounded-xl bg-[#1B3A4B]/5 border border-gray-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-2">
            Embed Code
          </h2>
          <p className="text-sm text-[#1B3A4B]/50 mb-3">
            Paste this on any website to add your estimate widget.
          </p>
          <pre className="bg-white rounded-lg p-3 text-xs text-[#1B3A4B]/70 overflow-x-auto border border-gray-200/60">
            {`<script src="https://ruufpro.com/widget.js" data-contractor="${contractorId}"></script>`}
          </pre>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-[#1B3A4B] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1B3A4B]/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
