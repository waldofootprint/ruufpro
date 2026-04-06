"use client";

import { motion } from "framer-motion";
import { UserPlus, SlidersHorizontal, BellRing } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up",
    time: "~60 seconds",
    description:
      "Enter your business name, phone, and city. That's all. We generate everything — design, copy, SEO, hosting.",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "Customize Your Site",
    time: "~2 minutes",
    description:
      "Pick your template, add your logo and photos, set your service area. We handle the SEO, hosting, and design.",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Start Getting Leads",
    time: "Instant",
    description:
      "Homeowners find your site, get an instant satellite estimate, and you get a text the moment they reach out — no chasing required.",
  },
];

// Hand-drawn connector between steps (horizontal on desktop)
const StepConnector = () => (
  <svg viewBox="0 0 80 30" className="w-16 h-6 text-[#D4863E] stroke-current overflow-visible hidden md:block" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5,15 C 20,5 40,25 60,12" />
    <path d="M50,5 L60,12 L50,20" />
  </svg>
);

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
} as const;

export default function RidgelineHowItWorks() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B06_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B06_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            How It Works
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] max-w-3xl mx-auto"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            Under 5 Minutes. No Tech Skills. Seriously.
          </h2>
        </div>

        {/* Steps */}
        <motion.div
          className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-0 max-w-5xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {STEPS.map((step, i) => (
            <motion.div key={step.number} variants={fadeUp} className="flex items-center md:items-start gap-0">
              {/* Card */}
              <div className="bg-[#FAFAF7] border border-gray-100 rounded-[2rem] p-8 w-full max-w-[300px] text-center hover:-translate-y-1 transition-all duration-500 group shadow-sm">
                {/* Step number */}
                <span
                  className="text-[clamp(3rem,5vw,4.5rem)] font-black text-[#1B3A4B]/8 leading-none block mb-4 group-hover:text-[#1B3A4B]/15 transition-colors"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-[#D4863E] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#D4863E]/20">
                  <step.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>

                {/* Title + time */}
                <h3 className="text-lg font-black text-[#1B3A4B] uppercase tracking-wide mb-1">
                  {step.title}
                </h3>
                <span className="text-xs font-bold text-[#D4863E] uppercase tracking-widest">
                  {step.time}
                </span>

                {/* Description */}
                <p className="text-sm text-[#1B3A4B]/55 leading-relaxed mt-4">
                  {step.description}
                </p>
              </div>

              {/* Connector arrow (not after last step) */}
              {i < STEPS.length - 1 && (
                <div className="mx-4 shrink-0 self-center">
                  <StepConnector />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="flex justify-center mt-14 md:mt-16">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#c0763a] transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            Get My Free Site
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
