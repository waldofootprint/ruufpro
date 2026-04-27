// Onboarding — 3-phase Riley setup.
// Phase 1: Basics  →  Phase 2: Sound check (URL crawl + review/manual fill)  →  Phase 3: Ship.
// Output: configured Riley + embed snippet + standalone /chat/[slug] URL.
// We do NOT build websites. The roofer brings their own site; Riley embeds.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CrawlReview, { type CrawlPayload } from "@/components/onboarding/CrawlReview";
import {
  buildCrawlStateJson,
  type CrawlStateField,
} from "@/lib/scrape-to-chatbot-config";

type Screen =
  | "basics"
  | "crawl_url"
  | "crawl_scanning"
  | "sound_check"
  | "ship";

// Map sub-screens to progress-dot phases.
const PHASE_ORDER = ["basics", "sound-check", "ship"] as const;
type Phase = (typeof PHASE_ORDER)[number];
function screenToPhase(s: Screen): Phase {
  if (s === "basics") return "basics";
  if (s === "ship") return "ship";
  return "sound-check";
}

// Empty payload for manual-fill mode (user skipped crawl or it failed soft).
function emptyCrawlPayload(): CrawlPayload {
  return {
    patch: {
      chatbotConfig: {},
      sites: {},
      contractors: {},
    },
    crawlState: [] as CrawlStateField[],
    pagesCrawled: [],
    generatedFaqCount: 0,
  };
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
            setScreen("sound_check");
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
    // Stash for handlePublish — no DB writes yet (contractor row doesn't exist).
    setCrawlPayload(edited);
    setCrawlOwnerName(ownerNameInput);
    setScreen("ship");
  }

  // ──────────────────────────────────────────────────────────────────────
  // Publish — Screen 4 "Open dashboard" handler
  // Writes: contractors row + chatbot_config row. NO sites row (per §6.0).
  // Fires: /api/email/schedule + /api/notifications. Then redirects to /dashboard.
  // 14-day trial = trial_ends_at = now()+14d (no Stripe customer yet — checkout
  // runs later when user upgrades or trial expires).
  // ──────────────────────────────────────────────────────────────────────
  const [publishing, setPublishing] = useState(false);
  const computedSlug = generateSlug(businessName);

  async function handlePublish() {
    setError("");
    setPublishing(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userEmail = authData.user?.email || "";
      if (!authData.user) {
        router.push("/signup");
        return;
      }

      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const cc = crawlPayload?.patch.chatbotConfig ?? {};
      const cp = crawlPayload?.patch.contractors ?? {};

      const cities =
        (cp.service_area_cities && cp.service_area_cities.length > 0)
          ? cp.service_area_cities
          : [city];

      // 1. Insert contractor row.
      const { data: contractor, error: cErr } = await supabase
        .from("contractors")
        .insert({
          user_id: authData.user.id,
          email: userEmail,
          business_name: businessName,
          phone,
          city,
          state,
          slug: computedSlug,
          owner_name: crawlOwnerName ?? null,
          business_type: "residential",
          service_area_cities: cities,
          trial_ends_at: trialEndsAt,
        })
        .select("id, slug")
        .single();

      if (cErr || !contractor) {
        const msg = cErr?.message ?? "Could not create your account.";
        if (msg.toLowerCase().includes("duplicate") && msg.toLowerCase().includes("slug")) {
          setError(`The URL ruufpro.com/chat/${computedSlug} is taken. Try a slightly different business name.`);
        } else if (msg.toLowerCase().includes("duplicate")) {
          // Existing contractor row — bounce to dashboard.
          router.push("/dashboard");
          return;
        } else {
          setError(msg);
        }
        setPublishing(false);
        return;
      }

      // 2. Upsert chatbot_config (only if we have a crawl payload OR manual fields).
      if (crawlPayload) {
        const crawlStateJson = buildCrawlStateJson(
          crawlPayload.crawlState,
          crawlPayload.pagesCrawled.length,
        );
        const { error: cfgErr } = await supabase.from("chatbot_config").upsert({
          contractor_id: contractor.id,
          team_description: cc.team_description ?? null,
          differentiators: cc.differentiators ?? null,
          warranty_description: cc.warranty_description ?? null,
          financing_provider: cc.financing_provider ?? null,
          payment_methods: cc.payment_methods ?? null,
          emergency_available: cc.emergency_available ?? null,
          emergency_description: cc.emergency_description ?? null,
          business_hours: cc.business_hours ?? null,
          service_area_cities: cc.service_area_cities ?? null,
          custom_faqs: cc.custom_faqs ?? null,
          materials_brands: cc.materials_brands ?? null,
          offers_free_inspection: cc.offers_free_inspection ?? null,
          does_insurance_work: cc.does_insurance_work ?? null,
          insurance_description: cc.insurance_description ?? null,
          process_steps: cc.process_steps ?? null,
          source_website_url: cc.source_website_url ?? crawlUrl ?? null,
          last_crawled_at: crawlPayload.pagesCrawled.length > 0 ? new Date().toISOString() : null,
          crawl_state: crawlStateJson,
        });
        if (cfgErr) {
          // Non-fatal — Riley still works, roofer can re-crawl from RileyTab.
          console.warn("chatbot_config upsert failed:", cfgErr);
        }
      }

      // 3. Schedule onboarding emails (fire-and-forget).
      fetch("/api/email/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId: contractor.id }),
      }).catch(() => {});

      // 4. Slack notify.
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "signup",
          data: { businessName, city, state, slug: contractor.slug },
        }),
      }).catch(() => {});

      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Try again.");
      setPublishing(false);
    }
  }

  function handleCrawlSkip() {
    // Skip crawl → manual-fill mode in CrawlReview with empty payload.
    setCrawlPayload(emptyCrawlPayload());
    setCrawlOwnerName(null);
    setCrawlError("");
    setScreen("sound_check");
  }

  if (!authReady || !userId) {
    return (
      <main className="neu-dashboard min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--neu-text-muted)", fontSize: 14 }}>Loading…</p>
      </main>
    );
  }

  // Sound check uses a wider surface — render with its own wrapper.
  if (screen === "sound_check" && crawlPayload) {
    const isManual = crawlPayload.pagesCrawled.length === 0;
    return (
      <main className="neu-dashboard min-h-screen px-4 py-10">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <ProgressDots current={screen} />
          <CrawlReview
            payload={crawlPayload}
            manualMode={isManual}
            onSave={handleCrawlReviewSave}
            onSkip={isManual ? undefined : handleCrawlSkip}
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

        {screen === "ship" && (
          <ShipScreen
            slug={computedSlug}
            error={error}
            publishing={publishing}
            onPublish={handlePublish}
            onBack={() => setScreen("sound_check")}
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

// ──────────────────────────────────────────────────────────────────────
// Screen 4 — Ship (embed snippet + standalone link + Open dashboard)
// ──────────────────────────────────────────────────────────────────────

function ShipScreen({
  slug,
  error,
  publishing,
  onPublish,
  onBack,
}: {
  slug: string;
  error: string;
  publishing: boolean;
  onPublish: () => void;
  onBack: () => void;
}) {
  const standaloneUrl = `https://ruufpro.com/chat/${slug}`;
  const embedSnippet =
    `<!-- Riley — paste before </body> on every page -->\n` +
    `<script src="https://ruufpro.com/riley.js" data-slug="${slug}" async></script>`;

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
          Riley&apos;s ready.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--neu-text-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Two ways to put Riley to work right now.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <CopyCard
        title="Add Riley to your website"
        subtitle="Paste this once. Riley appears on every page."
        copyValue={embedSnippet}
        display={embedSnippet}
        mono
      />

      <CopyCard
        title="Or share your Riley link"
        subtitle="Use it on Facebook, Google Business, your phone's auto-reply — anywhere."
        copyValue={standaloneUrl}
        display={standaloneUrl}
        externalHref={standaloneUrl}
        externalLabel="Test Riley →"
      />

      <div style={{ marginTop: 24 }}>
        <SleekCta
          label={publishing ? "Opening dashboard…" : "Open dashboard"}
          onClick={publishing ? () => {} : onPublish}
        />
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--neu-text-dim)",
            margin: "10px 0 0 0",
            letterSpacing: "0.01em",
          }}
        >
          Your 14-day trial starts now. No credit card required.
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={publishing}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "8px 0",
          fontSize: 13,
          color: "var(--neu-text-muted)",
          background: "transparent",
          border: "none",
          cursor: publishing ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: publishing ? 0.5 : 1,
        }}
      >
        ← Back to Sound check
      </button>
    </>
  );
}

