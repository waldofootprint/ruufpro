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

export function StatCard({ label, value, subtitle, icon: Icon, iconColor, trend }: StatCardProps) {
  return (
    <div className="neu-raised p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider neu-muted mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--neu-text)" }}>
            {value}
          </p>
          {(subtitle || trend) && (
            <p className="text-xs mt-1.5 neu-muted">
              {trend && (
                <span className={cn("font-semibold mr-1", trend.positive ? "text-emerald-600" : "text-red-500")}>
                  {trend.positive ? "↑" : "↓"} {trend.value}
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
        <div className="neu-score flex h-11 w-11 items-center justify-center">
          <Icon className="h-5 w-5" style={{ color: "var(--neu-accent)" }} />
        </div>
      </div>
    </div>
  );
}

export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {children}
    </div>
  );
}
