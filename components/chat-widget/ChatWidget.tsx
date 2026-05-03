// ChatWidget — Riley, the 24/7 AI assistant on contractor websites.
// Floating bubble (bottom-right) → slide-up chat panel.
// Uses Vercel AI SDK v6 useChat hook for streaming responses.
// All inline styles — no Tailwind dependency (works on embedded sites).

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { scoreLeadFromChat } from "@/lib/lead-scoring";
import { detectIntent } from "@/lib/intent-detection";
import { ESTIMATE_DISCLAIMER } from "@/lib/estimate";

interface ChatWidgetProps {
  contractorId: string;
  businessName: string;
  hasAiChatbot: boolean;
  accentColor: string;
  fontFamily: string;
  isDarkTheme?: boolean;
  customGreeting?: string | null;
  isStandalone?: boolean;
}

interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  smsConsent: boolean;
}

// Validate CSS color — only hex, rgb(), or known names. Reject injection attempts.
function sanitizeColor(color: string): string {
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) return color;
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(color)) return color;
  return "#6366f1"; // default fallback
}

export default function ChatWidget({
  contractorId,
  businessName,
  hasAiChatbot,
  accentColor: rawAccentColor,
  fontFamily,
  isDarkTheme = false,
  customGreeting,
  isStandalone = false,
}: ChatWidgetProps) {
  const accentColor = sanitizeColor(rawAccentColor);
  const [isOpen, setIsOpen] = useState(isStandalone);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    const storageKey = `riley-session-${contractorId}`;
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = `${contractorId}-${crypto.randomUUID()}`;
      localStorage.setItem(storageKey, id);
    }
    return id;
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadDismissedAt, setLeadDismissedAt] = useState(0);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: "", phone: "", email: "", address: "", smsConsent: false });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [capped, setCapped] = useState(false);
  const [chatError, setChatError] = useState("");
  const userMsgCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Last user text + retry guard so a transient Anthropic hiccup can auto-retry once.
  const lastUserTextRef = useRef<string>("");
  const retryingRef = useRef(false);

  // Restore lead captured state
  useEffect(() => {
    if (localStorage.getItem(`riley-captured-${contractorId}`) === "true") {
      setLeadCaptured(true);
    }
  }, [contractorId]);

  // Strip legal suffixes + trailing period from business name
  const cleanName = businessName
    .replace(/\s*(LLC|Inc\.?|Corp\.?|L\.?L\.?C\.?|PLLC)\s*$/i, "")
    .replace(/\.\s*$/, "")
    .trim();
  const greeting = customGreeting || `Hi! I'm Riley, an AI assistant for ${cleanName}. I can answer questions about our roofing services, pricing, and availability. What can I help you with?`;

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { contractorId, sessionId },
    }),
    messages: [
      {
        id: "greeting",
        role: "assistant" as const,
        content: greeting,
        parts: [{ type: "text" as const, text: greeting }],
        createdAt: new Date(),
      },
    ],
    onFinish: () => {
      setChatError("");
      const count = userMsgCountRef.current;
      // Stage-based lead form trigger — compute stage from conversation
      const chatMsgs = messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
        parts: m.parts as Array<{ type: string; text?: string }> | undefined,
      }));
      const { stage, captureSignals } = detectIntent(chatMsgs, { leadCaptured });
      if (!leadCaptured && !showLeadForm) {
        // Strong signals — show form immediately regardless of stage
        const strongSignals: string[] = [
          "provided_address", "asked_scheduling", "emergency_detected",
          "estimate_complete", "deciding_stage",
        ];
        // Warm signals — show form only if past greeting stage
        const warmSignals: string[] = [
          "repeated_price_question", "high_engagement",
        ];
        const hasStrong = captureSignals.some((s) => strongSignals.includes(s));
        const hasWarm = captureSignals.some((s) => warmSignals.includes(s));
        const warmEligible = hasWarm && stage !== "greeting";
        // Stage-based fallback (original logic)
        const showStages = ["consideration", "decision", "close"];
        const stageReady = showStages.includes(stage);

        const shouldShow = hasStrong || warmEligible || stageReady;

        if (shouldShow && leadDismissedAt === 0) {
          setShowLeadForm(true);
        } else if (shouldShow && leadDismissedAt > 0 && count > leadDismissedAt + 3) {
          setShowLeadForm(true);
        }
      }
      if (count >= 10) {
        setCapped(true);
      }
    },
    onError: (error) => {
      const msg = error?.message || "";
      // Server surfaces transient Anthropic errors as 503 + {"retryable":true}.
      // Auto-retry once silently so a momentary overload doesn't burn a user turn.
      const transient =
        !retryingRef.current &&
        lastUserTextRef.current &&
        (msg.includes("503") || msg.includes("retryable") || msg.toLowerCase().includes("briefly busy"));
      if (transient) {
        retryingRef.current = true;
        const text = lastUserTextRef.current;
        setTimeout(() => {
          sendMessage({ text });
          setTimeout(() => { retryingRef.current = false; }, 1000);
        }, 1200);
        return;
      }
      retryingRef.current = false;
      if (msg.includes("429") || msg.toLowerCase().includes("too many")) {
        setChatError("Riley is getting a lot of questions right now. Try again in a moment!");
      } else {
        setChatError("Having trouble connecting — please try again.");
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Persist messages to localStorage (with timestamp for TTL)
  useEffect(() => {
    if (messages.length > 1 && sessionId) {
      localStorage.setItem(`riley-messages-${contractorId}`, JSON.stringify({
        ts: Date.now(),
        msgs: messages,
      }));
    }
  }, [messages, contractorId, sessionId]);

  // Restore messages from localStorage on mount (24-hour TTL)
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`riley-messages-${contractorId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Support both old format (array) and new format ({ts, msgs})
        const msgs = Array.isArray(parsed) ? parsed : parsed?.msgs;
        const ts = Array.isArray(parsed) ? 0 : parsed?.ts ?? 0;
        // Clear if older than 24 hours
        if (ts > 0 && Date.now() - ts > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(`riley-messages-${contractorId}`);
          localStorage.removeItem(`riley-captured-${contractorId}`);
          return;
        }
        if (Array.isArray(msgs) && msgs.length > 1) {
          setMessages(msgs);
          const userMsgCount = msgs.filter((m: { role: string }) => m.role === "user").length;
          userMsgCountRef.current = userMsgCount;
          if (userMsgCount >= 10) setCapped(true);
          // Signal-based form restore: recompute intent from restored messages
          if (!leadCaptured) {
            const restored = msgs.map((m: { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }) => ({
              role: m.role,
              content: typeof m.content === "string" ? m.content : "",
              parts: m.parts,
            }));
            const { captureSignals: signals } = detectIntent(restored, { leadCaptured: false });
            if (signals.length > 0) setShowLeadForm(true);
          }
        }
      } catch {
        // Ignore corrupted localStorage
      }
    }
  }, [sessionId, contractorId, setMessages, leadCaptured]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || capped || isLoading) return;
    setInputValue("");
    userMsgCountRef.current += 1;
    lastUserTextRef.current = text;
    retryingRef.current = false;
    sendMessage({ text });
  }, [inputValue, capped, isLoading, sendMessage]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSend();
    },
    [handleSend]
  );

  // Basic US phone validation — 10+ digits after stripping non-numeric
  function isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  // Basic email validation
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Lead capture submission — server-side insert + notify via /api/leads
  async function handleLeadSubmit() {
    if (!leadForm.name || !leadForm.phone) return;
    if (!isValidPhone(leadForm.phone)) return;
    setSubmittingLead(true);

    // Score lead temperature from conversation
    const temperature = scoreLeadFromChat(messages);

    // Only include email if it passes basic validation
    const validEmail = leadForm.email && isValidEmail(leadForm.email) ? leadForm.email : null;

    const leadPayload = {
      contractor_id: contractorId,
      lead_name: leadForm.name,
      lead_phone: leadForm.phone,
      lead_email: validEmail,
      lead_address: leadForm.address || null,
      source: "ai_chatbot",
      sms_consent: leadForm.smsConsent,
      temperature,
      chat_session_id: sessionId || undefined,
    };

    // Server-side insert + notify (with one retry on failure)
    const sendNotify = () => fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadPayload),
    });

    sendNotify().catch(() => {
      // Retry once after 2 seconds
      setTimeout(() => sendNotify().catch(() => {}), 2000);
    });

    setLeadCaptured(true);
    setShowLeadForm(false);
    setSubmittingLead(false);
    localStorage.setItem(`riley-captured-${contractorId}`, "true");

    // Add confirmation message
    const confirmMsg = `Great! ${cleanName} will be in touch with you soon. Is there anything else I can help you with in the meantime?`;
    setMessages([
      ...messages,
      {
        id: `lead-confirm-${Date.now()}`,
        role: "assistant" as const,
        content: confirmMsg,
        parts: [{ type: "text" as const, text: confirmMsg }],
        createdAt: new Date(),
      },
    ]);
  }

  if (!hasAiChatbot) return null;

  // --- Colors ---
  const panelBg = isDarkTheme ? "#1A1A1A" : "#FFFFFF";
  const panelText = isDarkTheme ? "#F5F5F5" : "#1A1A1A";
  const mutedText = isDarkTheme ? "#999" : "#666";
  const inputBg = isDarkTheme ? "#2A2A2A" : "#F5F3F0";
  const inputBorder = isDarkTheme ? "#444" : "#E2E8F0";
  const botBubbleBg = isDarkTheme ? "#2A2A2A" : "#F0EFED";
  const userBubbleBg = accentColor;
  const userBubbleText = "#FFFFFF";

  // Get text content from message (v6 uses parts array)
  function getMessageText(msg: { content?: string; parts?: Array<{ type: string; text?: string }> }): string {
    if (msg.parts) {
      return msg.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text)
        .join("");
    }
    return msg.content || "";
  }

  // --- Bubble (closed state) — skip for standalone mode ---
  if (!isOpen && !isStandalone) {
    return (
      <>
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 300);
          }}
          aria-label="Chat with Riley"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: accentColor,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
        {/* Tooltip */}
        <style>{`
          @media (min-width: 769px) {
            button[aria-label="Chat with Riley"]:hover + .riley-tooltip {
              opacity: 1 !important;
              transform: translateX(0) !important;
            }
          }
        `}</style>
        <div
          className="riley-tooltip"
          style={{
            position: "fixed",
            bottom: 36,
            right: 88,
            zIndex: 999,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 13,
            fontFamily,
            fontWeight: 500,
            whiteSpace: "nowrap",
            opacity: 0,
            transform: "translateX(8px)",
            transition: "opacity 0.2s, transform 0.2s",
            pointerEvents: "none",
          }}
        >
          Chat with Riley
        </div>
      </>
    );
  }

  // --- Panel (open state) ---
  return (
    <>
      {/* Mobile: full-screen overlay */}
      <style>{`
        @media (max-width: 640px) {
          .riley-panel {
            width: calc(100% - 16px) !important;
            height: 80vh !important;
            bottom: 8px !important;
            right: 8px !important;
            border-radius: 16px !important;
          }
        }
        @keyframes rileyBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
      <div
        className={isStandalone ? "" : "riley-panel"}
        style={isStandalone ? {
          position: "absolute" as const,
          inset: 0,
          zIndex: 1,
          background: panelBg,
          display: "flex",
          flexDirection: "column" as const,
          overflow: "hidden",
          fontFamily,
        } : {
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 370,
          height: 520,
          maxHeight: "85vh",
          background: panelBg,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column" as const,
          overflow: "hidden",
          fontFamily,
        }}
      >
        {/* Header — hidden in standalone mode (branded header is in StandaloneChatWrapper) */}
        {!isStandalone && (
        <div
          style={{
            background: accentColor,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              R
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
                Riley
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4ADE80",
                    display: "inline-block",
                  }}
                />
                AI Assistant · Online 24/7
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        )}

        {/* Messages */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg) => {
            const isUser = (msg.role as string) === "user";
            // Render each part of the message (text, tool results, etc.)
            const parts = (msg as { parts?: Array<{ type: string; text?: string; result?: unknown }> }).parts;
            if (parts && parts.length > 0) {
              return parts.map((part, idx) => {
                if (part.type === "text" && part.text) {
                  return (
                    <div
                      key={`${msg.id}-${idx}`}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "82%",
                          padding: "10px 14px",
                          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: isUser ? userBubbleBg : botBubbleBg,
                          color: isUser ? userBubbleText : panelText,
                          fontSize: 14,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {part.text}
                      </div>
                    </div>
                  );
                }
                if (part.type === "tool-getEstimate" && part.result) {
                  const est = part.result as { success: boolean; estimates?: Array<{ label: string; rangeDisplay: string; material: string }>; roofAreaSqft?: number; isSatellite?: boolean; fallbackMessage?: string };
                  if (!est.success) return null; // Riley handles the error in text
                  return (
                    <div
                      key={`${msg.id}-est-${idx}`}
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "90%",
                          width: "100%",
                          borderRadius: 12,
                          overflow: "hidden",
                          border: `1px solid ${isDarkTheme ? "#333" : "#E5E7EB"}`,
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            background: accentColor,
                            padding: "10px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                            Your Roof Estimate
                          </span>
                          {est.isSatellite && (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: 10,
                                color: "rgba(255,255,255,0.8)",
                                background: "rgba(255,255,255,0.15)",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Satellite-measured
                            </span>
                          )}
                        </div>
                        {/* Roof info */}
                        {est.roofAreaSqft && (
                          <div
                            style={{
                              padding: "8px 14px",
                              background: isDarkTheme ? "#222" : "#F9FAFB",
                              fontSize: 12,
                              color: mutedText,
                              borderBottom: `1px solid ${isDarkTheme ? "#333" : "#E5E7EB"}`,
                            }}
                          >
                            {est.roofAreaSqft.toLocaleString()} sqft roof
                          </div>
                        )}
                        {/* Material options */}
                        <div style={{ background: isDarkTheme ? "#1A1A1A" : "#fff" }}>
                          {est.estimates?.map((mat, i) => (
                            <div
                              key={mat.material}
                              style={{
                                padding: "10px 14px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderTop: i > 0 ? `1px solid ${isDarkTheme ? "#2A2A2A" : "#F3F4F6"}` : "none",
                              }}
                            >
                              <span style={{ fontSize: 13, color: panelText, fontWeight: 500 }}>
                                {mat.label}
                              </span>
                              <span style={{ fontSize: 13, color: accentColor, fontWeight: 700 }}>
                                {mat.rangeDisplay}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Disclaimer — 12px minimum for legal conspicuousness */}
                        <div
                          style={{
                            padding: "8px 14px",
                            background: isDarkTheme ? "#222" : "#F9FAFB",
                            fontSize: 12,
                            color: mutedText,
                            borderTop: `1px solid ${isDarkTheme ? "#333" : "#E5E7EB"}`,
                            lineHeight: 1.4,
                          }}
                        >
                          {ESTIMATE_DISCLAIMER}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              });
            }
            // Fallback for messages without parts array
            const text = getMessageText(msg);
            if (!text) return null;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: isUser ? userBubbleBg : botBubbleBg,
                    color: isUser ? userBubbleText : panelText,
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {text}
                </div>
              </div>
            );
          })}

          {/* Error message */}
          {chatError && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: "14px 14px 14px 4px",
                  background: isDarkTheme ? "#3A2020" : "#FEF2F2",
                  color: isDarkTheme ? "#FCA5A5" : "#991B1B",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {chatError}
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px 14px 14px 4px",
                  background: botBubbleBg,
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: mutedText,
                      display: "inline-block",
                      animation: `rileyBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Lead capture form */}
        {showLeadForm && !leadCaptured && (
          <div
            style={{
              padding: "12px 14px",
              borderTop: `1px solid ${inputBorder}`,
              background: isDarkTheme ? "#222" : "#FAFAF8",
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: accentColor, marginBottom: 8 }}>
              Want {cleanName} to follow up? Leave your info:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                placeholder="Your name *"
                aria-label="Your name"
                aria-required="true"
                value={leadForm.name}
                onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: 6,
                  background: inputBg,
                  color: panelText,
                  outline: "none",
                  fontFamily,
                  boxSizing: "border-box" as const,
                }}
              />
              <input
                placeholder="Phone number *"
                aria-label="Phone number"
                aria-required="true"
                type="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: `1px solid ${leadForm.phone && !isValidPhone(leadForm.phone) ? "#EF4444" : inputBorder}`,
                  borderRadius: 6,
                  background: inputBg,
                  color: panelText,
                  outline: "none",
                  fontFamily,
                  boxSizing: "border-box" as const,
                }}
              />
              {leadForm.phone && !isValidPhone(leadForm.phone) && (
                <p style={{ fontSize: 11, color: "#EF4444", margin: "2px 0 0" }}>Enter a valid 10-digit phone number</p>
              )}
              <input
                placeholder="Email (optional)"
                aria-label="Email address"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: 6,
                  background: inputBg,
                  color: panelText,
                  outline: "none",
                  fontFamily,
                  boxSizing: "border-box" as const,
                }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={leadForm.smsConsent}
                  onChange={(e) => setLeadForm((f) => ({ ...f, smsConsent: e.target.checked }))}
                  style={{ width: 14, height: 14, accentColor: accentColor, cursor: "pointer" }}
                />
                <span style={{ fontSize: 11, color: mutedText, lineHeight: 1.3 }}>
                  OK to text me at this number
                </span>
              </label>
              <p style={{ fontSize: 10, color: mutedText, margin: "2px 0 0", lineHeight: 1.3, opacity: 0.7 }}>
                By submitting, you confirm you are 18 or older.
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleLeadSubmit}
                  disabled={!leadForm.name || !leadForm.phone || !isValidPhone(leadForm.phone) || submittingLead}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: accentColor,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily,
                    opacity: !leadForm.name || !leadForm.phone || !isValidPhone(leadForm.phone) || submittingLead ? 0.5 : 1,
                  }}
                >
                  {submittingLead ? "Sending..." : "Connect me!"}
                </button>
                <button
                  onClick={() => { setShowLeadForm(false); setLeadDismissedAt(userMsgCountRef.current); }}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    color: mutedText,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily,
                  }}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            padding: "10px 14px",
            borderTop: `1px solid ${inputBorder}`,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
            background: panelBg,
          }}
        >
          {capped ? (
            <p
              style={{ fontSize: 13, color: mutedText, textAlign: "center", width: "100%", margin: 0, cursor: !leadCaptured ? "pointer" : "default" }}
              onClick={() => { if (!leadCaptured) setShowLeadForm(true); }}
            >
              {leadCaptured
                ? `Thanks for chatting! ${cleanName} will be in touch soon.`
                : `I'd love to keep helping — tap here to have ${cleanName} reach out!`}
            </p>
          ) : (
            <>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  aria-label="Type a message to Riley"
                  maxLength={2000}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 20,
                    background: inputBg,
                    color: panelText,
                    outline: "none",
                    fontFamily,
                    boxSizing: "border-box" as const,
                  }}
                />
                {userMsgCountRef.current >= 8 && userMsgCountRef.current < 10 && !capped && (
                  <span style={{ position: "absolute", right: 12, top: -16, fontSize: 10, color: mutedText }}>
                    {10 - userMsgCountRef.current} message{10 - userMsgCountRef.current > 1 ? "s" : ""} left
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: inputValue.trim() ? accentColor : isDarkTheme ? "#333" : "#E2E8F0",
                  border: "none",
                  cursor: inputValue.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={inputValue.trim() ? "#fff" : mutedText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </>
          )}
        </form>
      </div>
    </>
  );
}
