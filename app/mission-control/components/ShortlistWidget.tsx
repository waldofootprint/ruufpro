"use client";

import { useState, useEffect, useCallback } from "react";
import type { CommandTodo } from "@/lib/command-center";

export default function ShortlistWidget() {
  const [todos, setTodos] = useState<CommandTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/command-center/todos");
      if (res.ok) {
        const data: CommandTodo[] = await res.json();
        setTodos(
          data
            .filter((t) => t.is_shortlist)
            .sort((a, b) => (a.shortlist_rank || 99) - (b.shortlist_rank || 99))
        );
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  async function toggleDone(todo: CommandTodo) {
    const newStatus = todo.status === "done" ? "pending" : "done";
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t)));
    await fetch("/api/command-center/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: todo.id, status: newStatus }),
    });
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 36, background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }} />
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#555", margin: 0 }}>No shortlist items. Add todos with is_shortlist = true.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {todos.map((todo, i) => {
        const done = todo.status === "done";
        return (
          <button
            key={todo.id}
            onClick={() => toggleDone(todo)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "#141420",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: done ? "none" : "2px solid #555",
                background: done ? "#22c55e" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 11,
                color: "#fff",
              }}
            >
              {done && "✓"}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: done ? "#555" : "#D4863E", marginRight: 4 }}>
              {i + 1}.
            </span>
            <span style={{ fontSize: 13, color: done ? "#555" : "#ccc", textDecoration: done ? "line-through" : "none" }}>
              {todo.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