function CopyCard({
  title,
  subtitle,
  copyValue,
  display,
  mono,
  externalHref,
  externalLabel,
}: {
  title: string;
  subtitle: string;
  copyValue: string;
  display: string;
  mono?: boolean;
  externalHref?: string;
  externalLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(copyValue).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  return (
    <div className="neu-raised" style={{ padding: 22, marginBottom: 14 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--neu-text)",
          margin: 0,
          marginBottom: 4,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 12,
          color: "var(--neu-text-muted)",
          margin: "0 0 12px 0",
        }}
      >
        {subtitle}
      </p>
      <div
        style={{
          padding: "12px 14px",
          background: "var(--neu-bg)",
          border: "1px solid var(--neu-border)",
          borderRadius: 10,
          boxShadow:
            "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
          fontSize: mono ? 12 : 13,
          fontFamily: mono ? "ui-monospace, 'JetBrains Mono', monospace" : "inherit",
          color: "var(--neu-text)",
          wordBreak: "break-all",
          whiteSpace: mono ? "pre-wrap" : "normal",
          lineHeight: 1.5,
        }}
      >
        {display}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          type="button"
          onClick={copy}
          style={{
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: copied ? "#fff" : "var(--neu-text)",
            background: copied ? "var(--neu-accent)" : "transparent",
            border: `1px solid ${copied ? "var(--neu-accent)" : "var(--neu-border)"}`,
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s ease",
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--neu-text-muted)",
              border: "1px solid var(--neu-border)",
              borderRadius: 8,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            {externalLabel ?? "Open →"}
          </a>
        )}
      </div>
    </div>
  );
}
