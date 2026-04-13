"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: React.ReactNode };

const FAQS: FaqItem[] = [
  {
    q: "What's the catch?",
    a: <>Fair question. Your website is <strong>free — no credit card, no trial, no catch.</strong> We make money when roofers choose our Pro plan at <strong>$149/mo</strong>, which turns website visitors into leads with satellite estimates, an AI chatbot that answers homeowner questions 24/7, and review automation. That&apos;s <strong>57% less than Roofle</strong> ($350/mo + $2,000 setup). It&apos;s optional. Plenty of roofers use just the free site and never pay us a dime. <strong>No salesperson will ever call you.</strong> No contract. No hidden fees.</>,
  },
  {
    q: "Is the website really free?",
    a: <><strong>Yes, forever.</strong> No credit card, no trial that expires, no catch. Your roofing website is fully functional — contact form, click-to-call, lead capture, everything. We make money when you upgrade to Pro at $149/month or Growth at $299/month.</>,
  },
  {
    q: "How accurate are the estimates?",
    a: <>We&apos;ll be straight with you: these are <strong>ballpark estimates, not bids.</strong> We use Google&apos;s Solar API to measure the actual roof from satellite imagery — area, pitch, and complexity. Combined with your pricing, estimates land <strong>within ±10%</strong> of typical contract prices. They won&apos;t catch hidden damage or rotten decking — that&apos;s what your inspection is for. The goal is to give homeowners <strong>a realistic starting number so the serious ones call you.</strong></>,
  },
  {
    q: "How long does setup take?",
    a: <><strong>Under 5 minutes.</strong> Enter your business name, phone number, and city — your website generates instantly. The estimate widget takes another 2 minutes. Just enter your per-square-foot rates and you&apos;re live.</>,
  },
  {
    q: "Can I use the widget on my existing website?",
    a: <>Yes. The estimate widget works on <strong>any website — WordPress, Wix, Squarespace, anything.</strong> Just paste one link and it works. You don&apos;t need our free website to use the widget.</>,
  },
  {
    q: "How do I qualify for Google's Online Estimates filter?",
    a: <>Google&apos;s Online Estimates filter shows roofers who offer instant pricing. When you add the RuufPro widget, homeowners get a ballpark price without calling — <strong>which is exactly what Google is looking for.</strong> The widget is the fastest way to qualify.</>,
  },
  {
    q: "Is there a contract?",
    a: <><strong>No.</strong> Month-to-month, cancel anytime with one click. No cancellation fees, no &quot;retention specialist&quot; calls, no questions asked. <strong>If we&apos;re not sending you leads, you shouldn&apos;t be paying us.</strong></>,
  },
  {
    q: "Do I own my data if I leave?",
    a: <><strong>Yes. Your leads, your content, your business info — it&apos;s all yours.</strong> Export everything anytime. We don&apos;t hold your website hostage or lock you into proprietary systems. If you cancel, your data goes with you.</>,
  },
  {
    q: "How does the satellite measurement actually work?",
    a: <>When a homeowner enters their address, we call <strong>Google&apos;s Solar API</strong> — the same satellite data used by solar installers nationwide. It returns the actual roof area, pitch, and complexity from aerial imagery. We multiply that by your pricing to produce the estimate. <strong>No drone, no site visit, no manual measuring.</strong></>,
  },
  {
    q: "What if I'm just starting out?",
    a: <><strong>That&apos;s exactly who this is built for.</strong> You don&apos;t need a portfolio, a license number, or 50 Google reviews. Your website looks professional from day one, and the widget works the same whether you&apos;ve done <strong>5 roofs or 500.</strong> Add certifications and reviews as you earn them.</>,
  },
  {
    q: "How is this different from lead generation services?",
    a: <>Lead gen services sell you <strong>shared leads</strong> — the same homeowner goes to 4-5 contractors, and you&apos;re racing to call first. With RuufPro, leads come from <strong>your own website.</strong> The homeowner found you, entered their address on your site, and wants to hear from <strong>you specifically.</strong> Your leads, not shared with anyone.</>,
  },
  {
    q: "Do I own my website?",
    a: <><strong>Your content, your brand, your leads — all yours.</strong> We host it for free, but everything you create belongs to you. If you ever leave, you keep your data. We don&apos;t hold your site hostage or charge &quot;export fees.&quot;</>,
  },
  {
    q: "How is this different from Wix or Squarespace?",
    a: <>Wix and Squarespace are general website builders. You start from a blank page and figure out design, copy, SEO, and hosting yourself. <strong>RuufPro is built specifically for roofers.</strong> You answer 4 questions and get a professional roofing website with industry-specific copy, SEO for your city, and an estimate widget that turns visitors into leads. No design skills needed, no templates to customize for hours.</>,
  },
];

