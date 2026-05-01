"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchPipelineCandidates,
  fetchZipAggregates,
} from "@/lib/property-pipeline/queries";
import type {
  PipelineCandidate,
  ZipAggregate,
} from "@/lib/property-pipeline/types";
import { Send, Home, Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;
const CURRENT_YEAR = new Date().getFullYear();
const OLD_PERMIT_YEARS = 7;
const RECENT_SALE_YEARS = 2;

interface StormByCounty {
  [county: string]: {
    valid_at: string;
    typecode: string;
    magnitude: number | null;
    city: string | null;
    count: number;
  };
}

interface SignalTag {
  code: "OLD_PERMIT" | "RECENT_SALE";
  emoji: string;
  label: string;
  date: string | null;
  hot: boolean;        // true = high-intent; styled prominently
}

// Storm chip is intentionally NOT a row-level tag — it's county-wide and
// identical across all rows in that county, which clutters the table and
// hijacks the sort. Storm context lives in the county banner above the table.
function computeTags(c: PipelineCandidate): SignalTag[] {
  const out: SignalTag[] = [];
  const now = Date.now();

  if (!c.last_roof_permit_date) {
    out.push({
      code: "OLD_PERMIT",
      emoji: "🔨",
      label: "No permit on file",
      date: null,
      hot: true,
    });
  } else {
    const yrs =
      (now - new Date(c.last_roof_permit_date).getTime()) /
      (365.25 * 86_400_000);
    if (yrs >= OLD_PERMIT_YEARS) {
      out.push({
        code: "OLD_PERMIT",
        emoji: "🔨",
        label: `Permit ${c.last_roof_permit_date.slice(0, 4)}`,
        date: c.last_roof_permit_date,
        hot: true,
      });
    }
  }

  if (c.last_sale_year) {
    const ageYears = CURRENT_YEAR - c.last_sale_year;
    if (ageYears <= RECENT_SALE_YEARS) {
      // 🏠 = high-intent signal: just bought, very likely roof shopping
      out.push({
        code: "RECENT_SALE",
        emoji: "🏠",
        label: `Sold ${c.last_sale_year}`,
        date: `${c.last_sale_year}-01-01T00:00:00Z`,
        hot: true,
      });
    } else {
      // Older sale = data point, not a signal. Faint, no emoji, no sort weight.
      out.push({
        code: "RECENT_SALE",
        emoji: "",
        label: `Sold ${c.last_sale_year}`,
        date: null,
        hot: false,
      });
    }
  }

  return out;
}

function daysAgoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

function latestSignalDate(tags: SignalTag[]): string | null {
  // Only HOT tags drive the sort. Faint info-only tags (older sales) shouldn't
  // beat a fresh signal.
  const real = tags.filter((t) => t.hot).map((t) => t.date).filter((d): d is string => !!d);
  if (real.length === 0) return null;
  return real.sort().at(-1) ?? null;
}

export function PropertyPipelineTab() {
  const [rows, setRows] = useState<PipelineCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [zipAggs, setZipAggs] = useState<ZipAggregate[]>([]);
  const [zipFilter, setZipFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<PipelineCandidate | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    used: number;
    bundled: number;
    remaining: number;
    is_overage: boolean;
    next_card_cost_cents: number;
  } | null>(null);
  const [storms, setStorms] = useState<StormByCounty>({});

  useEffect(() => {
    fetch("/api/pipeline/storm-signals")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s?.counties && setStorms(s.counties))
      .catch(() => {
        /* non-fatal — tags just won't show storm */
      });
  }, []);

  useEffect(() => {
    fetch("/api/pipeline/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => u && setUsage(u))
      .catch(() => {
        /* non-fatal */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchPipelineCandidates(supabase, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        zipFilter,
      }),
      page === 0 && !zipFilter
        ? fetchZipAggregates(supabase)
        : Promise.resolve(null),
    ])
      .then(([candidates, aggs]) => {
        if (cancelled) return;
        setRows(candidates.rows);
        setTotal(candidates.total);
        if (aggs) setZipAggs(aggs);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, zipFilter]);

  function setFilter(zip: string | undefined) {
    setZipFilter(zip);
    setPage(0);
  }

  async function confirmSend(candidate: PipelineCandidate) {
    setSendingId(candidate.id);
    try {
      const res = await fetch("/api/pipeline/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setToast(
          json.bundle?.is_overage
            ? `Sent. Overage: $${(json.cost_cents / 100).toFixed(2)} at our cost.`
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
      } else {
        setToast(json.error ?? json.warning ?? "Send failed");
      }
    } catch {
      setToast("Network error — try again");
    } finally {
      setSendingId(null);
      setConfirming(null);
      setTimeout(() => setToast(null), 5000);
    }
  }

  const topZips = useMemo(() => zipAggs.slice(0, 5), [zipAggs]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const enrichedRows = useMemo(() => {
    return rows
      .map((r) => {
        const tags = computeTags(r);
        return { row: r, tags, latest: latestSignalDate(tags) };
      })
      .sort((a, b) => {
        if (a.latest && b.latest) return b.latest.localeCompare(a.latest);
        if (a.latest) return -1;
        if (b.latest) return 1;
        return 0;
      });
  }, [rows]);

  // Storm banner: most recent county-wide event in last 30 days. Shown once
  // above the table — not on every row.
  const stormBanner = useMemo(() => {
    if (Object.keys(storms).length === 0) return null;
    const now = Date.now();
    const cutoff = now - 30 * 86_400_000;
    const fresh = Object.entries(storms)
      .map(([county, s]) => ({ county, ...s }))
      .filter((s) => new Date(s.valid_at).getTime() >= cutoff)
      .sort((a, b) => b.valid_at.localeCompare(a.valid_at));
    return fresh[0] ?? null;
  }, [storms]);

  if (!loading && !error && total === 0 && zipAggs.length === 0 && !zipFilter) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--neu-text)" }}
        >
          Property Pipeline
        </h1>
        <p className="neu-muted text-sm max-w-3xl">
          Homes in your service area with{" "}
          <span className="font-semibold">no recent re-roof permit on file</span>{" "}
          — the ones statistically overdue for a replacement. Highest-signal
          rows show first (no permit on record, newer-build sweet spot).
          Click <span className="font-semibold">Send postcard</span> on any
          row to mail one with a QR code that lands the homeowner on your
          Riley chat.
        </p>
      </header>

      <div className="mb-5">
        <p className="text-xs neu-muted mb-3 tabular-nums">
          {loading ? (
            "Loading..."
          ) : (
            <>
              Showing {rows.length.toLocaleString()} of{" "}
              {total.toLocaleString()}
              {zipFilter && (
                <>
                  {" "}
                  in <span className="font-semibold">{zipFilter}</span>
                </>
              )}
            </>
          )}
        </p>
        {topZips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <ChipButton
              active={!zipFilter}
              onClick={() => setFilter(undefined)}
            >
              All
              <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">
                {zipAggs.reduce((s, a) => s + a.count, 0).toLocaleString()}
              </span>
            </ChipButton>
            {topZips.map((z) => (
              <ChipButton
                key={z.zip}
                active={zipFilter === z.zip}
                onClick={() => setFilter(z.zip)}
              >
                {z.zip}
                <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">
                  {z.count.toLocaleString()}
                </span>
              </ChipButton>
            ))}
          </div>
        )}
      </div>

      {stormBanner && (
        <div
          className="neu-flat mb-4 flex items-center gap-3 px-4 py-3 text-sm"
          style={{ borderRadius: "var(--neu-radius, 16px)", color: "var(--neu-text)" }}
        >
          <span className="text-lg">⛈️</span>
          <span>
            <span className="font-semibold capitalize">{stormBanner.county}</span>{" "}
            <span className="neu-muted">
              had a {stormBanner.typecode.toLowerCase()}
              {stormBanner.magnitude ? ` (${stormBanner.magnitude})` : ""} event{" "}
              {daysAgoLabel(stormBanner.valid_at)}
              {stormBanner.count > 1 ? ` · ${stormBanner.count} reports total in last 90d` : ""}
            </span>
          </span>
        </div>
      )}

      <div
        className="neu-flat overflow-hidden"
        style={{ borderRadius: "var(--neu-radius, 16px)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-[11px] font-semibold uppercase tracking-wider neu-muted"
              style={{ borderBottom: "1px solid var(--neu-border)" }}
            >
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3 w-72">Signals</th>
              <th className="px-4 py-3 w-24">Roof age</th>
              <th className="px-4 py-3 w-20">ZIP</th>
              <th className="px-4 py-3 w-40 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center neu-muted">
                  <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                  Loading homes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center"
                  style={{ color: "#ef4444" }}
                >
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center neu-muted">
                  No homes in this filter.
                </td>
              </tr>
            ) : (
              enrichedRows.map(({ row: r, tags }) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: "1px solid var(--neu-border)" }}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: "var(--neu-text)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Home className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                      <span>{r.address_raw}</span>
                    </div>
                    <div className="text-[11px] neu-muted ml-5 mt-0.5">
                      {r.city}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tags.length === 0 ? (
                        <span className="text-[11px] italic neu-muted">
                          No signal
                        </span>
                      ) : (
                        tags.map((t) =>
                          t.hot ? (
                            <span
                              key={t.code}
                              title={t.label}
                              className="neu-flat inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{ color: "var(--neu-text)" }}
                            >
                              {t.emoji && <span>{t.emoji}</span>}
                              <span>{t.label}</span>
                            </span>
                          ) : (
                            <span
                              key={t.code}
                              className="text-[11px] neu-muted tabular-nums"
                            >
                              {t.label}
                            </span>
                          )
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <div
                      className="font-semibold"
                      style={{ color: "var(--neu-text)" }}
                    >
                      ~{CURRENT_YEAR - r.year_built} yr
                    </div>
                    <div className="text-[11px] neu-muted">
                      Built {r.year_built}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums neu-muted">{r.zip}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirming(r)}
                      disabled={sendingId === r.id}
                      className={cn(
                        "neu-flat inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        sendingId === r.id
                          ? "opacity-60 cursor-wait"
                          : "hover:opacity-90"
                      )}
                      style={{ color: "var(--neu-accent)" }}
                    >
                      {sendingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send postcard
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs neu-muted">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="neu-flat rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="tabular-nums">
            Page {page + 1} of {totalPages.toLocaleString()}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages || loading}
            className="neu-flat rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {confirming && (
        <ConfirmSendDialog
          candidate={confirming}
          sending={sendingId === confirming.id}
          usage={usage}
          onCancel={() => setConfirming(null)}
          onConfirm={() => confirmSend(confirming)}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 neu-flat rounded-xl px-4 py-3 text-sm font-medium max-w-sm"
          style={{
            background: "var(--neu-bg)",
            color: "var(--neu-text)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "neu-flat inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
        active ? "neu-inset-deep" : "hover:opacity-90 neu-muted"
      )}
      style={active ? { color: "var(--neu-accent)" } : undefined}
    >
      {children}
    </button>
  );
}

function ConfirmSendDialog({
  candidate,
  sending,
  usage,
  onCancel,
  onConfirm,
}: {
  candidate: PipelineCandidate;
  sending: boolean;
  usage: {
    used: number;
    bundled: number;
    remaining: number;
    is_overage: boolean;
    next_card_cost_cents: number;
  } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const priceLine = !usage
    ? "Loading bundle status…"
    : usage.is_overage
      ? `$${(usage.next_card_cost_cents / 100).toFixed(2)} — at our cost + processing (bundle of ${usage.bundled} used this month, $0 profit on extras)`
      : `Free — included in your Pro plan (${usage.remaining} of ${usage.bundled} postcards left this month)`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onCancel}
    >
      <div
        className="neu-flat w-full max-w-md p-6"
        style={{
          background: "var(--neu-bg)",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              className="text-lg font-bold mb-1"
              style={{ color: "var(--neu-text)" }}
            >
              Send a postcard?
            </h3>
            <p className="text-xs neu-muted">
              One postcard mails to this address.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="neu-muted hover:opacity-70"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="neu-inset-deep rounded-xl p-4 mb-4 text-sm"
          style={{ color: "var(--neu-text)" }}
        >
          <div className="font-semibold">{candidate.address_raw}</div>
          <div className="text-xs neu-muted mt-0.5">
            {candidate.city}, FL {candidate.zip} · Built {candidate.year_built}
          </div>
        </div>

        <ul className="space-y-2 text-xs neu-muted mb-5">
          <li className="flex gap-2">
            <span style={{ color: "var(--neu-accent)" }}>•</span>
            Mailed under your business name + license #
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--neu-accent)" }}>•</span>
            Includes the FL §489.147 disclosure verbatim and an opt-out URL
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--neu-accent)" }}>•</span>
            QR code lands the homeowner on your Riley chat
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--neu-accent)" }}>•</span>
            <span>{priceLine}</span>
          </li>
        </ul>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={sending}
            className="neu-flat rounded-full px-4 py-2 text-xs font-semibold neu-muted hover:opacity-90"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="neu-accent-btn rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Confirm send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--neu-text)" }}
        >
          Property Pipeline
        </h1>
      </header>
      <div
        className="neu-flat p-10 text-center"
        style={{ borderRadius: "var(--neu-radius, 16px)" }}
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
          Add the ZIP codes you serve in <strong>Settings → Service Area</strong>.
          We'll show you every in-market home in those ZIPs — sorted by year
          built, oldest first.
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
