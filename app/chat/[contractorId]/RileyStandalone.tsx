// Riley standalone chat — full-page client component for iframe embedding.
// Minimal UI, no external dependencies beyond @ai-sdk/react.

"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface Props {
  contractorId: string;
  businessName: string;
}

export default function RileyStandalone({ contractorId, businessName }: Props) {
  const [sessionId, setSessionId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storageKey = `riley-session-${contractorId}`;
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = `${contractorId}-${crypto.randomUUID()}`;
      localStorage.setItem(storageKey, id);
    }
    setSessionId(id);
  }, [contractorId]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { contractorId, sessionId },
    }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif", background: "#fff",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#6366f1",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 700,
        }}>R</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Riley</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>AI Assistant · {businessName}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 40 }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>👋</p>
            <p>Hi! I&apos;m Riley, an AI assistant for <strong>{businessName}</strong>.</p>
            <p style={{ marginTop: 4 }}>Ask me about roofing services, pricing, or scheduling.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div style={{
              maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
              fontSize: 13, lineHeight: 1.5,
              background: msg.role === "user" ? "#6366f1" : "#f1f5f9",
              color: msg.role === "user" ? "#fff" : "#1e293b",
            }}>
              {msg.parts?.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{
              padding: "10px 14px", borderRadius: 12, background: "#f1f5f9",
              color: "#94a3b8", fontSize: 13,
            }}>
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!inputValue.trim() || isLoading) return;
          sendMessage({ text: inputValue });
          setInputValue("");
        }}
        style={{
          padding: "12px 16px", borderTop: "1px solid #e5e7eb",
          display: "flex", gap: 8,
        }}
      >
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Riley a question..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: "10px 16px", borderRadius: 8, border: "none",
            background: isLoading || !inputValue.trim() ? "#cbd5e1" : "#6366f1",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>

      {/* AI disclosure */}
      <div style={{
        padding: "6px 16px 10px", textAlign: "center",
        fontSize: 10, color: "#cbd5e1",
      }}>
        Riley is an AI assistant. Responses may not always be accurate.
      </div>
    </div>
  );
}
