"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPipelineCandidates } from "@/lib/property-pipeline/queries";
import type { PipelineCandidate } from "@/lib/property-pipeline/types";
import {
  Loader2,
  MapPin,
  Plus,
  Ban,
  Pause,
  X as XIcon,
  ArrowUpRight,
  Calendar,
  Wind,
  Mailbox,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Variant = "A" | "B" | "C" | "D" | "E" | "F" | "G";
const VARIANT_ORDER: Variant[] = ["A", "B", "C", "D", "E", "F", "G"];
const VARIANT_LABELS: Record<Variant, string> = {
  A: "Press Bulletin",
  B: "Tool Catalog",
  C: "Material Catalog",
  D: "Forensic Specimen",
  E: "Italian Editorial",
  F: "Blueprint",
  G: "Trade Card",
};
const VARIANTS_WITH_BACK: ReadonlySet<Variant> = new Set<Variant>(["A", "B"]);
import { StatCard, StatCardGrid } from "@/components/dashboard/stat-cards";
import { getCountyStormStats } from "@/lib/property-pipeline/storm-stats";

const QUEUE_FETCH = 12; // hero + 5 up next + buffer

type Usage = {
  used: number;
  bundled: number;
  remaining: number;
  is_overage: boolean;
  next_card_cost_cents: number;
};

type Prefs = { auto_approve: boolean; daily_cap: number };

type Suppression = {
  id: string;
  address: string | null;
  source: string;
  reason: string | null;
  suppressed_at: string;
};

const CURRENT_YEAR = new Date().getFullYear();

export function PropertyPipelineTab() {
  const [rows, setRows] = useState<PipelineCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [requestInput, setRequestInput] = useState("");
  const [blockInput, setBlockInput] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant>("A");
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");

  // ---- Initial loads -------------------------------------------------------

  useEffect(() => {
    refetchQueue();
    refetchUsage();
    refetchPrefs();
    refetchSuppressions();
  }, []);

  async function refetchQueue() {
    setLoading(true);
    setError(null);
    try {
      const { rows: r, total: t } = await fetchPipelineCandidates(supabase, {
        limit: QUEUE_FETCH,
      });
      setRows(r);
      setTotal(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  async function refetchUsage() {
    const r = await fetch("/api/pipeline/usage").catch(() => null);
    if (r?.ok) setUsage(await r.json());
  }

  async function refetchPrefs() {
    const r = await fetch("/api/pipeline/preferences").catch(() => null);
    if (r?.ok) setPrefs(await r.json());
  }

  async function refetchSuppressions() {
    const r = await fetch("/api/pipeline/suppressions").catch(() => null);
    if (r?.ok) {
      const json = await r.json();
      setSuppressions(json.suppressions ?? []);
    }
  }

  // ---- Derived -------------------------------------------------------------

  const visibleRows = useMemo(
    () => rows.filter((r) => !skipped.has(r.id)),
    [rows, skipped]
  );
  const hero = visibleRows[0];
  const upNext = visibleRows.slice(1, 6);

  // ---- Actions -------------------------------------------------------------

  async function approve() {
    if (!hero) return;
    setSending(true);
    try {
      const r = await fetch("/api/pipeline/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: hero.id, variant: selectedVariant }),
      });
      const json = await r.json();
      if (r.ok && json.success) {
        flash(
          json.bundle?.is_overage
            ? `Sent. Overage $${(json.cost_cents / 100).toFixed(2)} at our cost.`
            : `Sent. ${json.bundle?.remaining ?? 0} of ${json.bundle?.bundled ?? 0} left this month.`
        );
        if (json.bundle) {
          setUsage({
            used: json.bundle.used,
            bundled: json.bundle.bundled,
            remaining: json.bundle.remaining,
            is_overage: json.bundle.is_overage,
            next_card_cost_cents: json.bundle.is_overage ? json.cost_cents : 0,
          });
        }
        // Pop the hero locally; refetch in background.
        setSkipped((prev) => new Set(prev).add(hero.id));
        refetchQueue();
      } else {
        flash(json.error ?? json.warning ?? "Send failed");
      }
    } catch {
      flash("Network error — try again");
    } finally {
      setSending(false);
    }
  }

  function skip() {
    if (!hero) return;
    setSkipped((prev) => new Set(prev).add(hero.id));
  }

  async function toggleAutoApprove() {
    if (!prefs) return;
    const next = !prefs.auto_approve;
    setPrefs({ ...prefs, auto_approve: next }); // optimistic
    const r = await fetch("/api/pipeline/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_approve: next }),
    });
    if (!r.ok) {
      setPrefs({ ...prefs, auto_approve: !next }); // rollback
      flash("Couldn't save — try again");
    }
  }

  async function requestAddress() {
    if (!requestInput.trim()) return;
    setRequestBusy(true);
    try {
      const r = await fetch("/api/pipeline/request-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: requestInput }),
      });
      const json = await r.json();
      if (r.ok) {
        flash(json.message ?? "Queued.");
        setRequestInput("");
        refetchQueue();
      } else {
        flash(json.error ?? "Couldn't queue that address.");
      }
    } finally {
      setRequestBusy(false);
    }
  }

  async function blockAddress() {
    if (!blockInput.trim()) return;
    setBlockBusy(true);
    try {
      const r = await fetch("/api/pipeline/suppressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: blockInput }),
      });
      const json = await r.json();
      if (r.ok) {
        setSuppressions((prev) => [json.suppression, ...prev]);
        setBlockInput("");
        flash("Address blocked.");
      } else {
        flash(json.error ?? "Couldn't block that address.");
      }
    } finally {
      setBlockBusy(false);
    }
  }

  async function unblock(id: string) {
    const prev = suppressions;
    setSuppressions((p) => p.filter((s) => s.id !== id)); // optimistic
    const r = await fetch(`/api/pipeline/suppressions?id=${id}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      setSuppressions(prev);
      flash("Couldn't unblock — try again");
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  }

  // ---- Render --------------------------------------------------------------

  if (loading && rows.length === 0) return <LoadingState />;
  if (!loading && total === 0) return <EmptyState />;

  return (
    <div className="max-w-[1200px] mx-auto space-y-7">
      <Heading />

      {prefs?.auto_approve ? (
        <AutoBar usage={usage} onPause={toggleAutoApprove} />
      ) : (
        <ModeBar
          waiting={Math.max(0, total - skipped.size)}
          usage={usage}
          autoApprove={prefs?.auto_approve ?? false}
          onToggle={toggleAutoApprove}
        />
      )}

      {hero ? (
        <HeroCard
          candidate={hero}
          sending={sending}
          onApprove={approve}
          onSkip={skip}
          variant={selectedVariant}
          onVariantChange={(v) => {
            setSelectedVariant(v);
            if (!VARIANTS_WITH_BACK.has(v)) setPreviewSide("front");
          }}
          previewSide={previewSide}
          onSideChange={setPreviewSide}
        />
      ) : (
        <div className="neu-flat p-10 text-center" style={{ borderRadius: 18 }}>
          <p className="text-sm neu-muted">
            Queue is empty for now. New homes appear as the data refreshes.
          </p>
        </div>
      )}

      {upNext.length > 0 && <UpNext rows={upNext} total={total} />}

      <SectionDivider label="This Month" />

      <StatsStrip
        usage={usage}
        dailyCap={prefs?.daily_cap ?? 5}
        inQueue={Math.max(0, total - skipped.size)}
      />

      <SectionDivider label="Address Controls" />

      <Controls
        requestInput={requestInput}
        setRequestInput={setRequestInput}
        onRequest={requestAddress}
        requestBusy={requestBusy}
        blockInput={blockInput}
        setBlockInput={setBlockInput}
        onBlock={blockAddress}
        blockBusy={blockBusy}
        suppressions={suppressions}
        onUnblock={unblock}
      />

      <Legal />

      {error && (
        <div
          className="neu-flat p-4 text-sm"
          style={{ borderRadius: 14, color: "#b91c1c" }}
        >
          {error}
        </div>
      )}

      {toast && <Toast text={toast} />}
    </div>
  );
}

// ============================================================================
// Sections
// ============================================================================

function Heading() {
  return (
    <div className="relative">
      <span
        className="neu-glow-orange"
        style={{ width: 420, height: 220, top: -70, left: -100 }}
        aria-hidden
      />
      <div className="neu-eyebrow mb-3 relative z-[1]">
        Property Pipeline · Manatee County
      </div>
      <h1
        className="font-bold mb-2 relative z-[1]"
        style={{
          color: "var(--neu-text)",
          fontSize: 44,
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
        }}
      >
        Your <em className="neu-em">approval queue</em>.
      </h1>
      <p
        className="text-[15px] leading-relaxed relative z-[1] max-w-[560px]"
        style={{ color: "var(--neu-text-muted)" }}
      >
        One postcard at a time. Each send carries your license — give it a
        glance, then send. Or flip on auto-approve once the targeting feels
        right.
      </p>
    </div>
  );
}

function ModeBar({
  waiting,
  usage,
  autoApprove,
  onToggle,
}: {
  waiting: number;
  usage: Usage | null;
  autoApprove: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="neu-flat flex items-center justify-between gap-4"
      style={{ padding: "14px 18px", borderRadius: 14 }}
    >
      <div className="flex items-center gap-3">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--neu-accent)",
            boxShadow: "0 0 0 4px rgba(249,115,22,0.18)",
          }}
        />
        <span className="text-[13.5px] font-semibold">Manual approval</span>
        <span
          className="text-[12.5px] tabular-nums"
          style={{
            color: "var(--neu-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          · {waiting} waiting{" "}
          {usage && (
            <>
              · {usage.used} / {usage.bundled} this month
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--neu-text-muted)" }}
        >
          Auto-approve
        </span>
        <Switch on={autoApprove} onChange={onToggle} />
      </div>
    </div>
  );
}

function AutoBar({
  usage,
  onPause,
}: {
  usage: Usage | null;
  onPause: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4"
      style={{
        padding: "16px 20px",
        borderRadius: 14,
        background: "var(--neu-ink-2)",
        color: "#faf8f4",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--neu-accent)",
            boxShadow: "0 0 0 4px rgba(249,115,22,0.25)",
          }}
        />
        <div>
          <div className="font-bold text-[14px]">Auto-approve is on</div>
          {usage && (
            <div
              className="text-[12px] mt-0.5"
              style={{ color: "rgba(250,248,244,0.7)", fontFamily: "var(--font-mono)" }}
            >
              {usage.used} / {usage.bundled} sent this month
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onPause}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold rounded-full px-3.5 py-2"
        style={{
          background: "rgba(250,248,244,0.08)",
          color: "#faf8f4",
          border: "1px solid rgba(250,248,244,0.12)",
        }}
      >
        <Pause className="h-3 w-3" /> Pause
      </button>
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={on}
      style={{
        position: "relative",
        width: 46,
        height: 26,
        background: "var(--neu-bg)",
        borderRadius: 999,
        boxShadow:
          "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
        cursor: "pointer",
        border: "none",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: on ? "var(--neu-accent)" : "var(--neu-bg)",
          boxShadow:
            "2px 2px 4px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)",
          transform: on ? "translateX(20px)" : "translateX(0)",
          transition: "transform .2s, background .2s",
        }}
      />
    </button>
  );
}

function HeroCard({
  candidate,
  sending,
  onApprove,
  onSkip,
  variant,
  onVariantChange,
  previewSide,
  onSideChange,
}: {
  candidate: PipelineCandidate;
  sending: boolean;
  onApprove: () => void;
  onSkip: () => void;
  variant: Variant;
  onVariantChange: (v: Variant) => void;
  previewSide: "front" | "back";
  onSideChange: (s: "front" | "back") => void;
}) {
  // Roof-anchored math, never house-anchored.
  // - Reroof on file → "this roof" = the reroof; storm window starts at permit year.
  // - No permit on file → "this roof" = original install; window starts at year_built.
  // PP universe excludes <=7yr permits, so a present permit is always old enough to matter.
  const lastRoofYear = candidate.last_roof_permit_date
    ? new Date(candidate.last_roof_permit_date).getFullYear()
    : candidate.year_built;
  const roofAge = CURRENT_YEAR - lastRoofYear;
  const isRequested = !!candidate.requested_at;
  const storm = getCountyStormStats("manatee", lastRoofYear);
  const roofAgeSub = candidate.last_roof_permit_date
    ? `last reroof ${lastRoofYear}`
    : `built ${candidate.year_built} · no reroof on file`;

  return (
    <div className="neu-flat" style={{ padding: 28, borderRadius: 18 }}>
      <div className="grid gap-7" style={{ gridTemplateColumns: "1.05fr 1fr" }}>
        {/* Left column */}
        <div className="flex flex-col gap-[18px]">
          <div>
            <div
              className="text-[11px] mb-1.5 uppercase tracking-[0.16em]"
              style={{
                color: "var(--neu-text-dim)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {isRequested ? "You requested · jumping the line" : "Next in queue"}
            </div>
            <div
              className="font-bold"
              style={{
                fontFamily: "var(--font-display, var(--font-sans))",
                fontSize: 26,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {candidate.address_raw}
            </div>
            <div
              className="text-[13.5px] mt-1"
              style={{ color: "var(--neu-text-muted)" }}
            >
              {candidate.city}, FL {candidate.zip} ·{" "}
              {candidate.last_roof_permit_date
                ? `last permit ${new Date(candidate.last_roof_permit_date).getFullYear()}`
                : "no permit on file"}
            </div>
          </div>

          {/* Six facts — DB stats + NOAA/FEMA county-level, scoped to this roof's life */}
          <div className="grid grid-cols-3 gap-2.5">
            <Fact
              label="Roof Age"
              value={`${roofAge}`}
              unit="yrs"
              sub={roofAgeSub}
            />
            <Fact
              label="Major Hurricanes"
              value={storm ? `${storm.majorHurricanesSinceBuild}` : "—"}
              sub={storm ? `Cat 3+ within 100 mi · since this roof` : "since this roof"}
            />
            <Fact
              label="Closest Approach"
              value={storm?.closestMajorSinceBuild ? `${Math.round(storm.closestMajorSinceBuild.milesAtClosest)}` : "—"}
              unit="mi"
              sub={
                storm?.closestMajorSinceBuild
                  ? `${storm.closestMajorSinceBuild.name}, ${storm.closestMajorSinceBuild.year}`
                  : "no record"
              }
            />
            <Fact
              label="Last Sale"
              value={candidate.last_sale_year ? `${candidate.last_sale_year}` : "—"}
              sub={
                candidate.last_sale_year
                  ? `${CURRENT_YEAR - candidate.last_sale_year} yrs ago`
                  : "no record"
              }
            />
            <Fact
              label="Assessed"
              value={candidate.assessed_value ? `$${Math.round(candidate.assessed_value / 1000)}k` : "—"}
              sub="county record"
            />
            <Fact
              label="FEMA Declarations"
              value={storm ? `${storm.federalDisastersSinceBuild}` : "—"}
              sub={storm ? "hurricane disasters · since this roof" : "since this roof"}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={onApprove}
              disabled={sending}
              className="neu-dark-cta flex-1 inline-flex items-center justify-center gap-2.5 text-[14px] font-bold disabled:opacity-60"
              style={{ padding: "14px 22px", borderRadius: 14 }}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Approve &amp; Send{" "}
                  <ArrowUpRight
                    className="h-4 w-4"
                    style={{ color: "var(--neu-accent)" }}
                  />
                </>
              )}
            </button>
            <button
              onClick={onSkip}
              disabled={sending}
              className="neu-flat text-[14px] font-bold"
              style={{
                padding: "14px 22px",
                borderRadius: 14,
                color: "var(--neu-text-muted)",
              }}
            >
              Skip
            </button>
          </div>

          <div
            className="text-[11px] pt-2.5 mt-1"
            style={{
              color: "var(--neu-text-dim)",
              fontFamily: "var(--font-mono)",
              borderTop: "1px dashed var(--neu-border)",
            }}
          >
            Mailing under your FL roofing license · postage at Lob cost · Variant {variant} — {VARIANT_LABELS[variant]}
          </div>
        </div>

        {/* Right column — postcard preview */}
        <PostcardPreview
          candidate={candidate}
          variant={variant}
          onVariantChange={onVariantChange}
          previewSide={previewSide}
          onSideChange={onSideChange}
        />
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <div
      className="neu-pressed"
      style={{ padding: "14px 12px", borderRadius: 12 }}
    >
      <div
        className="mb-2 uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.16em",
          color: "var(--neu-text-dim)",
          fontFamily: "var(--font-mono)",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
      <div
        className="font-extrabold tabular-nums"
        style={{
          fontFamily: "var(--font-display, var(--font-sans))",
          fontSize: 24,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--neu-text)",
        }}
      >
        {value}
        {unit && (
          <span
            className="ml-1 font-semibold"
            style={{ fontSize: 13, color: "var(--neu-text-muted)", letterSpacing: 0 }}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        className="mt-1"
        style={{ fontSize: 11, color: "var(--neu-text-muted)" }}
      >
        {sub}
      </div>
    </div>
  );
}

function PostcardPreview({
  candidate,
  variant,
  onVariantChange,
  previewSide,
  onSideChange,
}: {
  candidate: PipelineCandidate;
  variant: Variant;
  onVariantChange: (v: Variant) => void;
  previewSide: "front" | "back";
  onSideChange: (s: "front" | "back") => void;
}) {
  const idx = VARIANT_ORDER.indexOf(variant);
  const total = VARIANT_ORDER.length;
  const hasBack = VARIANTS_WITH_BACK.has(variant);
  const effectiveSide = hasBack ? previewSide : "front";

  function step(dir: -1 | 1) {
    const next = VARIANT_ORDER[(idx + dir + total) % total];
    onVariantChange(next);
  }

  const previewSrc = `/api/pipeline/postcard-preview?candidateId=${encodeURIComponent(
    candidate.id
  )}&variant=${variant}&side=${effectiveSide}`;

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: "var(--neu-bg-2)",
        boxShadow:
          "inset 3px 3px 8px var(--neu-inset-dark), inset -3px -3px 8px var(--neu-inset-light)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Variant carousel header */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous variant"
          className="inline-flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--neu-bg)",
            boxShadow:
              "2px 2px 4px var(--neu-shadow-dark), -2px -2px 4px var(--neu-shadow-light)",
            border: "none",
            cursor: "pointer",
            color: "var(--neu-text)",
          }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div
          className="flex flex-col items-center text-center"
          style={{ flex: 1, minWidth: 0 }}
        >
          <div
            className="uppercase tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              letterSpacing: "0.18em",
              color: "var(--neu-text-dim)",
            }}
          >
            Variant {variant} · {idx + 1} of {total}
          </div>
          <div
            className="font-bold"
            style={{
              fontFamily: "var(--font-display, var(--font-sans))",
              fontSize: 14,
              letterSpacing: "-0.01em",
              color: "var(--neu-text)",
              lineHeight: 1.1,
              marginTop: 2,
            }}
          >
            {VARIANT_LABELS[variant]}
          </div>
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next variant"
          className="inline-flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--neu-bg)",
            boxShadow:
              "2px 2px 4px var(--neu-shadow-dark), -2px -2px 4px var(--neu-shadow-light)",
            border: "none",
            cursor: "pointer",
            color: "var(--neu-text)",
          }}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Front / Back pills */}
      <div className="flex gap-1.5">
        <SidePill
          label="Front"
          active={effectiveSide === "front"}
          onClick={() => onSideChange("front")}
        />
        <SidePill
          label={hasBack ? "Back" : "Back · pending"}
          active={effectiveSide === "back"}
          disabled={!hasBack}
          onClick={() => hasBack && onSideChange("back")}
        />
      </div>

      {/* Iframe — Lob HTML at 1125×625, scaled into the container width */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1125 / 625",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "4px 4px 12px rgba(0,0,0,0.18)",
          border: "1px solid var(--neu-border)",
        }}
      >
        <iframe
          key={previewSrc}
          src={previewSrc}
          title={`Postcard ${variant} ${effectiveSide}`}
          style={{
            width: 1125,
            height: 625,
            border: "none",
            transformOrigin: "0 0",
            transform: "scale(0.34)",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          ref={(el) => {
            if (!el) return;
            const parent = el.parentElement;
            if (!parent) return;
            const setScale = () => {
              const w = parent.clientWidth;
              el.style.transform = `scale(${w / 1125})`;
            };
            setScale();
            const ro = new ResizeObserver(setScale);
            ro.observe(parent);
          }}
        />
      </div>

      {!hasBack && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--neu-text-dim)",
            lineHeight: 1.4,
          }}
        >
          Back design pending for variant {variant}. Front works; back is locked
          for A and B.
        </div>
      )}
    </div>
  );
}

function SidePill({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="uppercase"
      style={{
        fontSize: 10,
        letterSpacing: "0.12em",
        padding: "6px 12px",
        borderRadius: 999,
        background: active ? "var(--neu-ink-2)" : "transparent",
        color: active
          ? "#faf8f4"
          : disabled
            ? "var(--neu-text-dim)"
            : "var(--neu-text-muted)",
        border: active ? "1px solid var(--neu-ink-2)" : "1px solid var(--neu-border)",
        fontFamily: "var(--font-mono)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}

function UpNext({
  rows,
  total,
}: {
  rows: PipelineCandidate[];
  total: number;
}) {
  return (
    <div className="neu-flat" style={{ padding: "18px 20px", borderRadius: 18 }}>
      <div className="flex justify-between items-baseline mb-3.5">
        <div
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.18em",
            color: "var(--neu-text-dim)",
          }}
        >
          Up Next
        </div>
        <div
          className="tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--neu-text-muted)",
          }}
        >
          <strong style={{ color: "var(--neu-accent)", fontWeight: 700 }}>
            {rows.length}
          </strong>{" "}
          waiting · {total.toLocaleString()} in your service area
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {rows.map((r, i) => (
          <div
            key={r.id}
            style={{
              padding: "12px 12px 14px",
              borderRadius: 12,
              background: "var(--neu-bg)",
              border: "1px solid var(--neu-border)",
              boxShadow:
                "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                color: "var(--neu-text-dim)",
                letterSpacing: "0.16em",
                marginBottom: 6,
              }}
            >
              #{String(i + 2).padStart(3, "0")}
            </div>
            <div
              className="font-bold"
              style={{
                fontFamily: "var(--font-display, var(--font-sans))",
                fontSize: 13,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              {r.address_raw}
            </div>
            <div
              className="tabular-nums"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--neu-text-muted)",
                marginTop: 4,
              }}
            >
              {r.zip} · {CURRENT_YEAR - r.year_built} yrs
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsStrip({
  usage,
  dailyCap,
  inQueue,
}: {
  usage: Usage | null;
  dailyCap: number;
  inQueue: number;
}) {
  return (
    <StatCardGrid>
      <StatCard
        label="Daily Cap"
        value={String(dailyCap)}
        subtitle="per day"
        icon={Calendar}
      />
      <StatCard
        label="Bundle Used"
        value={usage ? `${usage.used}/${usage.bundled}` : "—"}
        subtitle={
          usage?.is_overage
            ? "overage at Lob cost + $0.10"
            : usage
              ? `${usage.remaining} left this month`
              : "loading…"
        }
        icon={Mailbox}
      />
      <StatCard
        label="In Queue"
        value={String(inQueue)}
        subtitle="waiting for approval"
        icon={Inbox}
      />
      <StatCard
        label="QR Scans"
        value="—"
        subtitle="tracking soon"
        icon={Wind}
      />
    </StatCardGrid>
  );
}

function Controls({
  requestInput,
  setRequestInput,
  onRequest,
  requestBusy,
  blockInput,
  setBlockInput,
  onBlock,
  blockBusy,
  suppressions,
  onUnblock,
}: {
  requestInput: string;
  setRequestInput: (v: string) => void;
  onRequest: () => void;
  requestBusy: boolean;
  blockInput: string;
  setBlockInput: (v: string) => void;
  onBlock: () => void;
  blockBusy: boolean;
  suppressions: Suppression[];
  onUnblock: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ControlCard
        icon={<Plus className="h-4 w-4" style={{ color: "var(--neu-accent)" }} />}
        title="Request an address"
        sub="A homeowner asked you to look at their roof? Drop the address — we'll bump it to the front of your queue."
        placeholder="123 Main St, Bradenton FL 34205"
        value={requestInput}
        onChange={setRequestInput}
        onSubmit={onRequest}
        busy={requestBusy}
        cta="Queue it"
        hint="Manatee County only · jumps to position #2"
      />
      <ControlCard
        icon={<Ban className="h-4 w-4" style={{ color: "var(--neu-text)" }} />}
        title="Block an address"
        sub="Already worked with them? On a do-not-mail list? Add them and we'll never queue or send to that address."
        placeholder="456 Oak Dr, Bradenton FL 34203"
        value={blockInput}
        onChange={setBlockInput}
        onSubmit={onBlock}
        busy={blockBusy}
        cta="Block"
        hint="Permanent · paste multiple, one per line"
        footer={
          <BlockedList suppressions={suppressions} onUnblock={onUnblock} />
        }
      />
    </div>
  );
}

function ControlCard({
  icon,
  title,
  sub,
  placeholder,
  value,
  onChange,
  onSubmit,
  busy,
  cta,
  hint,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  cta: string;
  hint: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="neu-flat" style={{ padding: 22, borderRadius: 18 }}>
      <div className="flex items-center gap-2.5 mb-1">
        <span
          className="inline-flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--neu-bg)",
            boxShadow:
              "inset 2px 2px 4px var(--neu-inset-dark), inset -2px -2px 4px var(--neu-inset-light)",
          }}
        >
          {icon}
        </span>
        <div
          className="font-bold"
          style={{
            fontFamily: "var(--font-display, var(--font-sans))",
            fontSize: 18,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
      </div>
      <div
        className="mt-0.5 mb-4"
        style={{ fontSize: 12.5, color: "var(--neu-text-muted)", lineHeight: 1.45 }}
      >
        {sub}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) onSubmit();
          }}
          placeholder={placeholder}
          className="flex-1"
          style={{
            background: "var(--neu-bg)",
            border: "1px solid var(--neu-border)",
            borderRadius: 12,
            boxShadow:
              "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
            padding: "12px 14px",
            fontSize: 14,
            color: "var(--neu-text)",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          onClick={onSubmit}
          disabled={busy || !value.trim()}
          className="font-bold disabled:opacity-60"
          style={{
            background: "var(--neu-ink-2)",
            color: "#faf8f4",
            borderRadius: 12,
            padding: "0 18px",
            fontSize: 13,
            border: "none",
            cursor: busy ? "wait" : "pointer",
            boxShadow:
              "3px 3px 6px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)",
            whiteSpace: "nowrap",
          }}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : cta}
        </button>
      </div>
      <div
        className="mt-2.5 uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.08em",
          color: "var(--neu-text-dim)",
        }}
      >
        {hint}
      </div>
      {footer}
    </div>
  );
}

function BlockedList({
  suppressions,
  onUnblock,
}: {
  suppressions: Suppression[];
  onUnblock: (id: string) => void;
}) {
  if (suppressions.length === 0) return null;
  return (
    <div
      className="mt-4 pt-4"
      style={{ borderTop: "1px dashed var(--neu-border)" }}
    >
      <div className="flex justify-between items-baseline mb-2.5">
        <div
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--neu-text-dim)",
          }}
        >
          Currently Blocked
        </div>
        <div
          className="tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--neu-text-muted)",
          }}
        >
          {suppressions.length} address{suppressions.length === 1 ? "" : "es"}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suppressions.slice(0, 12).map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-2"
            style={{
              padding: "7px 6px 7px 12px",
              borderRadius: 999,
              background: "var(--neu-bg)",
              border: "1px solid var(--neu-border)",
              boxShadow:
                "2px 2px 4px var(--neu-shadow-dark), -2px -2px 4px var(--neu-shadow-light)",
              fontSize: 12.5,
            }}
          >
            <span style={{ color: "var(--neu-text)" }}>
              {s.address ?? "Address blocked"}
            </span>
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                color: "var(--neu-text-dim)",
                letterSpacing: "0.12em",
              }}
            >
              {s.source === "postcard_qr"
                ? "opted out"
                : s.source === "manual"
                  ? "manual"
                  : s.source}
            </span>
            {s.source === "manual" && (
              <button
                onClick={() => onUnblock(s.id)}
                aria-label="Unblock"
                className="inline-flex items-center justify-center"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: "var(--neu-bg)",
                  boxShadow:
                    "inset 1px 1px 2px var(--neu-inset-dark), inset -1px -1px 2px var(--neu-inset-light)",
                  color: "var(--neu-text-muted)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3.5 mt-3">
      <span
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.18em",
          color: "var(--neu-text-dim)",
        }}
      >
        {label}
      </span>
      <span
        className="flex-1"
        style={{ height: 1, background: "var(--neu-border)" }}
      />
    </div>
  );
}

function Legal() {
  return (
    <div
      className="flex gap-2.5 items-start"
      style={{
        padding: "16px 18px",
        borderRadius: 14,
        background: "rgba(249, 115, 22, 0.06)",
        border: "1px solid rgba(249, 115, 22, 0.15)",
        fontSize: 12.5,
        color: "var(--neu-text-muted)",
        lineHeight: 1.45,
      }}
    >
      <span
        style={{
          color: "var(--neu-accent)",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
        }}
      >
        §
      </span>
      <div>
        <strong style={{ color: "var(--neu-text)", fontWeight: 600 }}>
          You are the sender of record.
        </strong>{" "}
        Each postcard ships under your Florida roofing license and the SB 76
        disclosure you signed on opt-in. Manage license, ZIPs, and authorization
        in{" "}
        <a
          href="/dashboard/settings?tab=service-area"
          style={{ color: "var(--neu-text)", textDecoration: "underline" }}
        >
          Settings → Service Area
        </a>
        .
      </div>
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 neu-flat px-4 py-3 text-sm font-medium max-w-sm"
      style={{
        background: "var(--neu-bg)",
        color: "var(--neu-text)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        borderRadius: 12,
      }}
    >
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2
        className="h-6 w-6 animate-spin"
        style={{ color: "var(--neu-accent)" }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto">
      <Heading />
      <div
        className="neu-flat p-10 text-center mt-6"
        style={{ borderRadius: 18 }}
      >
        <MapPin
          className="h-10 w-10 mx-auto mb-4 opacity-40"
          style={{ color: "var(--neu-accent)" }}
        />
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: "var(--neu-text)" }}
        >
          Pick your service area to see in-market homes
        </h2>
        <p className="neu-muted text-sm mb-6 max-w-md mx-auto">
          Add the ZIP codes you serve in{" "}
          <strong>Settings → Service Area</strong>. We'll show you every
          in-market home in those ZIPs.
        </p>
        <a
          href="/dashboard/settings?tab=service-area"
          className="neu-flat inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ color: "var(--neu-accent)" }}
        >
          <MapPin className="h-4 w-4" />
          Set service area
        </a>
      </div>
    </div>
  );
}
