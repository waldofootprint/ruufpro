// CopilotPanel — Floating AI business assistant for the roofer's dashboard.
// FAB button (bottom-right) opens a slide-up chat panel.
// Talks to /api/dashboard/copilot with streaming responses.

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, ChevronUp } from "lucide-react";

interface CopilotMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED_PROMPTS = [
  "How am I doing this week?",
  "Show me hot leads",
  "Any leads I haven't contacted?",
  "Draft a follow-up for my newest lead",
];

export default function CopilotPanel({
  contractorId,
  businessName,
  tier,
}: {
  contractorId: string;
  businessName: string;
  tier: "free" | "pro";
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(`copilot-${contractorId}-${crypto.randomUUID()}`);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && tier === "pro") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, tier]);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0 && tier === "pro") {
      setMessages([{
        role: "assistant",
        text: `Hey! I'm your Copilot. Ask me about your leads, business metrics, or I can draft follow-ups for you. What do you need?`,
      }]);
    }
  }, [open, messages.length, tier]);

  const handleSend = useCallback(async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.text })),
        { role: "user" as const, content: userMsg },
      ];

      const res = await fetch("/api/dashboard/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId: sessionIdRef.current,
        }),
      });

      // Read usage from headers
      const usageHeader = res.headers.get("X-Copilot-Usage");
      if (usageHeader) setUsage(parseInt(usageHeader, 10));

      if (res.status === 429) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          text: "You've hit your daily limit (50 messages). Resets tomorrow morning. Need something urgent? Check your leads dashboard directly.",
        }]);
      } else if (!res.ok) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          text: "Having trouble connecting right now. Try again in a minute.",
        }]);
      } else {
        // Stream the response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("0:")) {
                try {
                  const parsed = JSON.parse(line.slice(2));
                  if (typeof parsed === "string") {
                    fullText += parsed;
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = { role: "assistant", text: fullText };
                      return updated;
                    });
                  }
                } catch {
                  // skip non-JSON lines
                }
              }
            }
          }
        }

        if (!fullText) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              text: "I'm having trouble right now. Make sure the Anthropic API key is set up in Vercel.",
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: "Connection error. Try again in a moment.",
      }]);
    }

    setLoading(false);
  }, [input, loading, messages]);

  // New conversation
  function handleNewChat() {
    sessionIdRef.current = `copilot-${contractorId}-${crypto.randomUUID()}`;
    setMessages([{
      role: "assistant",
      text: "Fresh start. What do you need?",
    }]);
    setUsage(0);
  }

  // Free tier: show upgrade prompt
  if (tier !== "pro") {
    return (
      <>
        {/* Disabled FAB */}
        <button
          onClick={() => setShowUpgrade(true)}
          className="fixed bottom-20 right-5 lg:bottom-7 z-50 w-12 h-12 rounded-full bg-slate-300 text-white shadow-lg flex items-center justify-center cursor-pointer"
          title="Upgrade to Pro for Copilot"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Upgrade modal */}
        {showUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpgrade(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
              <Sparkles className="w-10 h-10 text-slate-800 mx-auto mb-3" />
              <h3 className="text-[18px] font-bold text-slate-900 mb-2">Meet Copilot</h3>
              <p className="text-[14px] text-slate-600 mb-4">
                Your AI business assistant. Ask about leads, get follow-up drafts, track your pipeline — all by talking.
              </p>
              <a
                href="/dashboard/billing"
                className="inline-block px-6 py-2.5 bg-slate-800 text-white rounded-lg text-[14px] font-semibold hover:bg-slate-700 transition"
              >
                Upgrade to Pro — $149/mo
              </a>
              <button
                onClick={() => setShowUpgrade(false)}
                className="block mx-auto mt-3 text-[13px] text-slate-400 hover:text-slate-600 transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-5 lg:bottom-7 z-50 w-12 h-12 rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-all hover:scale-105 flex items-center justify-center"
          title="Open Copilot"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 lg:bottom-7 z-50 w-[400px] max-w-[calc(100vw-40px)] h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-white text-[14px] font-semibold">Copilot</div>
                <div className="text-white/50 text-[11px]">{usage}/50 today</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="text-white/50 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
                title="New conversation"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/50 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.text || (loading ? "..." : "")}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts — show only on first message */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[11px] font-medium hover:bg-slate-100 hover:border-slate-300 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="border-t border-slate-200 px-4 py-3 flex gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your leads..."
              maxLength={1000}
              className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-40 transition hover:bg-slate-700"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
