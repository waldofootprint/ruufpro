"use client";

import type React from "react";

export const neuInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  color: "var(--neu-text)",
  background: "var(--neu-bg)",
  border: "1px solid var(--neu-border)",
  borderRadius: 10,
  fontFamily: "inherit",
  outline: "none",
  boxShadow:
    "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
};

export const neuInputStyleSmall: React.CSSProperties = {
  ...neuInputStyle,
  padding: "9px 12px",
  fontSize: 14,
  borderRadius: 8,
};

export function NeuField({
  label,
  hint,
  children,
  pill,
  source,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  pill?: React.ReactNode;
  source?: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--neu-text)",
          marginBottom: 6,
          letterSpacing: "-0.005em",
        }}
      >
        <span>{label}</span>
        {pill}
        {source}
      </span>
      {children}
      {hint && (
        <span
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--neu-text-dim)",
            marginTop: 6,
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

export function NeuPrimaryButton({
  label,
  onClick,
  disabled,
  loading,
  type,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(0.5px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.04)")}
      onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      style={{
        width: "100%",
        padding: "13px 18px",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        color: "#fff",
        background:
          "linear-gradient(180deg, #FB8A3C 0%, #F97316 55%, #EA6A0E 100%)",
        border: "none",
        borderRadius: 10,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.7 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 1px rgba(180, 90, 20, 0.22), 0 6px 14px -8px rgba(180, 90, 20, 0.45)",
        transition: "transform 0.12s ease, box-shadow 0.18s ease, filter 0.18s ease",
        fontFamily: "inherit",
      }}
    >
      <span>{loading ? "Saving…" : label}</span>
      {!loading && (
        <span
          aria-hidden
          style={{
            fontSize: 13,
            opacity: 0.9,
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            transform: "translateY(-0.5px)",
          }}
        >
          →
        </span>
      )}
    </button>
  );
}

export function NeuPill({
  variant,
  children,
}: {
  variant: "suggested" | "auto" | "scraped" | "drafted";
  children: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; fg: string; ring: string }> = {
    suggested: { bg: "#FEF3C7", fg: "#92400E", ring: "#FCD34D" },
    auto: { bg: "#D1FAE5", fg: "#065F46", ring: "#6EE7B7" },
    scraped: { bg: "#D1FAE5", fg: "#065F46", ring: "#6EE7B7" },
    drafted: { bg: "#E0E7FF", fg: "#3730A3", ring: "#A5B4FC" },
  };
  const c = colors[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.ring}`,
        borderRadius: 999,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function NeuCard({
  title,
  pill,
  source,
  children,
}: {
  title: string;
  pill?: React.ReactNode;
  source?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="neu-raised" style={{ padding: 22, marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--neu-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        {pill}
        {source}
      </div>
      {children}
    </div>
  );
}
