"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "highlight";
}

export function StatCard({ label, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-5 border shadow-sm transition-shadow hover:shadow-md",
        variant === "highlight" && "bg-primary text-primary-foreground border-primary"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide mb-2",
              variant === "highlight" ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-extrabold tracking-tight",
              variant === "highlight" ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {value}
          </p>
          {(subtitle || trend) && (
            <p
              className={cn(
                "text-xs mt-1",
                variant === "highlight" ? "text-primary-foreground/50" : "text-muted-foreground"
              )}
            >
              {trend && (
                <span className={cn("font-semibold mr-1", trend.positive ? "text-emerald-500" : "text-red-500")}>
                  {trend.positive ? "↑" : "↓"} {trend.value}
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            variant === "highlight" ? "bg-primary-foreground/10" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              variant === "highlight" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          />
        </div>
      </div>
    </Card>
  );
}

export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
