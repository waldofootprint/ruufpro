#!/usr/bin/env python3
"""
Build-year routing (Phase B Section 1a).

  Build year ≥ 2019  → Solar pathway, skip LiDAR
  Build year < 2019  → LiDAR stack + Solar parallel
  Unknown            → LiDAR stack + Solar parallel (self-healing; LiDAR will no_class_6 → Solar)

MS Footprints carries vintage_year but not per-building build_date. This router accepts
an externally-supplied build_year hint (e.g. parcel API when wired) and falls back to
"unknown" when not available. Unknown does NOT block — the LiDAR pipeline's own
failure cascade (no class-6 → Solar) is the final guard.

Per self-derive gate: dropping per-county parcel API from v1. Build year hint will
usually be None in v1; routing degrades gracefully.
"""
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Pathway(str, Enum):
    SOLAR_ONLY = "solar_only"
    LIDAR_PRIMARY_SOLAR_PARALLEL = "lidar_primary_solar_parallel"


@dataclass
class RoutingDecision:
    pathway: Pathway
    reason: str
    build_year: Optional[int]


SOLAR_CUTOFF_YEAR = 2019  # build_year >= this routes to Solar-only


def route(build_year: Optional[int]) -> RoutingDecision:
    if build_year is None:
        return RoutingDecision(
            pathway=Pathway.LIDAR_PRIMARY_SOLAR_PARALLEL,
            reason="unknown_build_year",
            build_year=None,
        )
    if build_year >= SOLAR_CUTOFF_YEAR:
        return RoutingDecision(
            pathway=Pathway.SOLAR_ONLY,
            reason=f"post_{SOLAR_CUTOFF_YEAR-1}_build",
            build_year=build_year,
        )
    return RoutingDecision(
        pathway=Pathway.LIDAR_PRIMARY_SOLAR_PARALLEL,
        reason=f"pre_{SOLAR_CUTOFF_YEAR}_build",
        build_year=build_year,
    )


if __name__ == "__main__":
    import argparse, json
    ap = argparse.ArgumentParser()
    ap.add_argument("--build-year", type=int)
    args = ap.parse_args()
    d = route(args.build_year)
    print(json.dumps({"pathway": d.pathway.value, "reason": d.reason, "build_year": d.build_year}))
