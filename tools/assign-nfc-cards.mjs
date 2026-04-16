#!/usr/bin/env node
// Assign NFC cards to top-scored prospects and update the Netlify _redirects file.
//
// What this does:
// 1. Scores all unassigned prospects using NFC scoring
// 2. Assigns next available card numbers (002-199)
// 3. Updates waldofootprint/feedbackfootprint/_redirects with Google Review URLs
// 4. Pushes to GitHub (Netlify auto-deploys)
// 5. Updates prospect_pipeline with card assignments
//
// Usage:
//   node tools/assign-nfc-cards.mjs --batch-id <id> --count 25    # Assign to top 25 in a batch
//   node tools/assign-nfc-cards.mjs --count 25                    # Assign to top 25 across all batches
//   node tools/assign-nfc-cards.mjs --dry-run --count 25          # Preview without changes
//
// Requires: SUPABASE env vars, gh CLI authenticated, feedbackfootprint repo cloned

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REPO_PATH = "/tmp/feedbackfootprint";
const REDIRECTS_FILE = resolve(REPO_PATH, "_redirects");
// Card range: 002-199 (001 and 200 are test cards)
const CARD_MIN = 2;
const CARD_MAX = 199;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars. Source .env.local first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse args
const args = process.argv.slice(2);
const batchId = args.includes("--batch-id") ? args[args.indexOf("--batch-id") + 1] : null;
const count = args.includes("--count") ? parseInt(args[args.indexOf("--count") + 1]) : 25;
const dryRun = args.includes("--dry-run");

async function getUsedCardNumbers() {
  const { data, error } = await supabase
    .from("prospect_pipeline")
    .select("nfc_card_number")
    .not("nfc_card_number", "is", null);
  if (error) throw error;
  return new Set((data || []).map((r) => r.nfc_card_number));
}

function getNextAvailableCards(usedCards, needed) {
  const available = [];
  for (let i = CARD_MIN; i <= CARD_MAX && available.length < needed; i++) {
    if (!usedCards.has(i)) available.push(i);
  }
  return available;
}

