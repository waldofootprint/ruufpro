"use client";

import { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ title, description, action, children }: SettingsSectionProps) {
  return (
    <section
      className="p-6 md:p-7"
      style={{
        background: "var(--neu-bg)",
        borderRadius: 20,
        boxShadow: "6px 6px 16px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)",
      }}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            className="font-bold"
            style={{ color: "var(--neu-text)", fontSize: 18, lineHeight: 1.15, letterSpacing: "-0.025em" }}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--neu-text-muted)" }}>
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
