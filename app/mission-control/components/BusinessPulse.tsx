"use client";

import { useState, useEffect } from "react";
import type { BusinessMetric } from "@/lib/command-center";

const METRIC_DISPLAY: Record<string, { color: string; prefix?: string }> = {
  mrr: { color: "#22c55e", prefix: "$" },
  total_signups: { color: "#6366f1" },
  active_trials: { color: "#D4863E" },
  leads_this_week: { color: "#f59e0b" },
  sites_published: { color: "#818cf8" },
};

export default function BusinessPulse() {
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/command-center/metrics")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMetrics(Array.isArray(data) ? data : []))
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, minWidth: 120, height: 68, background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  // Show top 4 metrics
  const display = metrics.slice(0, 4);

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {display.map((m) => {
        const cfg = METRIC_DISPLAY[m.metric_key] || { color: "#888" };
        return (
          <div
            key={m.metric_key}
            style={{
              flex: 1,
              minWidth: 120,
              background: "#141420",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "12px 20px",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: cfg.color }}>
              {cfg.prefix || ""}{Number(m.metric_value).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
              {m.metric_label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
