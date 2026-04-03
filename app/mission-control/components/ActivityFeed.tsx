"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProgressLogItem } from "@/lib/command-center";

export default function ActivityFeed() {
  const [items, setItems] = useState<ProgressLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/command-center/progress-log?limit=20");
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addEntry() {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/command-center/progress-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          tags: ["manual"],
        }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
        setNewTitle("");
        setNewDesc("");
        setAdding(false);
      }
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 60, background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, ProgressLogItem[]> = {};
  for (const item of items) {
    const date = item.logged_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const displayDates = showAll ? dates : dates.slice(0, 2);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Add button */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            background: "#141420",
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: 12,
            color: "#555",
            textAlign: "left",
          }}
        >
          + Log something...
        </button>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ background: "#141420", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: 16 }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What did you ship?"
            style={{ width: "100%", background: "transparent", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, outline: "none", marginBottom: 8 }}
            autoFocus
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Details (optional)"
            rows={2}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#ccc", fontSize: 12, padding: 8, outline: "none", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={addEntry}
              disabled={!newTitle.trim()}
              style={{
                fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: newTitle.trim() ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                color: newTitle.trim() ? "#4ade80" : "#555",
              }}
            >
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(""); setNewDesc(""); }}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: "#555" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      {items.length === 0 && (
        <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>No activity logged yet.</p>
        </div>
      )}

      {displayDates.map((date) => (
        <div key={date}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {date === today ? "Today" : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {grouped[date].map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#141420",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: item.description ? 4 : 0 }}>
                  {item.title}
                </div>
                {item.description && (
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>
                    {item.description.length > 150 ? item.description.slice(0, 150) + "..." : item.description}
                  </div>
                )}
                {item.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {item.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 9, background: "rgba(34,197,94,0.1)", color: "#4ade80", padding: "2px 6px", borderRadius: 4 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Show more */}
      {dates.length > 2 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{ fontSize: 12, color: "#555", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
        >
          Show older activity ({dates.length - 2} more days)
        </button>
      )}
    </div>
  );
}
