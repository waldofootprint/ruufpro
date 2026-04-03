"use client";

import { useState, useEffect, type ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  count?: number;
  accent?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({ id, title, count, accent, defaultOpen = false, children }: Props) {
  const storageKey = `mc-section-${id}`;
  const [open, setOpen] = useState(defaultOpen);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setOpen(stored === "true");
    }
  }, [storageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, String(next));
  }

  return (
    <div>
      <button
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px 0",
          marginBottom: open ? 12 : 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#555",
            transition: "transform 0.2s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ▶
        </span>
        {accent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />}
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>
          {title}
        </span>
        {count !== undefined && <span style={{ fontSize: 11, color: "#555" }}>({count})</span>}
      </button>
      {open && children}
    </div>
  );
}