const FAQ_PLAIN_ANSWERS: Record<string, string> = {
  "What's the catch?": "Your website is free — no credit card, no trial, no catch. We make money when roofers choose our Pro plan at $149/mo, which turns website visitors into leads with satellite estimates, an AI chatbot that answers homeowner questions 24/7, and review automation. That's 57% less than Roofle ($350/mo + $2,000 setup). No salesperson will ever call you. No contract. No hidden fees.",
  "Is the website really free?": "Yes, forever. No credit card, no trial that expires, no catch. Your roofing website is fully functional — contact form, click-to-call, lead capture, everything.",
  "How accurate are the estimates?": "These are ballpark estimates, not bids. We use Google's Solar API to measure the actual roof from satellite imagery — area, pitch, and complexity. Combined with your pricing, estimates land within ±10% of typical contract prices.",
  "How long does setup take?": "Under 5 minutes. Enter your business name, phone number, and city — your website generates instantly.",
  "Can I use the widget on my existing website?": "Yes. The estimate widget works on any website — WordPress, Wix, Squarespace, anything. Just paste one link and it works.",
  "How do I qualify for Google's Online Estimates filter?": "Google's Online Estimates filter shows roofers who offer instant pricing. When you add the RuufPro widget, homeowners get a ballpark price without calling — which is exactly what Google is looking for.",
  "Is there a contract?": "No. Month-to-month, cancel anytime with one click. No cancellation fees, no questions asked.",
  "Do I own my data if I leave?": "Yes. Your leads, your content, your business info — it's all yours. Export everything anytime.",
  "How does the satellite measurement actually work?": "When a homeowner enters their address, we call Google's Solar API — the same satellite data used by solar installers nationwide. It returns the actual roof area, pitch, and complexity from aerial imagery.",
  "What if I'm just starting out?": "That's exactly who this is built for. You don't need a portfolio, a license number, or 50 Google reviews. Your website looks professional from day one.",
  "How is this different from lead generation services?": "Lead gen services sell you shared leads — the same homeowner goes to 4-5 contractors. With RuufPro, leads come from your own website. The homeowner found you and wants to hear from you specifically.",
  "Do I own my website?": "Your content, your brand, your leads — all yours. We host it for free, but everything you create belongs to you. If you ever leave, you keep your data.",
  "How is this different from Wix or Squarespace?": "Wix and Squarespace are general website builders. RuufPro is built specifically for roofers. You answer 4 questions and get a professional roofing website with industry-specific copy, SEO, and an estimate widget.",
};

const faqSchemaJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: FAQ_PLAIN_ANSWERS[faq.q] || faq.q,
    },
  })),
});

export default function RidgelineFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-[#FAFAF7] overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqSchemaJson }}
      />
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            FAQ
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95]"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            Common Questions
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`bg-white rounded-[1.5rem] border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "border-[#D4863E]/30 shadow-md"
                    : "border-[#1B3A4B]/10 shadow-sm hover:shadow-md"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <span className={`text-sm font-bold pr-4 transition-colors ${
                    isOpen ? "text-[#D4863E]" : "text-[#1B3A4B] group-hover:text-[#D4863E]"
                  }`}>
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className={`w-5 h-5 transition-colors ${
                      isOpen ? "text-[#D4863E]" : "text-[#1B3A4B]/30"
                    }`} strokeWidth={2.5} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5">
                        <div className="text-sm text-[#1B3A4B]/60 leading-relaxed [&>strong]:text-[#1B3A4B]/80 [&>strong]:font-semibold">
                          {faq.a}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
