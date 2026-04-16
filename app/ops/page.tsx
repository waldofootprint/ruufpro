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
import { fmtBatch, stageColor, type AttentionItem } from "./components/shared";
import { SiteReviewPanel } from "./components/SiteReviewPanel";
import { DraftApprovalPanel } from "./components/DraftApprovalPanel";
import { BatchLeadTable } from "./components/BatchLeadTable";

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
  // v3 pipeline defaults: no website, 3-30 reviews
  const [scrapeMinRating, setScrapeMinRating] = useState(0);
  const [scrapeMinReviews, setScrapeMinReviews] = useState(3);
  const [scrapeMaxReviews, setScrapeMaxReviews] = useState(30);
  const [scrapeNoWebsiteOnly, setScrapeNoWebsiteOnly] = useState(true);
  const [newBatchMinRating, setNewBatchMinRating] = useState(0);
  const [newBatchMinReviews, setNewBatchMinReviews] = useState(3);
  const [newBatchMaxReviews, setNewBatchMaxReviews] = useState(30);
  const [newBatchNoWebsiteOnly, setNewBatchNoWebsiteOnly] = useState(true);

  function openScrapePanel(batchId: string, cities: string[]) {
    setScrapeOpen(batchId);
    setScrapeCities(cities.join(", "));
    setScrapeCount(25);
    setScrapeMinRating(0);
    setScrapeMinReviews(3);
    setScrapeMaxReviews(30);
    setScrapeNoWebsiteOnly(true);
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
        const parts = [`Built ${data.built}/${data.total} demo pages`];
        if (data.errors?.length) parts.push(`${data.errors.length} errors`);
        setFormActionResult(parts.join(" · "));
        await fetchPipeline();
      } else {
        setFormActionResult(`Build demos failed: ${data.error}`);
      }
    } catch {
      setFormActionResult("Build demos request failed");
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
          min_reviews: scrapeMinReviews,
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

  // Step 2: Confirm — reads from cache, zero API calls
  async function handleConfirmScrape(batchId: string) {
    setScraping(batchId);
    try {
      const res = await fetch("/api/ops/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        const errMsg = data.error_count > 0 ? `\n⚠️ ${data.error_count} insert errors` : "";
        alert(`Inserted ${data.inserted} leads (from cache — $0 API cost)${errMsg}`);
        setScrapeOpen(null);
        setDryRunResult(null);
        await fetchPipeline();
      } else if (res.status === 409) {
        alert("Preview expired — click Preview Cost to refresh");
        setDryRunResult(null);
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
          min_reviews: newBatchMinReviews,
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

  // New batch: Step 2 — confirm (reads from cache, $0 API cost)
  async function handleNewBatchConfirmScrape(batchId: string) {
    setCreatingBatch(true);
    try {
      const scrapeRes = await fetch("/api/ops/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const scrapeData = await scrapeRes.json();
      if (scrapeRes.ok) {
        const errMsg = scrapeData.error_count > 0 ? `\n⚠️ ${scrapeData.error_count} insert errors` : "";
        alert(`Inserted ${scrapeData.inserted} leads (from cache — $0 API cost)${errMsg}`);
      } else if (scrapeRes.status === 409) {
        alert("Preview expired — click Preview Cost to refresh");
        setDryRunResult(null);
        setCreatingBatch(false);
        return;
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

  // Cancel: clean up empty batch when modal closed without confirming
  async function handleCancelNewBatch(batchId?: string) {
    if (batchId) {
      try {
        await fetch(`/api/ops/scrape?batch_id=${batchId}`, { method: "DELETE" });
      } catch {}
    }
    setNewBatchOpen(false);
    setNewBatchCities("");
    setNewBatchCount(25);
    setDryRunResult(null);
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
            type: (gate.gate_type === "demo_review" || gate.gate_type === "site_review") ? "demo_review" : gate.gate_type === "draft_approval" ? "draft_pending" : "reply_wait",
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

      // Legacy: parked leads past their parked_until date
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
                        Dry run: {dryRunResult.dry_run_cost} (spent) · Confirm: $0.00 (cached)
                      </div>
                    </div>

                    <div className={`grid ${dryRunResult.filtered_out > 0 ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center`}>
                      <div>
                        <div className="text-sm font-bold text-[#1D1D1F]">{dryRunResult.new_prospects}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">New</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#8E8E93]">{dryRunResult.duplicates}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">Duplicates</div>
                      </div>
                      {dryRunResult.filtered_out > 0 && (
                        <div>
                          <div className="text-sm font-bold text-[#F57F17]">{dryRunResult.filtered_out}</div>
                          <div className="text-[9px] text-[#8E8E93] uppercase">Filtered</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-[#92400E]">{dryRunResult.total_cost || dryRunResult.estimated_total_cost}</div>
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
                        {scraping === scrapeOpen ? "Scraping..." : `Confirm & Scrape (${dryRunResult.total_cost || dryRunResult.estimated_total_cost})`}
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
              <button onClick={() => handleCancelNewBatch(dryRunResult?.batchId)} className="text-[#8E8E93] hover:text-[#1D1D1F] text-sm">✕</button>
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
                        Dry run: {dryRunResult.dry_run_cost} (spent) · Confirm: $0.00 (cached)
                      </div>
                    </div>

                    <div className={`grid ${dryRunResult.filtered_out > 0 ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center`}>
                      <div>
                        <div className="text-sm font-bold text-[#1D1D1F]">{dryRunResult.new_prospects}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">New</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#8E8E93]">{dryRunResult.duplicates}</div>
                        <div className="text-[9px] text-[#8E8E93] uppercase">Duplicates</div>
                      </div>
                      {dryRunResult.filtered_out > 0 && (
                        <div>
                          <div className="text-sm font-bold text-[#F57F17]">{dryRunResult.filtered_out}</div>
                          <div className="text-[9px] text-[#8E8E93] uppercase">Filtered</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-[#92400E]">{dryRunResult.total_cost || dryRunResult.estimated_total_cost}</div>
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
                        {creatingBatch ? "Scraping..." : `Confirm & Scrape (${dryRunResult.total_cost || dryRunResult.estimated_total_cost})`}
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
                              🏠 Build Demo Pages
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
                                    {(gate.gate_type === "demo_review" || gate.gate_type === "site_review") ? "Review 1-by-1" : "Preview"}
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

                  {/* ── Demo Review Panel (Gate 1) ── */}
                  {expandedGate && pendingGates.some(g => `${g.gate_type}-${batch.id}` === expandedGate && (g.gate_type === "demo_review" || g.gate_type === "site_review")) && (
                    <SiteReviewPanel batchId={batch.id} onApprove={() => { setExpandedGate(null); fetchPipeline(); }} />
                  )}

                  {/* ── Draft Reply Panel (Gate 2) ── */}
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

// Panels extracted to ./components/
