// Phase B / Session BM CP3 — measurement pipeline harness.
//
// Implements scoping §3 runtime model: LiDAR primary + Solar parallel +
// Solar fallback on any LiDAR coverage gap. Cross-check logic logs Solar Δ
// as advisory-only; Mode B trips strictly on LiDAR-internal gates + source
// availability, NEVER on LiDAR↔Solar disagreement.
//
// Track A.3-A.6 (2026-04-22): LiDAR adapter now HTTP-clients to the Modal
// service hosting Pipeline A (services/lidar-measure/app.py). Real outcome
// codes flow through from the Python service; wall-clock timeout at the
// harness layer still surfaces as "pipeline_crash" (reserved for genuine
// hang/crash semantics). LIDAR_MEASURE_URL must be set; missing env =>
// pipeline_crash so harness degrades to Solar cleanly.
//
// Pipeline A source (scripts/lidar-tier3-geometry.py @ e95d561) UNTOUCHED.

import { createClient } from "@supabase/supabase-js";
import { notifySlack } from "./slack-notify";
import { readFlags } from "./feature-flags";
import { resolveShapeClass } from "./estimate";
import {
  GATE_THRESHOLDS,
  SOLAR_DISAGREE,
  TIMEOUTS_MS,
  type FlagState,
  type GateStatus,
  type LidarResult,
  type MeasurementRunRow,
  type Pipeline,
  type PipelineAdapters,
  type PipelineRequest,
  type PipelineResult,
  type SolarResult,
  type XcheckStatus,
} from "./measurement-pipeline.types";

// ---------------------------------------------------------------------------
// Gate classification (scoping §3 table)
// ---------------------------------------------------------------------------

function classifyOne(
  val: number | undefined,
  strong: number,
  warn: number
): GateStatus {
  if (val == null || !Number.isFinite(val)) return "fail";
  if (val >= strong) return "strong";
  if (val >= warn) return "borderline";
  return "fail";
}

export function classifyLidarGates(r: LidarResult): GateStatus {
  if (r.outcome !== "ok") return "n/a";
  const parts = [
    classifyOne(r.inlierRatio, GATE_THRESHOLDS.inlierRatio.strong, GATE_THRESHOLDS.inlierRatio.warn),
    classifyOne(r.density, GATE_THRESHOLDS.density.strong, GATE_THRESHOLDS.density.warn),
    classifyOne(r.footprintCoverage, GATE_THRESHOLDS.footprintCoverage.strong, GATE_THRESHOLDS.footprintCoverage.warn),
  ];
  if (parts.includes("fail")) return "fail";
  if (parts.includes("borderline")) return "borderline";
  return "strong";
}

// ---------------------------------------------------------------------------
// Solar Δ — advisory, never gates Mode B
// ---------------------------------------------------------------------------

function pct(a: number, b: number): number {
  const mean = (a + b) / 2;
  if (mean === 0) return 0;
  return (Math.abs(a - b) / Math.abs(mean)) * 100;
}

function solarDeltas(
  lidar: LidarResult,
  solar: SolarResult | null
): { horizPct: number | null; pitchRatio: number | null } {
  if (!solar || !solar.available || lidar.outcome !== "ok") {
    return { horizPct: null, pitchRatio: null };
  }
  const horiz =
    lidar.horizSqft != null && solar.horizSqft != null
      ? pct(lidar.horizSqft, solar.horizSqft)
      : null;
  const pitchRatio =
    lidar.pitch != null && solar.pitch != null
      ? Math.abs(lidar.pitch - solar.pitch)
      : null;
  return { horizPct: horiz, pitchRatio };
}

