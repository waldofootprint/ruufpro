// Add-On Configuration — contractors set up optional upgrades
// that homeowners can toggle on their Living Estimate.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number | string;
  is_active: boolean;
  sort_order: number;
}

const SUGGESTED_ADDONS = [
  { name: "Gutter Guards", description: "Keep debris out of your gutters and reduce maintenance", price: 800 },
  { name: "Attic Ventilation Upgrade", description: "Ridge vents and soffit vents for better airflow and roof lifespan", price: 600 },
  { name: "Ice & Water Shield", description: "Extra protection along eaves, valleys, and penetrations", price: 500 },
  { name: "Skylight Installation", description: "Add natural light with a new skylight", price: 1200 },
  { name: "Chimney Flashing Replacement", description: "New step and counter flashing around chimney", price: 450 },
  { name: "Fascia & Soffit Repair", description: "Replace damaged fascia boards and soffit panels", price: 700 },
];

export default function AddonsPage() {
  const { contractorId } = useDashboard();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showStarterHint, setShowStarterHint] = useState(false);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      const { data } = await supabase
        .from("estimate_addons")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("sort_order", { ascending: true });
      const existing = (data as Addon[]) || [];
      if (existing.length === 0) {
        // Auto-add top 3 suggested add-ons for new users
        const starters = SUGGESTED_ADDONS.slice(0, 3).map((s, i) => ({
          id: `new-${Date.now()}-${i}`,
          name: s.name,
          description: s.description,
          price: s.price,
          is_active: true,
          sort_order: i,
        }));
        setAddons(starters);
        setShowStarterHint(true);
      } else {
        setAddons(existing);
      }
      setLoading(false);
    }
    load();
  }, [contractorId]);

  function addAddon(suggested?: { name: string; description: string; price: number }) {
    setAddons([
      ...addons,
      {
        id: `new-${Date.now()}`,
        name: suggested?.name || "",
        description: suggested?.description || "",
        price: suggested?.price || "",
        is_active: true,
        sort_order: addons.length,
      },
    ]);
  }

  function updateAddon(index: number, field: string, value: string | number | boolean) {
    setAddons((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function removeAddon(index: number) {
    const addon = addons[index];
    setAddons((prev) => prev.filter((_, i) => i !== index));
    // Delete from DB if it was already saved
    if (addon.id && !addon.id.startsWith("new-")) {
      supabase.from("estimate_addons").delete().eq("id", addon.id).then(() => {});
    }
  }

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Delete all existing and re-insert (simple upsert pattern)
      await supabase
        .from("estimate_addons")
        .delete()
        .eq("contractor_id", contractorId);

      const validAddons = addons.filter((a) => a.name && Number(a.price) > 0);

      if (validAddons.length > 0) {
        const { error: insertErr } = await supabase
          .from("estimate_addons")
          .insert(
            validAddons.map((a, i) => ({
              contractor_id: contractorId,
              name: a.name,
              description: a.description || null,
              price: Number(a.price),
              is_active: a.is_active,
              sort_order: i,
            }))
          );
        if (insertErr) throw insertErr;
      }

      // Reload to get real IDs
      const { data } = await supabase
        .from("estimate_addons")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("sort_order", { ascending: true });
      setAddons((data as Addon[]) || []);
      setShowStarterHint(false);
      setSuccess("Add-ons saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save add-ons. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Which suggested add-ons haven't been added yet
  const unusedSuggestions = SUGGESTED_ADDONS.filter(
    (s) => !addons.some((a) => a.name === s.name)
  );

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Estimate Add-Ons</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Optional upgrades homeowners can add to their interactive estimate.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {showStarterHint && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg leading-none mt-0.5">*</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">We added 3 popular add-ons to get you started</p>
            <p className="text-xs text-slate-500 mt-0.5">Adjust prices to match your area, remove any you don&apos;t offer, then hit Save.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {/* Current add-ons */}
      <div className="space-y-3 mb-6">
        {addons.map((addon, i) => (
          <div key={addon.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <GripVertical className="w-4 h-4 text-slate-300 mt-2.5 flex-shrink-0 cursor-grab" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => updateAddon(i, "name", e.target.value)}
                    placeholder="Add-on name"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      value={addon.price}
                      onChange={(e) => updateAddon(i, "price", e.target.value)}
                      placeholder="0"
                      className="w-28 pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={addon.description}
                  onChange={(e) => updateAddon(i, "description", e.target.value)}
                  placeholder="Short description (optional)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors text-slate-500"
                />
              </div>
              <button
                onClick={() => removeAddon(i)}
                className="text-slate-300 hover:text-red-500 mt-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => addAddon()}
          className="flex items-center gap-2 w-full justify-center py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Custom Add-On
        </button>
      </div>

      {/* Suggested add-ons */}
      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Suggested Add-Ons</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unusedSuggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => addAddon(s)}
                className="text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                  <span className="text-xs font-bold text-slate-500">${s.price}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
