#!/usr/bin/env node
/**
 * Backfill last_sale_year + last_roof_permit_date on property_pipeline_candidates.
 *
 * - last_sale_year : parsed from LAST_SALE_DATE in the source property CSV (per parcel_id)
 * - last_roof_permit_date : MAX(date) per address in Accela CSV, joined to candidates
 *   by address (zip + situs prefix match). Address-only because the Accela
 *   export does not carry a parcel id.
 *
 * Usage:
 *   node scripts/backfill-pp-signals.mjs
 *   node scripts/backfill-pp-signals.mjs --dry-run
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
const flag = (k) => argv.includes(k);
const DRY_RUN = flag("--dry-run");
const BATCH_SIZE = 500;

const PROPERTY_CSV = path.resolve(
  __dirname,
  "..",
  ".tmp/property-pipeline/mvp_candidate_universe_FINAL.csv"
);
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
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function parseDateMMDDYYYY(s) {
  const m = (s || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

async function readCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function main() {
  console.log(DRY_RUN ? "🟡 DRY RUN" : "🟢 LIVE");

  // ---- Pass 1: build sale-year map from property CSV (keyed by parcel_id) ----
  console.log(`Reading ${PROPERTY_CSV}...`);
  const propRows = await readCsv(PROPERTY_CSV);
  console.log(`  ${propRows.length.toLocaleString()} property rows`);

  // parcel_id -> sale_year, also build addr_key -> parcel_id for permit join
  const saleYearByParcel = new Map();
  const parcelByAddrKey = new Map(); // "ZIP|NORM_SITUS" -> parcel_id
  let dupeAddrKeys = 0;

  for (const r of propRows) {
    const parcelId = String(r.PARID).trim();
    const iso = parseDateMMDDYYYY(r.LAST_SALE_DATE);
    if (iso) saleYearByParcel.set(parcelId, Number(iso.slice(0, 4)));

    const zip = String(r.SITUS_POSTAL_ZIP || "").trim();
    const situs = normalizeAddressLine(r.SITUS_ADDRESS);
    if (zip && situs) {
      const key = `${zip}|${situs}`;
      if (parcelByAddrKey.has(key)) dupeAddrKeys++;
      else parcelByAddrKey.set(key, parcelId);
    }
  }
  console.log(`  sale_year map: ${saleYearByParcel.size.toLocaleString()}`);
  console.log(`  addr→parcel map: ${parcelByAddrKey.size.toLocaleString()} (skipped ${dupeAddrKeys} dupes)`);

  // ---- Pass 2: build permit-date map from Accela CSV ----
  console.log(`Reading ${ACCELA_CSV}...`);
  const permitRows = await readCsv(ACCELA_CSV);
  console.log(`  ${permitRows.length.toLocaleString()} permit rows`);

  // parcel_id -> max ISO date
  const permitDateByParcel = new Map();
  let matched = 0;
  let unmatched = 0;
  let nonIssued = 0;

  for (const r of permitRows) {
    const status = String(r.Status || "").trim();
    if (status && !/issued/i.test(status) && !/finaled/i.test(status) && !/closed/i.test(status)) {
      nonIssued++;
      continue;
    }
    const dateIso = parseDateMMDDYYYY(r.Date);
    if (!dateIso) continue;

    const fullAddr = String(r.Address || "").trim();
    if (!fullAddr) continue;

    // Trailing 5-digit zip
    const zipMatch = fullAddr.match(/\b(\d{5})\b/);
    if (!zipMatch) {
      unmatched++;
      continue;
    }
    const zip = zipMatch[1];
    const beforeZip = normalizeAddressLine(fullAddr.slice(0, fullAddr.indexOf(zipMatch[0])));

    // Try progressively longer suffix-strips for the city word(s).
    // Most Manatee cities are 1 word (BRADENTON, PALMETTO, ELLENTON, PARRISH);
    // a few are 2 (HOLMES BEACH, ANNA MARIA, BRADENTON BEACH, LONGBOAT KEY).
    let parcelId = null;
    const tokens = beforeZip.split(" ").filter(Boolean);
    for (const tail of [1, 2, 3]) {
      if (tokens.length <= tail) break;
      const situsTry = tokens.slice(0, tokens.length - tail).join(" ");
      const key = `${zip}|${situsTry}`;
      if (parcelByAddrKey.has(key)) {
        parcelId = parcelByAddrKey.get(key);
        break;
      }
    }
    if (!parcelId) {
      unmatched++;
      continue;
    }

    matched++;
    const prev = permitDateByParcel.get(parcelId);
    if (!prev || prev < dateIso) permitDateByParcel.set(parcelId, dateIso);
  }
  console.log(
    `  permits matched: ${matched.toLocaleString()}, unmatched: ${unmatched.toLocaleString()}, non-issued: ${nonIssued.toLocaleString()}`
  );
  console.log(`  permit_date map: ${permitDateByParcel.size.toLocaleString()} unique parcels`);

  // ---- Pass 3: write to DB ----
  const candidateUpdates = [];
  const allParcels = new Set([...saleYearByParcel.keys(), ...permitDateByParcel.keys()]);
  for (const pid of allParcels) {
    const update = { parcel_id: pid };
    if (saleYearByParcel.has(pid)) update.last_sale_year = saleYearByParcel.get(pid);
    if (permitDateByParcel.has(pid)) update.last_roof_permit_date = permitDateByParcel.get(pid);
    candidateUpdates.push(update);
  }
  console.log(`Will update ${candidateUpdates.length.toLocaleString()} candidate rows`);

  if (DRY_RUN) {
    console.log("Sample updates:");
    for (const u of candidateUpdates.slice(0, 5)) console.log("  ", u);
    return;
  }

  // Use the pp_apply_signals RPC for batched UPDATE-only writes (upsert path
  // would fire NOT NULL on insert side even when the row already exists).
  let written = 0;
  for (let i = 0; i < candidateUpdates.length; i += BATCH_SIZE) {
    const slice = candidateUpdates.slice(i, i + BATCH_SIZE).map((u) => ({
      parcel_id: u.parcel_id,
      last_sale_year: u.last_sale_year ?? null,
      last_roof_permit_date: u.last_roof_permit_date ?? null,
    }));
    const { data, error } = await supabase.rpc("pp_apply_signals", { payload: slice });
    if (error) {
      console.error(`Batch starting at ${i} FAILED:`, error.message);
      process.exit(1);
    }
    written += slice.length;
    if (written % 5000 === 0 || written === candidateUpdates.length) {
      console.log(
        `  wrote batch (${slice.length}); cumulative ${written.toLocaleString()} / ${candidateUpdates.length.toLocaleString()} (rpc rowcount: ${data})`
      );
    }
  }
  console.log(`✅ Done. ${written.toLocaleString()} rows updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
