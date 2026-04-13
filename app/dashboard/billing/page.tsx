// Billing — manage subscription, upgrade, or open Stripe portal.

"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { CreditCard, ExternalLink, Zap } from "lucide-react";

export default function BillingPage() {
  const { tier } = useDashboard();
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Could not open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function upgrade(plan: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tierLabel = tier === "growth" ? "Growth" : tier === "pro" ? "Pro" : "Free";
  const tierPrice = tier === "growth" ? "$299/mo" : tier === "pro" ? "$149/mo" : "$0";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Billing</h1>
      <p className="text-[13px] text-slate-500 mb-8">Manage your subscription and payment method.</p>

      {/* Current plan */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <span className="text-[15px] font-bold text-slate-800">Current Plan</span>
          </div>
          <span className="text-[12px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 uppercase tracking-wider">
            {tierLabel}
          </span>
        </div>
        <p className="text-[28px] font-black text-slate-900">{tierPrice}</p>
        {tier !== "free" && (
          <button
            onClick={openPortal}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" />
            Manage Subscription
          </button>
        )}
      </div>

      {/* Upgrade options */}
      {tier === "free" && (
        <div className="space-y-3">
          <button
            onClick={() => upgrade("pro_monthly")}
            disabled={loading}
            className="w-full flex items-center justify-between bg-amber-600 text-white rounded-xl px-6 py-4 hover:bg-amber-700 transition disabled:opacity-50"
          >
            <div className="text-left">
              <p className="text-[15px] font-bold">Upgrade to Pro</p>
              <p className="text-[12px] text-white/70">Estimate widget + Riley AI + review automation</p>
            </div>
            <span className="text-[18px] font-black">$149/mo</span>
          </button>
          <button
            onClick={() => upgrade("growth_monthly")}
            disabled={loading}
            className="w-full flex items-center justify-between bg-slate-800 text-white rounded-xl px-6 py-4 hover:bg-slate-900 transition disabled:opacity-50"
          >
            <div className="text-left">
              <p className="text-[15px] font-bold">Upgrade to Growth</p>
              <p className="text-[12px] text-white/70">Everything in Pro + SEO city pages + custom domain</p>
            </div>
            <span className="text-[18px] font-black">$299/mo</span>
          </button>
        </div>
      )}

      {tier === "pro" && (
        <button
          onClick={() => upgrade("growth_monthly")}
          disabled={loading}
          className="w-full flex items-center justify-between bg-slate-800 text-white rounded-xl px-6 py-4 hover:bg-slate-900 transition disabled:opacity-50"
        >
          <div className="text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <p className="text-[15px] font-bold">Upgrade to Growth</p>
            </div>
            <p className="text-[12px] text-white/70">Add SEO city pages + custom domain + competitor monitoring</p>
          </div>
          <span className="text-[18px] font-black">$299/mo</span>
        </button>
      )}
    </div>
  );
}
