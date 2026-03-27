// Final CTA section — last push before the footer.

import { FlowButton } from "@/components/ui/flow-button";

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-brand-900 text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Ready to get found online?
        </h2>
        <p className="text-lg text-blue-200 mb-10 max-w-xl mx-auto">
          Join roofers who are getting leads with satellite-powered
          estimates and professional websites — free to start, no credit card.
        </p>

        <a href="/signup">
          <FlowButton text="Get Your Free Website" />
        </a>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-300">
          <span>Free forever</span>
          <span className="w-1 h-1 rounded-full bg-blue-400" />
          <span>No credit card</span>
          <span className="w-1 h-1 rounded-full bg-blue-400" />
          <span>5-minute setup</span>
        </div>
      </div>
    </section>
  );
}
