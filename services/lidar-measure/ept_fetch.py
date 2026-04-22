"""
Track A.10 §3 — EPT primary fetch client.

Reads from s3://usgs-lidar-public via PDAL readers.ept (HTTPS, no-auth).
Produces a LAZ slice clipped to the parcel bbox in the same on-disk format
Pipeline A expects.

Public API:
    fetch_parcel_slice(lat, lng, output_laz_path) -> FetchResult

Pipeline A source is NOT edited — this module only produces a LAZ file.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Same parcel half-width as TNM path (≈200m at FL latitudes) — keeps cache key
# geometry consistent across fetch paths. See scoping doc §6.2.
EPT_BBOX_HALF_DEG = 0.002

# PDAL subprocess budget. EPT slice is typically 5–30 MB streamed from S3;
# 30s covers worst-case cross-region (us-west-2 → Modal) at slow links.
PDAL_TIMEOUT_S = 30

CATALOG_PATH = Path(__file__).parent / "ept_fl_datasets.json"


@dataclass
class FetchResult:
    outcome: str  # 'ok' | 'ept_empty_coverage_gap' | 'ept_error' | 'no_catalog_match'
    collection_id: str | None = None
    point_count: int | None = None
    stderr_tail: str | None = None


def _load_catalog() -> list[dict[str, Any]]:
    with CATALOG_PATH.open() as f:
        return json.load(f)["datasets"]


def _candidates_for_point(lat: float, lng: float) -> list[dict[str, Any]]:
    """Return FL EPT datasets whose native bounds contain the parcel bbox.

    All FL EPT collections are EPSG:3857. We reproject the parcel bbox once
    and test intersection against the [minx,miny,maxx,maxy] tuple per dataset.

    Sort order: newest collection_id first (2018 before 2007 via string sort
    on the embedded year suffix). This matches the TNM 'newest first' rule in
    app.py::_tnm_pick_best_laz and keeps cross-path selection consistent.
    """
    from pyproj import Transformer

    catalog = _load_catalog()
    # WGS84 (4326) -> Web Mercator (3857). Strictly forward transform.
    transformer = Transformer.from_crs(4326, 3857, always_xy=True)
    cx, cy = transformer.transform(lng, lat)
    half_m = 225.0  # ≈ 0.002deg at FL latitudes, matched to TNM half-width
    pminx, pminy = cx - half_m, cy - half_m
    pmaxx, pmaxy = cx + half_m, cy + half_m

    matches: list[dict[str, Any]] = []
    for entry in catalog:
        # EPT bounds are [minx, miny, minz, maxx, maxy, maxz]
        b = entry["bounds_native"]
        dminx, dminy, dmaxx, dmaxy = b[0], b[1], b[3], b[4]
        # bbox intersection test (inclusive)
        if pmaxx < dminx or pminx > dmaxx:
            continue
        if pmaxy < dminy or pminy > dmaxy:
            continue
        # Only EPSG:3857 datasets handled in v1. Others fall through to TNM
        # (logged but not tried). 100% of FL entries in the current catalog
        # are 3857; defensive check only.
        if entry.get("srs_horizontal") != "3857":
            continue
        matches.append(entry)

    # Newest-first sort: extract trailing 4-digit year from collection_id.
    def _year_key(e: dict[str, Any]) -> int:
        cid = e["collection_id"]
        for tok in reversed(cid.split("_")):
            if tok.isdigit() and len(tok) == 4:
                return int(tok)
        return 0

    matches.sort(key=_year_key, reverse=True)
    return matches


def _pdal_pipeline(ept_url: str, bbox_3857: tuple[float, float, float, float], out_laz: Path) -> dict:
    """Build the PDAL pipeline JSON. Class-6 filter mirrors Pipeline A's
    downstream expectation (Pipeline A's subprocess reads whatever LAZ arrives
    and does its own roof-point extraction, so we keep the slice broad here —
    no classification filter at fetch time)."""
    minx, miny, maxx, maxy = bbox_3857
    return {
        "pipeline": [
            {
                "type": "readers.ept",
                "filename": ept_url,
                "bounds": f"([{minx},{maxx}],[{miny},{maxy}])",
                "threads": 4,
            },
            {
                "type": "writers.las",
                "filename": str(out_laz),
                "compression": "laszip",
                "forward": "all",
            },
        ]
    }


def fetch_parcel_slice(lat: float, lng: float, output_laz: Path) -> FetchResult:
    """Fetch a parcel-scale LAZ slice from EPT primary.

    Returns FetchResult.outcome:
      - 'ok'                        — slice written, >0 points
      - 'no_catalog_match'          — no FL EPT dataset covers the parcel (FL keys, Collier gap)
      - 'ept_empty_coverage_gap'    — dataset matched but slice has 0 points
      - 'ept_error'                 — PDAL subprocess failed / S3 5xx / timeout
    """
    from pyproj import Transformer

    cands = _candidates_for_point(lat, lng)
    if not cands:
        return FetchResult(outcome="no_catalog_match")

    transformer = Transformer.from_crs(4326, 3857, always_xy=True)
    cx, cy = transformer.transform(lng, lat)
    half_m = 225.0
    bbox_3857 = (cx - half_m, cy - half_m, cx + half_m, cy + half_m)

    output_laz.parent.mkdir(parents=True, exist_ok=True)

    last_err: str | None = None
    for cand in cands:
        pipeline = _pdal_pipeline(cand["ept_url"], bbox_3857, output_laz)
        try:
            proc = subprocess.run(
                ["pdal", "pipeline", "--stdin"],
                input=json.dumps(pipeline),
                capture_output=True,
                text=True,
                timeout=PDAL_TIMEOUT_S,
            )
        except subprocess.TimeoutExpired as e:
            last_err = f"pdal timeout on {cand['collection_id']}: {e}"
            continue

        if proc.returncode != 0:
            last_err = f"pdal rc={proc.returncode} on {cand['collection_id']}: {proc.stderr[-400:]}"
            # On the first candidate failure, try next (a 404 on an older
            # collection's ept.json is routine — e.g. Hobu occasionally reshapes).
            continue

        # Count points in the emitted LAZ. If 0, slice is a coverage hole inside
        # this collection's bbox (e.g. water body, intra-dataset gap). Try next.
        if not output_laz.exists() or output_laz.stat().st_size < 1024:
            last_err = f"empty laz from {cand['collection_id']}"
            continue

        # Cheap point-count via laspy (already in image for Pipeline A).
        try:
            import laspy

            with laspy.open(str(output_laz)) as f:
                n = f.header.point_count
            if n <= 0:
                last_err = f"zero points from {cand['collection_id']}"
                continue
            return FetchResult(
                outcome="ok",
                collection_id=cand["collection_id"],
                point_count=int(n),
            )
        except Exception as e:  # laspy read failure = bad slice
            last_err = f"laspy read failed on {cand['collection_id']}: {e}"
            continue

    # All candidates exhausted
    if last_err and "timeout" in last_err or last_err and "rc=" in last_err:
        return FetchResult(outcome="ept_error", stderr_tail=last_err)
    return FetchResult(outcome="ept_empty_coverage_gap", stderr_tail=last_err)
