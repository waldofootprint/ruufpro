// Slug generation with Supabase uniqueness check.
// Prospect slugs use random IDs (p-abc123) to avoid trademark/liability issues.
// Business name only appears ON the site content, never in the URL.

import { randomBytes } from "crypto";
import { supabase } from "./supabase-admin.mjs";

/**
 * Convert a business name to a URL-safe slug.
 * "Joe's Roofing & Repair" → "joes-roofing-repair"
 */
export function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[''"]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique random prospect slug, checking Supabase for collisions.
 * Returns "p-a7f3b2" (random hex). Business name NOT in URL for liability safety.
 */
export async function generateProspectSlug(_businessName) {
  while (true) {
    const id = randomBytes(4).toString("hex"); // 8 hex chars
    const slug = `p-${id}`;

    const { data } = await supabase
      .from("sites")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;
  }
}
