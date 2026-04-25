// components/ridgeline-v2/final-cta.tsx
"use client";

import React from "react";

const INK = "#0C1F28";
const INK_2 = "#14303D";
const PAPER = "#FBF7EF";
const RUST = "#C2562A";
const RUST_2 = "#E2855A";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';
const SANS =
  '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export default function FinalCTAV2() {
  return (
    <section
      style={{ backgroundColor: INK_2, color: PAPER, fontFamily: SANS }}
      className="relative w-full overflow-hidden"
    >
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(251,247,239,0.05) 0 1px, transparent 1px 28px),
                            repeating-linear-gradient(90deg, rgba(251,247,239,0.05) 0 1px, transparent 1px 28px)`,
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-32">
        {/* Eyebrow */}
        <div
          style={{ color: RUST_2, fontFamily: MONO, letterSpacing: "0.18em" }}
          className="flex items-center gap-3 text-[11px] font-semibold uppercase"
        >
          <span aria-hidden style={{ backgroundColor: RUST_2 }} className="block h-px w-7" />
          <span>The shop&apos;s open · Walk in</span>
        </div>

        {/* Headline */}
        <h2
          style={{
            fontFamily: DISPLAY,
            color: PAPER,
            lineHeight: 0.92,
            letterSpacing: "-0.012em",
          }}
          className="mt-6 max-w-[18ch] text-[56px] font-extrabold uppercase md:text-[112px]"
        >
          Your next lead is{" "}
          <span style={{ color: RUST_2 }}>one click away.</span>
        </h2>

        {/* Subhead */}
        <p
          style={{ color: "rgba(251,247,239,0.7)" }}
          className="mt-7 max-w-[58ch] text-[17px] leading-relaxed md:text-[19px]"
        >
          A real roofing site. A real estimate widget. A real AI that books the
          call. Set up in twenty minutes — free for fourteen days, no card.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="/signup"
            style={{
              backgroundColor: RUST,
              color: PAPER,
              fontFamily: MONO,
              letterSpacing: "0.14em",
            }}
            className="inline-flex items-center gap-2.5 px-7 py-4 text-[12px] font-semibold uppercase transition-opacity hover:opacity-90"
          >
            Start free trial →
          </a>
          <a
            href="#demo"
            style={{
              borderColor: PAPER,
              color: PAPER,
              fontFamily: MONO,
              letterSpacing: "0.14em",
            }}
            className="inline-flex items-center gap-2.5 border-2 px-7 py-4 text-[12px] font-semibold uppercase transition-colors hover:bg-paper hover:text-ink"
          >
            See live demo
          </a>
        </div>

        {/* Trust line */}
        <div
          style={{
            color: "rgba(251,247,239,0.55)",
            fontFamily: MONO,
            letterSpacing: "0.14em",
            borderTop: `1px dashed rgba(251,247,239,0.2)`,
          }}
          className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-[10.5px] uppercase"
        >
          <span>14 days free</span>
          <span style={{ backgroundColor: "rgba(251,247,239,0.3)" }} className="h-1 w-1 rounded-full" />
          <span>No credit card</span>
          <span style={{ backgroundColor: "rgba(251,247,239,0.3)" }} className="h-1 w-1 rounded-full" />
          <span>Cancel in one click</span>
          <span style={{ backgroundColor: "rgba(251,247,239,0.3)" }} className="h-1 w-1 rounded-full" />
          <span>$149/mo flat after</span>
        </div>
      </div>
    </section>
  );
}
