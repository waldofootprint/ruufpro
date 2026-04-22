#!/usr/bin/env node
/**
 * Track A.3 smoke test — 5 FL addresses through the Modal LiDAR service.
 * Track A.10 update — adds fetch_path column + mode flag for §9 Gate 1/2.
 *
 * Usage:
 *   LIDAR_MEASURE_URL=https://...modal.run GOOGLE_MAPS_API_KEY=... \
 *     node scripts/smoke-lidar-modal.mjs [--mode=normal|tnm-off|ept-off]
 *
 *   --mode=normal   default. Both paths live.
 *   --mode=tnm-off  Gate 1. Sets debug_skip_tnm=true; EPT must carry.
 *   --mode=ept-off  Gate 2. Sets debug_skip_ept=true; TNM must carry.
 *
 * Exit code: 0 if all 5 return a valid LidarResult or a real outcome code
 * (outcome ∈ {ok, tnm_5xx_or_timeout, laz_download_failed, no_class_6,
 * no_footprint_lidar}). Non-zero on any `pipeline_crash` or HTTP error.
 */
/* eslint-disable no-console */

const ADDRESSES = [
  "10632 Brighton Hill Cir S, Jacksonville, FL 32256",
  "1823 Ernest St, Jacksonville, FL 32204",
  "24 Deer Haven Dr, Ponte Vedra, FL 32082",
  "3301 Bayshore Blvd, Tampa, FL 33629",
  "2501 Main St, Dunedin, FL 34698",
];

const VALID_OUTCOMES = new Set([
  "ok",
  "tnm_5xx_or_timeout",
  "laz_download_failed",
  "no_class_6",
  "no_footprint_lidar",
]);

function parseArgs() {
  const args = { mode: "normal" };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--mode=")) args.mode = a.slice("--mode=".length);
  }
  if (!["normal", "tnm-off", "ept-off"].includes(args.mode)) {
    throw new Error(`invalid --mode=${args.mode}`);
  }
  return args;
}

function modeToFlags(mode) {
  if (mode === "tnm-off") return { debug_skip_tnm: true };
  if (mode === "ept-off") return { debug_skip_ept: true };
  return {};
}

async function geocode(address, key) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geocode ${r.status}`);
  const j = await r.json();
  if (j.status !== "OK" || !j.results?.length) {
    throw new Error(`geocode status=${j.status}`);
  }
  const loc = j.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

async function measure(url, body) {
  const t0 = Date.now();
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const elapsedMs = Date.now() - t0;
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return { httpError: r.status, text: text.slice(0, 200), elapsedMs };
  }
  const j = await r.json();
  return { ...j, httpElapsedMs: elapsedMs };
}

async function main() {
  const args = parseArgs();
  const url = process.env.LIDAR_MEASURE_URL;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!url) throw new Error("LIDAR_MEASURE_URL required");
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY required");

  const flags = modeToFlags(args.mode);
  console.log(`[smoke-lidar-modal] target: ${url}`);
  console.log(`[smoke-lidar-modal] mode:   ${args.mode}`);
  console.log(`[smoke-lidar-modal] flags:  ${JSON.stringify(flags)}`);
  console.log(`[smoke-lidar-modal] addrs:  ${ADDRESSES.length}`);
  console.log("");

  const rows = [];
  for (const addr of ADDRESSES) {
    process.stdout.write(`→ ${addr}\n`);
    try {
      const { lat, lng } = await geocode(addr, key);
      const res = await measure(url, { lat, lng, address: addr, ...flags });
      rows.push({ addr, lat, lng, res });
      const tag = res.httpError
        ? `HTTP_${res.httpError}`
        : (res.outcome ?? "no_outcome");
      const horiz = res.horizSqft != null ? `${Math.round(res.horizSqft)}sqft` : "-";
      const seg = res.segmentCount != null ? `${res.segmentCount}seg` : "-";
      const fp = res.fetchPath ?? "-";
      const coll = res.fetchCollection ?? "-";
      const ms = res.elapsedMs ?? res.httpElapsedMs;
      console.log(`   ${tag}  ${horiz}  ${seg}  fetch=${fp}  coll=${coll}  ${ms}ms`);
    } catch (e) {
      rows.push({ addr, error: String(e) });
      console.log(`   ERROR ${e}`);
    }
    console.log("");
  }

  console.log("=".repeat(80));
  console.log(`Smoke summary (mode=${args.mode}):`);
  console.log("=".repeat(80));
  let pass = 0;
  let fail = 0;
  let okViaEpt = 0;
  let okViaTnm = 0;
  for (const row of rows) {
    if (row.error) {
      fail++;
      console.log(`  ✗ ${row.addr} — ${row.error}`);
      continue;
    }
    const r = row.res;
    if (r.httpError) {
      fail++;
      console.log(`  ✗ ${row.addr} — HTTP ${r.httpError}`);
      continue;
    }
    const outcome = r.outcome;
    if (outcome === "pipeline_crash") {
      fail++;
      console.log(`  ✗ ${row.addr} — pipeline_crash fetch=${r.fetchPath ?? "-"}`);
      continue;
    }
    if (!VALID_OUTCOMES.has(outcome)) {
      fail++;
      console.log(`  ✗ ${row.addr} — invalid outcome '${outcome}'`);
      continue;
    }
    pass++;
    if (outcome === "ok") {
      if ((r.fetchPath ?? "").startsWith("ept") && !(r.fetchPath ?? "").includes("->tnm")) okViaEpt++;
      if ((r.fetchPath ?? "").includes("tnm") && !(r.fetchPath ?? "").startsWith("ept_ok")) okViaTnm++;
    }
    const horiz = r.horizSqft != null ? ` horiz=${Math.round(r.horizSqft)}sqft` : "";
    console.log(`  ✓ ${row.addr} — ${outcome} fetch=${r.fetchPath ?? "-"}${horiz} ${r.elapsedMs}ms`);
  }
  console.log("");
  console.log(`Result: ${pass}/${rows.length} pass, ${fail}/${rows.length} fail`);
  console.log(`ok_via_ept=${okViaEpt}  ok_via_tnm=${okViaTnm}`);
  console.log(JSON.stringify({ mode: args.mode, rows }, null, 2));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
