#!/usr/bin/env node
// Generate QR code images for direct mail outreach.
// Each QR code points to a prospect's RuufPro preview site.
//
// Usage:
//   node tools/generate-qr-codes.mjs --batch-id <id>         # QR codes for a specific batch
//   node tools/generate-qr-codes.mjs --prospect-ids id1,id2  # QR codes for specific prospects
//   node tools/generate-qr-codes.mjs --top 25                # Top 25 NFC-scored prospects across all batches
//
// Output: .tmp/direct-mail/qr/{card_number}_{business_slug}.png

import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = "https://ruufpro.com";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars. Source .env.local first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const outputDir = resolve(".tmp/direct-mail/qr");

// Parse args
const args = process.argv.slice(2);
const batchId = args.includes("--batch-id") ? args[args.indexOf("--batch-id") + 1] : null;
const prospectIds = args.includes("--prospect-ids") ? args[args.indexOf("--prospect-ids") + 1].split(",") : null;
const topN = args.includes("--top") ? parseInt(args[args.indexOf("--top") + 1]) : null;

async function getProspects() {
  let query = supabase
    .from("prospect_pipeline")
    .select("id, business_name, preview_site_url, nfc_card_number, nfc_score, nfc_tier, google_place_id")
    .not("preview_site_url", "is", null);

  if (batchId) {
    query = query.eq("batch_id", batchId);
  } else if (prospectIds) {
    query = query.in("id", prospectIds);
  }

  if (topN) {
    query = query.not("nfc_tier", "eq", "skip").order("nfc_score", { ascending: false }).limit(topN);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function slugify(name) {
  return (name || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

async function generateQrCodes() {
  const prospects = await getProspects();
  if (prospects.length === 0) {
    console.log("No prospects found matching criteria.");
    return;
  }

  mkdirSync(outputDir, { recursive: true });

  let generated = 0;
  for (const p of prospects) {
    const url = p.preview_site_url.startsWith("http")
      ? p.preview_site_url
      : `${BASE_URL}${p.preview_site_url}`;

    const cardNum = p.nfc_card_number ? String(p.nfc_card_number).padStart(3, "0") : "000";
    const slug = slugify(p.business_name);
    const filename = `${cardNum}_${slug}.png`;
    const filepath = resolve(outputDir, filename);

    await QRCode.toFile(filepath, url, {
      type: "png",
      width: 400,
      margin: 2,
      color: { dark: "#1D1D1F", light: "#FFFFFF" },
      errorCorrectionLevel: "H", // High — survives printing artifacts
    });

    console.log(`  ✓ ${filename} → ${url}`);
    generated++;
  }

  console.log(`\nGenerated ${generated} QR codes in ${outputDir}`);
}

generateQrCodes().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
