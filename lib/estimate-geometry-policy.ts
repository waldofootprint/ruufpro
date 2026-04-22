import type { RoofData } from "./solar-api";
import type { RoofGeometry } from "./roof-geometry";
import type { Pipeline } from "./measurement-pipeline.types";
import { inferRoofGeometry } from "./roof-geometry";

// Track A.7 policy: ridge/hip/valley from Pipeline A (LiDAR) are withheld
// from user-facing estimates per 396g-diag (hip under-count architectural,
// ≤1% $-impact on bundled mode = 0, itemized mode falls back to
// materialCost * 0.10 in lib/estimate.ts:262).
//
// Pipeline=null preserves today's Solar-served behavior exactly. A.8 wires
// the real pipeline signal in; this helper is the single policy point.
export function geometryForEstimate(
  pipeline: Pipeline | null,
  roofData: RoofData | null
): RoofGeometry | undefined {
  if (pipeline === "lidar") return undefined;
  if (!roofData) return undefined;
  return inferRoofGeometry(roofData);
}
