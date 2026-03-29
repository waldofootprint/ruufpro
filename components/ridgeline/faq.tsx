"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is the website really free?",
    a: "Yes, forever. No credit card required, no trial that expires. Your roofing website is free and fully functional — contact form, SEO, click-to-call, everything. We make money from the estimate widget and other paid add-ons.",
  },
  {
    q: "How accurate are the estimates?",
    a: "We use Google's Solar API to measure your customer's actual roof from satellite imagery — the same data source used by solar companies nationwide. Combined with your custom pricing, pitch adjustments, and waste factors, our estimates are within ±8-12% of actual contract prices at launch, improving to ±5-8% over time with calibration.",
  },
  {
    q: "Can I use the widget on my existing website?",
    a: "Absolutely. The estimate widget embeds on any website with a single line of code — just paste it and it works. You don't need a RoofReady website to use the widget.",
  },
  {
    q: "Do I own my website if I leave?",
    a: "Yes. Your website content and leads are yours. If you leave RoofReady, you can export everything.",
  },
  {
    q: "How long does setup take?",
    a: "Under 5 minutes. Enter your business name, phone, and city — your website generates instantly. Setting up the estimate widget takes another 2 minutes (just enter your per-sqft rates).",
  },
  {
    q: "What's the difference between you and Roofle?",
    a: "Roofle charges $350/month plus a $2,000 setup fee ($6,200 first year). They don't offer a website — just the estimate widget. We offer a free professional website plus the same satellite-powered estimates at $99/month with no setup fee.",
  },
  {
    q: "Is there a contract?",
    a: "No. Month-to-month billing. Cancel anytime with one click. No cancellation fees, no questions asked.",
  },
  {
    q: "How does the satellite measurement work?",
    a: "When a homeowner enters their address, we call Google's Solar API which returns the actual roof area, pitch, and complexity measured from satellite imagery. We combine this with geometric inference for ridge and valley lengths, then multiply by your custom pricing to generate the ballpark estimate.",
  },
];

export default function RidgelineFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative bg-[#FAFAF7] overflow-hidden">
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
