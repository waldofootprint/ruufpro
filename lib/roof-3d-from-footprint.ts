import type { RoofScene, RoofPlane, RoofEdge, Vec3 } from "@/lib/roof-3d-stub-data";

export type Vec2 = [number, number];

export type FootprintInput = {
  address: string;
  footprintFt: Vec2[];
  roofType: "hip" | "gable";
  pitchRise?: number;
};

const DEFAULT_PITCH_RISE = 5;
const PITCH_RUN = 12;

function centroid(pts: Vec2[]): Vec2 {
  const n = pts.length;
  let cx = 0;
  let cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  return [cx / n, cy / n];
}

function obb(pts: Vec2[]) {
  let bestArea = Infinity;
  let best = {
    angle: 0,
    width: 0,
    length: 0,
    cx: 0,
    cy: 0,
  };
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const cos = Math.cos(-ang);
    const sin = Math.sin(-ang);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of pts) {
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      if (rx < minX) minX = rx;
      if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry;
      if (ry > maxY) maxY = ry;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const area = w * h;
    if (area < bestArea) {
      bestArea = area;
      const cxr = (minX + maxX) / 2;
      const cyr = (minY + maxY) / 2;
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      best = {
        angle: ang,
        width: Math.min(w, h),
        length: Math.max(w, h),
        cx: cxr * cosA - cyr * sinA,
        cy: cxr * sinA + cyr * cosA,
      };
      if (h > w) {
        best.angle = ang + Math.PI / 2;
      }
    }
  }
  return best;
}

function rotate2D(p: Vec2, ang: number): Vec2 {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

export function buildRoofSceneFromFootprint(input: FootprintInput): RoofScene {
  const pitchRise = input.pitchRise ?? DEFAULT_PITCH_RISE;
  const pitchRatio = pitchRise / PITCH_RUN;

  const [cx, cy] = centroid(input.footprintFt);
  const centered: Vec2[] = input.footprintFt.map(([x, y]) => [x - cx, y - cy]);
  const box = obb(centered);

  const halfL = box.length / 2;
  const halfW = box.width / 2;
  const ridgeHeight = halfW * pitchRatio;

  const slope = Math.sqrt(halfW * halfW + ridgeHeight * ridgeHeight);
  const pitchLabel = `${pitchRise}:12`;

  const planes: RoofPlane[] = [];
  const edges: RoofEdge[] = [];

  const corners = {
    SW: [-halfL, -halfW] as Vec2,
    SE: [halfL, -halfW] as Vec2,
    NE: [halfL, halfW] as Vec2,
    NW: [-halfL, halfW] as Vec2,
  };

  if (input.roofType === "gable") {
    const ridgeLen = box.length;
    const r1: Vec2 = [-halfL, 0];
    const r2: Vec2 = [halfL, 0];

    const rotR1 = rotate2D(r1, box.angle);
    const rotR2 = rotate2D(r2, box.angle);
    const rotSW = rotate2D(corners.SW, box.angle);
    const rotSE = rotate2D(corners.SE, box.angle);
    const rotNE = rotate2D(corners.NE, box.angle);
    const rotNW = rotate2D(corners.NW, box.angle);

    const SW: Vec3 = [rotSW[0], rotSW[1], 0];
    const SE: Vec3 = [rotSE[0], rotSE[1], 0];
    const NE: Vec3 = [rotNE[0], rotNE[1], 0];
    const NW: Vec3 = [rotNW[0], rotNW[1], 0];
    const RA: Vec3 = [rotR1[0], rotR1[1], ridgeHeight];
    const RB: Vec3 = [rotR2[0], rotR2[1], ridgeHeight];

    const planeArea = ridgeLen * slope;

    planes.push({
      id: "p-south",
      type: "main",
      vertices: [SW, SE, RB, RA],
      sqft: Math.round(planeArea),
    });
    planes.push({
      id: "p-north",
      type: "main",
      vertices: [RA, RB, NE, NW],
      sqft: Math.round(planeArea),
    });

    edges.push({
      id: "ridge-1",
      type: "ridge",
      start: RA,
      end: RB,
      lengthFt: Math.round(ridgeLen),
    });
  } else {
    const ridgeLen = Math.max(box.length - box.width, box.width * 0.15);
    const halfRidge = ridgeLen / 2;
    const r1: Vec2 = [-halfRidge, 0];
    const r2: Vec2 = [halfRidge, 0];

    const rotR1 = rotate2D(r1, box.angle);
    const rotR2 = rotate2D(r2, box.angle);
    const rotSW = rotate2D(corners.SW, box.angle);
    const rotSE = rotate2D(corners.SE, box.angle);
    const rotNE = rotate2D(corners.NE, box.angle);
    const rotNW = rotate2D(corners.NW, box.angle);

    const SW: Vec3 = [rotSW[0], rotSW[1], 0];
    const SE: Vec3 = [rotSE[0], rotSE[1], 0];
    const NE: Vec3 = [rotNE[0], rotNE[1], 0];
    const NW: Vec3 = [rotNW[0], rotNW[1], 0];
    const RA: Vec3 = [rotR1[0], rotR1[1], ridgeHeight];
    const RB: Vec3 = [rotR2[0], rotR2[1], ridgeHeight];

    const trapArea = ((ridgeLen + box.length) / 2) * slope;
    const triBase = box.width;
    const triSlant = Math.sqrt((halfL - halfRidge) * (halfL - halfRidge) + ridgeHeight * ridgeHeight + halfW * halfW);
    const triArea = 0.5 * triBase * triSlant;

    planes.push({
      id: "p-south",
      type: "main",
      vertices: [SW, SE, RB, RA],
      sqft: Math.round(trapArea),
    });
    planes.push({
      id: "p-north",
      type: "main",
      vertices: [RA, RB, NE, NW],
      sqft: Math.round(trapArea),
    });
    planes.push({
      id: "p-east",
      type: "hip",
      vertices: [SE, NE, RB],
      sqft: Math.round(triArea),
    });
    planes.push({
      id: "p-west",
      type: "hip",
      vertices: [NW, SW, RA],
      sqft: Math.round(triArea),
    });

    edges.push({
      id: "ridge-1",
      type: "ridge",
      start: RA,
      end: RB,
      lengthFt: Math.round(ridgeLen),
    });
    const hipLen = Math.round(triSlant);
    edges.push({ id: "hip-1", type: "hip", start: SW, end: RA, lengthFt: hipLen });
    edges.push({ id: "hip-2", type: "hip", start: NW, end: RA, lengthFt: hipLen });
    edges.push({ id: "hip-3", type: "hip", start: SE, end: RB, lengthFt: hipLen });
    edges.push({ id: "hip-4", type: "hip", start: NE, end: RB, lengthFt: hipLen });
  }

  const totalSqft = planes.reduce((sum, p) => sum + p.sqft, 0);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of planes) {
    for (const v of p.vertices) {
      if (v[0] < minX) minX = v[0];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[1] > maxY) maxY = v[1];
    }
  }

  return {
    address: input.address,
    totalSqft,
    pitch: pitchLabel,
    planes,
    edges,
    bounds: { minX, maxX, minY, maxY, maxZ: ridgeHeight },
  };
}
