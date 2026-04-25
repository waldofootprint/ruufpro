// components/ridgeline-v2/footer.tsx
import React from "react";

const INK = "#0C1F28";
const PAPER = "#FBF7EF";
const RUST = "#C2562A";

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace';
const DISPLAY =
  '"Barlow Condensed", "Oswald", "Arial Narrow", system-ui, sans-serif';
const SANS =
  '"Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const COLS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "#demo" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "For roofers",
    links: [
      { label: "Free trial", href: "/signup" },
      { label: "Estimate widget", href: "/signup" },
      { label: "Riley AI", href: "#features" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact", href: "mailto:hello@ruufpro.com" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

function Wordmark() {
  return (
    <div className="flex items-center gap-1" aria-label="RuufPro">
      <div
        style={{
          backgroundColor: PAPER,
          color: INK,
          fontFamily: DISPLAY,
        }}
        className="relative px-2.5 py-1 text-sm font-extrabold uppercase tracking-tight"
      >
        Ruuf
        <span
          aria-hidden
          style={{ backgroundColor: PAPER, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          className="absolute -bottom-1.5 left-0 h-2.5 w-2.5"
        />
      </div>
      <div
        style={{
          backgroundColor: RUST,
          color: PAPER,
          fontFamily: DISPLAY,
        }}
        className="px-2.5 py-1 text-sm font-extrabold uppercase tracking-tight"
      >
        Pro
      </div>
    </div>
  );
}

export default function FooterV2() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{ backgroundColor: INK, color: PAPER, fontFamily: SANS }}
      className="relative w-full"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-20">
        {/* Top — wordmark + tagline + cols */}
        <div className="grid gap-12 md:grid-cols-[1.4fr_2.6fr] md:gap-16">
          <div>
            <Wordmark />
            <p
              style={{ color: "rgba(251,247,239,0.65)" }}
              className="mt-6 max-w-[28ch] text-[14px] leading-relaxed"
            >
              Built by a solo founder who watched great roofers lose jobs to
              competitors with worse work and better websites.
            </p>

            <a
              href="/signup"
              style={{
                backgroundColor: RUST,
                color: PAPER,
                fontFamily: MONO,
                letterSpacing: "0.14em",
              }}
              className="mt-7 inline-flex items-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase transition-opacity hover:opacity-90"
            >
              Start free trial →
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLS.map((col) => (
              <div key={col.heading}>
                <h4
                  style={{
                    color: "rgba(251,247,239,0.55)",
                    fontFamily: MONO,
                    letterSpacing: "0.16em",
                  }}
                  className="text-[10.5px] font-semibold uppercase"
                >
                  {col.heading}
                </h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        style={{ color: PAPER }}
                        className="text-[14px] transition-colors hover:text-[var(--rust-2,#E2855A)]"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{ borderTop: `1px solid rgba(251,247,239,0.12)` }}
          className="mt-14 flex flex-col items-start justify-between gap-4 pt-6 md:flex-row md:items-center md:gap-8 md:pt-8"
        >
          <p
            style={{
              color: "rgba(251,247,239,0.5)",
              fontFamily: MONO,
              letterSpacing: "0.14em",
            }}
            className="text-[10.5px] uppercase"
          >
            © {year} RuufPro · All rights reserved
          </p>
          <p
            style={{
              color: "rgba(251,247,239,0.5)",
              fontFamily: MONO,
              letterSpacing: "0.14em",
            }}
            className="text-[10.5px] uppercase"
          >
            Satellite measurement · Powered by Google Solar API
          </p>
        </div>
      </div>
    </footer>
  );
}
