// Onboarding — 4-screen Riley setup.
// Screen 1: Basics  →  Screen 2: URL crawl  →  Screen 3: Sound check  →  Screen 4: Ship.
// Output: configured Riley + embed snippet + standalone /chat/[slug] URL.
// We do NOT build websites. The roofer brings their own site; Riley embeds.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CrawlReview, { type CrawlPayload } from "@/components/onboarding/CrawlReview";

type Screen =
  | "basics"
  | "crawl_url"
  | "crawl_scanning"
  | "crawl_review"
  | "fine-tune"
  | "ship";

// Map sub-screens to progress-dot phases.
const PHASE_ORDER = ["basics", "crawl", "fine-tune", "ship"] as const;
type Phase = (typeof PHASE_ORDER)[number];
function screenToPhase(s: Screen): Phase {
  if (s === "basics") return "basics";
  if (s === "fine-tune") return "fine-tune";
  if (s === "ship") return "ship";
  return "crawl";
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

const RESERVED_SLUGS = new Set([
  "www","app","api","admin","dashboard","login","signup","onboarding",
  "widget","chat","ops","hq","command-center","welcome","resources",
  "calculator","preview","demo","mission-control","sitemap","robots",
  "mail","email","billing","support","help","status","docs",
]);

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("basics");
  const [error, setError] = useState("");

  // Screen 1 — Basics
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Screen 2 — URL crawl
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlError, setCrawlError] = useState("");
  const [crawlProgress, setCrawlProgress] = useState("Reading your homepage…");
  const [crawlPayload, setCrawlPayload] = useState<CrawlPayload | null>(null);
  const [crawlOwnerName, setCrawlOwnerName] = useState<string | null>(null);
  const crawlAbortRef = useRef<AbortController | null>(null);

  // Auth gate + duplicate-account redirect (Q6 — refined in §6.5).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        router.push("/signup");
        return;
      }
      const { data: existing } = await supabase
        .from("contractors")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        router.push("/dashboard");
        return;
      }
      setUserId(data.user.id);
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleBasicsSubmit() {
    if (!businessName.trim() || !phone.trim() || !city.trim() || !state) {
      setError("Please fill in all fields.");
      return;
    }
    const slug = generateSlug(businessName);
    if (!slug) {
      setError("Please enter a valid business name.");
      return;
    }
    if (RESERVED_SLUGS.has(slug)) {
      setError("That name is reserved. Please use a different business name.");
      return;
    }
    setError("");
    setScreen("crawl_url");
  }

  // ────────────────────────────────────────────────────────────────────
  // Screen 2 — URL crawl (SSE)
  // ────────────────────────────────────────────────────────────────────
  async function runCrawl(url: string) {
    setCrawlError("");
    setCrawlProgress("Reading your homepage…");
    setScreen("crawl_scanning");

    const controller = new AbortController();
    crawlAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 50_000);

    try {
      const res = await fetch("/api/onboarding/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}));
        setCrawlError(errBody.error || "Couldn't start crawl. Try again or skip.");
        setScreen("crawl_url");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.trim()) continue;
          const lines = ev.split("\n");
          const eventName = lines.find((l) => l.startsWith("event: "))?.slice(7).trim();
          const dataLine = lines.find((l) => l.startsWith("data: "))?.slice(6) ?? "{}";
          let data: any = {};
          try {
            data = JSON.parse(dataLine);
          } catch {}
          if (eventName === "progress" && data.message) {
            setCrawlProgress(data.message);
          } else if (eventName === "error") {
            const msg = data.message || "Something went wrong reading your site.";
            if (data.stage === "robots") {
              // Site blocks crawlers — drop straight to manual fine-tune
              setCrawlError("");
              handleCrawlSkip();
              return;
            }
            setCrawlError(msg);
            setScreen("crawl_url");
            return;
          } else if (eventName === "complete") {
            setCrawlPayload(data as CrawlPayload);
            setScreen("crawl_review");
            return;
          }
        }
      }
      setCrawlError("Taking longer than expected — let's set Riley up manually.");
      setScreen("crawl_url");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setCrawlError("Taking longer than expected — let's set Riley up manually.");
      } else {
        setCrawlError("Couldn't reach your site — check the URL and try again.");
      }
      setScreen("crawl_url");
    } finally {
      clearTimeout(timeoutId);
      crawlAbortRef.current = null;
    }
  }

  function handleCrawlReviewSave(edited: CrawlPayload, ownerNameInput: string | null) {
    // Stash for handlePublish in §6.4 — no DB writes yet (contractor row doesn't exist).
    setCrawlPayload(edited);
    setCrawlOwnerName(ownerNameInput);
    setScreen("fine-tune");
  }

  function handleCrawlSkip() {
    setCrawlPayload(null);
    setCrawlOwnerName(null);
    setCrawlError("");
    setScreen("fine-tune");
  }

  if (!authReady || !userId) {
    return (
      <main className="neu-dashboard min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--neu-text-muted)", fontSize: 14 }}>Loading…</p>
      </main>
    );
  }

  // Crawl review uses a wider surface — render with its own wrapper.
  if (screen === "crawl_review" && crawlPayload) {
    return (
      <main className="neu-dashboard min-h-screen px-4 py-10">
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <ProgressDots current={screen} />
          <CrawlReview
            payload={crawlPayload}
            onSave={handleCrawlReviewSave}
            onSkip={handleCrawlSkip}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="neu-dashboard min-h-screen flex items-center justify-center px-4 py-12">
      <div style={{ width: "100%", maxWidth: 640 }}>
        <ProgressDots current={screen} />

        {screen === "basics" && (
          <BasicsScreen
            businessName={businessName}
            phone={phone}
            city={city}
            state={state}
            error={error}
            onBusinessName={setBusinessName}
            onPhone={setPhone}
            onCity={setCity}
            onState={setState}
            onSubmit={handleBasicsSubmit}
          />
        )}

        {screen === "crawl_url" && (
          <CrawlUrlScreen
            url={crawlUrl}
            error={crawlError}
            onUrlChange={setCrawlUrl}
            onScan={() => {
              if (!crawlUrl.trim()) {
                setCrawlError("Paste your website URL or skip below.");
                return;
              }
              runCrawl(crawlUrl.trim());
            }}
            onSkip={handleCrawlSkip}
          />
        )}

        {screen === "crawl_scanning" && (
          <CrawlScanningScreen
            progress={crawlProgress}
            onCancel={() => {
              crawlAbortRef.current?.abort();
              handleCrawlSkip();
            }}
          />
        )}

        {screen === "fine-tune" && (
          <PlaceholderScreen
            title="Sound check — coming in §6.3"
            body={
              crawlPayload
                ? `Crawl complete. Captured ${crawlPayload.pagesCrawled.length} page(s)${crawlOwnerName ? ` and owner name “${crawlOwnerName}”` : ""}. Fine-tune editor lands in §6.3.`
                : "Manual fine-tune. Owner name, warranty, financing, differentiators."
            }
            onBack={() => setScreen("crawl_url")}
          />
        )}

        {screen === "ship" && (
          <PlaceholderScreen
            title="Ship it — coming in §6.4"
            body="Embed snippet + standalone Riley URL + Open dashboard."
            onBack={() => setScreen("fine-tune")}
          />
        )}
      </div>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Screen 1 — Basics
// ──────────────────────────────────────────────────────────────────────

function BasicsScreen(props: {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  error: string;
  onBusinessName: (v: string) => void;
  onPhone: (v: string) => void;
  onCity: (v: string) => void;
  onState: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--neu-text)",
            margin: 0,
            marginBottom: 12,
          }}
        >
          Let&apos;s get Riley ready for your site.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--neu-text-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Two minutes. Riley starts answering homeowner questions on your
          existing site as soon as we&apos;re done.
        </p>
      </header>

      {props.error && <ErrorBanner message={props.error} />}

      <div className="neu-raised" style={{ padding: 28 }}>
        <Field label="Business name">
          <input
            type="text"
            value={props.businessName}
            onChange={(e) => props.onBusinessName(e.target.value)}
            placeholder="Joe's Roofing"
            style={inputStyle}
          />
        </Field>

        <Field label="Phone number">
          <input
            type="tel"
            value={props.phone}
            onChange={(e) => props.onPhone(e.target.value)}
            placeholder="(555) 123-4567"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Field label="City">
            <input
              type="text"
              value={props.city}
              onChange={(e) => props.onCity(e.target.value)}
              placeholder="Tampa"
              style={inputStyle}
            />
          </Field>
          <Field label="State">
            <select
              value={props.state}
              onChange={(e) => props.onState(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">--</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <SleekCta label="Continue" onClick={props.onSubmit} />
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--neu-text-dim)",
            margin: "10px 0 0 0",
            letterSpacing: "0.01em",
          }}
        >
          Next: we scan your site to set Riley up
        </p>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--neu-text-dim)",
          marginTop: 16,
        }}
      >
        14-day free trial · no credit card required
      </p>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Shared bits
