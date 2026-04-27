"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";
import { NeuInput } from "@/components/dashboard/settings/NeuInput";

interface ZipOption {
  zip: string;
  n: number;
  label: string;
}

interface Props {
  zipOptions: ZipOption[];
  authText: string;
  authVersion: string;
  initialLicense: string;
  initialZips: string[];
}

const FL_LICENSE_RE = /^(CCC|CGC|CRC|CB|RR|RC)\d{6,7}$/;

export function SetupForm({
  zipOptions,
  authText,
  authVersion,
  initialLicense,
  initialZips,
}: Props) {
  const router = useRouter();
  const [license, setLicense] = useState(initialLicense);
  const [zips, setZips] = useState<Set<string>>(new Set(initialZips));
  const [authorized, setAuthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const licenseValid = useMemo(
    () => FL_LICENSE_RE.test(license.trim().toUpperCase()),
    [license]
  );

  function toggleZip(zip: string) {
    setZips((prev) => {
      const next = new Set(prev);
      if (next.has(zip)) next.delete(zip);
      else next.add(zip);
      return next;
    });
  }

  const canSubmit = licenseValid && zips.size > 0 && authorized && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r = await fetch("/api/pipeline/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseNumber: license.trim().toUpperCase(),
          serviceAreaZips: Array.from(zips),
          authorized: true,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Request failed");
      }
      router.push("/dashboard/pipeline");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1 — License # */}
      <SettingsSection
        title="Florida roofing license number"
        description="Required on every postcard by Fla. Stat. §489.119. Format: CCC, CGC, CRC, CB, RR, or RC followed by 6–7 digits."
      >
        <NeuInput
          label="License number"
          type="text"
          value={license}
          onChange={(e) => setLicense(e.target.value.toUpperCase())}
          placeholder="CCC1330842"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono tracking-wider"
          error={
            license && !licenseValid
              ? "Format looks off — expected something like CCC1330842 or RR1234567."
              : undefined
          }
        />
        {licenseValid && (
          <p
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: "var(--neu-accent)" }}
          >
            <Check className="h-3.5 w-3.5" /> Format valid
          </p>
        )}
      </SettingsSection>

      {/* Step 2 — Service-area ZIPs */}
      <SettingsSection
        title="Manatee County ZIPs you serve"
        description="Pick the ZIPs where you want to mail. Only homes in these ZIPs show up in your Property Pipeline tab. Pick at least one."
        action={
          <span
            className="neu-eyebrow tabular-nums shrink-0"
            style={{ fontSize: 10.5 }}
          >
            {zips.size} / 25 selected
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {zipOptions.map((opt) => {
            const checked = zips.has(opt.zip);
            return (
              <label
                key={opt.zip}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 cursor-pointer text-[13px] font-semibold transition-all ${
                  checked ? "neu-inset-deep" : "neu-flat hover:opacity-90"
                }`}
                style={{
                  color: checked
                    ? "var(--neu-accent)"
                    : "var(--neu-text)",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleZip(opt.zip)}
                  className="shrink-0 accent-current"
                />
                <span className="flex-1 truncate">{opt.label}</span>
                <span
                  className="text-[11px] tabular-nums shrink-0"
                  style={{
                    color: checked
                      ? "var(--neu-accent)"
                      : "var(--neu-text-muted)",
                    opacity: checked ? 0.7 : 1,
                  }}
                >
                  {opt.n.toLocaleString()}
                </span>
              </label>
            );
          })}
        </div>
      </SettingsSection>

      {/* Step 3 — Authorization clickwrap */}
      <SettingsSection
        title="Direct-mail authorization"
        description="Read this once. We hash this exact text and store the version with your account so we can prove what you agreed to (ESIGN-compliant audit trail)."
      >
        <pre
          className="neu-inset-deep max-h-64 overflow-y-auto whitespace-pre-wrap p-4 text-[13px] leading-relaxed font-sans rounded-[14px]"
          style={{
            color: "var(--neu-text)",
            background: "transparent",
          }}
        >
          {authText}
        </pre>
        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-1 shrink-0 accent-current"
            style={{ color: "var(--neu-accent)" }}
          />
          <span
            className="text-[14px] leading-relaxed"
            style={{ color: "var(--neu-text)" }}
          >
            I have read and agree to the direct-mail authorization above.{" "}
            <span
              className="neu-eyebrow tabular-nums"
              style={{ fontSize: 10.5 }}
            >
              {authVersion}
            </span>
          </span>
        </label>
      </SettingsSection>

      {err && (
        <p className="text-[12px] font-medium" style={{ color: "#ef4444" }}>
          {err}
        </p>
      )}

      <div className="flex items-center gap-3">
        <NeuButton
          type="submit"
          variant="accent"
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save and open Property Pipeline"
          )}
        </NeuButton>
      </div>
    </form>
  );
}
