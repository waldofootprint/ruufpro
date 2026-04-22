"""
Track A.10 §8 step 1+2 — enumerate FL EPT datasets + bake spatial index.

Fetches each FL_* ept.json from s3://usgs-lidar-public/, extracts bbox + srs,
writes a single JSON catalog used by fetch_dispatch.py at runtime.

Run: python3 services/lidar-measure/enumerate_fl_ept.py
Output: services/lidar-measure/ept_fl_datasets.json

This is a build-time script — its output is committed to the repo and loaded
by the Modal app at cold-start. Re-run when new FL collections appear.
"""

from __future__ import annotations

import concurrent.futures as cf
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

BUCKET_BASE = "https://usgs-lidar-public.s3.amazonaws.com"
OUTPUT_PATH = Path(__file__).parent / "ept_fl_datasets.json"


def _list_fl_prefixes() -> list[str]:
    """Return list of FL_* top-level prefixes in the EPT bucket."""
    url = f"{BUCKET_BASE}/?prefix=FL_&delimiter=/"
    with urllib.request.urlopen(url, timeout=15) as r:
        raw = r.read()
    ns = {"s3": "http://s3.amazonaws.com/doc/2006-03-01/"}
    root = ET.fromstring(raw)
    prefixes = []
    for cp in root.findall("s3:CommonPrefixes", ns):
        pre = cp.find("s3:Prefix", ns)
        if pre is not None and pre.text and pre.text.endswith("/"):
            prefixes.append(pre.text.rstrip("/"))
    return sorted(prefixes)


def _fetch_ept_json(collection: str) -> dict[str, Any] | None:
    url = f"{BUCKET_BASE}/{collection}/ept.json"
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  [skip] {collection}: {e}", file=sys.stderr)
        return None


def _entry(collection: str) -> dict[str, Any] | None:
    data = _fetch_ept_json(collection)
    if not data:
        return None
    bounds = data.get("bounds")
    srs = data.get("srs") or {}
    if not bounds or len(bounds) != 6:
        return None
    # EPT bounds = [minx, miny, minz, maxx, maxy, maxz] in dataset CRS.
    # srs.horizontal + srs.wkt give projection; preserve both for pyproj.
    return {
        "collection_id": collection,
        "ept_url": f"{BUCKET_BASE}/{collection}/ept.json",
        "bounds_native": bounds,
        "srs_horizontal": srs.get("horizontal"),
        "srs_vertical": srs.get("vertical"),
        "srs_wkt": srs.get("wkt"),
        "points": data.get("points"),
    }


def main() -> int:
    print(f"[enumerate] listing FL_* prefixes from {BUCKET_BASE}/")
    prefixes = _list_fl_prefixes()
    print(f"[enumerate] {len(prefixes)} FL collections found")

    entries: list[dict[str, Any]] = []
    with cf.ThreadPoolExecutor(max_workers=16) as pool:
        futures = {pool.submit(_entry, p): p for p in prefixes}
        for fut in cf.as_completed(futures):
            e = fut.result()
            if e is not None:
                entries.append(e)

    entries.sort(key=lambda x: x["collection_id"])
    out = {
        "generated_from": f"{BUCKET_BASE}/?prefix=FL_&delimiter=/",
        "bucket": "usgs-lidar-public",
        "region": "us-west-2",
        "count": len(entries),
        "datasets": entries,
    }
    OUTPUT_PATH.write_text(json.dumps(out, indent=2))
    print(f"[enumerate] wrote {len(entries)} entries -> {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
