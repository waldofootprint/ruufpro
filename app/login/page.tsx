// Login page — existing roofers sign back in to manage their site.

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #FFFFFF 0%, #F8FAFC 100%)",
        padding: "24px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo + tagline */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#0F1B2D",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-sora), system-ui, sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "#0F1B2D",
                letterSpacing: "-0.02em",
              }}
            >
              RuufPro
            </span>
          </div>
          <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.5 }}>
            Sign in to manage your site
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleLogin}
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-sora), system-ui, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#0F1B2D",
              marginBottom: "24px",
            }}
          >
            Welcome back
          </h2>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#991B1B",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <label style={{ display: "block", marginBottom: "16px" }}>
            <span
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1.5px solid #E2E8F0",
                borderRadius: "10px",
                fontSize: "15px",
                color: "#1A1A2E",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "24px" }}>
            <span
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1.5px solid #E2E8F0",
                borderRadius: "10px",
                fontSize: "15px",
                color: "#1A1A2E",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "#0F1B2D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "99px",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "var(--font-sora), system-ui, sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "#64748B",
              marginTop: "20px",
            }}
          >
            Don&rsquo;t have an account?{" "}
            <a
              href="/signup"
              style={{
                color: "#E8722A",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Get started free
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FAFC",
          }}
        >
          <p style={{ color: "#94A3B8", fontFamily: "system-ui" }}>Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
