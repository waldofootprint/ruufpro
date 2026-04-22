"""
Track A.3-A.6 — Modal runtime for Pipeline A (LiDAR sqft/pitch/segments/perimeter).
Track A.10 — Fetch redundancy (EPT primary + TNM secondary + Solar tertiary).

Wraps scripts/lidar-tier3-geometry.py @ 0367980 (frozen post-A.8-prep). Handles
parcel fetch via fetch_dispatch (EPT first, TNM second) + subprocess invocation
+ output mapping to the TS `LidarResult` shape in lib/measurement-pipeline.types.ts.

Deploy: modal deploy services/lidar-measure/app.py
Invoke: POST {lat, lng, address, debug_skip_ept?, debug_skip_tnm?} to the deployed URL.

Cold-only deploy per Hannah 2026-04-22 (Option a). keep_warm left OFF — flip
ON at A.8 pilot if cost analysis on smoke supports it.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import modal

# ---------------------------------------------------------------------------
# Image — Track A.10 rebase to micromamba + conda-forge PDAL.
#
# Track A.1–A.6 dropped apt-install(pdal) because (a) PDAL isn't in Debian
# bookworm's default repos and (b) Pipeline A doesn't import PDAL — tier3
# reads LAZ via laspy[lazrs]. Track A.10 re-adds PDAL for `readers.ept`
# (EPT primary fetch) via micromamba + conda-forge, which pins cleanly and
# leaves the laspy pip layer intact. Image grows ~+300MB; acceptable per
# scoping doc signoff 2026-04-22.
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPTS_DIR = REPO_ROOT / "scripts"
LIDAR_MEASURE_DIR = Path(__file__).resolve().parent

image = (
    modal.Image.micromamba(python_version="3.11")
    .micromamba_install(
        "pdal=2.7",
        "python-pdal=3.4",
        channels=["conda-forge"],
    )
    .pip_install(
        "numpy==1.26.4",
        "scipy==1.13.1",
        "laspy[lazrs]==2.5.4",
        "shapely==2.0.4",
        "requests==2.32.3",
        "pyproj==3.6.1",
        # Modal 1.4+ no longer auto-injects FastAPI for web endpoints.
        "fastapi[standard]==0.115.4",
    )
    # Single source of truth: mount the real scripts/ directory. No copy.
    .add_local_dir(SCRIPTS_DIR.as_posix(), remote_path="/opt/scripts")
    # Track A.10: mount lidar-measure/ modules (ept_fetch, fetch_dispatch,
    # circuit_breaker) + FL EPT catalog JSON into /root so they're importable
    # by app.py. /root is on sys.path by default on Modal.
    .add_local_dir(LIDAR_MEASURE_DIR.as_posix(), remote_path="/root/lidar_measure")
)

app = modal.App("lidar-measure", image=image)

# ---------------------------------------------------------------------------
# TNM orchestration — unchanged behavior, wrapped into a closure for
# fetch_dispatch. See Track A.10 scoping §4 "TNM role shift".
# ---------------------------------------------------------------------------

TNM_API = "https://tnmaccess.nationalmap.gov/api/v1/products"
TNM_TIMEOUT_S = 10
LAZ_DOWNLOAD_TIMEOUT_S = 20
# ~0.002deg ≈ 200m at FL latitudes. Enough to catch the tile containing the
# address; TNM returns items whose bbox intersects.
TNM_BBOX_HALF_DEG = 0.002
TIER3_SUBPROCESS_TIMEOUT_S = 40


def _tnm_pick_best_laz(items: list[dict]) -> dict | None:
    """Pick highest-quality LAZ item from TNM response.

    Prefers newest (dateCreated) among LAZ-formatted items with a downloadURL.
    """
    laz_items = []
    for it in items:
        fmts = (it.get("format") or "").upper()
        url = it.get("downloadURL") or it.get("urls", {}).get("LAZ")
        if not url:
            continue
        if "LAZ" not in fmts and not url.lower().endswith(".laz"):
            continue
        laz_items.append(it)
    if not laz_items:
        return None
    laz_items.sort(
        key=lambda x: (x.get("publicationDate") or x.get("dateCreated") or ""),
        reverse=True,
    )
    return laz_items[0]


def _fetch_tnm_laz_url(lat: float, lng: float) -> tuple[str | None, str]:
    """Returns (downloadURL, outcome). outcome is 'ok' or a failure code."""
    import requests

    minx = lng - TNM_BBOX_HALF_DEG
    miny = lat - TNM_BBOX_HALF_DEG
    maxx = lng + TNM_BBOX_HALF_DEG
    maxy = lat + TNM_BBOX_HALF_DEG
    params = {
        "datasets": "Lidar Point Cloud (LPC)",
        "bbox": f"{minx},{miny},{maxx},{maxy}",
        "prodFormats": "LAZ",
        "max": 20,
    }
    try:
        r = requests.get(TNM_API, params=params, timeout=TNM_TIMEOUT_S)
    except requests.exceptions.RequestException:
        return None, "tnm_5xx_or_timeout"
    if r.status_code >= 500:
        return None, "tnm_5xx_or_timeout"
    if r.status_code != 200:
        return None, "tnm_5xx_or_timeout"
    try:
        data = r.json()
    except ValueError:
        return None, "tnm_5xx_or_timeout"
    items = data.get("items") or []
    pick = _tnm_pick_best_laz(items)
    if not pick:
        return None, "no_footprint_lidar"
    return pick.get("downloadURL"), "ok"


def _download_laz(url: str, dest: Path) -> str:
    """Returns 'ok' or 'laz_download_failed'."""
    import requests

    try:
        with requests.get(url, stream=True, timeout=LAZ_DOWNLOAD_TIMEOUT_S) as r:
            if r.status_code != 200:
                return "laz_download_failed"
            with dest.open("wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
        if dest.stat().st_size < 1024:
            return "laz_download_failed"
        return "ok"
    except requests.exceptions.RequestException:
        return "laz_download_failed"


def _tnm_fetcher(lat: float, lng: float, output_laz: Path) -> str:
    """Closure passed to fetch_dispatch. Returns outcome string matching the
    existing harness contract: 'ok' | 'tnm_5xx_or_timeout' | 'laz_download_failed'
    | 'no_footprint_lidar'.
    """
    url, outcome = _fetch_tnm_laz_url(lat, lng)
    if outcome != "ok":
        return outcome
    assert url is not None
    return _download_laz(url, output_laz)


# ---------------------------------------------------------------------------
# Pipeline A invocation (subprocess; source frozen at 0367980 post-A.8-prep)
# ---------------------------------------------------------------------------


def _classify_tier3_failure(stderr: str) -> str:
    """Map Pipeline A SystemExit strings to LidarOutcome codes."""
    s = stderr.lower()
    if "too few roof points" in s or "too few points inside footprint" in s:
        return "no_class_6"
    if "no footprint" in s:
        return "no_footprint_lidar"
    return "pipeline_crash"


def _run_tier3(laz_path: Path, lat: float, lng: float) -> tuple[dict | None, str, str]:
    """Subprocess-invoke scripts/lidar-tier3-geometry.py.

    Returns (parsed_output_json, outcome, stderr_for_debug).
    On success, outcome='ok'. On failure, outcome is a LidarOutcome code.
    """
    cmd = [
        "python3",
        "/opt/scripts/lidar-tier3-geometry.py",
        str(laz_path),
        str(lat),
        str(lng),
    ]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TIER3_SUBPROCESS_TIMEOUT_S,
            cwd="/opt/scripts",
        )
    except subprocess.TimeoutExpired as e:
        return None, "pipeline_crash", f"timeout: {e}"

    if proc.returncode != 0:
        return None, _classify_tier3_failure(proc.stderr), proc.stderr

    # tier3 writes <laz.parent.parent>/tier3-<stem>.json
    out_path = laz_path.parent.parent / f"tier3-{laz_path.stem}.json"
    if not out_path.exists():
        return None, "pipeline_crash", f"expected output missing: {out_path}"
    try:
        data = json.loads(out_path.read_text())
    except ValueError as e:
        return None, "pipeline_crash", f"bad json: {e}"
    return data, "ok", proc.stderr


# ---------------------------------------------------------------------------
# Map tier3 JSON → LidarResult TS shape
# ---------------------------------------------------------------------------


def _weighted_pitch(segments: list[dict]) -> float | None:
    """Area-weighted mean pitch (rise/run). Converts pitch_ratio_over_12 ÷ 12.

    tier3 output expresses pitch as 'N/12' (pitch_ratio_over_12). TS LidarResult
    uses raw rise/run. Conversion is exact for all non-zero divisors.
    """
    if not segments:
        return None
    num = 0.0
    den = 0.0
    for s in segments:
        area = float(s.get("horiz_area_sqft") or 0.0)
        p12 = s.get("pitch_ratio_over_12")
        if p12 is None or area <= 0:
            continue
        num += area * (float(p12) / 12.0)
        den += area
    return (num / den) if den > 0 else None


def _map_to_lidar_result(tier3_json: dict, elapsed_ms: int, fetch_meta: dict) -> dict:
    """Tier3 output → LidarResult JSON (matches lib/measurement-pipeline.types.ts).

    Pipeline A @ 0367980 exposes `inlierRatio` (aggregate mean RANSAC inlier
    ratio, area-weighted) and `residual` (aggregate RMS plane fit residual, m).
    Track A.8 gate now reads both from this payload — no undefined fallback.

    `fetch_meta` carries A.10 telemetry (fetch_path, collection_id) piped through
    to the response for Modal-log auditability. Not part of the TS LidarResult
    contract; kept as an optional field until the TS type is updated.
    """
    segments = tier3_json.get("segments") or []
    roof_horiz = tier3_json.get("roof_horiz_sqft")
    footprint = tier3_json.get("structure_footprint_sqft") or 0
    alpha_area = tier3_json.get("roof_alpha_area_sqft") or 0

    coverage = None
    if footprint and footprint > 0 and alpha_area > 0:
        coverage = max(0.0, min(1.0, alpha_area / footprint))

    return {
        "outcome": "ok",
        "horizSqft": roof_horiz,
        "pitch": _weighted_pitch(segments),
        "segmentCount": tier3_json.get("num_segments"),
        "perimeterFt": tier3_json.get("roof_perimeter_ft"),
        "inlierRatio": tier3_json.get("inlierRatio"),
        "density": tier3_json.get("point_density_pts_per_m2"),
        "footprintCoverage": coverage,
        "residual": tier3_json.get("residual"),
        "cacheTier": "cold",
        "elapsedMs": elapsed_ms,
        "fetchPath": fetch_meta.get("fetch_path"),
        "fetchCollection": fetch_meta.get("collection_id"),
    }


# ---------------------------------------------------------------------------
# Modal function — POST /measure
# ---------------------------------------------------------------------------


@app.function(timeout=90)
@modal.fastapi_endpoint(method="POST")
def measure(body: dict[str, Any]) -> dict:
    """POST /measure — returns JSON matching TS LidarResult shape.

    Request:  {"lat": <float>, "lng": <float>, "address": <str>,
               "debug_skip_ept"?: <bool>, "debug_skip_tnm"?: <bool>}
    Response: LidarResult JSON (plus fetchPath + fetchCollection telemetry).

    debug_skip_* flags satisfy Track A.10 §9 Gate 1 + Gate 2: smoke forces one
    path unreachable at the dispatch layer so the other path is exercised in
    isolation. Flags are auditable via Modal logs; no image-level env vars.
    """
    # A.10 imports — inside the function so Modal builds the image before trying
    # to resolve them locally. /root/lidar_measure is on the image via the
    # add_local_dir mount above.
    sys.path.insert(0, "/root/lidar_measure")
    import fetch_dispatch  # type: ignore

    t0 = time.time()

    try:
        lat = float(body["lat"])
        lng = float(body["lng"])
    except (KeyError, TypeError, ValueError):
        return {
            "outcome": "pipeline_crash",
            "elapsedMs": int((time.time() - t0) * 1000),
        }

    debug_skip_ept = bool(body.get("debug_skip_ept"))
    debug_skip_tnm = bool(body.get("debug_skip_tnm"))

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        laz_dir = tmp_dir / "tile" / "laz"
        laz_dir.mkdir(parents=True, exist_ok=True)
        laz_path = laz_dir / "tile.laz"

        # 1. Fetch dispatch (EPT primary -> TNM secondary)
        dr = fetch_dispatch.dispatch(
            lat,
            lng,
            laz_path,
            debug_skip_ept=debug_skip_ept,
            debug_skip_tnm=debug_skip_tnm,
            tnm_fetcher=_tnm_fetcher,
        )

        if dr.outcome != "ok":
            return {
                "outcome": dr.outcome,
                "fetchPath": dr.fetch_path,
                "elapsedMs": int((time.time() - t0) * 1000),
            }

        # 2. Pipeline A subprocess
        data, outcome, stderr = _run_tier3(laz_path, lat, lng)
        if outcome != "ok":
            print(f"[tier3 fail outcome={outcome} fetch_path={dr.fetch_path}] stderr tail:\n{stderr[-800:]}")
            return {
                "outcome": outcome,
                "fetchPath": dr.fetch_path,
                "fetchCollection": dr.collection_id,
                "elapsedMs": int((time.time() - t0) * 1000),
            }
        assert data is not None

    # 3. Map to LidarResult + attach fetch telemetry
    fetch_meta = {"fetch_path": dr.fetch_path, "collection_id": dr.collection_id}
    return _map_to_lidar_result(data, int((time.time() - t0) * 1000), fetch_meta)


# ---------------------------------------------------------------------------
# Local smoke hook (optional: `modal run services/lidar-measure/app.py`)
# ---------------------------------------------------------------------------


@app.local_entrypoint()
def local_smoke():
    """One-off local invocation for sanity-checking the image builds + boots."""
    sample = {"lat": 30.3322, "lng": -81.6557, "address": "Jacksonville, FL"}
    print(json.dumps(measure.remote(sample), indent=2))
