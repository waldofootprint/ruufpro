"use client";

import { useState } from "react";
import { Check } from "lucide-react";

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

const INCLUDED = [
  "Calculator widget (embeds on any site)",
  "Riley AI chatbot (24/7 homeowner questions)",
  "Lead dashboard + smart intel",
  "Review automation",
  "Custom branding",
];

export default function RidgelinePricing() {
  const { checkout, loading } = useCheckout();

  return (
    <section id="pricing" className="relative bg-[#1B3A4B] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Pricing
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-white leading-[0.95] mb-5"
            style={{
              textShadow:
                "1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D",
            }}
          >
            One plan. Everything included.
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            No setup fees. No contracts. No per-lead charges. Cancel anytime.
          </p>
        </div>

        {/* Single plan card */}
        <div className="max-w-md mx-auto">
          <div className="rounded-[2rem] overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1 bg-white/15 backdrop-blur-md border-2 border-[#D4863E]/60 shadow-2xl shadow-[#D4863E]/10">
            <div className="flex justify-center">
              <span className="bg-[#D4863E] text-white text-[10px] font-black uppercase tracking-[0.15em] px-5 py-1.5 rounded-b-xl">
                14-Day Free Trial
              </span>
            </div>

            <div className="p-8 pb-6 text-center">
              <div className="flex items-end justify-center gap-1.5 mb-3">
                <span className="text-5xl md:text-6xl font-black tracking-tight text-white">
                  $149
                </span>
                <span className="text-white/40 text-base pb-2">/ month</span>
              </div>

              <p className="text-sm text-white/60 mb-7">
                Everything you need to capture, qualify, and close more jobs.
              </p>

              <button
                onClick={() => checkout("pro_monthly")}
                disabled={!!loading}
                className="block w-full py-3.5 rounded-full text-center text-sm font-bold uppercase tracking-wider transition-colors duration-300 bg-[#D4863E] text-white hover:bg-[#c0763a] disabled:opacity-50"
              >
                {loading === "pro_monthly" ? "Redirecting..." : "Start 14-Day Free Trial"}
              </button>

              <p className="text-[11px] text-white/40 mt-3">
                No credit card · Cancel anytime
              </p>
            </div>

            <div className="mx-8 h-px bg-white/10" />

            <div className="p-8 pt-6">
              <ul className="space-y-3.5">
                {INCLUDED.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-3 text-sm text-white/80"
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

        {/* Risk Reversal */}
        <div className="max-w-2xl mx-auto mt-10 bg-[#D4863E]/10 border border-[#D4863E]/25 rounded-[2rem] p-8 text-center">
          <p className="text-white text-lg md:text-xl font-black mb-2">
            No Contract. No Risk. Cancel Anytime.
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            Try RuufPro free for 14 days — no credit card required. One roofing
            job covers over 4 years of Pro. We bet you&apos;ll get one in the
            first month.
          </p>
        </div>

        {/* Bottom transparency note */}
        <p className="text-center text-sm text-white/30 mt-8 max-w-xl mx-auto">
          No setup fees, no per-lead charges, no contracts. No salesperson will
          ever call you.
        </p>
      </div>
    </section>
  );
}