function solarDisagreesLarge(
  d: { horizPct: number | null; pitchRatio: number | null }
): boolean {
  if (d.horizPct == null && d.pitchRatio == null) return false;
  if (d.horizPct != null && d.horizPct > SOLAR_DISAGREE.horizPct) return true;
  if (d.pitchRatio != null && d.pitchRatio > SOLAR_DISAGREE.pitchRatio) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Decision tree — scoping §3, verbatim
// ---------------------------------------------------------------------------

// xcheck_fail:no_source         = LiDAR never ran successfully (disabled,
//                                 skipped, timeout, crash, coverage miss)
//                                 AND Solar unavailable.
// xcheck_fail:no_source_lidar_failed = LiDAR ran OK but gate=fail AND
//                                      Solar unavailable. Reserved strictly
//                                      for that path.
export function decideOutcome(
  lidar: LidarResult | null,
  solar: SolarResult | null,
  flags: FlagState
): {
  pipeline: Pipeline;
  xcheckStatus: XcheckStatus;
  modeBTripped: boolean;
  lidarGateStatus: GateStatus | null;
} {
  const lidarEnabled = flags.lidarGlobal && flags.contractorLidarEnabled;
  const solarAvail = solar?.available === true;

  // Path 1: LiDAR disabled by flags → Solar-only pathway
  if (!lidarEnabled) {
    if (solarAvail) {
      return {
        pipeline: "solar",
        xcheckStatus: "single_source:solar",
        modeBTripped: false,
        lidarGateStatus: null,
      };
    }
    return {
      pipeline: "mode_b",
      xcheckStatus: "xcheck_fail:no_source",
      modeBTripped: true,
      lidarGateStatus: null,
    };
  }

  // Path 2: LiDAR enabled, did not return or returned non-ok
  if (!lidar || lidar.outcome !== "ok") {
    if (solarAvail) {
      return {
        pipeline: "solar",
        xcheckStatus: "single_source:solar",
        modeBTripped: false,
        lidarGateStatus: lidar ? "n/a" : null,
      };
    }
    return {
      pipeline: "mode_b",
      xcheckStatus: "xcheck_fail:no_source",
      modeBTripped: true,
      lidarGateStatus: lidar ? "n/a" : null,
    };
  }

  // Path 3: LiDAR returned ok — classify gates
  const gate = classifyLidarGates(lidar);
  const deltas = solarDeltas(lidar, solar);
  const disagreeLarge = solarDisagreesLarge(deltas);

  // Path 3a: any 🔴 fail → drop LiDAR
  if (gate === "fail") {
    if (solarAvail) {
      return {
        pipeline: "solar",
        xcheckStatus: "single_source:solar",
        modeBTripped: false,
        lidarGateStatus: gate,
      };
    }
    return {
      pipeline: "mode_b",
      xcheckStatus: "xcheck_fail:no_source_lidar_failed",
      modeBTripped: true,
      lidarGateStatus: gate,
    };
  }

  // Path 3b: all 🟢 strong → ship LiDAR
  if (gate === "strong") {
    if (!solarAvail) {
      return {
        pipeline: "lidar",
        xcheckStatus: "xcheck_ok_strong",
        modeBTripped: false,
        lidarGateStatus: gate,
      };
    }
    return {
      pipeline: "lidar",
      xcheckStatus: disagreeLarge ? "xcheck_warn_high" : "xcheck_ok_strong",
      modeBTripped: false,
      lidarGateStatus: gate,
    };
  }

  // Path 3c: 🟡 borderline (no 🔴) → ship LiDAR (Phase A evidence)
  // NEVER Mode B on disagreement.
  let borderlineXcheck: XcheckStatus;
  if (!solarAvail) {
    borderlineXcheck = "xcheck_single_borderline";
  } else if (disagreeLarge) {
    borderlineXcheck = "xcheck_warn_borderline_disagree";
  } else {
    borderlineXcheck = "xcheck_ok_borderline";
  }
  return {
    pipeline: "lidar",
    xcheckStatus: borderlineXcheck,
    modeBTripped: false,
    lidarGateStatus: gate,
  };
}

// ---------------------------------------------------------------------------
// Race-to-answer harness
// ---------------------------------------------------------------------------

function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  onTimeout: () => T
): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(onTimeout()), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(onTimeout());
      }
    );
  });
}

// Run LiDAR + Solar with the scoping §3 race:
//  - LiDAR budget: 15s
//  - Hard wall: 20s
//  - LiDAR-success first: wait at most +3s for Solar cross-check, else ship LiDAR-only
//  - LiDAR-fail first: wait full Solar budget (Solar is now primary)
//  - Solar-first: wait remainder of LiDAR budget (primary path)
async function raceLidarSolar(
  req: PipelineRequest,
  adapters: PipelineAdapters,
  lidarEnabled: boolean
): Promise<{ lidar: LidarResult | null; solar: SolarResult | null }> {
  const controller = new AbortController();
  const hardWallTimer = setTimeout(() => controller.abort(), TIMEOUTS_MS.hardWall);

  const lidarPromise: Promise<LidarResult | null> = lidarEnabled
    ? withTimeout(
        adapters.runLidar(req, controller.signal),
        TIMEOUTS_MS.lidarBudget,
        // Pipeline A source surfaces TNM-specific codes internally; wall-clock
        // timeout at the harness layer surfaces as pipeline_crash. BN will add
        // finer codes when the real adapter lands.
        () => ({ outcome: "pipeline_crash" as const, elapsedMs: TIMEOUTS_MS.lidarBudget })
      )
    : Promise.resolve(null);

  const solarPromise: Promise<SolarResult | null> = withTimeout(
    adapters.runSolar(req, controller.signal),
    TIMEOUTS_MS.hardWall - 100,
    () => ({ available: false, elapsedMs: TIMEOUTS_MS.hardWall - 100 })
  );

  // Track settlement without blocking on both.
  let solarSettled = false;
  let solarValue: SolarResult | null = null;
  const solarTracked = solarPromise.then((v) => {
    solarSettled = true;
    solarValue = v;
    return v;
  });

  // Wait for LiDAR first (resolves immediately to null when disabled).
  const lidarValue = await lidarPromise;

  if (lidarValue && lidarValue.outcome === "ok" && !solarSettled) {
    // LiDAR primary succeeded — cap Solar cross-check at +3s grace.
    const grace = new Promise<"grace">((r) =>
      setTimeout(() => r("grace"), TIMEOUTS_MS.solarGraceAfterLidar)
    );
    const winner = await Promise.race([solarTracked, grace]);
    clearTimeout(hardWallTimer);
    if (winner === "grace") {
      // Solar exceeded grace — ship LiDAR-only. solar_delta_* stays null.
      return { lidar: lidarValue, solar: null };
    }
    return { lidar: lidarValue, solar: solarValue };
  }

  // LiDAR absent or non-ok: wait for Solar up to its full budget.
  await solarTracked;
  clearTimeout(hardWallTimer);
  return { lidar: lidarValue, solar: solarValue };
}

