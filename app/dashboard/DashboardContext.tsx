"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ContractorTier } from "@/lib/types";
import { getTierFromContractor } from "@/lib/types";

export interface OnboardingSteps {
  hasRates: boolean;
  hasAddons: boolean;
  hasZips: boolean;
  hasWebhook: boolean;
  hasChatbot: boolean;
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
  refreshContractor: () => Promise<void>;
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
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [loading, setLoading] = useState(!isDemo);
  const [contractorId, setContractorId] = useState(isDemo ? "demo-contractor" : "");
  const [businessName, setBusinessName] = useState(isDemo ? "Summit Roofing" : "");
  const [tier, setTier] = useState<ContractorTier>(isDemo ? "pro" : "free");
  const [newLeadCount, setNewLeadCount] = useState(isDemo ? 3 : 0);
  const [unreadSmsCount, setUnreadSmsCount] = useState(isDemo ? 0 : 0);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(
    isDemo
      ? { steps: { hasRates: true, hasAddons: true, hasZips: true, hasWebhook: true, hasChatbot: true }, complete: true }
      : null
  );

  // Demo mode — no-op refreshes, skip auth
  const noop = async () => {};

  // Fetch new lead count
  const refreshLeadCount = async () => {
    if (isDemo) return;
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
    if (isDemo) return;
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
    if (isDemo) return;
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

    // Check webhook from contractor record + chatbot status
    const { data: contractor } = await supabase
      .from("contractors")
      .select("webhook_enabled, webhook_url, has_ai_chatbot")
      .eq("id", contractorId)
      .single();
    const hasWebhook = !!(contractor?.webhook_enabled && contractor?.webhook_url);

    // Check if chatbot has been trained (has at least 1 config field)
    const { data: chatConfig } = await supabase
      .from("chatbot_config")
      .select("price_range_low")
      .eq("contractor_id", contractorId)
      .maybeSingle();
    const hasChatbot = !!(contractor?.has_ai_chatbot && chatConfig);

    const steps: OnboardingSteps = { hasRates, hasAddons, hasZips, hasWebhook, hasChatbot };
    const complete = hasRates && hasAddons && hasZips && hasWebhook;
    setOnboarding({ steps, complete });
  };

  // Re-fetch contractor data (tier, flags) from DB
  const refreshContractor = async () => {
    if (isDemo) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, business_name, has_estimate_widget, has_seo_pages, has_custom_domain, has_ai_chatbot, trial_ends_at")
      .eq("user_id", user.id)
      .single();
    if (contractor) {
      setContractorId(contractor.id);
      setBusinessName(contractor.business_name);
      setTier(getTierFromContractor(contractor));
    }
  };

  // Auth check + contractor fetch (runs once) — skipped in demo mode
  useEffect(() => {
    if (isDemo) return; // Demo mode: state already set via useState defaults
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/dashboard");
          return;
        }
        const { data: contractor } = await supabase
          .from("contractors")
          .select("id, business_name, has_estimate_widget, has_seo_pages, has_custom_domain, has_ai_chatbot, trial_ends_at")
          .eq("user_id", user.id)
          .single();
        if (contractor) {
          setContractorId(contractor.id);
          setBusinessName(contractor.business_name);
          setTier(getTierFromContractor(contractor));
        } else {
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
  }, [router, isDemo]);

  // After Stripe checkout redirect, re-fetch contractor to pick up new tier
  useEffect(() => {
    if (searchParams.get("billing") === "success" && contractorId) {
      refreshContractor();
    }
  }, [searchParams, contractorId]);

  // Fetch counts + onboarding once we have contractorId (skip in demo)
  useEffect(() => {
    if (isDemo) return;
    if (contractorId) {
      refreshLeadCount();
      refreshSmsCount();
      refreshOnboarding();
    }
  }, [contractorId, isDemo]);

  return (
    <DashboardContext.Provider
      value={{ contractorId, businessName, tier, newLeadCount, unreadSmsCount, refreshLeadCount, refreshSmsCount, refreshContractor, onboarding, refreshOnboarding, loading }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
