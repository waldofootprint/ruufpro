// Enhanced standalone wrapper — branded header, desktop branding panel, quick-action pills.
// Renders ChatWidget in always-open full-page mode with contractor branding.
// Desktop: slate gradient bg + branding sidebar + chat card.
// Mobile: clean white, full-screen chat.
// All inline styles — no Tailwind — runs on external sites via iframe too.

"use client";

import { useEffect, useRef, useState } from "react";
import ChatWidget from "@/components/chat-widget/ChatWidget";

interface Props {
  contractorId: string;
  businessName: string;
  phone: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  accentColor: string;
  customGreeting: string | null;
  identifier: string;
  googleRating?: number | null;
  googleReviewCount?: number | null;
}

// Derive a dark gradient from an accent color for the desktop background.
// Falls back to slate if no accent provided.
function buildGradient(accent: string): string {
  // Default slate gradient
  return `linear-gradient(145deg, #1e293b 0%, #334155 40%, #475569 70%, #64748b 100%)`;
}

// Derive a darker shade from accent for avatar/send button on the chat card
function darkenForUI(accent: string): string {
  return accent || "#475569";
}

const QUICK_ACTIONS = [
  "Get an Estimate",
  "Our Services",
  "See Reviews",
  "Schedule Inspection",
];

export default function StandaloneChatWrapper({
  contractorId,
  businessName,
  phone,
  logoUrl,
  city,
  state,
  accentColor,
  customGreeting,
  identifier,
  googleRating,
  googleReviewCount,
}: Props) {
  const tracked = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile vs desktop
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fire analytics once per session
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    fetch("/api/chat-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractor_id: contractorId, identifier }),
    }).catch(() => {});
  }, [contractorId, identifier]);

  const firstLetter = businessName.charAt(0).toUpperCase();
  const uiColor = darkenForUI(accentColor);

  // ─── MOBILE LAYOUT ───
  if (isMobile) {
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column" as const,
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: "#f8fafc",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: uiColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16, fontWeight: 700,
              }}>
                {firstLetter}
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>
                {businessName}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.3 }}>
                {city}, {state}
              </div>
            </div>
          </div>
          {phone && (
            <a
              href={`tel:${phone}`}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: uiColor, textDecoration: "none",
                padding: "7px 14px", borderRadius: 20,
                background: "#f1f5f9", border: "1px solid #e2e8f0", fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call us
            </a>
          )}
        </div>

        {/* ChatWidget fills remaining space */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <ChatWidget
            contractorId={contractorId}
            businessName={businessName}
            hasAiChatbot={true}
            accentColor={accentColor}
            fontFamily="'Inter', -apple-system, sans-serif"
            isDarkTheme={false}
            customGreeting={customGreeting}
            isStandalone={true}
          />
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "6px 16px 8px",
          background: "#fff", flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            AI assistant — responses may not always be accurate
          </span>
          <span style={{ fontSize: 10, color: "#cbd5e1" }}>·</span>
          <a
            href="https://ruufpro.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: uiColor, textDecoration: "none", fontWeight: 600 }}
          >
            Powered by RuufPro
          </a>
        </div>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ───
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 48,
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: buildGradient(accentColor),
    }}>
      {/* Branding panel */}
      <div style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: 16,
        maxWidth: 320,
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              style={{
                width: 56, height: 56, borderRadius: 14, objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              {firstLetter}
            </div>
          )}
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
              {businessName}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              {city}, {state}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
          Got a roofing question? Chat with Riley — our AI assistant can help with estimates, services, and scheduling.
        </div>

        {googleRating && googleReviewCount && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <span style={{ color: "#fbbf24", fontSize: 16, letterSpacing: 1 }}>
              {"★".repeat(Math.round(googleRating))}
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              {googleRating} · {googleReviewCount} Google reviews
            </span>
          </div>
        )}

        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
          Powered by{" "}
          <a
            href="https://ruufpro.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 600 }}
          >
            RuufPro
          </a>
        </div>
      </div>

      {/* Chat card */}
      <div style={{
        width: 440,
        height: "calc(100vh - 80px)",
        maxHeight: 700,
        display: "flex",
        flexDirection: "column" as const,
        background: "#f8fafc",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
      }}>
        {/* Chat card header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: uiColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16, fontWeight: 700,
              }}>
                {firstLetter}
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>
                {businessName}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.3 }}>
                {city}, {state}
              </div>
            </div>
          </div>
          {phone && (
            <a
              href={`tel:${phone}`}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: uiColor, textDecoration: "none",
                padding: "7px 14px", borderRadius: 20,
                background: "#f1f5f9", border: "1px solid #e2e8f0", fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call us
            </a>
          )}
        </div>

        {/* ChatWidget */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <ChatWidget
            contractorId={contractorId}
            businessName={businessName}
            hasAiChatbot={true}
            accentColor={accentColor}
            fontFamily="'Inter', -apple-system, sans-serif"
            isDarkTheme={false}
            customGreeting={customGreeting}
            isStandalone={true}
          />
        </div>
      </div>
    </div>
  );
}
