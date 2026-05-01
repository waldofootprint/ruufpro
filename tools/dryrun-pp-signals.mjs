#!/usr/bin/env node

// Dry run: pull 100 Manatee candidates, attach signal tags, eyeball.
// No writes. Pure read + format.

import { supabase } from "./lib/supabase-admin.mjs";

const STORM_WINDOW_DAYS = 90;
const OLD_PERMIT_YEARS = 7;
const RECENT_SALE_YEARS = 2;

const { data: candidates, error: candErr } = await supabase
  .from("property_pipeline_candidates")
  .select("id, parcel_id, address_raw, city, zip, year_built, last_sale_year, last_roof_permit_date, county, status")
  .eq("status", "active")
  .limit(100);

if (candErr) { console.error(candErr); process.exit(1); }
console.log(`Loaded ${candidates.length} candidates.\n`);

const since = new Date(Date.now() - STORM_WINDOW_DAYS * 86_400_000).toISOString();
const counties = Array.from(new Set(candidates.map((c) => (c.county || "manatee").toLowerCase())))
  .map((c) => c.charAt(0).toUpperCase() + c.slice(1));

const { data: storms, error: stormErr } = await supabase
  .from("storm_events")
  .select("county, valid_at, typecode, magnitude, city")
  .in("county", counties)
  .gte("valid_at", since)
  .order("valid_at", { ascending: false });

if (stormErr) { console.error(stormErr); process.exit(1); }
console.log(`Found ${storms.length} storm events in last ${STORM_WINDOW_DAYS}d for counties: ${counties.join(", ")}.\n`);

const stormByCounty = new Map();
for (const s of storms) {
  const k = s.county.toLowerCase();
  if (!stormByCounty.has(k)) stormByCounty.set(k, s);
}

const now = new Date();
const enriched = candidates.map((c) => {
  const tags = [];
  if (!c.last_roof_permit_date) {
    tags.push({ code: "🔨", text: "No permit on file", date: null });
  } else {
    const yrs = (now - new Date(c.last_roof_permit_date)) / (365.25 * 86_400_000);
    if (yrs >= OLD_PERMIT_YEARS) {
      tags.push({ code: "🔨", text: `Permit ${c.last_roof_permit_date.slice(0,4)}`, date: c.last_roof_permit_date });
    }
  }
  if (c.last_sale_year && (now.getUTCFullYear() - c.last_sale_year) <= RECENT_SALE_YEARS) {
    tags.push({ code: "🏠", text: `Sold ${c.last_sale_year}`, date: `${c.last_sale_year}-01-01` });
  }
  const storm = stormByCounty.get((c.county || "manatee").toLowerCase());
  if (storm) {
    const mag = storm.magnitude ? ` ${storm.magnitude}` : "";
    tags.push({
      code: "⛈️",
      text: `${storm.typecode}${mag} ${storm.valid_at.slice(0,10)}`,
      date: storm.valid_at,
    });
  }
  const realDates = tags.map((t) => t.date).filter(Boolean);
  const latest = realDates.length ? realDates.sort().at(-1) : null;
  return { ...c, tags, latest };
});

enriched.sort((a, b) => {
  if (a.latest && b.latest) return b.latest.localeCompare(a.latest);
  if (a.latest) return -1;
  if (b.latest) return 1;
  return 0;
});

// Print top 20 by signal recency
console.log(`Top 20 by latest signal:\n`);
console.log("ADDR".padEnd(48) + " | " + "ZIP".padEnd(6) + " | TAGS");
console.log("-".repeat(110));
for (const c of enriched.slice(0, 20)) {
  const tagStr = c.tags.length === 0
    ? "(none — low signal)"
    : c.tags.map((t) => `${t.code} ${t.text}`).join("  ");
  const addr = (c.address_raw || "").slice(0, 46);
  console.log(addr.padEnd(48) + " | " + (c.zip || "").padEnd(6) + " | " + tagStr);
}

// Stats
const counts = { "🔨": 0, "🏠": 0, "⛈️": 0 };
for (const c of enriched) for (const t of c.tags) counts[t.code] = (counts[t.code] || 0) + 1;
const noSignal = enriched.filter((c) => !c.latest).length;
console.log(`\nTag distribution across ${enriched.length} candidates:`);
console.log(`  🔨 OLD_PERMIT  : ${counts["🔨"]}`);
console.log(`  🏠 RECENT_SALE : ${counts["🏠"]}`);
console.log(`  ⛈️  STORM       : ${counts["⛈️"]}`);
console.log(`  (no real signal): ${noSignal}`);
