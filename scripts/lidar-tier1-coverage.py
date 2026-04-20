#!/usr/bin/env python3
"""
LiDAR Spike Tier 1 — USGS 3DEP Coverage Check

For each bench address:
  1. Geocode (Nominatim, free)
  2. Query USGS TNM Access API for Lidar Point Cloud (LPC) products at lat/lng
  3. Record best-available 1m tile metadata

Output: .tmp/lidar-spike/tier1-coverage.csv
Gate: >=5/6 covered -> GREEN (proceed to Tier 2)
"""

import csv
import json
import sys
import time
from pathlib import Path

import requests

REPO = Path(__file__).resolve().parent.parent
BENCH = REPO / "scripts" / "bench-addresses.json"
OUT_DIR = REPO / ".tmp" / "lidar-spike"
OUT_CSV = OUT_DIR / "tier1-coverage.csv"
RAW_DIR = OUT_DIR / "raw"

NOMINATIM = "https://nominatim.openstreetmap.org/search"
TNM_PRODUCTS = "https://tnmaccess.nationalmap.gov/api/v1/products"
UA = "RuufPro-LiDAR-Spike/0.1 (hannah@ruufpro.com)"

# Small bbox around the point (~100m in FL ~ 0.001 deg)
BBOX_HALF = 0.001


def geocode(address: str):
    r = requests.get(
        NOMINATIM,
        params={"q": address, "format": "json", "limit": 1, "countrycodes": "us"},
        headers={"User-Agent": UA},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    if not data:
        return None, None
    return float(data[0]["lat"]), float(data[0]["lon"])


def query_tnm(lat: float, lng: float):
    bbox = f"{lng - BBOX_HALF},{lat - BBOX_HALF},{lng + BBOX_HALF},{lat + BBOX_HALF}"
    r = requests.get(
        TNM_PRODUCTS,
        params={
            "bbox": bbox,
            "datasets": "Lidar Point Cloud (LPC)",
            "prodFormats": "LAS,LAZ",
            "max": 50,
        },
        headers={"User-Agent": UA},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def pick_best(items):
    """Prefer highest quality (QL1 > QL2 > QL3) then newest."""
    def ql_rank(s: str) -> int:
        s = (s or "").upper()
        if "QL0" in s: return 0
        if "QL1" in s: return 1
        if "QL2" in s: return 2
        if "QL3" in s: return 3
        return 9

    def year_of(it):
        d = it.get("publicationDate") or it.get("dateCreated") or it.get("lastUpdated") or ""
        return d[:4] if d else ""

    def sort_key(it):
        title = it.get("title", "")
        return (ql_rank(title), -int(year_of(it) or 0))

    return sorted(items, key=sort_key)[0] if items else None


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    bench = json.loads(BENCH.read_text())
    rows = []

    for a in bench["addresses"]:
        addr = a["address"]
        print(f"\n[{a['id']}] {addr}")
        row = {
            "id": a["id"],
            "address": addr,
            "lat": "",
            "lng": "",
            "tile_id": "",
            "capture_year": "",
            "point_density": "",
            "file_size_mb": "",
            "coverage_status": "",
            "notes": "",
        }
        try:
            lat, lng = geocode(addr)
            if lat is None:
                row["coverage_status"] = "geocode_failed"
                rows.append(row)
                continue
            row["lat"], row["lng"] = lat, lng
            print(f"  geocoded: {lat:.5f}, {lng:.5f}")
            time.sleep(1.1)  # Nominatim: 1 req/sec courtesy

            data = query_tnm(lat, lng)
            (RAW_DIR / f"tnm-{a['id']}.json").write_text(json.dumps(data, indent=2))
            items = data.get("items", [])
            print(f"  TNM returned {len(items)} LPC item(s)")

            if not items:
                row["coverage_status"] = "no_coverage"
                rows.append(row)
                continue

            best = pick_best(items)
            title = best.get("title", "")
            size_bytes = best.get("sizeInBytes") or 0
            date = best.get("publicationDate") or best.get("dateCreated") or ""

            row["tile_id"] = best.get("sourceId") or best.get("id") or title[:60]
            row["capture_year"] = date[:4] if date else ""
            # QL is usually embedded in title
            ql = "UNK"
            for tag in ("QL0", "QL1", "QL2", "QL3"):
                if tag in title.upper():
                    ql = tag
                    break
            row["point_density"] = ql
            row["file_size_mb"] = f"{size_bytes / 1_000_000:.1f}" if size_bytes else ""
            row["coverage_status"] = "covered"
            row["notes"] = f"{len(items)} tiles; best: {title[:80]}"
            print(f"  COVERED  {ql}  {row['capture_year']}  {row['file_size_mb']}MB")
        except requests.HTTPError as e:
            row["coverage_status"] = f"http_error_{e.response.status_code}"
            row["notes"] = str(e)[:200]
            print(f"  HTTP ERROR: {e}")
        except Exception as e:
            row["coverage_status"] = "error"
            row["notes"] = f"{type(e).__name__}: {e}"[:200]
            print(f"  ERROR: {e}")
        rows.append(row)
        time.sleep(0.5)

    with OUT_CSV.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    covered = sum(1 for r in rows if r["coverage_status"] == "covered")
    total = len(rows)
    print(f"\n{'=' * 60}")
    print(f"COVERAGE: {covered}/{total}")
    print(f"GATE:     {'GREEN (>=5/6) — proceed to Tier 2' if covered >= 5 else 'RED (<5/6) — stop spike'}")
    print(f"OUT:      {OUT_CSV}")


if __name__ == "__main__":
    sys.exit(main())
