// Marketing hero section for roofready.com
// Features: rotating headline, homes illustration with price estimates,
// two CTAs, and trust badges.

"use client";

import { FlowButton } from "@/components/ui/flow-button";
import { RotatingText } from "@/components/ui/rotating-text";

const ROTATING_WORDS = [
  "get found on Google",
  "capture more leads",
  "show instant pricing",
  "grow your business",
];

export default function MarketingHero() {

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50/50">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-22 md:pb-18">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-gray-900 leading-[1.15] tracking-tight">
              Everything roofers need to{" "}
              <RotatingText
                words={ROTATING_WORDS}
                mode="slide"
                interval={3000}
                className="text-brand-600"
              />
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              Free professional website. Satellite-powered instant estimates.
              Lead capture that works while you sleep. All for a fraction of
              what Roofle charges.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <a href="/signup">
                <FlowButton text="Get Your Free Website" />
              </a>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See live demo
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                5-min setup
              </span>
            </div>
          </div>

          {/* Right: Homes illustration with price estimates */}
          <div className="relative">
            <HousesIllustration />
          </div>
        </div>
      </div>

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </section>
  );
}

// AI-generated 3D isometric illustration with animated price card overlays
function HousesIllustration() {
  return (
    <div className="relative w-full">
      {/* The 3D illustration */}
      <img
        src="/images/hero-illustration.png"
        alt="3D isometric neighborhood with roofing contractors"
        className="w-full h-auto"
      />

      {/* Floating price cards — positioned over each house */}
      {/* Back-left house */}
      <div className="absolute top-[8%] left-[18%] animate-float-slow">
        <PriceCard price="$9,800" status="New Lead" color="blue" />
      </div>

      {/* Back-right house */}
      <div className="absolute top-[6%] right-[14%] animate-float">
        <PriceCard price="$14,200" status="Estimate Sent" color="green" highlight />
      </div>

      {/* Front-left house */}
      <div className="absolute top-[42%] left-[8%] animate-float-delayed">
        <PriceCard price="$11,500" status="Inspection Set" color="blue" />
      </div>

      {/* Front-right house */}
      <div className="absolute top-[38%] right-[8%] animate-float-slow-2">
        <PriceCard price="$22,500" status="Job Won" color="emerald" />
      </div>

      {/* Floating satellite badge */}
      <div className="absolute top-[0%] right-[5%] animate-pulse">
        <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-100">
          <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-600">Satellite Measured</span>
        </div>
      </div>

      {/* Float animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 3.5s ease-in-out infinite 0.5s; }
        .animate-float-slow-2 { animation: float-slow-2 3.8s ease-in-out infinite 0.3s; }
      `}</style>
    </div>
  );
}

function PriceCard({ price, status, color, highlight }: {
  price: string; status: string; color: string; highlight?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    emerald: "bg-emerald-500",
  };

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 px-3.5 py-2.5 whitespace-nowrap ${
      highlight ? "ring-2 ring-brand-500/20 shadow-brand-500/10" : ""
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colors[color] || colors.blue}`} />
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{status}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 mt-0.5 tracking-tight">{price}</p>
    </div>
  );
}
