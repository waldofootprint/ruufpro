// components/ridgeline-v2/faq.tsx
//
// Self-contained FAQ section — "Filed reference" / calm editorial style.

"use client";

import React, { useState } from "react";

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const LINE = "#E6DDC9";
const RUST = "#C2562A";
const MUTED = "#6A7580";
const BODY = "#3A4550";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';
const SANS =
  '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

type Cat = "BILLING" | "SETUP" | "PRODUCT" | "GROWTH";
type Item = { q: string; a: string; tag: Cat; popular?: boolean };

const ITEMS: Item[] = [
  {
    q: "What's the catch",
    a: "There isn't one. 14-day free trial, no card. $149/mo flat after that. Cancel in one click. We make money when RuufPro pays for itself — usually the first month.",
    tag: "BILLING",
    popular: true,
  },
  {
    q: "What happens after the 14-day trial",
    a: "Enter a card or don't. Skip it and everything pauses — widget off, data stays. Reactivate whenever. Pay and it's $149/mo flat until you cancel.",
    tag: "BILLING",
  },
  {
    q: "Can I use the widget on my existing site",
    a: "Yes. One line of code. Squarespace, Wix, WordPress, Webflow, custom — anywhere you can paste HTML. Takes 60 seconds.",
    tag: "SETUP",
  },
  {
    q: "Do I need my own website",
    a: "No. A professional mobile-ready roofer site is included in the $149. We build it. You approve it. Widget lives on it. No extra hosting fee.",
    tag: "SETUP",
  },
  {
    q: "What is Riley",
    a: "An AI chatbot trained on your business — your pricing, your service area, your install process. Homeowners ping her at 11pm. She talks in your voice and books the call.",
    tag: "PRODUCT",
  },
  {
    q: "How long does setup take",
    a: "About 20 minutes on a live call. Load your pricing, ship your widget, done. Most roofers are taking leads before we hang up.",
    tag: "SETUP",
  },
  {
    q: "How accurate are the estimates",
    a: "Within ±10% on 92% of residential roofs. Google satellite gets the square footage exact. Your rates do the rest. It's a ballpark, not a bid — homeowners know that.",
    tag: "PRODUCT",
  },
  {
    q: "How does satellite measurement work",
    a: "Same aerial imagery Google uses for solar installers. We trace the roof polygon, calculate square footage, factor in pitch and facets. Works for every roof visible from above — which is every roof.",
    tag: "PRODUCT",
  },
  {
    q: "How is this different from lead-gen services",
    a: "Lead gen sells the same lead to 4 roofers at $80–$200 each. Most don't convert and you're racing 3 competitors to respond first. RuufPro gives you leads from YOUR site. They're yours.",
    tag: "GROWTH",
  },
  {
    q: "Is there a contract",
    a: "No. Month-to-month. Cancel in one click from the dashboard — no call, no retention offer, no paperwork.",
    tag: "BILLING",
  },
  {
    q: "Do I own my data if I leave",
    a: "Yes. Every lead, every estimate, every contact — exportable to CSV anytime. No questions asked. Your data.",
    tag: "BILLING",
  },
];

