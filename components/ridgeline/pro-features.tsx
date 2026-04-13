"use client";

import { motion } from "framer-motion";
import { ArrowRight, Download, Smartphone } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

/* ─── iPhone Mockup (Canva frame image) ─── */
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div
        className="relative"
        style={{ aspectRatio: "380/780" }}
      >
        <div
          className="absolute overflow-hidden bg-white z-0 flex flex-col"
          style={{
            top: "2.8%",
            left: "5.8%",
            right: "5.8%",
            bottom: "2.8%",
            borderRadius: "7% / 3.5%",
          }}
        >
          {children}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/iphone-frame.png"
          alt=""
          className="relative z-10 w-full h-full pointer-events-none select-none drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
          draggable={false}
        />
      </div>
    </div>
  );
}

/* ─── iMessage-style SMS Bubble ─── */
function SmsBubble({
  message,
  time,
  isOutgoing = false,
}: {
  message: string;
  time: string;
  isOutgoing?: boolean;
}) {
  return (
    <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-[1.35] ${
          isOutgoing
            ? "bg-[#007AFF] text-white rounded-[18px] rounded-br-[4px]"
            : "bg-[#E9E9EB] text-black rounded-[18px] rounded-bl-[4px]"
        }`}
      >
        {message}
      </div>
      <span className="text-[9px] text-gray-400 mt-1 px-2">{time}</span>
    </div>
  );
}

/* ─── Homeowner Email Preview (NEW — Step 2 left side) ─── */
function HomeownerEmailPreview() {
  return (
    <div className="w-full max-w-[340px] mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1B3A4B] flex items-center justify-center text-white text-xs font-bold">IS</div>
          <div>
            <p className="text-xs font-bold text-gray-800">IronShield Roofing</p>
            <p className="text-[10px] text-gray-400">estimates@ironshieldroofing.com</p>
          </div>
        </div>
        <p className="text-sm font-bold text-gray-900">Your Roof Estimate — 742 Evergreen Terrace</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-xs text-gray-600 leading-relaxed">
          Hi Robert, thanks for requesting an estimate! Based on satellite measurements of your roof, here&apos;s your ballpark estimate:
        </p>
        <div className="bg-[#FAFAF7] border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Estimated Cost</p>
          <p className="text-2xl font-black text-[#1B3A4B]" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>$14,200</p>
          <p className="text-[10px] text-gray-400 mt-1">2,450 sq ft · Asphalt · Moderate pitch</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#1B3A4B] text-white text-center text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5">
            <Download className="w-3 h-3" />
            Download PDF
          </div>
          <div className="flex-1 bg-[#D4863E] text-white text-center text-xs font-bold py-2.5 rounded-lg">
            Call Us →
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Roofer Lead Alert Email Preview ─── */
function RooferEmailPreview() {
  return (
    <div className="w-full max-w-[340px] mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#D4863E] flex items-center justify-center text-white text-xs font-bold">R</div>
          <div>
            <p className="text-xs font-bold text-gray-800">RuufPro Leads</p>
            <p className="text-[10px] text-gray-400">alerts@ruufpro.com</p>
          </div>
        </div>
        <p className="text-sm font-bold text-gray-900">New Lead: Robert Chen — 742 Evergreen Terrace</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full uppercase">Hot</span>
          <span className="text-[10px] text-gray-400">Just now</span>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Name:</span> Robert Chen</p>
          <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Phone:</span> (214) 555-0147</p>
          <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Address:</span> 742 Evergreen Terrace</p>
          <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Estimate:</span> $14,200 — Asphalt, 2,450 sq ft</p>
        </div>
        <div className="pt-2">
          <div className="bg-[#D4863E] text-white text-center text-xs font-bold py-2.5 rounded-lg">Call Robert Now →</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({
  step,
  reverse = false,
  label,
  title,
  outcome,
  stat,
  extra,
  children,
}: {
  step: number;
  reverse?: boolean;
  label: string;
  title: string;
  outcome: string;
  stat: string;
  extra?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-12`}
    >
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
          <span className="w-8 h-8 rounded-full bg-[#1B3A4B] text-white text-xs font-black flex items-center justify-center">{step}</span>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E]">{label}</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#1B3A4B] leading-[0.95] mb-4" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>{title}</h3>
        <p className="text-base text-[#1B3A4B]/60 leading-relaxed mb-4">{outcome}</p>
        <p className="text-sm font-semibold text-[#D4863E] mb-2">{stat}</p>
        {extra && (
          <p className="text-xs text-[#1B3A4B]/40 leading-relaxed flex items-start gap-1.5">
            <Smartphone className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1B3A4B]/30" />
            {extra}
          </p>
        )}
      </div>
      <div className="flex-1 flex justify-center">{children}</div>
    </motion.div>
  );
}

