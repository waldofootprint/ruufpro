"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Check } from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

const PRO_PERKS = [
  "Estimate widget on your site",
  "Riley AI chatbot",
  "Review request automation",
  "CRM integrations (Jobber)",
  "Copilot + Lead insights",
];

export function BillingTab() {
  const { tier } = useDashboard();
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
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

  const isPro = tier === "pro";

  return (
    <div className="space-y-5">
      <SettingsSection title="Current Plan">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <CreditCard className="h-5 w-5" style={{ color: "var(--neu-accent)" }} />
              <span className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                {isPro ? "RuufPro Pro" : "Free"}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1"
                style={{
                  borderRadius: 999,
                  color: isPro ? "var(--neu-accent)" : "var(--neu-text-muted)",
                  background: "var(--neu-bg)",
                  boxShadow:
                    "inset 1.5px 1.5px 3px var(--neu-inset-dark), inset -1.5px -1.5px 3px var(--neu-inset-light)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: isPro ? "var(--neu-accent)" : "var(--neu-text-muted)",
                    boxShadow: isPro ? "0 0 6px var(--neu-accent)" : "none",
                  }}
                />
                {isPro ? "Active" : "Free Tier"}
              </span>
            </div>
            <p className="text-[28px] font-black" style={{ color: "var(--neu-text)" }}>
              {isPro ? "$149" : "$0"}
              <span className="text-[14px] font-semibold neu-muted">/mo</span>
            </p>
          </div>
          {isPro && (
            <NeuButton variant="flat" onClick={openPortal} disabled={loading}>
              <ExternalLink className="h-4 w-4" />
              Manage Subscription
            </NeuButton>
          )}
        </div>
      </SettingsSection>

      {!isPro && (
        <SettingsSection title="Upgrade to Pro" description="Unlock every tool. $149/mo. Cancel anytime.">
          <ul className="space-y-2">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--neu-text)" }}>
                <div
                  className="neu-flat h-5 w-5 flex items-center justify-center"
                  style={{ borderRadius: 999, color: "var(--neu-accent)" }}
                >
                  <Check className="h-3 w-3" />
                </div>
                {perk}
              </li>
            ))}
          </ul>
          <NeuButton variant="accent" onClick={() => upgrade("pro_monthly")} disabled={loading} className="mt-4">
            {loading ? "Loading…" : "Upgrade — $149/mo"}
          </NeuButton>
        </SettingsSection>
      )}

      {isPro && (
        <SettingsSection
          title="Payment Method &amp; Invoices"
          description="Update card, download invoices, or cancel — all via Stripe."
        >
          <NeuButton variant="flat" onClick={openPortal} disabled={loading}>
            <ExternalLink className="h-4 w-4" />
            Open Stripe Portal
          </NeuButton>
        </SettingsSection>
      )}
    </div>
  );
}
