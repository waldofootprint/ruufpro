"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  businessName: string;
  tier: string;
  newLeadCount: number;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

const MAIN_NAV = [
  { href: "/dashboard", label: "Leads", icon: Users, showBadge: true },
  { href: "/dashboard/insights", label: "Insights", icon: TrendingUp },
];

const ACCOUNT_NAV = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
  comingSoon?: boolean;
};

function NavSection({
  label,
  items,
  pathname,
  newLeadCount,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string;
  newLeadCount: number;
}) {
  return (
    <div className="mb-6">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const disabled = item.comingSoon;

          const content = (
            <>
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {item.showBadge && newLeadCount > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5"
                  style={{
                    background: "var(--neu-accent)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.18)",
                  }}
                >
                  {newLeadCount}
                </span>
              )}
              {disabled && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider neu-muted"
                  style={{
                    boxShadow:
                      "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)",
                  }}
                >
                  Soon
                </span>
              )}
            </>
          );

          const className = cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
            disabled
              ? "neu-muted opacity-60 cursor-not-allowed"
              : active
                ? "neu-inset-deep font-semibold"
                : "neu-muted hover:neu-flat hover:opacity-90"
          );

          if (disabled) {
            return (
              <div key={item.href} className={className} aria-disabled>
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
              style={active ? { color: "var(--neu-accent)" } : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({
  businessName,
  tier,
  newLeadCount,
  onLogout,
  darkMode,
  onToggleDark,
}: SidebarProps) {
  const pathname = usePathname();
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--neu-bg)" }}>
      {/* Logo + Dark Mode Toggle */}
      <div className="px-4 pt-6 pb-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight" style={{ color: "var(--neu-text)" }}>
          Ruuf<span style={{ color: "var(--neu-accent)" }}>Pro</span>
        </Link>
        <button
          onClick={onToggleDark}
          className="neu-flat flex h-8 w-8 items-center justify-center"
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? (
            <Sun className="h-4 w-4" style={{ color: "var(--neu-accent)" }} />
          ) : (
            <Moon className="h-4 w-4 neu-muted" />
          )}
        </button>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <NavSection label="Main" items={MAIN_NAV} pathname={pathname} newLeadCount={newLeadCount} />
        <NavSection label="Account" items={ACCOUNT_NAV} pathname={pathname} newLeadCount={0} />
      </nav>

      {/* Profile Footer */}
      <div className="px-3 pb-4">
        <div className="mb-3" style={{ borderTop: "1px solid var(--neu-border)" }} />
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--neu-accent)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--neu-text)" }}>{businessName}</p>
            <p className="text-xs capitalize neu-muted">{tier} Plan</p>
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium neu-muted transition-all hover:opacity-80"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-[250px] flex-col flex-shrink-0 h-screen sticky top-0"
        style={{
          background: "var(--neu-bg)",
          borderRight: "1px solid var(--neu-border)",
          boxShadow: "4px 0 12px var(--neu-shadow-dark)",
        }}
      >
        <SidebarContent {...props} />
      </aside>

      {/* Mobile sidebar trigger + sheet */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{
          background: "var(--neu-bg)",
          borderBottom: "1px solid var(--neu-border)",
          boxShadow: "0 4px 12px var(--neu-shadow-dark)",
        }}
      >
        <Link href="/" className="text-lg font-extrabold tracking-tight" style={{ color: "var(--neu-text)" }}>
          Ruuf<span style={{ color: "var(--neu-accent)" }}>Pro</span>
        </Link>
        <Sheet>
          <SheetTrigger className="neu-flat inline-flex h-9 w-9 items-center justify-center">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0" style={{ background: "var(--neu-bg)" }}>
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
