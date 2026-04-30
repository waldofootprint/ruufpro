/**
 * Per-(lat,lng) NOAA HURDAT2 lookup.
 *
 * Reads data/hurdat2-fl-tracks.json (built by tools/fetch-hurdat2-tracks.mjs)
 * and answers "how many Cat 3+ storms passed within 75mi of THIS specific
 * address since YEAR" + "what was the peak wind reading from any track point
 * within 25mi during that window."
 *
 * Used by the postcard landing demo to replace the county-level stub.
 */

import hurdat2Data from "../../data/hurdat2-fl-tracks.json";

interface TrackPoint {
  d: string; // YYYYMMDD
  lat: number;
  lng: number;
  w: number; // wind kt
}
interface Storm {
  id: string;
  name: string;
  year: number;
  peakLifetimeWindKt: number;
  peakLifetimeCategory: number;
  track: TrackPoint[];
}
interface Hurdat2File {
  schemaVersion: number;
  lastYearCovered: number;
  storms: Storm[];
}

const DATA = hurdat2Data as unknown as Hurdat2File;

const HURRICANE_RADIUS_MI = 75;
const PEAK_WIND_RADIUS_MI = 25;

function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export interface StormStatsByPoint {
  /** Count of distinct Cat 3+ storms with track ≤75mi of (lat,lng) since `sinceYear`. */
  majorHurricanesSinceBuilt: number;
  /** Highest wind from any track point within 25mi since `sinceYear`. NULL if none. */
  peakWind: { mph: number; stormName: string; year: number } | null;
  /** HURDAT2 last-year-covered (so caller can disclose freshness). */
  hurdat2LastYearCovered: number;
}

/**
 * @param lat        property latitude
 * @param lng        property longitude
 * @param sinceYear  earliest year to count from (typically year_built)
 */
export function getStormStatsByPoint(
  lat: number,
  lng: number,
  sinceYear: number
): StormStatsByPoint {
  let majorCount = 0;
  let peak: { mph: number; stormName: string; year: number } | null = null;

  for (const s of DATA.storms) {
    if (s.year < sinceYear) continue;

    let countedAsMajor = false;
    for (const p of s.track) {
      const d = haversineMi(lat, lng, p.lat, p.lng);
      // Major-hurricane membership: storm reached Cat 3+ at any point in life
      // AND track passed within 75mi at SOME point (not necessarily Cat 3 there).
      if (
        !countedAsMajor &&
        s.peakLifetimeCategory >= 3 &&
        d <= HURRICANE_RADIUS_MI
      ) {
        majorCount++;
        countedAsMajor = true;
      }
      // Peak wind: any track point within 25mi, regardless of category.
      if (d <= PEAK_WIND_RADIUS_MI) {
        const mph = Math.round(p.w * 1.15078);
        if (!peak || mph > peak.mph) {
          peak = { mph, stormName: titleCase(s.name), year: s.year };
        }
      }
    }
  }

  return {
    majorHurricanesSinceBuilt: majorCount,
    peakWind: peak,
    hurdat2LastYearCovered: DATA.lastYearCovered,
  };
}
