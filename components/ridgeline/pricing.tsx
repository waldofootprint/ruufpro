"use client";

import { useState } from "react";
import { Globe, Calculator, Check, X } from "lucide-react";

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
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/signup";
      }
    } catch {
      window.location.href = "/signup";
    } finally {
      setLoading(null);
    }
  }

  return { checkout, loading };
}

const FREE_FEATURES = [
  "Professional roofing website",
  "Looks great on any phone",
  "Contact form + lead capture",
  "Email notifications for new leads",
  "Click-to-call on every page",
  "Trust badges auto-generated",
];

const FREE_LOCKED = [
  "Satellite estimate widget",
  "Riley AI chatbot",
  "Google review automation",
  "SEO city pages",
  "Connect your own domain",
  "Lead dashboard + CRM",
];

const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Homeowners see pricing instantly — your phone rings, not your competitor's",
  "Riley AI chatbot answers homeowner questions 24/7 — even at 11pm",
  "5-star reviews on autopilot — one click, they get an email, you get a review",
  "Rank on Google in every city you serve — auto-generated city pages",
  "Connect your own domain — yourbusiness.com, not a subdomain",
  "Know who's ready to buy — leads tagged hot, warm, or browsing",
  "Works on any website — paste one link on WordPress, Wix, anywhere",
  "You control the pricing homeowners see",
  "Send homeowners a branded PDF estimate",
  "Leads flow straight to your CRM — Zapier, HubSpot, whatever you use",
];

export default function RidgelinePricing() {
  const { checkout, loading } = useCheckout();

  return (
    <section id="pricing" className="relative bg-[#1B3A4B] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Pricing
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-white leading-[0.95] mb-5"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D",
            }}
          >
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8">
            No setup fees. No contracts. No per-lead charges. Cancel anytime.
          </p>

        </div>

        {/* Cards — two column */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto items-start"
        >
          {/* Free Card */}
          <div
            className="rounded-[2rem] overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-1 bg-white/10 backdrop-blur-md border border-white/20"
          >
            <div className="p-7 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-white/50">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white/60">
                  Your Website
                </span>
                <span className="ml-auto text-[10px] font-bold text-white/40 border border-white/20 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                  Free Forever
                </span>
              </div>

              <div className="flex items-end gap-1.5 mb-2">
                <span
                  className="text-4xl font-black tracking-tight text-white"
                  style={{
                    fontFamily: '"Arial Black", Impact, sans-serif',
                  }}
                >
                  $0
                </span>
                <span className="text-white/40 text-sm pb-1">/ month</span>
              </div>

              <p className="text-xs text-white/50 mb-6">
                Get found on Google — for free.
              </p>

              <a
                href="/signup"
                className="block w-full py-3 rounded-full text-center text-sm font-bold uppercase tracking-wider transition-colors duration-300 border-2 border-white/30 text-white hover:bg-white hover:text-[#1B3A4B]"
              >
                Start Free
              </a>
            </div>

            <div className="mx-7 h-px bg-white/10" />

            <div className="p-7 pt-5 flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                {FREE_FEATURES.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-white/70"
                  >
                    <Check
                      className="w-4 h-4 text-[#D4863E] shrink-0 mt-0.5"
                      strokeWidth={3}
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-3 my-4 text-[10px] text-white/20 uppercase tracking-wider">
                <span className="h-px flex-1 bg-white/10" />
                <span>Upgrade to access</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <ul className="space-y-3">
                {FREE_LOCKED.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-white/30"
                  >
                    <X
                      className="w-4 h-4 text-white/20 shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Card */}
          <div
            className="rounded-[2rem] overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-1 bg-white/15 backdrop-blur-md border-2 border-[#D4863E]/60 shadow-2xl shadow-[#D4863E]/10"
          >
            <div className="flex justify-center">
              <span className="bg-[#D4863E] text-white text-[10px] font-black uppercase tracking-[0.15em] px-5 py-1.5 rounded-b-xl">
                Everything You Need
              </span>
            </div>

            <div className="p-7 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-white/50">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white/60">Your Leads</span>
              </div>

              <div className="flex items-end gap-1.5 mb-2">
                <span
                  className="text-4xl font-black tracking-tight text-white"
                  style={{
                    fontFamily: '"Arial Black", Impact, sans-serif',
                  }}
                >
                  $149
                </span>
                <span className="text-white/40 text-sm pb-1">/ month</span>
              </div>

              <p className="text-xs text-white/50 mb-6">
                Your phone rings. Your leads come to you.
              </p>

              <button
                onClick={() => checkout("pro_monthly")}
                disabled={!!loading}
                className="block w-full py-3 rounded-full text-center text-sm font-bold uppercase tracking-wider transition-colors duration-300 bg-[#D4863E] text-white hover:bg-[#c0763a] disabled:opacity-50"
              >
                {loading === "pro_monthly" ? "Redirecting..." : `Start Getting Leads — $$149/mo`}
              </button>
            </div>

            <div className="mx-7 h-px bg-white/10" />

            <div className="p-7 pt-5 flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                {PRO_FEATURES.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-white/70"
                  >
                    <Check
                      className="w-4 h-4 text-[#D4863E] shrink-0 mt-0.5"
                      strokeWidth={3}
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ROI Math */}
        <div
          className="max-w-2xl mx-auto mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 text-center"
        >
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
            The Math
          </p>
          <p className="text-white text-lg md:text-xl leading-relaxed">
            The average roof replacement is <span className="font-black text-[#D4863E]">$8,500</span>.
            {" "}One job from your website pays for{" "}
            <span className="font-black">over 4 years</span> of Pro.
          </p>
        </div>

        {/* Risk Reversal */}
        <div
          className="max-w-2xl mx-auto mt-8 bg-[#D4863E]/10 border border-[#D4863E]/25 rounded-[2rem] p-8 text-center"
        >
          <p className="text-white text-lg md:text-xl font-black mb-2">
            No Contract. No Risk. Cancel Anytime.
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            If Pro doesn&apos;t pay for itself in 30 days, cancel with one click — no
            fees, no calls, no questions. One roofing job covers over 4 years of Pro.
            We bet you&apos;ll get one in the first month.
          </p>
        </div>

        {/* Bottom transparency note */}
        <p
          className="text-center text-sm text-white/30 mt-8 max-w-xl mx-auto"
        >
          The free website is genuinely free — no credit card, no trial, no catch.
          We make money when you choose Pro at $149/mo.
          No per-lead fees, no setup costs, no contracts.
          No salesperson will ever call you.
        </p>
      </div>
    </section>
  );
}
