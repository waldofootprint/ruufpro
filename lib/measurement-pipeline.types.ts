// Phase B / Session BM CP3 — type surface for the measurement pipeline harness.
// Decision tree + gate logic implemented in ./measurement-pipeline.ts.
//
// Schema mirrors supabase/081_measurement_pipeline.sql + 082 rename.
// No runtime code in this file.

export type LidarOutcome =
  | "ok"
  | "tnm_5xx_or_timeout"
  | "laz_download_failed"
  | "no_class_6"
  | "no_footprint_lidar"
  | "pipeline_crash";

export type GateStatus = "strong" | "borderline" | "fail" | "n/a";

export type CacheTier = "l1_hit" | "l2_hit" | "cold" | "na_solar_only";

export type XcheckStatus =
  | "xcheck_ok_strong"
  | "xcheck_ok_borderline"
  | "xcheck_warn_high"
  | "xcheck_warn_borderline_disagree"
  | "xcheck_single_borderline"
  | "single_source:solar"
  | "xcheck_fail:no_source"
  | "xcheck_fail:no_source_lidar_failed";

export type Pipeline = "lidar" | "solar" | "mode_b";

// PRICING.1c-corrected (2026-04-24): resolved roof shape class + source.
// Mirrors lib/estimate.ts RoofShapeClass + ShapeClassSource. Duplicated here
// to keep measurement-pipeline type surface self-contained; estimate.ts
// imports these names from its own module for pricing math.
export type ResolvedRoofShapeClass = "simple_gable" | "hip" | "complex_multiplane";
export type ResolvedShapeClassSource = "widget" | "auto_complex" | "auto_hip_default";

export interface LidarResult {
  outcome: LidarOutcome;
  horizSqft?: number;
  pitch?: number; // rise/run ratio (4/12 -> 0.333)
  segmentCount?: number;
  perimeterFt?: number;
  inlierRatio?: number; // 0..1
  density?: number; // pts/m^2
  footprintCoverage?: number; // 0..1
  residual?: number; // telemetry only
  cacheTier?: CacheTier;
  elapsedMs: number;
}

export interface SolarResult {
  available: boolean;
  horizSqft?: number;
  pitch?: number; // rise/run ratio
  segmentCount?: number;
  elapsedMs: number;
}

export interface PipelineRequest {
  contractorId: string | null;
  leadId: string | null;
  widgetEventId: string | null;
  address: string;
  lat: number;
  lng: number;
  // PRICING.1c-corrected (2026-04-24): optional widget-supplied shape class.
  // Resolver (pipeline layer) prefers this over auto-classification from
  // LiDAR geometry. `null` / `"not_sure"` → auto. Absent → auto.
  widgetShapeClass?: ResolvedRoofShapeClass | "not_sure" | null;
}

export interface PipelineResult {
  pipeline: Pipeline;
  xcheckStatus: XcheckStatus;
  modeBTripped: boolean;
  // Track D.5 Option-A 2026-04-23: surfaced so /api/estimate can gate
  // LiDAR-primary on `pipeline === "lidar" && lidarGateStatus === "strong"`
  // (Q1-A1). Null when LiDAR disabled or never ran.
  lidarGateStatus: GateStatus | null;
  horizSqft: number | null;
  pitch: number | null;
  segmentCount: number | null;
  perimeterFt: number | null;
  telemetryRowId: string | null;
  // PRICING.1c-corrected (2026-04-24): resolved shape class + source,
  // surfaced so the sync price path in /api/estimate calls
  // getSizeShapeMultiplier with the same value written to measurement_runs.
  shapeClass: ResolvedRoofShapeClass;
  shapeClassSource: ResolvedShapeClassSource;
}

export interface FlagState {
  lidarGlobal: boolean;
  contractorLidarEnabled: boolean;
}

export interface MeasurementRunRow {
  contractor_id: string | null;
  lead_id: string | null;
  widget_event_id: string | null;
  address: string;
  lat: number;
  lng: number;
  pipeline: Pipeline;
  xcheck_status: XcheckStatus;
  mode_b_tripped: boolean;
  lidar_outcome: LidarOutcome | null;
  cache_tier: CacheTier | null;
  lidar_inlier_ratio: number | null;
  lidar_density: number | null;
  lidar_footprint_coverage: number | null;
  lidar_residual: number | null;
  lidar_gate_status: GateStatus | null;
  solar_delta_horiz_sqft_pct: number | null;
  solar_delta_pitch_ratio: number | null;
  horiz_sqft: number | null;
  pitch: number | null;
  segment_count: number | null;
  perimeter_ft: number | null;
  lidar_ms: number | null;
  solar_ms: number | null;
  total_ms: number;
  flags_snapshot: FlagState;
  // PRICING.1c-corrected (2026-04-24): shape-class audit columns. Written on
  // every insert so post-ship observability distinguishes widget-driven vs
  // auto-classified rows. Migration 084 adds the DB columns + CHECK constraint.
  shape_class: ResolvedRoofShapeClass | null;
  shape_class_source: ResolvedShapeClassSource | null;
}

export interface PipelineAdapters {
  runLidar: (req: PipelineRequest, signal: AbortSignal) => Promise<LidarResult>;
  runSolar: (req: PipelineRequest, signal: AbortSignal) => Promise<SolarResult>;
  readFlags: (contractorId: string | null) => Promise<FlagState>;
  writeMeasurementRun: (row: MeasurementRunRow) => Promise<string | null>;
  reportTelemetryFailure: (err: unknown, row: MeasurementRunRow) => void;
  now: () => number;
}

// Thresholds — scoping §3.
export const GATE_THRESHOLDS = {
  inlierRatio: { strong: 0.7, warn: 0.5 },
  density: { strong: 3, warn: 1 },
  footprintCoverage: { strong: 0.85, warn: 0.7 },
} as const;

export const SOLAR_DISAGREE = {
  horizPct: 25, // |ΔhorizSqft / mean| * 100 > 25
  pitchRatio: 0.333, // |pitchLidar - pitchSolar| > 0.333 rise/run
} as const;

// hardWall MUST ≥ lidarBudget (5s gap preserved per A.8-timeout-fix 8c703fa).
// Track A.9-class-2 §3.2 (2026-04-22): raised 30→40s / 35→45s to cover A.8-diag
// H4 Modal cold avg 34.1s (n=20, max 56s). Pairs with keep_warm=1 (app.py §3.1).
export const TIMEOUTS_MS = {
  lidarBudget: 40_000,
  hardWall: 45_000,
  solarGraceAfterLidar: 3_000,
} as const;
