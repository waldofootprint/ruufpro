"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map((e) => e.trim()).filter(Boolean);

const NAV_ITEMS = [
  { href: "/ops", label: "Pipeline", icon: "📈", badgeKey: "gates" },
  { href: "/ops/sms", label: "SMS Automations", icon: "💬" },
  { href: "/ops/health", label: "System Health", icon: "⚡" },
  { href: "/ops/revenue", label: "Revenue", icon: "💰", badgeKey: "revenue" },
];

const NAV_BOTTOM = [
  { href: "/ops/settings", label: "Settings", icon: "⚙️" },
  { href: "/dashboard", label: "Dashboard", icon: "🔗" },
];

export default function OpsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        // Timeout after 5s so we never hang on "Loading Ops Center..."
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        const authCheck = supabase.auth.getUser();
        const result = await Promise.race([authCheck, timeout]);

        if (!result) {
          // Timed out — try getSession as fallback
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.replace("/login?redirect=/ops");
            return;
          }
          // Session exists, allow through
          setAuthorized(true);
          return;
        }

        const { data: { user }, error } = result;
        if (error || !user) {
          router.replace("/login?redirect=/ops");
          return;
        }
        if (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email || "")) {
          setAuthorized(true);
        } else {
          router.replace("/dashboard");
          return;
        }
      } catch {
        router.replace("/login?redirect=/ops");
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  // Close nav on route change
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
        <div className="text-gray-400 text-sm">Loading Ops Center...</div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      {/* ═══ TOP BAR ═══ */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E5EA] h-[52px] px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold tracking-tight">
            RuufPro <span className="text-[#8E8E93] font-normal">Ops</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-[#8E8E93]">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="w-9 h-9 rounded-lg border border-[#E5E5EA] bg-white flex flex-col items-center justify-center gap-1 hover:bg-[#F5F5F7] hover:border-[#D1D1D6] transition-all"
          >
            <span className={`block w-4 h-[2px] bg-[#3C3C43] rounded-sm transition-all ${navOpen ? "rotate-45 translate-y-[3px]" : ""}`} />
            <span className={`block w-4 h-[2px] bg-[#3C3C43] rounded-sm transition-all ${navOpen ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-[2px] bg-[#3C3C43] rounded-sm transition-all ${navOpen ? "-rotate-45 -translate-y-[3px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ═══ NAV OVERLAY ═══ */}
      <div
        className={`fixed inset-0 bg-black/30 z-[200] transition-opacity ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setNavOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 w-[300px] h-screen bg-white z-[201] transition-transform shadow-[-4px_0_24px_rgba(0,0,0,0.08)] p-6 flex flex-col ${navOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-4">Navigation</div>

          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/ops" ? pathname === "/ops" : pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] mb-1 text-sm font-medium transition-all text-left w-full ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#007AFF] font-semibold"
                    : "text-[#3C3C43] hover:bg-[#F5F5F7]"
                }`}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div className="h-px bg-[#F2F2F7] my-3" />

          {NAV_BOTTOM.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-[10px] mb-1 text-sm font-medium text-[#3C3C43] hover:bg-[#F5F5F7] transition-all text-left w-full"
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-[#F2F2F7]">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              className="flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-xs text-[#8E8E93] hover:bg-[#F5F5F7] transition-all w-full"
            >
              <span className="text-lg w-6 text-center">🔒</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ═══ PAGE CONTENT ═══ */}
      {children}
    </div>
  );
}
