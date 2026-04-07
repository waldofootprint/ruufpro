"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const STATS = [
  { number: "78%", label: "of homeowners want pricing before they call" },
  { number: "~76%", label: "of roofers don't show pricing online (industry estimate)" },
  { number: "Dec 2025", label: "Google launched the Online Estimates filter" },
];

const WITHOUT_ITEMS = [
  "Hidden from Google — homeowners never see your name",
  "Homeowners choose the roofer who shows pricing first",
  "Losing leads you don't even know about",
  "Invisible to 78% of homeowners before they ever call",
];

const WITH_ITEMS = [
  "Visible in Google's Online Estimates filter",
  "Homeowners call you first — they already trust your price",
  "Every visit captures a lead, even at 2am on a Sunday",
  "You look as established as the biggest company in town",
];

// Hand-drawn arrow pointing right between Before/After cards
const ArrowBetween = () => (
  <svg viewBox="0 0 120 60" className="w-full h-full text-[#D4863E] stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10,30 C 30,10 60,50 90,30" />
    <path d="M75,15 L90,30 L75,45" />
  </svg>
);

// Small hand-drawn arrow accent
const ArrowAccentDown = () => (
  <svg viewBox="0 0 60 80" className="w-full h-full text-[#D4863E] stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M30,5 C 15,25 45,40 30,60" />
    <path d="M18,48 L30,60 L42,48" />
  </svg>
);

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
} as const;

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
} as const;

export default function RidgelineGoogleFilter() {
  return (
    <section id="features" className="relative bg-[#FAFAF7] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Why This Matters Right Now
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] mb-6 max-w-4xl mx-auto leading-[0.95]"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            Google Changed How Homeowners Find Roofers
          </h2>
          <p className="text-lg md:text-xl text-[#1B3A4B]/60 max-w-2xl mx-auto leading-relaxed">
            In December 2025, Google launched an &ldquo;Online Estimates&rdquo;
            filter for roofing searches. Roofers without online pricing are now
            hidden. Most roofers don&apos;t even know it exists.
            RuufPro&apos;s estimate widget is the fastest way to qualify.
          </p>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 md:mb-20 relative"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.number}
              className="bg-white rounded-[2rem] p-8 text-center border border-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="text-[clamp(2rem,4vw,3.5rem)] font-black text-[#D4863E] tracking-tight mb-2"
                style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
              >
                {stat.number}
              </div>
              <p className="text-sm text-[#1B3A4B]/60">{stat.label}</p>
            </div>
          ))}

          {/* Decorative arrow accent below stats */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-12 h-16 hidden md:block">
            <ArrowAccentDown />
          </div>
        </div>

        {/* Before / After */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16 relative items-start"
        >
          {/* Without card */}
          <div
            className="bg-white border border-gray-200 rounded-[2rem] p-8 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-3 h-3 rounded-full bg-[#1B3A4B]/20" />
              <span className="text-sm font-bold text-[#1B3A4B]/40 uppercase tracking-wider">
                Without Online Estimates
              </span>
            </div>
            <ul className="space-y-4">
              {WITHOUT_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-[#1B3A4B]/40"
                >
                  <X className="w-4 h-4 shrink-0 mt-0.5 text-[#1B3A4B]/25" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow between cards (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-12 z-20">
            <ArrowBetween />
          </div>

          {/* With RuufPro card */}
          <div
            className="bg-white border-2 border-[#D4863E]/30 rounded-[2rem] p-8 rotate-[1.5deg] hover:rotate-0 transition-transform duration-500 shadow-md shadow-[#D4863E]/5"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-3 h-3 rounded-full bg-[#D4863E]" />
              <span className="text-sm font-bold text-[#D4863E] uppercase tracking-wider">
                With RuufPro
              </span>
            </div>
            <ul className="space-y-4">
              {WITH_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-[#1B3A4B]/80"
                >
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#D4863E]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#c0763a] transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            Get Visible on Google
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 stroke-current"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
