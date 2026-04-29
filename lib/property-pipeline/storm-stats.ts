/**
 * County-level storm stats reader.
 *
 * Reads the static JSON produced by tools/fetch-county-storm-stats.mjs and
 * exposes per-year-built filters. Same module is consumed by:
 *   - the dashboard approval queue hero card
 *   - the QR landing page mailed via postcard
 * → one source of truth so every cited number is reproducible.
 *
 * Sources are NOAA HURDAT2 + FEMA OpenFEMA. No live API calls at runtime.
 */

import manateeFlData from "../../data/county-storm-stats/manatee-fl.json";

interface MajorHurricane {
  id: string;
  name: string;
  year: number;
  closestApproach: { miles: number; date: string };
  peakWindAtClosestApproachKt: number;
  peakWindAtClosestApproachMph: number;
  categoryAtClosestApproach: number;
  peakLifetimeWindKt: number;
  peakLifetimeCategory: number;
}

interface CountyData {
  schemaVersion: number;
  generatedAt: string;
  county: {
    key: string;
    displayName: string;
    state: string;
    fipsState: string;
    fipsCounty: string;
    centroidLat: number;
    centroidLng: number;
  };
  sources: { name: string; description: string; url: string }[];
  notes: string[];
  hurdat2: {
    sourceUrl: string;
    lastYearCovered: number;
    radiusMiles: number;
    centroid: { lat: number; lng: number };
    allNamedStormsWithinRadius: number;
    majorsWithinRadius: MajorHurricane[];
  };
  fema: {
    sourceUrl: string;
    declarations: {
      disasterNumber: number;
      title: string;
      declarationDate: string;
      incidentBeginDate: string;
      incidentEndDate: string;
    }[];
  };
}

const COUNTY_DATA: Record<string, CountyData> = {
  manatee: manateeFlData as unknown as CountyData,
};

export interface CountyStormStats {
  county: string;
  yearBuilt: number;
  majorHurricanesSinceBuild: number;
  /** Closest-approach storm since build, by miles (smallest = closest). */
  closestMajorSinceBuild: {
    name: string;
    year: number;
    milesAtClosest: number;
    categoryAtClosestApproach: number;
    peakLifetimeCategory: number;
  } | null;
  /** Most-recent major since build. */
  mostRecentMajor: {
    name: string;
    year: number;
    peakLifetimeCategory: number;
  } | null;
  /** Highest sustained wind at storm center across majors that came within radius since build. NOT observed at the property. */
  peakStormCenterWindMph: number | null;
  peakStormCenterStorm: { name: string; year: number } | null;
  federalDisastersSinceBuild: number;
  hurdat2LastYearCovered: number;
  sources: { name: string; url: string }[];
}

export function getCountyStormStats(
  countyKey: string,
  yearBuilt: number
): CountyStormStats | null {
  const data = COUNTY_DATA[countyKey.toLowerCase()];
  if (!data) return null;

  const majors = data.hurdat2.majorsWithinRadius.filter((m) => m.year >= yearBuilt);
  const closest = majors.length
    ? majors.reduce((acc, m) => (m.closestApproach.miles < acc.closestApproach.miles ? m : acc))
    : null;
  const mostRecent = majors.length
    ? majors.reduce((acc, m) => (m.year > acc.year ? m : acc))
    : null;
  const peakWind = majors.length
    ? majors.reduce((acc, m) =>
        m.peakWindAtClosestApproachMph > acc.peakWindAtClosestApproachMph ? m : acc
      )
    : null;

  const fed = data.fema.declarations.filter((d) => {
    const y = parseInt((d.incidentBeginDate ?? "").slice(0, 4), 10);
    return Number.isFinite(y) && y >= yearBuilt;
  }).length;

  return {
    county: data.county.displayName,
    yearBuilt,
    majorHurricanesSinceBuild: majors.length,
    closestMajorSinceBuild: closest
      ? {
          name: titleCase(closest.name),
          year: closest.year,
          milesAtClosest: closest.closestApproach.miles,
          categoryAtClosestApproach: closest.categoryAtClosestApproach,
          peakLifetimeCategory: closest.peakLifetimeCategory,
        }
      : null,
    mostRecentMajor: mostRecent
      ? {
          name: titleCase(mostRecent.name),
          year: mostRecent.year,
          peakLifetimeCategory: mostRecent.peakLifetimeCategory,
        }
      : null,
    peakStormCenterWindMph: peakWind ? peakWind.peakWindAtClosestApproachMph : null,
    peakStormCenterStorm: peakWind
      ? { name: titleCase(peakWind.name), year: peakWind.year }
      : null,
    federalDisastersSinceBuild: fed,
    hurdat2LastYearCovered: data.hurdat2.lastYearCovered,
    sources: data.sources.map((s) => ({ name: s.name, url: s.url })),
  };
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
