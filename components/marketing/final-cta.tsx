// Final CTA section with radar scanning effect.
// Icons represent our product features orbiting around the CTA.

"use client";

import { Radar, IconContainer } from "@/components/ui/radar-effect";
import { FlowButton } from "@/components/ui/flow-button";
import {
  Globe,
  Calculator,
  Bell,
  Star,
  MessageCircle,
  MapPin,
  Satellite,
} from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative bg-gray-950 py-16 md:py-20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Radar + Icons background */}
        <div className="relative flex flex-col items-center justify-center min-h-[420px]">
          {/* Row 1 — top icons */}
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
              <IconContainer
                text="Free Website"
                delay={0.2}
                icon={<Globe className="h-6 w-6 text-slate-500" />}
              />
              <IconContainer
                text="Satellite Data"
                delay={0.4}
                icon={<Satellite className="h-6 w-6 text-slate-500" />}
              />
              <IconContainer
                text="Instant Estimates"
                delay={0.3}
                icon={<Calculator className="h-6 w-6 text-slate-500" />}
              />
            </div>
          </div>

          {/* Row 2 — middle icons + CTA text */}
          <div className="mx-auto w-full max-w-md my-8">
            <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
              <IconContainer
                text="Lead Alerts"
                delay={0.5}
                icon={<Bell className="h-6 w-6 text-slate-500" />}
              />

              {/* Center CTA content — sits in the middle of the radar */}
              <div className="relative z-50 text-center px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
                  Ready to get found online?
                </h2>
                <p className="text-base text-slate-400 mb-8 max-w-md mx-auto">
                  Join roofers who are getting leads with satellite-powered
                  estimates and professional websites.
                </p>
                <a href="/signup">
                  <FlowButton text="Get Your Free Website" />
                </a>
                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-500">
                  <span>Free forever</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>No credit card</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>5-minute setup</span>
                </div>
              </div>

              <IconContainer
                text="Auto Follow-Up"
                delay={0.8}
                icon={<MessageCircle className="h-6 w-6 text-slate-500" />}
              />
            </div>
          </div>

          {/* Row 3 — bottom icons */}
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
              <IconContainer
                text="Review Automation"
                delay={0.6}
                icon={<Star className="h-6 w-6 text-slate-500" />}
              />
              <IconContainer
                text="SEO City Pages"
                delay={0.7}
                icon={<MapPin className="h-6 w-6 text-slate-500" />}
              />
            </div>
          </div>

          {/* Radar effect positioned at bottom center */}
          <Radar className="absolute -bottom-12" />
          <div className="absolute bottom-0 z-[41] h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>
      </div>
    </section>
  );
}
