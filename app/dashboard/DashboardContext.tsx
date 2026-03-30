"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface DashboardState {
  contractorId: string;
  businessName: string;
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
  // TEMP: Skip auth, use demo contractor directly so we can preview the dashboard
  useEffect(() => {
    async function init() {
      try {
        // Try real auth first
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: contractor } = await supabase
            .from("contractors")
            .select("id, business_name")
            .eq("user_id", user.id)
            .single();
          if (contractor) {
            setContractorId(contractor.id);
            setBusinessName(contractor.business_name);
            setLoading(false);
            return;
          }
        }
        // Fallback: use demo contractor for preview
        const { data: demo } = await supabase
          .from("contractors")
          .select("id, business_name")
          .limit(1)
          .single();
        if (demo) {
          setContractorId(demo.id);
          setBusinessName(demo.business_name);
        } else {
          setContractorId("demo");
          setBusinessName("Demo Roofing Co");
        }
        setLoading(false);
      } catch (err) {
        console.error("Dashboard init error:", err);
        // Still show dashboard with fallback data
        setContractorId("demo");
        setBusinessName("Demo Roofing Co");
        setLoading(false);
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
      value={{ contractorId, businessName, newLeadCount, refreshLeadCount, loading }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
