/**
 * Canonical address normalizer for Property Pipeline.
 *
 * Single source of truth — used by:
 *   - scripts/load-pp-universe.mjs   (computes address_normalized + address_hash at load)
 *   - scripts/backfill-pp-signals.mjs (builds parcel→addr map, joins Accela permits)
 *   - app/api/pipeline/send/route.ts (suppression check at send time, step 4+)
 *
 * Pure ESM JS (no TS) so Node scripts can `import` it directly without a build step.
 */

const SUFFIX_REPLACEMENTS = [
  [" STREET", " ST"],
  [" AVENUE", " AVE"],
  [" BOULEVARD", " BLVD"],
  [" DRIVE", " DR"],
  [" ROAD", " RD"],
  [" COURT", " CT"],
  [" CIRCLE", " CIR"],
  [" LANE", " LN"],
  [" PLACE", " PL"],
  [" TERRACE", " TER"],
  [" TRAIL", " TRL"],
  [" PARKWAY", " PKWY"],
  [" HIGHWAY", " HWY"],
  [" SQUARE", " SQ"],
];

/**
 * Normalize a single address line (situs OR a full mashup string).
 * - Uppercase
 * - Strip every non-alphanumeric char to a space (catches `.,#-/'` etc.)
 * - Collapse runs of whitespace
 * - Apply USPS-style suffix replacements (STREET→ST, AVENUE→AVE, ...)
 *
 * @param {string | null | undefined} s
 * @returns {string}
 */
export function normalizeAddressLine(s) {
  let out = String(s ?? "").toUpperCase();
  out = out.replace(/[^A-Z0-9 ]/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  for (const [long, short] of SUFFIX_REPLACEMENTS) out = out.replaceAll(long, short);
  return out;
}

/**
 * Normalize the (situs, city, zip) tuple into a single canonical string.
 * Used as the input to address_hash. Empty parts are skipped.
 *
 * @param {string | null | undefined} situs
 * @param {string | null | undefined} city
 * @param {string | null | undefined} zip
 * @returns {string}
 */
export function normalizeAddressFull(situs, city, zip) {
  const joined = [situs, city, zip].filter(Boolean).join(" ");
  return normalizeAddressLine(joined);
}

export { SUFFIX_REPLACEMENTS };
