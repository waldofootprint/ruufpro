"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ContractorTier } from "@/lib/types";
import { getTierFromContractor } from "@/lib/types";

interface DashboardState {
  contractorId: string;
  businessName: string;
  tier: ContractorTier;
  newLeadCount: number;
  refreshLeadCount: () => Promise<void>;
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

  // Fetch lead count once we have contractorId
  useEffect(() => {
    if (contractorId) refreshLeadCount();
  }, [contractorId]);

  return (
    <DashboardContext.Provider
      value={{ contractorId, businessName, tier, newLeadCount, refreshLeadCount, loading }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
