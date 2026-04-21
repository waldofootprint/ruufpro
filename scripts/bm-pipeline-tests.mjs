// Phase B / Session BM CP3 — measurement pipeline unit tests.
//
// Run: node --test scripts/bm-pipeline-tests.mjs
//
// Coverage: all 4 decision-tree branches (all-🟢, 🟡 borderline, 🔴 fail,
// LiDAR no-return) crossed with Solar availability + flag states, plus a
// Mode B strictness assert (disagreement alone NEVER trips Mode B).
//
// 10 cases total. Adapter-boundary mocks only — real LiDAR/Solar/DB never
// touched. Per CP3 plan.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// No esbuild / tsx dep in this repo. Use the bundled `typescript`
// package's transpileModule API to convert each .ts file to .mjs on the
// fly, with two sidecar imports stubbed out (feature-flags +
// slack-notify hit runtime surfaces we don't need for unit tests).

const require = createRequire(import.meta.url);
const ts = require("typescript");

const workDir = mkdtempSync(join(tmpdir(), "bm-pipeline-"));

function transpile(srcPath, outName, substitutions = {}) {
  let src = readFileSync(srcPath, "utf8");
  for (const [from, to] of Object.entries(substitutions)) {
    src = src.split(from).join(to);
  }
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
    },
  });
  const outPath = join(workDir, outName);
  writeFileSync(outPath, outputText);
  return outPath;
}

async function loadPipeline() {
  // Stub sidecars — written as plain .mjs, imported from the transpiled
  // pipeline via path rewrites in the substitutions pass below.
  writeFileSync(
    join(workDir, "feature-flags.mjs"),
    "export async function readFlags() { return { lidarGlobal: false, contractorLidarEnabled: false }; }\n"
  );
  writeFileSync(
    join(workDir, "slack-notify.mjs"),
    "export async function notifySlack() {}\n"
  );
  writeFileSync(
    join(workDir, "supabase.mjs"),
    "export function createClient() { return { from() { return this; }, insert() { return this; }, select() { return this; }, single() { return { data: null, error: null }; }, eq() { return this; }, maybeSingle() { return { data: null, error: null }; } }; }\n"
  );

  // Types file — pure types, transpile produces almost-empty .mjs but the
  // exported CONSTS (GATE_THRESHOLDS, SOLAR_DISAGREE, TIMEOUTS_MS) are real.
  transpile(
    "lib/measurement-pipeline.types.ts",
    "measurement-pipeline.types.mjs"
  );

  transpile("lib/measurement-pipeline.ts", "measurement-pipeline.mjs", {
    "./feature-flags": "./feature-flags.mjs",
    "./slack-notify": "./slack-notify.mjs",
    './measurement-pipeline.types"': './measurement-pipeline.types.mjs"',
    '"@supabase/supabase-js"': '"./supabase.mjs"',
  });

  return import(join(workDir, "measurement-pipeline.mjs"));
}

const { decideOutcome, classifyLidarGates, runMeasurementPipeline } =
  await loadPipeline();

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FLAGS_ON = { lidarGlobal: true, contractorLidarEnabled: true };
const FLAGS_GLOBAL_OFF = { lidarGlobal: false, contractorLidarEnabled: true };
const FLAGS_CONTRACTOR_OFF = { lidarGlobal: true, contractorLidarEnabled: false };

function lidarOk(overrides = {}) {
  return {
    outcome: "ok",
    horizSqft: 2400,
    pitch: 0.5, // 6/12
    segmentCount: 6,
    perimeterFt: 200,
    inlierRatio: 0.85,
    density: 5.0,
    footprintCoverage: 0.92,
    residual: 0.05,
    cacheTier: "l1_hit",
    elapsedMs: 3200,
    ...overrides,
  };
}

function lidarBorderline(overrides = {}) {
  return lidarOk({
    inlierRatio: 0.60, // in [0.50, 0.70) → borderline
    density: 2.0,      // in [1, 3) → borderline
    footprintCoverage: 0.80, // in [0.70, 0.85) → borderline
    ...overrides,
  });
}

function lidarFail(overrides = {}) {
  return lidarOk({
    inlierRatio: 0.40, // < 0.50 → fail
    ...overrides,
  });
}

