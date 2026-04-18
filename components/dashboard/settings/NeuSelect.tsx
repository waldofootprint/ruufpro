"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { Field } from "./NeuInput";

type NeuSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const NeuSelect = forwardRef<HTMLSelectElement, NeuSelectProps>(function NeuSelect(
  { label, hint, error, wrapperClassName, className = "", children, ...rest },
  ref
) {
  const control = (
    <div className="relative">
      <select
        ref={ref}
        {...rest}
        className={`neu-inset-deep w-full appearance-none bg-transparent px-3.5 py-2.5 pr-9 text-[14px] outline-none ${className}`}
        style={{ color: "var(--neu-text)" }}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 neu-muted"
        aria-hidden
      />
    </div>
  );

  if (label || hint || error) {
    return (
      <Field label={label} hint={hint} error={error} className={wrapperClassName}>
        {control}
      </Field>
    );
  }
  return control;
});
