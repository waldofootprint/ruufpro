// Pricing section — premium cards with framer-motion animations,
// widget-matching card style, and dramatic "Most Popular" highlight.

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FlowButton } from "@/components/ui/flow-button";
import { CheckCircle2, XCircleIcon, Globe, Calculator, Zap } from "lucide-react";

const PLANS = [
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

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-20 relative overflow-hidden bg-gray-50">
      {/* Subtle dotted grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.06) 0.8px, transparent 0.8px)",
          backgroundSize: "14px 14px",
          maskImage:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,1), rgba(0,0,0,0.2) 40%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 relative">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            No setup fees. No contracts. No hidden costs. Cancel anytime.
          </p>
        </div>

        <motion.div
          className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-6"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 30,
                  scale: 0.95,
                  filter: "blur(4px)",
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: plan.highlighted ? 1.03 : 1,
                  filter: "blur(0px)",
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.8,
                  },
                },
              }}
              className="w-full max-w-xs"
            >
              {/* Card — matches widget style */}
              <div
                className={cn(
                  "overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-500 hover:shadow-2xl relative h-full flex flex-col",
                  plan.highlighted
                    ? "ring-2 ring-brand-600 shadow-2xl shadow-brand-500/15"
                    : ""
                )}
              >
                {/* Subtle border */}
                <div className={cn(
                  "absolute inset-0 rounded-3xl border pointer-events-none",
                  plan.highlighted ? "border-brand-200" : "border-gray-200/60"
                )} />

                {/* Most Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-px left-0 right-0 z-10 flex justify-center">
                    <span className="bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-b-xl">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header with glass effect */}
                <div className={cn(
                  "relative p-6 pb-5",
                  plan.highlighted ? "bg-gradient-to-b from-brand-50/80 to-white" : "bg-gradient-to-b from-gray-50/80 to-white"
                )}>
                  {/* Glass gradient overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-32 rounded-t-3xl"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0) 100%)",
                    }}
                  />

                  <div className="relative">
                    {/* Plan name + icon */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-gray-400">{plan.icon}</div>
                      <span className="text-sm font-medium text-gray-500">{plan.name}</span>
                      {!plan.highlighted && (
                        <span className="ml-auto text-[10px] font-medium text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-1 mt-4 mb-1">
                      <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
                    </div>

                    <p className="text-xs text-gray-500 mb-5">{plan.description}</p>

                    {/* CTA */}
                    {plan.comingSoon ? (
                      <div className="w-full py-3 rounded-xl bg-gray-100 text-center text-sm text-gray-400 font-medium">
                        Coming Soon
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <FlowButton text={plan.cta} onClick={() => window.location.href = "/signup"} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 h-px bg-gray-100" />

                {/* Features */}
                <div className="p-6 pt-5 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.locked.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 my-4 text-xs text-gray-300">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span>Upgrade to access</span>
                        <span className="h-px flex-1 bg-gray-200" />
                      </div>
                      <ul className="space-y-3">
                        {plan.locked.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-400">
                            <XCircleIcon className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
