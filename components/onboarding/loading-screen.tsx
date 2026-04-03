"use client";

import { useEffect, useState } from "react";

// Animated "Building your website..." screen.
// This is UX theater — the site generates instantly, but the loading
// builds anticipation and perceived value. Each step checks off after a delay.

const STEPS = [
  "Generating hero section",
  "Adding trust badges",
  "Creating service pages",
  "Setting up city pages for Google",
  "Optimizing for search engines",
];

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedSteps((prev) => {
        if (prev >= STEPS.length) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: 32,
    }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: 8 }}>
          Building your website...
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center" }}>
          This only takes a moment
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
        {STEPS.map((step, i) => {
          const done = i < completedSteps;
          const active = i === completedSteps;
          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: done || active ? 1 : 0.3,
                transition: "opacity 0.3s",
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: done ? "#22c55e" : active ? "#e5e7eb" : "#f3f4f6",
                transition: "background 0.3s",
                flexShrink: 0,
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : active ? (
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    border: "2px solid #6366f1",
                    borderTopColor: "transparent",
                    animation: "spin 0.6s linear infinite",
                  }} />
                ) : null}
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: done ? 500 : 400,
                color: done ? "#111827" : "#9ca3af",
              }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
