#!/usr/bin/env python3
"""
Footprint lookup with 3-tier fallback chain:

  1. MS Global Building Footprints (PostGIS GIST) — primary, ~<100ms
  2. LiDAR class-6 self-derive (Pipeline B approach) — covers MS-miss when LiDAR available
  3. Overpass API with circuit-breaker — last-resort, opens after 2 failures / 5-min cooldown

Per Phase B scoping Section 1:
  - MS is primary.
  - Self-derive catches post-2018 construction when MS empty AND LiDAR class-6 dense enough.
  - Overpass is research-fallback only; circuit-breaker prevents runtime latency blowups.

Per self-derive gate (decisions/phase-b-selfderive-gate.md):
  FL 3DEP vintage ≈ MS vintage (both ~2018). Self-derive does NOT meaningfully rescue
  post-2018 FL construction. Build-year router should short-circuit those requests to
  Solar pathway (see build_year_router.py).

Not wired into lib/ or app/. Entry point for BM session: resolve(lat, lng) → FootprintResult.
"""
from __future__ import annotations
import json, os, time, logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

log = logging.getLogger("phase_b.footprint_lookup")

CIRCUIT_FAIL_THRESHOLD = 2
CIRCUIT_COOLDOWN_SEC = 300  # 5 min
OVERPASS_TIMEOUT_SEC = 8
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
MS_MAX_DIST_M = 30


class Source(str, Enum):
    MICROSOFT = "microsoft"
    SELFDERIVE = "selfderive"
    OVERPASS = "overpass"
    NONE = "none"


@dataclass
class FootprintResult:
    source: Source
    geom_geojson: Optional[dict]     # Polygon GeoJSON
    latency_ms: float
    circuit_state: Optional[str] = None  # 'closed' | 'open' | 'half_open'
    error: Optional[str] = None

    def to_json(self) -> str:
        return json.dumps({**asdict(self), "source": self.source.value})


# ---------------------------------------------------------------------------
# MS lookup (PostGIS)
# ---------------------------------------------------------------------------

def _pg_conn():
    import psycopg2
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL not set")
    return psycopg2.connect(dsn)


def ms_lookup(lat: float, lng: float, max_dist_m: int = MS_MAX_DIST_M, conn=None) -> Optional[dict]:
    """Query building_footprints via footprint_lookup() SQL helper. Returns GeoJSON polygon or None.

    If `conn` is None, opens a fresh psycopg2 connection for each call (includes TCP+TLS
    handshake — ~50-100ms at cold start). If `conn` is supplied, reuses it (production case
    with pgbouncer/pool). Benches should reuse — see bench_ms_lookup.py.
    """
    close_after = False
    if conn is None:
        conn = _pg_conn()
        close_after = True
    try:
        with conn.cursor() as cur:
            cur.execute("select geom_geojson from footprint_lookup(%s, %s, %s)", (lat, lng, max_dist_m))
            row = cur.fetchone()
        return row[0] if row else None
    finally:
        if close_after:
            conn.close()


# ---------------------------------------------------------------------------
# Self-derive fallback (Pipeline B class-6 cluster → alpha-shape)
# ---------------------------------------------------------------------------

def selfderive_from_lidar(laz_path: str, lat: float, lng: float) -> Optional[dict]:
    """Run Pipeline B's class-6 cluster on a prepared LAZ tile. Returns GeoJSON or None on empty.

    Thin wrapper — heavy lifting lives in scripts/lidar-tier3-pipeline-b.py. This function
    is a stable interface; BM wires it into the runtime harness.

    Returns None if class-6 density is insufficient (legacy tile or canopy-occluded).
    """
    import sys
    from pathlib import Path as _P
    scripts_dir = _P(__file__).parent.parent
    sys.path.insert(0, str(scripts_dir))
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "pipeline_b", scripts_dir / "lidar-tier3-pipeline-b.py"
        )
        pb = importlib.util.module_from_spec(spec); spec.loader.exec_module(pb)
    except Exception as e:
        log.warning("pipeline_b import failed: %s", e)
        return None

    try:
        import laspy, numpy as np
        las = laspy.read(laz_path)
        pts = np.vstack([las.x, las.y, las.z]).T
        cls = las.classification
        bldg_pts = pts[cls == 6]
        if len(bldg_pts) < 200:
            log.info("selfderive: insufficient class-6 density (%d pts)", len(bldg_pts))
            return None
        # Pipeline B yields a concave-hull polygon around the largest cluster; reuse its helper
        # if exposed, otherwise a minimal convex hull derivation.
        if hasattr(pb, "derive_footprint_from_class6"):
            poly = pb.derive_footprint_from_class6(bldg_pts[:, :2])
        else:
            from scipy.spatial import ConvexHull
            hull = ConvexHull(bldg_pts[:, :2])
            coords = bldg_pts[hull.vertices, :2].tolist()
            coords.append(coords[0])
            poly = {"type": "Polygon", "coordinates": [coords]}
        return poly
    except Exception as e:
        log.warning("selfderive failed: %s", e)
        return None


# ---------------------------------------------------------------------------
# Overpass circuit-breaker
# ---------------------------------------------------------------------------

