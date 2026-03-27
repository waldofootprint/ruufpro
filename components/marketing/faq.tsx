// FAQ section — expandable accordion.

"use client";

import { useState } from "react";
import { AnimatedCard, CardBody } from "@/components/ui/animated-card";

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
    a: "Roofle charges $350/month plus a $2,000 setup fee ($6,200 first year). They don't offer a website — just the estimate widget. We offer a free professional website plus the same satellite-powered estimates at $99/month with no setup fee. That's 71% cheaper.",
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

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-20 bg-gray-50">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <AnimatedCard key={i} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold text-gray-900 pr-4">
                  {faq.q}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
