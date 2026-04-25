// components/ridgeline-v2/pricing.tsx
"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const SAND = "#F4ECDC";
const LINE = "#E6DDC9";
const RUST = "#C2562A";
const MUTED = "#6A7580";
const BODY = "#3A4A52";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';
const SANS =
  '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const INCLUDED = [
  "Calculator widget — embeds on any site",
  "Riley AI chatbot — 24/7 homeowner questions",
  "Lead dashboard + smart intel",
  "Review automation — Google reviews on autopilot",
  "Custom branding — your colors, your logo",
  "Unlimited leads · no per-lead fees",
];

function useCheckout() {
  const [loading, setLoading] = useState<string | null>(null);
  async function checkout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      window.location.href = data.url || "/signup";
    } catch {
      window.location.href = "/signup";
    } finally {
      setLoading(null);
    }
  }
  return { checkout, loading };
}

export default function PricingV2() {
  const { checkout, loading } = useCheckout();

  return (
    <section
      id="pricing"
      style={{ backgroundColor: PAPER, color: INK, fontFamily: SANS }}
      className="w-full"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-20 md:px-12 md:py-28">
        {/* Rust kicker */}
        <div style={{ backgroundColor: RUST }} className="mb-7 h-1 w-12" />

        {/* Eyebrow rule */}
        <div
          style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.18em" }}
          className="mb-7 flex items-center gap-3.5 text-[10.5px] uppercase"
        >
          <span style={{ color: INK }} className="font-medium">
            Pricing · One plan · No tiers
          </span>
          <span style={{ borderTop: `1px dashed ${LINE}` }} className="flex-1" />
        </div>

        {/* Heading + lede */}
        <div className="grid items-baseline gap-10 md:grid-cols-[1.6fr_1fr] md:gap-16">
          <h2
            style={{
              fontFamily: DISPLAY,
              color: INK,
              lineHeight: 0.95,
              letterSpacing: "-0.012em",
            }}
            className="m-0 text-[48px] font-extrabold uppercase md:text-[80px]"
          >
            One plan.{" "}
            <span style={{ color: RUST }}>Everything included.</span>
          </h2>
          <p
            style={{ color: BODY }}
            className="m-0 max-w-[36ch] pt-3 text-[16px] leading-relaxed md:text-[17px]"
          >
            No setup fees. No per-lead charges. No contracts. One flat number,
            cancel in one click.
          </p>
        </div>

        {/* Plan card */}
        <div className="mt-14 grid grid-cols-1 md:mt-20 md:grid-cols-[1fr_1.1fr]">
          {/* Left — price + CTA */}
          <div
            style={{ backgroundColor: INK, color: PAPER, border: `2px solid ${INK}` }}
            className="relative flex flex-col p-10 md:p-12"
          >
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

            <p
              style={{ color: RUST, fontFamily: MONO, letterSpacing: "0.14em" }}
              className="text-[10.5px] font-semibold uppercase"
            >
              RuufPro · Pro
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <span
                style={{
                  fontFamily: DISPLAY,
                  color: PAPER,
                  lineHeight: 0.85,
                  letterSpacing: "-0.02em",
                }}
                className="text-[120px] font-extrabold md:text-[152px]"
              >
                $149
              </span>
              <span
                style={{
                  color: "rgba(251,247,239,0.55)",
                  fontFamily: MONO,
                  letterSpacing: "0.14em",
                }}
                className="text-[12px] uppercase"
              >
                / month
              </span>
            </div>

            <p
              style={{ color: "rgba(251,247,239,0.7)" }}
              className="mt-4 max-w-[34ch] text-[15px] leading-relaxed"
            >
              Everything you need to capture, qualify, and close more roofing
              jobs — flat-rate, month-to-month.
            </p>

            <button
              type="button"
              onClick={() => checkout("pro_monthly")}
              disabled={!!loading}
              style={{
                backgroundColor: RUST,
                color: PAPER,
                fontFamily: MONO,
                letterSpacing: "0.14em",
              }}
              className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-4 text-[12px] font-semibold uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === "pro_monthly" ? "Redirecting…" : "Start 14-day free trial →"}
            </button>

            <div
              style={{
                color: "rgba(251,247,239,0.55)",
                fontFamily: MONO,
                letterSpacing: "0.14em",
              }}
              className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] uppercase"
            >
              <span>No credit card</span>
              <span style={{ backgroundColor: "rgba(251,247,239,0.3)" }} className="h-1 w-1 rounded-full" />
              <span>Cancel any time</span>
              <span style={{ backgroundColor: "rgba(251,247,239,0.3)" }} className="h-1 w-1 rounded-full" />
              <span>Month-to-month</span>
            </div>
          </div>

          {/* Right — included */}
          <div
            style={{ backgroundColor: SAND, border: `2px solid ${INK}`, borderLeft: "none" }}
            className="relative flex flex-col p-10 md:p-12"
          >
            <span
              aria-hidden
              style={{ borderColor: RUST }}
              className="pointer-events-none absolute -right-1 -bottom-1 h-3 w-3 border-b-2 border-r-2"
            />

            <p
              style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.18em" }}
              className="text-[10.5px] font-semibold uppercase"
            >
              What&apos;s included
            </p>

            <ul className="mt-6 space-y-4">
              {INCLUDED.map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <span
                    style={{ backgroundColor: RUST, color: PAPER }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span style={{ color: INK }} className="text-[15px] leading-snug md:text-[16px]">
                    {feat}
                  </span>
                </li>
              ))}
            </ul>

            <div
              style={{ borderTop: `1px dashed ${INK}`, opacity: 0.4 }}
              className="my-7"
            />

            <p
              style={{ color: BODY }}
              className="text-[14px] leading-relaxed md:text-[15px]"
            >
              <strong style={{ color: INK }}>One job pays for 4+ years.</strong>{" "}
              We bet you&apos;ll close one in the first month — that&apos;s the
              math.
            </p>
          </div>
        </div>

        {/* Bottom transparency */}
        <p
          style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.14em" }}
          className="mt-10 text-center text-[10.5px] uppercase"
        >
          No setup fees · No per-lead charges · No contracts · No salesperson will ever call you
        </p>
      </div>
    </section>
  );
}
