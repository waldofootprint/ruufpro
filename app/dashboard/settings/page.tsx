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
  MapPin,
} from "lucide-react";
import { ProfileTab } from "./tabs/ProfileTab";
import { RileyTab } from "./tabs/RileyTab";
import { EstimatesTab } from "./tabs/EstimatesTab";
import { ReviewsTab } from "./tabs/ReviewsTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { BillingTab } from "./tabs/BillingTab";
import { ServiceAreaTab } from "./tabs/ServiceAreaTab";

type TabId =
  | "profile"
  | "service-area"
  | "riley"
  | "estimates"
  | "reviews"
  | "integrations"
  | "billing";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "service-area", label: "Service Area", icon: MapPin },
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
      <div className="relative">
        <span
          className="neu-glow-orange"
          style={{ width: 420, height: 220, top: -70, left: -100 }}
          aria-hidden
        />
        <div className="neu-eyebrow mb-3 relative z-[1]">Your Business</div>
        <h1
          className="font-bold mb-2 relative z-[1]"
          style={{ color: "var(--neu-text)", fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.04em" }}
        >
          <em className="neu-em">Settings</em>.
        </h1>
        <p className="text-[15px] leading-relaxed relative z-[1]" style={{ color: "var(--neu-text-muted)" }}>
          Tune your business, Riley, estimates, reviews, integrations, and billing.
        </p>
      </div>

      {/* Tab bar — warm pill rail */}
      <div
        className="overflow-x-auto"
        style={{
          background: "var(--neu-bg)",
          borderRadius: 18,
          boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
        }}
      >
        <nav className="flex items-center gap-1 p-1.5 min-w-max">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 rounded-full text-[12.5px] font-semibold transition-all ${active ? "neu-dark-cta" : ""}`}
                style={
                  active
                    ? { padding: "8px 16px" }
                    : { padding: "8px 16px", color: "var(--neu-text-muted)" }
                }
              >
                <Icon className="h-[14px] w-[14px]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active tab */}
      <div>
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "service-area" && <ServiceAreaTab />}
        {activeTab === "riley" && <RileyTab />}
        {activeTab === "estimates" && <EstimatesTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
        {activeTab === "billing" && <BillingTab />}
      </div>
    </div>
  );
}
