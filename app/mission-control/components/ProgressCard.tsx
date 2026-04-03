"use client";

import type { ProgressItem } from "../progress-log";

export default function ProgressCard({ item }: { item: ProgressItem }) {
  return (
    <div
      style={{
        background: "#141420",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "16px 20px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
    >
      {/* Title + date */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{item.title}</span>
        <span style={{ fontSize: 11, color: "#555" }}>{item.date}</span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, margin: "0 0 10px" }}>
        {item.description}
      </p>

      {/* File links */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {item.files.map((file) => (
          <a
            key={file.path}
            href={`vscode://file${"/Users/hannahwaldo/RoofReady"}${file.path}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: 6,
              background: "rgba(99,102,241,0.1)",
              color: "#a78bfa",
              border: "1px solid rgba(99,102,241,0.2)",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.2)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.1)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {file.label}
          </a>
        ))}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {item.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.04)",
              color: "#555",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
