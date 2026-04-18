"use client";

interface NeuToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function NeuToggle({ checked, onChange, label, description, disabled }: NeuToggleProps) {
  const body = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-all ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      style={{
        background: checked ? "var(--neu-accent)" : "var(--neu-bg)",
        boxShadow: checked
          ? "inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)"
          : "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
      }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full transition-all"
        style={{
          left: checked ? "calc(100% - 1.625rem)" : "0.125rem",
          background: "var(--neu-bg)",
          boxShadow: checked
            ? "0 2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)"
            : "2px 2px 4px var(--neu-shadow-dark), -2px -2px 4px var(--neu-shadow-light)",
        }}
      />
    </button>
  );

  if (!label && !description) return body;

  return (
    <label
      className="flex items-start justify-between gap-4 py-1 cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onChange(!checked);
      }}
    >
      <div className="flex-1 min-w-0">
        {label && (
          <div className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
            {label}
          </div>
        )}
        {description && <div className="mt-0.5 text-[12px] neu-muted">{description}</div>}
      </div>
      {body}
    </label>
  );
}
