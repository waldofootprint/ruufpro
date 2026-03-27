// Pricing section — 21st.dev premium pricing cards with glass effect headers.

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/ui/pricing-card";
import { CheckCircle2, XCircleIcon, Globe, Calculator, Zap } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white relative overflow-hidden">
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

        <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-6">
          {/* Free Plan */}
          <PricingCard.Card>
            <PricingCard.Header>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  <Globe aria-hidden="true" />
                  <span>Starter</span>
                </PricingCard.PlanName>
                <PricingCard.Badge>Free Forever</PricingCard.Badge>
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>$0</PricingCard.MainPrice>
                <PricingCard.Period>/ month</PricingCard.Period>
              </PricingCard.Price>
              <Button
                className={cn(
                  "w-full font-semibold text-white",
                  "bg-gradient-to-b from-gray-800 to-gray-900 shadow-[0_10px_25px_rgba(0,0,0,0.15)]",
                )}
                onClick={() => window.location.href = "/signup"}
              >
                Get Your Free Website
              </Button>
            </PricingCard.Header>
            <PricingCard.Body>
              <PricingCard.List>
                {[
                  "Professional roofing website",
                  "Mobile-first, SEO optimized",
                  "Contact form + lead capture",
                  "Email notifications",
                  "Click-to-call on every page",
                  "Trust badges auto-generated",
                ].map((item) => (
                  <PricingCard.ListItem key={item}>
                    <span className="mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
              <PricingCard.Separator>Pro features</PricingCard.Separator>
              <PricingCard.List>
                {[
                  "Satellite estimate widget",
                  "Embed on external sites",
                  "Review automation",
                ].map((item) => (
                  <PricingCard.ListItem key={item} className="opacity-60">
                    <span className="mt-0.5">
                      <XCircleIcon className="h-4 w-4 text-red-400" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>

          {/* Estimate Widget Plan */}
          <PricingCard.Card className="border-brand-600 shadow-2xl shadow-brand-500/10 scale-[1.02]">
            <PricingCard.Header className="bg-brand-50/80 border-brand-200">
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  <Calculator aria-hidden="true" />
                  <span>Pro</span>
                </PricingCard.PlanName>
                <PricingCard.Badge className="border-brand-300 text-brand-700 bg-brand-50">
                  Most Popular
                </PricingCard.Badge>
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>$99</PricingCard.MainPrice>
                <PricingCard.Period>/ month</PricingCard.Period>
              </PricingCard.Price>
              <Button
                className={cn(
                  "w-full font-semibold text-white",
                  "bg-gradient-to-b from-brand-500 to-brand-600 shadow-[0_10px_25px_rgba(37,99,235,0.3)]",
                )}
                onClick={() => window.location.href = "/signup"}
              >
                Start Free Trial
              </Button>
            </PricingCard.Header>
            <PricingCard.Body>
              <PricingCard.List>
                {[
                  "Everything in Starter, plus:",
                  "Satellite estimate widget",
                  "Instant ballpark estimates",
                  "Embed on any website",
                  "Lead dashboard with details",
                  "Contractor-controlled pricing",
                  "Regional pricing suggestions",
                ].map((item) => (
                  <PricingCard.ListItem key={item}>
                    <span className="mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
              <PricingCard.Separator>Coming soon</PricingCard.Separator>
              <PricingCard.List>
                {[
                  "Review automation",
                  "Auto-reply & follow-up",
                ].map((item) => (
                  <PricingCard.ListItem key={item} className="opacity-60">
                    <span className="mt-0.5">
                      <XCircleIcon className="h-4 w-4 text-gray-300" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>

          {/* Growth Suite */}
          <PricingCard.Card>
            <PricingCard.Header>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  <Zap aria-hidden="true" />
                  <span>Growth</span>
                </PricingCard.PlanName>
                <PricingCard.Badge>Coming Soon</PricingCard.Badge>
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>$149</PricingCard.MainPrice>
                <PricingCard.Period>/ month</PricingCard.Period>
              </PricingCard.Price>
              <Button
                className={cn(
                  "w-full font-semibold",
                  "bg-gray-100 text-gray-400 cursor-not-allowed",
                )}
                disabled
              >
                Coming Soon
              </Button>
            </PricingCard.Header>
            <PricingCard.Body>
              <PricingCard.List>
                {[
                  "Everything in Pro, plus:",
                  "Review automation",
                  "Auto-reply (60 seconds)",
                  "Follow-up drip sequences",
                  "SEO city pages",
                  "Priority support",
                  "Custom domain",
                ].map((item) => (
                  <PricingCard.ListItem key={item}>
                    <span className="mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
        </div>
      </div>
    </section>
  );
}