function solarOk(overrides = {}) {
  return {
    available: true,
    horizSqft: 2450,
    pitch: 0.5,
    segmentCount: 6,
    elapsedMs: 800,
    ...overrides,
  };
}

function solarDisagreeHigh(overrides = {}) {
  // horiz disagreement 33%+ → triggers large disagree
  return solarOk({ horizSqft: 3500, ...overrides });
}

function solarUnavail() {
  return { available: false, elapsedMs: 800 };
}

// ---------------------------------------------------------------------------
// Pure-function tests (no adapters needed)
// ---------------------------------------------------------------------------

test("classifyLidarGates: all strong → strong", () => {
  assert.equal(classifyLidarGates(lidarOk()), "strong");
});

test("classifyLidarGates: one borderline, none fail → borderline", () => {
  assert.equal(
    classifyLidarGates(lidarOk({ inlierRatio: 0.6 })),
    "borderline"
  );
});

test("classifyLidarGates: any fail → fail", () => {
  assert.equal(classifyLidarGates(lidarFail()), "fail");
});

test("classifyLidarGates: outcome != ok → n/a", () => {
  assert.equal(
    classifyLidarGates({ outcome: "pipeline_crash", elapsedMs: 0 }),
    "n/a"
  );
});

// ---------------------------------------------------------------------------
// Decision-tree branch tests (9 cases + strictness assert)
// ---------------------------------------------------------------------------

test("#1 all-🟢 + Solar agree → lidar, ok_strong", () => {
  const d = decideOutcome(lidarOk(), solarOk(), FLAGS_ON);
  assert.equal(d.pipeline, "lidar");
  assert.equal(d.xcheckStatus, "xcheck_ok_strong");
  assert.equal(d.modeBTripped, false);
  assert.equal(d.lidarGateStatus, "strong");
});

test("#2 all-🟢 + Solar disagree-high → lidar, warn_high, NOT mode_b", () => {
  const d = decideOutcome(lidarOk(), solarDisagreeHigh(), FLAGS_ON);
  assert.equal(d.pipeline, "lidar");
  assert.equal(d.xcheckStatus, "xcheck_warn_high");
  assert.equal(d.modeBTripped, false);
});

test("#3 🟡 borderline + Solar agree → lidar, ok_borderline", () => {
  const lidar = lidarBorderline({ horizSqft: 2400 });
  const d = decideOutcome(lidar, solarOk({ horizSqft: 2450 }), FLAGS_ON);
  assert.equal(d.pipeline, "lidar");
  assert.equal(d.xcheckStatus, "xcheck_ok_borderline");
  assert.equal(d.modeBTripped, false);
});

test("#4 🟡 borderline + Solar disagree → lidar, warn_borderline_disagree, NOT mode_b", () => {
  const lidar = lidarBorderline({ horizSqft: 2400 });
  const d = decideOutcome(lidar, solarDisagreeHigh(), FLAGS_ON);
  assert.equal(d.pipeline, "lidar");
  assert.equal(d.xcheckStatus, "xcheck_warn_borderline_disagree");
  assert.equal(d.modeBTripped, false);
});

test("#5 🔴 fail + Solar available → solar, single_source:solar", () => {
  const d = decideOutcome(lidarFail(), solarOk(), FLAGS_ON);
  assert.equal(d.pipeline, "solar");
  assert.equal(d.xcheckStatus, "single_source:solar");
  assert.equal(d.modeBTripped, false);
});

test("#6 LiDAR no-return + Solar unavail → mode_b, xcheck_fail:no_source", () => {
  const lidar = { outcome: "pipeline_crash", elapsedMs: 0 };
  const d = decideOutcome(lidar, solarUnavail(), FLAGS_ON);
  assert.equal(d.pipeline, "mode_b");
  assert.equal(d.xcheckStatus, "xcheck_fail:no_source");
  assert.equal(d.modeBTripped, true);
});

test("#7 global kill-switch off → solar regardless of LiDAR", () => {
  const d = decideOutcome(lidarOk(), solarOk(), FLAGS_GLOBAL_OFF);
  assert.equal(d.pipeline, "solar");
  assert.equal(d.xcheckStatus, "single_source:solar");
  assert.equal(d.modeBTripped, false);
});

test("#8 global on + contractor off → solar", () => {
  const d = decideOutcome(lidarOk(), solarOk(), FLAGS_CONTRACTOR_OFF);
  assert.equal(d.pipeline, "solar");
  assert.equal(d.xcheckStatus, "single_source:solar");
});

