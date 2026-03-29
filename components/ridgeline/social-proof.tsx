"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, Shield, TrendingUp } from "lucide-react";

const PROOF_ITEMS = [
  {
    icon: TrendingUp,
    stat: "63%",
    label: "of roofers say leads are their #1 challenge",
  },
  {
    icon: Clock,
    stat: "5 min",
    label: "from signup to live website",
  },
  {
    icon: DollarSign,
    stat: "$0",
    label: "to start — free forever",
  },
  {
    icon: Shield,
    stat: "No contract",
    label: "cancel anytime, keep your site",
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
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export default function RidgelineSocialProof() {
  return (
    <section className="relative bg-[#D4863E] overflow-hidden">
      {/* Subtle texture */}
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
    </section>
  );
}
