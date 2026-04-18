"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "accent" | "flat" | "ghost";

type NeuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(function NeuButton(
  { variant = "flat", className = "", children, ...rest },
  ref
) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<Variant, string> = {
    accent: "neu-accent-btn",
    flat: "neu-flat hover:opacity-90",
    ghost: "rounded-lg hover:opacity-75",
  };
  return (
    <button
      ref={ref}
      {...rest}
      className={`${base} ${styles[variant]} ${className}`}
      style={variant === "ghost" ? { color: "var(--neu-text-muted)" } : undefined}
    >
      {children}
    </button>
  );
});
