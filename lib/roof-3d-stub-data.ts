export type Vec3 = [number, number, number];

export type RoofPlane = {
  id: string;
  type: "main" | "hip" | "gable" | "dormer";
  vertices: Vec3[];
  sqft: number;
};

export type RoofEdge = {
  id: string;
  type: "ridge" | "hip" | "valley" | "eave";
  start: Vec3;
  end: Vec3;
  lengthFt: number;
};

export type RoofScene = {
  address: string;
  totalSqft: number;
  pitch: string;
  planes: RoofPlane[];
  edges: RoofEdge[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number; maxZ: number };
};

const A: Vec3 = [-15, -25, 0];
const B: Vec3 = [15, -25, 0];
const C: Vec3 = [15, 25, 0];
const D: Vec3 = [-15, 25, 0];
const E: Vec3 = [0, -10, 5];
const F: Vec3 = [0, 10, 5];

const slantTrap = ((20 + 50) / 2) * Math.sqrt(15 * 15 + 5 * 5);
const slantTri = 0.5 * 30 * Math.sqrt(15 * 15 + 5 * 5);

export const STUB_HIP_ROOF: RoofScene = {
  address: "1234 Stub Lane, Tampa, FL 33606",
  totalSqft: Math.round(2 * slantTrap + 2 * slantTri),
  pitch: "4:12",
  planes: [
    { id: "p-east",  type: "main", vertices: [B, C, F, E], sqft: Math.round(slantTrap) },
    { id: "p-west",  type: "main", vertices: [A, E, F, D], sqft: Math.round(slantTrap) },
    { id: "p-south", type: "hip",  vertices: [A, B, E],    sqft: Math.round(slantTri) },
    { id: "p-north", type: "hip",  vertices: [C, D, F],    sqft: Math.round(slantTri) },
  ],
  edges: [
    { id: "ridge-1", type: "ridge", start: E, end: F, lengthFt: 20 },
    { id: "hip-1",   type: "hip",   start: A, end: E, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 5*5)) },
    { id: "hip-2",   type: "hip",   start: B, end: E, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 5*5)) },
    { id: "hip-3",   type: "hip",   start: C, end: F, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 5*5)) },
    { id: "hip-4",   type: "hip",   start: D, end: F, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 5*5)) },
  ],
  bounds: { minX: -15, maxX: 15, minY: -25, maxY: 25, maxZ: 5 },
};
