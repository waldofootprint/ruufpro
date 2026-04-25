// components/ridgeline-v2/evidence.tsx
//
// Self-contained evidence section.

"use client";

import React from "react";

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const RUST = "#C2562A";
const RUST_2 = "#E2855A";
const BODY = "#3A4A52";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';
const SANS =
  '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const STATS: Array<{ big: string; label: string; source: string }> = [
  {
    big: "78%",
    label:
      "of homeowners now expect to see pricing online before they even pick up the phone.",
    source: "Source — National Home Improvement Survey, 2025",
  },
  {
    big: "<24h",
    label:
      "is how long the average homeowner waits before giving up on a roofer who hasn't replied.",
    source: "Source — InsideSales / Velocify lead-response benchmark",
  },
  {
    big: "64%",
    label:
      "of all contractor research happens after 6pm — long after your office is closed.",
    source: "Source — Google Search trend data, home services vertical",
  },
];

export default function Evidence() {
  return (
    <section
      style={{ backgroundColor: PAPER, color: INK, fontFamily: SANS }}
      className="w-full"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-12 md:py-28">
        <p
          style={{ color: RUST, fontFamily: MONO, letterSpacing: "0.18em" }}
          className="text-[11px] uppercase"
        >
          The Google update · Dec 2025
        </p>

        <h2
          style={{
            fontFamily: DISPLAY,
            color: INK,
            lineHeight: 1.0,
            letterSpacing: "-0.012em",
          }}
          className="mt-4 text-[44px] font-extrabold uppercase md:text-[68px]"
        >
          Google now <span style={{ color: RUST }}>hides</span> roofers who
          don&apos;t show pricing online.
        </h2>

        <p
          style={{ color: BODY }}
          className="mt-6 max-w-[60ch] text-base leading-relaxed md:text-[17px]"
        >
          In December 2025, Google launched an &ldquo;Online Estimates&rdquo;
          filter for roofing searches. Roofers without instant pricing got
          quietly demoted. Most don&apos;t even know yet — which is exactly why
          this window is open.
        </p>

        <div
          style={{ backgroundColor: INK, color: PAPER }}
          className="mt-12 grid grid-cols-1 md:mt-16 md:grid-cols-3"
        >
          {STATS.map((s, i) => {
            const isLast = i === STATS.length - 1;
            return (
              <div
                key={s.big}
                style={{
                  borderBottom: !isLast ? `1px solid rgba(251,247,239,0.1)` : undefined,
                }}
                className={`p-8 md:p-10 ${
                  !isLast
                    ? "md:border-b-0 md:border-r md:border-r-[rgba(251,247,239,0.1)]"
                    : ""
                }`}
              >
                <div
                  style={{
                    fontFamily: DISPLAY,
                    color: RUST_2,
                    lineHeight: 1,
                    letterSpacing: "-0.015em",
                  }}
                  className="text-[64px] font-extrabold md:text-[96px]"
                >
                  {s.big}
                </div>
                <p
                  style={{ color: PAPER }}
                  className="mt-5 max-w-[28ch] text-[16px] leading-snug md:text-[18px]"
                >
                  {s.label}
                </p>
                <p
                  style={{
                    color: "rgba(251,247,239,0.45)",
                    fontFamily: MONO,
                    letterSpacing: "0.14em",
                  }}
                  className="mt-6 text-[10px] uppercase"
                >
                  {s.source}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
