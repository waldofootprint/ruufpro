import type { RoofScene, RoofPlane, RoofEdge, Vec3 } from "@/lib/roof-3d-stub-data";

type TraceVertex = { x: number; y: number; kind: "eave" | "ridge" | "hip_end" };
type TracePlane = { id: string; vertices: TraceVertex[] };

export type RoofTrace = {
  image_size: [number, number];
  footprint: [number, number][];
  planes: TracePlane[];
  pitch_estimate: "low" | "medium" | "high";
  roof_type: "hip" | "gable" | "complex" | "flat";
  roof_color_hex?: string;
  notes?: string;
};

const PITCH_RATIO: Record<string, number> = {
  low: 3 / 12,
  medium: 5 / 12,
  high: 8 / 12,
};

const FT_PER_PX_ZOOM20_SCALE2 = 0.246;

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distToPolygon(px: number, py: number, poly: [number, number][]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const d = distToSegment(px, py, a[0], a[1], b[0], b[1]);
    if (d < best) best = d;
  }
  return best;
}

function polygonArea3D(verts: Vec3[]): number {
  let total = 0;
  for (let i = 1; i < verts.length - 1; i++) {
    const a = verts[0];
    const b = verts[i];
    const c = verts[i + 1];
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    total += 0.5 * Math.hypot(cx, cy, cz);
  }
  return total;
}