class _CircuitBreaker:
    """In-process + DB-backed breaker. DB state persists across cold starts (per footprint_source_health table).

    States:
      CLOSED     — normal; failures increment consecutive_failures
      OPEN       — CIRCUIT_FAIL_THRESHOLD reached; requests short-circuit until cooldown expires
      HALF_OPEN  — one probe request allowed after cooldown; success closes, failure re-opens
    """

    def __init__(self, source: str = "overpass"):
        self.source = source

    def _read_state(self) -> tuple[int, Optional[datetime]]:
        conn = _pg_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "select consecutive_failures, circuit_opened_at from footprint_source_health where source=%s",
                    (self.source,),
                )
                row = cur.fetchone()
                return (row[0], row[1]) if row else (0, None)
        finally:
            conn.close()

    def allow(self) -> tuple[bool, str]:
        fails, opened_at = self._read_state()
        if fails < CIRCUIT_FAIL_THRESHOLD:
            return True, "closed"
        if opened_at is None:
            return True, "closed"  # defensive — threshold hit but no timestamp
        age = datetime.now(opened_at.tzinfo) - opened_at
        if age.total_seconds() >= CIRCUIT_COOLDOWN_SEC:
            return True, "half_open"
        return False, "open"

    def record_success(self):
        conn = _pg_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "update footprint_source_health set consecutive_failures=0, "
                    "circuit_opened_at=null, last_success_at=now() where source=%s",
                    (self.source,),
                )
                conn.commit()
        finally:
            conn.close()

    def record_failure(self):
        conn = _pg_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "update footprint_source_health "
                    "set consecutive_failures = consecutive_failures + 1, "
                    "    last_failure_at = now(), "
                    "    circuit_opened_at = case when consecutive_failures + 1 >= %s "
                    "                              and circuit_opened_at is null "
                    "                         then now() else circuit_opened_at end "
                    "where source=%s",
                    (CIRCUIT_FAIL_THRESHOLD, self.source),
                )
                conn.commit()
        finally:
            conn.close()


def overpass_lookup(lat: float, lng: float, breaker: Optional[_CircuitBreaker] = None) -> tuple[Optional[dict], str]:
    """Returns (geojson_polygon_or_none, circuit_state). Short-circuits if breaker OPEN."""
    br = breaker or _CircuitBreaker()
    allowed, state = br.allow()
    if not allowed:
        return None, state

    query = f"""[out:json][timeout:{OVERPASS_TIMEOUT_SEC}];
(way["building"](around:25,{lat},{lng});relation["building"](around:25,{lat},{lng}););
out geom;"""
    req = Request(OVERPASS_URL, data=f"data={query}".encode(), method="POST")
    try:
        with urlopen(req, timeout=OVERPASS_TIMEOUT_SEC) as resp:
            data = json.loads(resp.read())
        br.record_success()
        polys = _overpass_to_polygons(data)
        if not polys:
            return None, state
        nearest = min(polys, key=lambda p: _centroid_dist2(p, lat, lng))
        return nearest, state
    except (HTTPError, URLError, TimeoutError, OSError) as e:
        log.warning("overpass failed: %s", e)
        br.record_failure()
        # Return the state that was granted at the top (closed or half_open), not a blanket "closed".
        return None, state


def _overpass_to_polygons(data: dict) -> list[dict]:
    out = []
    for el in data.get("elements", []):
        geom = el.get("geometry")
        if not geom: continue
        coords = [[g["lon"], g["lat"]] for g in geom]
        if len(coords) < 4: continue
        if coords[0] != coords[-1]: coords.append(coords[0])
        out.append({"type": "Polygon", "coordinates": [coords]})
    return out


def _centroid_dist2(poly: dict, lat: float, lng: float) -> float:
    coords = poly["coordinates"][0]
    cx = sum(c[0] for c in coords) / len(coords)
    cy = sum(c[1] for c in coords) / len(coords)
    return (cx - lng) ** 2 + (cy - lat) ** 2


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

def resolve(lat: float, lng: float, laz_path: Optional[str] = None) -> FootprintResult:
    """Primary entry point. Runs MS → self-derive (if LAZ given) → Overpass."""
    t0 = time.time()

    # 1. MS primary
    try:
        geom = ms_lookup(lat, lng)
    except Exception as e:
        log.warning("ms_lookup error: %s", e)
        geom = None
    if geom is not None:
        return FootprintResult(Source.MICROSOFT, geom, (time.time() - t0) * 1000)

    # 2. Self-derive (only if a LAZ path was supplied by the caller — needed to avoid hidden I/O)
    if laz_path:
        geom = selfderive_from_lidar(laz_path, lat, lng)
        if geom is not None:
            return FootprintResult(Source.SELFDERIVE, geom, (time.time() - t0) * 1000)

    # 3. Overpass last-resort
    breaker = _CircuitBreaker()
    geom, circuit_state = overpass_lookup(lat, lng, breaker)
    if geom is not None:
        return FootprintResult(Source.OVERPASS, geom, (time.time() - t0) * 1000, circuit_state=circuit_state)

    return FootprintResult(
        Source.NONE, None, (time.time() - t0) * 1000,
        circuit_state=circuit_state, error="all_sources_exhausted",
    )


if __name__ == "__main__":
    import argparse
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lng", type=float, required=True)
    ap.add_argument("--laz", help="optional LAZ for self-derive fallback")
    args = ap.parse_args()
    result = resolve(args.lat, args.lng, args.laz)
    print(result.to_json())
