#!/usr/bin/env python3
"""
Unit test self-derive fallback on 4 existing Phase A tiles (1, 2, 3, 5).

Tile 5 is legacy pre-QL2 (Hillsborough 2007) — class-6 density insufficient. Expected:
selfderive returns None on tile5, polygons on tiles 1-3.

Stop condition: tiles 1+2+3 return a Polygon; tile 5 returns None (documented limitation).

Usage:
  python3 scripts/phase_b/test_selfderive.py
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from footprint_lookup import selfderive_from_lidar

# Tile paths + bench coords. Adjust if bench artifacts moved.
TILES = [
    {"id": 1, "laz": ".tmp/calculator-bench/tile1.laz", "lat": 30.2538, "lng": -81.5128, "expect_polygon": True},
    {"id": 2, "laz": ".tmp/calculator-bench/tile2.laz", "lat": 30.3322, "lng": -81.6557, "expect_polygon": True},
    {"id": 3, "laz": ".tmp/calculator-bench/tile3.laz", "lat": 30.1661, "lng": -81.4516, "expect_polygon": True},
    {"id": 5, "laz": ".tmp/calculator-bench/tile5.laz", "lat": 27.8903, "lng": -82.5132, "expect_polygon": False},  # legacy
]


def main():
    pass_count, fail_count, skip_count = 0, 0, 0
    for t in TILES:
        laz = Path(t["laz"])
        if not laz.exists():
            print(f"  tile{t['id']} SKIP (no LAZ at {laz})"); skip_count += 1; continue
        poly = selfderive_from_lidar(str(laz), t["lat"], t["lng"])
        got_polygon = poly is not None and poly.get("type") == "Polygon"
        ok = got_polygon == t["expect_polygon"]
        status = "✅ pass" if ok else "❌ FAIL"
        shape = "Polygon" if got_polygon else "None"
        expect = "Polygon" if t["expect_polygon"] else "None"
        print(f"  tile{t['id']} {status}  got={shape}  expected={expect}")
        if ok: pass_count += 1
        else: fail_count += 1
    print()
    print(f"  pass={pass_count}  fail={fail_count}  skip={skip_count}")
    if skip_count == len(TILES):
        print("  ⚠  All tiles skipped — LAZ files not present. Bench artifacts may be gitignored.")
    sys.exit(0 if fail_count == 0 else 1)


if __name__ == "__main__":
    main()
