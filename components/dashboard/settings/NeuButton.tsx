"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "accent" | "flat" | "ghost" | "dark";

type NeuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(function NeuButton(
  { variant = "flat", className = "", children, ...rest },
  ref
) {
  const base = "inline-flex items-center justify-center gap-2 text-[12.5px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const sizing: Record<Variant, string> = {
    accent: "px-4 py-2.5 rounded-full",
    dark: "rounded-full",
    flat: "px-4 py-2.5 rounded-full",
    ghost: "px-4 py-2.5 rounded-lg hover:opacity-75",
  };
  const styles: Record<Variant, string> = {
    accent: "neu-accent-btn",
    dark: "neu-dark-cta",
    flat: "neu-flat hover:opacity-90",
    ghost: "",
  };
  return (
    <button
      ref={ref}
      {...rest}
      className={`${base} ${sizing[variant]} ${styles[variant]} ${className}`}
      style={
        variant === "ghost"
          ? { color: "var(--neu-text-muted)" }
          : variant === "flat"
          ? { color: "var(--neu-text)" }
          : undefined
      }
    >
      {children}
    </button>
  );
});
