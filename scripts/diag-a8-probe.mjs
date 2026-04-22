#!/usr/bin/env node
/**
 * Track A.8-diag — probe harness for hypothesis enumeration H1–H8.
 * Scoping doc: decisions/track-a8-diag-scoping.md §3.4.
 *
 * Measurement-only. No Pipeline A edits. No Modal redeploys. No timeout changes.
 *
 * Modes:
 *   --mode=probe1        5× Brighton + 5× Dunedin direct to Modal URL, 10s spacing (H7)
 *   --mode=probe2A       Order A: Brighton, Ernest, Tall Pines via --base/api/estimate (Brighton 1st)
 *   --mode=probe2B       Order B: Ernest, Tall Pines, Brighton via --base/api/estimate (Brighton 3rd)
 *   --mode=probe4        3× Brighton direct Modal + 3× Brighton via --base/api/estimate (H5)
 *
 * Env:
 *   LIDAR_MEASURE_URL        Modal URL (required for probe1, probe4-direct)
 *   NEXT_PUBLIC_GOOGLE_MAPS_KEY or GOOGLE_MAPS_API_KEY   geocode key
 *   A8_DIAG_BASE             /api/estimate base (default http://localhost:3000) for probe2/4-routed
 *   A8_DIAG_CONTRACTOR_ID    contractor_id for /api/estimate payload
 *
 * Output: writes JSONL to .tmp/a8-diag/<mode>-<iso>.jsonl + summary to stdout.
 */
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";

const ADDRESSES = {
  brighton: "10632 Brighton Hill Cir S, Jacksonville, FL 32256",
  ernest: "1823 Ernest St, Jacksonville, FL 32204",
  tallpines: "2306 Tall Pines Way, Lutz, FL 33558",
  dunedin: "2501 Main St, Dunedin, FL 34698",
};

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { mode: null, base: null, spacing: 10 };
  for (const a of argv) {
    if (a.startsWith("--mode=")) out.mode = a.slice("--mode=".length);
    else if (a.startsWith("--base=")) out.base = a.slice("--base=".length);
    else if (a.startsWith("--spacing=")) out.spacing = Number(a.slice("--spacing=".length));
  }
  if (!out.mode) throw new Error("--mode=probe1|probe2A|probe2B|probe4 required");
  return out;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(address) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_KEY required");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geocode ${r.status}`);
  const j = await r.json();
  if (j.status !== "OK" || !j.results?.length) throw new Error(`geocode status=${j.status}`);
  const loc = j.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

async function callModalDirect(url, lat, lng, address) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat, lng, address }),
    });
    const wall_ms = Date.now() - t0;
    const text = await r.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 400) }; }
    return {
      wall_ms,
      http_status: r.status,
      outcome: body?.outcome ?? null,
      fetchPath: body?.fetchPath ?? null,
      fetchCollection: body?.fetchCollection ?? null,
      elapsedMs: body?.elapsedMs ?? null,
      horizSqft: body?.horizSqft ?? null,
      segmentCount: body?.segmentCount ?? null,
      response_preview: JSON.stringify(body).slice(0, 300),
    };
  } catch (err) {
    return { wall_ms: Date.now() - t0, http_status: null, error: String(err) };
  }
}

