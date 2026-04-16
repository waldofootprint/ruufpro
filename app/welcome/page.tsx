"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import Link from "next/link";
import {
  Calculator,
  FileText,
  FileSignature,
  Home,
  PenLine,
  RefreshCw,
  Check,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

// ── SMS progress phases mapped to registration_status ──
const SMS_PHASES = [
  { label: "Profile created" },
  { label: "Brand submitted" },
  { label: "Brand verified" },
  { label: "Campaign submitted" },
  { label: "Carrier review" },
  { label: "Campaign approved" },
  { label: "Number provisioned" },
  { label: "SMS active" },
];

function getCompletedPhases(status: string | null): number {
  if (!status || status === "not_started") return 0;
  if (status === "profile_pending") return 0;
  if (status === "profile_approved") return 1;
  if (status === "brand_pending" || status === "brand_otp_required") return 2;
  if (status === "brand_approved") return 3;
  if (status === "campaign_pending") return 4;
  if (status === "campaign_approved") return 8;
  if (status === "failed") return 0;
  return 0;
}

const FEATURES = [
  { name: "Estimate Widget", desc: "Homeowners get instant roof estimates with satellite view. Already embedded on your site.", icon: Calculator, color: "emerald" },
  { name: "Living Estimates", desc: "Interactive proposals homeowners can share, compare materials, and sign from their phone.", icon: FileText, color: "blue" },
  { name: "Branded PDF Proposals", desc: "Professional estimate reports with your logo, satellite photos, and material breakdowns.", icon: FileSignature, color: "purple" },
  { name: "Property Intel", desc: "See year built, sqft, roof type, owner info, and tax value for every lead that comes in.", icon: Home, color: "amber" },
  { name: "E-Signatures", desc: "Homeowners sign estimates from their phone. Legally binding, timestamped, stored forever.", icon: PenLine, color: "rose" },
  { name: "CRM Auto-Sync", desc: "Leads automatically push to Jobber, Housecall Pro, or any CRM via webhook.", icon: RefreshCw, color: "indigo" },
];

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: "bg-emerald-100", icon: "text-emerald-600" },
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
  rose: { bg: "bg-rose-100", icon: "text-rose-600" },
  indigo: { bg: "bg-indigo-100", icon: "text-indigo-600" },
};

// ── Standalone onboarding checklist for this page ──
const SETUP_STEPS = [
  {
    title: "Configure your widget",
    description: "Set your pricing, add-ons, and service area — this powers your estimates",
    href: "/dashboard/estimate-settings",
    cta: "Configure",
  },
  {
    title: "Connect your CRM",
    description: "Auto-send every lead to Jobber, Housecall Pro, or your existing system",
    href: "/dashboard/settings#integrations",
    cta: "Connect",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  // Auth check + data fetch
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/welcome");
        return;
      }

      const { data: contractor } = await supabase
        .from("contractors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!contractor) {
        router.push("/onboarding");
        return;
      }

      // Fetch SMS status
      const { data: sms } = await supabase
        .from("sms_numbers")
        .select("registration_status")
        .eq("contractor_id", contractor.id)
        .single();

      setSmsStatus(sms?.registration_status || null);
      setLoading(false);
    }
    init();
  }, [router]);

  // Fire confetti on mount (after loading)
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#3b82f6", "#818cf8", "#f59e0b"],
        ticks: 200,
        gravity: 0.8,
        scalar: 1.2,
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.35 },
          colors: ["#10b981", "#34d399", "#6ee7b7", "#f59e0b"],
          ticks: 180,
          gravity: 0.9,
        });
      }, 150);
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.35 },
          colors: ["#10b981", "#34d399", "#6ee7b7", "#f59e0b"],
          ticks: 180,
          gravity: 0.9,
        });
      }, 300);
    }, 400);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  const completedPhases = getCompletedPhases(smsStatus);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* ── Success badge + header ── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
            <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            You&apos;re on Pro
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md">
            Here&apos;s everything you just unlocked. Finish the setup below to go live on your site.
          </p>
        </div>

        {/* ── 2x3 Feature grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {FEATURES.map((feature) => {
            const colors = COLOR_MAP[feature.color];
            const Icon = feature.icon;
            return (
              <div
                key={feature.name}
                className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">{feature.name}</h3>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                        Unlocked
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Scroll cue ── */}
        <div className="flex flex-col items-center gap-1 mb-8">
          <p className="text-xs font-semibold text-emerald-600">Get started</p>
          <ChevronDown className="w-5 h-5 text-emerald-500 animate-bounce" />
        </div>

        {/* ── Onboarding checklist (standalone version) ── */}
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <span className="text-[9px] font-bold text-amber-600">1</span>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
            </div>
            <span className="text-sm font-bold text-slate-900">Finish your setup</span>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">2 left</span>
          </div>
          <div className="border-t border-amber-200/50">
            {SETUP_STEPS.map((step, i) => (
              <Link
                key={step.title}
                href={step.href}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-amber-50 transition group ${
                  i < SETUP_STEPS.length - 1 ? "border-b border-amber-100/50" : ""
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  i === 0 ? "border-amber-400" : "border-slate-300"
                }`}>
                  <span className={`text-[9px] font-bold ${i === 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${i === 0 ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                    {step.title}
                  </span>
                  {i === 0 && (
                    <p className="text-[11px] text-slate-400">{step.description}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                  {step.cta}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── SMS Progress Tracker ── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">SMS Activation</h3>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase">
              Phase {Math.min(completedPhases, 8)} of 8
            </span>
          </div>

          {/* Progress bar — 8 segments */}
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < completedPhases ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Your dedicated business number is being registered with all major carriers. We&apos;ll email you the moment it&apos;s live.
          </p>

          {/* Completed phase indicators */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4">
            {SMS_PHASES.slice(0, Math.max(completedPhases + 1, 3)).map((phase, i) => {
              const done = i < completedPhases;
              const current = i === completedPhases;
              return (
                <div key={phase.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  {done ? (
                    <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
                  ) : current ? (
                    <div className="w-3 h-3 rounded-full border-2 border-amber-400 animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                  )}
                  <span className={done ? "text-slate-500" : current ? "text-slate-400" : "text-slate-300"}>
                    {phase.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-emerald-600 font-semibold mt-3">
            Your billing starts when SMS activates — not before.
          </p>
        </div>

        {/* ── Bottom CTAs ── */}
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/my-site"
            className="px-6 py-3 bg-white text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Edit My Site
          </Link>
        </div>
      </div>
    </div>
  );
}
