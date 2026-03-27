// Premium button system — consistent styling across the entire site.
// Three variants: primary (filled), secondary (outline), and ghost.
// All have the same border-radius, padding, font, and hover treatment.

"use client";

import { cn } from "@/lib/utils";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function PremiumButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: PremiumButtonProps) {
  return (
    <button
      className={cn(
        // Base styles shared by all variants
        "relative inline-flex items-center justify-center font-semibold",
        "rounded-xl transition-all duration-300 ease-out",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",

        // Size variants
        size === "sm" && "px-4 py-2 text-xs",
        size === "md" && "px-6 py-3 text-sm",
        size === "lg" && "px-8 py-3.5 text-base",

        // Color variants
        variant === "primary" && [
          "bg-gray-900 text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)]",
          "hover:bg-gray-800 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.12)]",
          "hover:-translate-y-[1px]",
        ],
        variant === "secondary" && [
          "bg-white text-gray-900",
          "border border-gray-200",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:bg-gray-50 hover:border-gray-300",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]",
          "hover:-translate-y-[1px]",
        ],
        variant === "ghost" && [
          "bg-transparent text-gray-600",
          "hover:bg-gray-100 hover:text-gray-900",
        ],

        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}