export function buildRoofSceneFromTrace(
  trace: RoofTrace,
  address: string,
  ftPerPx: number = FT_PER_PX_ZOOM20_SCALE2
): RoofScene {
  const pitchRatio = PITCH_RATIO[trace.pitch_estimate] ?? PITCH_RATIO.medium;
  const pitchRise = trace.pitch_estimate === "low" ? 3 : trace.pitch_estimate === "high" ? 8 : 5;
  const pitchLabel = `${pitchRise}:12`;

  const footprintPx = trace.footprint;
  let cxPx = 0;
  let cyPx = 0;
  for (const [x, y] of footprintPx) {
    cxPx += x;
    cyPx += y;
  }
  cxPx /= footprintPx.length;
  cyPx /= footprintPx.length;

  const toWorldXY = (px: number, py: number): [number, number] => {
    const xFt = (px - cxPx) * ftPerPx;
    const yFt = -(py - cyPx) * ftPerPx;
    return [xFt, yFt];
  };

  let footprintWidthPx = 0;
  {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of footprintPx) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    footprintWidthPx = Math.min(maxX - minX, maxY - minY);
  }
  const interiorThresholdPx = Math.max(20, footprintWidthPx * 0.08);

  const heightForVertex = (v: TraceVertex): number => {
    if (v.kind === "eave") return 0;
    const dPx = distToPolygon(v.x, v.y, footprintPx);
    if (dPx < interiorThresholdPx) return 0;
    const dFt = dPx * ftPerPx;
    return dFt * pitchRatio;
  };

  type Peak = { xPx: number; yPx: number; xFt: number; yFt: number; z: number };
  const peakSet = new Map<string, Peak>();
  for (const tp of trace.planes) {
    for (const v of tp.vertices) {
      if (v.kind === "eave") continue;
      const dPx = distToPolygon(v.x, v.y, footprintPx);
      if (dPx < interiorThresholdPx) continue;
      const key = `${Math.round(v.x / 8)}_${Math.round(v.y / 8)}`;
      if (peakSet.has(key)) continue;
      const [xFt, yFt] = toWorldXY(v.x, v.y);
      peakSet.set(key, {
        xPx: v.x,
        yPx: v.y,
        xFt,
        yFt,
        z: dPx * ftPerPx * pitchRatio,
      });
    }
  }
  const peaks = Array.from(peakSet.values());

  const nearestPeak = (px: number, py: number): Peak | null => {
    let best: Peak | null = null;
    let bestD = Infinity;
    for (const p of peaks) {
      const d = Math.hypot(p.xPx - px, p.yPx - py);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  };

  const planes: RoofPlane[] = [];
  const ridgeEdgesByKey = new Map<string, RoofEdge>();

  if (peaks.length === 0) {
    for (let i = 0; i < trace.planes.length; i++) {
      const tp = trace.planes[i];
      const verts3D: Vec3[] = tp.vertices.map((v) => {
        const [x, y] = toWorldXY(v.x, v.y);
        return [x, y, heightForVertex(v)];
      });
      if (verts3D.length < 3) continue;
      planes.push({
        id: tp.id || `p${i}`,
        type: "main",
        vertices: verts3D,
        sqft: Math.round(polygonArea3D(verts3D)),
      });
    }
  } else {
    const edgePeakIdx: number[] = [];
    for (let i = 0; i < footprintPx.length; i++) {
      const a = footprintPx[i];
      const b = footprintPx[(i + 1) % footprintPx.length];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      let bestIdx = 0;
      let bestD = Infinity;
      for (let pIdx = 0; pIdx < peaks.length; pIdx++) {
        const d = Math.hypot(peaks[pIdx].xPx - mx, peaks[pIdx].yPx - my);
        if (d < bestD) {
          bestD = d;
          bestIdx = pIdx;
        }
      }
      edgePeakIdx.push(bestIdx);
    }

    type Group = { peakIdx: number; edgeStart: number; edgeCount: number };
    const groups: Group[] = [];
    {
      let i = 0;
      let rotateStart = 0;
      const N = edgePeakIdx.length;
      if (N > 1 && edgePeakIdx[0] === edgePeakIdx[N - 1]) {
        rotateStart = 0;
        while (rotateStart < N && edgePeakIdx[rotateStart] === edgePeakIdx[(rotateStart - 1 + N) % N]) {
          rotateStart++;
          if (rotateStart === N) break;
        }
        if (rotateStart === N) rotateStart = 0;
      }
      i = rotateStart;
      let visited = 0;
      while (visited < N) {
        const peakIdx = edgePeakIdx[i % N];
        const start = i;
        let count = 0;
        while (visited < N && edgePeakIdx[i % N] === peakIdx) {
          i++;
          count++;
          visited++;
        }
        groups.push({ peakIdx, edgeStart: start, edgeCount: count });
      }
    }

    let planeCounter = 0;
    for (const g of groups) {
      const peak = peaks[g.peakIdx];
      const polyVerts: Vec3[] = [];
      for (let k = 0; k <= g.edgeCount; k++) {
        const fpIdx = (g.edgeStart + k) % footprintPx.length;
        const [xFt, yFt] = toWorldXY(footprintPx[fpIdx][0], footprintPx[fpIdx][1]);
        polyVerts.push([xFt, yFt, 0]);
      }
      polyVerts.push([peak.xFt, peak.yFt, peak.z]);

      planes.push({
        id: `pl_${planeCounter++}`,
        type: "main",
        vertices: polyVerts,
        sqft: Math.round(polygonArea3D(polyVerts)),
      });

      const firstFp = (g.edgeStart) % footprintPx.length;
      const lastFp = (g.edgeStart + g.edgeCount) % footprintPx.length;
      const [fx, fy] = toWorldXY(footprintPx[firstFp][0], footprintPx[firstFp][1]);
      const [lx, ly] = toWorldXY(footprintPx[lastFp][0], footprintPx[lastFp][1]);
      const peakV: Vec3 = [peak.xFt, peak.yFt, peak.z];
      const k1 = `hip_${g.edgeStart}_a`;
      const k2 = `hip_${g.edgeStart}_b`;
      ridgeEdgesByKey.set(k1, {
        id: k1,
        type: "hip",
        start: [fx, fy, 0],
        end: peakV,
        lengthFt: Math.round(Math.hypot(peak.xFt - fx, peak.yFt - fy, peak.z)),
      });
      ridgeEdgesByKey.set(k2, {
        id: k2,
        type: "hip",
        start: [lx, ly, 0],
        end: peakV,
        lengthFt: Math.round(Math.hypot(peak.xFt - lx, peak.yFt - ly, peak.z)),
      });
    }

    for (let i = 0; i < groups.length; i++) {
      const next = groups[(i + 1) % groups.length];
      if (groups[i].peakIdx === next.peakIdx) continue;
      const p = peaks[groups[i].peakIdx];
      const q = peaks[next.peakIdx];
      const k = `ridge_${Math.min(groups[i].peakIdx, next.peakIdx)}_${Math.max(groups[i].peakIdx, next.peakIdx)}`;
      if (ridgeEdgesByKey.has(k)) continue;
      ridgeEdgesByKey.set(k, {
        id: k,
        type: "ridge",
        start: [p.xFt, p.yFt, p.z],
        end: [q.xFt, q.yFt, q.z],
        lengthFt: Math.round(Math.hypot(p.xFt - q.xFt, p.yFt - q.yFt, p.z - q.z)),
      });
    }
  }

  const dedupedEdges = Array.from(ridgeEdgesByKey.values());

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxZ = 0;
  for (const p of planes) {
    for (const v of p.vertices) {
      if (v[0] < minX) minX = v[0];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[1] > maxY) maxY = v[1];
      if (v[2] > maxZ) maxZ = v[2];
    }
  }

  const totalSqft = planes.reduce((s, p) => s + p.sqft, 0);

  return {
    address,
    totalSqft,
    pitch: pitchLabel,
    planes,
    edges: dedupedEdges,
    bounds: { minX, maxX, minY, maxY, maxZ },
  };
}
