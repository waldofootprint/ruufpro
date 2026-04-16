"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1A1A1A",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, maxWidth: 600 }}>
        We use cookies to improve your experience and analyze site traffic.{" "}
        <Link
          href="/cookies"
          style={{ color: "#D4863E", textDecoration: "underline" }}
        >
          Cookie Policy
        </Link>
      </p>
      <button
        onClick={accept}
        style={{
          background: "#D4863E",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 20px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Got it
      </button>
    </div>
  );
}
