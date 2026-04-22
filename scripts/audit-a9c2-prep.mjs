#!/usr/bin/env node
// Track A.9-class-2-prep accuracy audit.
//
// Per decisions/track-a9-class-2-prep-accuracy-audit-scoping.md §4.
//
// Reads:
//   - Floor-off bench CSV (RuufPro $ mid + horiz sqft)
//   - scripts/bench-addresses.json (gate_2_target_mid + quality flags)
//   - Hardcoded Roofr sqft + quality extracted from .tmp/calculator-bench/d2-reference.html
//
// Produces:
//   - Markdown comparison table + verdict
//   - One-line verdict: 🟢 GO / 🔴 NO-GO / 🟡 BORDERLINE
//
// Denominator = 5 (Q3-B: Brighton, Ernest, Tall Pines, Tamiami, Mountain Lake)
// Threshold = ≥4/5 within ±15% of gate_2_target_mid (Q2-B)
// For gate_2_target=either (Mountain Lake): pass if within ±15% of Roofle OR Roofr demo_mid.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
function arg(flag, fallback) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
}

const BENCH_CSV = arg("--csv", path.join(__dirname, "..", ".tmp", "calculator-bench", "v4-bench-a9c2-prep-floor-off.csv"));
const FIXTURE = arg("--fixture", path.join(__dirname, "bench-addresses.json"));
const OUT = arg("--out", path.join(__dirname, "..", ".tmp", "calculator-bench", "audit-a9c2-prep.md"));

// Q3-B denominator: 5 non-refused, Bohannon dropped.
const DENOM_IDS = [1, 2, 4, 6, 7];
const BOHANNON_ID = 9;
const ENVELOPE_PCT = 15;
const PASS_THRESHOLD = 4;

// Roofr sqft + quality per d2-reference.html master grid (line refs embedded for audit trail).
// Green-only qualifies for sidebar cross-check per Q1 resolution.
const ROOFR_SQFT = {
  1: { sqft: 7803, quality: "yellow", note: "multi_structure_summing_2_buildings (d2-ref line 203)" },
  2: { sqft: 5675, quality: "yellow", note: "d2-ref line 226" },
  4: { sqft: 7456, quality: "red", note: "multi_structure_summing_3_buildings (d2-ref line 272)" },
  6: { sqft: 3978, quality: "yellow", note: "possible_under_measurement_plane_miss (d2-ref line 318)" },
  7: { sqft: 4704, quality: "green", note: "d2-ref line 341" },
  9: { sqft: 12586, quality: "red", note: "neighboring_home_aggregation_3_homes (d2-ref line 387)" },
};

// ---------- Load inputs ----------

const fixture = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
const fixtureById = new Map(fixture.addresses.map((a) => [a.id, a]));

