"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden p-5"
      style={{
        background: "var(--neu-bg)",
        borderRadius: 20,
        boxShadow: "6px 6px 16px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)",
      }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <span
          className="flex h-[22px] w-[22px] items-center justify-center rounded-[8px]"
          style={{ background: "var(--neu-accent-light)", color: "var(--neu-accent)" }}
        >
          <Icon className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <p className="neu-eyebrow" style={{ fontSize: 10.5 }}>{label}</p>
      </div>
      <p
        className="font-bold tabular-nums"
        style={{
          color: "var(--neu-text)",
          fontSize: 36,
          lineHeight: 1,
          letterSpacing: "-0.035em",
        }}
      >
        {value}
      </p>
      {(subtitle || trend) && (
        <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: "var(--neu-text-muted)" }}>
          {trend && (
            <span
              className="font-semibold"
              style={{ color: trend.positive ? "#16a34a" : "#ef4444" }}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </p>
      )}
    </div>
  );
}

export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {children}
    </div>
  );
}
