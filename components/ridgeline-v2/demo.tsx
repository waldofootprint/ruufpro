// components/ridgeline-v2/demo.tsx
//
// Self-contained demo section — heading + estimate widget mockup + three-step strip.
// Drop in as-is. Tailwind required, nothing else.

"use client";

import React, { useState } from "react";

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const SAND = "#F4ECDC";
const LINE = "#E6DDC9";
const RUST = "#C2562A";
const RUST_2 = "#E2855A";
const MUTED = "#6A7580";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';

type Step = {
  n: string;
  label: string;
  visual: "address" | "satellite" | "lead";
};

const STEPS: Step[] = [
  { n: "01", label: "Homeowner enters their address", visual: "address" },
  { n: "02", label: "Satellite measures the roof", visual: "satellite" },
  { n: "03", label: "You get a hot lead in 4 seconds", visual: "lead" },
];

/* ─── Per-box visuals ─── */
function StepVisual({ kind }: { kind: Step["visual"] }) {
  if (kind === "address") {
    return (
      <div
        style={{ borderColor: "rgba(251,247,239,0.2)" }}
        className="flex items-center gap-2 rounded border px-3 py-2.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RUST_2} strokeWidth="2">
          <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <span
          style={{ color: "rgba(251,247,239,0.7)", fontFamily: MONO }}
          className="text-[11px]"
        >
          742 Evergreen Ter
        </span>
        <span
          style={{ backgroundColor: RUST_2 }}
          className="ml-1 inline-block h-3 w-[2px] animate-pulse"
        />
      </div>
    );
  }
  if (kind === "satellite") {
    return (
      <svg width="100%" height="56" viewBox="0 0 200 56" fill="none">
        <defs>
          <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(251,247,239,0.08)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="200" height="56" fill="url(#grid)" />
        <path
          d="M40 40 L40 22 L80 10 L120 22 L160 14 L160 40 Z"
          fill="rgba(226,133,90,0.15)"
          stroke={RUST_2}
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        <circle cx="100" cy="26" r="2" fill={RUST_2} />
        <circle cx="100" cy="26" r="6" fill="none" stroke={RUST_2} strokeWidth="1" opacity="0.5" />
        <text x="168" y="44" fill="rgba(251,247,239,0.6)" fontSize="8" fontFamily={MONO}>
          2,450 sf
        </text>
      </svg>
    );
  }
  return (
    <div
      style={{
        backgroundColor: "rgba(251,247,239,0.06)",
        borderColor: "rgba(251,247,239,0.15)",
      }}
      className="flex items-center gap-2.5 rounded border px-3 py-2"
    >
      <div
        style={{ backgroundColor: RUST }}
        className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold"
      >
        R
      </div>
      <div className="flex-1 leading-tight">
        <p
          style={{ color: PAPER, fontFamily: MONO, letterSpacing: "0.1em" }}
          className="text-[9px] uppercase opacity-60"
        >
          RuufPro · now
        </p>
        <p style={{ color: PAPER }} className="text-[11px] font-semibold">
          🔥 New lead — $14,200
        </p>
      </div>
    </div>
  );
}

