// Geometric inference engine.
//
// The Solar API gives us individual roof segments with area, pitch, and
// compass direction (azimuth). From this, we can infer approximate
// ridge, hip, and valley lengths — the measurements that EagleView
// charges $15-38 for.
//
// Why this matters: ridge cap, hip flashing, valley flashing, and
// starter strip are real material costs that add $500-2,000+ to a job.
// Without these, our estimate would be missing a significant cost component.
//
// How the math works:
// 1. Each segment is roughly rectangular. From its area and pitch,
//    we estimate its width and height (the dimensions along the roof surface).
// 2. Segments that face opposite directions (e.g., north vs south) likely
//    share a ridge line between them.
// 3. Segments at angles to each other (e.g., south vs east) likely share
//    a hip or valley line.
// 4. The perimeter is estimated from the total footprint.

import type { RoofData } from "./solar-api";

export interface RoofGeometry {
  ridgeLengthFt: number;
  hipLengthFt: number;
  valleyLengthFt: number;
  perimeterFt: number;
}

// Two azimuths are "opposite" if they're roughly 180° apart (± 30°).
// Opposite-facing segments likely share a ridge line.
function areOpposite(azimuth1: number, azimuth2: number): boolean {
  const diff = Math.abs(azimuth1 - azimuth2);
  const normalizedDiff = diff > 180 ? 360 - diff : diff;
  return normalizedDiff > 150 && normalizedDiff < 210;
}

// Two azimuths are "perpendicular" if they're roughly 90° apart (± 30°).
// Perpendicular segments likely share a hip or valley line.
function arePerpendicular(azimuth1: number, azimuth2: number): boolean {
  const diff = Math.abs(azimuth1 - azimuth2);
  const normalizedDiff = diff > 180 ? 360 - diff : diff;
  return normalizedDiff > 60 && normalizedDiff < 120;
}

// Estimate the "width" of a segment (the dimension along the ridge/eave).
// We assume a roughly rectangular shape and use area + pitch to derive it.
// width ≈ sqrt(area / aspect_ratio), where aspect_ratio is typically ~2:1
// for residential roof segments (wider than they are deep).
function estimateSegmentWidth(areaSqft: number): number {
  const aspectRatio = 2.0; // typical residential: width is ~2x the depth
  return Math.sqrt(areaSqft * aspectRatio);
}

// Estimate the shared edge length between two segments.
// Uses the smaller of the two widths (the shared edge can't be longer
// than the shorter segment's dimension).
function estimateSharedEdge(area1Sqft: number, area2Sqft: number): number {
  const width1 = estimateSegmentWidth(area1Sqft);
  const width2 = estimateSegmentWidth(area2Sqft);
  return Math.min(width1, width2);
}

export function inferRoofGeometry(roofData: RoofData): RoofGeometry {
  const segments = roofData.segments;

  // If we have very few segments, use simpler estimates
  if (segments.length <= 1) {
    // Single-plane roof (flat or shed) — just estimate perimeter
    const side = Math.sqrt(roofData.roofAreaSqft);
    return {
      ridgeLengthFt: side, // one ridge line
      hipLengthFt: 0,
      valleyLengthFt: 0,
      perimeterFt: side * 4,
    };
  }

  // Filter out very small segments (likely dormers, chimneys, or noise)
  // that are less than 3% of total roof area
  const minAreaThreshold = roofData.roofAreaSqft * 0.03;
  const significantSegments = segments.filter(
    (s) => s.areaSqft >= minAreaThreshold
  );

  let totalRidgeFt = 0;
  let totalHipFt = 0;
  let totalValleyFt = 0;

  // Compare each pair of significant segments to find shared edges
  const paired = new Set<string>(); // track which pairs we've already counted

  for (let i = 0; i < significantSegments.length; i++) {
    for (let j = i + 1; j < significantSegments.length; j++) {
      const pairKey = `${i}-${j}`;
      if (paired.has(pairKey)) continue;

      const seg1 = significantSegments[i];
      const seg2 = significantSegments[j];
      const edgeLength = estimateSharedEdge(seg1.areaSqft, seg2.areaSqft);

      if (areOpposite(seg1.azimuthDegrees, seg2.azimuthDegrees)) {
        // Opposite-facing segments share a ridge
        totalRidgeFt += edgeLength;
        paired.add(pairKey);
      } else if (
        arePerpendicular(seg1.azimuthDegrees, seg2.azimuthDegrees)
      ) {
        // Perpendicular segments share a hip or valley.
        // If the lower segment's pitch is steeper, it's likely a valley
        // (where two slopes meet going inward). Otherwise, it's a hip
        // (where two slopes meet going outward).
        // This is a simplification — true detection would need 3D geometry.
        if (seg1.pitchDegrees > seg2.pitchDegrees + 5) {
          totalValleyFt += edgeLength;
        } else {
          totalHipFt += edgeLength;
        }
        paired.add(pairKey);
      }
    }
  }

  // Estimate perimeter from the total roof footprint area.
  // Footprint area = roof area / cos(pitch) — but for a rough perimeter
  // estimate, we can use the roof area directly and assume a rectangular
  // footprint with a typical aspect ratio.
  const footprintSqft =
    roofData.roofAreaSqft /
    Math.cos((roofData.pitchDegrees * Math.PI) / 180);
  const footprintSide = Math.sqrt(footprintSqft);
  // Typical house is roughly 1.5:1 aspect ratio
  const longSide = footprintSide * Math.sqrt(1.5);
  const shortSide = footprintSqft / longSide;
  const perimeterFt = 2 * (longSide + shortSide);

  // Apply sanity checks — these values should be reasonable for residential
  return {
    ridgeLengthFt: Math.max(totalRidgeFt, footprintSide * 0.3), // at least 30% of a side
    hipLengthFt: totalHipFt,
    valleyLengthFt: totalValleyFt,
    perimeterFt: Math.max(perimeterFt, 80), // minimum 80ft for any house
  };
}
