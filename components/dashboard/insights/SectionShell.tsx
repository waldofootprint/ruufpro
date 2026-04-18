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
    <section className="neu-flat p-5 lg:p-6" style={{ borderRadius: 18 }}>
      <header className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center"
          style={{
            borderRadius: 10,
            boxShadow: "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)",
            color: iconColor || "var(--neu-accent)",
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--neu-text)" }}>
            {title}
          </h2>
          <p className="text-[11px] neu-muted mt-0.5">{caption}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function InsetStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="px-3.5 py-3"
      style={{
        borderRadius: 12,
        boxShadow: "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider neu-muted mb-1">{label}</p>
      <p className="text-xl font-bold tracking-tight" style={{ color: "var(--neu-text)" }}>{value}</p>
      {sub && <p className="text-[11px] neu-muted mt-0.5">{sub}</p>}
    </div>
  );
}
