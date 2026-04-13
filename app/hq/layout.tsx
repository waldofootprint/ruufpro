"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map((e) => e.trim()).filter(Boolean);

export default function HQLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login?redirect=/hq"); return; }
      if (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email || "")) {
        setAuthorized(true);
      } else {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading HQ...</div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0" }}>
      {children}
    </div>
  );
}
