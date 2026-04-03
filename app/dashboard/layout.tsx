// Dashboard layout — Cool Slate sidebar (desktop) + bottom tab bar (mobile).
// Auth handled by DashboardContext. No hamburger menu.

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import {
  LayoutDashboard,
  Users,
  Calculator,
  Globe,
  MoreHorizontal,
  Bell,
  LogOut,
  Settings,
  Puzzle,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ----- NAV CONFIG -----
const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users, showBadge: true },
  { href: "/dashboard/estimate-settings", label: "Widget Settings", icon: Calculator },
  { href: "/dashboard/addons", label: "Estimate Add-Ons", icon: Puzzle },
  { href: "/dashboard/my-site", label: "My Website", icon: Globe },
  { href: "/dashboard/sms", label: "SMS & Reviews", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const TAB_ITEMS = [
  { href: "/dashboard/leads", label: "Leads", icon: Users, showBadge: true },
  { href: "/dashboard/estimate-settings", label: "Widget", icon: Calculator },
  { href: "/dashboard/my-site", label: "My Site", icon: Globe },
  { href: "/dashboard", label: "More", icon: MoreHorizontal, isMore: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { businessName, newLeadCount, contractorId, loading } = useDashboard();
  const pathname = usePathname();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Check push status on mount
  useState(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.pushManager.getSubscription().then((sub) => setPushEnabled(!!sub));
      });
    }
  });

  async function enablePush() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractor_id: contractorId, subscription: sub.toJSON() }),
      });
      setPushEnabled(true);
    } catch {
      alert("Could not enable notifications. Please allow notifications in your browser settings.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Check if path matches (exact for /dashboard, startsWith for sub-pages)
  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex w-[220px] flex-col bg-[#334155] flex-shrink-0">
        {/* Logo */}
        <div className="px-5 pt-5 pb-6">
          <a href="/" className="text-[15px] font-extrabold text-white tracking-tight">
            RuufPro
          </a>
          <p className="text-[11px] text-white/35 mt-0.5 truncate">{businessName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {SIDEBAR_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all border-l-2 ${
                  active
                    ? "bg-white/10 text-white border-white/60"
                    : "text-white/45 hover:bg-white/5 hover:text-white/70 border-transparent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.showBadge && newLeadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {newLeadCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
          {!pushEnabled ? (
            <button
              onClick={enablePush}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-amber-300/80 hover:bg-white/5 transition-all w-full"
            >
              <Bell className="w-4 h-4" />
              Enable Notifications
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-emerald-400/80">
              <Bell className="w-4 h-4" />
              Notifications On
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-white/30 hover:bg-white/5 hover:text-white/50 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar */}
        <header className="hidden lg:flex h-14 bg-white/60 backdrop-blur-sm border-b border-[#e2e8f0] items-center px-7">
          <h1 className="text-[13px] font-semibold text-slate-700">
            {SIDEBAR_ITEMS.find((item) => isActive(item.href))?.label || "Dashboard"}
          </h1>
        </header>

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-[#e2e8f0] px-5 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">
                {SIDEBAR_ITEMS.find((item) => isActive(item.href))?.label || "Dashboard"}
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{businessName}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-white">
              {businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile: new lead alert banner */}
        {newLeadCount > 0 && (
          <a
            href="/dashboard/leads"
            className="lg:hidden flex items-center justify-between bg-slate-800 text-white px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <div>
                <span className="text-[14px] font-bold">{newLeadCount} New Lead{newLeadCount > 1 ? "s" : ""}</span>
                <span className="text-[11px] text-white/50 ml-2">Tap to respond</span>
              </div>
            </div>
            <span className="text-white/40 text-[14px]">&rarr;</span>
          </a>
        )}

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-7 pb-24 lg:pb-7">
          {children}
        </main>
      </div>

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e2e8f0] flex">
        {TAB_ITEMS.map((item) => {
          const active = isActive(item.href);

          if (item.isMore) {
            return (
              <div key="more" className="flex-1 relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`w-full flex flex-col items-center gap-0.5 pt-2 pb-3 text-[10px] font-semibold ${
                    moreOpen ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                  More
                </button>

                {/* More menu dropdown */}
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                    <div className="absolute bottom-full right-0 mb-2 mr-2 w-52 bg-white rounded-xl border border-[#e2e8f0] shadow-lg z-40 overflow-hidden">
                      <a
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setMoreOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </a>
                      <a
                        href="/dashboard/sms"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                        onClick={() => setMoreOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        SMS & Reviews
                      </a>
                      <a
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                        onClick={() => setMoreOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </a>
                      {!pushEnabled ? (
                        <button
                          onClick={() => { enablePush(); setMoreOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-amber-600 hover:bg-slate-50 border-t border-slate-100 w-full"
                        >
                          <Bell className="w-4 h-4" />
                          Enable Notifications
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-emerald-600 border-t border-slate-100">
                          <Bell className="w-4 h-4" />
                          Notifications On
                        </div>
                      )}
                      <button
                        onClick={() => { handleLogout(); setMoreOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-slate-400 hover:bg-slate-50 border-t border-slate-100 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 text-[10px] font-semibold relative ${
                active ? "text-slate-800" : "text-slate-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.showBadge && newLeadCount > 0 && (
                <span className="absolute top-1 right-[calc(50%-16px)] bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
                  {newLeadCount}
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