/* ─── Mockup widget ─── */
function WidgetMockup() {
  const [address, setAddress] = useState("");
  const [showResult, setShowResult] = useState(false);

  return (
    <div
      style={{ backgroundColor: PAPER, color: INK }}
      className="overflow-hidden rounded-md shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]"
    >
      {/* Browser chrome */}
      <div
        style={{ backgroundColor: SAND, borderBottom: `1px solid ${LINE}` }}
        className="flex items-center gap-2 px-4 py-2.5"
      >
        <div className="flex gap-1.5">
          <span style={{ backgroundColor: LINE }} className="h-2.5 w-2.5 rounded-full" />
          <span style={{ backgroundColor: LINE }} className="h-2.5 w-2.5 rounded-full" />
          <span style={{ backgroundColor: LINE }} className="h-2.5 w-2.5 rounded-full" />
        </div>
        <div
          style={{
            backgroundColor: PAPER,
            color: MUTED,
            fontFamily: MONO,
            letterSpacing: "0.04em",
          }}
          className="ml-2 flex-1 rounded px-3 py-1 text-[11px]"
        >
          your-roofing-site.com
        </div>
      </div>

      {/* Widget body */}
      <div className="px-7 py-9 md:px-10 md:py-11">
        <p
          style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="text-[10px] uppercase"
        >
          Free instant estimate
        </p>
        <h3
          style={{
            fontFamily: DISPLAY,
            color: INK,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
          }}
          className="mt-2 text-[28px] font-extrabold uppercase md:text-[34px]"
        >
          Get your roof price in 30 seconds
        </h3>

        <label
          style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="mt-7 block text-[10px] uppercase"
        >
          Property address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="742 Evergreen Terrace, Austin TX"
          style={{
            backgroundColor: PAPER,
            border: `1px solid ${LINE}`,
            color: INK,
          }}
          className="mt-2 w-full rounded px-3.5 py-3 text-[14px] placeholder:opacity-50 focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setShowResult(true)}
          style={{ backgroundColor: RUST, color: PAPER }}
          className="mt-4 w-full rounded py-3 text-[13px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
        >
          Get my estimate →
        </button>

        <div
          style={{ borderTop: `1px solid ${LINE}` }}
          className={`mt-6 pt-5 transition-opacity ${
            showResult ? "opacity-100" : "opacity-50"
          }`}
        >
          <p
            style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
            className="text-[10px] uppercase"
          >
            Estimate
          </p>
          <p
            style={{
              fontFamily: DISPLAY,
              color: RUST,
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
            }}
            className="mt-1 text-[34px] font-extrabold md:text-[44px]"
          >
            $14,200 — $17,800
          </p>
          <p style={{ color: MUTED }} className="mt-2 text-[12px]">
            2,450 sq ft · Asphalt shingle · Moderate pitch
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Section ─── */
export default function DemoV2() {
  return (
    <section id="demo" style={{ backgroundColor: INK, color: PAPER }} className="w-full">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
        {/* Eyebrow */}
        <p
          style={{ color: RUST_2, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="text-[11px] uppercase"
        >
          Live demo · how it works
        </p>

        {/* Heading */}
        <h2
          style={{
            fontFamily: DISPLAY,
            color: PAPER,
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
          }}
          className="mt-4 text-[44px] font-extrabold uppercase md:text-[68px]"
        >
          Type an address.{" "}
          <span style={{ color: RUST_2 }}>Watch it work.</span>
        </h2>

        {/* Subhead */}
        <p
          style={{ color: "rgba(251, 247, 239, 0.7)" }}
          className="mt-6 max-w-[58ch] text-base leading-relaxed md:text-[17px]"
        >
          This is the exact widget homeowners use on your site. Drop in any
          address — the satellite measures the roof, the price appears, the
          lead lands in your inbox.
        </p>

        {/* Widget mockup */}
        <div className="mx-auto mt-12 max-w-[560px] md:mt-16">
          <WidgetMockup />
        </div>

        {/* Three-step strip */}
        <div
          style={{ backgroundColor: "rgba(251, 247, 239, 0.1)" }}
          className="mt-12 grid grid-cols-1 gap-px overflow-hidden md:mt-16 md:grid-cols-3"
        >
          {STEPS.map((s) => (
            <div key={s.n} style={{ backgroundColor: INK }} className="p-6 md:p-7">
              <p
                style={{ color: RUST_2, fontFamily: MONO, letterSpacing: "0.14em" }}
                className="text-[10px] uppercase"
              >
                {s.n}
              </p>
              <p
                style={{ color: PAPER }}
                className="mt-2 text-[15px] font-semibold leading-snug"
              >
                {s.label}
              </p>
              <div className="mt-4">
                <StepVisual kind={s.visual} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
