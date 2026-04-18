"use client";

// Owner Bar — shows a small top bar with "Edit Site" + "Dashboard" links
// when the authenticated site owner is viewing their own site.
// Invisible to all other visitors.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OwnerBar({ contractorUserId }: { contractorUserId: string }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && data.user.id === contractorUserId) {
        setIsOwner(true);
      }
    });
  }, [contractorUserId]);

  if (!isOwner) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#0F1B2D",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        fontSize: "13px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span style={{ fontWeight: 600 }}>
        You&rsquo;re viewing your live site
      </span>
      <div style={{ display: "flex", gap: "12px" }}>
        <a
          href="/dashboard"
          style={{
            color: "#E8722A",
            background: "rgba(232,114,42,0.15)",
            padding: "5px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
