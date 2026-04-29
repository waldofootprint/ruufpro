"use client";

import { useState, useMemo } from "react";

export function ReviewPromptCard({
  leadId,
  firstName,
  phone,
  defaultBody,
}: {
  leadId: string;
  firstName: string;
  phone: string;
  defaultBody: string;
}) {
  const [body, setBody] = useState(defaultBody);
  const [editing, setEditing] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [done, setDone] = useState<null | "sent" | "skipped">(null);

  const smsHref = useMemo(
    () => `sms:${phone}&body=${encodeURIComponent(body)}`,
    [phone, body]
  );

  async function handleSkip() {
    setSkipping(true);
    try {
      await fetch("/api/reviews/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      setDone("skipped");
    } finally {
      setSkipping(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#e8e8e8]">
        <div className="neu-flat rounded-2xl p-8 max-w-md text-center">
          <div className="text-lg font-medium text-zinc-800">
            {done === "sent" ? "Opened Messages" : "Skipped"}
          </div>
          <a
            href="/dashboard"
            className="mt-6 inline-block text-sm text-zinc-600 underline"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#e8e8e8]">
      <div className="neu-flat rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
          Review request
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-4">
          Text {firstName}?
        </h1>

        {!editing ? (
          <div
            onClick={() => setEditing(true)}
            className="neu-inset rounded-xl p-4 text-sm text-zinc-700 leading-relaxed cursor-text whitespace-pre-wrap"
          >
            {body}
          </div>
        ) : (
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => setEditing(false)}
            rows={6}
            className="neu-inset rounded-xl p-4 text-sm text-zinc-700 leading-relaxed w-full bg-transparent outline-none resize-none"
          />
        )}

        <div className="mt-2 text-xs text-zinc-500">
          Sends from your phone. {phone}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => setEditing(true)}
            className="neu-flat rounded-xl py-3 text-sm font-medium text-zinc-700 active:scale-[0.98]"
          >
            Edit
          </button>
          <button
            onClick={handleSkip}
            disabled={skipping}
            className="neu-flat rounded-xl py-3 text-sm font-medium text-zinc-700 active:scale-[0.98] disabled:opacity-50"
          >
            {skipping ? "…" : "Skip"}
          </button>
          <a
            href={smsHref}
            onClick={() => setDone("sent")}
            className="rounded-xl py-3 text-sm font-semibold text-white text-center bg-zinc-900 active:scale-[0.98]"
          >
            Send
          </a>
        </div>
      </div>
    </div>
  );
}
