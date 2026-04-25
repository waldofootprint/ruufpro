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
  pitch: "6:12",
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

/* ───────────────────────────────────────────────────────────
 * LUXURY_FL_ROOF — sprawling cross-hip (T-shape), 4:12 pitch.
 * Modern Florida luxury home: low pitch, multiple hip wings,
 * deep eaves. ~2,850 sqft, 8 planes, used on the homepage hero.
 * ─────────────────────────────────────────────────────────── */

// Geometry shifted so combined footprint is centered on origin (y range -30..30).
// Main wing — 60' E-W × 30' N-S, hip roof, occupies y ∈ [-30, 0]
const M_SW: Vec3 = [-30, -30, 0];
const M_SE: Vec3 = [30, -30, 0];
const M_NE: Vec3 = [30, 0, 0];
const M_NW: Vec3 = [-30, 0, 0];
const M_RW: Vec3 = [-15, -15, 7.5];
const M_RE: Vec3 = [15, -15, 7.5];

// Cross wing — 30'×30' pyramid hip on north side, occupies y ∈ [0, 30]
const C_SW: Vec3 = [-15, 0, 0];
const C_SE: Vec3 = [15, 0, 0];
const C_NE: Vec3 = [15, 30, 0];
const C_NW: Vec3 = [-15, 30, 0];
const C_AP: Vec3 = [0, 15, 7.5];

const slant = Math.sqrt(15 * 15 + 7.5 * 7.5); // 16.77 ft

// Trapezoidal slope (parallel sides 60 and 30, slant height 15.81)
const trapMain = ((60 + 30) / 2) * slant; // ~711 sqft
// Triangular hip end on main (base 30, slant height 15.81)
const triMain = 0.5 * 30 * slant; // ~237 sqft
// Triangular face on pyramid (base 30, slant height 15.81)
const triCross = 0.5 * 30 * slant; // ~237 sqft

export const LUXURY_FL_ROOF: RoofScene = {
  address: "742 Evergreen Terrace, Austin TX",
  totalSqft: Math.round(2 * trapMain + 2 * triMain + 4 * triCross),
  pitch: "6:12",
  planes: [
    // Main wing — 4 planes
    { id: "m-south", type: "main", vertices: [M_SW, M_SE, M_RE, M_RW], sqft: Math.round(trapMain) },
    { id: "m-north", type: "main", vertices: [M_NE, M_NW, M_RW, M_RE], sqft: Math.round(trapMain) },
    { id: "m-east",  type: "hip",  vertices: [M_SE, M_NE, M_RE],       sqft: Math.round(triMain) },
    { id: "m-west",  type: "hip",  vertices: [M_NW, M_SW, M_RW],       sqft: Math.round(triMain) },
    // Cross wing — 4 planes converging to apex
    { id: "c-south", type: "hip",  vertices: [C_SW, C_SE, C_AP],       sqft: Math.round(triCross) },
    { id: "c-east",  type: "hip",  vertices: [C_SE, C_NE, C_AP],       sqft: Math.round(triCross) },
    { id: "c-north", type: "hip",  vertices: [C_NE, C_NW, C_AP],       sqft: Math.round(triCross) },
    { id: "c-west",  type: "hip",  vertices: [C_NW, C_SW, C_AP],       sqft: Math.round(triCross) },
  ],
  edges: [
    // Main ridge
    { id: "m-ridge", type: "ridge", start: M_RW, end: M_RE, lengthFt: 30 },
    // Main hip lines
    { id: "m-hip-sw", type: "hip", start: M_SW, end: M_RW, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    { id: "m-hip-se", type: "hip", start: M_SE, end: M_RE, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    { id: "m-hip-ne", type: "hip", start: M_NE, end: M_RE, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    { id: "m-hip-nw", type: "hip", start: M_NW, end: M_RW, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    // Cross wing hip lines (4 corners → apex)
    { id: "c-hip-sw", type: "hip", start: C_SW, end: C_AP, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    { id: "c-hip-se", type: "hip", start: C_SE, end: C_AP, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    { id: "c-hip-ne", type: "hip", start: C_NE, end: C_AP, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
    { id: "c-hip-nw", type: "hip", start: C_NW, end: C_AP, lengthFt: Math.round(Math.sqrt(15*15 + 15*15 + 7.5*7.5)) },
  ],
  bounds: { minX: -30, maxX: 30, minY: -30, maxY: 30, maxZ: 7.5 },
};
