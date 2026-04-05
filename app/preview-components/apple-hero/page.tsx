"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
/* eslint-disable @next/next/no-img-element */

export default function AppleHeroPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.4], [0, -40]);

  return (
    <div className="bg-white text-[#1d1d1f] antialiased">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-4 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold tracking-tight text-[#1d1d1f]">RUUF</span>
          <span className="text-[11px] font-bold text-[#c4622a] bg-[#c4622a]/8 px-2 py-0.5 rounded-full">PRO</span>
        </div>
        <a
          href="/signup"
          className="text-[13px] font-medium text-white bg-[#1d1d1f] px-5 py-2 rounded-full hover:bg-[#333] transition-colors"
        >
          Get Started
        </a>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">

        {/* Text */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="relative z-10 text-center mb-12 pt-20"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[clamp(3.5rem,9vw,120px)] font-semibold tracking-[-0.045em] leading-[0.9] text-[#1d1d1f] mb-5"
            style={{ fontFamily: "var(--font-outfit), 'SF Pro Display', -apple-system, sans-serif" }}
          >
            Clay Tile.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-[#86868b] text-lg md:text-[21px] font-medium leading-snug"
          >
            Built to outlast everything under it.
          </motion.p>
        </motion.div>

        {/* Product */}
        <motion.div
          style={{ scale: imgScale, y: imgY }}
          className="relative w-full max-w-[1000px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Shadow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-6 bg-black/[0.04] rounded-[100%] blur-2xl" />

            <img
              src="/images/roof-diagrams/tile-roof-complex.png"
              alt="Clay tile roof"
              className="relative w-full"
            />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
