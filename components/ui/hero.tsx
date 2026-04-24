"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

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
          Start Free Trial
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

/* ─── Hero Section ─── */
export default function RidgelineHero() {
  return (
    <div className="relative bg-white w-full font-sans selection:bg-[#C75B39] selection:text-white overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B06_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B06_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />
      <Navbar />

      {/* Hero Content */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 pt-8 pb-16 md:pt-16 md:pb-24">
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
              Built for solo roofers and small crews
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
              Stop missing leads
              <br />
              while you&apos;re{" "}
              <span className="text-[#C75B39]">on the roof</span>.
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
              RuufPro captures homeowner estimates, answers their questions with
              AI, and qualifies them before they ever hit your phone. You show
              up to jobs that are already sold.
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
                Start free trial — no card
              </Link>
              <a
                href="#demo"
                className="px-8 py-3.5 rounded-full border-2 border-[#1B3A4B]/20 text-[#1B3A4B] text-sm font-bold hover:bg-[#1B3A4B] hover:text-white transition-colors"
              >
                See it in action ↓
              </a>
            </motion.div>

            {/* Trust Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#1A1A1A]/40 font-medium"
            >
              <span>14 days free</span>
              <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <span>Cancel anytime</span>
            </motion.div>
          </div>

          {/* Right — 40% Calculator Widget (live product) */}
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
            <EstimateWidgetV4
              contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
              contractorName="Demo Roofing Co"
              contractorPhone="(555) 123-4567"
              variant="light"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
