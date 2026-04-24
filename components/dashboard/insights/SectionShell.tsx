"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  caption: string;
  children: ReactNode;
}

export function SectionShell({ icon: Icon, iconColor, title, caption, children }: Props) {
  return (
    <section
      className="p-6 lg:p-7"
      style={{
        background: "var(--neu-bg)",
        borderRadius: 20,
        boxShadow: "6px 6px 16px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)",
      }}
    >
      <header className="mb-5 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center"
          style={{
            borderRadius: 12,
            background: "var(--neu-accent-light)",
            color: iconColor || "var(--neu-accent)",
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="neu-eyebrow" style={{ fontSize: 10.5, marginBottom: 4 }}>{caption}</div>
          <h2
            className="font-bold"
            style={{ color: "var(--neu-text)", fontSize: 20, lineHeight: 1.1, letterSpacing: "-0.025em" }}
          >
            {title}
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}

export function InsetStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: "var(--neu-bg)",
        borderRadius: 14,
        boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
      }}
    >
      <p className="neu-eyebrow mb-1.5" style={{ fontSize: 10 }}>{label}</p>
      <p
        className="font-bold tabular-nums"
        style={{ color: "var(--neu-text)", fontSize: 26, lineHeight: 1, letterSpacing: "-0.035em" }}
      >
        {value}
      </p>
      {sub && <p className="text-[11.5px] mt-1.5" style={{ color: "var(--neu-text-muted)" }}>{sub}</p>}
    </div>
  );
}
