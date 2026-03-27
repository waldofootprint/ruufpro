// Final CTA section — light theme with radial glow + dual CTAs.

import { FlowButton } from "@/components/ui/flow-button";

export default function FinalCTA() {
  return (
    <section className="relative bg-gray-50 py-16 md:py-20 overflow-hidden">
      {/* Radial glow behind the text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 40%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-3xl px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Ready to get found online?
        </h2>
        <p className="text-base text-gray-500 mb-10 max-w-xl mx-auto">
          Join roofers who are getting leads with satellite-powered
          estimates and professional websites — free to start, no credit card.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/signup">
            <FlowButton text="Get Your Free Website" />
          </a>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            See Live Demo
          </a>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
          <span>Free forever</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>No credit card</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>5-minute setup</span>
        </div>
      </div>
    </section>
  );
}
