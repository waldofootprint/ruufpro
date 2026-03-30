// Comparison table — RuufPro vs competitors.
// Premium animated table inspired by 21st.dev server management component.
// Uses framer-motion for staggered row animations and hover effects.

"use client";

import { motion } from "framer-motion";
import { FlowButton } from "@/components/ui/flow-button";

const FEATURES = [
  {
    feature: "Monthly cost",
    us: "$0 – $99",
    roofle: "$350",
    roofr: "$249+",
    scorpion: "$3,000+",
    usWins: true,
  },
  {
    feature: "Setup fee",
    us: "$0",
    roofle: "$2,000",
    roofr: "$0",
    scorpion: "$0",
    usWins: true,
  },
  {
    feature: "First year cost",
    us: "$0 – $1,188",
    roofle: "$6,200+",
    roofr: "$2,988+",
    scorpion: "$36,000+",
    usWins: true,
  },
  {
    feature: "Free roofing website",
    us: true,
    roofle: false,
    roofr: false,
    scorpion: false,
    usWins: true,
  },
  {
    feature: "Instant estimate widget",
    us: true,
    roofle: true,
    roofr: true,
    scorpion: false,
    usWins: false,
  },
  {
    feature: "Satellite roof measurement",
    us: true,
    roofle: true,
    roofr: true,
    scorpion: false,
    usWins: false,
  },
  {
    feature: "Lead capture",
    us: true,
    roofle: true,
    roofr: true,
    scorpion: true,
    usWins: false,
  },
  {
    feature: "Review automation",
    us: true,
    roofle: false,
    roofr: false,
    scorpion: true,
    usWins: true,
  },
  {
    feature: "Auto-reply & follow-up",
    us: true,
    roofle: false,
    roofr: false,
    scorpion: true,
    usWins: true,
  },
  {
    feature: "Month-to-month (no contract)",
    us: true,
    roofle: false,
    roofr: true,
    scorpion: false,
    usWins: true,
  },
  {
    feature: "Own your site if you leave",
    us: true,
    roofle: "N/A",
    roofr: "N/A",
    scorpion: false,
    usWins: true,
  },
  {
    feature: "Setup time",
    us: "5 minutes",
    roofle: "Hours",
    roofr: "Days",
    scorpion: "Weeks",
    usWins: true,
  },
];

function CellValue({ value, isUs }: { value: string | boolean; isUs?: boolean }) {
  if (value === true) {
    return (
      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
        isUs ? "bg-green-500/15 border border-green-500/30" : "bg-green-500/10"
      }`}>
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10">
        <svg className="w-4 h-4 text-red-400/60" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  return (
    <span className={`text-sm font-medium ${isUs ? "text-gray-900" : "text-gray-500"}`}>
      {value}
    </span>
  );
}

export default function Comparison() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            Compare
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            How we stack up
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Same satellite-powered estimates. Free website included.
            71% cheaper than the leading competitor.
          </p>
        </div>

        {/* Animated comparison table */}
        <div className="relative border border-gray-200 rounded-2xl p-4 md:p-6 bg-white shadow-sm">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            <div className="col-span-4">Feature</div>
            <div className="col-span-2 text-center">
              <span className="text-brand-600 font-bold text-sm normal-case">RuufPro</span>
            </div>
            <div className="col-span-2 text-center">Roofle</div>
            <div className="col-span-2 text-center">Roofr</div>
            <div className="col-span-2 text-center">Scorpion</div>
          </div>

          {/* Animated rows */}
          <motion.div
            className="space-y-2"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.06,
                  delayChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {FEATURES.map((row) => (
              <motion.div
                key={row.feature}
                variants={{
                  hidden: {
                    opacity: 0,
                    x: -20,
                    filter: "blur(4px)",
                  },
                  visible: {
                    opacity: 1,
                    x: 0,
                    filter: "blur(0px)",
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 28,
                      mass: 0.6,
                    },
                  },
                }}
              >
                <motion.div
                  className="relative bg-gray-50/50 border border-gray-100 rounded-xl p-4 overflow-hidden"
                  whileHover={{
                    y: -1,
                    backgroundColor: "rgba(249, 250, 251, 0.8)",
                    transition: { type: "spring", stiffness: 400, damping: 25 },
                  }}
                >
                  {/* Green gradient on left for rows where we win */}
                  {row.usWins && (
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none"
                      style={{
                        backgroundSize: "30% 100%",
                        backgroundPosition: "left",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                  )}

                  <div className="relative grid grid-cols-12 gap-2 md:gap-4 items-center">
                    <div className="col-span-4">
                      <span className="text-sm font-medium text-gray-900">
                        {row.feature}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <CellValue value={row.us} isUs />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <CellValue value={row.roofle} />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <CellValue value={row.roofr} />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <CellValue value={row.scorpion} />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="text-center mt-10">
          <a href="/signup">
            <FlowButton text="Start for Free" />
          </a>
        </div>
      </div>
    </section>
  );
}
