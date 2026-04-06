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

const EXAMPLE_SITES = [
  {
    name: "Pinnacle Roofing Co",
    location: "Tampa, FL",
    href: "/demo",
  },
  {
    name: "Summit Roofing",
    location: "Dallas, TX",
    href: "/demo/summit",
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
    label: "to a site most roofers don't have",
    detail: "Most roofing websites are slow, outdated, and missing what homeowners actually want. Yours won't be.",
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
          {/* Example Sites Header */}
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
              Here&apos;s What Your Site Looks Like.
            </h2>
            <p className="text-lg text-[#1B3A4B]/60 max-w-2xl mx-auto">
              Every site is built for roofers, looks great on any phone, and shows up on Google.
              Yours is generated automatically — just answer 4 questions.
            </p>
          </div>

          {/* Example Site Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-20 md:mb-24"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {EXAMPLE_SITES.map((site) => (
              <motion.a
                key={site.name}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-500 group block"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-[#1B3A4B] via-[#1B3A4B] to-[#2C3E50] relative overflow-hidden flex flex-col items-center justify-center px-8">
                  {/* Stylized site mockup */}
                  <div className="w-full max-w-[280px] bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 mb-3">
                    <div className="h-2 w-16 bg-white/20 rounded-full mb-3" />
                    <div className="h-6 w-3/4 bg-white/15 rounded mb-2" />
                    <div className="h-3 w-full bg-white/8 rounded mb-1" />
                    <div className="h-3 w-2/3 bg-white/8 rounded mb-3" />
                    <div className="h-8 w-32 bg-[#D4863E]/80 rounded-full" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold uppercase tracking-wider bg-[#D4863E] px-4 py-2 rounded-full shadow-lg">
                      See Live Site →
                    </span>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-black text-[#1B3A4B] uppercase tracking-wide mb-1">
                    {site.name}
                  </h3>
                  <p className="text-xs text-[#1B3A4B]/50">{site.location}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>

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
