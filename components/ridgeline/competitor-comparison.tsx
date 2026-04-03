"use client";

import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";

const COLUMNS = ["RuufPro", "Roofle", "Roofr", "Agency"] as const;

const ROWS = [
  {
    label: "Monthly cost",
    values: ["$149/mo (Pro)\n$0 (site only)", "$350/mo", "$249–349/mo\n+ $149 widget", "$500–2,500/mo"],
  },
  {
    label: "Setup fee",
    values: ["$0", "$2,000", "$0", "$500–5,000"],
  },
  {
    label: "Free website",
    values: [true, false, false, false],
  },
  {
    label: "Satellite estimates",
    values: [true, true, true, false],
  },
  {
    label: "Contract required",
    values: [false, "Varies", false, "Usually"],
  },
  {
    label: "Setup time",
    values: ["5 minutes", "Days", "Hours", "Weeks"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-5 h-5 text-[#D4863E] mx-auto" strokeWidth={3} />;
  if (value === false) return <X className="w-5 h-5 text-white/20 mx-auto" strokeWidth={2.5} />;
  return <span className="whitespace-pre-line">{value}</span>;
}

export default function RidgelineComparison() {
  return (
    <section className="relative bg-[#FAFAF7] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#D4863E] mb-4">
            How We Compare
          </p>
          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-5 max-w-3xl mx-auto"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            Same Capability. Fraction of the Price.
          </h2>
        </div>

        {/* Comparison Table */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="max-w-4xl mx-auto overflow-x-auto"
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left p-4 text-[#1B3A4B]/50 font-semibold text-xs uppercase tracking-wider" />
                {COLUMNS.map((col, i) => (
                  <th
                    key={col}
                    className={`p-4 text-center font-black uppercase tracking-wide text-sm ${
                      i === 0
                        ? "text-[#D4863E] bg-[#D4863E]/5 border-2 border-[#D4863E]/20 rounded-t-2xl"
                        : "text-[#1B3A4B]/60"
                    }`}
                    style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIdx) => (
                <tr
                  key={row.label}
                  className={rowIdx % 2 === 0 ? "bg-white/60" : "bg-white/30"}
                >
                  <td className="p-4 font-semibold text-[#1B3A4B]/70 text-xs uppercase tracking-wider whitespace-nowrap">
                    {row.label}
                  </td>
                  {row.values.map((val, colIdx) => (
                    <td
                      key={`${row.label}-${colIdx}`}
                      className={`p-4 text-center text-[#1B3A4B]/70 ${
                        colIdx === 0
                          ? "bg-[#D4863E]/5 border-x-2 border-[#D4863E]/20 font-bold text-[#1B3A4B]"
                          : ""
                      } ${
                        rowIdx === ROWS.length - 1 && colIdx === 0
                          ? "border-b-2 border-[#D4863E]/20 rounded-b-2xl"
                          : ""
                      }`}
                    >
                      <CellValue value={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* The Math callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="max-w-2xl mx-auto mt-12 bg-[#1B3A4B] rounded-[2rem] p-8 md:p-10 text-center"
        >
          <p className="text-white/60 text-sm mb-3 font-semibold uppercase tracking-wider">
            The Math
          </p>
          <p className="text-white text-lg md:text-xl leading-relaxed">
            <span className="font-black">Roofle costs $6,200/year</span>{" "}
            <span className="text-white/50">($350/mo + $2,000 setup).</span>{" "}
            <span className="font-black text-[#D4863E]">RuufPro costs $1,788/year</span>{" "}
            <span className="text-white/50">($149/mo, no setup).</span>{" "}
            Same satellite estimates. <span className="font-black">Save $4,412 in year one.</span>
          </p>
        </motion.div>

        {/* CTA */}
        <div className="flex justify-center mt-10">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4863E] text-white text-sm font-bold hover:bg-[#c0763a] transition-colors shadow-lg hover:shadow-xl"
          >
            Start Getting Leads — $149/mo
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
