"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className = "" }: FieldWrapperProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide neu-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] neu-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type NeuInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(function NeuInput(
  { label, hint, error, wrapperClassName, className = "", ...rest },
  ref
) {
  const input = (
    <input
      ref={ref}
      {...rest}
      className={`neu-inset-deep w-full bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition focus:ring-2 focus:ring-offset-0 ${className}`}
      style={{ color: "var(--neu-text)" }}
    />
  );

  if (label || hint || error) {
    return (
      <Field label={label} hint={hint} error={error} className={wrapperClassName}>
        {input}
      </Field>
    );
  }
  return input;
});

type NeuTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const NeuTextarea = forwardRef<HTMLTextAreaElement, NeuTextareaProps>(function NeuTextarea(
  { label, hint, error, wrapperClassName, className = "", rows = 3, ...rest },
  ref
) {
  const ta = (
    <textarea
      ref={ref}
      rows={rows}
      {...rest}
      className={`neu-inset-deep w-full bg-transparent px-3.5 py-2.5 text-[14px] leading-relaxed outline-none transition ${className}`}
      style={{ color: "var(--neu-text)" }}
    />
  );

  if (label || hint || error) {
    return (
      <Field label={label} hint={hint} error={error} className={wrapperClassName}>
        {ta}
      </Field>
    );
  }
  return ta;
});
