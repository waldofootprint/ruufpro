"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Phone,
  Shield,
  Star,
  Award,
  Hammer,
  Home,
  CheckCircle,
} from "lucide-react";
import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";

type Props = Pick<
  ContractorSiteData,
  | "businessName"
  | "city"
  | "phone"
  | "heroHeadline"
  | "tagline"
  | "heroCta"
  | "heroImage"
  | "hasEstimateWidget"
  | "yearsInBusiness"
  | "reviews"
  | "urgencyBadge"
>;

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold sm:text-2xl" style={{ color: CHALK.accent }}>{value}</span>
    <span className="text-[10px] uppercase tracking-wider font-medium sm:text-xs" style={{ color: CHALK.textFaint }}>{label}</span>
  </div>
);

const TRUST_ITEMS = [
  { name: "Licensed & Insured", icon: Shield },
  { name: "5-Star Rated", icon: Star },
  { name: "Free Estimates", icon: CheckCircle },
  { name: "Quality Materials", icon: Hammer },
  { name: "Local Experts", icon: Home },
  { name: "Warranty Included", icon: Award },
];

export default function ChalkHero({
  businessName,
  city,
  phone,
  heroHeadline,
  tagline,
  heroCta,
  heroImage,
  hasEstimateWidget,
  yearsInBusiness,
  reviews = [],
  urgencyBadge,
}: Props) {
  const phoneClean = phone.replace(/\D/g, "");
  const headline = heroHeadline || "Your Roof.\nDone Right.";
  const sub =
    tagline ||
    `Roof replacements, repairs, and inspections from a local crew that shows up on time, gives you a straight answer, and does the work right. Serving ${city} and surrounding areas.`;
  const cta = heroCta || "Get a Free Estimate";
  const bgImg =
    heroImage ||
    "https://images.unsplash.com/photo-1673645652590-9d21295bf4ac?w=1920&q=80";

  return (
    <section id="hero" className="relative w-full overflow-hidden" style={{ background: CHALK.bg }}>
      {/* Scoped animations */}
      <style>{`
        @keyframes chalkFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chalkMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .chalk-fade-in {
          animation: chalkFadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .chalk-marquee {
          animation: chalkMarquee 35s linear infinite;
        }
        .chalk-delay-1 { animation-delay: 0.1s; }
        .chalk-delay-2 { animation-delay: 0.2s; }
        .chalk-delay-3 { animation-delay: 0.3s; }
        .chalk-delay-4 { animation-delay: 0.4s; }
        .chalk-delay-5 { animation-delay: 0.5s; }
      `}</style>

      {/* Background image with gradient mask */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url(${bgImg})`,
          maskImage:
            "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
        }}
      />
      {/* Hidden semantic image for SEO — CSS backgroundImage is not crawlable */}
      <Image
        src={bgImg}
        alt={`${businessName} - professional roofing services in ${city}`}
        width={1}
        height={1}
        className="sr-only"
        aria-hidden="false"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 md:pt-36 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">
            {/* Urgency Badge */}
            <div className="chalk-fade-in chalk-delay-1 flex flex-wrap items-center gap-2">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: `${CHALK.accent}20`,
                  border: `1px solid ${CHALK.accent}40`,
                }}
              >
                <span
                  className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                  style={{ color: CHALK.accent }}
                >
                  {urgencyBadge || "Free Estimates Within 24 Hours"}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md"
                style={{
                  border: `1px solid ${CHALK.border}`,
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <span
                  className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: CHALK.textMuted }}
                >
                  Locally Owned in {city}
                  <Star className="w-3.5 h-3.5 fill-current" style={{ color: CHALK.accent }} />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1
              className="chalk-fade-in chalk-delay-2 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tighter leading-[0.9]"
              style={{ fontFamily: CHALK.fontDisplay, color: CHALK.text }}
            >
              {headline.split(".").length > 1 ? (
                <>
                  {headline.split(".")[0]}.<br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${CHALK.text}, ${CHALK.accent})`,
                    }}
                  >
                    {headline.split(".").slice(1).join(".").trim()}
                  </span>
                </>
              ) : (
                headline
              )}
            </h1>

            {/* Description */}
            <p
              className="chalk-fade-in chalk-delay-3 max-w-xl text-lg leading-relaxed"
              style={{ fontFamily: CHALK.fontBody, color: CHALK.textMuted }}
            >
              {sub}
            </p>

            {/* CTA Buttons */}
            <div className="chalk-fade-in chalk-delay-4 flex flex-col sm:flex-row gap-4">
              <a
                href={hasEstimateWidget ? "#estimate" : "#contact"}
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: CHALK.accent,
                  color: CHALK.bg,
                  fontFamily: CHALK.fontBody,
                }}
              >
                {cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href={`tel:${phoneClean}`}
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold backdrop-blur-sm transition-colors"
                style={{
                  border: `1px solid ${CHALK.border}`,
                  background: "rgba(255,255,255,0.05)",
                  color: CHALK.text,
                  fontFamily: CHALK.fontBody,
                }}
              >
                <Phone className="w-4 h-4" />
                Call {phone}
              </a>
            </div>

            {/* Social proof line */}
            <div className="chalk-fade-in chalk-delay-5 flex flex-wrap gap-5">
              <span className="flex items-center gap-2 text-sm" style={{ color: CHALK.textFaint }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Most calls returned same day
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: CHALK.textFaint }}>
                {/* Google "G" logo */}
                <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.77-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {[1,2,3,4,5].map(i => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={CHALK.accent} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                {reviews.length > 0 ? `${reviews.length} Google Reviews` : "5-Star Google Rated"}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-6 lg:mt-12">
            {/* Stats Card */}
            <div
              className="chalk-fade-in chalk-delay-5 relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
              style={{
                border: `1px solid ${CHALK.border}`,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: `${CHALK.accent}10` }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      boxShadow: `inset 0 0 0 1px ${CHALK.border}`,
                    }}
                  >
                    <Home className="h-6 w-6" style={{ color: CHALK.accent }} />
                  </div>
                  <div>
                    <div
                      className="text-3xl font-bold tracking-tight"
                      style={{ color: CHALK.text, fontFamily: CHALK.fontDisplay, fontSize: 28 }}
                    >
                      {yearsInBusiness ? `${yearsInBusiness}+` : "500+"}
                    </div>
                    <div className="text-sm" style={{ color: CHALK.textMuted, fontFamily: CHALK.fontBody }}>
                      {yearsInBusiness ? "Years in Business" : "Roofs Completed"}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm" style={{ fontFamily: CHALK.fontBody }}>
                    <span style={{ color: CHALK.textMuted }}>Customer Satisfaction</span>
                    <span style={{ color: CHALK.text }} className="font-medium">98%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full w-[98%] rounded-full"
                      style={{ background: `linear-gradient(to right, ${CHALK.accent}, ${CHALK.accentHover})` }}
                    />
                  </div>
                </div>

                <div className="h-px w-full mb-6" style={{ background: CHALK.border }} />

                {/* Mini stats */}
                <div className="grid grid-cols-5 gap-2 text-center">
                  <StatItem value="5★" label="Rating" />
                  <div className="w-px mx-auto" style={{ background: CHALK.border, height: "100%" }} />
                  <StatItem value="Free" label="Estimates" />
                  <div className="w-px mx-auto" style={{ background: CHALK.border, height: "100%" }} />
                  <StatItem value="100%" label="Insured" />
                </div>

                {/* Tag pills */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium tracking-wide"
                    style={{ border: `1px solid ${CHALK.border}`, background: "rgba(255,255,255,0.05)", color: CHALK.textMuted }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#4ade80" }}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22c55e" }}></span>
                    </span>
                    ACCEPTING JOBS
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium tracking-wide"
                    style={{ border: `1px solid ${CHALK.border}`, background: "rgba(255,255,255,0.05)", color: CHALK.textMuted }}
                  >
                    <Award className="w-3 h-3" style={{ color: CHALK.accent }} />
                    {city.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Trust marquee */}
            <div
              className="chalk-fade-in chalk-delay-5 relative overflow-hidden rounded-3xl py-8 backdrop-blur-xl"
              style={{
                border: `1px solid ${CHALK.border}`,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <h3
                className="mb-6 px-8 text-sm font-medium"
                style={{ color: CHALK.textMuted, fontFamily: CHALK.fontBody }}
              >
                Why homeowners trust {businessName}
              </h3>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                }}
              >
                <div className="chalk-marquee flex gap-12 whitespace-nowrap px-4">
                  {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 opacity-50 transition-all hover:opacity-100 hover:scale-105 cursor-default"
                    >
                      <item.icon className="h-5 w-5" style={{ color: CHALK.accent }} />
                      <span
                        className="text-base font-bold tracking-tight"
                        style={{ color: CHALK.text, fontFamily: CHALK.fontBody }}
                      >
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
