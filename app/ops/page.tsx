"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  PipelineResponse,
  ProspectBatch,
  PipelineStage,
  GateType,
  GateStatus,
  PipelineProspect,
} from "@/lib/ops-pipeline";
import { DISPLAY_STAGES, PIPELINE_STAGES, STAGE_LABELS, GATE_LABELS } from "@/lib/ops-pipeline";
import { scoreProspect, TIER_STYLES, OUTREACH_METHOD_LABELS } from "@/lib/prospect-scoring";
import type { ProspectInput } from "@/lib/prospect-scoring";
import { getCampaignType, generateEmailPreview, generateFormMessage, EMAIL_SCHEDULE } from "@/lib/outreach-templates";
import type { OutreachVars } from "@/lib/outreach-templates";

// ── Helpers ─────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtBatch(batchNumber: number, b: ProspectBatch) {
  return `Batch ${batchNumber} · ${fmtDate(b.week_start)}–${fmtDate(b.week_end)}`;
}
function fmtTimestamp(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function daysSince(d: string | null): number {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function stageColor(stage: PipelineStage, count: number): string {
  if (count === 0) return "text-[#D1D1D6]";
  const hot: PipelineStage[] = ["interested", "free_signup", "paid"];
  const warn: PipelineStage[] = ["site_built"];
  if (hot.includes(stage)) return "text-[#34C759] font-extrabold";
  if (warn.includes(stage)) return "text-[#FF9F0A]";
  return "text-[#3C3C43]";
}

const STAGE_PILL: Record<string, string> = {
  scraped: "bg-gray-100 text-gray-500",
  google_enriched: "bg-blue-50 text-blue-600",
  awaiting_triage: "bg-[#FFF8E1] text-[#F57F17]",
  parked: "bg-[#FFF3E0] text-[#E65100]",
  enriched: "bg-blue-50 text-blue-600",
  site_built: "bg-[#EDE7F6] text-[#5E35B1]",
  site_approved: "bg-teal-50 text-teal-600",
  contact_lookup: "bg-indigo-50 text-indigo-600",
  contact_ready: "bg-indigo-100 text-indigo-700",
  outreach_approved: "bg-cyan-50 text-cyan-600",
  sent: "bg-[#E0F7FA] text-[#00838F]",
  awaiting_reply: "bg-[#FFF8E1] text-[#F57F17]",
  replied: "bg-[#E8F5E9] text-[#2E7D32]",
  draft_ready: "bg-[#F3E5F5] text-[#7B1FA2]",
  responded: "bg-emerald-50 text-emerald-600",
  interested: "bg-[#C8E6C9] text-[#1B5E20]",
  free_signup: "bg-green-200 text-green-800",
  paid: "bg-green-300 text-green-900",
  not_now: "bg-gray-100 text-gray-500",
  objection: "bg-red-50 text-red-500",
  unsubscribed: "bg-red-100 text-red-600",
};

// ── ICP scoring — uses unified lib/prospect-scoring.ts ─────────────
function getIcpScore(lead: any) {
  const input: ProspectInput = {
    reviews_count: lead.reviews_count ?? null,
    rating: lead.rating ?? null,
    has_estimate_widget: false,
    their_website_url: lead.their_website_url ?? null,
    website_status: lead.their_website_url ? "has_website" : "none",
    contact_form_url: lead.contact_form_url ?? null,
    has_captcha: lead.has_captcha ?? false,
    linkedin_url: lead.linkedin_url ?? null,
    owner_email: lead.owner_email ?? null,
    phone: lead.phone ?? null,
    years_in_business: lead.years_in_business ?? null,
  };
  const result = scoreProspect(input);
  return { tier: result.tier, signals: result.signals, outreach_methods: result.outreach_methods, reasons: result.reasons };
}

const ICP_STYLES = TIER_STYLES;

// ── Types for attention items ───────────────────────────────────────
interface AttentionItem {
  id: string;
  batch_id: string;
  gate_key: string | null; // e.g. "triage_review-{batchId}" — used to expand gate panel
  business_name: string;
  location: string;
  context: string;
  days: number;
  urgency: "ok" | "warn" | "urgent";
  batch_label: string;
  type: "reply_wait" | "draft_pending" | "site_review" | "parked_revival" | "triage_pending";
}

export default function OpsPage() {
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [approving, setApproving] = useState<string | null>(null);
  const [attentionOpen, setAttentionOpen] = useState(true);
  const [expandedGate, setExpandedGate] = useState<string | null>(null);
  const [scrapeOpen, setScrapeOpen] = useState<string | null>(null);
  const [scraping, setScraping] = useState<string | null>(null);
  const [scrapeCount, setScrapeCount] = useState(25);
  const [scrapeCities, setScrapeCities] = useState("");
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [newBatchCities, setNewBatchCities] = useState("");
  const [newBatchCount, setNewBatchCount] = useState(25);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [detectingForms, setDetectingForms] = useState<string | null>(null);
  const [submittingForms, setSubmittingForms] = useState<string | null>(null);
  const [sendingEmails, setSendingEmails] = useState<string | null>(null);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enrichingPhotos, setEnrichingPhotos] = useState<string | null>(null);
  const [buildingSites, setBuildingSites] = useState<string | null>(null);
  const [formActionResult, setFormActionResult] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [batchAction, setBatchAction] = useState<string | null>(null); // "batchId" of open dropdown
  const [confirmAction, setConfirmAction] = useState<{ type: string; batchId: string; label: string } | null>(null);
  // Dry run preview
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [showAllPreview, setShowAllPreview] = useState(false);
  // Scrape filters
  const [scrapeMinRating, setScrapeMinRating] = useState(0);
  const [scrapeMaxReviews, setScrapeMaxReviews] = useState(100);
  const [scrapeNoWebsiteOnly, setScrapeNoWebsiteOnly] = useState(false);
  const [newBatchMinRating, setNewBatchMinRating] = useState(0);
  const [newBatchMaxReviews, setNewBatchMaxReviews] = useState(100);
  const [newBatchNoWebsiteOnly, setNewBatchNoWebsiteOnly] = useState(false);

  function openScrapePanel(batchId: string, cities: string[]) {
    setScrapeOpen(batchId);
    setScrapeCities(cities.join(", "));
    setScrapeCount(25);
    setScrapeMinRating(0);
    setScrapeMaxReviews(100);
    setScrapeNoWebsiteOnly(false);
  }

  async function handleDetectForms(batchId: string) {
    setDetectingForms(batchId);
    setFormActionResult(null);
    try {
      const res = await fetch("/api/ops/detect-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      setFormActionResult(`Queued ${data.queued} prospect(s) for form detection`);
    } catch (err) {
      setFormActionResult("Form detection failed");
    } finally {
      setDetectingForms(null);
    }
  }

  async function handleSubmitForms(batchId: string) {
    setSubmittingForms(batchId);
    setFormActionResult(null);
    try {
      const res = await fetch("/api/ops/submit-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      const parts = [`Queued ${data.queued} form submission(s)`];
      if (data.skipped_captcha > 0) parts.push(`${data.skipped_captcha} skipped (CAPTCHA)`);
      if (data.skipped_no_form > 0) parts.push(`${data.skipped_no_form} skipped (no form)`);
      if (data.estimated_completion_minutes) parts.push(`~${data.estimated_completion_minutes}min to complete`);
      setFormActionResult(parts.join(" · "));
    } catch (err) {
      setFormActionResult("Form submission failed");
    } finally {
      setSubmittingForms(null);
    }
  }

  async function handleSendEmails(batchId: string) {
    setSendingEmails(batchId);
    setFormActionResult(null);
    try {
      const res = await fetch("/api/ops/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        const parts = [`Added ${data.queued} lead(s) to Instantly`];
        if (data.skipped_no_email > 0) parts.push(`${data.skipped_no_email} skipped (no email)`);
        setFormActionResult(parts.join(" · "));
        await fetchPipeline();
      } else {
        setFormActionResult(`Email send failed: ${data.error}`);
      }
    } catch (err) {
      setFormActionResult("Email send request failed");
    } finally {
      setSendingEmails(null);
    }
  }

  async function handleEnrich(batchId: string) {
    setEnriching(batchId);
    setFormActionResult(null);
    try {
      const res = await fetch("/api/ops/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        const parts = [`Enriched ${data.enriched} lead(s)`];
        if (data.no_match > 0) parts.push(`${data.no_match} no match`);
        if (data.errors > 0) parts.push(`${data.errors} errors`);
        parts.push(`${data.credits_used} Apollo credits used`);
        setFormActionResult(parts.join(" · "));
        await fetchPipeline();
      } else {
        setFormActionResult(`Enrich failed: ${data.error}`);
      }
    } catch {
      setFormActionResult("Enrich request failed");
    } finally {
      setEnriching(null);
    }
  }

  async function handleEnrichPhotos(batchId: string) {
    setEnrichingPhotos(batchId);
    setFormActionResult(null);
    try {
      const res = await fetch("/api/ops/enrich-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        const parts = [`Enriched ${data.enriched}/${data.total} with photos + reviews`];
        if (data.estimated_cost) parts.push(`Cost: ${data.estimated_cost}`);
        if (data.errors?.length) parts.push(`${data.errors.length} errors`);
        setFormActionResult(parts.join(" · "));
        await fetchPipeline();
      } else {
        setFormActionResult(`Photo enrichment failed: ${data.error}`);
      }
    } catch {
      setFormActionResult("Photo enrichment request failed");
    } finally {
      setEnrichingPhotos(null);
    }
  }

  async function handleBuildSites(batchId: string) {
    setBuildingSites(batchId);
    setFormActionResult(null);
    try {
      const res = await fetch("/api/ops/build-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        const parts = [`Built ${data.built}/${data.total} preview sites`];
        if (data.errors?.length) parts.push(`${data.errors.length} errors`);
        setFormActionResult(parts.join(" · "));
        await fetchPipeline();
      } else {
        setFormActionResult(`Build sites failed: ${data.error}`);
      }
    } catch {
      setFormActionResult("Build sites request failed");
    } finally {
      setBuildingSites(null);
    }
  }

  // Step 1: Dry run — preview what we'd scrape, show cost
  async function handleDryRun(batchId: string) {
    setDryRunLoading(true);
    setDryRunResult(null);
    const cities = scrapeCities.split(",").map(c => c.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/ops/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          limit: scrapeCount,
          cities,
          min_rating: scrapeMinRating,
          max_reviews: scrapeMaxReviews,
          no_website_only: scrapeNoWebsiteOnly,
          dry_run: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDryRunResult({ ...data, batchId });
      } else {
        alert(`Dry run failed: ${data.error}${data.details ? `\n${data.details}` : ""}`);
      }
    } catch (err) {
      alert("Dry run request failed — check console");
    } finally {
      setDryRunLoading(false);
    }
  }

  // Step 2: Confirm and execute the real scrape
  async function handleConfirmScrape(batchId: string) {
    setScraping(batchId);
    const cities = scrapeCities.split(",").map(c => c.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/ops/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          limit: scrapeCount,
          cities,
          min_rating: scrapeMinRating,
          max_reviews: scrapeMaxReviews,
          no_website_only: scrapeNoWebsiteOnly,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Scraped ${data.inserted} new leads (${data.duplicates_skipped_before_api} duplicates skipped before API)\nAPI cost: ${data.estimated_cost}\nSaved: ${data.estimated_saved}`);
        setScrapeOpen(null);
        setDryRunResult(null);
        await fetchPipeline();
      } else {
        alert(`Scrape failed: ${data.error}${data.details ? `\n${data.details}` : ""}`);
      }
    } catch (err) {
      console.error("Scrape failed:", err);
      alert("Scrape request failed — check console");
    } finally {
      setScraping(null);
    }
  }

  // New batch: Step 1 — create batch + dry run
  async function handleNewBatchDryRun() {
    const cities = newBatchCities.split(",").map(c => c.trim()).filter(Boolean);
    if (cities.length === 0) { alert("Enter at least one city"); return; }
    setCreatingBatch(true);
    setDryRunResult(null);
    try {
      // Create the batch first
      const res = await fetch("/api/ops/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_targets: cities }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
        return;
      }
      const { batch } = await res.json();

      // Dry run the scrape
      const dryRes = await fetch("/api/ops/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batch.id,
          limit: newBatchCount,
          cities,
          min_rating: newBatchMinRating,
          max_reviews: newBatchMaxReviews,
          no_website_only: newBatchNoWebsiteOnly,
          dry_run: true,
        }),
      });
      const dryData = await dryRes.json();
      if (dryRes.ok) {
        setDryRunResult({ ...dryData, batchId: batch.id, isNewBatch: true });
      } else {
        alert(`Dry run failed: ${dryData.error}${dryData.details ? `\n${dryData.details}` : ""}`);
      }
    } catch (err) { alert("Failed to create batch"); }
    finally { setCreatingBatch(false); }
  }

  // New batch: Step 2 — confirm scrape
  async function handleNewBatchConfirmScrape(batchId: string) {
    setCreatingBatch(true);
    const cities = newBatchCities.split(",").map(c => c.trim()).filter(Boolean);
    try {
      const scrapeRes = await fetch("/api/ops/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          limit: newBatchCount,
          cities,
          min_rating: newBatchMinRating,
          max_reviews: newBatchMaxReviews,
          no_website_only: newBatchNoWebsiteOnly,
        }),
      });
      const scrapeData = await scrapeRes.json();
      if (scrapeRes.ok) {
        alert(`Scraped ${scrapeData.inserted} new leads.\nAPI cost: ${scrapeData.estimated_cost}\nSaved: ${scrapeData.estimated_saved}`);
      } else {
        alert(`Scrape failed: ${scrapeData.error}${scrapeData.details ? `\n${scrapeData.details}` : ""}`);
      }

      setNewBatchOpen(false);
      setNewBatchCities("");
      setNewBatchCount(25);
      setDryRunResult(null);
      await fetchPipeline();
    } catch (err) { alert("Failed to scrape"); }
    finally { setCreatingBatch(false); }
  }

  const fetchPipeline = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch("/api/ops/pipeline");
      if (res.ok) {
        const data = await res.json();
        setPipeline(data);
        setLastUpdated(new Date());
      } else if (res.status === 401) {
        setFetchError("Session expired. Please log in again.");
        window.location.href = "/login?redirect=/ops";
        return;
      } else {
        setFetchError(`Pipeline API returned ${res.status}`);
      }
    } catch (err) {
      console.error("Pipeline fetch failed:", err);
      setFetchError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 60_000);
    return () => clearInterval(interval);
  }, [fetchPipeline]);

  // ── Gate actions ──────────────────────────────────────────────────
  async function handleGateApproval(gateType: GateType, batchId: string, itemCount?: number) {
    const label = GATE_LABELS[gateType] || gateType;
    const count = itemCount ?? "all";
    if (!window.confirm(`Approve ${count} leads at "${label}" gate? This will advance them to the next stage.`)) {
      return;
    }
    setApproving(`${gateType}-${batchId}`);
    try {
      const res = await fetch("/api/ops/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gate_type: gateType, batch_id: batchId, action: "approve_all" }),
      });
      if (res.ok) await fetchPipeline();
    } catch (err) {
      console.error("Gate approval failed:", err);
    } finally {
      setApproving(null);
    }
  }

  function getPendingGatesForBatch(batch: ProspectBatch): GateStatus[] {
    return batch.gates.filter((g) => g.status === "pending" && g.items_pending > 0);
  }

  function getOverallStatus(): "green" | "yellow" | "red" {
    if (!pipeline) return "green";
    const pending = pipeline.pending_gates.filter(g => g.status === "pending");
    if (pending.length > 0) return "yellow";
    return "green";
  }

  function timeSince(): string {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    return `${Math.floor(seconds / 60)}m ago`;
  }

  // ── Build attention items from pipeline data ──────────────────────
  function getAttentionItems(): AttentionItem[] {
    if (!pipeline) return [];
    const items: AttentionItem[] = [];
    pipeline.batches.forEach((batch, idx) => {
      const batchNum = pipeline.batches.length - idx;
      const label = `Batch ${batchNum}`;

      // Gate-based attention items
      batch.gates.forEach((gate) => {
        if (gate.status === "pending" && gate.items_pending > 0) {
          items.push({
            id: `${batch.id}-${gate.gate_type}`,
            batch_id: batch.id,
            gate_key: `${gate.gate_type}-${batch.id}`,
            business_name: GATE_LABELS[gate.gate_type as GateType],
            location: `${gate.items_pending} items waiting`,
            context: `${fmtBatch(batchNum, batch)}`,
            days: 0,
            urgency: "warn",
            batch_label: label,
            type: gate.gate_type === "site_review" ? "site_review" : gate.gate_type === "draft_approval" ? "draft_pending" : "reply_wait",
          });
        }
      });

      // Interested leads with no movement > 3 days — these are close to converting
      const interested = batch.stage_counts?.interested || 0;
      if (interested > 0) {
        items.push({
          id: `${batch.id}-interested-stale`,
          batch_id: batch.id,
          gate_key: null,
          business_name: "Interested leads need follow-up",
          location: `${interested} interested prospect${interested !== 1 ? "s" : ""}`,
          context: `${fmtBatch(batchNum, batch)}`,
          days: 0,
          urgency: "urgent",
          batch_label: label,
          type: "reply_wait",
        });
      }

      // Draft replies pending — response getting cold
      const draftReady = batch.stage_counts?.draft_ready || 0;
      if (draftReady > 0) {
        items.push({
          id: `${batch.id}-drafts-pending`,
          batch_id: batch.id,
          gate_key: `draft_approval-${batch.id}`,
          business_name: "Draft replies need review",
          location: `${draftReady} draft${draftReady !== 1 ? "s" : ""} waiting`,
          context: `${fmtBatch(batchNum, batch)}`,
          days: 0,
          urgency: "warn",
          batch_label: label,
          type: "draft_pending",
        });
      }

      // Awaiting triage — new leads need sorting
      const awaitingTriage = batch.stage_counts?.awaiting_triage || 0;
      if (awaitingTriage > 0) {
        items.push({
          id: `${batch.id}-triage-pending`,
          batch_id: batch.id,
          gate_key: `triage_review-${batch.id}`,
          business_name: "Prospects ready to triage",
          location: `${awaitingTriage} prospect${awaitingTriage !== 1 ? "s" : ""} enriched`,
          context: `${fmtBatch(batchNum, batch)}`,
          days: 0,
          urgency: "warn",
          batch_label: label,
          type: "triage_pending",
        });
      }

      // Parked leads past their parked_until date — ready for revival
      const parkedCount = batch.stage_counts?.parked || 0;
      if (parkedCount > 0) {
        items.push({
          id: `${batch.id}-parked-revival`,
          batch_id: batch.id,
          gate_key: null,
          business_name: "Parked leads may be ready",
          location: `${parkedCount} parked prospect${parkedCount !== 1 ? "s" : ""}`,
          context: `${fmtBatch(batchNum, batch)}`,
          days: 0,
          urgency: "ok",
          batch_label: label,
          type: "parked_revival",
        });
      }
    });
    return items;
  }

  const status = getOverallStatus();
  const statusConfig = {
    green: { bg: "bg-[#E8F5E9]", border: "border-[#A5D6A7]", text: "text-[#2E7D32]", dot: "bg-[#4CAF50]", label: "All Systems Healthy" },
    yellow: { bg: "bg-[#FFF8E1]", border: "border-[#FDE68A]", text: "text-[#F57F17]", dot: "bg-[#FF9800]", label: "Gates Need Attention" },
    red: { bg: "bg-[#FFEBEE]", border: "border-[#FFCDD2]", text: "text-[#C62828]", dot: "bg-[#FF3B30]", label: "Issues Detected" },
  }[status];

  const attentionItems = getAttentionItems();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-400 text-sm">Loading pipeline data...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-sm font-medium">{fetchError}</div>
          <button
            onClick={() => { setLoading(true); fetchPipeline(); }}
            className="px-4 py-2 bg-[#007AFF] text-white text-sm rounded-lg hover:bg-[#0066D6] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ═══ STATUS BAR (under top bar) ═══ */}
      <div className="bg-white border-b border-[#E5E5EA] px-8 py-2.5 flex justify-between items-center">
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border ${statusConfig.text}`}>
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </div>
        <div className="text-xs text-[#8E8E93]">
          Updated {timeSince()}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-4">

        {/* ═══ CROSS-BATCH ATTENTION SECTION ═══ */}
        {attentionItems.length > 0 && (
          <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
            <button
              className="w-full px-5 py-3 flex justify-between items-center border-b border-[#F2F2F7] hover:bg-[#FAFAFA] transition-colors"
              onClick={() => setAttentionOpen(!attentionOpen)}
            >
              <div className="text-xs font-bold uppercase tracking-[0.05em] text-[#F57F17]">
                ⚠ Needs Your Attention — Across All Batches
              </div>
              <div className="text-[11px] text-[#8E8E93]">
                {attentionItems.length} item{attentionItems.length !== 1 ? "s" : ""} waiting
              </div>
            </button>
            {attentionOpen && (
              <div>
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center px-5 py-2.5 border-b border-[#F5F5F5] last:border-b-0 hover:bg-[#FAFBFC] cursor-pointer transition-colors"
                    onClick={() => {
                      setExpandedBatch(item.batch_id);
                      if (item.gate_key) setExpandedGate(item.gate_key);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[13px] font-semibold">{item.business_name}</div>
                        <div className="text-[11px] text-[#8E8E93]">{item.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg inline-block ${
                        item.urgency === "urgent" ? "bg-[#FFEBEE] text-[#C62828]" :
                        item.urgency === "warn" ? "bg-[#FFF8E1] text-[#F57F17]" :
                        "bg-[#E8F5E9] text-[#2E7D32]"
                      }`}>
                        {item.context}
                      </div>
                      <div className="text-[10px] text-[#AEAEB2] mt-0.5">{item.batch_label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SCRAPE POPOVER (floats over content) ═══ */}
        {scrapeOpen && (
          <div className="bg-white border border-[#007AFF33] rounded-xl shadow-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F2F2F7] flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-[0.05em] text-[#007AFF]">Scrape More Leads</div>
              <button onClick={() => setScrapeOpen(null)} className="text-[#8E8E93] hover:text-[#1D1D1F] text-sm">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Cities */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] block mb-1">City Targets</label>
                <input
                  type="text"
                  value={scrapeCities}
                  onChange={(e) => setScrapeCities(e.target.value)}
                  placeholder="Tampa, Orlando, Jacksonville"
                  className="w-full text-sm border border-[#E5E5EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
                <div className="text-[10px] text-[#AEAEB2] mt-1">Comma-separated. Leads split evenly across cities.</div>
              </div>

              {/* Count */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] block mb-1">Number of Leads</label>
                <div className="flex gap-1.5">
                  {[10, 25, 50, 100, 250, 500].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScrapeCount(n)}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        scrapeCount === n
                          ? "bg-[#007AFF] text-white"
                          : "bg-[#F5F5F7] text-[#3C3C43] hover:bg-[#E5E5EA]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-[#F5F5F7] rounded-lg p-3 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93]">Scrape Filters</div>
                <div className="space-y-1 text-[11px] text-[#3C3C43]">
                  <div className="flex items-center gap-2"><span className="text-[#34C759]">✓</span> Google Maps type: roofing_contractor</div>
                  <div className="flex items-center gap-2"><span className="text-[#34C759]">✓</span> Business status: OPERATIONAL only</div>
                  <div className="flex items-center gap-2"><span className="text-[#34C759]">✓</span> Deduplication: skip existing leads across all batches</div>
                </div>

                {/* Min Rating */}
                <div>
                  <label className="text-[10px] font-semibold text-[#8E8E93] block mb-1">Min Rating</label>
                  <div className="flex gap-1">
                    {[0, 3, 3.5, 4, 4.5].map((r) => (
                      <button key={r} onClick={() => setScrapeMinRating(r)} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${scrapeMinRating === r ? "bg-[#007AFF] text-white" : "bg-white text-[#3C3C43] border border-[#E5E5EA] hover:bg-[#E5E5EA]"}`}>
                        {r === 0 ? "Any" : `${r}★+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Reviews */}
                <div>
                  <label className="text-[10px] font-semibold text-[#8E8E93] block mb-1">Max Reviews</label>
                  <div className="flex gap-1">
                    {[10, 30, 50, 100, 999999].map((r) => (
                      <button key={r} onClick={() => setScrapeMaxReviews(r)} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${scrapeMaxReviews === r ? "bg-[#007AFF] text-white" : "bg-white text-[#3C3C43] border border-[#E5E5EA] hover:bg-[#E5E5EA]"}`}>
                        {r === 999999 ? "Any" : `≤${r}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* No Website Only */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={scrapeNoWebsiteOnly} onChange={(e) => setScrapeNoWebsiteOnly(e.target.checked)} className="w-3.5 h-3.5 rounded border-[#D1D1D6] text-[#007AFF]" />
                  <span className="text-[11px] text-[#3C3C43] font-medium">No website only</span>
                  <span className="text-[10px] text-[#8E8E93]">(best conversion)</span>
                </label>
              </div>

              {/* Cost estimate */}
              <div className="bg-[#FFF8E1] rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#F57F17]">Estimated API Cost</div>
                    <div className="text-sm font-bold text-[#92400E] mt-0.5">
                      ~${(scrapeCount * 0.05).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#B45309] mt-0.5">~$0.05/lead (Text Search $0.032 + Details $0.017)</div>
                  </div>
                  <a
                    href="https://console.cloud.google.com/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#007AFF] font-medium hover:underline"
                  >
                    Check billing →
                  </a>
                </div>
              </div>

              {/* Dry run results */}
              {dryRunResult && dryRunResult.batchId === scrapeOpen && (() => {
                const allPreview = dryRunResult.preview || [];
                const newOnes = allPreview.filter((p: any) => !p.is_duplicate);
                const displayList = showAllPreview ? allPreview : newOnes.slice(0, scrapeCount);
                const hiddenNew = Math.max(0, newOnes.length - scrapeCount);

                return (
                  <div className="bg-white border border-[#34C759] rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#34C759]">Preview Results</div>
                      <div className="text-[10px] text-[#8E8E93]">
                        Search cost: {dryRunResult.search_cost} (spent) · Detail cost: {dryRunResult.estimated_detail_cost} (if confirmed)
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-[#1D1D1F]">{dryRunResult.new_prospects}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">New</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#8E8E93]">{dryRunResult.duplicates}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">Duplicates</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#92400E]">{dryRunResult.estimated_total_cost}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">Total Cost</div>
                      </div>
                    </div>

                    {dryRunResult.new_prospects === 0 && (
                      <div className="text-[11px] text-[#C62828] font-medium bg-[#FFEBEE] rounded px-2 py-1">
                        All prospects are duplicates — scraping would cost money for zero new leads.
                      </div>
                    )}

                    {/* Prospect list */}
                    <div className="max-h-[300px] overflow-y-auto border border-[#E5E5EA] rounded-lg">
                      {displayList.map((p: any, i: number) => (
                        <div key={`${p.place_id}-${i}`} className={`flex items-center justify-between px-3 py-1.5 border-b border-[#F5F5F5] last:border-b-0 ${p.is_duplicate ? "bg-[#FFEBEE]" : ""}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] text-[#8E8E93] w-5 text-right flex-shrink-0">{i + 1}</span>
                            <span className={`text-[12px] truncate ${p.is_duplicate ? "text-[#C62828] line-through" : "text-[#1D1D1F] font-medium"}`}>{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-[#8E8E93]">{p.city}</span>
                            {p.is_duplicate && (
                              <span className="text-[9px] font-bold uppercase bg-[#FF3B30] text-white px-1.5 py-0.5 rounded">DUPLICATE</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show all toggle */}
                    {(hiddenNew > 0 || dryRunResult.duplicates > 0) && (
                      <button
                        onClick={() => setShowAllPreview(!showAllPreview)}
                        className="text-[11px] text-[#007AFF] font-medium hover:underline"
                      >
                        {showAllPreview
                          ? `Show top ${scrapeCount} only`
                          : `Show all ${allPreview.length} (${hiddenNew} more new + ${dryRunResult.duplicates} duplicates)`}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex justify-between items-center pt-1">
                <a
                  href="https://console.cloud.google.com/google/maps-apis/metrics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#007AFF] font-medium hover:underline"
                >
                  Google Maps API usage dashboard →
                </a>
                <div className="flex gap-2">
                  {!dryRunResult || dryRunResult.batchId !== scrapeOpen ? (
                    <button
                      onClick={() => handleDryRun(scrapeOpen)}
                      disabled={dryRunLoading || !scrapeCities.trim()}
                      className="text-[11px] font-semibold text-white bg-[#007AFF] hover:bg-[#0056D6] disabled:bg-[#B0D4FF] px-5 py-2 rounded-lg transition-colors"
                    >
                      {dryRunLoading ? "Previewing..." : "Preview Cost"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setDryRunResult(null)}
                        className="text-[11px] font-semibold text-[#8E8E93] bg-[#F5F5F7] hover:bg-[#E5E5EA] px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmScrape(scrapeOpen)}
                        disabled={scraping === scrapeOpen || dryRunResult.new_prospects === 0}
                        className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-5 py-2 rounded-lg transition-colors"
                      >
                        {scraping === scrapeOpen ? "Scraping..." : `Confirm & Scrape (${dryRunResult.estimated_total_cost})`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ NEW BATCH BUTTON + MODAL ═══ */}
        {newBatchOpen && (
          <div className="bg-white border border-[#34C75933] rounded-xl shadow-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F2F2F7] flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-[0.05em] text-[#34C759]">New Batch — Scrape Leads</div>
              <button onClick={() => setNewBatchOpen(false)} className="text-[#8E8E93] hover:text-[#1D1D1F] text-sm">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Cities */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] block mb-1">City Targets</label>
                <input
                  type="text"
                  value={newBatchCities}
                  onChange={(e) => setNewBatchCities(e.target.value)}
                  placeholder="Tampa, Orlando, Jacksonville"
                  className="w-full text-sm border border-[#E5E5EA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
                <div className="text-[10px] text-[#AEAEB2] mt-1">Comma-separated. Leads split evenly across cities.</div>
              </div>

              {/* Count */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] block mb-1">Number of Leads</label>
                <div className="flex gap-1.5">
                  {[10, 25, 50, 100, 250, 500].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNewBatchCount(n)}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        newBatchCount === n
                          ? "bg-[#34C759] text-white"
                          : "bg-[#F5F5F7] text-[#3C3C43] hover:bg-[#E5E5EA]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-[#F5F5F7] rounded-lg p-3 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93]">Scrape Filters</div>
                <div className="space-y-1 text-[11px] text-[#3C3C43]">
                  <div className="flex items-center gap-2"><span className="text-[#34C759]">✓</span> Google Maps type: roofing_contractor</div>
                  <div className="flex items-center gap-2"><span className="text-[#34C759]">✓</span> Business status: OPERATIONAL only</div>
                  <div className="flex items-center gap-2"><span className="text-[#34C759]">✓</span> Deduplication: skip existing leads across all batches</div>
                </div>

                {/* Min Rating */}
                <div>
                  <label className="text-[10px] font-semibold text-[#8E8E93] block mb-1">Min Rating</label>
                  <div className="flex gap-1">
                    {[0, 3, 3.5, 4, 4.5].map((r) => (
                      <button key={r} onClick={() => setNewBatchMinRating(r)} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${newBatchMinRating === r ? "bg-[#34C759] text-white" : "bg-white text-[#3C3C43] border border-[#E5E5EA] hover:bg-[#E5E5EA]"}`}>
                        {r === 0 ? "Any" : `${r}★+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Reviews */}
                <div>
                  <label className="text-[10px] font-semibold text-[#8E8E93] block mb-1">Max Reviews</label>
                  <div className="flex gap-1">
                    {[10, 30, 50, 100, 999999].map((r) => (
                      <button key={r} onClick={() => setNewBatchMaxReviews(r)} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${newBatchMaxReviews === r ? "bg-[#34C759] text-white" : "bg-white text-[#3C3C43] border border-[#E5E5EA] hover:bg-[#E5E5EA]"}`}>
                        {r === 999999 ? "Any" : `≤${r}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* No Website Only */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newBatchNoWebsiteOnly} onChange={(e) => setNewBatchNoWebsiteOnly(e.target.checked)} className="w-3.5 h-3.5 rounded border-[#D1D1D6] text-[#34C759]" />
                  <span className="text-[11px] text-[#3C3C43] font-medium">No website only</span>
                  <span className="text-[10px] text-[#8E8E93]">(best conversion)</span>
                </label>
              </div>

              {/* Cost estimate */}
              <div className="bg-[#FFF8E1] rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#F57F17]">Estimated API Cost</div>
                    <div className="text-sm font-bold text-[#92400E] mt-0.5">~${(newBatchCount * 0.05).toFixed(2)}</div>
                    <div className="text-[10px] text-[#B45309] mt-0.5">~$0.05/lead (Text Search $0.032 + Details $0.017)</div>
                  </div>
                  <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] font-medium hover:underline">Check billing →</a>
                </div>
              </div>

              {/* Dry run results */}
              {dryRunResult && dryRunResult.isNewBatch && (() => {
                const allPreview = dryRunResult.preview || [];
                const newOnes = allPreview.filter((p: any) => !p.is_duplicate);
                const displayList = showAllPreview ? allPreview : newOnes.slice(0, newBatchCount);
                const hiddenNew = Math.max(0, newOnes.length - newBatchCount);

                return (
                  <div className="bg-white border border-[#34C759] rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#34C759]">Preview Results</div>
                      <div className="text-[10px] text-[#8E8E93]">
                        Search cost: {dryRunResult.search_cost} (spent) · Detail cost: {dryRunResult.estimated_detail_cost} (if confirmed)
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-[#1D1D1F]">{dryRunResult.new_prospects}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">New</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#8E8E93]">{dryRunResult.duplicates}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">Duplicates</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#92400E]">{dryRunResult.estimated_total_cost}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">Total Cost</div>
                      </div>
                    </div>

                    {dryRunResult.new_prospects === 0 && (
                      <div className="text-[11px] text-[#C62828] font-medium bg-[#FFEBEE] rounded px-2 py-1">
                        All prospects are duplicates — scraping would cost money for zero new leads.
                      </div>
                    )}

                    {/* Prospect list */}
                    <div className="max-h-[300px] overflow-y-auto border border-[#E5E5EA] rounded-lg">
                      {displayList.map((p: any, i: number) => (
                        <div key={`${p.place_id}-${i}`} className={`flex items-center justify-between px-3 py-1.5 border-b border-[#F5F5F5] last:border-b-0 ${p.is_duplicate ? "bg-[#FFEBEE]" : ""}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] text-[#8E8E93] w-5 text-right flex-shrink-0">{i + 1}</span>
                            <span className={`text-[12px] truncate ${p.is_duplicate ? "text-[#C62828] line-through" : "text-[#1D1D1F] font-medium"}`}>{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-[#8E8E93]">{p.city}</span>
                            {p.is_duplicate && (
                              <span className="text-[9px] font-bold uppercase bg-[#FF3B30] text-white px-1.5 py-0.5 rounded">DUPLICATE</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show all toggle */}
                    {(hiddenNew > 0 || dryRunResult.duplicates > 0) && (
                      <button
                        onClick={() => setShowAllPreview(!showAllPreview)}
                        className="text-[11px] text-[#007AFF] font-medium hover:underline"
                      >
                        {showAllPreview
                          ? `Show top ${newBatchCount} only`
                          : `Show all ${allPreview.length} (${hiddenNew} more new + ${dryRunResult.duplicates} duplicates)`}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex justify-between items-center pt-1">
                <a href="https://console.cloud.google.com/google/maps-apis/metrics" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] font-medium hover:underline">Google Maps API usage →</a>
                <div className="flex gap-2">
                  {!dryRunResult || !dryRunResult.isNewBatch ? (
                    <button
                      onClick={handleNewBatchDryRun}
                      disabled={creatingBatch || !newBatchCities.trim()}
                      className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-5 py-2 rounded-lg transition-colors"
                    >
                      {creatingBatch ? "Creating..." : "Create Batch & Preview Cost"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setDryRunResult(null)}
                        className="text-[11px] font-semibold text-[#8E8E93] bg-[#F5F5F7] hover:bg-[#E5E5EA] px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleNewBatchConfirmScrape(dryRunResult.batchId)}
                        disabled={creatingBatch || dryRunResult.new_prospects === 0}
                        className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-5 py-2 rounded-lg transition-colors"
                      >
                        {creatingBatch ? "Scraping..." : `Confirm & Scrape (${dryRunResult.estimated_total_cost})`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PIPELINE CONTENT ═══ */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#E5E5EA] p-12 text-center text-[#8E8E93] text-sm">
            Loading pipeline data...
          </div>
        ) : !pipeline || pipeline.batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E5EA] p-12 text-center">
            <p className="text-[#8E8E93] text-sm font-medium">No batches yet</p>
            <p className="text-[#C7C7CC] text-xs mt-1">Create your first batch to start scraping leads</p>
            {!newBatchOpen && (
              <button
                onClick={() => setNewBatchOpen(true)}
                className="mt-3 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0056D6] px-4 py-2 rounded-lg transition-colors"
              >
                + New Batch
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Pipeline Overview ── */}
            <div className="bg-white rounded-xl border border-[#E5E5EA] px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8E8E93]">
                  Pipeline Overview
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#C7C7CC]">{pipeline.batches.length} batch{pipeline.batches.length !== 1 ? "es" : ""}</span>
                  <button
                    onClick={() => setNewBatchOpen(true)}
                    className="text-[10px] font-semibold text-[#34C759] bg-[#E8F5E9] hover:bg-[#C8E6C9] border border-[#34C75933] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + New Batch
                  </button>
                </div>
              </div>
              <div className="flex">
                {DISPLAY_STAGES.map((stage) => {
                  const count = pipeline.totals[stage] || 0;
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className={`text-base font-bold leading-none ${stageColor(stage, count)}`}>{count}</div>
                      <div className="text-[8px] uppercase tracking-[0.08em] text-[#8E8E93] mt-1">{STAGE_LABELS[stage]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Batch Cards ── */}
            {pipeline.batches.map((batch, batchIndex) => {
              const batchNumber = pipeline.batches.length - batchIndex;
              const isExpanded = expandedBatch === batch.id;
              const pendingGates = getPendingGatesForBatch(batch);
              const isCompleted = batch.status === "completed";

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-[#E5E5EA] overflow-hidden">
                  {/* Batch header */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedBatch(isExpanded ? null : batch.id); }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-[#C7C7CC] transition-transform">{isExpanded ? "▼" : "▶"}</span>
                      <span className="text-sm font-semibold">{fmtBatch(batchNumber, batch)}</span>
                      <span className="text-[11px] text-[#8E8E93]">{batch.lead_count} leads</span>
                      {batch.city_targets.length > 0 && (
                        <span className="text-[11px] text-[#8E8E93]">
                          · {batch.city_targets.slice(0, 3).join(", ")}
                          {batch.city_targets.length > 3 && ` +${batch.city_targets.length - 3}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingGates.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#F57F17] bg-[#FFF8E1] px-2.5 py-1 rounded-[10px]">
                          {pendingGates.length} gate{pendingGates.length > 1 ? "s" : ""} waiting
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-[10px]">✓ Complete</span>
                      )}
                      <span className="text-[11px] text-[#C7C7CC]">{batch.progress}%</span>
                      {/* Actions dropdown */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setBatchAction(batchAction === batch.id ? null : batch.id)}
                          className="text-[10px] font-semibold text-[#007AFF] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#007AFF33] px-3 py-1 rounded-lg transition-colors"
                        >
                          Actions ▾
                        </button>
                        {batchAction === batch.id && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-[#E5E5EA] shadow-lg z-50 overflow-hidden">
                            <button onClick={() => { setBatchAction(null); openScrapePanel(batch.id, batch.city_targets); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors border-b border-[#F2F2F7]">
                              + Scrape More Leads
                            </button>
                            <button onClick={() => { setBatchAction(null); handleEnrich(batch.id); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors border-b border-[#F2F2F7]">
                              Enrich Emails (Apollo)
                            </button>
                            <button onClick={() => { setBatchAction(null); handleEnrichPhotos(batch.id); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors border-b border-[#F2F2F7]">
                              📷 Enrich Photos + Reviews
                            </button>
                            <button onClick={() => { setBatchAction(null); handleDetectForms(batch.id); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors border-b border-[#F2F2F7]">
                              Detect Contact Forms
                            </button>
                            <button onClick={() => { setBatchAction(null); handleBuildSites(batch.id); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors border-b border-[#F2F2F7]">
                              🏠 Build Preview Sites
                            </button>
                            <button onClick={() => { setBatchAction(null); setConfirmAction({ type: "send_emails", batchId: batch.id, label: "Send cold emails to all approved leads in this batch?" }); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#C62828] hover:bg-[#FFEBEE] transition-colors border-b border-[#F2F2F7]">
                              Send Emails (Instantly)
                            </button>
                            <button onClick={() => { setBatchAction(null); setConfirmAction({ type: "submit_forms", batchId: batch.id, label: "Submit contact forms for all approved leads?" }); }} className="w-full text-left px-4 py-2.5 text-[12px] text-[#C62828] hover:bg-[#FFEBEE] transition-colors">
                              Submit Contact Forms
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 pb-1">
                    <div className="h-[5px] bg-[#F2F2F7] rounded-[3px] overflow-hidden">
                      <div className="h-full rounded-[3px] bg-gradient-to-r from-[#60A5FA] to-[#34D399] transition-all duration-500" style={{ width: `${batch.progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[8px] text-[#C7C7CC] uppercase tracking-[0.08em]">Scraped</span>
                      <span className="text-[8px] text-[#C7C7CC] uppercase tracking-[0.08em]">Replied+</span>
                    </div>
                  </div>

                  {/* Stage counts — all stages visible */}
                  <div className="flex flex-wrap px-5 py-2.5 border-t border-[#F8F8FA] gap-y-1">
                    {PIPELINE_STAGES.map((stage, i) => {
                      const count = batch.stage_counts[stage] || 0;
                      return (
                        <div key={stage} className="w-[6.25%] min-w-[60px] text-center relative">
                          {i > 0 && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[8px] text-[#E5E5EA]">›</span>}
                          <div className={`text-[12px] font-semibold ${stageColor(stage, count)}`}>{count}</div>
                          <div className="text-[7px] uppercase tracking-[0.08em] text-[#AEAEB2] mt-0.5">{STAGE_LABELS[stage]}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Outreach Stats Strip ── */}
                  {(batch.stage_counts?.sent || 0) > 0 && (
                    <div className="flex px-5 py-2 border-t border-[#F2F2F7] gap-4">
                      {(() => {
                        const sent = batch.stage_counts?.sent || 0;
                        const awaiting = batch.stage_counts?.awaiting_reply || 0;
                        const replied = batch.stage_counts?.replied || 0;
                        const interested = batch.stage_counts?.interested || 0;
                        const draftReady = batch.stage_counts?.draft_ready || 0;
                        const totalReplied = replied + interested + draftReady + (batch.stage_counts?.responded || 0);
                        const replyRate = sent > 0 ? Math.round((totalReplied / (sent + awaiting + totalReplied)) * 100) : 0;

                        return (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#8E8E93]">Reply rate</span>
                              <span className={`text-[12px] font-bold ${replyRate >= 10 ? "text-[#34C759]" : replyRate > 0 ? "text-[#FF9F0A]" : "text-[#D1D1D6]"}`}>{replyRate}%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#8E8E93]">Interested</span>
                              <span className={`text-[12px] font-bold ${interested > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`}>{interested}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#8E8E93]">Drafts pending</span>
                              <span className={`text-[12px] font-bold ${draftReady > 0 ? "text-[#FF9F0A]" : "text-[#D1D1D6]"}`}>{draftReady}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#8E8E93]">Awaiting reply</span>
                              <span className="text-[12px] font-bold text-[#8E8E93]">{awaiting}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* ── Gate Panel ── */}
                  {pendingGates.length > 0 && (
                    <div className="border-t border-[#FDE68A] bg-[#FFFBEB]/50 px-5 py-3">
                      <div className="flex flex-wrap gap-3">
                        {pendingGates.map((gate) => {
                          const gateKey = `${gate.gate_type}-${batch.id}`;
                          const isGateExpanded = expandedGate === gateKey;
                          return (
                            <div key={gate.id}>
                              <div className="flex items-center gap-3 bg-white border border-[#FDE68A] rounded-[10px] px-4 py-2.5">
                                <div>
                                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#92400E]">
                                    {GATE_LABELS[gate.gate_type as GateType]}
                                  </div>
                                  <div className="text-[11px] text-[#B45309] mt-0.5">
                                    {gate.items_pending} item{gate.items_pending !== 1 ? "s" : ""} waiting
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedGate(isGateExpanded ? null : gateKey); }}
                                    className="text-[11px] font-semibold bg-white text-[#92400E] border border-[#FDE68A] hover:bg-[#FFF8E1] px-3.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    {gate.gate_type === "site_review" ? "Review 1-by-1" : "Preview"}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleGateApproval(gate.gate_type as GateType, batch.id, gate.items_pending); }}
                                    disabled={approving === gateKey}
                                    className="text-[11px] font-semibold text-white bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#FCD34D] px-3.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    {approving === gateKey ? "Approving..." : "Approve All"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Triage Panel (triage_review gate expanded) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && g.gate_type === "triage_review") && (
                    <TriagePanel batchId={batch.id} onDone={() => { setExpandedGate(null); fetchPipeline(); }} />
                  )}

                  {/* ── Site Review Panel (Gate 1 expanded) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && g.gate_type === "site_review") && (
                    <SiteReviewPanel batchId={batch.id} onApprove={() => { setExpandedGate(null); fetchPipeline(); }} />
                  )}

                  {/* ── Outreach Approval Panel (Gate 2 expanded) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && g.gate_type === "outreach_approval") && (
                    <OutreachApprovalPanel batchId={batch.id} onApproveAndSend={() => { setExpandedGate(null); fetchPipeline(); }} />
                  )}

                  {/* ── Draft Reply Panel (Gate 3 expanded) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && g.gate_type === "draft_approval") && (
                    <DraftApprovalPanel batchId={batch.id} onDone={() => { setExpandedGate(null); fetchPipeline(); }} />
                  )}

                  {/* ── Form action result banner ── */}
                  {formActionResult && (
                    <div className="px-5 py-2 bg-[#F0F7FF] border-t border-[#DBEAFE]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#1E40AF] font-medium">{formActionResult}</span>
                        <button onClick={() => setFormActionResult(null)} className="text-[10px] text-[#8E8E93] hover:text-[#3C3C43]">✕</button>
                      </div>
                    </div>
                  )}

                  {/* ── Lead Table ── */}
                  {isExpanded && (
                    <div className="border-t border-[#F2F2F7]">
                      <BatchLeadTable batchId={batch.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="text-center py-6 text-[11px] text-[#D1D1D6]">
        RuufPro Ops · Auto-refreshes every 60s
      </div>

      {/* ═══ CONFIRMATION MODAL ═══ */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-bold text-[#1D1D1F] mb-2">Are you sure?</div>
            <div className="text-sm text-[#3C3C43] mb-6">{confirmAction.label}</div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="text-sm font-medium text-[#8E8E93] hover:text-[#1D1D1F] px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { type, batchId } = confirmAction;
                  setConfirmAction(null);
                  if (type === "send_emails") handleSendEmails(batchId);
                  if (type === "submit_forms") handleSubmitForms(batchId);
                }}
                className="text-sm font-semibold text-white bg-[#FF3B30] hover:bg-[#D32F2F] px-5 py-2 rounded-lg transition-colors"
              >
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRIAGE PANEL — select/park/skip enriched prospects
// ═══════════════════════════════════════════════════════════════════
type TriageState = "selected" | "parked" | "skipped";

function TriagePanel({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, TriageState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [parkReason, setParkReason] = useState<Record<string, string>>({});
  const [tierFilter, setTierFilter] = useState<"all" | "gold" | "silver">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          // Only show awaiting_triage with no triage_decision yet (exclude already-skipped)
          const triageLeads = data.filter((l: any) => l.stage === "awaiting_triage" && !l.triage_decision);
          setLeads(triageLeads);
          // Default all to selected
          const initial: Record<string, TriageState> = {};
          triageLeads.forEach((l: any) => { initial[l.id] = "selected"; });
          setStates(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  function cycleState(id: string) {
    setStates((prev) => {
      const current = prev[id] || "selected";
      const next: TriageState = current === "selected" ? "parked" : current === "parked" ? "skipped" : "selected";
      return { ...prev, [id]: next };
    });
  }

  function selectAllGold() {
    setStates((prev) => {
      const next = { ...prev };
      leads.forEach((lead) => {
        const score = getIcpScore(lead);
        if (score.tier === "gold") next[lead.id] = "selected";
      });
      return next;
    });
  }

  async function handleSubmitTriage() {
    setSubmitting(true);
    try {
      const decisions = Object.entries(states).map(([id, decision]) => ({
        id,
        decision,
        parked_reason: decision === "parked" ? (parkReason[id] || "") : undefined,
      }));

      const res = await fetch("/api/ops/pipeline/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Triage complete: ${data.selected} selected · ${data.parked} parked · ${data.skipped} skipped`);
        onDone();
      } else {
        const err = await res.json();
        alert(`Triage failed: ${err.error}`);
      }
    } catch { alert("Network error"); }
    finally { setSubmitting(false); }
  }

  const selectedCount = Object.values(states).filter(s => s === "selected").length;
  const parkedCount = Object.values(states).filter(s => s === "parked").length;
  const skippedCount = Object.values(states).filter(s => s === "skipped").length;

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading prospects for triage...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No prospects awaiting triage</div>;

  const triageStyles: Record<TriageState, { card: string; badge: string; label: string }> = {
    selected: { card: "border-[#34C759] bg-[#F0FFF4]", badge: "bg-[#34C759] text-white", label: "Selected" },
    parked: { card: "border-[#FF9F0A] bg-[#FFF8E1]", badge: "bg-[#FF9F0A] text-white", label: "Parked" },
    skipped: { card: "border-[#D1D1D6] bg-[#F5F5F7] opacity-50", badge: "bg-[#8E8E93] text-white", label: "Skipped" },
  };

  // Data richness helper
  function getDataRichness(lead: any): { icons: string; label: string } {
    const parts: string[] = [];
    const labels: string[] = [];

    const hasGooglePhotos = lead.photos && Array.isArray(lead.photos) && lead.photos.length > 0;
    const hasGoogleReviews = lead.google_reviews && Array.isArray(lead.google_reviews) && lead.google_reviews.length > 0;
    const hasFbPage = lead.facebook_page_url;
    const hasFbPhotos = lead.facebook_photos && Array.isArray(lead.facebook_photos) && lead.facebook_photos.length > 0;
    const fbStatus = lead.facebook_enrichment_status;

    if (hasGooglePhotos) { parts.push("📷"); labels.push(`${lead.photos.length} Google photos`); }
    if (hasGoogleReviews) { parts.push("⭐"); labels.push(`${lead.google_reviews.length} reviews`); }
    if (lead.extracted_services?.length > 0) { parts.push("🔧"); labels.push(`${lead.extracted_services.length} services`); }
    if (hasFbPage) { parts.push("📘"); labels.push("FB page"); }
    if (hasFbPhotos) { parts.push("🖼"); labels.push(`${lead.facebook_photos.length} FB photos`); }

    // FB status indicator
    if (fbStatus === "no_match") { parts.push("⚪"); labels.push("No FB page found"); }
    if (fbStatus === "error") { parts.push("🔴"); labels.push("FB enrichment error"); }

    if (parts.length === 0) return { icons: "—", label: "No data" };
    return { icons: parts.join(""), label: labels.join(" · ") };
  }

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Triage Prospects</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">
            {selectedCount} selected · {parkedCount} parked · {skippedCount} skipped
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAllGold}
            className="text-[11px] font-semibold bg-[#FFF8E1] text-[#92400E] border border-[#FDE68A] hover:bg-[#FDE68A] px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Select All Gold
          </button>
          <button
            onClick={handleSubmitTriage}
            disabled={submitting}
            className="text-[11px] font-semibold bg-[#34C759] text-white hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-3.5 py-1.5 rounded-lg transition-colors"
          >
            {submitting ? "Processing..." : `Confirm Triage (${leads.length})`}
          </button>
        </div>
      </div>

      {/* Tier filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {(["all", "gold", "silver"] as const).map((t) => {
          const count = t === "all" ? leads.length : leads.filter(l => getIcpScore(l).tier === t).length;
          const active = tierFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-lg border transition-colors ${
                active
                  ? t === "gold" ? "bg-[#FFF8E1] text-[#92400E] border-[#FDE68A]"
                  : t === "silver" ? "bg-[#F5F5F7] text-[#3C3C43] border-[#D1D1D6]"
                  : "bg-[#007AFF] text-white border-[#007AFF]"
                  : "bg-white text-[#8E8E93] border-[#E5E5EA] hover:bg-[#F5F5F7]"
              }`}
            >
              {t === "all" ? "All" : t === "gold" ? "Gold" : "Silver"} ({count})
            </button>
          );
        })}
      </div>

      <div className="text-[11px] text-[#8E8E93] mb-3 px-3 py-2 bg-[#F0F7FF] rounded-lg border border-[#007AFF22]">
        <strong className="text-[#007AFF]">How it works:</strong> All prospects start selected (green). Click to park (amber), click again to skip (gray). Parked leads can be revived later.
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2.5">
        {leads.filter(l => tierFilter === "all" || getIcpScore(l).tier === tierFilter).map((lead) => {
          const state = states[lead.id] || "selected";
          const s = triageStyles[state];
          const score = getIcpScore(lead);
          const richness = getDataRichness(lead);
          const tierStyle = ICP_STYLES[score.tier as keyof typeof ICP_STYLES] || ICP_STYLES.silver;

          return (
            <div
              key={lead.id}
              className={`border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${s.card}`}
            >
              {/* Top row: badge + business name + tier */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => cycleState(lead.id)}
                    className={`text-[9px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-md flex-shrink-0 ${s.badge}`}
                  >
                    {s.label}
                  </button>
                  <div className="text-[13px] font-semibold truncate">{lead.business_name}</div>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md flex-shrink-0 ${tierStyle.bg} ${tierStyle.text}`}>
                  {score.tier}
                </span>
              </div>

              {/* Location + website */}
              <div className="text-[11px] text-[#8E8E93] mb-2">
                {lead.city}, {lead.state || "FL"}
                {lead.their_website_url
                  ? ` · ${lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}`
                  : " · No website"}
              </div>

              {/* Rating + reviews */}
              <div className="flex items-center gap-3 mb-2">
                {lead.rating && (
                  <span className="text-[11px] font-semibold text-[#3C3C43]">
                    {lead.rating}★
                  </span>
                )}
                {lead.reviews_count != null && (
                  <span className="text-[11px] text-[#8E8E93]">
                    {lead.reviews_count} reviews
                  </span>
                )}
                {lead.phone && (
                  <span className="text-[11px] text-[#8E8E93]">{lead.phone}</span>
                )}
              </div>

              {/* Data richness */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px]">{richness.icons}</span>
                <span className="text-[10px] text-[#8E8E93]">{richness.label}</span>
              </div>

              {/* Extracted services */}
              {lead.extracted_services?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {lead.extracted_services.slice(0, 4).map((svc: string) => (
                    <span key={svc} className="text-[9px] bg-[#E5E5EA] text-[#3C3C43] px-1.5 py-0.5 rounded">
                      {svc}
                    </span>
                  ))}
                  {lead.extracted_services.length > 4 && (
                    <span className="text-[9px] text-[#8E8E93]">+{lead.extracted_services.length - 4}</span>
                  )}
                </div>
              )}

              {/* Park reason (only when parked) */}
              {state === "parked" && (
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={parkReason[lead.id] || ""}
                  onChange={(e) => setParkReason((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[11px] border border-[#FDE68A] rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:border-[#FF9F0A] bg-white"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SITE REVIEW PANEL — 3-state card grid
// ═══════════════════════════════════════════════════════════════════
type SiteState = "approved" | "neutral" | "rejected";

function SiteReviewPanel({ batchId, onApprove }: { batchId: string; onApprove: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, SiteState>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const siteLeads = data.filter((l: any) => l.stage === "site_built" && l.preview_site_url);
          setLeads(siteLeads);
          // All start approved
          const initial: Record<string, SiteState> = {};
          siteLeads.forEach((l: any) => { initial[l.id] = "approved"; });
          setStates(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  function cycleState(id: string) {
    setStates((prev) => {
      const current = prev[id] || "approved";
      const next: SiteState = current === "approved" ? "neutral" : current === "neutral" ? "rejected" : "approved";
      return { ...prev, [id]: next };
    });
  }

  const approvedCount = Object.values(states).filter(s => s === "approved").length;
  const rejectedCount = Object.values(states).filter(s => s === "rejected").length;

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading sites...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No sites to review</div>;

  const stateStyles: Record<SiteState, { card: string; check: string; label: string; icon: string }> = {
    approved: { card: "border-[#34C759] bg-[#F0FFF4]", check: "bg-[#34C759] border-[#34C759] text-white", label: "text-[#34C759]", icon: "✓" },
    neutral: { card: "border-[#E5E5EA] bg-white", check: "bg-white border-[#D1D1D6] text-transparent", label: "text-[#AEAEB2]", icon: "—" },
    rejected: { card: "border-[#EF4444] bg-[#FEF2F2] opacity-50", check: "bg-[#EF4444] border-[#EF4444] text-white", label: "text-[#EF4444]", icon: "✗" },
  };

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Review Preview Sites</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">{approvedCount} approved · {rejectedCount} rejected</div>
        </div>
        <div className="flex gap-2">
          {rejectedCount > 0 && (
            <button className="text-[11px] font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] hover:bg-[#FFCDD2] px-3.5 py-1.5 rounded-lg transition-colors">
              Reject Selected ({rejectedCount})
            </button>
          )}
          <button
            className="text-[11px] font-semibold bg-[#34C759] text-white hover:bg-[#2DA44E] px-3.5 py-1.5 rounded-lg transition-colors"
            onClick={onApprove}
          >
            Approve All {leads.length}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-[#8E8E93] mb-3 px-3 py-2 bg-[#F0F7FF] rounded-lg border border-[#007AFF22]">
        <strong className="text-[#007AFF]">How it works:</strong> All sites start approved (green ✓). Click once to skip, click again to reject (red ✗), click again to re-approve.
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
        {leads.map((lead) => {
          const state = states[lead.id] || "approved";
          const s = stateStyles[state];
          return (
            <div
              key={lead.id}
              onClick={() => cycleState(lead.id)}
              className={`flex items-center gap-3 border rounded-[10px] p-3 cursor-pointer transition-all hover:shadow-sm ${s.card}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center text-xs font-bold ${s.check}`}>
                  {s.icon}
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-[0.06em] mt-0.5 ${s.label}`}>
                  {state === "approved" ? "Approved" : state === "neutral" ? "Skipped" : "Rejected"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{lead.business_name || "Unknown"}</div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">
                  {lead.city ? `${lead.city}, ${lead.state || ""}` : ""}
                  {lead.their_website_url ? ` · ${lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}` : " · No website"}
                </div>
              </div>
              {lead.preview_site_url && (
                <a
                  href={lead.preview_site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-[#007AFF] font-medium px-2.5 py-1 rounded-md border border-[#007AFF33] hover:bg-[#EFF6FF] flex-shrink-0 transition-colors"
                >
                  View ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OUTREACH APPROVAL PANEL — Real email/form preview before sending
// ═══════════════════════════════════════════════════════════════════
type OutreachState = "approved" | "neutral" | "rejected";

function OutreachApprovalPanel({ batchId, onApproveAndSend }: { batchId: string; onApproveAndSend: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, OutreachState>>({});
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const outreachLeads = data.filter((l: any) => l.stage === "site_approved" || l.stage === "outreach_approved");
          setLeads(outreachLeads);
          const initial: Record<string, OutreachState> = {};
          outreachLeads.forEach((l: any) => { initial[l.id] = "approved"; });
          setStates(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  function cycleState(id: string) {
    setStates((prev) => {
      const current = prev[id] || "approved";
      const next: OutreachState = current === "approved" ? "neutral" : current === "neutral" ? "rejected" : "approved";
      return { ...prev, [id]: next };
    });
  }

  async function handleApproveAndSend() {
    setSending(true);
    try {
      const approvedIds = Object.entries(states).filter(([, s]) => s === "approved").map(([id]) => id);
      const rejectedIds = Object.entries(states).filter(([, s]) => s === "rejected").map(([id]) => id);

      const res = await fetch("/api/ops/pipeline/approve-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId, approved_ids: approvedIds, rejected_ids: rejectedIds }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Sent ${data.emailed} emails · ${data.forms_queued} forms queued · ${data.rejected} rejected`);
        onApproveAndSend();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch { alert("Network error"); }
    finally { setSending(false); }
  }

  const approvedCount = Object.values(states).filter(s => s === "approved").length;
  const rejectedCount = Object.values(states).filter(s => s === "rejected").length;

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading outreach preview...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No leads ready for outreach</div>;

  const stateStyles: Record<OutreachState, { card: string; check: string; label: string; icon: string }> = {
    approved: { card: "border-[#34C759] bg-[#F0FFF4]", check: "bg-[#34C759] border-[#34C759] text-white", label: "text-[#34C759]", icon: "✓" },
    neutral: { card: "border-[#E5E5EA] bg-white", check: "bg-white border-[#D1D1D6] text-transparent", label: "text-[#AEAEB2]", icon: "—" },
    rejected: { card: "border-[#EF4444] bg-[#FEF2F2] opacity-50", check: "bg-[#EF4444] border-[#EF4444] text-white", label: "text-[#EF4444]", icon: "✗" },
  };

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Review Outreach Before Sending</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">{approvedCount} approved · {rejectedCount} rejected · {leads.length - approvedCount - rejectedCount} skipped</div>
        </div>
        <button
          onClick={handleApproveAndSend}
          disabled={sending || approvedCount === 0}
          className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-4 py-1.5 rounded-lg transition-colors"
        >
          {sending ? "Sending..." : `Approve & Send ${approvedCount}`}
        </button>
      </div>

      <div className="text-[11px] text-[#8E8E93] mb-3 px-3 py-2 bg-[#F0F7FF] rounded-lg border border-[#007AFF22]">
        <strong className="text-[#007AFF]">How it works:</strong> All leads start approved (green ✓). Click to skip, click again to reject. Click &ldquo;Approve &amp; Send&rdquo; to queue emails + form submissions in one action.
      </div>

      <div className="space-y-2">
        {leads.map((lead) => {
          const state = states[lead.id] || "approved";
          const s = stateStyles[state];
          const method = lead.outreach_method || (lead.contact_form_url ? "form" : "cold_email");
          const methodStyle = OUTREACH_METHOD_LABELS[method as keyof typeof OUTREACH_METHOD_LABELS];
          const isEmailExpanded = expandedEmail === lead.id;

          // Generate preview content
          const campaignType = getCampaignType(lead);
          const vars = {
            first_name: (lead.owner_name || "").split(" ")[0] || "there",
            business_name: lead.business_name || "your business",
            city: lead.city || "",
            preview_url: lead.preview_site_url ? `https://ruufpro.com${lead.preview_site_url}` : "[preview link]",
            claim_url: lead.preview_site_url ? `https://ruufpro.com${lead.preview_site_url.replace("/site/", "/claim/")}` : "[claim link]",
          };

          const email1 = method === "cold_email" ? generateEmailPreview(0, campaignType, vars) : null;
          const formMsg = method === "form" ? generateFormMessage(vars) : null;

          return (
            <div key={lead.id} className={`border rounded-[10px] p-3 transition-all ${s.card}`}>
              <div className="flex items-start gap-3">
                {/* Toggle */}
                <div className="flex flex-col items-center cursor-pointer flex-shrink-0 pt-0.5" onClick={() => cycleState(lead.id)}>
                  <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center text-xs font-bold ${s.check}`}>
                    {s.icon}
                  </div>
                  <div className={`text-[8px] font-bold uppercase tracking-[0.06em] mt-0.5 ${s.label}`}>
                    {state === "approved" ? "Send" : state === "neutral" ? "Skip" : "Cut"}
                  </div>
                </div>

                {/* Lead info + preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold truncate">{lead.business_name || "Unknown"}</span>
                    <span className="text-[11px] text-[#8E8E93]">{lead.city || ""}</span>
                    {methodStyle && (
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${methodStyle.color}`}>
                        {methodStyle.label}
                      </span>
                    )}
                  </div>

                  {/* Email preview */}
                  {email1 && (
                    <div className="bg-white/80 rounded-lg border border-[#E5E5EA]/50 p-2.5 mt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-[#8E8E93]">To: <strong className="text-[#1D1D1F]">{lead.owner_email || "needs enrichment"}</strong></div>
                          <div className="text-[12px] font-semibold mt-0.5">{email1.subject}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedEmail(isEmailExpanded ? null : lead.id); }}
                          className="text-[10px] text-[#007AFF] font-medium"
                        >
                          {isEmailExpanded ? "Collapse" : "Preview →"}
                        </button>
                      </div>
                      {isEmailExpanded && (
                        <div className="text-[12px] text-[#3C3C43] leading-relaxed whitespace-pre-line mt-2 pt-2 border-t border-[#F2F2F7]">
                          {email1.body}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form message preview */}
                  {formMsg && (
                    <div className="bg-white/80 rounded-lg border border-[#E5E5EA]/50 p-2.5 mt-1">
                      <div className="text-[10px] text-[#8E8E93] mb-1">Form submission to: <strong className="text-[#1D1D1F]">{lead.contact_form_url?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || "form"}</strong></div>
                      <div className="text-[12px] text-[#3C3C43] leading-relaxed whitespace-pre-line">{formMsg}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DRAFT APPROVAL PANEL — review + send AI-drafted replies
// ═══════════════════════════════════════════════════════════════════
function DraftApprovalPanel({ batchId, onDone }: { batchId: string; onDone: () => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
        if (res.ok) {
          const data = await res.json();
          const draftLeads = data.filter((l: any) => l.draft_status === "pending" && l.reply_text);
          setLeads(draftLeads);
          const initial: Record<string, string> = {};
          draftLeads.forEach((l: any) => { initial[l.id] = l.draft_response || ""; });
          setDrafts(initial);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [batchId]);

  async function handleSend(lead: any) {
    setSendingId(lead.id);
    try {
      const editedDraft = drafts[lead.id] || lead.draft_response;

      // If there's an outreach_replies record, send via the replies API (goes through Instantly)
      // Otherwise, just update the pipeline record directly
      const res = await fetch("/api/ops/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: lead.id,
          action: "send",
          edited_text: editedDraft,
        }),
      });

      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== lead.id));
      } else {
        const err = await res.json();
        alert(`Send failed: ${err.error}`);
      }
    } catch { alert("Send failed"); }
    finally { setSendingId(null); }
  }

  async function handleSkip(leadId: string) {
    try {
      const res = await fetch("/api/ops/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: leadId,
          action: "skip",
        }),
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      }
    } catch { alert("Skip failed"); }
  }

  if (loading) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">Loading replies...</div>;
  if (leads.length === 0) return <div className="border-t border-[#E5E5EA] p-6 bg-[#FAFAFA] text-center text-sm text-[#8E8E93]">No draft replies to review</div>;

  return (
    <div className="border-t border-[#E5E5EA] p-5 bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.05em]">Review Draft Replies</div>
          <div className="text-xs text-[#007AFF] font-semibold mt-0.5">{leads.length} reply draft{leads.length !== 1 ? "s" : ""} waiting</div>
        </div>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white border border-[#E5E5EA] rounded-[10px] p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] font-semibold">{lead.business_name || "Unknown"}</span>
              <span className="text-[11px] text-[#8E8E93]">{lead.city || ""}</span>
              {lead.reply_category && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${
                  lead.reply_category === "interested" ? "bg-[#C8E6C9] text-[#1B5E20]" :
                  lead.reply_category === "question" ? "bg-[#E3F2FD] text-[#1565C0]" :
                  lead.reply_category === "objection" ? "bg-[#FFEBEE] text-[#C62828]" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {lead.reply_category}
                </span>
              )}
              {lead.replied_at && (
                <span className="text-[10px] text-[#FF9F0A] font-medium">{daysSince(lead.replied_at)}d ago</span>
              )}
            </div>

            {/* Their reply */}
            <div className="bg-[#E8F5E9] rounded-xl rounded-bl-sm p-3 mb-3">
              <div className="text-[10px] font-semibold text-[#2E7D32] mb-1">Their Reply</div>
              <div className="text-[13px] text-[#1B5E20] leading-relaxed">{lead.reply_text}</div>
            </div>

            {/* Editable draft */}
            <div className="bg-[#F3E5F5] rounded-xl rounded-br-sm p-3 mb-3">
              <div className="text-[10px] font-semibold text-[#7B1FA2] mb-1">Your Draft Response</div>
              <textarea
                value={drafts[lead.id] || ""}
                onChange={(e) => setDrafts(prev => ({ ...prev, [lead.id]: e.target.value }))}
                rows={4}
                className="w-full text-[13px] text-[#4A148C] leading-relaxed bg-transparent border-none outline-none resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleSkip(lead.id)}
                className="text-[11px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] px-3 py-1.5 rounded-lg transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => handleSend(lead)}
                disabled={sendingId === lead.id}
                className="text-[11px] font-semibold text-white bg-[#7B1FA2] hover:bg-[#6A1B9A] disabled:bg-[#CE93D8] px-4 py-1.5 rounded-lg transition-colors"
              >
                {sendingId === lead.id ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="text-center mt-4">
          <button onClick={onDone} className="text-[11px] font-semibold text-[#007AFF] hover:underline">Done reviewing</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BATCH LEAD TABLE — with expandable detail rows
// ═══════════════════════════════════════════════════════════════════
function BatchLeadTable({ batchId }: { batchId: string }) {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [advancing, setAdvancing] = useState(false);
  const [sortCol, setSortCol] = useState<string>("business_name");
  const [sortAsc, setSortAsc] = useState(true);

  const leads = allLeads;

  function handleSort(col: string) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  }

  function sortLeads(list: any[]) {
    return [...list].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      // Numeric columns
      if (sortCol === "rating" || sortCol === "reviews_count" || sortCol === "years_in_business") {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
        return sortAsc ? av - bv : bv - av;
      }
      // String columns
      av = (av || "").toString().toLowerCase();
      bv = (bv || "").toString().toLowerCase();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  async function fetchLeads() {
    try {
      const res = await fetch(`/api/ops/pipeline/leads?batch_id=${batchId}`);
      if (res.ok) setAllLeads(await res.json());
    } catch (err) { console.error("Failed to fetch leads:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeads(); }, [batchId]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAllInStage(stage: string) {
    const stageLeads = leads.filter(l => l.stage === stage).map(l => l.id);
    const allSelected = stageLeads.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      stageLeads.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  async function advanceSelected() {
    if (selected.size === 0) return;
    setAdvancing(true);
    try {
      const res = await fetch("/api/ops/pipeline/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelected(new Set());
        await fetchLeads();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch { alert("Network error"); }
    finally { setAdvancing(false); }
  }

  const [enrichingSelected, setEnrichingSelected] = useState(false);
  const [buildingSelected, setBuildingSelected] = useState(false);
  const [enrichingPhotosSelected, setEnrichingPhotosSelected] = useState(false);

  async function enrichSelected() {
    if (selected.size === 0) return;
    setEnrichingSelected(true);
    try {
      const res = await fetch("/api/ops/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Enriched ${data.enriched} · ${data.no_match} no match · ${data.credits_used} credits used`);
        setSelected(new Set());
        await fetchLeads();
      } else { alert(`Failed: ${data.error}`); }
    } catch { alert("Network error"); }
    finally { setEnrichingSelected(false); }
  }

  async function enrichPhotosSelected() {
    if (selected.size === 0) return;
    setEnrichingPhotosSelected(true);
    try {
      const res = await fetch("/api/ops/enrich-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Photos enriched: ${data.enriched}/${data.total} · Cost: ${data.estimated_cost}`);
        setSelected(new Set());
        await fetchLeads();
      } else { alert(`Failed: ${data.error}`); }
    } catch { alert("Network error"); }
    finally { setEnrichingPhotosSelected(false); }
  }

  async function buildSitesSelected() {
    if (selected.size === 0) return;
    setBuildingSelected(true);
    try {
      const res = await fetch("/api/ops/build-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Built ${data.built}/${data.total} sites`);
        setSelected(new Set());
        await fetchLeads();
      } else { alert(`Failed: ${data.error}`); }
    } catch { alert("Network error"); }
    finally { setBuildingSelected(false); }
  }

  // "Why is this stuck?" — shows what's blocking each lead from progressing
  function getStuckReason(lead: any): { text: string; color: string } | null {
    const s = lead.stage;
    if (s === "scraped" && !lead.photos_enriched_at) return { text: "Needs enrichment", color: "text-[#8E8E93] bg-[#F5F5F7]" };
    if (s === "google_enriched" || s === "awaiting_triage") return { text: "Needs triage", color: "text-[#F57F17] bg-[#FFF8E1]" };
    if (s === "site_built" && !lead.site_approved_at) return { text: "Needs site review", color: "text-[#F57F17] bg-[#FFF8E1]" };
    if (s === "site_approved" || s === "contact_lookup") return { text: "Looking up contact", color: "text-[#8E8E93] bg-[#F5F5F7]" };
    if (s === "contact_ready") return { text: "Needs outreach approval", color: "text-[#F57F17] bg-[#FFF8E1]" };
    if (s === "outreach_approved") {
      const method = lead.outreach_method;
      if (method === "cold_email" && !lead.owner_email) return { text: "NO EMAIL", color: "text-white bg-[#FF3B30]" };
      if (method === "form" && !lead.contact_form_url) return { text: "NO FORM", color: "text-white bg-[#FF3B30]" };
      return { text: "Ready to send", color: "text-[#34C759] bg-[#F0FFF4]" };
    }
    if (s === "sent" || s === "awaiting_reply") return { text: "Awaiting reply", color: "text-[#007AFF] bg-[#EFF6FF]" };
    if (s === "replied" || s === "draft_ready") return { text: "Draft needs review", color: "text-[#F57F17] bg-[#FFF8E1]" };
    return null;
  }

  if (loading) return <div className="p-6 text-center text-[#8E8E93] text-sm">Loading leads...</div>;
  if (leads.length === 0) return <div className="p-6 text-center text-[#8E8E93] text-sm">No leads in this batch</div>;

  // Determine which actions are relevant for the selected leads
  const selectedLeads = leads.filter(l => selected.has(l.id));
  const selectedScrapedOrEnriched = selectedLeads.filter(l => l.stage === "scraped" || l.stage === "enriched");
  const selectedNeedEnrich = selectedLeads.filter(l => !l.enriched_at);
  const selectedNeedPhotos = selectedLeads.filter(l => l.google_place_id && !l.photos_enriched_at);
  const selectedNeedSites = selectedLeads.filter(l => (l.stage === "scraped" || l.stage === "enriched") && !l.preview_site_url);

  // Group leads by stage — show ALL stages so Hannah can see the full pipeline
  const STAGE_ORDER: string[] = ["scraped", "enriched", "site_built", "site_approved", "outreach_approved", "sent", "awaiting_reply", "replied", "draft_ready", "responded", "interested", "free_signup", "paid", "not_now", "objection", "unsubscribed"];
  const stageGroups = STAGE_ORDER
    .map(stage => ({ stage, leads: leads.filter(l => l.stage === stage) }));

  const STAGE_ICONS: Record<string, string> = {
    scraped: "🔍", enriched: "📋", site_built: "🏗", site_approved: "✅",
    outreach_approved: "📤", sent: "📬", awaiting_reply: "⏳", replied: "💬",
    draft_ready: "📝", responded: "↩", interested: "🟢", free_signup: "🎉",
    paid: "💰", not_now: "⏸", objection: "🔴", unsubscribed: "❌",
  };

  const selectedStage = selected.size > 0 ? leads.find(l => selected.has(l.id))?.stage : null;

  return (
    <div>
      {/* Action bar when items selected */}
      {selected.size > 0 && (
        <div className="px-5 py-2.5 bg-[#EFF6FF] border-b border-[#007AFF33] flex items-center justify-between sticky top-[52px] z-10">
          <span className="text-xs font-semibold text-[#007AFF]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear
            </button>
            {/* Enrich Selected — show when any selected leads haven't been enriched */}
            {selectedNeedEnrich.length > 0 && (
              <button
                onClick={enrichSelected}
                disabled={enrichingSelected}
                className="text-[11px] font-semibold text-white bg-[#E65100] hover:bg-[#BF360C] disabled:bg-[#FFAB91] px-4 py-1.5 rounded-lg transition-colors"
              >
                {enrichingSelected ? "Enriching..." : `Enrich ${selectedNeedEnrich.length} Emails`}
              </button>
            )}
            {/* Photos Selected — show when any selected leads need photos */}
            {selectedNeedPhotos.length > 0 && (
              <button
                onClick={enrichPhotosSelected}
                disabled={enrichingPhotosSelected}
                className="text-[11px] font-semibold text-white bg-[#00796B] hover:bg-[#004D40] disabled:bg-[#80CBC4] px-4 py-1.5 rounded-lg transition-colors"
              >
                {enrichingPhotosSelected ? "Enriching..." : `📷 Photos ${selectedNeedPhotos.length}`}
              </button>
            )}
            {/* Build Sites Selected — show when any selected leads are ready for sites */}
            {selectedNeedSites.length > 0 && (
              <button
                onClick={buildSitesSelected}
                disabled={buildingSelected}
                className="text-[11px] font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-[#90CAF9] px-4 py-1.5 rounded-lg transition-colors"
              >
                {buildingSelected ? "Building..." : `🏠 Build ${selectedNeedSites.length} Sites`}
              </button>
            )}
            {/* Advance — always available */}
            <button
              onClick={advanceSelected}
              disabled={advancing}
              className="text-[11px] font-semibold text-white bg-[#34C759] hover:bg-[#2DA44E] disabled:bg-[#A5D6A7] px-4 py-1.5 rounded-lg transition-colors"
            >
              {advancing ? "Advancing..." : `Advance ${selected.size} →`}
            </button>
          </div>
        </div>
      )}

      {/* Stage-grouped dropdowns */}
      {stageGroups.map(({ stage, leads: stageLeads }) => {
        const isOpen = expandedStage === stage;
        const stageSelected = stageLeads.filter(l => selected.has(l.id)).length;
        const allSelected = stageLeads.every(l => selected.has(l.id));
        const sorted = sortLeads(stageLeads);

        return (
          <div key={stage} className="border-b border-[#F2F2F7] last:border-b-0">
            {/* Stage header */}
            <button
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
              onClick={() => setExpandedStage(isOpen ? null : stage)}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-[#C7C7CC]">{isOpen ? "▼" : "▶"}</span>
                <span className="text-sm">{STAGE_ICONS[stage] || "○"}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${STAGE_PILL[stage] || "bg-gray-100 text-gray-500"}`}>
                  {STAGE_LABELS[stage as PipelineStage] || stage}
                </span>
                <span className="text-[13px] font-bold text-[#1D1D1F]">{stageLeads.length}</span>
                {stageSelected > 0 && (
                  <span className="text-[10px] font-medium text-[#007AFF]">({stageSelected} selected)</span>
                )}
              </div>
            </button>

            {/* Expanded: lead rows with checkboxes */}
            {isOpen && (
              <div className="bg-[#FAFAFA]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5EA]">
                        <th className="px-3 py-2 w-8">
                          <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAllInStage(stage)} className="w-3.5 h-3.5 rounded border-[#D1D1D6] text-[#007AFF] cursor-pointer" />
                        </th>
                        {[
                          { key: "business_name", label: "Business" },
                          { key: "city", label: "City" },
                          { key: "rating", label: "Rating" },
                          { key: "reviews_count", label: "Reviews" },
                          { key: "_data_richness", label: "Site Readiness" },
                          { key: "their_website_url", label: "Website" },
                          { key: "preview_site_url", label: "Preview" },
                        ].map(({ key, label }) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="text-[10px] uppercase tracking-[0.06em] text-[#AEAEB2] font-semibold text-left px-3 py-2 cursor-pointer hover:text-[#1D1D1F] select-none"
                          >
                            {label} {sortCol === key ? (sortAsc ? "▲" : "▼") : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((lead) => {
                        const isChecked = selected.has(lead.id);
                        const icp = getIcpScore(lead);
                        const icpStyle = ICP_STYLES[icp.tier];
                        const domain = lead.their_website_url?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
                        const td = "text-xs px-3 py-2.5 border-b border-[#F0F0F2]";

                        // Data richness score — how much info we have to build a good site
                        const photoCount = lead.photos?.length || 0;
                        const reviewCount = lead.google_reviews?.length || 0;
                        const serviceCount = lead.extracted_services?.length || 0;
                        const hasEmail = !!lead.owner_email;
                        const hasPhone = !!lead.phone && lead.phone !== "unknown";
                        const hasWebsite = !!lead.their_website_url;
                        const richnessChecks = [photoCount > 0, reviewCount > 0, serviceCount > 0, hasEmail, hasPhone];
                        const richnessScore = richnessChecks.filter(Boolean).length;
                        const richnessMax = richnessChecks.length;
                        const richnessColor = richnessScore >= 4 ? "text-[#34C759]" : richnessScore >= 2 ? "text-[#FF9F0A]" : "text-[#FF3B30]";
                        const richnessLabel = richnessScore >= 4 ? "Rich" : richnessScore >= 2 ? "Partial" : "Bare";

                        return (
                          <tr key={lead.id} className={`transition-colors ${isChecked ? "bg-[#EFF6FF]" : "hover:bg-white"}`}>
                            <td className={`${td} w-8`}>
                              <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(lead.id)} className="w-4 h-4 rounded border-[#D1D1D6] text-[#007AFF] cursor-pointer" />
                            </td>
                            <td className={`${td} font-semibold text-[#1D1D1F]`}>
                              <div className="flex items-center gap-2">
                                {lead.business_name || "Unknown"}
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${icpStyle.bg} ${icpStyle.text} border ${icpStyle.border}`}>{icpStyle.label}</span>
                                {(() => {
                                  const stuck = getStuckReason(lead);
                                  return stuck ? <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${stuck.color}`}>{stuck.text}</span> : null;
                                })()}
                              </div>
                            </td>
                            <td className={td}>{lead.city ? `${lead.city}, ${lead.state || "FL"}` : "—"}</td>
                            <td className={td}>{lead.rating > 0 ? `${lead.rating}★` : "—"}</td>
                            <td className={td}>{lead.reviews_count > 0 ? lead.reviews_count : "—"}</td>
                            {/* Data richness — site readiness indicator */}
                            <td className={td}>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold ${richnessColor}`}>{richnessScore}/{richnessMax}</span>
                                <div className="flex gap-0.5" title={`Photos: ${photoCount} · Reviews: ${reviewCount} · Services: ${serviceCount} · Email: ${hasEmail ? "Yes" : "No"} · Phone: ${hasPhone ? "Yes" : "No"}`}>
                                  <span className={`text-[9px] ${photoCount > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={`${photoCount} photos`}>📷{photoCount > 0 ? photoCount : ""}</span>
                                  <span className={`text-[9px] ${reviewCount > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={`${reviewCount} reviews`}>⭐{reviewCount > 0 ? reviewCount : ""}</span>
                                  <span className={`text-[9px] ${serviceCount > 0 ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={`${serviceCount} services`}>🔧{serviceCount > 0 ? serviceCount : ""}</span>
                                  <span className={`text-[9px] ${hasEmail ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={hasEmail ? lead.owner_email : "No email"}>✉</span>
                                  <span className={`text-[9px] ${hasPhone ? "text-[#34C759]" : "text-[#D1D1D6]"}`} title={hasPhone ? lead.phone : "No phone"}>📞</span>
                                </div>
                                <span className={`text-[8px] font-semibold uppercase ${richnessColor}`}>{richnessLabel}</span>
                              </div>
                            </td>
                            <td className={td}>
                              {domain ? (
                                <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline font-medium">{domain}</a>
                              ) : <span className="text-[#FF9F0A] font-medium">No website</span>}
                            </td>
                            <td className={td}>
                              {lead.preview_site_url ? (
                                <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
                              ) : <span className="text-[#D1D1D6]">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAD ROW + EXPANDABLE DETAIL
// ═══════════════════════════════════════════════════════════════════
function LeadRow({ lead, isExpanded, isSelected, onSelect, onToggle }: { lead: any; isExpanded: boolean; isSelected: boolean; onSelect: () => void; onToggle: () => void }) {
  const td = "text-xs px-3 py-2.5 border-b border-[#F5F5F5]";
  const icp = getIcpScore(lead);
  const icpStyle = ICP_STYLES[icp.tier];

  // Build timeline from timestamps
  const timeline: { label: string; date: string | null; status: "done" | "active" | "pending" }[] = [
    { label: "Scraped", date: lead.scraped_at, status: lead.scraped_at ? "done" : "pending" },
    { label: "Enriched", date: lead.enriched_at, status: lead.enriched_at ? "done" : "pending" },
    { label: "Site Built", date: lead.site_built_at, status: lead.site_built_at ? "done" : "pending" },
    { label: "Site Approved", date: lead.site_approved_at, status: lead.site_approved_at ? "done" : "pending" },
    { label: "Sent", date: lead.sent_at, status: lead.sent_at ? "done" : "pending" },
    { label: "Replied", date: lead.replied_at, status: lead.replied_at ? "done" : "pending" },
  ];
  // Mark the last done item as "active" if there's a pending after it
  const lastDoneIdx = timeline.map(t => t.status).lastIndexOf("done");
  if (lastDoneIdx >= 0 && lastDoneIdx < timeline.length - 1) {
    timeline[lastDoneIdx].status = "active";
  }

  return (
    <>
      <tr className={`cursor-pointer transition-colors ${isSelected ? "bg-[#EFF6FF]" : isExpanded ? "bg-[#F0F7FF]" : "hover:bg-[#F8FAFC]"}`} onClick={onToggle}>
        <td className={`${td} w-8`} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-[#D1D1D6] text-[#007AFF] cursor-pointer"
          />
        </td>
        <td className={`${td} font-semibold text-[#1D1D1F]`}>
          <div className="flex items-center gap-2">
            {lead.business_name || "—"}
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${icpStyle.bg} ${icpStyle.text} border ${icpStyle.border}`}>
              {icpStyle.label}
            </span>
          </div>
        </td>
        <td className={td}>{lead.city ? `${lead.city}, ${lead.state || ""}` : "—"}</td>
        <td className={td}>
          {lead.their_website_url ? (
            <a href={lead.their_website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">
              {lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          ) : <span className="text-[#D1D1D6] text-[11px]">No website</span>}
        </td>
        <td className={td}>
          {lead.form_detected_at ? (
            lead.contact_form_url ? (
              lead.has_captcha ? (
                <span className="text-[10px] font-semibold text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-lg">CAPTCHA</span>
              ) : lead.form_submission_status === "success" ? (
                <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">Sent ✓</span>
              ) : lead.form_submission_status === "failed" ? (
                <span className="text-[10px] font-semibold text-[#C62828] bg-[#FFEBEE] px-2 py-0.5 rounded-lg" title={lead.form_submission_error || ""}>Failed</span>
              ) : (
                <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">Found</span>
              )
            ) : (
              <span className="text-[10px] text-[#C7C7CC]">No form</span>
            )
          ) : lead.their_website_url ? (
            <span className="text-[10px] text-[#D1D1D6]">—</span>
          ) : (
            <span className="text-[10px] text-[#D1D1D6]">—</span>
          )}
        </td>
        <td className={td}>
          {lead.preview_site_url ? (
            <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] hover:underline font-medium">Preview ↗</a>
          ) : <span className="text-[#D1D1D6]">—</span>}
        </td>
        <td className={td}>
          <div className="flex items-center gap-1">
            <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-lg ${STAGE_PILL[lead.stage] || "bg-gray-100 text-gray-500"}`}>
              {STAGE_LABELS[lead.stage as PipelineStage] || lead.stage}
            </span>
            {lead.outreach_method && (
              <span className="text-[8px] text-[#8E8E93] font-medium">via {lead.outreach_method}</span>
            )}
          </div>
        </td>
        <td className={td}>
          {lead.reply_category ? (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${lead.reply_category === "interested" ? "bg-[#C8E6C9] text-[#1B5E20]" : lead.reply_category === "objection" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
              {lead.reply_category}
            </span>
          ) : "—"}
        </td>
        <td className={td}>
          {lead.draft_response ? (
            <span className="text-[#8E8E93] text-[11px] max-w-[200px] truncate inline-block" title={lead.draft_response}>
              &ldquo;{lead.draft_response.slice(0, 50)}...&rdquo;
            </span>
          ) : "—"}
        </td>
      </tr>

      {/* ── Expanded Detail Row ── */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-[#F8FAFF] border-b border-[#E5E5EA] p-5">
              <div className="grid grid-cols-3 gap-4">
                {/* Column 1: Contact Info + ICP */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Contact Info</div>
                  <div className="space-y-1">
                    {[
                      ["Owner", lead.owner_name || "—"],
                      ["Email", lead.owner_email || "—"],
                      ["Phone", lead.phone || "—"],
                      ["Rating", lead.rating ? `${lead.rating}★ (${lead.reviews_count || 0} reviews)` : "—"],
                      ["Website", lead.their_website_url ? lead.their_website_url.replace(/^https?:\/\/(www\.)?/, "") : "None"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">{label}</span>
                        <span className="font-semibold text-right">{value}</span>
                      </div>
                    ))}
                    {lead.preview_site_url && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Preview</span>
                        <a href={lead.preview_site_url} target="_blank" rel="noopener noreferrer" className="text-[#007AFF] font-medium">View ↗</a>
                      </div>
                    )}
                    {lead.contact_form_url && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Form</span>
                        <a href={lead.contact_form_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#007AFF] font-medium truncate max-w-[150px]">
                          {lead.contact_form_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
                        </a>
                      </div>
                    )}
                    {lead.form_field_mapping?.form_type && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Form Type</span>
                        <span className="font-semibold">{lead.form_field_mapping.form_type}</span>
                      </div>
                    )}
                    {lead.outreach_method && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Outreach</span>
                        <span className="font-semibold capitalize">{lead.outreach_method}</span>
                      </div>
                    )}
                    {lead.form_submission_error && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E8E93]">Error</span>
                        <span className="text-red-500 text-[10px] max-w-[180px] truncate" title={lead.form_submission_error}>{lead.form_submission_error}</span>
                      </div>
                    )}
                  </div>

                  {/* ICP Qualification */}
                  <div className="mt-3 pt-3 border-t border-[#E5E5EA]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93]">ICP Quality</div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${icpStyle.bg} ${icpStyle.text} border ${icpStyle.border}`}>
                        {icpStyle.label}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {icp.signals.map((signal: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <span className={signal.includes("No ") || signal.includes("low") ? "text-[#C7C7CC]" : "text-[#34C759]"}>
                            {signal.includes("No ") || signal.includes("low") ? "○" : "✓"}
                          </span>
                          <span className={signal.includes("No ") || signal.includes("low") ? "text-[#AEAEB2]" : "text-[#3C3C43]"}>{signal}</span>
                        </div>
                      ))}
                    </div>
                    {/* Outreach Methods */}
                    {icp.outreach_methods.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E5E5EA]">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-1.5">Outreach Channels</div>
                        <div className="flex flex-wrap gap-1">
                          {icp.outreach_methods.map((method: string) => {
                            const style = OUTREACH_METHOD_LABELS[method as keyof typeof OUTREACH_METHOD_LABELS];
                            return style ? (
                              <span key={method} className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${style.color}`}>
                                {style.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Pipeline Timeline */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Pipeline Timeline</div>
                  <div className="space-y-0">
                    {timeline.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-1 relative">
                        {i < timeline.length - 1 && (
                          <div className="absolute left-[5px] top-[18px] bottom-[-4px] w-px bg-[#E5E5EA]" />
                        )}
                        <div className={`w-[11px] h-[11px] rounded-full flex-shrink-0 mt-0.5 ${
                          item.status === "done" ? "bg-[#34C759]" :
                          item.status === "active" ? "bg-[#FF9F0A] shadow-[0_0_0_3px_rgba(255,159,10,0.2)]" :
                          "bg-[#E5E5EA]"
                        }`} />
                        <div>
                          <span className="text-[11px] text-[#3C3C43]">{item.label}</span>
                          {item.date && <span className="text-[10px] text-[#AEAEB2] ml-1">{fmtTimestamp(item.date)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Conversation */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Conversation</div>
                  {lead.reply_text ? (
                    <>
                      <div className="bg-[#E8F5E9] rounded-xl rounded-bl-sm p-3 mb-2">
                        <div className="text-[10px] font-semibold text-[#2E7D32] mb-1">Their Reply</div>
                        <div className="text-xs text-[#1B5E20] leading-relaxed">{lead.reply_text}</div>
                      </div>
                      {lead.replied_at && (
                        <div className="text-[10px] text-[#FF9F0A] font-medium mb-2">
                          Time since reply: {daysSince(lead.replied_at)}d ago
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-[#C7C7CC]">No reply yet</div>
                  )}
                  {lead.draft_response && (
                    <div className="bg-[#F3E5F5] rounded-xl rounded-br-sm p-3 mt-2">
                      <div className="text-[10px] font-semibold text-[#7B1FA2] mb-1">Draft Response</div>
                      <div className="text-xs text-[#4A148C] leading-relaxed italic">{lead.draft_response}</div>
                    </div>
                  )}
                  <div className="mt-3 space-y-1">
                    {lead.emails_sent_count > 0 && (
                      <div className="text-[10px] text-[#8E8E93]">Emails sent: {lead.emails_sent_count}</div>
                    )}
                    {lead.draft_status && lead.draft_status !== "none" && (
                      <div className="text-[10px] text-[#7B1FA2] font-medium">Draft status: {lead.draft_status}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
