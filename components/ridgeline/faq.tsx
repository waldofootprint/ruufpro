"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What's the catch?",
    a: "Fair question. Your website is free — no credit card, no trial that expires, no catch. We make money when roofers choose our Pro plan at $149/mo, which turns your website visitors into qualified leads with satellite estimates, missed-call text-back, and Google review automation. That's 57% less than Roofle ($350/mo + a $2,000 setup fee). It's optional. Plenty of roofers use just the free site and never pay us a dime. We also offer a Growth plan at $299/mo for roofers who want SEO city pages, competitor monitoring, and a custom domain. No salesperson will ever call you. No contract. No hidden fees.",
  },
  {
    q: "Is the website really free?",
    a: "Yes, forever. No credit card, no trial that expires, no catch. Your roofing website is fully functional — contact form, SEO, click-to-call, lead capture, everything. We make money when you upgrade to Pro at $149/month or Growth at $299/month.",
  },
  {
    q: "How accurate are the estimates?",
    a: "We'll be straight with you: these are ballpark estimates, not bids. We use Google's Solar API to measure the actual roof from satellite imagery — area, pitch, and complexity. Combined with your custom pricing, estimates land within ±10% of typical contract prices. They won't catch hidden damage, rotten decking, or access issues — that's what your in-person inspection is for. The goal is to give homeowners a realistic starting number so the serious ones reach out to you.",
  },
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. Enter your business name, phone number, and city — your website generates instantly. The estimate widget takes another 2 minutes to set up. Just enter your per-square-foot rates and you're live.",
  },
  {
    q: "Can I use the widget on my existing website?",
    a: "Yes. The estimate widget embeds on any website with a single line of code — WordPress, Wix, Squarespace, custom builds, anything. Just paste the embed snippet and it works. You don't need our free website to use the widget.",
  },
  {
    q: "How do I qualify for Google's Online Estimates filter?",
    a: "Google's Online Estimates filter shows roofers who offer instant pricing on their website. When you add the RuufPro estimate widget to your site, homeowners can get a ballpark price without calling — which is exactly what Google is looking for. The widget is the fastest way to qualify.",
  },
  {
    q: "Is there a contract?",
    a: "No. Month-to-month billing, cancel anytime with one click. No cancellation fees, no \"retention specialist\" calls, no questions asked. If we're not sending you leads, you shouldn't be paying us.",
  },
  {
    q: "Do I own my data if I leave?",
    a: "Yes. Your leads, your website content, your business information — it's all yours. You can export everything anytime. We don't hold your website hostage or lock you into proprietary systems. If you cancel, your data goes with you.",
  },
  {
    q: "How does the satellite measurement actually work?",
    a: "When a homeowner enters their address, we call Google's Solar API — the same satellite data used by solar installers across the country. It returns the actual roof area, pitch, and complexity measured from aerial imagery. We combine that with geometric modeling for ridge and valley lengths, then multiply by your custom pricing to produce the estimate. No drone, no site visit, no manual measuring.",
  },
  {
    q: "What if I'm just starting out and don't have reviews or credentials yet?",
    a: "That's exactly who this is built for. You don't need a portfolio, a license number, or 50 Google reviews to get started. Your website looks professional from day one, and the estimate widget works the same whether you've done 5 roofs or 500. You can add trust signals like certifications and reviews as you earn them.",
  },
  {
    q: "How is this different from lead generation services?",
    a: "Lead gen services sell you shared leads — the same homeowner goes to 4-5 contractors, and you're racing to call first. With RuufPro, the leads come directly from your own website. The homeowner found you, entered their address on your site, and wants to hear from you specifically. These are your leads, not shared with anyone.",
  },
];

export default function RidgelineFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-[#FAFAF7] overflow-hidden">
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
                        <p className="text-sm text-[#1B3A4B]/60 leading-relaxed">
                          {faq.a}
                        </p>
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
