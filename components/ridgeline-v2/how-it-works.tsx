// components/ridgeline-v2/how-it-works.tsx
//
// Editorial three-card "How it works" layout — paper bg, sand cards,
// rust display numerals, Archivo uppercase headline.

"use client";

import React from "react";

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const SAND = "#F4ECDC";
const RUST = "#C2562A";
const BODY = "#3A4A52";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';
const SANS =
  '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

type Step = {
  n: string;
  title: string;
  body: string;
  chip: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Connect your site",
    body: "Paste one line of code into your existing site (or we'll do it for you). Works with Wix, Squarespace, WordPress, GoDaddy — anything.",
    chip: "~5 min",
  },
  {
    n: "02",
    title: "Train Riley & Copilot",
    body: "Upload your past jobs, your service area, your pricing. We feed it all to Riley and Copilot so they sound like you, not a chatbot.",
    chip: "~30 min",
  },
  {
    n: "03",
    title: "Wake up to leads",
    body: "The widget captures quotes 24/7. Riley qualifies the chats. Copilot tells you which leads to call first. You just close them.",
    chip: "every day",
  },
];

export default function HowItWorksV2() {
  return (
    <section
      id="how-it-works"
      style={{ backgroundColor: PAPER, color: INK, fontFamily: SANS }}
      className="w-full"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-20 md:px-12 md:py-28">
        {/* Eyebrow */}
        <div
          style={{ color: RUST, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="flex items-center gap-3 text-[11px] font-semibold uppercase"
        >
          <span
            aria-hidden
            style={{ backgroundColor: RUST }}
            className="block h-px w-7"
          />
          <span>How it works</span>
        </div>

        {/* Heading + subhead */}
        <div className="mt-7 grid items-baseline gap-10 md:grid-cols-[1.6fr_1fr] md:gap-16">
          <h2
            style={{
              fontFamily: DISPLAY,
              color: INK,
              lineHeight: 0.95,
              letterSpacing: "-0.012em",
            }}
            className="m-0 text-[48px] font-extrabold uppercase md:text-[80px]"
          >
            Live in a day.{" "}
            <span style={{ color: RUST }}>Working all night.</span>
          </h2>
          <p
            style={{ color: BODY }}
            className="m-0 max-w-[40ch] pt-3 text-[16px] leading-relaxed md:text-[17px]"
          >
            No long sales calls. No &lsquo;implementation specialist.&rsquo;
            Just three steps and a roof full of leads.
          </p>
        </div>

        {/* Three cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-3 md:gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              style={{ backgroundColor: SAND, border: `2px solid ${INK}` }}
              className="relative flex flex-col p-8 md:p-10"
            >
              {/* corner ticks */}
              <span
                aria-hidden
                style={{ borderColor: RUST }}
                className="pointer-events-none absolute -left-1 -top-1 h-3 w-3 border-t-2 border-l-2"
              />
              <span
                aria-hidden
                style={{ borderColor: RUST }}
                className="pointer-events-none absolute -right-1 -top-1 h-3 w-3 border-t-2 border-r-2"
              />
              <span
                aria-hidden
                style={{ borderColor: RUST }}
                className="pointer-events-none absolute -left-1 -bottom-1 h-3 w-3 border-b-2 border-l-2"
              />
              <span
                aria-hidden
                style={{ borderColor: RUST }}
                className="pointer-events-none absolute -right-1 -bottom-1 h-3 w-3 border-b-2 border-r-2"
              />

              {/* Big numeral */}
              <div
                style={{
                  fontFamily: DISPLAY,
                  color: RUST,
                  lineHeight: 0.85,
                  letterSpacing: "-0.02em",
                }}
                className="text-[88px] font-extrabold md:text-[104px]"
              >
                {s.n}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: DISPLAY,
                  color: INK,
                  lineHeight: 1.0,
                  letterSpacing: "-0.005em",
                }}
                className="mt-8 text-[28px] font-bold uppercase md:text-[34px]"
              >
                {s.title}
              </h3>

              {/* Body */}
              <p
                style={{ color: BODY }}
                className="mt-4 text-[15px] leading-relaxed md:text-[16px]"
              >
                {s.body}
              </p>

              {/* Chip */}
              <div className="mt-8">
                <span
                  style={{
                    backgroundColor: PAPER,
                    color: RUST,
                    border: `1px solid ${RUST}`,
                    fontFamily: MONO,
                    letterSpacing: "0.14em",
                  }}
                  className="inline-block px-3 py-1.5 text-[10.5px] font-semibold uppercase"
                >
                  {s.chip}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom rule */}
        <div
          style={{ borderTop: `1px dashed ${INK}`, color: INK }}
          className="mt-16 flex flex-wrap items-center justify-between gap-4 pt-6 md:mt-20"
        >
          <p
            style={{ color: INK, fontFamily: MONO, letterSpacing: "0.14em" }}
            className="text-[11px] font-semibold uppercase"
          >
            No agency. No integration call. No contract.
          </p>
          <a
            href="/signup"
            style={{
              backgroundColor: RUST,
              color: PAPER,
              fontFamily: MONO,
              letterSpacing: "0.14em",
            }}
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-semibold uppercase transition-opacity hover:opacity-90"
          >
            Start free trial →
          </a>
        </div>
      </div>
    </section>
  );
}
