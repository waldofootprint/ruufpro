// Pricing section — clear, simple pricing cards.

import { FlowButton } from "@/components/ui/flow-button";
import { AnimatedCard, CardBody } from "@/components/ui/animated-card";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  {
    name: "Roofing Website",
    price: "Free",
    period: "forever",
    description: "Professional website that gets you found online",
    features: [
      "Mobile-first roofing website",
      "Contact form + lead capture",
      "Email notifications",
      "SEO optimized",
      "Click-to-call",
      "Trust badges",
    ],
    cta: "Get Your Free Website",
    highlighted: false,
  },
  {
    name: "Estimate Widget",
    price: "$99",
    period: "/month",
    description: "Satellite-powered estimates that capture leads",
    features: [
      "Everything in Free, plus:",
      "Satellite roof measurement",
      "Instant ballpark estimates",
      "Embed on any website",
      "Lead dashboard",
      "Contractor-controlled pricing",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Growth Suite",
    price: "$149",
    period: "/month",
    description: "Automate reviews, follow-ups, and more",
    features: [
      "Everything in Estimate, plus:",
      "Review automation",
      "Auto-reply (60 seconds)",
      "Follow-up drip sequences",
      "SEO city pages",
      "Priority support",
    ],
    cta: "Coming Soon",
    highlighted: false,
    comingSoon: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            No setup fees. No contracts. No hidden costs. Cancel anytime.
            All services work with or without a RoofReady website.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {PRODUCTS.map((product) => (
            <AnimatedCard
              key={product.name}
              className={cn(
                "flex flex-col",
                product.highlighted
                  ? "border-brand-600 shadow-lg shadow-brand-500/10 relative"
                  : ""
              )}
            >
              {product.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-brand-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardBody className="border-0 p-8 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">{product.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{product.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{product.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {product.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                {product.comingSoon ? (
                  <div className="text-center text-sm text-gray-400 font-medium py-3">
                    Coming Soon
                  </div>
                ) : (
                  <a href="/signup">
                    <FlowButton text={product.cta} />
                  </a>
                )}
              </CardBody>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
