"use client";

import { motion } from "framer-motion";

// Spinning badge — smaller variant for the CTA
const SmallBadge = () => (
  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-[#D4863E] rounded-full flex items-center justify-center shadow-xl rotate-12 border-[2px] border-white/10">
    <div className="absolute inset-1 animate-[spin_10s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path id="ctaCirclePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        <text className="text-[11px] font-black tracking-[0.18em] uppercase" fill="white">
          <textPath href="#ctaCirclePath" startOffset="0%">
            FREE FOREVER • FREE FOREVER •
          </textPath>
        </text>
      </svg>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-8 h-8 text-white stroke-current overflow-visible" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,80 Q 40,50 30,30 T 80,20" />
        <path d="M60,10 L80,20 L70,40" />
      </svg>
    </div>
  </div>
);

export default function RidgelineFinalCTA() {
  return (
    <section className="relative bg-[#1B3A4B] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(212,134,62,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-10"
          >
            <SmallBadge />
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="text-[clamp(2.5rem,6vw,5rem)] font-black uppercase tracking-tighter text-white leading-[0.9] mb-6 max-w-3xl"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #0D1F2D, 2px 2px 0 #0D1F2D, 3px 3px 0 #0D1F2D, 4px 4px 0 #0D1F2D, 5px 5px 0 #0D1F2D, 6px 6px 0 #0D1F2D",
            }}
          >
            Ready To Get Found Online?
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed mb-10"
          >
            Join roofers getting leads with satellite-powered estimates and
            professional websites — free to start, no credit card.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-10"
          >
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#c0763a] transition-colors duration-300 shadow-lg shadow-[#D4863E]/20"
            >
              Get Your Free Website
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
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/30 text-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-[#1B3A4B] transition-colors duration-300"
            >
              See Live Demo
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/30 font-semibold uppercase tracking-wider"
          >
            <span>Free forever</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>No credit card</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>5-minute setup</span>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <div className="bg-white text-[#1B3A4B] font-black tracking-tight text-[10px] px-2.5 py-1 rounded-xl rounded-bl-sm relative">
              RIDGE
              <div className="absolute -bottom-1 left-0 w-2.5 h-2.5 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
            </div>
            <div className="bg-[#D4863E] text-white font-black text-[10px] px-2.5 py-1 rounded-full border border-white/20">
              LINE
            </div>
          </div>

          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} RoofReady. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="#" className="hover:text-white/60 transition-colors">FAQ</a>
            <a href="/login" className="hover:text-white/60 transition-colors">Log In</a>
          </div>
        </div>
      </div>
    </section>
  );
}
