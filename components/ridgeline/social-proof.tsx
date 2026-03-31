"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, Shield, TrendingUp, Quote } from "lucide-react";

const PROOF_ITEMS = [
  {
    icon: TrendingUp,
    stat: "63%",
    label: "of roofers say finding new leads is their #1 problem",
  },
  {
    icon: Clock,
    stat: "5 min",
    label: "from signup to a live, indexed website",
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

const TEMPLATES = [
  {
    name: "Modern Clean",
    description: "Bold editorial style with orange accents",
    slug: "joes-roofing-modern",
  },
  {
    name: "Chalkboard",
    description: "Dark green-gray with yellow chalk details",
    slug: "joes-roofing",
  },
  {
    name: "Blueprint",
    description: "Cool white and slate blue professional look",
    slug: "joes-roofing-blueprint",
  },
];

const TESTIMONIALS = [
  {
    quote: "I had a homeowner request an estimate at 11pm on a Saturday. Woke up to a lead in my dashboard.",
    name: "Mike R.",
    role: "Owner, Summit Roofing",
  },
  {
    quote: "Set it up before my first cup of coffee. My site looks better than guys who've been in business 20 years.",
    name: "Carlos D.",
    role: "New contractor, 6 months in",
  },
  {
    quote: "Switched from Roofle and saved over $3,000 in the first year. Same estimates, way less money.",
    name: "James T.",
    role: "Owner, T&J Roofing",
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

      {/* Part B — Template Gallery + Part C — Testimonials */}
      <div className="relative bg-[#FAFAF7]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
          {/* Template Gallery Header */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
              Built for Roofers
            </p>
            <h2
              className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-5"
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                textShadow:
                  "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
              }}
            >
              Three Styles. All Professional.
            </h2>
            <p className="text-lg text-[#1B3A4B]/60 max-w-2xl mx-auto">
              Every site is roofing-specific, mobile-first, and SEO-optimized.
              Pick a style and your site is live in minutes.
            </p>
          </div>

          {/* Template Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-24"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {TEMPLATES.map((template) => (
              <motion.div
                key={template.name}
                variants={fadeUp}
                className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-500"
              >
                {/* Screenshot placeholder — replace with actual screenshots */}
                <div className="aspect-[16/10] bg-gradient-to-br from-[#1B3A4B] to-[#2C3E50] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">
                      Preview
                    </p>
                    <p className="text-white font-black text-lg">{template.name}</p>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-black text-[#1B3A4B] uppercase tracking-wide mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-[#1B3A4B]/50">{template.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
              From Roofers Like You
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
              >
                <Quote className="w-8 h-8 text-[#D4863E]/20 mb-4" />
                <p className="text-sm text-[#1B3A4B]/70 leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-sm text-[#1B3A4B]">{t.name}</p>
                  <p className="text-xs text-[#1B3A4B]/40">{t.role}</p>
                </div>
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
