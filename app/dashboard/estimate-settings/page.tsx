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
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getRegionalDefaults,
  getRegionName,
} from "@/lib/regional-pricing";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [contractorState, setContractorState] = useState("TX");
  const [serviceZips, setServiceZips] = useState("");

  const [rates, setRates] = useState<Rates>({
    asphalt_low: "", asphalt_high: "",
    metal_low: "", metal_high: "",
    tile_low: "", tile_high: "",
    flat_low: "", flat_high: "",
  });

  // Load contractor data and existing settings
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Get contractor profile
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id, state")
        .eq("user_id", user.id)
        .single();

      if (!contractor) { router.push("/onboarding"); return; }

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
  }, [router]);

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
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Estimate Widget Settings
        </h1>
        <p className="text-gray-600 mb-8">
          Set your pricing per square foot for each material. These rates are
          used to calculate instant estimates for homeowners.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="rounded-lg bg-white border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pricing Per Square Foot
            </h2>
            <span className="text-xs text-gray-400">
              Regional average: {regionName}
            </span>
          </div>

          <div className="space-y-6">
            {MATERIALS.map((mat) => (
              <div key={mat.key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {mat.label}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {mat.desc}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Avg: ${defaults[`${mat.key}_low` as keyof typeof defaults]}-
                    ${defaults[`${mat.key}_high` as keyof typeof defaults]}/sqft
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-gray-500">Low $/sqft</span>
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder={defaults[`${mat.key}_low` as keyof typeof defaults].toString()}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-gray-500">High $/sqft</span>
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder={defaults[`${mat.key}_high` as keyof typeof defaults].toString()}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Service Area
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter the ZIP codes you serve, separated by commas. Estimates
            requested from outside these areas will still work, but this helps
            us show your widget to the right homeowners.
          </p>
          <input
            type="text"
            value={serviceZips}
            onChange={(e) => setServiceZips(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="75201, 75202, 75203, 75204"
          />
        </div>

        {contractorId && (
          <div className="rounded-lg bg-gray-100 border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Embed Code
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Paste this on any website to add your estimate widget.
            </p>
            <pre className="bg-white rounded-md p-3 text-xs text-gray-700 overflow-x-auto border border-gray-200">
              {`<script src="https://roofready.com/widget.js" data-contractor="${contractorId}"></script>`}
            </pre>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </main>
  );
}
