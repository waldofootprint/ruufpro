"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ContractorTier } from "@/lib/types";
import { getTierFromContractor } from "@/lib/types";

export interface OnboardingSteps {
  hasRates: boolean;
  hasAddons: boolean;
  hasZips: boolean;
  hasWebhook: boolean;
}

export interface OnboardingState {
  steps: OnboardingSteps;
  complete: boolean;
}

interface DashboardState {
  contractorId: string;
  businessName: string;
  tier: ContractorTier;
  newLeadCount: number;
  unreadSmsCount: number;
  refreshLeadCount: () => Promise<void>;
  refreshSmsCount: () => Promise<void>;
  onboarding: OnboardingState | null;
  refreshOnboarding: () => Promise<void>;
  loading: boolean;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tier, setTier] = useState<ContractorTier>("free");
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [unreadSmsCount, setUnreadSmsCount] = useState(0);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);

  // Fetch new lead count
  const refreshLeadCount = async () => {
    if (!contractorId) return;
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("contractor_id", contractorId)
      .eq("status", "new");
    setNewLeadCount(count || 0);
  };

  // Fetch unread SMS count
  const refreshSmsCount = async () => {
    if (!contractorId) return;
    const { count } = await supabase
      .from("sms_messages")
      .select("*", { count: "exact", head: true })
      .eq("contractor_id", contractorId)
      .eq("direction", "inbound")
      .is("read_at", null);
    setUnreadSmsCount(count || 0);
  };

  // Fetch onboarding completion state
  const refreshOnboarding = async () => {
    if (!contractorId) return;

    // Check estimate settings for rates + service zips
    const { data: settings } = await supabase
      .from("estimate_settings")
      .select("asphalt_low, asphalt_high, metal_low, metal_high, tile_low, tile_high, flat_low, flat_high, service_zips")
      .eq("contractor_id", contractorId)
      .single();

    const hasRates = !!(settings && (
      settings.asphalt_low || settings.asphalt_high ||
      settings.metal_low || settings.metal_high ||
      settings.tile_low || settings.tile_high ||
      settings.flat_low || settings.flat_high
    ));
    const hasZips = !!(settings?.service_zips && settings.service_zips.length > 0);

    // Check addons
    const { count: addonCount } = await supabase
      .from("estimate_addons")
      .select("*", { count: "exact", head: true })
      .eq("contractor_id", contractorId);
    const hasAddons = (addonCount || 0) > 0;

    // Check webhook from contractor record
    const { data: contractor } = await supabase
      .from("contractors")
      .select("webhook_enabled, webhook_url")
      .eq("id", contractorId)
      .single();
    const hasWebhook = !!(contractor?.webhook_enabled && contractor?.webhook_url);

    const steps: OnboardingSteps = { hasRates, hasAddons, hasZips, hasWebhook };
    const complete = hasRates && hasAddons && hasZips && hasWebhook;
    setOnboarding({ steps, complete });
  };

  // Auth check + contractor fetch (runs once)
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/dashboard");
          return;
        }
        const { data: contractor } = await supabase
          .from("contractors")
          .select("id, business_name, has_estimate_widget, has_seo_pages, has_custom_domain")
          .eq("user_id", user.id)
          .single();
        if (contractor) {
          setContractorId(contractor.id);
          setBusinessName(contractor.business_name);
          setTier(getTierFromContractor(contractor));
        } else {
          // User exists but no contractor record — send to onboarding
          router.push("/onboarding");
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error("Dashboard init error:", err);
        router.push("/login?redirect=/dashboard");
      }
    }
    init();
  }, [router]);

  // Fetch counts + onboarding once we have contractorId
  useEffect(() => {
    if (contractorId) {
      refreshLeadCount();
      refreshSmsCount();
      refreshOnboarding();
    }
  }, [contractorId]);

  return (
    <DashboardContext.Provider
      value={{ contractorId, businessName, tier, newLeadCount, unreadSmsCount, refreshLeadCount, refreshSmsCount, onboarding, refreshOnboarding, loading }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
