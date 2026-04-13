// Custom Domain — Growth tier feature. Add your own domain to your RuufPro site.

"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { Globe, Check, AlertCircle, Trash2, RefreshCw } from "lucide-react";

export default function DomainsPage() {
  const { tier } = useDashboard();
  const [domain, setDomain] = useState("");
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [dnsRecord, setDnsRecord] = useState<{ type: string; name: string; value: string } | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((data) => {
        if (data.domain) setCurrentDomain(data.domain);
      });
  }, []);

  // Growth tier gate
  if (tier !== "growth") {
    return (
      <div className="max-w-[480px] mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <Globe className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-[18px] font-extrabold text-slate-800">Custom Domain — Growth Feature</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[360px] mx-auto">
          Use your own domain (yourbusiness.com) instead of a ruufpro.com subdomain. Available on the Growth plan.
        </p>
        <p className="text-[13px] font-semibold text-amber-600">Requires the $299/mo Growth plan.</p>
        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: "growth_monthly" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-900 transition"
        >
          Upgrade to Growth
        </button>
      </div>
    );
  }

  async function handleAdd() {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", domain: domain.trim() }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to add domain");
    } else {
      setCurrentDomain(data.domain?.name || domain.trim());
      setDnsRecord(data.dns);
      setVerified(false);
    }
    setLoading(false);
  }

  async function handleVerify() {
    if (!currentDomain) return;
    setChecking(true);
    setError("");

    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", domain: currentDomain }),
    });
    const data = await res.json();

    if (data.verified) {
      setVerified(true);
      setDnsRecord(null);
    } else {
      setError("DNS not configured yet. It can take up to 48 hours to propagate.");
    }
    setChecking(false);
  }

  async function handleRemove() {
    if (!currentDomain || !confirm("Remove your custom domain?")) return;
    setLoading(true);

    await fetch("/api/domains", { method: "DELETE" });
    setCurrentDomain(null);
    setDnsRecord(null);
    setVerified(false);
    setDomain("");
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Custom Domain</h1>
      <p className="text-[13px] text-slate-500 mb-8">
        Point your own domain to your RuufPro website. SSL is automatically provisioned.
      </p>

      {currentDomain ? (
        <div className="space-y-4">
          {/* Current domain card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-[15px] font-bold text-slate-800">{currentDomain}</span>
              </div>
              {verified ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  <Check className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                  <AlertCircle className="w-3 h-3" /> Pending
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {!verified && (
                <button
                  onClick={handleVerify}
                  disabled={checking}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
                  {checking ? "Checking..." : "Check DNS"}
                </button>
              )}
              <button
                onClick={handleRemove}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>

          {/* DNS instructions */}
          {dnsRecord && !verified && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="text-[13px] font-bold text-amber-800 mb-2">Configure your DNS</h3>
              <p className="text-[12px] text-amber-700 mb-3">
                Add this record at your domain registrar (GoDaddy, Namecheap, Porkbun, etc.):
              </p>
              <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-amber-100">
                      <th className="text-left px-3 py-2 font-semibold text-amber-800">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-amber-800">Name</th>
                      <th className="text-left px-3 py-2 font-semibold text-amber-800">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-mono text-slate-700">{dnsRecord.type}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">@</td>
                      <td className="px-3 py-2 font-mono text-slate-700">{dnsRecord.value}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-amber-600 mt-2">
                DNS changes can take up to 48 hours. Click &quot;Check DNS&quot; after updating.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Add domain form */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">
            Your domain
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourbusiness.com"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-slate-400 transition"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !domain.trim()}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-900 transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Domain"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[12px] text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