// ---------------------------------------------------------------------------
// Prod adapters
// ---------------------------------------------------------------------------

async function runLidarPipelineProd(
  req: PipelineRequest,
  signal: AbortSignal
): Promise<LidarResult> {
  // Track A.3-A.6: HTTP-client to Modal service (services/lidar-measure).
  // Service owns TNM lookup + LAZ download + Pipeline A invocation and
  // returns a LidarResult-shaped JSON. Any fetch-layer failure (missing
  // env, network, non-200, malformed JSON, abort) is surfaced as
  // pipeline_crash so the harness degrades to Solar. Python-layer failure
  // codes (tnm_5xx_or_timeout / laz_download_failed / no_class_6 /
  // no_footprint_lidar / ok) pass through unchanged.
  const t0 = Date.now();
  const url = process.env.LIDAR_MEASURE_URL;
  if (!url) {
    return { outcome: "pipeline_crash", elapsedMs: 0 };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat: req.lat, lng: req.lng, address: req.address }),
      signal,
    });
    if (!res.ok) {
      return { outcome: "pipeline_crash", elapsedMs: Date.now() - t0 };
    }
    const data = (await res.json()) as Partial<LidarResult> & { outcome?: string };
    // Defensive: if the service returned a shape without an outcome field,
    // treat as crash rather than trusting undefined fields downstream.
    if (!data || typeof data.outcome !== "string") {
      return { outcome: "pipeline_crash", elapsedMs: Date.now() - t0 };
    }
    return {
      ...data,
      elapsedMs: data.elapsedMs ?? Date.now() - t0,
    } as LidarResult;
  } catch {
    // AbortError (hard-wall 20s) or network error. Harness already has a
    // 15s budget wrapper that may have fired first — either way,
    // pipeline_crash is the honest code here.
    return { outcome: "pipeline_crash", elapsedMs: Date.now() - t0 };
  }
}

async function runSolarPipelineProd(
  _req: PipelineRequest,
  _signal: AbortSignal
): Promise<SolarResult> {
  // CP3 scope ends at module boundary — /api/estimate keeps calling
  // lib/solar-api.ts directly. This adapter is wired in CP4. Throw loudly
  // pre-CP4 so a misconfigured caller fails visibly instead of silently
  // reporting Solar unavailable.
  throw new Error("Solar adapter not wired; CP4 pending");
}

async function writeMeasurementRunProd(row: MeasurementRunRow): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await supabase
    .from("measurement_runs")
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

// Hourly-dedup Slack notifier for telemetry write failures. Prevents a
// burst of failures from spamming — one ping per hour per error class.
const telemetryNotifyCache = new Map<string, number>();
const TELEMETRY_NOTIFY_DEDUP_MS = 60 * 60 * 1000;

function reportTelemetryFailureProd(err: unknown, row: MeasurementRunRow): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error("[measurement_runs] write failed", { err: errMsg, row });

  const key = errMsg.slice(0, 80);
  const now = Date.now();
  const last = telemetryNotifyCache.get(key) ?? 0;
  if (now - last < TELEMETRY_NOTIFY_DEDUP_MS) return;
  telemetryNotifyCache.set(key, now);

  notifySlack({
    type: "error",
    title: "measurement_runs write failed",
    message: `Telemetry row dropped. First error in dedup window: ${errMsg}`,
    context: {
      contractor_id: row.contractor_id,
      address: row.address,
      pipeline: row.pipeline,
    },
  }).catch((slackErr) => {
    console.error("[slack-notify] failed to report telemetry failure", slackErr);
  });
}

