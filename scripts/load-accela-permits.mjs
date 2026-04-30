#!/usr/bin/env node
/**
 * Load the full Manatee Accela roof-permit CSV into the accela_roof_permits table.
 *
 * Source : .tmp/property-pipeline/accela_residential_roof_express.csv (~51k rows)
 * Target : public.accela_roof_permits
 *
 * Idempotent — UPSERT on (county, record_number).
 *
 * Usage:
 *   node scripts/load-accela-permits.mjs
 *   node scripts/load-accela-permits.mjs --dry-run
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { normalizeAddressLine } from "../lib/property-pipeline/address.mjs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const BATCH_SIZE = 500;

const ACCELA_CSV = path.resolve(
  __dirname,
  "..",
  ".tmp/property-pipeline/accela_residential_roof_express.csv"
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function parseDateMMDDYYYY(s) {
  const m = String(s ?? "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1]}-${m[2]}`;
}

async function readCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(parse({ columns: true, relax_quotes: true, skip_empty_lines: true }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function main() {
  console.log(`Reading ${ACCELA_CSV}...`);
  const rows = await readCsv(ACCELA_CSV);
  console.log(`  ${rows.length.toLocaleString()} permit rows`);

  const records = [];
  let skippedNoDate = 0;
  let skippedNoAddr = 0;

  for (const r of rows) {
    const dateIso = parseDateMMDDYYYY(r.Date);
    if (!dateIso) {
      skippedNoDate++;
      continue;
    }
    const fullAddr = String(r.Address || "").trim();
    if (!fullAddr) {
      skippedNoAddr++;
      continue;
    }
    const recordNumber = String(r["Record Number"] || "").trim();
    if (!recordNumber) continue;

    const zipMatch = fullAddr.match(/\b(\d{5})\b/);
    const zip = zipMatch ? zipMatch[1] : null;
    const normalized = normalizeAddressLine(fullAddr);

    records.push({
      county: "manatee",
      record_number: recordNumber,
      record_type: r["Record Type"] || null,
      permit_date: dateIso,
      status: r.Status || null,
      address_raw: fullAddr,
      address_normalized: normalized,
      zip,
      description: r.Description || null,
    });
  }

  // Dedupe on (county, record_number) — keep last occurrence (later rows often have richer data)
  const byKey = new Map();
  for (const rec of records) byKey.set(`${rec.county}|${rec.record_number}`, rec);
  const deduped = Array.from(byKey.values());
  console.log(
    `  parsed: ${records.length.toLocaleString()}, deduped: ${deduped.length.toLocaleString()}, skipped (no date: ${skippedNoDate}, no addr: ${skippedNoAddr})`
  );
  records.length = 0;
  records.push(...deduped);

  if (DRY_RUN) {
    console.log("DRY RUN — sample:");
    console.log(records.slice(0, 3));
    return;
  }

  let upserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("accela_roof_permits")
      .upsert(batch, { onConflict: "county,record_number" });
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error);
      process.exit(1);
    }
    upserted += batch.length;
    if (i % (BATCH_SIZE * 10) === 0) {
      console.log(`  upserted ${upserted.toLocaleString()} / ${records.length.toLocaleString()}`);
    }
  }
  console.log(`Done. Upserted ${upserted.toLocaleString()} rows.`);

  const { data: sanity, error: sErr } = await supabase
    .from("accela_roof_permits")
    .select("address_raw, permit_date, description, status")
    .ilike("address_normalized", "%8734 54TH AVE E%")
    .order("permit_date", { ascending: false })
    .limit(3);
  if (sErr) console.error("sanity check error", sErr);
  else console.log("Sanity (8734 54TH AVE E):", sanity);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
