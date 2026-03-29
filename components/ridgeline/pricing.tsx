"use client";

import { motion } from "framer-motion";
import { Globe, Calculator, Zap, Check, X } from "lucide-react";
import { ReactNode } from "react";

interface Plan {
  name: string;
  icon: ReactNode;
  badge: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  highlighted: boolean;
  comingSoon: boolean;
  features: string[];
  locked: string[];
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    icon: <Globe className="w-4 h-4" />,
    badge: "Free Forever",
    price: "$0",
    period: "/ month",
    description: "Professional website that gets you found online",
    cta: "Get Your Free Website",
    highlighted: false,
    comingSoon: false,
    features: [
      "Professional roofing website",
      "Mobile-first, SEO optimized",
      "Contact form + lead capture",
      "Email notifications",
      "Click-to-call on every page",
      "Trust badges auto-generated",
    ],
    locked: [
      "Satellite estimate widget",
      "Embed on external sites",
      "Review automation",
    ],
  },
  {
    name: "Pro",
    icon: <Calculator className="w-4 h-4" />,
    badge: "Most Popular",
    price: "$99",
    period: "/ month",
    description: "Satellite-powered estimates that capture leads",
    cta: "Start Free Trial",
    highlighted: true,
    comingSoon: false,
    features: [
      "Everything in Starter, plus:",
      "Satellite estimate widget",
      "Instant ballpark estimates",
      "Embed on any website",
      "Lead dashboard with details",
      "Contractor-controlled pricing",
      "Regional pricing suggestions",
    ],
    locked: [
      "Review automation",
      "Auto-reply & follow-up",
    ],
  },
  {
    name: "Growth",
    icon: <Zap className="w-4 h-4" />,
    badge: "Coming Soon",
    price: "$149",
    period: "/ month",
    description: "Automate reviews, follow-ups, and more",
    cta: "Coming Soon",
    highlighted: false,
    comingSoon: true,
    features: [
      "Everything in Pro, plus:",
      "Review automation",
      "Auto-reply (60 seconds)",
      "Follow-up drip sequences",
      "SEO city pages",
      "Priority support",
      "Custom domain",
    ],
    locked: [],
  },
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export default function RidgelinePricing() {
  return (
    <section className="relative bg-[#1B3A4B] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Pricing
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-white leading-[0.95] mb-5"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D",
            }}
          >
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            No setup fees. No contracts. No hidden costs. Cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto items-start"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: plan.highlighted ? 1.03 : 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  },
                },
              }}
              className={`rounded-[2rem] overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-1 ${
                plan.highlighted
                  ? "bg-white/15 backdrop-blur-md border-2 border-[#D4863E]/60 shadow-2xl shadow-[#D4863E]/10"
                  : "bg-white/10 backdrop-blur-md border border-white/20"
              }`}
            >
              {/* Most Popular badge */}
              {plan.highlighted && (
                <div className="flex justify-center">
                  <span className="bg-[#D4863E] text-white text-[10px] font-black uppercase tracking-[0.15em] px-5 py-1.5 rounded-b-xl">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="p-7 pb-5">
                {/* Plan name + badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-white/50">{plan.icon}</div>
                  <span className="text-sm font-semibold text-white/60">{plan.name}</span>
                  {!plan.highlighted && (
                    <span className="ml-auto text-[10px] font-bold text-white/40 border border-white/20 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-end gap-1.5 mb-2">
                  <span
                    className="text-4xl font-black tracking-tight text-white"
                    style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-white/40 text-sm pb-1">{plan.period}</span>
                </div>

                <p className="text-xs text-white/50 mb-6">{plan.description}</p>

                {/* CTA */}
                {plan.comingSoon ? (
                  <div className="w-full py-3 rounded-full bg-white/5 text-center text-sm text-white/30 font-semibold">
                    Coming Soon
                  </div>
                ) : (
                  <a
                    href="/signup"
                    className={`block w-full py-3 rounded-full text-center text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                      plan.highlighted
                        ? "bg-[#D4863E] text-white hover:bg-[#c0763a]"
                        : "border-2 border-white/30 text-white hover:bg-white hover:text-[#1B3A4B]"
                    }`}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>

              {/* Divider */}
              <div className="mx-7 h-px bg-white/10" />

              {/* Features */}
              <div className="p-7 pt-5 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check className="w-4 h-4 text-[#D4863E] shrink-0 mt-0.5" strokeWidth={3} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {plan.locked.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 my-4 text-[10px] text-white/20 uppercase tracking-wider">
                      <span className="h-px flex-1 bg-white/10" />
                      <span>Upgrade to access</span>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <ul className="space-y-3">
                      {plan.locked.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-white/30">
                          <X className="w-4 h-4 text-white/20 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