export const prodAdapters: PipelineAdapters = {
  runLidar: runLidarPipelineProd,
  runSolar: runSolarPipelineProd,
  readFlags,
  writeMeasurementRun: writeMeasurementRunProd,
  reportTelemetryFailure: reportTelemetryFailureProd,
  now: () => Date.now(),
};

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export async function runMeasurementPipeline(
  req: PipelineRequest,
  adapters: PipelineAdapters = prodAdapters
): Promise<PipelineResult> {
  const t0 = adapters.now();
  const flags = await adapters.readFlags(req.contractorId);
  const lidarEnabled = flags.lidarGlobal && flags.contractorLidarEnabled;

  const { lidar, solar } = await raceLidarSolar(req, adapters, lidarEnabled);

  const decision = decideOutcome(lidar, solar, flags);
  const deltas =
    lidar && lidar.outcome === "ok" ? solarDeltas(lidar, solar) : { horizPct: null, pitchRatio: null };

  // Select final measurement fields from the chosen pipeline
  let horiz: number | null = null;
  let pitch: number | null = null;
  let segs: number | null = null;
  let perim: number | null = null;
  if (decision.pipeline === "lidar" && lidar && lidar.outcome === "ok") {
    horiz = lidar.horizSqft ?? null;
    pitch = lidar.pitch ?? null;
    segs = lidar.segmentCount ?? null;
    perim = lidar.perimeterFt ?? null;
  } else if (decision.pipeline === "solar" && solar && solar.available) {
    horiz = solar.horizSqft ?? null;
    pitch = solar.pitch ?? null;
    segs = solar.segmentCount ?? null;
    // Solar does not expose perimeter; stays null
  }

  // PRICING.1c-corrected (2026-04-24): resolve shape class using widget input
  // if supplied, else auto-classify from LiDAR geometry. alphaAreaSqft not
  // currently plumbed through LidarResult (Modal response shim at
  // services/lidar-measure/app.py:285 drops roof_alpha_area_sqft — frozen per
  // scoping §5.1). Resolver degrades to compactness-only in the auto path.
  // Solar-served rows have no perimeter → auto falls to safe-middle hip default.
  const resolvedShape = resolveShapeClass(
    req.widgetShapeClass ?? null,
    horiz,
    // alphaAreaSqft not exposed on LiDAR result (Modal shim-level limitation).
    null,
    perim,
  );

  const row: MeasurementRunRow = {
    contractor_id: req.contractorId,
    lead_id: req.leadId,
    widget_event_id: req.widgetEventId,
    address: req.address,
    lat: req.lat,
    lng: req.lng,
    pipeline: decision.pipeline,
    xcheck_status: decision.xcheckStatus,
    mode_b_tripped: decision.modeBTripped,
    lidar_outcome: lidar?.outcome ?? null,
    cache_tier:
      lidar?.cacheTier ??
      (decision.pipeline === "solar" || decision.pipeline === "mode_b" ? "na_solar_only" : null),
    lidar_inlier_ratio: lidar?.inlierRatio ?? null,
    lidar_density: lidar?.density ?? null,
    lidar_footprint_coverage: lidar?.footprintCoverage ?? null,
    lidar_residual: lidar?.residual ?? null,
    lidar_gate_status: decision.lidarGateStatus,
    solar_delta_horiz_sqft_pct: deltas.horizPct,
    solar_delta_pitch_ratio: deltas.pitchRatio,
    horiz_sqft: horiz,
    pitch,
    segment_count: segs,
    perimeter_ft: perim,
    lidar_ms: lidar?.elapsedMs ?? null,
    solar_ms: solar?.elapsedMs ?? null,
    total_ms: adapters.now() - t0,
    flags_snapshot: flags,
    shape_class: resolvedShape.shapeClass,
    shape_class_source: resolvedShape.source,
  };

  // Fire-and-forget telemetry — a write hiccup must not block /api/estimate.
  // Failures surface via reportTelemetryFailure (Slack + console).
  let telemetryRowId: string | null = null;
  try {
    telemetryRowId = await adapters.writeMeasurementRun(row);
  } catch (err) {
    adapters.reportTelemetryFailure(err, row);
  }

  return {
    pipeline: decision.pipeline,
    xcheckStatus: decision.xcheckStatus,
    modeBTripped: decision.modeBTripped,
    lidarGateStatus: decision.lidarGateStatus,
    horizSqft: horiz,
    pitch,
    segmentCount: segs,
    perimeterFt: perim,
    telemetryRowId,
    shapeClass: resolvedShape.shapeClass,
    shapeClassSource: resolvedShape.source,
  };
}