async function callEstimateRouted(base, contractorId, lat, lng, address) {
  const t0 = Date.now();
  const payload = {
    contractor_id: contractorId,
    address,
    lat,
    lng,
    pitch_category: "moderate",
    current_material: "asphalt",
    shingle_layers: "not_sure",
    timeline: "1-3 months",
    financing_interest: "no",
  };
  try {
    const r = await fetch(`${base}/api/estimate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const wall_ms = Date.now() - t0;
    const text = await r.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 400) }; }
    const asphalt = (body?.estimates || []).find((e) => e.material === "asphalt");
    return {
      wall_ms,
      http_status: r.status,
      error_code: body?.error_code ?? null,
      error: body?.error ?? null,
      pipeline_hint: body?.pipeline ?? null,
      sqft: asphalt?.roof_area_sqft ?? null,
      is_satellite: asphalt?.is_satellite ?? null,
      response_preview: JSON.stringify(body).slice(0, 300),
    };
  } catch (err) {
    return { wall_ms: Date.now() - t0, http_status: null, error: String(err) };
  }
}

function outPath(mode) {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  const p = path.join(process.cwd(), ".tmp", "a8-diag", `${mode}-${iso}.jsonl`);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

function appendJsonl(p, obj) {
  fs.appendFileSync(p, JSON.stringify(obj) + "\n");
}

// -----------------------------------------------------------------------------
// Probe 1: 5× Brighton + 5× Dunedin direct to Modal, 10s spacing.
// -----------------------------------------------------------------------------

async function probe1(spacing) {
  const url = process.env.LIDAR_MEASURE_URL;
  if (!url) throw new Error("LIDAR_MEASURE_URL required for probe1");
  const logPath = outPath("probe1");
  console.log(`[probe1] Modal=${url}`);
  console.log(`[probe1] spacing=${spacing}s`);
  console.log(`[probe1] log=${logPath}\n`);

  const targets = ["brighton", "dunedin"];
  const results = {};
  for (const t of targets) {
    results[t] = [];
    const addr = ADDRESSES[t];
    const { lat, lng } = await geocode(addr);
    console.log(`[probe1] ${t}: ${addr} @ ${lat},${lng}`);
    for (let n = 1; n <= 5; n++) {
      const res = await callModalDirect(url, lat, lng, addr);
      const rec = { probe: "probe1", target: t, attempt_n: n, addr, lat, lng, ...res, ts: new Date().toISOString() };
      appendJsonl(logPath, rec);
      results[t].push(rec);
      const tag = res.outcome ?? `HTTP_${res.http_status}` ?? "err";
      console.log(`  [${t} #${n}] ${tag}  wall=${res.wall_ms}ms  fetch=${res.fetchPath ?? "-"}`);
      if (n < 5) await sleep(spacing * 1000);
    }
    console.log("");
  }

  console.log("=".repeat(80));
  console.log("Probe 1 summary (H7 test — deterministic crash if 5/5 fail):");
  for (const t of targets) {
    const rows = results[t];
    const crashN = rows.filter((r) => r.outcome === "pipeline_crash" || (r.http_status && r.http_status >= 500)).length;
    const okN = rows.filter((r) => r.outcome === "ok").length;
    const otherN = rows.length - crashN - okN;
    console.log(`  ${t}: crash=${crashN}/5  ok=${okN}/5  other=${otherN}/5`);
    console.log(`         walls=[${rows.map((r) => r.wall_ms).join(", ")}]ms`);
  }
  console.log(`\nLog: ${logPath}`);
}

// -----------------------------------------------------------------------------
// Probe 2: address-order swap via /api/estimate (A=Brighton 1st, B=Brighton 3rd).
// -----------------------------------------------------------------------------

async function probe2(mode) {
  const base = process.env.A8_DIAG_BASE || "http://localhost:3000";
  const contractorId = process.env.A8_DIAG_CONTRACTOR_ID || "df6dd65e-a2b0-4c1a-bbf6-e94deec5dc1f";
  const orderA = ["brighton", "ernest", "tallpines"];
  const orderB = ["ernest", "tallpines", "brighton"];
  const order = mode === "probe2A" ? orderA : orderB;
  const logPath = outPath(mode);
  console.log(`[${mode}] base=${base}`);
  console.log(`[${mode}] order=${order.join(", ")}`);
  console.log(`[${mode}] log=${logPath}\n`);

  const rows = [];
  for (let i = 0; i < order.length; i++) {
    const t = order[i];
    const addr = ADDRESSES[t];
    const { lat, lng } = await geocode(addr);
    const res = await callEstimateRouted(base, contractorId, lat, lng, addr);
    const rec = { probe: mode, target: t, position: i + 1, addr, lat, lng, ...res, ts: new Date().toISOString() };
    appendJsonl(logPath, rec);
    rows.push(rec);
    const tag = res.http_status === 200 ? `sqft=${res.sqft} sat=${res.is_satellite}` : (res.error_code || `HTTP_${res.http_status}`);
    console.log(`  [${mode} pos=${i + 1} ${t}] ${tag}  wall=${res.wall_ms}ms`);
  }
  console.log("");
  console.log(`Log: ${logPath}`);
}

// -----------------------------------------------------------------------------
// Probe 4: direct Modal vs /api/estimate-routed delta (3× each on Brighton).
// -----------------------------------------------------------------------------

async function probe4() {
  const url = process.env.LIDAR_MEASURE_URL;
  const base = process.env.A8_DIAG_BASE || "http://localhost:3000";
  const contractorId = process.env.A8_DIAG_CONTRACTOR_ID || "df6dd65e-a2b0-4c1a-bbf6-e94deec5dc1f";
  if (!url) throw new Error("LIDAR_MEASURE_URL required for probe4");
  const logPath = outPath("probe4");
  const addr = ADDRESSES.brighton;
  const { lat, lng } = await geocode(addr);
  console.log(`[probe4] Modal=${url}`);
  console.log(`[probe4] base=${base}`);
  console.log(`[probe4] addr=${addr} @ ${lat},${lng}`);
  console.log(`[probe4] log=${logPath}\n`);

  const direct = [];
  const routed = [];
  for (let n = 1; n <= 3; n++) {
    const r = await callModalDirect(url, lat, lng, addr);
    const rec = { probe: "probe4", path: "direct", attempt_n: n, addr, lat, lng, ...r, ts: new Date().toISOString() };
    appendJsonl(logPath, rec);
    direct.push(rec);
    console.log(`  [direct #${n}] ${r.outcome ?? `HTTP_${r.http_status}`}  wall=${r.wall_ms}ms  fetch=${r.fetchPath ?? "-"}`);
    await sleep(5000);
  }
  console.log("");
  for (let n = 1; n <= 3; n++) {
    const r = await callEstimateRouted(base, contractorId, lat, lng, addr);
    const rec = { probe: "probe4", path: "routed", attempt_n: n, addr, lat, lng, ...r, ts: new Date().toISOString() };
    appendJsonl(logPath, rec);
    routed.push(rec);
    const tag = r.http_status === 200 ? `sqft=${r.sqft} sat=${r.is_satellite}` : (r.error_code || `HTTP_${r.http_status}`);
    console.log(`  [routed #${n}] ${tag}  wall=${r.wall_ms}ms`);
    await sleep(5000);
  }
  console.log("");
  console.log("=".repeat(80));
  console.log("Probe 4 summary (H5 test — gap between direct and routed):");
  console.log(`  direct walls=[${direct.map((r) => r.wall_ms).join(", ")}]ms  outcomes=[${direct.map((r) => r.outcome ?? "err").join(", ")}]`);
  console.log(`  routed walls=[${routed.map((r) => r.wall_ms).join(", ")}]ms  sats=[${routed.map((r) => r.is_satellite ?? "null").join(", ")}]  codes=[${routed.map((r) => r.error_code ?? r.http_status).join(", ")}]`);
  console.log(`\nLog: ${logPath}`);
}

async function main() {
  const args = parseArgs();
  switch (args.mode) {
    case "probe1": await probe1(args.spacing); break;
    case "probe2A":
    case "probe2B": await probe2(args.mode); break;
    case "probe4": await probe4(); break;
    default: throw new Error(`unknown mode ${args.mode}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