// ──────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  color: "var(--neu-text)",
  background: "var(--neu-bg)",
  border: "1px solid var(--neu-border)",
  borderRadius: 10,
  fontFamily: "inherit",
  outline: "none",
  boxShadow:
    "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--neu-text)",
          marginBottom: 6,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="neu-flat"
      style={{
        padding: "12px 16px",
        marginBottom: 16,
        fontSize: 14,
        color: "#b91c1c",
        background: "#fef2f2",
        border: "1px solid #fecaca",
      }}
    >
      {message}
    </div>
  );
}

function ProgressDots({ current }: { current: Screen }) {
  const phase = screenToPhase(current);
  const idx = PHASE_ORDER.indexOf(phase);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        marginBottom: 32,
      }}
    >
      {PHASE_ORDER.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <span
            key={s}
            aria-label={`Step ${i + 1}${active ? " (current)" : ""}`}
            style={{
              width: active ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: done || active ? "var(--neu-accent)" : "var(--neu-border)",
              transition: "all 0.2s ease",
              boxShadow: done
                ? "0 1px 1px rgba(180, 90, 20, 0.18)"
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Screen 2 — URL crawl (paste + scanning)
// ──────────────────────────────────────────────────────────────────────

function CrawlUrlScreen(props: {
  url: string;
  error: string;
  onUrlChange: (v: string) => void;
  onScan: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--neu-text)",
            margin: 0,
            marginBottom: 12,
          }}
        >
          Got a website?
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--neu-text-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Paste it and we&apos;ll set Riley up for you. We read your site,
          suggest answers, you confirm. ~30 seconds.
        </p>
      </header>

      {props.error && <ErrorBanner message={props.error} />}

      <div className="neu-raised" style={{ padding: 28 }}>
        <Field label="Website URL">
          <input
            type="url"
            value={props.url}
            onChange={(e) => props.onUrlChange(e.target.value)}
            placeholder="https://yourroofingsite.com"
            style={inputStyle}
          />
          <p
            style={{
              fontSize: 12,
              color: "var(--neu-text-dim)",
              margin: "6px 0 0 0",
            }}
          >
            Your homepage works best. We crawl up to 3 subpages.
          </p>
        </Field>

        <SleekCta label="Scan my site" onClick={props.onScan} />
      </div>

      <button
        onClick={props.onSkip}
        style={{
          width: "100%",
          marginTop: 16,
          padding: "8px 0",
          fontSize: 13,
          color: "var(--neu-text-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        I don&apos;t have a website — set up manually →
      </button>
    </>
  );
}

function CrawlScanningScreen({
  progress,
  onCancel,
}: {
  progress: string;
  onCancel: () => void;
}) {
  return (
    <div
      className="neu-raised"
      style={{ padding: 48, textAlign: "center" }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          marginBottom: 20,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid var(--neu-border)",
            borderTopColor: "var(--neu-accent)",
            animation: "spin 0.9s linear infinite",
            display: "block",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: "var(--neu-text)",
          margin: 0,
          marginBottom: 10,
        }}
      >
        Reading your site…
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--neu-text-muted)",
          margin: 0,
          minHeight: 20,
        }}
      >
        {progress}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--neu-text-dim)",
          marginTop: 24,
          marginBottom: 0,
        }}
      >
        This usually takes about 10 seconds.
      </p>
      <button
        onClick={onCancel}
        style={{
          marginTop: 28,
          padding: "6px 12px",
          fontSize: 12,
          color: "var(--neu-text-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Skip and fill manually
      </button>
    </div>
  );
}

