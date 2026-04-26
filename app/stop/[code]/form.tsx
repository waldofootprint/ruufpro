"use client";

import { useState } from "react";

export function OptOutForm({
  code,
  businessName,
}: {
  code: string;
  businessName: string;
}) {
  const [scope, setScope] = useState<"contractor" | "global">("contractor");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (done) {
    return (
      <div style={{ padding: 16, background: "#f0f9f4", borderRadius: 8, color: "#22543d" }}>
        ✓ You&apos;re unsubscribed{scope === "global" ? " from all RuufPro-sent mail" : ` from ${businessName}`}. Allow up to 7 days for in-flight mail to clear.
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErr(null);
        try {
          const r = await fetch(`/api/stop/${code}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scope }),
          });
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error ?? "Request failed");
          }
          setDone(true);
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
          setSubmitting(false);
        }
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <input
          type="radio"
          name="scope"
          value="contractor"
          checked={scope === "contractor"}
          onChange={() => setScope("contractor")}
          style={{ marginTop: 4 }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>Stop mail from {businessName}</div>
          <div style={{ fontSize: 13, color: "#666" }}>Other contractors using RuufPro can still send.</div>
        </div>
      </label>
      <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <input
          type="radio"
          name="scope"
          value="global"
          checked={scope === "global"}
          onChange={() => setScope("global")}
          style={{ marginTop: 4 }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>Stop all RuufPro-sent mail</div>
          <div style={{ fontSize: 13, color: "#666" }}>Blocks every contractor on the platform.</div>
        </div>
      </label>
      {err && <div style={{ color: "#b22", fontSize: 14 }}>{err}</div>}
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "12px 16px",
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: submitting ? "wait" : "pointer",
          marginTop: 8,
        }}
      >
        {submitting ? "Submitting…" : "Confirm opt-out"}
      </button>
    </form>
  );
}
