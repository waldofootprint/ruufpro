// Phase B / Session BM CP4 — 20-request synthetic smoke + live kill-switch.
//
// Run:
//   node scripts/bm-smoke.mjs
//
// Two phases:
//   Phase 1: 20 synthetic requests with MOCKED readFlags, REAL writeMeasurementRun
//            → exercises every decision-tree branch + writes rows to prod
//            measurement_runs. Uses adapter-mocked flags to avoid live toggles
//            during the main run.
//   Phase 2: ONE live request with REAL readFlags against real feature_flags DB,
//            sequence: flag ON → request → flag OFF → request → flag ON → request
//            Verifies the kill-switch is live per scoping §5 Gate 3.
//
// All synthetic rows stamped with a throwaway contractor
// `experiment-bm-smoke-<shortsha>` + address prefix `BM_SMOKE_`. Cleanup SQL
// in BM close report; not executed here.
//
// Requires SUPABASE_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY in env. Reads from .env.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

// Load .env
const envText = readFileSync(".env", "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SHORTSHA = execSync("git rev-parse --short HEAD").toString().trim();
const CONTRACTOR_NAME = `experiment-bm-smoke-${SHORTSHA}`;

// ---------------------------------------------------------------------------
// Transpile lib/measurement-pipeline.ts on the fly (no esbuild/tsx dep)
// ---------------------------------------------------------------------------

const workDir = mkdtempSync(join(tmpdir(), "bm-smoke-"));

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

// Stub slack-notify so we don't trigger real webhooks during smoke.
writeFileSync(
  join(workDir, "slack-notify.mjs"),
  "export async function notifySlack() {}\n"
);

// Transpile feature-flags with @supabase import rewritten to the installed path
transpile("lib/feature-flags.ts", "feature-flags.mjs");

transpile("lib/measurement-pipeline.types.ts", "measurement-pipeline.types.mjs");

transpile("lib/measurement-pipeline.ts", "measurement-pipeline.mjs", {
  "./slack-notify": "./slack-notify.mjs",
  './measurement-pipeline.types"': './measurement-pipeline.types.mjs"',
  "./feature-flags": "./feature-flags.mjs",
});

// For feature-flags.ts, the supabase-js import is unchanged (bare specifier
// resolves via node_modules). Works when we run from repo root.
const pipelinePath = join(workDir, "measurement-pipeline.mjs");
// Patch the supabase-js bare specifier to absolute path so the tmp module can
// find it (tmp dir has no node_modules).
for (const f of ["feature-flags.mjs", "measurement-pipeline.mjs"]) {
  const p = join(workDir, f);
  let s = readFileSync(p, "utf8");
  s = s.replace(
    /from\s+["']@supabase\/supabase-js["']/g,
    `from "${process.cwd()}/node_modules/@supabase/supabase-js/dist/index.mjs"`
  );
  writeFileSync(p, s);
}

const { runMeasurementPipeline, prodAdapters } = await import(pipelinePath);

// ---------------------------------------------------------------------------
// Management API helpers
// ---------------------------------------------------------------------------

const PROJECT_REF = "comcpamnxjtldlnnudqc";
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
if (!PAT) {
  console.error("SUPABASE_ACCESS_TOKEN missing");
  process.exit(1);
}

async function mgmtQuery(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`mgmtQuery failed ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Seed throwaway contractor
// ---------------------------------------------------------------------------

async function seedContractor() {
  const safe = CONTRACTOR_NAME.replace(/'/g, "''");
  const email = `${CONTRACTOR_NAME}@example.com`;
  const rows = await mgmtQuery(
    `insert into contractors (business_name, email, phone, city, state, business_type, is_prospect, lidar_enabled)
     values ('${safe}', '${email}', '555-000-0000', 'Smoke', 'FL', 'residential', true, true)
     returning id;`
  );
  return rows[0].id;
}

// ---------------------------------------------------------------------------
// Fixtures — adapter factories for every branch
// ---------------------------------------------------------------------------

function lidarOk(overrides = {}) {
  return {
    outcome: "ok",
    horizSqft: 2400,
    pitch: 0.5,
    segmentCount: 6,
    perimeterFt: 200,
    inlierRatio: 0.85,
    density: 5,
    footprintCoverage: 0.92,
    residual: 0.05,
    cacheTier: "l1_hit",
    elapsedMs: 3000,
    ...overrides,
  };
}

function lidarBorderline(overrides = {}) {
  return lidarOk({ inlierRatio: 0.6, density: 2, footprintCoverage: 0.8, ...overrides });
}

function lidarFail(overrides = {}) {
  return lidarOk({ inlierRatio: 0.4, ...overrides });
}

function solarOk(overrides = {}) {
  return { available: true, horizSqft: 2450, pitch: 0.5, segmentCount: 6, elapsedMs: 800, ...overrides };
}

function solarUnavail() {
  return { available: false, elapsedMs: 800 };
}

const FLAGS_ON = { lidarGlobal: true, contractorLidarEnabled: true };

// 20 canned scenarios covering all 4 decision branches (scoping §5 BM close)
function scenarios() {
  return [
    // all-🟢 + Solar agree (×4)
    { name: "all_green_solar_agree_1", lidar: lidarOk(), solar: solarOk(), expect: { pipeline: "lidar", xcheck: "xcheck_ok_strong" } },
    { name: "all_green_solar_agree_2", lidar: lidarOk(), solar: solarOk({ horizSqft: 2420 }), expect: { pipeline: "lidar", xcheck: "xcheck_ok_strong" } },
    { name: "all_green_solar_agree_3", lidar: lidarOk(), solar: solarOk({ horizSqft: 2380 }), expect: { pipeline: "lidar", xcheck: "xcheck_ok_strong" } },
    { name: "all_green_solar_agree_4", lidar: lidarOk(), solar: solarOk(), expect: { pipeline: "lidar", xcheck: "xcheck_ok_strong" } },

    // all-🟢 + Solar disagree (×3)
    { name: "all_green_solar_disagree_1", lidar: lidarOk(), solar: solarOk({ horizSqft: 3500 }), expect: { pipeline: "lidar", xcheck: "xcheck_warn_high" } },
    { name: "all_green_solar_disagree_2", lidar: lidarOk(), solar: solarOk({ horizSqft: 3600 }), expect: { pipeline: "lidar", xcheck: "xcheck_warn_high" } },
    { name: "all_green_pitch_disagree", lidar: lidarOk({ pitch: 0.333 }), solar: solarOk({ pitch: 0.833 }), expect: { pipeline: "lidar", xcheck: "xcheck_warn_high" } }, // |Δ|=0.5 > 0.333

    // 🟡 borderline + Solar agree (×3)
    { name: "borderline_solar_agree_1", lidar: lidarBorderline(), solar: solarOk(), expect: { pipeline: "lidar", xcheck: "xcheck_ok_borderline" } },
    { name: "borderline_solar_agree_2", lidar: lidarBorderline({ inlierRatio: 0.55 }), solar: solarOk(), expect: { pipeline: "lidar", xcheck: "xcheck_ok_borderline" } },
    { name: "borderline_solar_agree_3", lidar: lidarBorderline({ density: 1.5 }), solar: solarOk(), expect: { pipeline: "lidar", xcheck: "xcheck_ok_borderline" } },

    // 🟡 borderline + Solar disagree (×2)
    { name: "borderline_solar_disagree_1", lidar: lidarBorderline(), solar: solarOk({ horizSqft: 3500 }), expect: { pipeline: "lidar", xcheck: "xcheck_warn_borderline_disagree" } },
    { name: "borderline_solar_disagree_2", lidar: lidarBorderline({ pitch: 0.333 }), solar: solarOk({ pitch: 0.833 }), expect: { pipeline: "lidar", xcheck: "xcheck_warn_borderline_disagree" } },

    // 🟡 borderline + Solar unavail (×1)
    { name: "borderline_solar_unavail", lidar: lidarBorderline(), solar: solarUnavail(), expect: { pipeline: "lidar", xcheck: "xcheck_single_borderline" } },

    // 🔴 fail + Solar avail (×2)
    { name: "red_fail_solar_avail_1", lidar: lidarFail(), solar: solarOk(), expect: { pipeline: "solar", xcheck: "single_source:solar" } },
    { name: "red_fail_solar_avail_2", lidar: lidarFail({ density: 0.5 }), solar: solarOk(), expect: { pipeline: "solar", xcheck: "single_source:solar" } },

    // 🔴 fail + Solar unavail (×1) — only path that emits xcheck_fail:no_source_lidar_failed
    { name: "red_fail_solar_unavail", lidar: lidarFail(), solar: solarUnavail(), expect: { pipeline: "mode_b", xcheck: "xcheck_fail:no_source_lidar_failed" } },

    // LiDAR no-return + Solar avail (×2)
    { name: "lidar_noreturn_solar_avail_1", lidar: { outcome: "pipeline_crash", elapsedMs: 0 }, solar: solarOk(), expect: { pipeline: "solar", xcheck: "single_source:solar" } },
    { name: "lidar_noreturn_solar_avail_2", lidar: { outcome: "tnm_5xx_or_timeout", elapsedMs: 15000 }, solar: solarOk(), expect: { pipeline: "solar", xcheck: "single_source:solar" } },

    // LiDAR no-return + Solar unavail (×1)
    { name: "lidar_noreturn_solar_unavail", lidar: { outcome: "pipeline_crash", elapsedMs: 0 }, solar: solarUnavail(), expect: { pipeline: "mode_b", xcheck: "xcheck_fail:no_source" } },

    // LiDAR ok + Solar unavail (all green, solar unavail) — ×1
    { name: "green_solar_unavail", lidar: lidarOk(), solar: solarUnavail(), expect: { pipeline: "lidar", xcheck: "xcheck_ok_strong" } },
  ];
}

// ---------------------------------------------------------------------------
// Phase 1 — 20 synthetic requests with mocked flags, real writes
// ---------------------------------------------------------------------------

async function runPhase1(contractorId) {
  const results = [];
  const scs = scenarios();
  if (scs.length !== 20) {
    throw new Error(`expected 20 scenarios, got ${scs.length}`);
  }
  for (let i = 0; i < scs.length; i++) {
    const sc = scs[i];
    const adapters = {
      ...prodAdapters,
      runLidar: async () => sc.lidar,
      runSolar: async () => sc.solar,
      readFlags: async () => FLAGS_ON,
      // writeMeasurementRun stays prod — writes to real DB
    };
    const req = {
      contractorId,
      leadId: null,
      widgetEventId: null,
      address: `BM_SMOKE_${String(i + 1).padStart(2, "0")}_${sc.name}`,
      lat: 30.0 + i * 0.001,
      lng: -81.0 - i * 0.001,
    };
    const result = await runMeasurementPipeline(req, adapters);
    const pass = result.pipeline === sc.expect.pipeline && result.xcheckStatus === sc.expect.xcheck;
    results.push({
      idx: i + 1,
      name: sc.name,
      expected: sc.expect,
      actual: { pipeline: result.pipeline, xcheck: result.xcheckStatus, modeB: result.modeBTripped },
      telemetryRowId: result.telemetryRowId,
      pass,
    });
    process.stdout.write(pass ? "." : "F");
  }
  process.stdout.write("\n");
  return results;
}

// ---------------------------------------------------------------------------
// Phase 2 — live kill-switch: ON → OFF → ON with real readFlags
// ---------------------------------------------------------------------------

async function runPhase2(contractorId) {
  // Capture original global flag state to restore
  const original = await mgmtQuery(
    `select enabled from feature_flags where key = 'lidar_pipeline_global';`
  );
  const originalEnabled = original[0]?.enabled ?? false;

  const results = [];
  const sequence = [
    { set: true, label: "ON_1" },
    { set: false, label: "OFF" },
    { set: true, label: "ON_2" },
  ];

  for (const step of sequence) {
    await mgmtQuery(
      `update feature_flags set enabled = ${step.set}, updated_at = now() where key = 'lidar_pipeline_global';`
    );

    // Use REAL readFlags (hits DB), with injected LiDAR/Solar fixtures (all-🟢)
    const adapters = {
      ...prodAdapters,
      runLidar: async () => lidarOk(),
      runSolar: async () => solarOk(),
      // readFlags stays prod → real DB read
    };
    const req = {
      contractorId,
      leadId: null,
      widgetEventId: null,
      address: `BM_SMOKE_KILLSWITCH_${step.label}`,
      lat: 31.0,
      lng: -82.0,
    };
    const result = await runMeasurementPipeline(req, adapters);
    results.push({
      step: step.label,
      globalFlag: step.set,
      pipeline: result.pipeline,
      xcheck: result.xcheckStatus,
      telemetryRowId: result.telemetryRowId,
    });
  }

  // Restore original
  await mgmtQuery(
    `update feature_flags set enabled = ${originalEnabled}, updated_at = now() where key = 'lidar_pipeline_global';`
  );

  return { results, originalEnabled };
}

// ---------------------------------------------------------------------------
// Aggregate verification
// ---------------------------------------------------------------------------

async function verifyRowCounts(contractorId) {
  const rows = await mgmtQuery(
    `select xcheck_status, pipeline, count(*) as n
       from measurement_runs
      where contractor_id = '${contractorId}'
      group by xcheck_status, pipeline
      order by xcheck_status;`
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== BM CP4 smoke — contractor name: ${CONTRACTOR_NAME} ===\n`);

  const contractorId = await seedContractor();
  console.log(`Seeded contractor: ${contractorId}\n`);

  console.log("--- Phase 1: 20 synthetic branch traversal ---");
  const phase1 = await runPhase1(contractorId);
  const phase1Pass = phase1.filter((r) => r.pass).length;
  console.log(`Phase 1: ${phase1Pass}/${phase1.length} pass\n`);

  console.log("--- Phase 2: live kill-switch (ON → OFF → ON) ---");
  const phase2 = await runPhase2(contractorId);
  for (const r of phase2.results) {
    console.log(`  ${r.step} (global=${r.globalFlag}): pipeline=${r.pipeline} xcheck=${r.xcheck}`);
  }
  console.log(`Kill-switch restored to originalEnabled=${phase2.originalEnabled}\n`);

  console.log("--- Row-count verification (grouped) ---");
  const counts = await verifyRowCounts(contractorId);
  for (const c of counts) {
    console.log(`  ${c.pipeline.padEnd(8)} ${c.xcheck_status.padEnd(40)} ${c.n}`);
  }

  // Emit JSON summary for the report
  const summary = {
    shortsha: SHORTSHA,
    contractor: { id: contractorId, business_name: CONTRACTOR_NAME },
    phase1: {
      total: phase1.length,
      pass: phase1Pass,
      fail: phase1.length - phase1Pass,
      details: phase1,
    },
    phase2: phase2,
    rowCounts: counts,
  };
  const summaryPath = ".tmp/calculator-bench/bm-smoke-summary.json";
  execSync("mkdir -p .tmp/calculator-bench");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nSummary written: ${summaryPath}`);
}

main().catch((err) => {
  console.error("smoke failed:", err);
  process.exit(1);
});
