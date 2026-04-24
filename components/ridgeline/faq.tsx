"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: React.ReactNode };

const FAQS: FaqItem[] = [
  {
    q: "What's the catch?",
    a: <>Fair question. You get a <strong>14-day free trial, no credit card.</strong> After that, it&apos;s <strong>$149/mo flat</strong> — cancel anytime, one click. No contract, no setup fees, no per-lead charges, <strong>no salesperson will ever call you.</strong> We make money when RuufPro pays for itself, which usually happens in the first month.</>,
  },
  {
    q: "What happens after the 14-day trial?",
    a: <>If you love it, do nothing — you&apos;ll be billed <strong>$149/mo automatically on day 15</strong> (you&apos;ll only give us a card when you&apos;re ready). If not, cancel with one click. No calls, no retention specialist, no fees.</>,
  },
  {
    q: "Can I use the widget on my existing website?",
    a: <>That&apos;s the point — RuufPro is designed to embed on <strong>whatever site you already have.</strong> WordPress, Wix, Squarespace, GoDaddy, a Facebook ad link, anywhere you can paste a line of code.</>,
  },
  {
    q: "Do I need my own website to use RuufPro?",
    a: <>Not really — the widget can live on a <strong>Facebook ad link, a Google My Business profile, or a free landing page</strong> we can help you set up. Most roofers paste it on their existing site. You just need a place to point homeowners to.</>,
  },
  {
    q: "What is Riley exactly?",
    a: <>Riley is RuufPro&apos;s AI chatbot. It answers homeowner questions 24/7 — <strong>roof age, insurance coverage, urgency, material options</strong> — and qualifies them before they hit your dashboard. <strong>Every lead you see is already warm.</strong></>,
  },
  {
    q: "How long does setup take?",
    a: <><strong>Under 5 minutes.</strong> Sign up, paste one line of embed code on your site, and Riley + the estimator go live instantly. Add your pricing rates in another 2 minutes and you&apos;re capturing qualified leads.</>,
  },
  {
    q: "How accurate are the estimates?",
    a: <>We&apos;ll be straight with you: these are <strong>ballpark estimates, not bids.</strong> We measure the actual roof from satellite imagery — area, pitch, and complexity — and combine it with your pricing. Estimates land <strong>within ±10%</strong> of typical contract prices. They won&apos;t catch hidden damage or rotten decking — that&apos;s what your inspection is for. The goal is to give homeowners <strong>a realistic starting number so the serious ones call you.</strong></>,
  },
  {
    q: "How does the satellite measurement actually work?",
    a: <>When a homeowner enters their address, we pull <strong>satellite and LiDAR data</strong> — the same aerial imagery used by solar installers nationwide. It returns the actual roof area, pitch, and complexity. We multiply that by your pricing to produce the estimate. <strong>No drone, no site visit, no manual measuring.</strong></>,
  },
  {
    q: "How do I qualify for Google's Online Estimates filter?",
    a: <>Google&apos;s Online Estimates filter shows roofers who offer instant pricing. When you add the RuufPro widget, homeowners get a ballpark price without calling — <strong>which is exactly what Google is looking for.</strong> The widget is the fastest way to qualify.</>,
  },
  {
    q: "How is this different from lead generation services?",
    a: <>Lead gen services sell you <strong>shared leads</strong> — the same homeowner goes to 4-5 contractors, and you&apos;re racing to call first. RuufPro leads come from <strong>your own site or ad.</strong> The homeowner found you, entered their address, and wants to hear from <strong>you specifically.</strong> Zero sharing.</>,
  },
  {
    q: "What if I'm just starting out?",
    a: <>RuufPro works the same whether you&apos;ve done <strong>5 roofs or 500.</strong> You don&apos;t need a big portfolio or 50 Google reviews — the widget captures homeowners based on instant pricing, and Riley qualifies them before they hit your phone.</>,
  },
  {
    q: "Is there a contract?",
    a: <><strong>No.</strong> Month-to-month, cancel anytime with one click. No cancellation fees, no &quot;retention specialist&quot; calls, no questions asked. <strong>If we&apos;re not sending you leads, you shouldn&apos;t be paying us.</strong></>,
  },
  {
    q: "Do I own my data if I leave?",
    a: <><strong>Yes.</strong> Your leads, your homeowner conversations, your estimates — it&apos;s all yours. Export anytime. Cancel and your data goes with you.</>,
  },
];

const FAQ_PLAIN_ANSWERS: Record<string, string> = {
  "What's the catch?": "You get a 14-day free trial, no credit card. After that, it's $149/mo flat — cancel anytime, one click. No contract, no setup fees, no per-lead charges, no salesperson will ever call you.",
  "What happens after the 14-day trial?": "If you love it, do nothing — you'll be billed $149/mo automatically on day 15 (you'll only give us a card when you're ready). If not, cancel with one click. No calls, no retention specialist, no fees.",
  "Can I use the widget on my existing website?": "RuufPro is designed to embed on whatever site you already have. WordPress, Wix, Squarespace, GoDaddy, a Facebook ad link, anywhere you can paste a line of code.",
  "Do I need my own website to use RuufPro?": "Not necessarily. The widget can live on a Facebook ad link, a Google My Business profile, or a free landing page we can help you set up. Most roofers paste it on their existing site.",
  "What is Riley exactly?": "Riley is RuufPro's AI chatbot. It answers homeowner questions 24/7 — roof age, insurance coverage, urgency, material options — and qualifies them before they hit your dashboard. Every lead you see is already warm.",
  "How long does setup take?": "Under 5 minutes. Sign up, paste one line of embed code on your site, and Riley + the estimator go live instantly.",
  "How accurate are the estimates?": "These are ballpark estimates, not bids. We measure the actual roof from satellite imagery — area, pitch, and complexity. Combined with your pricing, estimates land within ±10% of typical contract prices.",
  "How does the satellite measurement actually work?": "When a homeowner enters their address, we pull satellite and LiDAR data — the same aerial imagery used by solar installers. It returns the actual roof area, pitch, and complexity.",
  "How do I qualify for Google's Online Estimates filter?": "Google's Online Estimates filter shows roofers who offer instant pricing. When you add the RuufPro widget, homeowners get a ballpark price without calling — which is exactly what Google is looking for.",
  "How is this different from lead generation services?": "Lead gen services sell you shared leads — the same homeowner goes to 4-5 contractors. RuufPro leads come from your own site or ad. The homeowner found you and wants to hear from you specifically.",
  "What if I'm just starting out?": "RuufPro works the same whether you've done 5 roofs or 500. You don't need a big portfolio or 50 Google reviews.",
  "Is there a contract?": "No. Month-to-month, cancel anytime with one click. No cancellation fees, no questions asked.",
  "Do I own my data if I leave?": "Yes. Your leads, your homeowner conversations, your estimates — it's all yours. Export anytime.",
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
