/**
 * Postcard landing — server entry.
 *
 * Pulls the real roof-permit row from public.accela_roof_permits for the
 * demo address (Hannah's home), computes roof age from the permit (falling
 * back to year_built when no permit on file), and hands a fully-resolved
 * data object to the client component.
 *
 * Default address (?addr=...&city=...&zip=...&yearBuilt=...) is overridable
 * for ad-hoc demos against other Manatee homes.
 */

import PostcardLandingClient, {
  type PostcardLandingData,
} from "./PostcardLandingClient";
import {
  getLastRoofPermitForParts,
  deriveRoofAge,
} from "@/lib/property-pipeline/permits";
import { getStormStatsByPoint } from "@/lib/property-pipeline/storm-stats-by-point";
import { getFemaFloodZone } from "@/lib/property-pipeline/fema-flood-zone";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  street: "8734 54th Ave E",
  city: "Bradenton",
  zip: "34211",
  // Year built — Manatee PAO record. Used as fallback only when no permit on file.
  yearBuilt: 1994,
  lat: 27.439986,
  lng: -82.44778939999999,
};

export default async function PostcardLandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    addr?: string;
    city?: string;
    zip?: string;
    yearBuilt?: string;
    lat?: string;
    lng?: string;
  }>;
}) {
  const sp = await searchParams;
  const street = sp.addr ?? DEFAULTS.street;
  const city = sp.city ?? DEFAULTS.city;
  const zip = sp.zip ?? DEFAULTS.zip;
  const yearBuilt = Number(sp.yearBuilt ?? DEFAULTS.yearBuilt);
  const lat = Number(sp.lat ?? DEFAULTS.lat);
  const lng = Number(sp.lng ?? DEFAULTS.lng);

  // Fan out the three independent lookups in parallel.
  // Storm window: prefer permit year (current roof's exposure window) over
  // year_built when a reroof is on file — the new roof has only weathered
  // storms since it was installed.
  const permit = await getLastRoofPermitForParts(street, city, zip);
  const age = deriveRoofAge(permit, yearBuilt);
  const stormSinceYear = permit?.permitYear ?? yearBuilt;

  const [storm, femaZoneResult] = await Promise.all([
    Promise.resolve(getStormStatsByPoint(lat, lng, stormSinceYear)),
    getFemaFloodZone(lat, lng),
  ]);

  const data: PostcardLandingData = {
    address: street,
    city: `${city}, FL ${zip}`,
    lat,
    lng,
    yearBuilt,
    roofAgeYears: age.ageYears ?? 0,
    lastPermitYear: permit?.permitYear ?? null,
    lastPermitDescription: permit?.description ?? null,
    roofAgeSource: age.source,
    // FEMA NFHL S_FLD_HAZ_AR — falls back to "X" if endpoint times out.
    femaZone: femaZoneResult ?? "X",
    // MSFH (My Safe FL Home) eligibility heuristic — non-X flood zones generally
    // have other priorities; keep simple here, refine in a separate task.
    msfhEligible: !femaZoneResult || femaZoneResult === "X",
    majorHurricanesSinceBuilt: storm.majorHurricanesSinceBuilt,
    peakWind: storm.peakWind ?? { mph: 0, stormName: "—", year: stormSinceYear },
    contractor: {
      name: "Stormline Roofing",
      license: "CCC1330842",
      rating: 4.9,
      reviews: 187,
    },
  };

  return <PostcardLandingClient data={data} />;
}
