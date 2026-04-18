"use client";

import { Suspense, useState, useEffect } from "react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <DashboardProvider>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProvider>
    </Suspense>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { businessName, newLeadCount, tier, loading } = useDashboard();
  const [darkMode, setDarkMode] = useState(false);

  // Persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem("ruufpro-dashboard-dark");
    if (saved === "true") setDarkMode(true);
  }, []);

  function toggleDarkMode() {
    setDarkMode((prev) => {
      localStorage.setItem("ruufpro-dashboard-dark", String(!prev));
      return !prev;
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="neu-dashboard flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current/20 border-t-current" style={{ color: "var(--neu-accent)" }} />
          <p className="neu-muted text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("neu-dashboard flex min-h-screen", darkMode && "dark")}>
      <DashboardSidebar
        businessName={businessName}
        tier={tier}
        newLeadCount={newLeadCount}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-0 lg:pt-0">
        {/* Mobile: add top padding for the fixed mobile header */}
        <div className="lg:hidden h-14" />
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
