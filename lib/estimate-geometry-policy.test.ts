// Track A.7 unit test per scoping §4.5 — 3 cases. Repo lacks a test runner;
// tsc validates shape, runtime verified via .tmp/a7-runtime-verify.mjs.
import { geometryForEstimate } from "./estimate-geometry-policy";
import type { RoofData } from "./solar-api";

declare const describe: (n: string, f: () => void) => void;
declare const it: (n: string, f: () => void) => void;
declare const expect: (v: unknown) => { toBeUndefined: () => void; toBeDefined: () => void };

const stub: RoofData = {
  roofAreaSqft: 2000, pitchDegrees: 22, numSegments: 2,
  segments: [{ areaSqft: 1000, pitchDegrees: 22, azimuthDegrees: 0 },
             { areaSqft: 1000, pitchDegrees: 22, azimuthDegrees: 180 }],
  source: "google_solar",
};

describe("geometryForEstimate", () => {
  it("lidar → undefined (policy withhold)", () => expect(geometryForEstimate("lidar", stub)).toBeUndefined());
  it("solar → RoofGeometry", () => expect(geometryForEstimate("solar", stub)).toBeDefined());
  it("null pipeline → RoofGeometry (status-quo preservation)", () => expect(geometryForEstimate(null, stub)).toBeDefined());
});
