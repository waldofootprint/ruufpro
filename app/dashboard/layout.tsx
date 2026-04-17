"use client";

import { Suspense } from "react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { supabase } from "@/lib/supabase";

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

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar
        businessName={businessName}
        tier={tier}
        newLeadCount={newLeadCount}
        onLogout={handleLogout}
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
