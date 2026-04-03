"use client";

// Toggle card component for Step 3 — each card represents a site section
// the roofer can turn on/off, like a Squarespace section manager.

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  locked?: boolean; // locked ON, can't disable (e.g. Services)
  children?: React.ReactNode; // expanded content when enabled
}

export default function SectionToggle({ icon, title, description, enabled, onToggle, locked, children }: Props) {
  return (
    <div
      style={{
        background: enabled ? "rgba(99,102,241,0.04)" : "#f9fafb",
        border: `1px solid ${enabled ? "rgba(99,102,241,0.2)" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: 16,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: enabled ? "rgba(99,102,241,0.1)" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: enabled ? "#6366f1" : "#9ca3af" }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{description}</div>
        </div>
        {/* Toggle switch */}
        <button
          onClick={() => !locked && onToggle(!enabled)}
          disabled={locked}
          style={{
            position: "relative",
            width: 44,
            height: 24,
            borderRadius: 12,
            background: enabled ? "#6366f1" : "#d1d5db",
            border: "none",
            cursor: locked ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            flexShrink: 0,
            opacity: locked ? 0.7 : 1,
          }}
        >
          <div style={{
            position: "absolute",
            top: 2,
            left: enabled ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }} />
        </button>
      </div>
      {/* Expanded content */}
      {enabled && children && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
