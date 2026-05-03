"use client";

import { useEffect, useState } from "react";
import { Check, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../../DashboardContext";
import {
  getMetroDefaults,
  getMetroName,
  getRegionName,
  getRegionalDefaults,
} from "@/lib/regional-pricing";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuInput } from "@/components/dashboard/settings/NeuInput";
import { NeuSelect } from "@/components/dashboard/settings/NeuSelect";
import { NeuToggle } from "@/components/dashboard/settings/NeuToggle";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

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
  { key: "asphalt", label: "Asphalt Shingles", desc: "Most common residential" },
  { key: "metal", label: "Standing Seam Metal", desc: "Durable, premium option" },
  { key: "tile", label: "Tile (Clay/Concrete)", desc: "Southwest & Mediterranean" },
  { key: "flat", label: "Flat Roof (TPO/EPDM)", desc: "Commercial & low-slope" },
] as const;

const BUFFERS = [0, 5, 10, 15, 20] as const;

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number | string;
  is_active: boolean;
  sort_order: number;
}

const SUGGESTED_ADDONS = [
  { name: "Gutter Guards", description: "Keep debris out of gutters, reduce maintenance", price: 800 },
  { name: "Attic Ventilation Upgrade", description: "Ridge + soffit vents for better airflow", price: 600 },
  { name: "Ice & Water Shield", description: "Extra protection along eaves, valleys, penetrations", price: 500 },
  { name: "Skylight Installation", description: "Add natural light with a new skylight", price: 1200 },
  { name: "Chimney Flashing Replacement", description: "New step + counter flashing around chimney", price: 450 },
  { name: "Fascia & Soffit Repair", description: "Replace damaged fascia and soffit", price: 700 },
];