/* ─── Step Connector Arrow ─── */
function StepConnector() {
  return (
    <div className="flex justify-center py-2">
      <svg viewBox="0 0 24 40" className="w-6 h-10 text-[#1B3A4B]/15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 0 L12 30" />
        <path d="M6 24 L12 30 L18 24" />
      </svg>
    </div>
  );
}

/* ─── Widget Preview ─── */
function WidgetPreview() {
  return (
    <div className="w-full max-w-[320px] mx-auto bg-[#1B3A4B] rounded-[2rem] p-6 shadow-2xl border border-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35 mb-3">Your Website</p>
      <p className="text-lg font-black text-white mb-1.5 tracking-tight" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>Get a free instant estimate</p>
      <p className="text-xs text-white/40 mb-4">Satellite data measures the roof automatically.</p>
      <div className="w-full px-3 py-3 rounded-xl mb-3 text-sm text-white/30 bg-white/5 border border-white/10">742 Evergreen Terrace...</div>
      <div className="w-full py-3 rounded-xl text-center text-sm font-bold text-[#1B3A4B] bg-white/90">Get My Estimate</div>
      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30 mb-1">Ballpark estimate</p>
        <p className="text-2xl font-black text-[#D4863E]" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>$14,200</p>
        <p className="text-[10px] text-white/30">2,450 sq ft · Asphalt · Moderate pitch</p>
      </div>
    </div>
  );
}

/* ─── Messages Header ─── */
function MessagesHeader({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="bg-[#F6F6F6] border-b border-gray-200 px-4 pt-8 pb-2.5 flex-shrink-0">
      <div className="flex items-center justify-between">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 mx-auto mb-0.5 flex items-center justify-center text-[10px] font-bold text-gray-500">{initials}</div>
          <p className="text-[11px] font-semibold text-black">{name}</p>
        </div>
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
      </div>
    </div>
  );
}

