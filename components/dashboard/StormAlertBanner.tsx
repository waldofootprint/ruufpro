"use client";

// Dismissable storm alert banner for the roofer dashboard.
// Shows when NOAA has active weather alerts in the roofer's service area.
// Links to estimate-settings#storm-surge so the roofer can enable surge pricing.

import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
  serviceZips,
  weatherSurgeEnabled,
}: StormAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [alert, setAlert] = useState<StormAlert | null>(null);

  useEffect(() => {
    if (!contractorId || weatherSurgeEnabled) return;

    // Check localStorage for recent dismissal (don't re-show for 4 hours)
    const dismissKey = `storm-alert-dismissed-${contractorId}`;
    const dismissedAt = localStorage.getItem(dismissKey);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 4 * 60 * 60 * 1000) {
      return;
    }

    // Fetch current weather alerts for this contractor
    async function checkAlerts() {
      try {
        const res = await fetch(`/api/weather-alerts?contractor_id=${contractorId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.alert) {
          setAlert(data.alert);
        }
      } catch {
        // Silent fail — don't block the dashboard
      }
    }
    checkAlerts();
  }, [contractorId, weatherSurgeEnabled]);

  if (dismissed || !alert || weatherSurgeEnabled) return null;

  const surgePercent = Math.round((alert.suggestedMultiplier - 1) * 100);

  const severityStyles: Record<string, { bg: string; border: string; badge: string }> = {
    Extreme: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-600" },
    Severe: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-600" },
    Moderate: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-600" },
  };

  const style = severityStyles[alert.severity] || severityStyles.Moderate;

  function handleDismiss() {
    setDismissed(true);
    if (contractorId) {
      localStorage.setItem(`storm-alert-dismissed-${contractorId}`, Date.now().toString());
    }
  }

  return (
    <div className={`rounded-xl ${style.bg} ${style.border} border p-4 mb-6 relative`}>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 transition-colors"
        aria-label="Dismiss storm alert"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className={`${style.badge} text-white text-xs font-bold px-2 py-1 rounded-md mt-0.5 whitespace-nowrap`}>
          {alert.severity.toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {alert.event} detected in your service area
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Post-storm roofing demand typically increases prices by {surgePercent}%.
            Enable storm surge pricing to keep your estimates competitive with
            real market conditions. You choose the exact amount and duration.
          </p>
          <Link
            href="/dashboard/settings?tab=estimates#storm-surge"
            className="inline-flex items-center gap-1 mt-3 px-4 py-2 rounded-lg bg-[#1B3A4B] text-white text-xs font-bold hover:bg-[#162f3d] transition-colors"
          >
            Review Surge Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
