"use client";

import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import Link from "next/link";

interface StormAlert {
  event: string;
  severity: string;
  suggestedMultiplier: number;
}

interface StormAlertBannerProps {
  contractorId: string | null;
  serviceZips?: string[];
  weatherSurgeEnabled?: boolean;
}

export default function StormAlertBanner({
  contractorId,
  weatherSurgeEnabled,
}: StormAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [alert, setAlert] = useState<StormAlert | null>(null);

  useEffect(() => {
    if (!contractorId || weatherSurgeEnabled) return;

    const dismissKey = `storm-alert-dismissed-${contractorId}`;
    const dismissedAt = localStorage.getItem(dismissKey);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 4 * 60 * 60 * 1000) {
      return;
    }

    async function checkAlerts() {
      try {
        const res = await fetch(`/api/weather-alerts?contractor_id=${contractorId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.alert) setAlert(data.alert);
      } catch {
        /* silent */
      }
    }
    checkAlerts();
  }, [contractorId, weatherSurgeEnabled]);

  if (dismissed || !alert || weatherSurgeEnabled) return null;

  const surgePercent = Math.round((alert.suggestedMultiplier - 1) * 100);

  function handleDismiss() {
    setDismissed(true);
    if (contractorId) {
      localStorage.setItem(`storm-alert-dismissed-${contractorId}`, Date.now().toString());
    }
  }

  return (
    <div
      className="relative flex items-start gap-4 mb-6"
      style={{
        padding: "16px 20px",
        borderRadius: 18,
        background: "linear-gradient(135deg, rgba(255,237,213,0.65), rgba(254,215,170,0.45))",
        border: "1px solid rgba(249,115,22,0.14)",
        backdropFilter: "blur(22px) saturate(140%)",
        WebkitBackdropFilter: "blur(22px) saturate(140%)",
        boxShadow: "0 6px 14px -4px rgba(249,115,22,0.14)",
      }}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-white"
        style={{
          background: "linear-gradient(135deg, var(--neu-accent), var(--neu-accent-2))",
          boxShadow: "0 10px 20px -4px rgba(249,115,22,0.5)",
        }}
      >
        <Zap className="h-5 w-5" strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-bold tracking-tight" style={{ color: "var(--neu-text)" }}>
          {alert.event} detected in your service area
        </h3>
        <p className="text-[12.5px] mt-0.5" style={{ color: "var(--neu-text-muted)" }}>
          Post-storm demand typically lifts prices by {surgePercent}%. Enable storm surge pricing to stay competitive — you set the amount and duration.
        </p>
      </div>

      <Link href="/dashboard/settings?tab=estimates#storm-surge" className="neu-dark-cta flex-shrink-0">
        Review Surge →
      </Link>

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md transition-colors"
        style={{ color: "var(--neu-text-dim)" }}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
