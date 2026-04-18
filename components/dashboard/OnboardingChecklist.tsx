"use client";

import { useState } from "react";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { Check, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Step {
  number: number;
  title: string;
  description: string;
  href: string;
  cta: string;
  isDone: (steps: { hasRates: boolean; hasAddons: boolean; hasZips: boolean; hasWebhook: boolean; hasChatbot: boolean }) => boolean;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Configure your widget",
    description: "Set your pricing, add-ons, and service area — this powers your estimates",
    href: "/dashboard/settings?tab=estimates",
    cta: "Configure",
    isDone: (s) => s.hasRates && s.hasAddons && s.hasZips,
  },
  {
    number: 2,
    title: "Set up Riley (your AI chatbot)",
    description: "Train Riley with your pricing and services — she'll answer questions and capture leads 24/7",
    href: "/dashboard/settings?tab=riley",
    cta: "Train Riley",
    isDone: (s) => s.hasChatbot,
  },
  {
    number: 3,
    title: "Connect your CRM",
    description: "Auto-send every lead to Jobber, Housecall Pro, or your existing system",
    href: "/dashboard/settings#integrations",
    cta: "Connect",
    isDone: (s) => s.hasWebhook,
  },
];

export default function OnboardingChecklist() {
  const { onboarding, tier } = useDashboard();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  // Only show for Pro users who haven't finished setup
  if (!onboarding || onboarding.complete || tier === "free") return null;

  const completedCount = STEPS.filter((s) => s.isDone(onboarding.steps)).length;
  const remaining = STEPS.length - completedCount;

  // All done — hide
  if (remaining === 0) return null;

  const nextStep = STEPS.find((s) => !s.isDone(onboarding.steps));

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
      {/* Header — always visible, toggles expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-amber-50/50 transition"
      >
        <div className="flex items-center gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((step) => {
              const done = step.isDone(onboarding.steps);
              const isNext = step === nextStep;
              if (done) {
                return (
                  <div key={step.number} className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                );
              }
              if (isNext) {
                return (
                  <div key={step.number} className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-amber-600">{step.number}</span>
                  </div>
                );
              }
              return (
                <div key={step.number} className="w-5 h-5 rounded-full border-2 border-slate-300" />
              );
            })}
          </div>
          <span className="text-sm font-bold text-slate-900">Finish your setup</span>
          <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">
            {remaining} left
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expandable step list */}
      {expanded && (
        <div className="border-t border-amber-200/50">
          {STEPS.map((step, i) => {
            const done = step.isDone(onboarding.steps);
            const isNext = step === nextStep;
            const isLast = i === STEPS.length - 1;

            if (done) {
              return (
                <div
                  key={step.number}
                  className={`flex items-center gap-3 px-5 py-3 opacity-50 ${!isLast ? "border-b border-amber-100/50" : ""}`}
                >
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm line-through text-slate-400">{step.title}</span>
                </div>
              );
            }

            return (
              <a
                key={step.number}
                href={step.href}
                onClick={(e) => {
                  e.preventDefault();
                  const [path, hash] = step.href.split("#");
                  router.push(path);
                  if (hash) {
                    // Wait for page to render, then scroll to anchor
                    setTimeout(() => {
                      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  }
                }}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-amber-50 transition group cursor-pointer ${!isLast ? "border-b border-amber-100/50" : ""}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isNext ? "border-amber-400" : "border-slate-300"
                }`}>
                  <span className={`text-[9px] font-bold ${isNext ? "text-amber-600" : "text-slate-400"}`}>
                    {step.number}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${isNext ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                    {step.title}
                  </span>
                  {isNext && (
                    <p className="text-[11px] text-slate-400">{step.description}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                  {step.cta}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
