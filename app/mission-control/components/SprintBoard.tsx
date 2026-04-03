"use client";

import { useState, useEffect, useCallback } from "react";
import type { SprintItem, SprintStatus } from "@/lib/command-center";
import { SPRINT_STATUS_CONFIG } from "@/lib/command-center";

const STATUS_CYCLE: SprintStatus[] = ["next", "in_progress", "shipped"];

export default function SprintBoard() {
  const [items, setItems] = useState<SprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/command-center/sprint");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function cycleStatus(item: SprintItem) {
    const currentIdx = STATUS_CYCLE.indexOf(item.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    await fetch("/api/command-center/sprint", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: nextStatus }),
    });
  }

  async function addItem() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/command-center/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), sort_order: items.length }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [...prev, item]);
        setNewTitle("");
      }
    } finally { setAdding(false); }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 52, background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => {
        const cfg = SPRINT_STATUS_CONFIG[item.status];
        return (
          <div
            key={item.id}
            style={{
              background: "#141420",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {item.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 10, background: cfg.color, color: cfg.text, padding: "2px 8px", borderRadius: 5 }}>
                  {tag}
                </span>
              ))}
              <button
                onClick={() => cycleStatus(item)}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "none",
                  cursor: "pointer",
                  background: cfg.color,
                  color: cfg.text,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {cfg.label}
              </button>
            </div>
          </div>
        );
      })}

      {/* Inline add */}
      <div
        style={{
          display: "flex",
          gap: 8,
          background: "#141420",
          border: "1px dashed rgba(255,255,255,0.1)",
          borderRadius: 10,
          padding: "8px 14px",
        }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add sprint item..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#ccc",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={addItem}
          disabled={adding || !newTitle.trim()}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 5,
            border: "none",
            cursor: newTitle.trim() ? "pointer" : "default",
            background: newTitle.trim() ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
            color: newTitle.trim() ? "#4ade80" : "#555",
          }}
        >
          {adding ? "..." : "+ Add"}
        </button>
      </div>
    </div>
  );
}
