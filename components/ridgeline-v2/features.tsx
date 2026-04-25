// components/ridgeline-v2/features.tsx
"use client";

import React from "react";
import { Download, Star } from "lucide-react";
import { SectionShell, TwoColHead } from "./_primitives";

/* ──────────────────────────────────────────────────────────────────
   Visual mocks — editorial / paper / ink / rust
   ────────────────────────────────────────────────────────────────── */

function CornerTicks({ color = "rust" }: { color?: "rust" | "rust-2" }) {
  const c = color === "rust-2" ? "border-rust-2" : "border-rust";
  return (
    <>
      <span aria-hidden className={`pointer-events-none absolute -left-1 -top-1 h-3 w-3 border-t-2 border-l-2 ${c}`} />
      <span aria-hidden className={`pointer-events-none absolute -right-1 -top-1 h-3 w-3 border-t-2 border-r-2 ${c}`} />
      <span aria-hidden className={`pointer-events-none absolute -left-1 -bottom-1 h-3 w-3 border-b-2 border-l-2 ${c}`} />
      <span aria-hidden className={`pointer-events-none absolute -right-1 -bottom-1 h-3 w-3 border-b-2 border-r-2 ${c}`} />
    </>
  );
}

function WidgetMock() {
  return (
    <div className="relative w-full max-w-[360px] bg-ink p-6 border-2 border-ink">
      <CornerTicks color="rust-2" />
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-rust-2 mb-3">Your Website</p>
      <p className="text-lg font-display font-extrabold uppercase tracking-tight text-paper mb-1.5 leading-tight">Get a free instant estimate</p>
      <p className="text-xs text-paper/60 mb-4">Satellite data measures the roof automatically.</p>
      <div className="w-full px-3 py-3 mb-3 text-sm text-paper/40 bg-paper/5 border border-paper/15">742 Evergreen Terrace…</div>
      <div className="w-full py-3 text-center text-sm font-mono font-semibold uppercase tracking-[0.14em] text-paper bg-rust">Get My Estimate</div>
      <div className="mt-4 pt-4 border-t border-paper/15 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45 mb-1">Ballpark estimate</p>
        <p className="text-3xl font-display font-extrabold uppercase tracking-tight text-rust-2">$14,200</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-paper/45">2,450 sqft · Asphalt</p>
      </div>
    </div>
  );
}

function LeadAlertMock() {
  return (
    <div className="relative w-full max-w-[360px] bg-paper border-2 border-ink overflow-hidden">
      <CornerTicks />
      <div className="bg-sand border-b-2 border-ink px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-rust flex items-center justify-center text-paper text-xs font-display font-extrabold">R</div>
          <div>
            <p className="text-xs font-display font-bold uppercase tracking-tight text-ink">RuufPro Leads</p>
            <p className="font-mono text-[10px] text-ink/55">alerts@ruufpro.com</p>
          </div>
        </div>
        <p className="text-sm font-display font-bold text-ink">New Lead: Robert Chen — 742 Evergreen</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper bg-rust px-2 py-0.5">Hot</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">Just now</span>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-ink/75"><span className="font-display font-bold text-ink">Phone:</span> (214) 555-0147</p>
          <p className="text-xs text-ink/75"><span className="font-display font-bold text-ink">Address:</span> 742 Evergreen Terrace</p>
          <p className="text-xs text-ink/75"><span className="font-display font-bold text-ink">Estimate:</span> $14,200 — Asphalt, 2,450 sqft</p>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 bg-ink text-paper text-center text-xs font-mono font-semibold uppercase tracking-[0.12em] py-2.5 flex items-center justify-center gap-1.5">
            <Download className="w-3 h-3" />
            PDF
          </div>
          <div className="flex-1 bg-rust text-paper text-center text-xs font-mono font-semibold uppercase tracking-[0.14em] py-2.5">Call Robert →</div>
        </div>
      </div>
    </div>
  );
}

function RileyChatMock() {
  return (
    <div className="relative w-full max-w-[360px] bg-paper border-2 border-ink overflow-hidden">
      <CornerTicks />
      <div className="bg-ink px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-rust flex items-center justify-center text-paper text-xs font-display font-extrabold">R</div>
        <div>
          <p className="text-sm font-display font-bold text-paper">Riley</p>
          <p className="font-mono text-[10px] text-paper/55">IronShield Assistant</p>
        </div>
        <div className="ml-auto w-2 h-2 bg-emerald-400" />
      </div>
      <div className="px-4 py-4 space-y-3 bg-sand min-h-[240px]">
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-rust flex items-center justify-center text-paper text-[8px] font-display font-extrabold shrink-0 mt-0.5">R</div>
          <div className="bg-paper border border-ink/15 px-3 py-2 text-[12px] text-ink/80 leading-relaxed max-w-[85%]">
            Hi! I&apos;m Riley, IronShield&apos;s assistant. How can I help with your roof?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-ink px-3 py-2 text-[12px] text-paper leading-relaxed max-w-[85%]">
            How much does a roof replacement cost?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-rust flex items-center justify-center text-paper text-[8px] font-display font-extrabold shrink-0 mt-0.5">R</div>
          <div className="bg-paper border border-ink/15 px-3 py-2 text-[12px] text-ink/80 leading-relaxed max-w-[85%]">
            Asphalt shingle replacements run <strong className="font-display font-bold text-ink">$8,000–$15,000</strong>. Want an instant estimate?
          </div>
        </div>
      </div>
      <div className="bg-paper border-t-2 border-ink px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-sand border border-ink/20 px-3 py-1.5 text-[11px] text-ink/45">Ask Riley anything…</div>
        <div className="w-7 h-7 bg-rust flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-paper" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </div>
      </div>
    </div>
  );
}

