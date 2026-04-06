"use client";

import { useEffect, useState } from "react";
import { THEME } from "./theme";

type Props = {
  hasEstimateWidget: boolean;
  phone: string;
};

export default function FloatingEstimateCTA({ hasEstimateWidget, phone }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [targetInView, setTargetInView] = useState(false);

  const phoneClean = phone.replace(/\D/g, "");

  useEffect(() => {
    if (sessionStorage.getItem("ruufpro-cta-dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    const targets = [
      document.getElementById("estimate"),
      document.getElementById("estimate-section"),
      document.getElementById("contact"),
    ].filter(Boolean) as HTMLElement[];

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((e) => e.isIntersecting);
        setTargetInView(anyVisible);
      },
      { threshold: 0.1 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  function handleEstimate() {
    const targetId = hasEstimateWidget ? "estimate-section" : "contact";
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem("ruufpro-cta-dismissed", "1");
  }

  if (dismissed || targetInView) return null;

  return (
    <>
      {/* MOBILE: Full-width sticky bottom bar — 48px tap targets, Call + Estimate side by side
          Research: phone callers convert 37% vs 3-5% forms (Q3). 82% of traffic is mobile (Q2). */}
      <div
        className="mobile-cta-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "none", // hidden by default, shown via media query
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.08)",
          padding: "8px 12px",
          gap: "8px",
        }}
      >
        <a
          href={`tel:${phoneClean}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            minHeight: "48px",
            background: "#0F1B2D",
            color: "#FFFFFF",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "'Sora', system-ui, sans-serif",
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          Call Now
        </a>
        <button
          onClick={handleEstimate}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            minHeight: "48px",
            background: THEME.ctaBg,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "'Sora', system-ui, sans-serif",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(232,114,12,0.3)",
          }}
        >
          Free Estimate
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* DESKTOP: Original floating pill — centered bottom */}
      <div
        className="desktop-cta-pill"
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        <button
          onClick={handleEstimate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 28px",
            background: "linear-gradient(135deg, #E8720C, #D4650A)",
            color: "#fff",
            border: "none",
            borderRadius: "50px 0 0 50px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(232, 114, 12, 0.4), 0 2px 8px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          Get Free Estimate
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 48,
            background: "rgba(232, 114, 12, 0.9)",
            color: "#fff",
            border: "none",
            borderRadius: "0 50px 50px 0",
            borderLeft: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      {/* Responsive: show mobile bar on small screens, desktop pill on large */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-cta-bar { display: flex !important; }
          .desktop-cta-pill { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-cta-bar { display: none !important; }
          .desktop-cta-pill { display: flex !important; }
        }
      `}</style>
    </>
  );
}
