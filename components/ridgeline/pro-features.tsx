"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

/* ─── iPhone 15 Pro Mockup ─── */
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[280px] mx-auto">
      {/* Outer shell — titanium frame */}
      <div
        className="relative rounded-[3rem] p-[3px] shadow-[0_25px_60px_rgba(0,0,0,0.35),0_8px_20px_rgba(0,0,0,0.2)]"
        style={{
          background: "linear-gradient(145deg, #2A2A2E 0%, #1A1A1E 50%, #2A2A2E 100%)",
        }}
      >
        {/* Side buttons — left */}
        <div className="absolute -left-[2px] top-[100px] w-[3px] h-[28px] rounded-l-sm bg-[#2A2A2E] shadow-[-1px_0_2px_rgba(0,0,0,0.3)]" />
        <div className="absolute -left-[2px] top-[148px] w-[3px] h-[52px] rounded-l-sm bg-[#2A2A2E] shadow-[-1px_0_2px_rgba(0,0,0,0.3)]" />
        <div className="absolute -left-[2px] top-[212px] w-[3px] h-[52px] rounded-l-sm bg-[#2A2A2E] shadow-[-1px_0_2px_rgba(0,0,0,0.3)]" />
        {/* Side button — right (power) */}
        <div className="absolute -right-[2px] top-[160px] w-[3px] h-[64px] rounded-r-sm bg-[#2A2A2E] shadow-[1px_0_2px_rgba(0,0,0,0.3)]" />

        {/* Inner bezel */}
        <div
          className="relative rounded-[2.85rem] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #111113 0%, #0A0A0C 100%)",
          }}
        >
          {/* Screen area with subtle inner shadow */}
          <div className="relative m-[10px] rounded-[2.2rem] overflow-hidden bg-black">
            {/* Dynamic Island */}
            <div className="relative z-20 flex justify-center pt-3 pb-1 bg-black">
              <div
                className="w-[100px] h-[30px] bg-black rounded-full"
                style={{
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.04)",
                }}
              >
                {/* Camera lens */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ml-[18px] w-[10px] h-[10px] rounded-full bg-[#0C0C0E] border border-[#1a1a2e] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                  <div className="absolute top-[2px] left-[2px] w-[3px] h-[3px] rounded-full bg-[#1a1a3a]" />
                </div>
              </div>
            </div>

            {/* Screen content */}
            <div className="relative z-10 bg-white">
              {children}
            </div>

            {/* Home indicator */}
            <div className="relative z-20 bg-white pb-2 pt-1 flex justify-center">
              <div className="w-[120px] h-[4px] rounded-full bg-black/20" />
            </div>

            {/* Glass reflection overlay */}
            <div
              className="absolute inset-0 z-30 pointer-events-none rounded-[2.2rem]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── iMessage-style SMS Bubble ─── */
function SmsBubble({
  message,
  sender,
  time,
  isOutgoing = false,
}: {
  message: string;
  sender?: string;
  time: string;
  isOutgoing?: boolean;
}) {
  return (
    <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}>
      {sender && (
        <span className="text-[10px] font-medium text-gray-400 mb-1 px-2">{sender}</span>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-[1.35] ${
          isOutgoing
            ? "bg-[#34C759] text-white rounded-[18px] rounded-br-[4px]"
            : "bg-[#E9E9EB] text-black rounded-[18px] rounded-bl-[4px]"
        }`}
      >
        {message}
      </div>
      <span className="text-[9px] text-gray-400 mt-1 px-2">{time}</span>
    </div>
  );
}

/* ─── Email Preview ─── */
function EmailPreview() {
  return (
    <div className="w-full max-w-[340px] mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Email header */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#D4863E] flex items-center justify-center text-white text-xs font-bold">
            R
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">RuufPro Leads</p>
            <p className="text-[10px] text-gray-400">alerts@ruufpro.com</p>
          </div>
        </div>
        <p className="text-sm font-bold text-gray-900">
          New Lead: Robert Chen — 742 Evergreen Terrace
        </p>
      </div>
      {/* Email body */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full uppercase">
            Hot
          </span>
          <span className="text-[10px] text-gray-400">Just now</span>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Name:</span> Robert Chen
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Phone:</span> (214) 555-0147
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Address:</span> 742 Evergreen Terrace
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Estimate:</span> $14,200 — Asphalt, 2,450 sq ft
          </p>
        </div>
        <div className="pt-2">
          <div className="bg-[#D4863E] text-white text-center text-xs font-bold py-2.5 rounded-lg">
            Call Robert Now →
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({
  reverse = false,
  label,
  title,
  outcome,
  stat,
  children,
}: {
  reverse?: boolean;
  label: string;
  title: string;
  outcome: string;
  stat: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`flex flex-col ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      } items-center gap-8 md:gap-12`}
    >
      {/* Text side */}
      <div className="flex-1 text-center md:text-left">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-3 block">
          {label}
        </span>
        <h3
          className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#1B3A4B] leading-[0.95] mb-4"
          style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
        >
          {title}
        </h3>
        <p className="text-base text-[#1B3A4B]/60 leading-relaxed mb-4">
          {outcome}
        </p>
        <p className="text-sm font-semibold text-[#D4863E]">{stat}</p>
      </div>
      {/* Visual side */}
      <div className="flex-1 flex justify-center">{children}</div>
    </motion.div>
  );
}

/* ─── Widget Preview ─── */
function WidgetPreview() {
  return (
    <div className="w-full max-w-[320px] mx-auto bg-[#1B3A4B] rounded-[2rem] p-6 shadow-2xl border border-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35 mb-3">
        Your Website
      </p>
      <p
        className="text-lg font-black text-white mb-1.5 tracking-tight"
        style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
      >
        Get a free instant estimate
      </p>
      <p className="text-xs text-white/40 mb-4">
        Satellite data measures the roof automatically.
      </p>
      <div className="w-full px-3 py-3 rounded-xl mb-3 text-sm text-white/30 bg-white/5 border border-white/10">
        742 Evergreen Terrace...
      </div>
      <div className="w-full py-3 rounded-xl text-center text-sm font-bold text-[#1B3A4B] bg-white/90">
        Get My Estimate
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30 mb-1">Ballpark estimate</p>
        <p
          className="text-2xl font-black text-[#D4863E]"
          style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
        >
          $14,200
        </p>
        <p className="text-[10px] text-white/30">
          2,450 sq ft · Asphalt · Moderate pitch
        </p>
      </div>
    </div>
  );
}

export default function RidgelineProFeatures() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B06_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B06_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Pro Features
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-5"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            Pro Features That Pay For Themselves
          </h2>
          <p className="text-lg text-[#1B3A4B]/60 max-w-xl mx-auto">
            Everything you need to turn website visitors into booked jobs — without
            leaving the roof.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-20 md:space-y-28">
          {/* Card 1: Missed-Call Text-Back */}
          <FeatureCard
            label="Missed-Call Text-Back"
            title="You're On A Roof. Phone Rings. You Can't Answer."
            outcome="No problem. RuufPro texts them back instantly with a professional message — so the lead stays warm until you're free."
            stat="85% of leads are lost to voicemail. Not yours."
          >
            <PhoneMockup>
              {/* iOS Messages header */}
              <div className="bg-[#F6F6F6] border-b border-gray-200 px-4 pt-2 pb-2.5">
                <div className="flex items-center justify-between">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 mx-auto mb-0.5 flex items-center justify-center text-[10px] font-bold text-gray-500">RC</div>
                    <p className="text-[11px] font-semibold text-black">Robert Chen</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                </div>
              </div>
              {/* Messages */}
              <div className="px-3 py-4 space-y-2.5 bg-white min-h-[220px]">
                <p className="text-[10px] text-center text-gray-400 mb-1">
                  Today 2:34 PM
                </p>
                <SmsBubble
                  message="Hi Robert, this is Jenna at IronShield Roofing. Sorry I missed you! How can we help with your roof today? Reply with your address for a free inspection."
                  time="2:34 PM"
                  isOutgoing
                />
                <SmsBubble
                  message="Hi! Yes I need a roof inspection. I'm at 742 Evergreen Terrace."
                  time="2:41 PM"
                />
              </div>
              {/* Input bar */}
              <div className="bg-[#F6F6F6] border-t border-gray-200 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div className="flex-1 bg-white rounded-full border border-gray-300 px-3 py-1.5 text-[11px] text-gray-400">
                  Text Message
                </div>
              </div>
            </PhoneMockup>
          </FeatureCard>

          {/* Card 2: Review Automation */}
          <FeatureCard
            reverse
            label="Review Automation"
            title="One Text After Every Job. Reviews Stack Up While You Sleep."
            outcome="After a job is marked complete, RuufPro sends a friendly review request. No awkward asking. No forgetting. Just 5-star reviews on autopilot."
            stat="Roofers who ask for reviews close 5x more jobs."
          >
            <PhoneMockup>
              {/* iOS Messages header */}
              <div className="bg-[#F6F6F6] border-b border-gray-200 px-4 pt-2 pb-2.5">
                <div className="flex items-center justify-between">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 mx-auto mb-0.5 flex items-center justify-center text-[10px] font-bold text-gray-500">SM</div>
                    <p className="text-[11px] font-semibold text-black">Sarah Mitchell</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                </div>
              </div>
              {/* Messages */}
              <div className="px-3 py-4 space-y-2.5 bg-white min-h-[220px]">
                <p className="text-[10px] text-center text-gray-400 mb-1">
                  Today 4:15 PM
                </p>
                <SmsBubble
                  message="Hi Sarah, we hope you enjoyed your experience with IronShield Roofing! Would you mind taking a moment to leave a review? Here's the link: g.page/ironshield"
                  time="4:15 PM"
                  isOutgoing
                />
                <SmsBubble
                  message="Absolutely! You guys did a great job. Just left you 5 stars ⭐"
                  time="4:22 PM"
                />
              </div>
              {/* Input bar */}
              <div className="bg-[#F6F6F6] border-t border-gray-200 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div className="flex-1 bg-white rounded-full border border-gray-300 px-3 py-1.5 text-[11px] text-gray-400">
                  Text Message
                </div>
              </div>
            </PhoneMockup>
          </FeatureCard>

          {/* Card 3: Satellite Estimates */}
          <FeatureCard
            label="Satellite Roof Estimates"
            title="Homeowner Enters Their Address. Gets A Price. Calls You."
            outcome="The estimate widget uses Google's satellite data to measure the roof and calculate a ballpark price using your rates. Every visitor becomes a lead — even at 2am."
            stat="Every estimate captures name, email, phone, and roof details."
          >
            <WidgetPreview />
          </FeatureCard>

          {/* Card 4: Instant Lead Alerts */}
          <FeatureCard
            reverse
            label="Instant Lead Alerts"
            title="New Lead? You Know In Seconds, Not Hours."
            outcome="The moment a homeowner requests an estimate or fills out a form, you get an email with everything — name, phone, address, roof specs, and a one-tap call button."
            stat="First to respond wins 238% more jobs."
          >
            <EmailPreview />
          </FeatureCard>
        </div>

        {/* Supademo placeholder */}
        <div className="mt-20 md:mt-28 text-center">
          <div className="max-w-3xl mx-auto bg-[#FAFAF7] border-2 border-dashed border-[#1B3A4B]/15 rounded-[2rem] p-10 md:p-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-3">
              Interactive Demo
            </p>
            <p
              className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#1B3A4B] mb-3"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              See The Full Dashboard
            </p>
            <p className="text-sm text-[#1B3A4B]/40 mb-0">
              Interactive walkthrough coming soon — manage leads, send texts, track reviews, all in one place.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-[#1B3A4B]/50 text-sm mb-5">
            All of this for $149/mo. No contract. Cancel anytime.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#c0763a] transition-colors duration-300 shadow-lg shadow-[#D4863E]/20"
          >
            Unlock Pro Features — $149/mo
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-[#1B3A4B]/30 mt-3">
            One roofing job pays for 4+ years of Pro.
          </p>
        </div>
      </div>
    </section>
  );
}
