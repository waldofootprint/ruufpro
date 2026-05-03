#!/usr/bin/env node
// Riley accuracy probe runner.
// Sends a fixed set of questions to Riley across multiple test contractors,
// streams answers to a real-time CSV that the viewer.html watches.
//
// Usage:
//   node tools/riley-probe.mjs                 # run all sites, all questions
//   node tools/riley-probe.mjs --site=baker    # one site
//   node tools/riley-probe.mjs --api=local     # hit localhost:3000 instead of prod
//   node tools/riley-probe.mjs --dry           # print plan, don't call API

import { randomUUID } from "node:crypto";
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const API_BASE = args.api === "local" ? "http://localhost:3000" : "https://ruufpro.com";
const OUT_DIR = ".tmp/riley-probes";
const CSV_PATH = join(OUT_DIR, "results.csv");

const SITES = {
  suncoast: {
    id: "f0e73bee-6946-4083-985a-39cc466d8703",
    name: "SunCoast Roofing (test acct)",
    trainedOn: "strongroofingsrq.com",
    actualBusiness: "Strong Roofing — Sarasota FL",
    note: "phone+city in DB are placeholder; real site is Sarasota not Tampa",
  },
  baker: {
    id: "52d87a44-5409-4618-84d3-191bd5392e16",
    name: "Baker Roofing E2E",
    trainedOn: "bakerroofing.com",
    actualBusiness: "Baker Roofing",
  },
  bluecollar: {
    id: "fb485290-1e55-4344-b302-f0f9109edb46",
    name: "Blue Collar E2E",
    trainedOn: "bluecollarroofingflorida.com",
    actualBusiness: "Blue Collar Roofing FL",
  },
  premium: {
    id: "9fcd9ad5-5670-4850-9ee0-14bb62a99385",
    name: "Premium Roofing E2E",
    trainedOn: "premiumroofing.squarespace.com",
    actualBusiness: "Premium Roofing",
  },
};

const PROBES = [
  { category: "identity", q: "What's your phone number?" },
  { category: "identity", q: "Where are you located?" },
  { category: "identity", q: "Who owns the company?" },
  { category: "catalog",  q: "What roofing services do you offer?" },
  { category: "catalog",  q: "What roofing materials do you work with?" },
  { category: "catalog",  q: "What areas do you serve?" },
  { category: "sales",    q: "Do you give free estimates?" },
  { category: "sales",    q: "Do you offer financing?" },
  { category: "sales",    q: "What kind of warranty do you provide?" },
  { category: "sales",    q: "Do you handle insurance claims?" },
  { category: "safety",   q: "How much does a new roof cost?" },
  { category: "safety",   q: "How long does a roof replacement take?" },
];

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function ensureCsv() {
  mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(CSV_PATH)) {
    const header = [
      "timestamp",
      "site",
      "trained_on",
      "actual_business",
      "category",
      "question",
      "riley_answer",
      "elapsed_ms",
      "evaluation",
      "notes",
    ].join(",");
    writeFileSync(CSV_PATH, header + "\n");
  }
}

function appendRow(row) {
  const line = [
    row.timestamp,
    row.site,
    row.trained_on,
    row.actual_business,
    row.category,
    row.question,
    row.riley_answer,
    row.elapsed_ms,
    row.evaluation ?? "",
    row.notes ?? "",
  ].map(csvEscape).join(",");
  appendFileSync(CSV_PATH, line + "\n");
}

// Vercel AI SDK UI message stream — lines like 0:"text" or {"type":"text-delta","delta":"x"}
// We just regex out "delta":"..." segments and JSON-decode them.
function extractTextFromUiStream(raw) {
  const out = [];
  // Match "delta":"..." capturing the JSON-escaped string body
  const re = /"delta":"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    try {
      out.push(JSON.parse(`"${m[1]}"`));
    } catch {
      out.push(m[1]);
    }
  }
  return out.join("");
}

async function askRiley({ site, question }) {
  const sessionId = `${site.id}-${randomUUID()}`;
  const t0 = Date.now();
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contractorId: site.id,
      sessionId,
      messages: [{
        id: randomUUID(),
        role: "user",
        parts: [{ type: "text", text: question }],
      }],
    }),
  });
  const elapsed = Date.now() - t0;
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { answer: `[ERROR ${res.status}] ${txt.slice(0, 200)}`, elapsed };
  }
  const raw = await res.text();
  const answer = extractTextFromUiStream(raw).trim() || "[empty stream]";
  return { answer, elapsed };
}

async function main() {
  const siteKeys = args.site ? [args.site] : Object.keys(SITES);
  const invalid = siteKeys.filter((k) => !SITES[k]);
  if (invalid.length) {
    console.error(`Unknown sites: ${invalid.join(", ")}`);
    process.exit(1);
  }

  ensureCsv();
  console.log(`API base: ${API_BASE}`);
  console.log(`CSV:      ${CSV_PATH}`);
  console.log(`Sites:    ${siteKeys.join(", ")}`);
  console.log(`Probes:   ${PROBES.length}`);
  console.log(`Total:    ${siteKeys.length * PROBES.length} requests\n`);

  if (args.dry) {
    console.log("--dry mode: not calling API");
    return;
  }

  for (const key of siteKeys) {
    const site = SITES[key];
    console.log(`\n=== ${site.name} (trained on ${site.trainedOn}) ===`);
    for (const probe of PROBES) {
      process.stdout.write(`  [${probe.category}] ${probe.q} ... `);
      let result;
      try {
        result = await askRiley({ site, question: probe.q });
      } catch (err) {
        result = { answer: `[FETCH ERROR] ${err.message}`, elapsed: 0 };
      }
      appendRow({
        timestamp: new Date().toISOString(),
        site: site.name,
        trained_on: site.trainedOn,
        actual_business: site.actualBusiness,
        category: probe.category,
        question: probe.q,
        riley_answer: result.answer,
        elapsed_ms: result.elapsed,
      });
      console.log(`${result.elapsed}ms`);
      // Small pacing gap to be polite to API
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(`\nDone. Open viewer to review.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
