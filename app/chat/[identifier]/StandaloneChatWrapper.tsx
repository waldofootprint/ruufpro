// Enhanced standalone wrapper — branded header, tap-to-call, Powered by RuufPro footer.
// Renders ChatWidget in always-open full-page mode with contractor branding.
// All inline styles — no Tailwind — runs on external sites via iframe too.

"use client";

import { useEffect, useRef } from "react";
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
}

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
}: Props) {
  const tracked = useRef(false);

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

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#fff",
    }}>
      {/* Branded header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid #e2e8f0",
        flexShrink: 0,
        minHeight: 56,
        background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
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
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#64748b",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Prefer to call?
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

      {/* Footer: AI disclosure + Powered by RuufPro */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "8px 16px",
        borderTop: "1px solid #f1f5f9",
        flexShrink: 0,
        background: "#fff",
      }}>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          AI assistant — responses may not always be accurate
        </span>
        <span style={{ fontSize: 11, color: "#cbd5e1" }}>·</span>
        <a
          href="https://ruufpro.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "#94a3b8",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Powered by RuufPro
        </a>
      </div>
    </div>
  );
}