async function getTopProspects() {
  let query = supabase
    .from("prospect_pipeline")
    .select("*")
    .is("nfc_card_number", null)
    .not("preview_site_url", "is", null)
    .not("google_place_id", "is", null);

  if (batchId) {
    query = query.eq("batch_id", batchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Demo prospect scoring inline (mirrors lib/demo-prospect-scoring.ts logic)
function scoreProspectForNfc(p) {
  const reviews = p.reviews_count ?? 0;
  const rating = p.rating ?? 0;

  // Auto-skip
  if (!p.google_place_id) return { score: -1, tier: "skip", reason: "No place ID" };
  if (!p.their_website_url) return { score: -1, tier: "skip", reason: "No website" };
  if (p.competitor_tools?.length > 0) return { score: -1, tier: "skip", reason: "Has competitor tool" };
  if (rating > 0 && rating < 4.0) return { score: -1, tier: "skip", reason: `${rating}★ too low` };
  if (reviews < 3) return { score: -1, tier: "skip", reason: "Too few reviews" };
  if (reviews > 49) return { score: -1, tier: "skip", reason: "Too many reviews" };

  let score = 0;
  // Website data richness
  if (p.website_faq?.length > 0) score += 3;
  if (p.website_services?.length > 0) score += 3;
  if (p.facebook_page_url) score += 2;
  if (p.owner_name) score += 2;
  if (p.website_about) score += 2;
  if (p.website_service_areas?.length > 0) score += 1;
  if (p.website_testimonials?.length > 0) score += 1;
  // Review count
  if (reviews >= 3 && reviews <= 15) score += 3;
  else if (reviews >= 16 && reviews <= 30) score += 2;
  // Organic pattern
  if (p.google_reviews?.length >= 3) score += 2;
  // Rating
  if (rating >= 4.5) score += 2;
  else if (rating >= 4.0) score += 1;
  // Recent reviews
  if (p.google_reviews?.length > 0) {
    const sixMonthsAgo = Date.now() / 1000 - 180 * 24 * 60 * 60;
    if (p.google_reviews.some((r) => r.time && r.time > sixMonthsAgo)) score += 1;
  }
  // Phone
  if (p.phone && p.phone !== "unknown") score += 1;

  const tier = score >= 16 ? "platinum" : score >= 12 ? "gold" : score >= 8 ? "silver" : "skip";
  return { score, tier };
}

function buildGoogleReviewUrl(placeId) {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

function ensureRepoCloned() {
  if (!existsSync(REPO_PATH)) {
    console.log("Cloning feedbackfootprint repo...");
    execSync(`gh repo clone waldofootprint/feedbackfootprint ${REPO_PATH}`, { stdio: "inherit" });
  } else {
    // Pull latest
    execSync("git pull", { cwd: REPO_PATH, stdio: "pipe" });
  }
}

function updateRedirectsFile(assignments) {
  const content = readFileSync(REDIRECTS_FILE, "utf-8");
  const lines = content.split("\n");

  for (const { cardNumber, reviewUrl } of assignments) {
    const cardPath = `/${String(cardNumber).padStart(3, "0")}`;
    const lineIdx = lines.findIndex((l) => l.startsWith(cardPath + " "));
    if (lineIdx >= 0) {
      lines[lineIdx] = `${cardPath} ${reviewUrl} 301`;
    }
  }

  writeFileSync(REDIRECTS_FILE, lines.join("\n"));
}

function pushToGithub(count) {
  execSync("git add _redirects", { cwd: REPO_PATH });
  execSync(`git commit -m "Assign ${count} NFC cards for RuufPro outreach"`, { cwd: REPO_PATH });
  execSync("git push", { cwd: REPO_PATH });
}

async function main() {
  console.log(`\n🔍 Finding top ${count} prospects for NFC cards...\n`);

  const prospects = await getTopProspects();
  console.log(`  Found ${prospects.length} unassigned prospects with preview sites`);

  // Score and sort
  const scored = prospects
    .map((p) => ({ ...p, nfcResult: scoreProspectForNfc(p) }))
    .filter((p) => p.nfcResult.tier !== "skip")
    .sort((a, b) => b.nfcResult.score - a.nfcResult.score)
    .slice(0, count);

  if (scored.length === 0) {
    console.log("  No qualifying prospects found.");
    return;
  }

  console.log(`  ${scored.length} prospects qualify:\n`);

  // Get available cards
  const usedCards = await getUsedCardNumbers();
  const availableCards = getNextAvailableCards(usedCards, scored.length);
  console.log(`  ${CARD_MAX - CARD_MIN + 1 - usedCards.size} NFC cards remaining\n`);

  if (availableCards.length < scored.length) {
    console.log(`  ⚠️ Only ${availableCards.length} cards available, limiting to that.`);
    scored.splice(availableCards.length);
  }

  // Build assignments
  const assignments = scored.map((p, i) => ({
    prospectId: p.id,
    cardNumber: availableCards[i],
    businessName: p.business_name,
    city: p.city,
    state: p.state,
    address: p.address,
    reviewUrl: buildGoogleReviewUrl(p.google_place_id),
    previewSiteUrl: p.preview_site_url.startsWith("http")
      ? p.preview_site_url
      : `https://ruufpro.com${p.preview_site_url}`,
    score: p.nfcResult.score,
    tier: p.nfcResult.tier,
    rating: p.rating,
    reviewsCount: p.reviews_count,
    phone: p.phone,
  }));

  // Print summary
  for (const a of assignments) {
    console.log(`  Card #${String(a.cardNumber).padStart(3, "0")} → ${a.businessName} (${a.city}, ${a.state})`);
    console.log(`    NFC Score: ${a.score} (${a.tier}) · ${a.rating}★ · ${a.reviewsCount} reviews`);
    console.log(`    NFC → ${a.reviewUrl}`);
    console.log(`    QR  → ${a.previewSiteUrl}`);
    console.log();
  }

  if (dryRun) {
    console.log("🏁 DRY RUN — no changes made.");
    return;
  }

  // Update Netlify _redirects
  console.log("📡 Updating NFC card redirects...");
  ensureRepoCloned();
  updateRedirectsFile(assignments);
  pushToGithub(assignments.length);
  console.log("  ✓ Pushed to GitHub → Netlify will auto-deploy\n");

  // Update Supabase
  console.log("💾 Saving card assignments to database...");
  for (const a of assignments) {
    const { error } = await supabase
      .from("prospect_pipeline")
      .update({
        nfc_card_number: a.cardNumber,
        nfc_assigned_at: new Date().toISOString(),
        nfc_score: a.score,
        nfc_tier: a.tier,
      })
      .eq("id", a.prospectId);

    if (error) console.error(`  ✗ Failed to update ${a.businessName}: ${error.message}`);
    else console.log(`  ✓ ${a.businessName} → Card #${String(a.cardNumber).padStart(3, "0")}`);
  }

  // Write tracking sheet
  const trackingDir = resolve(".tmp/direct-mail");
  mkdirSync(trackingDir, { recursive: true });
  const trackingLines = [
    `# NFC Card Assignments — ${new Date().toISOString().split("T")[0]}`,
    "",
    `| Card # | Business | City | Score | Rating | Reviews | Phone | Address | NFC Link | Preview Site |`,
    `|--------|----------|------|-------|--------|---------|-------|---------|----------|-------------|`,
    ...assignments.map((a) =>
      `| ${String(a.cardNumber).padStart(3, "0")} | ${a.businessName} | ${a.city}, ${a.state} | ${a.score} (${a.tier}) | ${a.rating}★ | ${a.reviewsCount} | ${a.phone || "—"} | ${a.address || "—"} | [NFC](${a.reviewUrl}) | [Preview](${a.previewSiteUrl}) |`
    ),
  ];
  writeFileSync(resolve(trackingDir, "tracking.md"), trackingLines.join("\n"));
  console.log(`\n📋 Tracking sheet saved to .tmp/direct-mail/tracking.md`);

  console.log(`\n✅ Done! ${assignments.length} NFC cards assigned and deployed.`);
  console.log(`   Remaining cards: ${CARD_MAX - CARD_MIN + 1 - usedCards.size - assignments.length}`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