/* ─── Messages Input Bar ─── */
function MessagesInputBar() {
  return (
    <div className="bg-[#F6F6F6] border-t border-gray-200 px-3 py-2 flex items-center gap-2 flex-shrink-0">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
      </div>
      <div className="flex-1 bg-white rounded-full border border-gray-300 px-3 py-1.5 text-[11px] text-gray-400">Text Message</div>
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
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">Tools That Pay Back</p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-5"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08" }}
          >
            More Leads. Less Chasing.
          </h2>
          <p className="text-lg text-[#1B3A4B]/60 max-w-xl mx-auto">
            Everything you need to turn website visitors into booked jobs — without leaving the roof.
          </p>
        </div>

        {/* Journey Steps */}
        <div className="space-y-8 md:space-y-12">
          {/* Step 1: Satellite Estimates */}
          <FeatureCard
            step={1}
            label="Instant Estimates"
            title="Homeowner Enters Their Address. Gets A Price. Calls You."
            outcome="The estimate widget uses Google's satellite data to measure the roof and calculate a ballpark price using your rates. Every visitor becomes a lead — even at 2am."
            stat="Every estimate captures name, email, phone, and roof details."
          >
            <WidgetPreview />
          </FeatureCard>

          <StepConnector />

          {/* Step 2: Automated Follow-Up (dual mockups) */}
          <FeatureCard
            step={2}
            reverse
            label="Automated Follow-Up"
            title="They Get A Professional Estimate. You Get A Hot Lead."
            outcome="The moment a homeowner requests an estimate, RuufPro sends them a branded PDF report with your logo by email and a text with a direct line to you. You get an alert with their name, phone, address, and roof details — automatically synced to your CRM."
            stat="Roofers who respond in under 5 minutes win 238% more jobs. You respond in under 5 seconds."
            extra="Download the RuufPro dashboard to your phone — it works like a native app. Get real-time push notifications the instant a lead comes in, even on the job site."
          >
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[10px] font-bold text-center text-[#1B3A4B]/30 uppercase tracking-wider mb-2">What the homeowner gets</p>
                <HomeownerEmailPreview />
              </div>
              <div>
                <p className="text-[10px] font-bold text-center text-[#1B3A4B]/30 uppercase tracking-wider mb-2">What you get</p>
                <RooferEmailPreview />
              </div>
            </div>
          </FeatureCard>

          <StepConnector />

          {/* Step 3: Riley AI Chatbot */}
          <FeatureCard
            step={3}
            label="AI Chatbot"
            title="A Homeowner Has Questions At 11pm. Riley Has Answers."
            outcome="Riley is your AI assistant — trained on your business, your services, your pricing. She answers homeowner questions instantly, captures their info, and hands you a qualified lead. Works 24/7, even when you're asleep."
            stat="64% of homeowners research contractors after business hours. Riley never clocks out."
          >
            <div className="w-full max-w-[320px] mx-auto">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Chat header */}
                <div className="bg-[#1B3A4B] px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4863E] flex items-center justify-center text-white text-xs font-bold">R</div>
                  <div>
                    <p className="text-sm font-bold text-white">Riley</p>
                    <p className="text-[10px] text-white/50">IronShield Roofing Assistant</p>
                  </div>
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                {/* Chat messages */}
                <div className="px-4 py-4 space-y-3 bg-gray-50 min-h-[220px]">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#D4863E] flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">R</div>
                    <div className="bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3 py-2 text-[12px] text-gray-700 leading-relaxed max-w-[85%]">
                      Hi! I&apos;m Riley, IronShield&apos;s assistant. How can I help with your roof?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#1B3A4B] rounded-xl rounded-tr-sm px-3 py-2 text-[12px] text-white leading-relaxed max-w-[85%]">
                      How much does a roof replacement cost?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#D4863E] flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">R</div>
                    <div className="bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3 py-2 text-[12px] text-gray-700 leading-relaxed max-w-[85%]">
                      Great question! For a typical home, asphalt shingle replacements run <strong>$8,000-$15,000</strong> depending on size and pitch. Want an instant estimate? Just enter your address in our calculator!
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] text-gray-400">Ask Riley anything...</div>
                  <div className="w-7 h-7 rounded-full bg-[#D4863E] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-[#1B3A4B]/30 text-center mt-4">Works on your RuufPro site or embed on any existing website.</p>
            </div>
          </FeatureCard>

          <StepConnector />

          {/* Step 4: Review Automation */}
          <FeatureCard
            step={4}
            reverse
            label="Review Automation"
            title="One Text After Every Job. Reviews Stack Up While You Sleep."
            outcome="After a job is marked complete, RuufPro sends a friendly review request. No awkward asking. No forgetting. Just 5-star reviews on autopilot."
            stat="Roofers who ask for reviews close 5x more jobs."
          >
            <PhoneMockup>
              <MessagesHeader initials="SM" name="Sarah Mitchell" />
              <div className="px-3 py-4 space-y-2.5 bg-white flex-1 flex flex-col justify-end">
                <p className="text-[10px] text-center text-gray-400 mb-1">Today 4:15 PM</p>
                <SmsBubble message="Hi Sarah, we hope you enjoyed your experience with IronShield Roofing! Would you mind taking a moment to leave a review? Here's the link: g.page/ironshield" time="4:15 PM" isOutgoing />
                <SmsBubble message="Absolutely! You guys did a great job. Just left you 5 stars ⭐" time="4:22 PM" />
              </div>
              <MessagesInputBar />
            </PhoneMockup>
          </FeatureCard>
        </div>

        {/* Supademo Placeholder */}
        <div className="mt-20 md:mt-28">
          <div className="max-w-3xl mx-auto bg-[#FAFAF7] border border-[#1B3A4B]/10 rounded-[2rem] p-10 md:p-14 text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-3">Your Lead Dashboard</p>
            <p className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#1B3A4B] mb-3" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
              See Every Lead. Track Every Job. Manage Every Review.
            </p>
            <p className="text-sm text-[#1B3A4B]/40 mb-6">All in one place — right from your phone or computer.</p>
            {/* Supademo embed will replace this placeholder */}
            <div className="aspect-video bg-[#1B3A4B]/5 rounded-2xl flex items-center justify-center">
              <p className="text-xs text-[#1B3A4B]/25 font-bold uppercase tracking-wider">Interactive walkthrough — click through to explore</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-[#1B3A4B]/50 text-sm mb-5">All of this for $149/mo. No contract. Cancel anytime.</p>
          <a href="/signup" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#c0763a] transition-colors duration-300 shadow-lg shadow-[#D4863E]/20">
            Unlock Pro Features — $149/mo
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-[#1B3A4B]/30 mt-3">One roofing job pays for 4+ years of Pro.</p>
        </div>
      </div>
    </section>
  );
}
