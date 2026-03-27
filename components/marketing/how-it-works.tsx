// How It Works — 3 simple steps. Cards match the estimate widget card style.

import { FlowButton } from "@/components/ui/flow-button";

const STEPS = [
  {
    number: "01",
    title: "Sign up in 60 seconds",
    description: "Enter your business name, phone, and city. That's it. Your free professional website goes live immediately.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Set your pricing",
    description: "Tell us what you charge per square foot for each material. We suggest rates based on your area. Takes 2 minutes.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Start getting leads",
    description: "Homeowners find your site, get instant satellite estimates, and you get notified the moment they reach out.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Live in 5 minutes. Seriously.
          </h2>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            No sales calls. No onboarding meetings. No waiting weeks for a website.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gray-200" />
              )}

              {/* Card matching widget style: rounded-3xl, shadow-xl, hover:shadow-2xl */}
              <div className="overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-shadow duration-500 hover:shadow-2xl relative h-full">
                <div className="absolute inset-0 rounded-3xl border border-gray-200/60 pointer-events-none" />
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mb-5 mx-auto">
                    {step.icon}
                  </div>

                  <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">
                    Step {step.number}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>

                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <a href="/signup">
            <FlowButton text="Get Started — It's Free" />
          </a>
        </div>
      </div>
    </section>
  );
}
