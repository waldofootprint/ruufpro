"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
      {/* License # */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900">
          1. Your Florida roofing license number
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Required on every postcard by Fla. Stat. §489.119. Format: CCC, CGC,
          CRC, CB, RR, or RC followed by 6–7 digits.
        </p>
        <input
          type="text"
          value={license}
          onChange={(e) => setLicense(e.target.value.toUpperCase())}
          placeholder="CCC1330842"
          autoCapitalize="characters"
          spellCheck={false}
          className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        {license && !licenseValid && (
          <p className="mt-2 text-xs text-red-600">
            Format looks off — expected something like CCC1330842 or RR1234567.
          </p>
        )}
        {licenseValid && (
          <p className="mt-2 text-xs text-green-600">✓ Format valid.</p>
        )}
      </section>

      {/* Service-area ZIPs */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900">
          2. Manatee County ZIPs you serve
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Pick the ZIPs where you want to mail. Only homes in these ZIPs show up
          in your Property Pipeline tab. Pick at least one. ({zips.size}/25
          selected)
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {zipOptions.map((opt) => {
            const checked = zips.has(opt.zip);
            return (
              <label
                key={opt.zip}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                  checked
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleZip(opt.zip)}
                  className="shrink-0"
                />
                <span className="flex-1 truncate">{opt.label}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {opt.n.toLocaleString()}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Authorization clickwrap */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900">
          3. Direct-mail authorization
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Read this once. We hash this exact text and store the version with
          your account so we can prove what you agreed to (ESIGN-compliant audit
          trail).
        </p>
        <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-800 font-sans">
          {authText}
        </pre>
        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-1 shrink-0"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the direct-mail authorization above.{" "}
            <span className="text-xs text-gray-400">({authVersion})</span>
          </span>
        </label>
      </section>

      {err && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save and open Property Pipeline"}
      </button>
    </form>
  );
}
