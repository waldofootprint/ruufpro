"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Calculator, UserCheck } from 'lucide-react';

const textShadowStyle = {
  fontFamily: '"Arial Black", Impact, sans-serif',
  textShadow: '1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D, 7px 7px 0 #0D1F2D, 8px 8px 0 #0D1F2D'
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

// Hand-drawn connector arrow between panels
const ConnectorArrow = () => (
  <div className="shrink-0 w-8 flex items-center justify-center">
    <svg viewBox="0 0 32 20" className="w-8 h-5 text-[#D4863E] stroke-current overflow-visible" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4,10 L24,10 M18,4 L24,10 L18,16" />
    </svg>
  </div>
);

export const Component = () => {
  return (
    <div className="bg-[#1B3A4B] flex flex-col font-sans selection:bg-[#D4863E] selection:text-white relative overflow-hidden w-full">

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 max-w-[1440px] mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <div className="bg-white text-[#1B3A4B] font-black tracking-tight text-xs md:text-sm px-3 py-1.5 rounded-2xl rounded-bl-sm relative shadow-sm">
            RUUF
            <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
          </div>
          <div className="bg-[#D4863E] text-white font-black text-xs md:text-sm px-3 py-1.5 rounded-full border-[1.5px] border-white/20 shadow-sm">
            PRO
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
          Start Getting Leads
        </a>
      </nav>

      {/* Top — Centered Headline */}
      <div className="relative z-10 text-center px-6 pt-10 pb-12 md:pt-16 md:pb-16 max-w-[1000px] mx-auto">
        {/* Badge row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-wrap justify-center gap-3 mb-8 md:mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4863E]/25 bg-[#D4863E]/8 text-[10px] font-bold uppercase tracking-[0.1em] text-[#D4863E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4863E]"></span>
            Google&apos;s Online Estimates Filter
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
            78% of homeowners want pricing first
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="text-[clamp(2.6rem,6.5vw,88px)] font-black uppercase tracking-tighter text-white leading-[0.88] mb-7"
          style={textShadowStyle}
        >
          They Get A<br />
          <span className="text-[#D4863E]">Roof Estimate.</span><br />
          You Get A Lead.
        </motion.h1>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="text-white/55 text-sm md:text-lg max-w-[560px] leading-relaxed mx-auto mb-8"
        >
          Satellite-powered instant estimates on your website. Homeowners see a price, you see their contact info. $149/mo — or start with a free professional site.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#demo" className="px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold hover:bg-[#c0763a] transition-colors shadow-lg hover:shadow-xl">
            See It In Action
          </a>
          <a href="/signup" className="px-8 py-3.5 rounded-full border-2 border-white/30 text-white text-sm font-bold hover:bg-white hover:text-[#1B3A4B] transition-colors">
            Start Free
          </a>
        </motion.div>
      </div>

      {/* Cinematic 3-Panel Widget Flow */}
      <div className="relative z-10 px-6 pb-20 md:pb-28" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(212,134,62,0.04) 50%, transparent 100%)' }}>
        <motion.div
          className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >

          {/* Panel 1 — Homeowner Visits */}
          <motion.div
            variants={fadeUp}
            className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-[1.5rem] p-6 text-center flex-shrink-0 w-full md:w-[220px]"
          >
            <span
              className="text-[40px] font-black text-white/6 leading-none block mb-2"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              01
            </span>
            <div className="w-12 h-12 rounded-full bg-[#D4863E] flex items-center justify-center mx-auto mb-3 text-lg">
              🏠
            </div>
            <p className="font-bold text-sm text-white mb-1">Homeowner Visits</p>
            <p className="text-[11px] text-white/35 leading-snug">They find your site on Google and enter their address</p>
          </motion.div>

          {/* Arrow */}
          <div className="hidden md:flex shrink-0 mx-3">
            <ConnectorArrow />
          </div>

          {/* Panel 2 — Widget (elevated) */}
          <motion.div
            variants={fadeUp}
            className="bg-white/8 backdrop-blur-md border border-white/15 rounded-[2rem] p-7 text-left flex-shrink-0 w-full md:w-[360px] md:scale-105 shadow-[0_12px_48px_rgba(0,0,0,0.3)] relative"
            style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35 mb-3">Your Website</p>
            <p
              className="text-[22px] font-black text-white mb-1.5 tracking-tight"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              Get a free instant estimate
            </p>
            <p className="text-xs text-white/40 mb-5 leading-relaxed">Satellite data measures the roof automatically.</p>
            <div
              className="w-full px-4 py-3.5 rounded-[14px] mb-3 text-sm text-white/30"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              742 Evergreen Terrace...
            </div>
            <div
              className="w-full py-3.5 rounded-[14px] text-center text-sm font-bold text-[#1B3A4B] cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.88)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,1)',
              }}
            >
              Get My Estimate
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="hidden md:flex shrink-0 mx-3">
            <ConnectorArrow />
          </div>

          {/* Panel 3 — Result / Lead */}
          <motion.div
            variants={fadeUp}
            className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-[1.5rem] p-6 text-center flex-shrink-0 w-full md:w-[220px]"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40 mb-2">Ballpark Estimate</p>
            <p
              className="text-[26px] font-black text-[#D4863E] tracking-tight mb-1"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              $14,200
            </p>
            <p className="text-[10px] text-white/35 leading-snug mb-4">2,450 sq ft · Asphalt · Moderate pitch</p>

            <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-left">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30 mb-1.5">Your New Lead</p>
              <p className="text-[11px] text-white/55 mb-0.5">📧 john.smith@email.com</p>
              <p className="text-[11px] text-white/55 mb-0.5">📱 (214) 555-0147</p>
              <p className="text-[11px] text-white/55">📍 742 Evergreen Terrace</p>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Bottom Features Section */}
      <section className="bg-[#FAFAF7] text-[#1B3A4B] rounded-t-[2.5rem] md:rounded-t-[3.5rem] px-6 py-12 md:px-10 md:py-16 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] mt-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* Card 1 — Your Website */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-[#1B3A4B] rounded-full flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              YOUR<br/>WEBSITE
            </h3>
            <p className="text-[10px] md:text-xs text-[#1B3A4B]/60 font-bold">
              Professional, roofing-specific, live in minutes. Free.
            </p>
          </div>

          {/* Card 2 — Their Estimate */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-[#D4863E] rounded-full flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              THEIR<br/>ESTIMATE
            </h3>
            <p className="text-[10px] md:text-xs text-[#1B3A4B]/60 font-bold">
              Homeowner enters address. Gets instant pricing from satellite data.
            </p>
          </div>

          {/* Card 3 — Your Lead */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-[#1B3A4B] rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              YOUR<br/>LEAD
            </h3>
            <p className="text-[10px] md:text-xs text-[#1B3A4B]/60 font-bold">
              Name, email, phone, roof details. Delivered to your dashboard.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
