// Live Widget Demo section — embeds the actual estimate widget
// so roofers can click through it and see it working.
// This is the "aha moment" on the marketing site.

import EstimateWidget from "@/components/estimate-widget";

export default function Demo() {
  return (
    <section id="demo" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            See It In Action
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Try the estimate widget yourself
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            This is exactly what your customers see. Enter any address and
            click through the flow — satellite-measured estimates in seconds.
          </p>
        </div>

        <EstimateWidget
          contractorId="demo"
          contractorName="Your Company Name"
          contractorPhone="(555) 123-4567"
        />

        <p className="text-center text-sm text-gray-400 mt-8">
          This is a live demo with sample pricing. Your widget uses your real rates.
        </p>
      </div>
    </section>
  );
}