export function EstimatesTab() {
  const { contractorId, tier } = useDashboard();

  // Settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [contractorState, setContractorState] = useState("TX");
  const [metroLabel, setMetroLabel] = useState("");
  const [isNewSettings, setIsNewSettings] = useState(false);

  const [rates, setRates] = useState<Rates>({
    asphalt_low: "", asphalt_high: "",
    metal_low: "", metal_high: "",
    tile_low: "", tile_high: "",
    flat_low: "", flat_high: "",
  });
  const [buffer, setBuffer] = useState(10);
  const [minJobPrice, setMinJobPrice] = useState("");
  const [serviceZips, setServiceZips] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({
    asphalt: "", metal: "", tile: "", flat: "",
  });
  const [showRoofDetails, setShowRoofDetails] = useState(true);

  const [financingEnabled, setFinancingEnabled] = useState(false);
  const [financingProvider, setFinancingProvider] = useState("");
  const [financingTermMonths, setFinancingTermMonths] = useState("120");
  const [financingApr, setFinancingApr] = useState("");
  const [financingNote, setFinancingNote] = useState("");

  // Add-ons
  const [addons, setAddons] = useState<Addon[]>([]);
  const [showStarterHint, setShowStarterHint] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!contractorId) {
      setLoading(false);
      return;
    }
    (async () => {
     try {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id, state, city")
        .eq("id", contractorId)
        .single();

      if (!contractor) {
        return;
      }
      setContractorState(contractor.state || "TX");
      setMetroLabel(getMetroName(contractor.state || "TX") || getRegionName(contractor.state || "TX"));

      // Load settings + addons in parallel
      const [settingsRes, addonsRes] = await Promise.all([
        supabase.from("estimate_settings").select("*").eq("contractor_id", contractor.id).single(),
        supabase.from("estimate_addons").select("*").eq("contractor_id", contractor.id).order("sort_order", { ascending: true }),
      ]);

      const settings = settingsRes.data;
      if (settings) {
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
        setBuffer(settings.buffer_percent ?? 10);
        setMinJobPrice(settings.minimum_job_price?.toString() || "");
        setFinancingEnabled(settings.financing_enabled ?? false);
        setFinancingProvider(settings.financing_provider || "");
        setFinancingTermMonths(settings.financing_term_months?.toString() || "120");
        setFinancingApr(settings.financing_apr?.toString() || "");
        setFinancingNote(settings.financing_note || "");
        setLabels({
          asphalt: settings.asphalt_label || "",
          metal: settings.metal_label || "",
          tile: settings.tile_label || "",
          flat: settings.flat_label || "",
        });
        setShowRoofDetails(settings.show_roof_details ?? true);
      } else {
        // Pre-fill metro defaults
        const defaults = getMetroDefaults(contractor.state || "TX", contractor.city || undefined).rates;
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
        setIsNewSettings(true);
      }

      // Addons: seed suggestions if empty
      const existing = (addonsRes.data as Addon[]) || [];
      if (existing.length === 0) {
        setAddons(
          SUGGESTED_ADDONS.slice(0, 3).map((s, i) => ({
            id: `new-${Date.now()}-${i}`,
            name: s.name,
            description: s.description,
            price: s.price,
            is_active: true,
            sort_order: i,
          }))
        );
        setShowStarterHint(true);
      } else {
        setAddons(existing);
      }
     } catch (e) {
       console.error("EstimatesTab load failed:", e);
     } finally {
       setLoading(false);
     }
    })();
  }, [contractorId]);

  function updateRate(key: keyof Rates, value: string) {
    setRates((prev) => ({ ...prev, [key]: value }));
  }

  function addAddon(suggested?: { name: string; description: string; price: number }) {
    setAddons((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: suggested?.name || "",
        description: suggested?.description || "",
        price: suggested?.price || "",
        is_active: true,
        sort_order: prev.length,
      },
    ]);
  }

  function updateAddon(i: number, field: keyof Addon, value: string | number | boolean) {
    setAddons((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  }

  function removeAddon(i: number) {
    const addon = addons[i];
    setAddons((prev) => prev.filter((_, idx) => idx !== i));
    if (addon.id && !addon.id.startsWith("new-")) {
      supabase.from("estimate_addons").delete().eq("id", addon.id).then(() => {});
    }
  }

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setErr("");

    const zipsArray = serviceZips.split(",").map((z) => z.trim()).filter((z) => z.length > 0);

    // Save settings
    const { error: settingsErr } = await supabase.from("estimate_settings").upsert({
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
      buffer_percent: buffer,
      minimum_job_price: minJobPrice ? parseFloat(minJobPrice) : null,
      financing_enabled: financingEnabled,
      financing_provider: financingProvider || null,
      financing_term_months: financingTermMonths ? parseInt(financingTermMonths) : null,
      financing_apr: financingApr ? parseFloat(financingApr) : null,
      financing_note: financingNote || null,
      asphalt_label: labels.asphalt || null,
      metal_label: labels.metal || null,
      tile_label: labels.tile || null,
      flat_label: labels.flat || null,
      show_roof_details: showRoofDetails,
    });

    // Save addons (replace all for this contractor)
    await supabase.from("estimate_addons").delete().eq("contractor_id", contractorId);
    const validAddons = addons.filter((a) => a.name && Number(a.price) > 0);
    let addonsErr: { message: string } | null = null;
    if (validAddons.length > 0) {
      const { error } = await supabase.from("estimate_addons").insert(
        validAddons.map((a, i) => ({
          contractor_id: contractorId,
          name: a.name,
          description: a.description || null,
          price: Number(a.price),
          is_active: a.is_active,
          sort_order: i,
        }))
      );
      addonsErr = error;
    }

    // Reload addons to get real IDs
    const { data: reloaded } = await supabase
      .from("estimate_addons")
      .select("*")
      .eq("contractor_id", contractorId)
      .order("sort_order", { ascending: true });
    setAddons((reloaded as Addon[]) || []);

    setSaving(false);
    if (settingsErr || addonsErr) {
      setErr("Failed to save. Try again.");
    } else {
      setSaved(true);
      setShowStarterHint(false);
      setIsNewSettings(false);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (tier === "free") {
    return (
      <SettingsSection title="Estimate Widget — Pro Feature">
        <div className="flex flex-col items-center py-6 text-center gap-4">
          <p className="max-w-sm text-[13px] neu-muted">
            Homeowners see instant pricing on your site — your phone rings instead of your competitor&apos;s.
            Requires the $149/mo Pro plan.
          </p>
          <NeuButton
            variant="accent"
            onClick={async () => {
              const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "pro_monthly" }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
          >
            Upgrade to Pro
          </NeuButton>
        </div>
      </SettingsSection>
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-sm neu-muted">Loading estimate settings…</div>;
  }

  const regionName = getRegionName(contractorState);
  const defaults = getRegionalDefaults(contractorState);
  const embedCode = `<script src="https://ruufpro.com/widget.js" data-contractor-id="${contractorId}"></script>`;
  const unusedSuggestions = SUGGESTED_ADDONS.filter((s) => !addons.some((a) => a.name === s.name));

  return (
    <div className="space-y-5">
      {isNewSettings && (
        <div
          className="neu-flat px-4 py-3 text-[12px]"
          style={{ borderRadius: 12, color: "var(--neu-text)" }}
        >
          <span className="font-semibold">Pre-filled {metroLabel} averages.</span>{" "}
          <span className="neu-muted">Adjust, then Save to activate your widget.</span>
        </div>
      )}

      {/* Material Rates */}
      <SettingsSection
        title="Material Rates"
        description={`Your $/sqft pricing for each material. Regional avg: ${regionName}.`}
      >
        <div className="space-y-4">
          {MATERIALS.map((mat) => {
            const lowPlaceholder = defaults[`${mat.key}_low` as keyof typeof defaults];
            const highPlaceholder = defaults[`${mat.key}_high` as keyof typeof defaults];
            return (
              <div key={mat.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                      {mat.label}
                    </div>
                    <div className="text-[11px] neu-muted">{mat.desc}</div>
                  </div>
                  <span className="text-[11px] neu-muted">
                    Avg: ${lowPlaceholder}–${highPlaceholder}/sqft
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NeuInput
                    label="Low $/sqft"
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder={String(lowPlaceholder)}
                    value={rates[`${mat.key}_low` as keyof Rates]}
                    onChange={(e) => updateRate(`${mat.key}_low` as keyof Rates, e.target.value)}
                  />
                  <NeuInput
                    label="High $/sqft"
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder={String(highPlaceholder)}
                    value={rates[`${mat.key}_high` as keyof Rates]}
                    onChange={(e) => updateRate(`${mat.key}_high` as keyof Rates, e.target.value)}
                  />
                </div>
                <NeuInput
                  label="Display name (optional)"
                  placeholder={mat.label}
                  value={labels[mat.key]}
                  onChange={(e) =>
                    setLabels((prev) => ({ ...prev, [mat.key]: e.target.value }))
                  }
                />
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Range */}
      <SettingsSection
        title="Estimate Range"
        description="How tight your homeowner-facing range is. ±10% is industry standard."
      >
        <PillGroup
          options={BUFFERS.map((p) => ({ value: String(p), label: p === 0 ? "Exact" : `±${p}%` }))}
          value={String(buffer)}
          onChange={(v) => setBuffer(parseInt(v))}
        />
        <p className="text-[11px] neu-muted">
          With ±10%, a $20,000 base estimate displays as $18,000–$22,000.
        </p>
      </SettingsSection>

      {/* Minimum Job Price */}
      <SettingsSection
        title="Minimum Job Price"
        description="Your smallest complete job price. If the calculator produces a number below this, it rounds up to your minimum. Leave blank to disable."
      >
        <div className="relative max-w-[200px]">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]"
            style={{ color: "var(--neu-text-muted)" }}
          >
            $
          </span>
          <input
            type="number"
            step="500"
            min="0"
            placeholder="20000"
            value={minJobPrice}
            onChange={(e) => setMinJobPrice(e.target.value)}
            className="neu-inset-deep w-full bg-transparent pl-7 pr-3 py-2.5 text-[14px] outline-none"
            style={{ color: "var(--neu-text)" }}
          />
        </div>
        <p className="text-[11px] neu-muted">
          Most FL asphalt roofers land $18K–$22K. A small roof that formulas to $13K still needs a crew, dumpster, permit — so it quotes at your floor instead.
        </p>
      </SettingsSection>

      {/* Service Area */}
      <SettingsSection title="Service Area" description="ZIP codes you serve. Comma-separated.">
        <NeuInput
          placeholder="75201, 75202, 75203"
          value={serviceZips}
          onChange={(e) => setServiceZips(e.target.value)}
        />
      </SettingsSection>

      {/* Display Options */}
      <SettingsSection
        title="Display Options"
        description="Control what homeowners see on your estimate widget."
      >
        <NeuToggle
          checked={showRoofDetails}
          onChange={setShowRoofDetails}
          label="Show roof details to homeowners"
          description={
            showRoofDetails
              ? "Homeowners see roof sqft, pitch, and measurement source."
              : "Homeowners see only the price range and material name."
          }
        />
      </SettingsSection>

      {/* Financing */}
      <SettingsSection
        title="Financing"
        description="Show a &ldquo;Financing Available&rdquo; badge on your widget and estimates."
        action={<NeuToggle checked={financingEnabled} onChange={setFinancingEnabled} />}
      >
        {financingEnabled && (
          <>
            <NeuSelect
              label="Financing Provider"
              value={financingProvider}
              onChange={(e) => setFinancingProvider(e.target.value)}
            >
              <option value="">Select provider…</option>
              <option value="GreenSky">GreenSky</option>
              <option value="Hearth">Hearth</option>
              <option value="Acorn Finance">Acorn Finance</option>
              <option value="Sunlight Financial">Sunlight Financial</option>
              <option value="Service Finance">Service Finance</option>
              <option value="Mosaic">Mosaic</option>
              <option value="In-house">In-house financing</option>
              <option value="Other">Other</option>
            </NeuSelect>
            <div className="grid gap-3 md:grid-cols-2">
              <NeuInput
                label="Term (months)"
                type="number"
                value={financingTermMonths}
                onChange={(e) => setFinancingTermMonths(e.target.value)}
              />
              <NeuInput
                label="APR (%)"
                type="number"
                step="0.01"
                value={financingApr}
                onChange={(e) => setFinancingApr(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <NeuInput
              label="Custom note"
              placeholder="Subject to credit approval. Ask about 0% APR options."
              value={financingNote}
              onChange={(e) => setFinancingNote(e.target.value)}
            />
          </>
        )}
      </SettingsSection>

      {/* Add-ons */}
      <SettingsSection
        title="Estimate Add-Ons"
        description="Optional upgrades homeowners can toggle on their interactive estimate."
      >
        {showStarterHint && (
          <div
            className="neu-flat px-3 py-2 text-[12px] mb-1"
            style={{ borderRadius: 10, color: "var(--neu-text)" }}
          >
            <span className="font-semibold">Seeded with 3 popular add-ons.</span>{" "}
            <span className="neu-muted">Adjust prices, remove any you don&apos;t offer.</span>
          </div>
        )}
        <div className="space-y-3">
          {addons.map((addon, i) => (
            <div key={addon.id} className="neu-inset p-3">
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 neu-muted mt-3 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <NeuInput
                      placeholder="Add-on name"
                      value={addon.name}
                      onChange={(e) => updateAddon(i, "name", e.target.value)}
                      wrapperClassName="flex-1"
                    />
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]"
                        style={{ color: "var(--neu-text-muted)" }}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        value={addon.price}
                        onChange={(e) => updateAddon(i, "price", e.target.value)}
                        placeholder="0"
                        className="neu-inset-deep w-28 bg-transparent pl-7 pr-3 py-2.5 text-[14px] outline-none"
                        style={{ color: "var(--neu-text)" }}
                      />
                    </div>
                  </div>
                  <NeuInput
                    placeholder="Short description (optional)"
                    value={addon.description}
                    onChange={(e) => updateAddon(i, "description", e.target.value)}
                  />
                </div>
                <button
                  onClick={() => removeAddon(i)}
                  className="mt-2 neu-muted hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => addAddon()}
            className="neu-flat flex w-full items-center justify-center gap-2 py-3 text-[13px] font-semibold neu-muted hover:opacity-90"
            style={{ borderRadius: 12 }}
          >
            <Plus className="h-4 w-4" />
            Add Custom Add-On
          </button>
        </div>

        {unusedSuggestions.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide neu-muted">
              Suggested
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {unusedSuggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addAddon(s)}
                  className="neu-flat text-left p-3 hover:opacity-90"
                  style={{ borderRadius: 12 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                      {s.name}
                    </span>
                    <span className="text-[12px] font-bold" style={{ color: "var(--neu-accent)" }}>
                      ${s.price}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] neu-muted">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Embed Code */}
      {!isNewSettings && (
        <SettingsSection
          title="Embed Code"
          description="One line of code adds your widget to any site. WordPress, Wix, Squarespace — all work."
        >
          <div className="flex items-center gap-2">
            <code
              className="neu-inset-deep flex-1 truncate px-3 py-2.5 text-[12px] font-mono"
              style={{ color: "var(--neu-text)" }}
            >
              {embedCode}
            </code>
            <NeuButton
              variant="flat"
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </NeuButton>
          </div>
        </SettingsSection>
      )}

      {/* Save bar */}
      <div
        className="neu-flat sticky bottom-4 flex items-center justify-between gap-3 px-5 py-3"
        style={{ borderRadius: 14 }}
      >
        <div className="text-[12px] neu-muted">
          {err ? (
            <span className="text-red-500 font-medium">{err}</span>
          ) : saved ? (
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--neu-accent)" }}>
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : (
            "Changes apply to new estimates immediately after saving."
          )}
        </div>
        <NeuButton variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </NeuButton>
      </div>
    </div>
  );
}

// ------- Pill group -------

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-[12px] font-semibold transition ${active ? "neu-inset-deep" : "neu-flat hover:opacity-90"}`}
            style={{
              borderRadius: 10,
              color: active ? "var(--neu-accent)" : "var(--neu-text-muted)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