function ReviewRequestMock() {
  return (
    <div className="relative w-full max-w-[360px] bg-paper border-2 border-ink overflow-hidden">
      <CornerTicks />
      <div className="bg-sand border-b-2 border-ink px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-ink flex items-center justify-center text-paper text-xs font-display font-extrabold">IS</div>
          <div>
            <p className="text-xs font-display font-bold uppercase tracking-tight text-ink">IronShield Roofing</p>
            <p className="font-mono text-[10px] text-ink/55">via RuufPro</p>
          </div>
        </div>
        <p className="text-sm font-display font-bold text-ink">How was your experience?</p>
      </div>
      <div className="px-5 py-5 text-center">
        <div className="flex items-center justify-center gap-1 mb-3">
          {[0,1,2,3,4].map((i) => (
            <Star key={i} className="w-4 h-4 text-rust" fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className="text-xs text-ink/75 leading-relaxed mb-4">
          Hi Sarah, thanks for choosing IronShield Roofing! If you have a minute, a quick review would really help us out.
        </p>
        <div className="bg-rust text-paper text-xs font-mono font-semibold uppercase tracking-[0.14em] py-3 px-5 inline-flex items-center gap-2">
          <Star className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
          Leave a Review
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40 mt-4">Sent on behalf of IronShield Roofing</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Tools array
   ────────────────────────────────────────────────────────────────── */

type Tool = {
  n: string;
  name: string;
  payoff: string;
  body: string;
  visual: React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    n: "01",
    name: "Estimate Widget",
    payoff: "Address in. Price out. Lead captured.",
    body:
      "Drop one line of code on any site. Homeowners type their address, the widget pulls satellite imagery, and a real ballpark price appears in seconds — name, phone, and roof specs land in your inbox.",
    visual: <WidgetMock />,
  },
  {
    n: "02",
    name: "Auto Follow-Up",
    payoff: "Reply in 4 seconds. Even at 11pm.",
    body:
      "The instant a homeowner submits, RuufPro texts them a branded estimate, emails a PDF, and pings your phone. You go from 'inbound lead' to 'first conversation' before they've closed the tab.",
    visual: <LeadAlertMock />,
  },
  {
    n: "03",
    name: "Riley AI Chatbot",
    payoff: "Answers questions while you're on the roof.",
    body:
      "Riley is trained on your services, your warranty, your pricing. She answers homeowner questions in your voice, qualifies the lead, and books a call — 24/7, in English or Spanish.",
    visual: <RileyChatMock />,
  },
  {
    n: "04",
    name: "Review Automation",
    payoff: "Mark the job done. Reviews roll in.",
    body:
      "When you mark a job complete, RuufPro texts the homeowner a one-tap review request. They tap five stars, the review posts to Google. No awkward asking, no forgetting.",
    visual: <ReviewRequestMock />,
  },
];

/* ──────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────── */

export default function FeaturesV2() {
  return (
    <section id="features" className="bg-paper text-ink border-t border-line">
      <SectionShell wide className="pt-20 pb-20 md:pt-28 md:pb-24">
        <TwoColHead eyebrow="The toolkit · 04 parts">
          <h2 className="font-display text-[44px] font-extrabold uppercase leading-[1.0] tracking-tight md:text-[68px]">
            Four tools. One <span className="text-rust">phone ringing</span>.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-[#3a4a52] md:text-[17px]">
            Every tool has one job: turn a curious homeowner into a booked call before your
            competitor finishes their voicemail outgoing message.
          </p>
        </TwoColHead>

        <div className="mt-14 border-t-2 border-ink md:mt-20">
          {TOOLS.map((tool, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={tool.n}
                className="grid items-center gap-10 border-b border-line py-14 md:grid-cols-[1fr_1fr] md:gap-16 md:py-20"
              >
                <div className={reverse ? "md:order-2" : ""}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">
                    Tool {tool.n} of 04
                  </p>
                  <h3 className="mt-3 font-display text-[40px] font-extrabold uppercase leading-[0.95] tracking-tight md:text-[56px]">
                    {tool.name}
                  </h3>
                  <p className="mt-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-rust">
                    → {tool.payoff}
                  </p>
                  <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-[#3a4a52] md:text-[17px]">
                    {tool.body}
                  </p>
                </div>
                <div className={`flex justify-center ${reverse ? "md:order-1" : ""}`}>
                  {tool.visual}
                </div>
              </div>
            );
          })}
        </div>
      </SectionShell>
    </section>
  );
}
