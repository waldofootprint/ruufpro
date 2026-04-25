// components/ridgeline-v2/hero.tsx
"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Eyebrow, PrimaryCTA, SecondaryCTA, SectionShell, Wordmark } from "./_primitives";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo", href: "#demo" },
  { label: "FAQ", href: "#faq" },
];

const TRUST_STATS: Array<[string, string]> = [
  ["14 days", "Free trial — no card"],
  ["$0", "To start — free forever"],
  ["5 min", "Signup to live site"],
  ["No", "Contract, ever"],
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-20 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 md:px-12 md:py-5">
        <Wordmark />

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:text-rust"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="hidden items-center gap-2 bg-rust px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-[#A6481F] sm:inline-flex"
          >
            Start free trial
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="p-2 text-ink md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper md:hidden">
          <div className="flex flex-col px-6 py-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/signup"
              className="mt-2 inline-flex items-center bg-rust px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper sm:hidden"
            >
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function HeroV2() {
  const [pulse, setPulse] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const triggerWidgetSpotlight = () => {
    if (widgetRef.current) {
      widgetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setPulse(true);
    window.setTimeout(() => setPulse(false), 2400);
  };

  return (
    <section className="bg-paper text-ink">
      <Navbar />

      <SectionShell wide className="pt-12 pb-12 md:pt-20 md:pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* LEFT — Copy */}
          <div>
            <Eyebrow>Built for solo roofers and small crews</Eyebrow>

            <h1 className="mt-7 max-w-[10ch] font-display text-[56px] font-extrabold uppercase leading-[0.9] tracking-tight md:text-[80px] lg:text-[96px]">
              Stop missing leads
            </h1>

            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-[#3a4a52] md:text-[19px]">
              RuufPro captures homeowner estimates, answers their questions with AI, and qualifies
              them before they ever hit your phone. You show up to jobs that are already sold.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <PrimaryCTA href="/signup" arrow="down">Start free trial</PrimaryCTA>
              <SecondaryCTA type="button" onClick={triggerWidgetSpotlight} arrow="right" outline>
                See it work
              </SecondaryCTA>
            </div>
          </div>

          {/* RIGHT — Widget framed editorial */}
          <div className="relative">
            <div className="absolute -top-3 left-0 z-10 flex items-center gap-3 bg-paper pr-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-rust opacity-60" />
                <span className="relative inline-flex h-2 w-2 bg-rust" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-rust">
                Live demo · Try any address
              </span>
            </div>

            <div
              ref={widgetRef}
              className={`relative border-2 border-ink bg-sand p-4 transition-shadow duration-300 md:p-6 ${
                pulse ? "shadow-[0_0_0_4px_rgba(188,81,43,0.45),0_0_60px_rgba(188,81,43,0.55)]" : "shadow-none"
              }`}
            >
              {/* corner ticks */}
              <span aria-hidden className="pointer-events-none absolute -left-1 -top-1 h-3 w-3 border-t-2 border-l-2 border-rust" />
              <span aria-hidden className="pointer-events-none absolute -right-1 -top-1 h-3 w-3 border-t-2 border-r-2 border-rust" />
              <span aria-hidden className="pointer-events-none absolute -left-1 -bottom-1 h-3 w-3 border-b-2 border-l-2 border-rust" />
              <span aria-hidden className="pointer-events-none absolute -right-1 -bottom-1 h-3 w-3 border-b-2 border-r-2 border-rust" />

              {/* Force the widget's internal rounded-3xl to square edges to match the design */}
              <div className="[&_.rounded-3xl]:!rounded-none [&_.rounded-2xl]:!rounded-none [&_.rounded-xl]:!rounded-none [&_.rounded-full]:!rounded-none">
                <EstimateWidgetV4
                  contractorId="c2a1286d-4faa-444a-b5b7-99f592359f80"
                  contractorName="Demo Roofing Co"
                  contractorPhone="(555) 123-4567"
                  variant="light"
                />
              </div>
            </div>

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              ↑ Live demo · Sample pricing · No card required
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Trust data bar */}
      <div className="border-y border-line bg-sand">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-4">
          {TRUST_STATS.map(([big, small], i) => (
            <div
              key={small}
              className={`px-6 py-7 md:px-8 ${
                i < TRUST_STATS.length - 1 ? "md:border-r md:border-line" : ""
              } ${i % 2 === 0 ? "border-r border-line md:border-r" : ""} ${
                i < 2 ? "border-b border-line md:border-b-0" : ""
              }`}
            >
              <div className="font-display text-[40px] font-extrabold uppercase leading-none tracking-tight text-ink md:text-[52px]">
                {big}
              </div>
              <div className="mt-2.5 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink/65">
                {small}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
