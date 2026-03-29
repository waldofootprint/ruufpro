"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const STATS = [
  { number: "78%", label: "of homeowners want pricing before they call" },
  { number: "76%", label: "of roofers don't show pricing online" },
  { number: "Dec 2025", label: "Google launched the Online Estimates filter" },
];

const WITHOUT_ITEMS = [
  "Hidden from Google's Online Estimates filter",
  "Homeowners skip you for competitors who show pricing",
  "Losing leads you don't even know about",
  "Invisible to 78% of homeowners researching online",
];

const WITH_ITEMS = [
  "Visible in Google's Online Estimates filter",
  "Homeowners see your pricing and call you first",
  "Satellite-powered estimates capture leads 24/7",
  "Professional website makes you look established",
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
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export default function RidgelineGoogleFilter() {
  return (
    <section className="relative bg-[#1B3A4B] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Why This Matters Now
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-white mb-6 max-w-4xl mx-auto leading-[0.95]"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D",
            }}
          >
            Google Just Changed How Homeowners Find Roofers
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            In December 2025, Google launched an &ldquo;Online Estimates&rdquo;
            filter for roofing searches. Roofers without online pricing are now
            hidden. Most roofers don&apos;t even know it exists.
          </p>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 md:mb-20 relative"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.number}
              variants={fadeUp}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-8 text-center transition-all duration-500 hover:bg-white/15 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div
                className="text-[clamp(2rem,4vw,3.5rem)] font-black text-[#D4863E] tracking-tight mb-2"
                style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
              >
                {stat.number}
              </div>
              <p className="text-sm text-white/60">{stat.label}</p>
            </motion.div>
          ))}

          {/* Decorative arrow accent below stats */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-12 h-16 hidden md:block">
            <ArrowAccentDown />
          </div>
        </motion.div>

        {/* Before / After */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16 relative items-start"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Without card */}
          <motion.div
            variants={scaleIn}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-3 h-3 rounded-full bg-white/30" />
              <span className="text-sm font-bold text-white/40 uppercase tracking-wider">
                Without Online Estimates
              </span>
            </div>
            <ul className="space-y-4">
              {WITHOUT_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-white/40"
                >
                  <X className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Arrow between cards (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-12 z-20">
            <ArrowBetween />
          </div>

          {/* With RoofReady card */}
          <motion.div
            variants={scaleIn}
            className="bg-white/15 backdrop-blur-md border border-[#D4863E]/40 rounded-[2rem] p-8 rotate-[1.5deg] hover:rotate-0 transition-transform duration-500 shadow-lg shadow-[#D4863E]/5"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-3 h-3 rounded-full bg-[#D4863E]" />
              <span className="text-sm font-bold text-[#D4863E] uppercase tracking-wider">
                With RoofReady
              </span>
            </div>
            <ul className="space-y-4">
              {WITH_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-white/80"
                >
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#D4863E]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-white text-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-[#1B3A4B] transition-colors duration-300"
          >
            Get Visible on Google — Free
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
