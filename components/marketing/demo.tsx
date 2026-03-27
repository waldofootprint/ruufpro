// Live Widget Demo section — embeds the actual estimate widget
// so roofers can click through it and see it working.
// This is the "aha moment" on the marketing site.

import EstimateWidget from "@/components/estimate-widget";

export default function Demo() {
  return (
    <section id="demo" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          {/* Glass badge pill with pulsing green dot */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/50 bg-brand-50/50 px-3.5 py-1.5 backdrop-blur-md mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              Live Demo · Try It Now
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Try the estimate widget yourself
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            This is exactly what your customers see. Enter any address and
            click through the flow — satellite-measured estimates in seconds.
          </p>
        </div>

        <EstimateWidget
          contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
          contractorName="Demo Roofing Co"
          contractorPhone="(555) 123-4567"
        />

        <p className="text-center text-sm text-gray-400 mt-8">
          This is a live demo with sample pricing. Your widget uses your real rates.
        </p>
      </div>
    </section>
  );
}
