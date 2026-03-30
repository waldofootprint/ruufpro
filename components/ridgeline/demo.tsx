"use client";

import EstimateWidgetV4 from "@/components/estimate-widget-v4";

export default function RidgelineDemo() {
  return (
    <section className="relative bg-[#FAFAF7] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1B3A4B08_1px,transparent_1px),linear-gradient(to_bottom,#1B3A4B08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1B3A4B]/15 bg-white px-4 py-2 shadow-sm mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4863E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4863E]"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1B3A4B]">
              Live Demo · Try It Now
            </span>
          </div>

          <h2
            className="text-[clamp(2rem,5vw,4rem)] font-black uppercase tracking-tighter text-[#1B3A4B] leading-[0.95] mb-5"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow:
                "1px 1px 0 #1B3A4B15, 2px 2px 0 #1B3A4B10, 3px 3px 0 #1B3A4B08",
            }}
          >
            See It In Action
          </h2>
          <p className="text-lg text-[#1B3A4B]/60 max-w-2xl mx-auto leading-relaxed">
            This is exactly what your customers see. Enter any address and click
            through the flow — satellite-measured estimates in seconds.
          </p>
        </div>

        {/* Widget container — dark background for glass effect */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1B3A4B] rounded-[2rem] shadow-2xl p-4 md:p-6">
            <EstimateWidgetV4
              contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
              contractorName="Demo Roofing Co"
              contractorPhone="(555) 123-4567"
            />
          </div>
        </div>

        <p className="text-center text-sm text-[#1B3A4B]/40 mt-8">
          This is a live demo with sample pricing. Your widget uses your real
          rates.
        </p>
      </div>
    </section>
  );
}
