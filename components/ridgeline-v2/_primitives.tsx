// components/ridgeline-v2/_primitives.tsx
// Shared building blocks for every redesigned section.

import React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Eyebrow — short uppercase mono label with a 28px rust em-rule.
   ──────────────────────────────────────────────────────────── */
export function Eyebrow({
  children,
  light = false,
  className = "",
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  const text = light ? "text-rust-2" : "text-rust";
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] ${text} ${className}`}
    >
      <span aria-hidden className={`block h-px w-7 ${light ? "bg-rust-2" : "bg-rust"}`} />
      <span>{children}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PrimaryCTA — square edges, supports right or down arrow.
   ──────────────────────────────────────────────────────────── */
export function PrimaryCTA({
  href,
  children,
  className = "",
  arrow = "right",
  onClick,
  type = "link",
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  arrow?: "right" | "down" | "none";
  onClick?: () => void;
  type?: "link" | "button";
}) {
  const Icon = arrow === "down" ? ArrowDown : arrow === "right" ? ArrowRight : null;
  const inner = (
    <>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{children}</span>
      {Icon && <Icon size={14} strokeWidth={2.5} />}
    </>
  );
  const cls = `inline-flex items-center gap-2.5 bg-rust px-6 py-3.5 text-paper transition-colors hover:bg-[#A6481F] ${className}`;
  if (type === "button") {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} onClick={onClick} className={cls}>
      {inner}
    </a>
  );
}

export function SecondaryCTA({
  href,
  children,
  className = "",
  light = false,
  arrow = "right",
  outline = false,
  onClick,
  type = "link",
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  light?: boolean;
  arrow?: "right" | "down" | "none";
  outline?: boolean;
  onClick?: () => void;
  type?: "link" | "button";
}) {
  const Icon = arrow === "down" ? ArrowDown : arrow === "right" ? ArrowRight : null;
  const base = "inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors";
  const styled = outline
    ? `${base} border-2 px-6 py-3.5 ${
        light
          ? "border-paper text-paper hover:border-rust-2 hover:text-rust-2"
          : "border-ink text-ink hover:border-rust hover:text-rust"
      }`
    : `${base} underline decoration-1 underline-offset-[6px] ${
        light ? "text-paper hover:text-rust-2 decoration-paper/40" : "text-ink hover:text-rust decoration-ink/30"
      }`;
  const cls = `${styled} ${className}`;
  const inner = (
    <>
      {children}
      {Icon && <Icon size={13} strokeWidth={2.5} />}
    </>
  );
  if (type === "button") {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} onClick={onClick} className={cls}>
      {inner}
    </a>
  );
}

/* ────────────────────────────────────────────────────────────
   SectionShell
   ──────────────────────────────────────────────────────────── */
export function SectionShell({
  children,
  wide = false,
  className = "",
}: {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className={`mx-auto px-6 md:px-12 ${wide ? "max-w-[1280px]" : "max-w-[1200px]"} ${className}`}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   TwoColHead
   ──────────────────────────────────────────────────────────── */
export function TwoColHead({
  eyebrow,
  children,
  light = false,
  className = "",
}: {
  eyebrow: string;
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid gap-10 md:grid-cols-[180px_1fr] md:gap-16 ${className}`}>
      <div className="pt-2">
        <Eyebrow light={light}>{eyebrow}</Eyebrow>
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Wordmark — RUUF black pill (with bottom-left tail) + PRO rust pill.
   Square corners, consistent with rest of design.
   ──────────────────────────────────────────────────────────── */
export function Wordmark({ size = "sm" }: { size?: "sm" | "md" }) {
  const px = size === "md" ? "px-3.5 py-2 text-base" : "px-2.5 py-1 text-sm";
  const tailSize = size === "md" ? "w-3 h-3 -bottom-2" : "w-2.5 h-2.5 -bottom-1.5";
  return (
    <div className="flex items-center gap-1" aria-label="RuufPro">
      <div className={`relative bg-ink ${px} font-display font-extrabold uppercase tracking-tight text-paper`}>
        Ruuf
        <span
          aria-hidden
          className={`absolute left-0 ${tailSize} bg-ink`}
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
      </div>
      <div className={`bg-rust ${px} font-display font-extrabold uppercase tracking-tight text-paper`}>
        Pro
      </div>
    </div>
  );
}
