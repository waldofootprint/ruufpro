"use client";

import { motion } from "framer-motion";
import { Ban, FileX, BadgeDollarSign } from "lucide-react";

const PROMISES = [
  {
    icon: Ban,
    text: "No salesperson will ever call you.",
  },
  {
    icon: FileX,
    text: "No contract. Cancel anytime. Your site stays live.",
  },
  {
    icon: BadgeDollarSign,
    text: "No hidden fees. No upsell tricks. No bait-and-switch.",
  },
];

// Hand-drawn underline accent
const HandDrawnUnderline = () => (
  <svg viewBox="0 0 200 12" className="w-48 md:w-64 h-3 text-[#D4863E] stroke-current overflow-visible mx-auto mt-2" fill="none" strokeWidth="3" strokeLinecap="round">
    <path d="M5,8 C 40,2 80,10 120,5 C 150,2 170,9 195,6" />
  </svg>
);

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
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
} as const;

export default function RidgelineWhatsTheCatch() {
  return (
    <section className="relative bg-[#FAFAF7] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            Transparency
          </p>
          <h2
            className="text-[clamp(2.5rem,6vw,5rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.9] mb-2"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            &ldquo;What&rsquo;s The Catch?&rdquo;
          </h2>
          <HandDrawnUnderline />
        </div>

        {/* Content — two-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-5xl mx-auto">
          {/* Left: The honest answer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <p className="text-lg md:text-xl text-[#1B3A4B]/80 leading-relaxed mb-6">
              Fair question. Here&rsquo;s the honest answer:
            </p>
            <p className="text-base text-[#1B3A4B]/70 leading-relaxed mb-6">
              Your website is free. We make money when roofers choose our
              Pro plan — <span className="font-bold text-[#D4863E]">$149/mo</span> — which
              turns your website visitors into qualified leads with satellite estimates,
              missed-call text-back, and review automation. That&rsquo;s 57% less than Roofle ($350/mo + a $2,000 setup fee).
              It&rsquo;s optional. Plenty of roofers use just the free
              site and never pay us a dime.
            </p>
            <p className="text-base text-[#1B3A4B]/70 leading-relaxed">
              Why give the website away? Because a great free product is the best
              marketing there is. You tell another roofer. They sign up. We grow
              by being useful — not by charging agencies rates or hiring a sales team.
            </p>
          </motion.div>

          {/* Right: Promise cards */}
          <motion.div
            className="flex flex-col gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {PROMISES.map((promise) => (
              <motion.div
                key={promise.text}
                variants={fadeUp}
                className="bg-white border border-[#1B3A4B]/10 rounded-[1.5rem] p-6 flex items-start gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-[#1B3A4B] flex items-center justify-center shrink-0">
                  <promise.icon className="w-5 h-5 text-[#D4863E]" strokeWidth={2.5} />
                </div>
                <p className="text-sm md:text-base font-semibold text-[#1B3A4B] leading-snug pt-2">
                  {promise.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-14 md:mt-16">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#1B3A4B] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#0D1F2D] transition-colors duration-300 shadow-lg"
          >
            Build My Free Website
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 stroke-current"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
