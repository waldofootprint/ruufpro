"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  BarChart3,
  MessageSquare,
  Calculator,
  Star,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  ChevronLeft,
  Menu,
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
}

const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users, showBadge: true },
  { href: "/dashboard/copilot", label: "Copilot", icon: Sparkles },
  { href: "/dashboard/weekly", label: "Your Week", icon: BarChart3 },
];

const TOOL_NAV = [
  { href: "/dashboard/chatbot", label: "Riley Chat", icon: MessageSquare },
  { href: "/dashboard/estimate-settings", label: "Estimates", icon: Calculator },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
];

const ACCOUNT_NAV = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavSection({
  label,
  items,
  pathname,
  newLeadCount,
}: {
  label: string;
  items: typeof MAIN_NAV;
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-orange-50 text-orange-700 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {item.showBadge && newLeadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1.5">
                  {newLeadCount}
                </span>
              )}
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
}: SidebarProps) {
  const pathname = usePathname();
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-4 pt-6 pb-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-foreground">
          Ruuf<span className="text-orange-500">Pro</span>
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <NavSection label="Main" items={MAIN_NAV} pathname={pathname} newLeadCount={newLeadCount} />
        <NavSection label="Tools" items={TOOL_NAV} pathname={pathname} newLeadCount={0} />
        <NavSection label="Account" items={ACCOUNT_NAV} pathname={pathname} newLeadCount={0} />
      </nav>

      {/* Profile Footer */}
      <div className="px-3 pb-4">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{businessName}</p>
            <p className="text-xs text-muted-foreground capitalize">{tier} Plan</p>
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
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
      <aside className="hidden lg:flex w-[250px] flex-col border-r border-border bg-card flex-shrink-0 h-screen sticky top-0">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile sidebar trigger + sheet */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-foreground">
          Ruuf<span className="text-orange-500">Pro</span>
        </Link>
        <Sheet>
          <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
