"use client";

import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";

const CARDS = [
  {
    icon: MapPin,
    stat: "Auto",
    label: "Found in every city you serve",
    detail:
      "You're 10 minutes from Brandon. A dedicated page for that city gives Google a reason to show you there. We build one for every city you serve.",
  },
  {
    icon: Clock,
    stat: "24/7",
    label: "Gets you leads while you're on the roof",
    detail:
      "Responding in under 5 minutes makes you 391% more likely to qualify a lead. Your site has click-to-call on every page and a contact form that texts you the second someone reaches out. You're not chasing leads — they're finding you.",
  },
];

const CHECKLIST = [
  {
    item: "Google-friendly page structure built into every page",
    stat: "Sites with proper structure rank higher in local search",
  },
  {
    item: "Your business name, city, and services in all the right places",
    stat: "Consistency across your site is the #1 factor Google uses for local rankings",
  },
  {
    item: "Fast-loading images that don't slow your site down",
    stat: "53% of visitors leave after 3 seconds — your site loads in under 3",
  },
  {
    item: "Phone number clickable on every page, every device",
    stat: "Phone callers convert at 37% — 10x higher than form fills",
  },
  {
    item: "A separate page for each city you serve",
    stat: "Each page gives Google another reason to show you in that area",
  },
  {
    item: "Works perfectly on any phone, any screen size",
    stat: "82% of roofing searches happen on mobile",
  },
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export default function RidgelineSEOAdvantage() {
  return (
    <section className="relative bg-[#FAFAF7] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Why Your Site Gets Found
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-5 max-w-3xl mx-auto"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            Show Up on Google. In Every City You Serve.
          </h2>
          <p className="text-lg text-[#1B3A4B]/60 max-w-2xl mx-auto">
            Most roofing websites are invisible. Yours won&apos;t be. Here&apos;s what we build into every site — automatically.
          </p>
        </div>

        {/* 2-Card Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-16 md:mb-20"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {CARDS.map((card) => (
            <motion.div
              key={card.label}
              variants={fadeUp}
              className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A4B] flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-[#D4863E]" strokeWidth={2.5} />
                </div>
                <span
                  className="text-2xl font-black text-[#D4863E] tracking-tight"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  {card.stat}
                </span>
              </div>
              <h3 className="font-bold text-[#1B3A4B] text-base mb-3">
                {card.label}
              </h3>
              <p className="text-sm text-[#1B3A4B]/55 leading-relaxed">
                {card.detail}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Checklist */}
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-6 text-center">
            What We Handle for You
          </p>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {CHECKLIST.map((item) => (
              <motion.div
                key={item.item}
                variants={fadeUp}
                className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-[#1B3A4B] mb-1">
                  {item.item}
                </p>
                <p className="text-xs text-[#1B3A4B]/40">
                  {item.stat}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom contrast line + CTA */}
        <div className="text-center mt-14">
          <p className="text-sm text-[#1B3A4B]/40 mb-6">
            Most roofers pay an agency $500/month for this. Yours is built in.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold hover:bg-[#c0763a] transition-colors shadow-lg hover:shadow-xl"
          >
            Get My Free Site
          </a>
        </div>
      </div>
    </section>
  );
}
