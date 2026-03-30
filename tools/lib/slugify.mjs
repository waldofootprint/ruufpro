// Slug generation with Supabase uniqueness check.
// Prospect slugs are prefixed with "p-" to avoid collisions with real customers.

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
 * Generate a unique prospect slug, checking Supabase for collisions.
 * Returns "p-joes-roofing" or "p-joes-roofing-2" if taken.
 */
export async function generateProspectSlug(businessName) {
  const base = `p-${toSlug(businessName)}`;
  let slug = base;
  let attempt = 1;

  while (true) {
    const { data } = await supabase
      .from("sites")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;

    attempt++;
    slug = `${base}-${attempt}`;
  }
}