test("#9 strictness: all-🟢 + Solar huge Δ → lidar ships, Mode B OFF", () => {
  const d = decideOutcome(
    lidarOk({ horizSqft: 2000 }),
    solarOk({ horizSqft: 4000 }),
    FLAGS_ON
  );
  assert.equal(d.pipeline, "lidar");
  assert.equal(d.modeBTripped, false, "Mode B must never trip on disagreement alone");
});

test("#10 🔴 fail + Solar unavail → mode_b, xcheck_fail:no_source_lidar_failed", () => {
  const d = decideOutcome(lidarFail(), solarUnavail(), FLAGS_ON);
  assert.equal(d.pipeline, "mode_b");
  assert.equal(d.xcheckStatus, "xcheck_fail:no_source_lidar_failed");
  assert.equal(d.modeBTripped, true);
});

// ---------------------------------------------------------------------------
// End-to-end pipeline test with injected adapters (telemetry + full flow)
// ---------------------------------------------------------------------------

function makeAdapters({ lidar, solar, flags }) {
  const writes = [];
  return {
    adapters: {
      runLidar: async () => lidar,
      runSolar: async () => solar,
      readFlags: async () => flags,
      writeMeasurementRun: async (row) => {
        writes.push(row);
        return "fake-row-id";
      },
      reportTelemetryFailure: () => {},
      now: () => 1000,
    },
    writes,
  };
}

test("e2e: telemetry row written for all-🟢 + Solar agree", async () => {
  const { adapters, writes } = makeAdapters({
    lidar: lidarOk(),
    solar: solarOk(),
    flags: FLAGS_ON,
  });
  const req = {
    contractorId: "c1",
    leadId: null,
    widgetEventId: "w1",
    address: "123 Test St",
    lat: 30.0,
    lng: -81.0,
  };
  const result = await runMeasurementPipeline(req, adapters);
  assert.equal(result.pipeline, "lidar");
  assert.equal(result.xcheckStatus, "xcheck_ok_strong");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].pipeline, "lidar");
  assert.equal(writes[0].xcheck_status, "xcheck_ok_strong");
  assert.equal(writes[0].lidar_outcome, "ok");
  assert.equal(writes[0].cache_tier, "l1_hit");
  assert.equal(writes[0].lidar_gate_status, "strong");
  assert.ok(writes[0].solar_delta_horiz_sqft_pct != null);
  assert.deepEqual(writes[0].flags_snapshot, FLAGS_ON);
});

test("e2e: solar-only path when global flag off sets cache_tier=na_solar_only", async () => {
  const { adapters, writes } = makeAdapters({
    lidar: lidarOk(),
    solar: solarOk(),
    flags: FLAGS_GLOBAL_OFF,
  });
  const req = {
    contractorId: "c1",
    leadId: null,
    widgetEventId: null,
    address: "123 Test St",
    lat: 30.0,
    lng: -81.0,
  };
  await runMeasurementPipeline(req, adapters);
  assert.equal(writes[0].pipeline, "solar");
  assert.equal(writes[0].cache_tier, "na_solar_only");
  // solar delta NOT computed when lidar path disabled (even if LiDAR fixture
  // was passed — it's never run because flags gate)
  // Actually — because global off, runLidar is NOT called, so lidar result
  // passed into decide is null. Delta stays null.
  assert.equal(writes[0].solar_delta_horiz_sqft_pct, null);
});

test("e2e: telemetry failure invokes reportTelemetryFailure, does not throw", async () => {
  let reported = 0;
  const adapters = {
    runLidar: async () => lidarOk(),
    runSolar: async () => solarOk(),
    readFlags: async () => FLAGS_ON,
    writeMeasurementRun: async () => {
      throw new Error("DB down");
    },
    reportTelemetryFailure: () => {
      reported += 1;
    },
    now: () => 1000,
  };
  const req = {
    contractorId: "c1",
    leadId: null,
    widgetEventId: null,
    address: "x",
    lat: 0,
    lng: 0,
  };
  const result = await runMeasurementPipeline(req, adapters);
  assert.equal(reported, 1);
  assert.equal(result.telemetryRowId, null);
  assert.equal(result.pipeline, "lidar"); // pipeline result still returned
});
