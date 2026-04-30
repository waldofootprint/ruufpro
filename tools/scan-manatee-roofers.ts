// Manatee County roofer sweep via Google Places API (New).
// Reads NEXT_PUBLIC_GOOGLE_MAPS_KEY from .env, dedupes by place_id, scores via
// lib/demo-prospect-scoring.ts, and emits JSON on stdout. Sort + sheet write
// happen in a separate step (Sheets MCP).
//
// Run: npx tsx tools/scan-manatee-roofers.ts > .tmp/manatee-roofers.json

import fs from "node:fs";
import path from "node:path";
import { scoreDemoProspect, type ProspectTier } from "../lib/demo-prospect-scoring";

const ENV = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const KEY = ENV.match(/^NEXT_PUBLIC_GOOGLE_MAPS_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY missing from .env");

const CITIES = [
  "Bradenton", "Palmetto", "Parrish", "Lakewood Ranch", "Ellenton",
  "Anna Maria", "Holmes Beach", "Longboat Key", "Myakka City", "Cortez",
  "Bayshore Gardens", "Oneco", "Samoset", "Terra Ceia", "Duette",
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.types",
  "nextPageToken",
].join(",");

interface PlaceRaw {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
}

async function searchCity(city: string): Promise<PlaceRaw[]> {
  const all: PlaceRaw[] = [];
  let pageToken: string | undefined;
  let pages = 0;
  do {
    const body: Record<string, unknown> = {
      textQuery: `roofing contractor in ${city}, FL`,
      pageSize: 20,
    };
    if (pageToken) body.pageToken = pageToken;
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY!,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[${city}] HTTP ${res.status}: ${await res.text()}`);
      break;
    }
    const json = (await res.json()) as { places?: PlaceRaw[]; nextPageToken?: string };
    if (json.places) all.push(...json.places);
    pageToken = json.nextPageToken;
    pages++;
    if (pageToken) await new Promise((r) => setTimeout(r, 2000)); // token activation delay
  } while (pageToken && pages < 5);
  console.error(`[${city}] ${all.length} results across ${pages} page(s)`);
  return all;
}

function cityFromAddress(addr: string | undefined): string {
  if (!addr) return "";
  // "1234 Main St, Bradenton, FL 34211, USA" → "Bradenton"
  const parts = addr.split(",").map((s) => s.trim());
  return parts.length >= 3 ? parts[parts.length - 3] : "";
}

async function main() {
  const seen = new Map<string, PlaceRaw>();
  for (const city of CITIES) {
    const places = await searchCity(city);
    for (const p of places) {
      if (!seen.has(p.id)) seen.set(p.id, p);
    }
  }
  console.error(`\nTotal unique: ${seen.size}`);

  const rows = Array.from(seen.values()).map((p) => {
    const score = scoreDemoProspect({
      google_place_id: p.id,
      rating: p.rating ?? null,
      reviews_count: p.userRatingCount ?? null,
      their_website_url: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      business_name: p.displayName?.text ?? null,
      google_reviews: null, // Places New doesn't return review timestamps in searchText
    });
    return {
      place_id: p.id,
      name: p.displayName?.text ?? "",
      city: cityFromAddress(p.formattedAddress),
      address: p.formattedAddress ?? "",
      website: p.websiteUri ?? "",
      phone: p.nationalPhoneNumber ?? "",
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? null,
      tier: score.tier as ProspectTier,
      skip_reason: score.autoSkipReason ?? "",
      score: score.score,
    };
  });

  const tierOrder: Record<ProspectTier, number> = { platinum: 0, gold: 1, silver: 2, skip: 3 };
  rows.sort((a, b) => {
    const t = tierOrder[a.tier] - tierOrder[b.tier];
    if (t !== 0) return t;
    return (b.reviews ?? 0) - (a.reviews ?? 0);
  });

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.tier] = (acc[r.tier] ?? 0) + 1;
    return acc;
  }, {});
  console.error(`Tiers: ${JSON.stringify(counts)}`);

  process.stdout.write(JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
