"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, Shield, TrendingUp } from "lucide-react";

const PROOF_ITEMS = [
  {
    icon: TrendingUp,
    stat: "63%",
    label: "of roofers say finding new leads is their #1 problem",
  },
  {
    icon: Clock,
    stat: "5 min",
    label: "from signup to a live website",
  },
  {
    icon: DollarSign,
    stat: "$0",
    label: "to start — free forever, no card required",
  },
  {
    icon: Shield,
    stat: "No contract",
    label: "cancel anytime — your website stays live",
  },
];

const EARLY_ADOPTER_PERKS = [
  {
    stat: "Early",
    label: "access for founding roofers",
    detail: "We're just getting started. You get our full attention and a direct line to shape what we build next.",
  },
  {
    stat: "$0",
    label: "for your professional site",
    detail: "No credit card. No trial. A real website that makes your phone ring.",
  },
  {
    stat: "5 min",
    label: "to a site built to rank",
    detail: "Fast. SEO-optimized. Easy to edit from your dashboard. While your competitors are still on page 3, you'll be getting the call.",
  },
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export default function RidgelineSocialProof() {
  return (
    <section className="relative overflow-hidden">
      {/* Part A — Stats Strip */}
      <div className="relative bg-[#D4863E] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0" />

        <motion.div
          className="relative z-10 mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {PROOF_ITEMS.map((item) => (
              <motion.div
                key={item.stat}
                variants={fadeUp}
                className="flex flex-col items-center text-center gap-2"
              >
                <item.icon className="w-5 h-5 text-white/70 mb-1" strokeWidth={2.5} />
                <span
                  className="text-2xl md:text-3xl font-black text-white tracking-tight"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  {item.stat}
                </span>
                <span className="text-xs md:text-sm text-white/80 leading-snug max-w-[160px]">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Part B — Your Site, Your Brand + Part C — Early Adopter */}
      <div className="relative bg-[#FAFAF7]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
          {/* Early Adopter */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
              Limited Early Access
            </p>
            <h3
              className="text-[clamp(1.5rem,3vw,2.5rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-3"
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                textShadow:
                  "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10",
              }}
            >
              Be One of the First 100 Roofers.
            </h3>
            <p className="text-base text-[#1B3A4B]/50 max-w-xl mx-auto">
              We&apos;re opening RuufPro to a small group of founding roofers first.
              You get our full attention — and a free professional website.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {EARLY_ADOPTER_PERKS.map((perk) => (
              <motion.div
                key={perk.label}
                variants={fadeUp}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center"
              >
                <span
                  className="text-3xl md:text-4xl font-black text-[#D4863E] tracking-tight block mb-2"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  {perk.stat}
                </span>
                <p className="font-bold text-sm text-[#1B3A4B] uppercase tracking-wide mb-3">
                  {perk.label}
                </p>
                <p className="text-sm text-[#1B3A4B]/50 leading-relaxed">
                  {perk.detail}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <div className="flex justify-center mt-12">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-[#1B3A4B]/20 text-[#1B3A4B] text-sm font-bold uppercase tracking-wider hover:bg-[#1B3A4B] hover:text-white transition-colors duration-300"
            >
              Build Your Free Site
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
