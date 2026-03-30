// Roof Intel: generates a summary from stored lead data.
// Uses the same logic as the estimate engine but doesn't
// need the full calculation — just the display-ready numbers.

import { getPitchMultiplier, getWasteFactor } from "./estimate";
import type { Lead } from "./types";

export interface RoofIntel {
  areaSqft: number;
  pitchDegrees: number;
  pitchDisplay: string; // e.g. "6/12"
  segments: number;
  complexityRating: string; // "Simple" | "Moderate" | "Complex"
  wasteFactor: number;
  wastePercent: number; // e.g. 15
  pitchMultiplier: number;
  estimatedBundles: number | null; // asphalt only, ~33 sqft per bundle
  estimatedRidgeFt: number;
  estimatedPerimeterFt: number;
  isSatellite: boolean;
}

// Convert pitch degrees to X/12 display format
function pitchToTwelfths(degrees: number): string {
  const rise = Math.round(Math.tan((degrees * Math.PI) / 180) * 12);
  return `${rise}/12`;
}

// Estimate ridge length from roof area (rough: assumes rectangular footprint)
function estimateRidgeLength(areaSqft: number): number {
  const footprint = areaSqft * 0.9; // rough ground footprint
  const side = Math.sqrt(footprint / 1.5); // 1.5:1 aspect ratio
  return Math.round(side);
}

// Estimate perimeter from area
function estimatePerimeter(areaSqft: number): number {
  const footprint = areaSqft * 0.9;
  const side = Math.sqrt(footprint / 1.5);
  const longSide = side * 1.5;
  return Math.round(2 * (side + longSide));
}

// Complexity rating from segment count
function getComplexity(segments: number): string {
  if (segments <= 2) return "Simple";
  if (segments <= 5) return "Moderate";
  return "Complex";
}

// Estimate asphalt bundles needed (3 bundles per roofing square = 100 sqft)
function estimateBundles(areaSqft: number, wasteFactor: number): number {
  return Math.round((areaSqft * wasteFactor) / 100 * 3);
}

export function getRoofIntel(lead: Lead): RoofIntel | null {
  if (!lead.estimate_roof_sqft || !lead.estimate_pitch_degrees) return null;

  const areaSqft = lead.estimate_roof_sqft;
  const pitchDegrees = lead.estimate_pitch_degrees;
  const segments = lead.estimate_segments || 4; // default to moderate
  const wasteFactor = getWasteFactor(segments);
  const pitchMult = getPitchMultiplier(pitchDegrees);
  const isAsphalt = lead.estimate_material === "asphalt";

  return {
    areaSqft,
    pitchDegrees,
    pitchDisplay: pitchToTwelfths(pitchDegrees),
    segments,
    complexityRating: getComplexity(segments),
    wasteFactor,
    wastePercent: Math.round((wasteFactor - 1) * 100),
    pitchMultiplier: pitchMult,
    estimatedBundles: isAsphalt ? estimateBundles(areaSqft, wasteFactor) : null,
    estimatedRidgeFt: estimateRidgeLength(areaSqft),
    estimatedPerimeterFt: estimatePerimeter(areaSqft),
    isSatellite: true, // leads from widget always use satellite when available
  };
}
