"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  MessageSquare,
  Calculator,
  Star,
  Zap,
  CreditCard,
} from "lucide-react";
import { ProfileTab } from "./tabs/ProfileTab";
import { RileyTab } from "./tabs/RileyTab";
import { EstimatesTab } from "./tabs/EstimatesTab";
import { ReviewsTab } from "./tabs/ReviewsTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { BillingTab } from "./tabs/BillingTab";

type TabId = "profile" | "riley" | "estimates" | "reviews" | "integrations" | "billing";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "riley", label: "Riley", icon: MessageSquare },
  { id: "estimates", label: "Estimates", icon: Calculator },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "integrations", label: "Integrations", icon: Zap },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsNewPage() {
  return (
    <Suspense fallback={null}>
      <SettingsShell />
    </Suspense>
  );
}

function SettingsShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") as TabId | null;
  const activeTab: TabId = useMemo(() => {
    if (rawTab && TABS.some((t) => t.id === rawTab)) return rawTab;
    return "profile";
  }, [rawTab]);

  function setTab(id: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`/dashboard/settings?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="max-w-[880px] mx-auto space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--neu-text)" }}>
          Settings
        </h1>
        <p className="text-sm neu-muted">Tune your business, Riley, estimates, reviews, integrations, and billing.</p>
      </div>

      {/* Tab bar */}
      <div
        className="neu-flat overflow-x-auto"
        style={{ borderRadius: 14 }}
      >
        <nav className="flex items-center gap-1 p-1.5 min-w-max">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  active ? "neu-inset-deep" : "neu-muted hover:opacity-80"
                }`}
                style={active ? { color: "var(--neu-accent)" } : undefined}
              >
                <Icon className="h-[15px] w-[15px]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active tab */}
      <div>
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "riley" && <RileyTab />}
        {activeTab === "estimates" && <EstimatesTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
        {activeTab === "billing" && <BillingTab />}
      </div>
    </div>
  );
}
