// "What We Offer" section — animated Vercel-style tabs for each product category.
// Each tab reveals a detailed feature view with description, highlights, and visual.

"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/vercel-tabs";
import { FlowButton } from "@/components/ui/flow-button";
import { AnimatedCard, CardBody, CardVisual } from "@/components/ui/animated-card";

const FEATURE_TABS = [
  { id: "website", label: "Free Website" },
  { id: "estimator", label: "Estimate Widget" },
  { id: "leads", label: "Lead Capture" },
  { id: "reviews", label: "Reviews" },
  { id: "followup", label: "Auto Follow-Up" },
];

const FEATURE_CONTENT: Record<string, {
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
}> = {
  website: {
    badge: "Free",
    badgeColor: "bg-green-50 text-green-700",
    title: "Professional Roofing Website",
    subtitle: "Your online presence, handled.",
    description:
      "A beautiful, mobile-first website built for roofers — live in under 5 minutes. Pre-written content, trust badges, click-to-call, contact form, and SEO built in. No design skills needed. You own it if you leave.",
    highlights: [
      "Live in under 5 minutes",
      "Mobile-first, SEO optimized",
      "Click-to-call on every page",
      "Contact form with lead capture",
      "Trust badges auto-generated",
      "You own your site — always",
    ],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  estimator: {
    badge: "$149/mo",
    badgeColor: "bg-brand-50 text-brand-700",
    title: "Satellite Estimate Widget",
    subtitle: "Instant pricing that wins leads.",
    description:
      "Homeowners enter their address and get a satellite-measured ballpark estimate in seconds. We use Google's Solar API for roof measurements, geometric inference for ridge and valley calculations, and your custom pricing. Embeds on any website with one line of code.",
    highlights: [
      "Satellite-measured roof area",
      "Pitch, waste, and complexity factored in",
      "Contractor-controlled pricing",
      "Embeds on any website",
      "Leads captured with estimate details",
      "57% cheaper than Roofle",
    ],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  leads: {
    badge: "Included",
    badgeColor: "bg-blue-50 text-blue-700",
    title: "Lead Capture & Notifications",
    subtitle: "Never miss a lead again.",
    description:
      "Every contact form submission and estimate request is captured and stored with full details. Get instant email notifications the moment a homeowner reaches out. Track leads from first touch to job won.",
    highlights: [
      "Instant email notifications",
      "Lead status tracking",
      "Estimate details attached to every lead",
      "Works 24/7 while you sleep",
      "Dashboard to manage all leads",
      "Export leads anytime",
    ],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  reviews: {
    badge: "Coming Soon",
    badgeColor: "bg-gray-100 text-gray-500",
    title: "Review Automation",
    subtitle: "More 5-star reviews on autopilot.",
    description:
      "Automatically text homeowners a direct Google review link after every completed job. Roofers using automated review requests get 3x more reviews. 35% of homeowners say reviews are the #1 factor when choosing a roofer.",
    highlights: [
      "Auto-text after job completion",
      "Direct Google review link",
      "Track reviews requested vs received",
      "3x more reviews on average",
      "Customizable timing (3-7 days)",
      "TCPA compliant opt-in",
    ],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  followup: {
    badge: "Coming Soon",
    badgeColor: "bg-gray-100 text-gray-500",
    title: "Auto-Reply & Follow-Up",
    subtitle: "Respond in 60 seconds, not 60 minutes.",
    description:
      "New lead comes in — they get an auto-text within 60 seconds. Then a follow-up sequence at Day 2, Day 5, and Day 10 if they haven't responded. Responding within 5 minutes means 400% higher conversion. We make that automatic.",
    highlights: [
      "60-second auto-reply",
      "3-step follow-up sequence",
      "Auto-stops when they reply",
      "400% higher conversion rate",
      "Customizable message templates",
      "Quiet hours respected",
    ],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
};

export default function Features() {
  const [activeTab, setActiveTab] = useState("website");
  const feature = FEATURE_CONTENT[activeTab];

  return (
    <section id="features" className="py-16 md:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            What We Offer
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Everything you need to win more jobs
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            A free website gets you found. The estimate widget gets you leads.
            Everything else helps you close them.
          </p>
        </div>

        {/* Animated tabs */}
        <div className="flex justify-center mb-10 border-b border-gray-200 pb-[6px]">
          <Tabs
            tabs={FEATURE_TABS}
            onTabChange={(tabId) => setActiveTab(tabId)}
          />
        </div>

        {/* Active feature content */}
        <div
          key={activeTab}
          className="animate-fade-in"
        >
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Text side */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600">
                  {feature.icon}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                  {feature.badge}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-lg text-brand-600 font-medium mb-4">
                {feature.subtitle}
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                {feature.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {feature.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>

              {feature.badge !== "Coming Soon" && (
                <a href="/signup">
                  <FlowButton text="Get Started Free" />
                </a>
              )}
            </div>

            {/* Visual side — placeholder for product screenshots */}
            <div className="flex-1 w-full">
              <AnimatedCard className="w-full">
                <CardVisual className="h-[250px] bg-gradient-to-br from-brand-50 to-blue-50">
                  <div className="text-center text-brand-300">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-brand-100/50 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <p className="text-sm font-medium">Product screenshot</p>
                    <p className="text-xs mt-1">Coming soon</p>
                  </div>
                </CardVisual>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </section>
  );
}
