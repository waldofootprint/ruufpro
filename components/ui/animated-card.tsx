// Neumorphic card component — soft raised look with dual-direction shadows.
// Used across the entire site for consistent premium feel.

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AnimatedCard({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "group/animated-card relative overflow-hidden rounded-[20px] bg-[#f0f0f0] border-0 transition-all duration-300",
        className
      )}
      style={{
        boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff",
      }}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1 border-t border-gray-200/50 p-3",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold leading-none tracking-tight text-gray-900",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs text-gray-500",
        className
      )}
      {...props}
    />
  );
}

export function CardVisual({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("h-[120px] overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#f5f5f5] to-[#f0f0f0]", className)}
      {...props}
    />
  );
}
