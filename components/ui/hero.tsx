"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

/* ─── Calculator Logic ─── */
function useMissedCallRevenue(
  missedPerWeek: number,
  avgJobValue: number,
  closeRate: number
) {
  return useMemo(() => {
    // 85% of callers who don't reach you won't call back
    const lostLeadsPerWeek = Math.round(missedPerWeek * 0.85);
    const lostJobsPerWeek = lostLeadsPerWeek * (closeRate / 100);
    const lostRevenuePerYear = Math.round(lostJobsPerWeek * avgJobValue * 52);
    return { lostLeadsPerWeek, lostJobsPerWeek, lostRevenuePerYear };
  }, [missedPerWeek, avgJobValue, closeRate]);
}

/* ─── Nav ─── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Demo", href: "#demo" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10 md:py-6 max-w-[1280px] mx-auto w-full">
      {/* Logo */}
      <div className="flex items-center gap-1">
        <div className="bg-[#1B3A4B] text-white font-black tracking-tight text-xs md:text-sm px-3 py-1.5 rounded-2xl rounded-bl-sm relative shadow-sm">
          RUUF
          <div
            className="absolute -bottom-1.5 left-0 w-3 h-3 bg-[#1B3A4B]"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          />
        </div>
        <div className="bg-[#D4863E] text-white font-black text-xs md:text-sm px-3 py-1.5 rounded-full shadow-sm">
          PRO
        </div>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-1">
        {links.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="px-4 py-1.5 rounded-full text-[#1A1A1A]/70 text-sm font-medium hover:text-[#1A1A1A] hover:bg-black/5 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* CTA + Mobile Toggle */}
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="px-6 py-2.5 rounded-full bg-[#D4863E] text-white text-sm font-bold hover:bg-[#c0763a] transition-colors shadow-sm"
        >
          Get My Free Site
        </Link>
        <button
          className="md:hidden p-2 text-[#1A1A1A]/70"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-black/10 shadow-lg md:hidden z-50">
          <div className="flex flex-col px-6 py-4 gap-1">
            {links.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-lg text-[#1A1A1A] text-sm font-medium hover:bg-black/5 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Custom Slider (cross-browser consistent) ─── */
function HeroSlider({ label, value, displayValue, min, max, step, onChange, last = false }: {
  label: string; value: number; displayValue: string; min: number; max: number; step: number; onChange: (v: number) => void; last?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={last ? "mb-6" : "mb-4"}>
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold text-[#1A1A1A] tabular-nums">{displayValue}</span>
      </div>
      <div className="relative h-1.5 bg-[#1A1A1A]/10 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-[#C75B39] rounded-full transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute -top-2 left-0 w-full h-[22px] appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C75B39] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    </div>
  );
}

/* ─── Missed Call Calculator ─── */
function MissedCallCalculator() {
  const [missedPerWeek, setMissedPerWeek] = useState(5);
  const [avgJobValue, setAvgJobValue] = useState(8500);
  const [closeRate, setCloseRate] = useState(30);
  const { lostLeadsPerWeek, lostJobsPerWeek, lostRevenuePerYear } =
    useMissedCallRevenue(missedPerWeek, avgJobValue, closeRate);

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="bg-white rounded-2xl border border-black/8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6 md:p-8">
        <p className="text-lg font-bold text-[#1A1A1A] mb-6">
          What are missed calls costing you?
        </p>

        {/* Missed calls per week */}
        <HeroSlider
          label="Missed calls per week"
          value={missedPerWeek}
          displayValue={`${missedPerWeek}`}
          min={1} max={20} step={1}
          onChange={setMissedPerWeek}
        />

        {/* Avg job value */}
        <HeroSlider
          label="Average job value"
          value={avgJobValue}
          displayValue={`$${avgJobValue.toLocaleString()}`}
          min={2000} max={25000} step={500}
          onChange={setAvgJobValue}
        />

        {/* Close rate */}
        <HeroSlider
          label="Your close rate"
          value={closeRate}
          displayValue={`${closeRate}%`}
          min={10} max={60} step={5}
          onChange={setCloseRate}
          last
        />

        {/* Divider */}
        <div className="border-t border-black/8 my-5" />

        {/* Results */}
        <div className="text-center mb-5">
          <p className="text-xs text-[#1A1A1A]/50 mb-1">
            You&apos;re losing an estimated
          </p>
          <p className="text-3xl md:text-4xl font-black text-[#C75B39] tracking-tight">
            ${lostRevenuePerYear.toLocaleString()}
            <span className="text-base font-bold text-[#1A1A1A]/40">/yr</span>
          </p>
          <p className="text-sm text-[#1A1A1A]/50 mt-2">
            {lostLeadsPerWeek} lost leads/week &rarr; ~
            {lostJobsPerWeek.toFixed(1)} jobs you never close
          </p>
        </div>

        {/* Assumptions */}
        <p className="text-[10px] text-[#1A1A1A]/30 leading-relaxed mb-5">
          85% of callers who can&apos;t reach you won&apos;t call back — they
          call the next roofer on Google instead.
        </p>

        {/* CTA */}
        <Link
          href="/signup"
          className="block w-full py-3.5 rounded-xl bg-[#D4863E] text-white text-sm font-bold text-center hover:bg-[#c0763a] transition-colors shadow-sm"
        >
          Never Miss a Lead — It&apos;s Free
        </Link>
      </div>
    </div>
  );
}

/* ─── Hero Section ─── */
export default function RidgelineHero() {
  return (
    <div className="bg-white w-full font-sans selection:bg-[#C75B39] selection:text-white">
      <Navbar />

      {/* Hero Content */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — 60% Copy */}
          <div className="flex-1 lg:max-w-[58%]">
            {/* Kicker */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="text-[#D4863E] text-sm font-bold uppercase tracking-[0.15em] mb-4"
            >
              More Calls. More Contracts. More Roofs.
            </motion.p>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.08,
              }}
              className="text-4xl md:text-5xl lg:text-[56px] font-black text-[#1A1A1A] leading-[1.05] tracking-tight mb-6"
            >
              Your Website Should Be
              <br />
              Your Best{" "}
              <span className="text-[#C75B39]">Salesperson</span>
            </motion.h1>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.16,
              }}
              className="text-[#1A1A1A]/60 text-base md:text-lg leading-relaxed max-w-[520px] mb-8"
            >
              Get a professional roofing website for free. Upgrade to instant
              satellite estimates, missed-call text-back, and automated reviews
              when you&apos;re ready.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.24,
              }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold hover:bg-[#c0763a] transition-colors shadow-lg hover:shadow-xl"
              >
                Build My Free Site
              </Link>
              <a
                href="#demo"
                className="px-8 py-3.5 rounded-full border-2 border-[#1B3A4B]/20 text-[#1B3A4B] text-sm font-bold hover:bg-[#1B3A4B] hover:text-white transition-colors"
              >
                See It In Action
              </a>
            </motion.div>

            {/* Trust Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#1A1A1A]/40 font-medium"
            >
              <span>Free forever</span>
              <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <span>5 min setup</span>
              <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <span>No contracts</span>
            </motion.div>
          </div>

          {/* Right — 40% Calculator */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 20,
              delay: 0.2,
            }}
            className="w-full lg:max-w-[42%]"
          >
            <MissedCallCalculator />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
