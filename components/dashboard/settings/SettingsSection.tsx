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
    <section className="neu-raised p-5 md:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight" style={{ color: "var(--neu-text)" }}>
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-[12px] neu-muted">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
