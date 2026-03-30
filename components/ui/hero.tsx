"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart3, Zap } from 'lucide-react';

// --- Custom SVG Components for Hand-Drawn Accents ---

const ArrowAccentLeft = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4863E] stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
);

const ArrowAccentRight = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4863E] stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
);

const ArrowDark1 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#1B3A4B] stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const ArrowDark2 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#1B3A4B] stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const CircularBadge = () => (
  <div className="relative w-28 h-28 md:w-36 md:h-36 bg-[#D4863E] rounded-full flex items-center justify-center shadow-xl rotate-12 hover:scale-105 transition-transform cursor-pointer border-[3px] border-white/10">
    <div className="absolute inset-1 animate-[spin_10s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path id="circlePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        <text className="text-[11px] font-black tracking-[0.18em] uppercase" fill="white">
          <textPath href="#circlePath" startOffset="0%">
            GET STARTED FOR FREE • GET STARTED FOR FREE •
          </textPath>
        </text>
      </svg>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-10 h-10 text-white stroke-current overflow-visible" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,80 Q 40,50 30,30 T 80,20" />
        <path d="M60,10 L80,20 L70,40" />
      </svg>
    </div>
  </div>
);

export const Component = () => {
  return (
    <div className="min-h-screen bg-[#1B3A4B] flex flex-col font-sans selection:bg-[#D4863E] selection:text-white relative overflow-hidden w-full">

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 max-w-[1440px] mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <div className="bg-white text-[#1B3A4B] font-black tracking-tight text-xs md:text-sm px-3 py-1.5 rounded-2xl rounded-bl-sm relative shadow-sm">
            RIDGE
            <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
          </div>
          <div className="bg-[#D4863E] text-white font-black text-xs md:text-sm px-3 py-1.5 rounded-full border-[1.5px] border-white/20 shadow-sm">
            LINE
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-2">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Demo', href: '#demo' },
            { label: 'FAQ', href: '#faq' },
          ].map((item) => (
            <a key={item.label} href={item.href} className="px-4 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold hover:bg-white/10 transition-colors">
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <a href="/signup" className="px-6 py-2 rounded-full border border-white text-white text-xs md:text-sm font-semibold hover:bg-white hover:text-[#1B3A4B] transition-colors">
          Get Started Free
        </a>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 pt-8 pb-32 md:pt-12 md:pb-48 px-4 flex flex-col items-center justify-center w-full max-w-[1440px] mx-auto">

        {/* Massive Typography & Elements Container */}
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center z-10 mt-4 mb-16">

          {/* Text Stack */}
          <div className="w-full flex flex-col items-center relative z-10 space-y-2 md:space-y-4">

            {/* SMART */}
            <div className="w-full flex justify-start pl-[10%] md:pl-[25%] relative z-30">
              <h1
                className="text-[clamp(4.5rem,12vw,160px)] font-black leading-[0.85] tracking-tighter text-[#D4863E] m-0 p-0 uppercase"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D, 7px 7px 0 #0D1F2D, 8px 8px 0 #0D1F2D, 9px 9px 0 #0D1F2D, 10px 10px 0 #0D1F2D, 11px 11px 0 #0D1F2D, 12px 12px 0 #0D1F2D, 13px 13px 0 #0D1F2D, 14px 14px 0 #0D1F2D'
                }}
              >
                SMART
              </h1>
            </div>

            {/* ROOFING */}
            <div className="w-full flex justify-center relative z-20">
              <h1
                className="text-[clamp(5rem,15vw,220px)] font-black leading-[0.85] tracking-tighter text-white m-0 p-0 uppercase"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D, 7px 7px 0 #0D1F2D, 8px 8px 0 #0D1F2D, 9px 9px 0 #0D1F2D, 10px 10px 0 #0D1F2D, 11px 11px 0 #0D1F2D, 12px 12px 0 #0D1F2D, 13px 13px 0 #0D1F2D, 14px 14px 0 #0D1F2D'
                }}
              >
                ROOFING
              </h1>
            </div>

            {/* ONLINE */}
            <div className="w-full flex justify-start pl-[15%] md:pl-[30%] relative z-10">
              <h1
                className="text-[clamp(4.5rem,12vw,160px)] font-black leading-[0.85] tracking-tighter text-white m-0 p-0 uppercase"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D, 7px 7px 0 #0D1F2D, 8px 8px 0 #0D1F2D, 9px 9px 0 #0D1F2D, 10px 10px 0 #0D1F2D, 11px 11px 0 #0D1F2D, 12px 12px 0 #0D1F2D, 13px 13px 0 #0D1F2D, 14px 14px 0 #0D1F2D'
                }}
              >
                ONLINE
              </h1>
            </div>

          </div>

          {/* Absolute Overlays (Cards, Arrows, Badge) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">

            {/* Floating Glass Card 1 - Contractor Profile (Bottom Left) */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[10%] left-[5%] md:left-[20%] z-30 pointer-events-auto"
            >
              <div className="w-40 md:w-52 aspect-[3/3.5] bg-white/15 backdrop-blur-md border border-white/30 rounded-[2rem] p-5 flex flex-col items-center justify-center rotate-[-12deg] shadow-2xl hover:rotate-0 transition-transform duration-500">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-[#2C3E50] rounded-full flex items-center justify-center mb-4 shadow-inner border-[3px] border-white/40 overflow-hidden">
                  <Home className="w-8 h-8 md:w-12 md:h-12 text-white/80" />
                </div>
                <div className="text-center mt-2">
                  <p className="font-bold text-sm md:text-lg text-white">Summit Roofing</p>
                  <p className="text-[10px] md:text-xs text-white/70 mt-1">23 New Leads</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Glass Card 2 - Estimate Preview (Top Right) */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[15%] right-[5%] md:right-[22%] z-30 pointer-events-auto"
            >
              <div className="w-40 md:w-52 aspect-[3/3.5] bg-white/15 backdrop-blur-md border border-white/30 rounded-[2rem] p-5 flex flex-col items-center justify-center rotate-[12deg] shadow-2xl hover:rotate-0 transition-transform duration-500">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-[#D4863E] rounded-full flex items-center justify-center mb-4 shadow-inner border-[3px] border-white/40 overflow-hidden">
                  <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-white/90" />
                </div>
                <div className="text-center mt-2">
                  <p className="font-bold text-sm md:text-lg text-white">Instant Estimate</p>
                  <p className="text-[10px] md:text-xs text-white/70 mt-1">$14,200 — 32 sq</p>
                </div>
              </div>
            </motion.div>

            {/* Decorative Arrow Left */}
            <div className="absolute bottom-[0%] left-[0%] md:left-[10%] w-24 h-24 md:w-32 md:h-32 z-20">
              <ArrowAccentLeft />
            </div>

            {/* Decorative Arrow Right */}
            <div className="absolute top-[5%] right-[0%] md:right-[10%] w-24 h-24 md:w-32 md:h-32 z-20">
              <ArrowAccentRight />
            </div>

            {/* Circular Badge */}
            <div className="absolute bottom-[-10%] right-[0%] md:right-[15%] z-40 pointer-events-auto">
              <CircularBadge />
            </div>

          </div>
        </div>
      </main>

      {/* Bottom Features Section */}
      <section className="bg-[#FAFAF7] text-[#1B3A4B] rounded-t-[2.5rem] md:rounded-t-[3.5rem] px-6 py-12 md:px-10 md:py-16 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] mt-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* Card 1 */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100 shadow-sm">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              FREE PRO<br/>WEBSITE
            </h3>
            <p className="text-[10px] md:text-xs text-[#1B3A4B]/60 font-bold mb-auto">
              live in minutes, no coding needed
            </p>

            {/* Pill Graphic */}
            <div className="relative w-full flex justify-center mt-6">
              <div className="flex items-center bg-[#1B3A4B] rounded-2xl p-2 pr-16 text-white shadow-lg relative z-10">
                <div className="w-8 h-8 bg-[#D4863E] rounded-full mr-3 border border-white/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold leading-none">summitroofing.co</p>
                  <p className="text-[8px] text-white/70 leading-none mt-1">Live &amp; indexed</p>
                </div>
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#D4863E] text-white font-black text-[10px] px-3 py-2 rounded-xl z-20 shadow-md">
                FREE
              </div>
            </div>

            {/* Arrow pointing to next card */}
            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <ArrowDark1 />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100 shadow-sm">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              SATELLITE<br/>ESTIMATES
            </h3>
            <p className="text-[10px] md:text-xs text-[#1B3A4B]/60 font-bold mb-auto">
              powered by Google Solar API
            </p>

            {/* Pill Graphic */}
            <div className="relative w-full flex justify-center mt-6">
              <div className="flex items-center bg-[#1B3A4B] rounded-full p-1.5 text-white shadow-lg">
                <div className="bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-full mr-2">
                  $14,200
                </div>
                <div className="font-bold text-xs px-4">
                  32 sq
                </div>
              </div>

              {/* Small floating accent pill */}
              <div className="absolute -bottom-6 right-1/3 bg-[#D4863E] rounded-full p-2.5 shadow-lg transform rotate-12 z-20">
                 <Zap className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Arrow pointing to next card */}
            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <ArrowDark2 />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100 shadow-sm">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              LEADS ON<br/>AUTOPILOT
            </h3>
            <p className="text-[10px] md:text-xs text-[#1B3A4B]/60 font-bold mb-auto">
              capture every visitor, day and night
            </p>

            {/* Pill Graphic */}
            <div className="flex flex-col items-center bg-[#D4863E] rounded-[2rem] px-6 py-4 text-white shadow-lg mt-6 relative w-full max-w-[200px]">
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1">Monthly Leads</p>
              <p className="text-xl font-black">+47 new</p>

              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-8 w-5 h-5 bg-[#D4863E] transform rotate-45"></div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
