// Google Online Estimates Filter section — explains the problem.
// Creates urgency: Google hides roofers without online pricing.

"use client";

import { motion } from "framer-motion";
import { FlowButton } from "@/components/ui/flow-button";

const STATS = [
  { number: "78%", label: "of homeowners want pricing before they call" },
  { number: "76%", label: "of roofers don't show pricing online" },
  { number: "Dec 2025", label: "Google launched the Online Estimates filter" },
];

export default function GoogleFilter() {
  return (
    <section className="py-16 md:py-20 bg-white text-gray-900 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            The Problem
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Google just changed how homeowners find roofers
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            In December 2025, Google launched an &ldquo;Online Estimates&rdquo; filter for
            roofing searches. Roofers without online pricing are now hidden from
            homeowners who use it. Most roofers don&apos;t even know it exists.
          </p>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={{
            visible: {
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.number}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 300, damping: 25 },
                },
              }}
              className="relative overflow-hidden rounded-[20px] bg-[#f0f0f0] p-6 text-center transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff",
              }}
            >
              {/* Glass glow effect */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-brand-200/20 blur-2xl pointer-events-none" />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-24 rounded-t-3xl"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 40%, transparent 100%)",
                }}
              />
              <div className="relative z-10">
                <div className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                  {stat.number}
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Before/After visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Without RoofReady */}
          <div
            className="overflow-hidden rounded-[20px] bg-[#f0f0f0] p-6"
            style={{
              boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-600">Without Online Estimates</span>
            </div>
            <ul className="space-y-3">
              {[
                "Hidden from Google's Online Estimates filter",
                "Homeowners skip you for competitors who show pricing",
                "Losing leads you don't even know about",
                "Invisible to 78% of homeowners researching online",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* With RoofReady */}
          <div
            className="overflow-hidden rounded-[20px] bg-[#f0f0f0] p-6"
            style={{
              boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-700">With RoofReady</span>
            </div>
            <ul className="space-y-3">
              {[
                "Visible in Google's Online Estimates filter",
                "Homeowners see your pricing and call you first",
                "Satellite-powered estimates capture leads 24/7",
                "Professional website makes you look established",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <a href="/signup">
            <FlowButton text="Get Visible on Google — Free" />
          </a>
        </div>
      </div>
    </section>
  );
}
