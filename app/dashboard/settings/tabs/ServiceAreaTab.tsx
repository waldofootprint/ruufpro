"use client";

import { useEffect, useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../../DashboardContext";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

const MAX_ZIPS = 25;
const ZIP_REGEX = /^\d{5}$/;

export function ServiceAreaTab() {
  const { contractorId } = useDashboard();
  const [zips, setZips] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractorId) return;
    let cancelled = false;
    supabase
      .from("contractors")
      .select("service_area_zips")
      .eq("id", contractorId)
      .single()
      .then(({ data, error: e }) => {
        if (cancelled) return;
        if (e) {
          setError(e.message);
        } else {
          setZips((data?.service_area_zips as string[] | null) ?? []);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  function addZip() {
    const z = draft.trim();
    if (!ZIP_REGEX.test(z)) {
      setError("ZIP must be 5 digits");
      return;
    }
    if (zips.includes(z)) {
      setError("Already added");
      return;
    }
    if (zips.length >= MAX_ZIPS) {
      setError(`Max ${MAX_ZIPS} ZIPs`);
      return;
    }
    setZips((prev) => [...prev, z]);
    setDraft("");
    setError(null);
  }

  function removeZip(z: string) {
    setZips((prev) => prev.filter((x) => x !== z));
  }

  async function save() {
    if (!contractorId) return;
    setSaving(true);
    setError(null);
    const { error: e } = await supabase
      .from("contractors")
      .update({ service_area_zips: zips })
      .eq("id", contractorId);
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <SettingsSection
      title="Service Area"
      description="The ZIP codes you serve. Property Pipeline shows in-market homes only in these ZIPs. Manatee County, FL only at MVP."
    >
      {loading ? (
        <p className="text-sm" style={{ color: "var(--neu-text-muted)" }}>
          Loading...
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 min-h-9">
            {zips.length === 0 ? (
              <p
                className="text-sm italic"
                style={{ color: "var(--neu-text-muted)" }}
              >
                No ZIPs yet. Add one below to start seeing in-market homes.
              </p>
            ) : (
              zips.map((z) => (
                <span
                  key={z}
                  className="neu-flat inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums"
                  style={{ color: "var(--neu-text)" }}
                >
                  {z}
                  <button
                    type="button"
                    onClick={() => removeZip(z)}
                    aria-label={`Remove ${z}`}
                    className="hover:opacity-60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="34209"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addZip();
                }
              }}
              className="neu-flat rounded-full px-4 py-2 text-sm tabular-nums w-32"
              style={{
                color: "var(--neu-text)",
                background: "var(--neu-bg)",
              }}
            />
            <NeuButton
              type="button"
              variant="flat"
              onClick={addZip}
              disabled={!draft}
            >
              <Plus className="h-3.5 w-3.5" />
              Add ZIP
            </NeuButton>
            <span
              className="text-xs ml-auto tabular-nums"
              style={{ color: "var(--neu-text-muted)" }}
            >
              {zips.length} / {MAX_ZIPS}
            </span>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <NeuButton
              type="button"
              variant="accent"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save service area"}
            </NeuButton>
            {savedAt && (
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: "var(--neu-accent)" }}
              >
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