export default function FaqV2() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section
      id="faq"
      style={{
        backgroundColor: PAPER,
        backgroundImage: `
          repeating-linear-gradient(0deg, rgba(30,49,66,0.04) 0 1px, transparent 1px 28px),
          repeating-linear-gradient(90deg, rgba(30,49,66,0.04) 0 1px, transparent 1px 28px)
        `,
        color: INK,
        fontFamily: SANS,
      }}
    >
      {/* Header */}
      <div className="mx-auto max-w-[1200px] px-6 pt-20 pb-10 md:px-12 md:pt-24">
        <div style={{ backgroundColor: RUST }} className="mb-7 h-1 w-12" />

        <div
          style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.18em" }}
          className="mb-7 flex items-center gap-3.5 text-[10.5px] uppercase"
        >
          <span style={{ color: INK }} className="font-medium">
            FAQ · Filed reference
          </span>
          <span style={{ borderTop: `1px dashed ${LINE}` }} className="flex-1" />
        </div>

        <div className="grid items-baseline gap-10 md:grid-cols-[1.6fr_1fr] md:gap-16">
          <h2
            style={{
              fontFamily: DISPLAY,
              color: INK,
              lineHeight: 0.98,
              letterSpacing: "-0.012em",
            }}
            className="m-0 text-[44px] font-extrabold uppercase md:text-[80px]"
          >
            The real <span style={{ color: RUST }}>questions.</span>
          </h2>
          <p
            style={{
              color: INK,
              fontFamily: DISPLAY,
              fontStyle: "italic",
              fontWeight: 600,
            }}
            className="m-0 max-w-[34ch] pt-3 text-[18px] leading-relaxed"
          >
            You've been pitched before. You've been burned before. Every
            question we get, filed and answered up front.
          </p>
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-[1200px] px-6 pb-20 md:px-12">
        <div style={{ borderTop: `1px solid ${INK}` }}>
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            const num = String(i + 1).padStart(2, "0");
            return (
              <div
                key={i}
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ borderBottom: `1px dashed ${LINE}` }}
                className="grid cursor-pointer items-start gap-4 py-5 md:gap-5"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(isOpen ? -1 : i);
                  }
                }}
              >
                {/* Mobile meta row */}
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:hidden">
                  <span
                    style={{
                      fontFamily: DISPLAY,
                      color: isOpen ? RUST : INK,
                      letterSpacing: "-0.015em",
                    }}
                    className="text-[28px] font-extrabold leading-none"
                  >
                    {num}
                  </span>
                  <CategoryTag tag={it.tag} popular={it.popular} />
                  <span
                    style={{ fontFamily: MONO, color: isOpen ? RUST : MUTED }}
                    className="text-[20px] leading-none"
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[96px_140px_1fr_40px] md:gap-5">
                  <div className="pt-1">
                    <div
                      style={{
                        fontFamily: MONO,
                        color: MUTED,
                        letterSpacing: "0.16em",
                      }}
                      className="mb-0.5 text-[10px] uppercase"
                    >
                      Q.
                    </div>
                    <div
                      style={{
                        fontFamily: DISPLAY,
                        color: isOpen ? RUST : INK,
                        letterSpacing: "-0.015em",
                        lineHeight: 0.9,
                      }}
                      className="text-[40px] font-extrabold"
                    >
                      {num}
                    </div>
                  </div>

                  <div className="pt-2">
                    <CategoryTag tag={it.tag} popular={it.popular} />
                  </div>

                  <div className="pt-1.5">
                    <div
                      style={{
                        fontFamily: DISPLAY,
                        color: INK,
                        lineHeight: 1.12,
                      }}
                      className="text-[26px] font-bold uppercase"
                    >
                      {it.q}?
                    </div>
                    {isOpen && <Answer text={it.a} />}
                  </div>

                  <div
                    style={{ fontFamily: MONO, color: isOpen ? RUST : MUTED }}
                    className="select-none pt-3 text-right text-[22px] leading-none"
                  >
                    {isOpen ? "−" : "+"}
                  </div>
                </div>

                {/* Mobile question + answer */}
                <div className="md:hidden">
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      color: INK,
                      lineHeight: 1.12,
                    }}
                    className="text-[20px] font-bold uppercase"
                  >
                    {it.q}?
                  </div>
                  {isOpen && <Answer text={it.a} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA card */}
        <div
          style={{ backgroundColor: "#fdfcf8", border: `1px solid ${INK}` }}
          className="mt-12 grid grid-cols-1 items-stretch md:grid-cols-[1fr_auto]"
        >
          <div className="px-6 py-6 md:px-7">
            <div
              style={{
                color: MUTED,
                fontFamily: MONO,
                letterSpacing: "0.14em",
              }}
              className="mb-2.5 flex items-center gap-2.5 text-[10.5px] uppercase"
            >
              <span
                style={{ backgroundColor: RUST }}
                className="inline-block h-0.5 w-7"
              />
              <span>Still have a question</span>
            </div>
            <div
              style={{ fontFamily: DISPLAY, color: INK, lineHeight: 1.05 }}
              className="text-[26px] font-extrabold uppercase md:text-[32px]"
            >
              Call the shop —{" "}
              <span style={{ color: RUST }}>(555) 010-ROOF</span>
            </div>
          </div>
          <button
            type="button"
            style={{
              backgroundColor: INK,
              color: "#fff",
              fontFamily: SANS,
              letterSpacing: "0.04em",
            }}
            className="px-8 py-5 text-[13px] font-semibold uppercase md:min-w-[220px] md:py-0"
          >
            Start 14-day trial →
          </button>
        </div>
      </div>
    </section>
  );
}

function CategoryTag({ tag, popular }: { tag: Cat; popular?: boolean }) {
  return (
    <div>
      <span
        style={{
          fontFamily: MONO,
          letterSpacing: "0.14em",
          color: popular ? "#fff" : INK,
          backgroundColor: popular ? RUST : "transparent",
          border: popular ? "none" : `1px solid ${LINE}`,
        }}
        className="inline-block px-1.5 py-0.5 text-[9.5px] font-medium uppercase"
      >
        {tag}
      </span>
      {popular && (
        <div
          style={{ color: RUST, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="mt-1.5 flex items-center gap-1.5 text-[9.5px] uppercase"
        >
          <span
            style={{ backgroundColor: RUST }}
            className="inline-block h-1.5 w-1.5 rounded-full"
          />
          Most asked
        </div>
      )}
    </div>
  );
}

function Answer({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: `1px solid ${RUST}` }} className="mt-4 pl-4">
      <div
        style={{ fontFamily: MONO, color: RUST, letterSpacing: "0.14em" }}
        className="mb-2.5 text-[10px] font-medium uppercase"
      >
        A. Straight answer
      </div>
      <div
        style={{ fontFamily: SANS, color: BODY }}
        className="max-w-[60ch] text-[15px] font-medium leading-relaxed md:text-[16px]"
      >
        {text}
      </div>
      <div
        style={{
          borderTop: `1px dashed ${LINE}`,
          color: MUTED,
          fontFamily: MONO,
          letterSpacing: "0.14em",
        }}
        className="mt-3.5 flex gap-4 pt-2.5 text-[9.5px] uppercase"
      >
        <span>Filed 04.2026</span>
        <span>·</span>
        <span>Verified by founders</span>
      </div>
    </div>
  );
}
