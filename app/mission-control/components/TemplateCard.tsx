"use client";

import type { TemplateInfo } from "../template-registry";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  production: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Production Ready" },
  "in-progress": { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "In Progress" },
  partial: { bg: "rgba(255,255,255,0.06)", color: "#666", label: "Partial" },
};

const FEATURE_LABELS: { key: keyof TemplateInfo["features"]; label: string }[] = [
  { key: "floatingCta", label: "Floating CTA" },
  { key: "textUs", label: "Text Us" },
  { key: "reviewBadge", label: "Review Badge" },
  { key: "urgencyBadge", label: "Urgency Badge" },
  { key: "dualCtas", label: "Dual CTAs" },
  { key: "cityPages", label: "City Pages" },
];

export default function TemplateCard({ template }: { template: TemplateInfo }) {
  const status = STATUS_STYLES[template.status];
  const featureCount = Object.values(template.features).filter(Boolean).length;

  return (
    <div
      style={{
        background: "#141420",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 24,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            {/* Color swatches */}
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: template.colors.bg, border: "1px solid rgba(255,255,255,0.15)" }} />
              <div style={{ width: 14, height: 14, borderRadius: 4, background: template.colors.accent }} />
              <div style={{ width: 14, height: 14, borderRadius: 4, background: template.colors.text, border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>{template.name}</h3>
          </div>
          <p style={{ fontSize: 13, color: "#888", margin: 0, maxWidth: 320 }}>{template.description}</p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "4px 10px",
            borderRadius: 6,
            background: status.bg,
            color: status.color,
            whiteSpace: "nowrap",
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12, color: "#666" }}>
        <span>{template.sectionCount} sections</span>
        <span>{featureCount}/{FEATURE_LABELS.length} features</span>
      </div>

      {/* Feature checklist */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {FEATURE_LABELS.map(({ key, label }) => {
          const has = template.features[key];
          return (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 8px",
                borderRadius: 4,
                background: has ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                color: has ? "#22c55e" : "#444",
                border: `1px solid ${has ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {has ? "✓" : "—"} {label}
            </span>
          );
        })}
      </div>

      {/* Preview link */}
      <a
        href={template.demoPath}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: "rgba(99,102,241,0.12)",
          color: "#a78bfa",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Preview Template
      </a>
    </div>
  );
}
