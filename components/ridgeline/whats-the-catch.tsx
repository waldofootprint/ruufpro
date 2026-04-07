"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PhoneOff, Shield, Handshake } from "lucide-react";
import { calculateROI, SLIDER_CONFIG } from "@/lib/roi-calculator";

// Interactive ROI calculator + trust strip.
// Roofer drags 3 sliders, sees their personal monthly loss.
// Source: Vault 032 (Andy Steuer, WeLevel).

const PROMISES = [
  { icon: PhoneOff, text: "No sales calls." },
  { icon: Handshake, text: "No contract. Cancel anytime. Your site stays live." },
  { icon: Shield, text: "No hidden fees. No upsell tricks. No bait-and-switch." },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
};

export default function RidgelineWhatsTheCatch() {
  const [missedCalls, setMissedCalls] = useState(SLIDER_CONFIG.missedCalls.default);
  const [jobValue, setJobValue] = useState(SLIDER_CONFIG.jobValue.default);
  const [closeRate, setCloseRate] = useState(SLIDER_CONFIG.closeRate.default);

  const roi = calculateROI({ missedCallsPerWeek: missedCalls, avgJobValue: jobValue, closeRate });

  return (
    <section className="relative bg-[#0F1B2D] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">

        {/* Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            The Real Cost
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-white leading-[0.95] mb-3"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D",
            }}
          >
            How Much Are Missed Calls Costing <span className="text-[#D4863E]">You</span>?
          </h2>
          <p className="text-base text-white/45 max-w-md mx-auto">
            Drag the sliders to match your business. Watch the number.
          </p>
        </motion.div>

        {/* Calculator card */}
        <motion.div
          className="max-w-[640px] mx-auto mb-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        >
          {/* Sliders */}
          <div className="flex flex-col gap-7 mb-8">
            <SliderRow
              label={SLIDER_CONFIG.missedCalls.label}
              value={missedCalls}
              displayValue={`${missedCalls} calls`}
              min={SLIDER_CONFIG.missedCalls.min}
              max={SLIDER_CONFIG.missedCalls.max}
              step={SLIDER_CONFIG.missedCalls.step}
              onChange={setMissedCalls}
            />
            <SliderRow
              label={SLIDER_CONFIG.jobValue.label}
              value={jobValue}
              displayValue={`$${jobValue.toLocaleString()}`}
              min={SLIDER_CONFIG.jobValue.min}
              max={SLIDER_CONFIG.jobValue.max}
              step={SLIDER_CONFIG.jobValue.step}
              onChange={setJobValue}
            />
            <SliderRow
              label={SLIDER_CONFIG.closeRate.label}
              value={closeRate}
              displayValue={`${closeRate}%`}
              min={SLIDER_CONFIG.closeRate.min}
              max={SLIDER_CONFIG.closeRate.max}
              step={SLIDER_CONFIG.closeRate.step}
              onChange={setCloseRate}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-6" />

          {/* Result */}
          <div className="text-center">
            <p className="text-sm text-white/50 mb-1">
              You&rsquo;re losing approximately
            </p>
            <p
              className="text-[clamp(2.5rem,6vw,4rem)] font-black text-[#D4863E] leading-none tracking-tight mb-1"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              ${roi.monthlyLost.toLocaleString()}
            </p>
            <p className="text-base text-white/50 mb-3">
              every month in missed calls
            </p>
            <p className="text-xs text-white/30">
              That&rsquo;s <strong className="text-white/60">${roi.yearlyLost.toLocaleString()}/year</strong> &mdash; enough to pay for RuufPro Pro for <strong className="text-white/60">{roi.weeksOfProPaidFor}+ weeks</strong>
            </p>
          </div>
        </motion.div>

        {/* The contrast line */}
        <motion.div
          className="max-w-[640px] mx-auto mb-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/70 text-base md:text-lg leading-relaxed">
            A free RuufPro site costs <span className="text-emerald-500 font-bold">$0</span>.
            Not having one costs you <span className="text-[#D4863E] font-bold">${roi.monthlyLost.toLocaleString()} every month</span>.
          </p>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto mb-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {PROMISES.map((promise) => (
            <motion.div
              key={promise.text}
              variants={fadeUp}
              className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-5 py-2.5"
            >
              <promise.icon className="w-4 h-4 text-[#D4863E] shrink-0" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-white/70 whitespace-nowrap">
                {promise.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#c0763a] transition-colors duration-300 shadow-lg shadow-[#D4863E]/20"
          >
            Stop Losing ${roi.monthlyLost.toLocaleString()}/Month
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <p className="text-xs text-white/30 mt-3">
            Free. No credit card. Takes 4 minutes.
          </p>
        </div>

        {/* Source */}
        <p className="text-[11px] text-white/20 text-center mt-8">
          Formula based on industry averages. Source: Andy Steuer, WeLevel ($6B in exits).
        </p>
      </div>
    </section>
  );
}

/* ─── Slider Component ─── */
function SliderRow({ label, value, displayValue, min, max, step, onChange }: {
  label: string; value: number; displayValue: string; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-sm font-bold text-white">{displayValue}</span>
      </div>
      <div className="relative h-1.5 bg-white/10 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-[#D4863E] rounded-full transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute -top-2 left-0 w-full h-[22px] appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4863E] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:shadow-lg"
        />
      </div>
    </div>
  );
}