// Sleek primary CTA — same treatment as Screen 1.
function SleekCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(0.5px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.04)")}
      onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      style={{
        width: "100%",
        marginTop: 24,
        padding: "13px 18px",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        color: "#fff",
        background:
          "linear-gradient(180deg, #FB8A3C 0%, #F97316 55%, #EA6A0E 100%)",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 1px rgba(180, 90, 20, 0.22), 0 6px 14px -8px rgba(180, 90, 20, 0.45)",
        transition: "transform 0.12s ease, box-shadow 0.18s ease, filter 0.18s ease",
        fontFamily: "inherit",
      }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        style={{
          fontSize: 13,
          opacity: 0.9,
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          transform: "translateY(-0.5px)",
        }}
      >
        →
      </span>
    </button>
  );
}

function PlaceholderScreen({
  title,
  body,
  onBack,
}: {
  title: string;
  body: string;
  onBack: () => void;
}) {
  return (
    <div className="neu-raised" style={{ padding: 32, textAlign: "center" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
        {title}
      </h2>
      <p style={{ color: "var(--neu-text-muted)", fontSize: 15, marginBottom: 24 }}>
        {body}
      </p>
      <button
        onClick={onBack}
        style={{
          padding: "10px 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--neu-text)",
          background: "transparent",
          border: "1px solid var(--neu-border)",
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>
    </div>
  );
}