const csvText = fs.readFileSync(BENCH_CSV, "utf8");
const csvLines = csvText.trim().split("\n");
const headers = csvLines[0].split(",");
function parseCsvRow(line) {
  // Handle quoted fields with commas
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
const csvById = new Map();
for (let i = 1; i < csvLines.length; i++) {
  const parts = parseCsvRow(csvLines[i]);
  const row = Object.fromEntries(headers.map((h, idx) => [h, parts[idx]]));
  csvById.set(Number(row.id), row);
}

// ---------- Compute deltas ----------

function pctDelta(actual, target) {
  if (!actual || !target) return null;
  return ((actual - target) / target) * 100;
}

function evaluateRow(id) {
  const fix = fixtureById.get(id);
  const csv = csvById.get(id);
  if (!fix || !csv) return { id, error: "missing_data" };

  const status = csv.status;
  const ruufMid = Number(csv.v4_mid) || null;
  const ruufSqft = Number(csv.sqft) || null;

  if (status !== "ok") {
    return { id, address: fix.address, status, ruufMid: null, ruufSqft: null, refusal: csv.trip_reason };
  }

  const gateTarget = fix.gate_2_target;
  let targetMid = null;
  let targetLabel = "";
  let inEnvelope = false;
  let deltaPct = null;

  if (gateTarget === "either") {
    // OR-rule: pass if within envelope of Roofle OR Roofr demo_mid.
    const rLe = fix.roofle_demo_mid;
    const rRo = fix.roofr_demo_mid;
    const dLe = pctDelta(ruufMid, rLe);
    const dRo = pctDelta(ruufMid, rRo);
    const passLe = dLe !== null && Math.abs(dLe) <= ENVELOPE_PCT;
    const passRo = dRo !== null && Math.abs(dRo) <= ENVELOPE_PCT;
    inEnvelope = passLe || passRo;
    // Report the tighter one (for narrative)
    if (dLe !== null && dRo !== null) {
      if (Math.abs(dLe) <= Math.abs(dRo)) { deltaPct = dLe; targetMid = rLe; targetLabel = "roofle(OR)"; }
      else { deltaPct = dRo; targetMid = rRo; targetLabel = "roofr(OR)"; }
    }
  } else {
    targetMid = fix.gate_2_target_mid;
    targetLabel = gateTarget;
    deltaPct = pctDelta(ruufMid, targetMid);
    inEnvelope = deltaPct !== null && Math.abs(deltaPct) <= ENVELOPE_PCT;
  }

  return {
    id,
    address: fix.address,
    status,
    ruufMid,
    ruufSqft,
    gateTarget: targetLabel,
    targetMid,
    deltaPct,
    inEnvelope,
    roofleDemoMid: fix.roofle_demo_mid,
    roofleQuality: fix.roofle_demo_quality,
    roofrDemoMid: fix.roofr_demo_mid,
    roofrQuality: fix.roofr_demo_quality,
  };
}

const denomResults = DENOM_IDS.map(evaluateRow);
const bohannonResult = evaluateRow(BOHANNON_ID);

const passes = denomResults.filter((r) => r.inEnvelope).length;
const denom = denomResults.length;

let verdict;
if (passes >= PASS_THRESHOLD) verdict = "🟢 GO — class-2 worth scoping";
else if (passes === PASS_THRESHOLD - 1) verdict = "🟡 BORDERLINE — 1 short; raw-sqft sidebar may clarify";
else verdict = "🔴 NO-GO — class-2 parked pending measurement investigation";

// ---------- Roofr-sqft sidebar (green-only) ----------

const sqftSidebar = [];
for (const id of DENOM_IDS) {
  const r = denomResults.find((x) => x.id === id);
  const meta = ROOFR_SQFT[id];
  if (!r || r.status !== "ok" || !meta) continue;
  if (meta.quality === "green") {
    const d = pctDelta(r.ruufSqft, meta.sqft);
    sqftSidebar.push({ id, address: r.address, ruufSqft: r.ruufSqft, roofrSqft: meta.sqft, deltaPct: d, included: true });
  } else {
    sqftSidebar.push({ id, address: r.address, ruufSqft: r.ruufSqft, roofrSqft: meta.sqft, quality: meta.quality, note: meta.note, included: false });
  }
}

// ---------- Distributional stats (denominator only, ok-only) ----------

const okDeltas = denomResults.filter((r) => r.deltaPct !== null).map((r) => Math.abs(r.deltaPct));
const median = okDeltas.length ? (() => {
  const s = [...okDeltas].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
})() : null;
const max = okDeltas.length ? Math.max(...okDeltas) : null;
const over25 = okDeltas.filter((d) => d > 25).length;

// ---------- Emit markdown ----------

function fmt$(n) { return n == null ? "—" : `$${Math.round(n).toLocaleString()}`; }
function fmtPct(n) { return n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`; }
function fmtSqft(n) { return n == null ? "—" : `${Math.round(n).toLocaleString()}`; }

const lines = [];
lines.push(`# Audit — Track A.9-class-2-prep (floor-off)`);
lines.push("");
lines.push(`**Verdict:** ${verdict}`);
lines.push(`**Denominator:** ${passes} / ${denom} within ±${ENVELOPE_PCT}% (threshold ≥${PASS_THRESHOLD}/${denom})`);
lines.push("");
lines.push(`**Bench CSV:** \`${path.relative(process.cwd(), BENCH_CSV)}\``);
lines.push(`**Fixture:** \`${path.relative(process.cwd(), FIXTURE)}\` (v${fixture._schema_version})`);
lines.push("");
lines.push(`## §2. Comparison table (denominator = ${denom}, Bohannon dropped per Q3-B)`);
lines.push("");
lines.push("| # | Address | Status | RuufPro $mid (floor-off) | RuufPro sqft | gate_2_target | Target $mid | Δ% | ±15% |");
lines.push("|---|---|---|---|---|---|---|---|---|");
for (const r of denomResults) {
  if (r.status !== "ok") {
    lines.push(`| ${r.id} | ${r.address} | **${r.status}** | — | — | — | — | — | — |`);
    continue;
  }
  lines.push(`| ${r.id} | ${r.address} | ok | ${fmt$(r.ruufMid)} | ${fmtSqft(r.ruufSqft)} | ${r.gateTarget} | ${fmt$(r.targetMid)} | ${fmtPct(r.deltaPct)} | ${r.inEnvelope ? "✅" : "❌"} |`);
}
lines.push("");
lines.push(`## §3. Per-address narrative (🔴 / borderline)`);
lines.push("");
for (const r of denomResults) {
  if (r.status !== "ok") {
    lines.push(`- **#${r.id} ${r.address}** — RuufPro status \`${r.status}\` (${r.refusal || "no reason"}). Cannot evaluate measurement envelope.`);
  } else if (!r.inEnvelope) {
    const absD = Math.abs(r.deltaPct).toFixed(1);
    lines.push(`- **#${r.id} ${r.address}** — ${fmtPct(r.deltaPct)} vs ${r.gateTarget} target (${absD}% off envelope). Roofle=${fmt$(r.roofleDemoMid)} (${r.roofleQuality}), Roofr=${fmt$(r.roofrDemoMid)} (${r.roofrQuality}).`);
  }
}
lines.push("");
lines.push(`## §4. Distributional stats (n=${okDeltas.length} ok rows)`);
lines.push("");
lines.push(`- **Median |Δ%|:** ${median !== null ? median.toFixed(1) + "%" : "—"}`);
lines.push(`- **Max |Δ%|:** ${max !== null ? max.toFixed(1) + "%" : "—"}`);
lines.push(`- **Count |Δ%| > 25%:** ${over25}`);
lines.push("");
lines.push(`## §5. Bohannon sidebar (flagged, NOT counted in verdict)`);
lines.push("");
if (bohannonResult.status !== "ok") {
  lines.push(`- Status: \`${bohannonResult.status}\``);
} else {
  // Bohannon has gate_2_target="REMOVED"; compute deltas vs both competitor demo_mids for visibility.
  const dLe = pctDelta(bohannonResult.ruufMid, bohannonResult.roofleDemoMid);
  const dRo = pctDelta(bohannonResult.ruufMid, bohannonResult.roofrDemoMid);
  lines.push(`- RuufPro $mid floor-off: ${fmt$(bohannonResult.ruufMid)}, sqft: ${fmtSqft(bohannonResult.ruufSqft)}`);
  lines.push(`- Roofle DEMO 🔴 (lanai over-capture): ${fmt$(bohannonResult.roofleDemoMid)} → Δ ${fmtPct(dLe)}`);
  lines.push(`- Roofr DEMO 🔴 (3-home aggregation): ${fmt$(bohannonResult.roofrDemoMid)} → Δ ${fmtPct(dRo)}`);
  lines.push(`- Both competitors 🔴 per d2 policy — not usable as verdict input.`);
}
lines.push("");
lines.push(`## §6. Roofr sqft sidebar (green-quality only, measurement-to-measurement)`);
lines.push("");
lines.push("| # | Address | RuufPro sqft | Roofr sqft | Δ% | Notes |");
lines.push("|---|---|---|---|---|---|");
for (const s of sqftSidebar) {
  if (s.included) {
    lines.push(`| ${s.id} | ${s.address} | ${fmtSqft(s.ruufSqft)} | ${fmtSqft(s.roofrSqft)} | ${fmtPct(s.deltaPct)} | green |`);
  } else {
    lines.push(`| ${s.id} | ${s.address} | ${fmtSqft(s.ruufSqft)} | ${fmtSqft(s.roofrSqft)} | excluded | ${s.quality} — ${s.note} |`);
  }
}
lines.push("");
lines.push(`## §7. Threshold logic`);
lines.push("");
lines.push(`- Q1 = A + Roofr-sqft sidebar (floor-off $ primary; sqft secondary, green-only).`);
lines.push(`- Q2 = B: ≥${PASS_THRESHOLD}/${denom} within ±${ENVELOPE_PCT}% of gate_2_target_mid.`);
lines.push(`- Q3 = B: Bohannon dropped (denom=${denom}).`);
lines.push(`- \`gate_2_target=either\` passes on Roofle OR Roofr (per d2 policy §OR-gate).`);
lines.push("");

fs.writeFileSync(OUT, lines.join("\n") + "\n");
console.log(`\n→ ${OUT}`);
console.log(`\n${verdict}`);
console.log(`Denominator: ${passes} / ${denom} within ±${ENVELOPE_PCT}%\n`);
for (const r of denomResults) {
  if (r.status === "ok") {
    console.log(`  #${r.id} ${r.inEnvelope ? "✅" : "❌"} ${fmtPct(r.deltaPct)} vs ${r.gateTarget} ($mid ${fmt$(r.ruufMid)} vs ${fmt$(r.targetMid)})`);
  } else {
    console.log(`  #${r.id} ⚠️  ${r.status}`);
  }
}
