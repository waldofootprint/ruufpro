"use client";

import React from "react";
import { Calculator, Clock, ShieldCheck, Zap } from "lucide-react";
import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

type Props = Pick<ContractorSiteData, "hasEstimateWidget" | "contractorId" | "businessName" | "phone">;

const PERKS = [
  { icon: Clock, label: "Takes 2 minutes" },
  { icon: ShieldCheck, label: "No spam, ever" },
  { icon: Zap, label: "Instant results" },
];

export default function ChalkEstimate({ hasEstimateWidget, contractorId, businessName, phone }: Props) {
  if (!hasEstimateWidget) return null;
  const phoneClean = phone.replace(/\D/g, "");

  return (
    <section id="estimate" className="relative overflow-hidden" style={{ background: CHALK.bgAlt }}>
      {/* Scoped animation */}
      <style>{`
        @keyframes estimateFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .estimate-fade {
          animation: estimateFadeIn 0.7s ease-out forwards;
          opacity: 0;
        }
        .estimate-delay-1 { animation-delay: 0.1s; }
        .estimate-delay-2 { animation-delay: 0.25s; }
        .estimate-delay-3 { animation-delay: 0.4s; }
      `}</style>

      {/* Subtle glow behind widget */}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${CHALK.accent}08` }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="estimate-fade estimate-delay-1 inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6 backdrop-blur-md"
            style={{
              border: `1px solid ${CHALK.border}`,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <Calculator className="w-3.5 h-3.5" style={{ color: CHALK.accent }} />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: CHALK.textMuted }}>
              Free Instant Estimate
            </span>
          </div>

          <h2
            className="estimate-fade estimate-delay-1 text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4"
            style={{ fontFamily: CHALK.fontDisplay, color: CHALK.text }}
          >
            What will your new roof cost?
          </h2>
          <p
            className="estimate-fade estimate-delay-2 max-w-lg mx-auto text-lg leading-relaxed"
            style={{ fontFamily: CHALK.fontBody, color: CHALK.textMuted }}
          >
            Get a ballpark estimate in about 2 minutes. We measure your actual roof from satellite imagery and apply our pricing — no phone call, no email, no pressure.
          </p>

          {/* Perks row */}
          <div className="estimate-fade estimate-delay-2 flex flex-wrap items-center justify-center gap-6 mt-8">
            {PERKS.map((perk) => (
              <div key={perk.label} className="flex items-center gap-2">
                <perk.icon className="w-4 h-4" style={{ color: CHALK.accent }} />
                <span className="text-sm" style={{ fontFamily: CHALK.fontBody, color: CHALK.textFaint }}>
                  {perk.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget — V4 Glass + 3D Hybrid, rendered directly */}
        <div className="estimate-fade estimate-delay-3 mx-auto max-w-2xl">
          <EstimateWidgetV4
            contractorId={contractorId}
            contractorName={businessName}
            contractorPhone={phone}
          />
        </div>

        {/* Bottom CTA fallback */}
        <div className="estimate-fade estimate-delay-3 text-center mt-8">
          <p className="text-sm" style={{ fontFamily: CHALK.fontBody, color: CHALK.textFaint }}>
            Prefer to talk to a human?{" "}
            <a
              href={`tel:${phoneClean}`}
              className="underline underline-offset-2 transition-colors hover:no-underline"
              style={{ color: CHALK.accent }}
            >
              Call {phone}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
