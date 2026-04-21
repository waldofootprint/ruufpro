#!/usr/bin/env python3
"""
Phase B / Session BK — MS Global Building Footprints GeoJSON → TSV for psql \\copy.

Stream-parses MS FL (newline-delimited Features inside an outer FeatureCollection wrapper),
emits TSV with EWKB-hex geometry + attrs. TSV ships straight into
`building_footprints(geom, state_code, source, vintage_year)` via `\\copy` — Postgres
`geometry(Polygon, 4326)` input function accepts EWKB hex with SRID embedded, so no
staging table is needed.

MultiPolygon handling (option A per BK decision):
  Migration 079 column is strict `geometry(Polygon, 4326)`. MS FL source is mostly
  simple Polygons but includes some MultiPolygons.
    * MultiPolygon w/ exactly ONE ring  →  coerce to its single Polygon and write.
                                            Keeps the building; avoids false-skip.
    * MultiPolygon w/ 2+ rings          →  cannot fit Polygon column without loss of
                                            rings; count as `multi_ring_skipped` (own
                                            counter, not conflated with malformed or
                                            non_polygon_type). Logged sample to stderr.
  If `multi_ring_skipped` is materially >0 on the FL load, a schema change to
  `geometry(MultiPolygon, 4326)` becomes a future decision — tracked explicitly, not
  dropped silently.

Schema note (vintage_year canonicity):
  Migration 079 schema defines `vintage_year int` as the per-row capture-year column.
  Earlier BJ loader (`ms_load_api.py`) referenced a `capture_year` column against an
  older schema draft; that column does NOT exist in the current migration. This
  loader writes ONLY the four columns present in migration 079: geom, state_code,
  source, vintage_year. `vintage_year` = max year parsed from MS
  `capture_dates_range`, fallback 2018.

Prep-stage reconciliation gate (Gate 1 of two), 5 counters:
    source_features_read
      == polygons_written
       + non_polygon_type_skipped
       + multi_ring_skipped
       + malformed_skipped
Non-zero exit on mismatch. Never silently skips.

Sample (first 20) of skipped feature line numbers logged to stderr for eyeballing.

Usage:
    python3 scripts/phase_b/ms_prep.py \\
        --geojson .cache/ms_footprints/Florida.geojson \\
        --out .cache/ms_footprints/florida.tsv
"""
import argparse
import json
import sys
import time
from pathlib import Path

try:
    from shapely.geometry import shape
    from shapely import wkb
except ImportError:
    print("ERROR: shapely required. `pip install shapely`", file=sys.stderr)
    sys.exit(2)


STATE_CODE = "FL"
SOURCE_TAG = "microsoft_us_building_footprints"
DEFAULT_VINTAGE = 2018
SAMPLE_SKIP_LOG_LIMIT = 20


def stream_features(path: Path):
    """MS ships newline-delimited Features inside a FeatureCollection wrapper.
    Yields (line_no, feature_dict) on a parseable line or (line_no, None) on a line
    that LOOKED like a Feature but failed JSON decode. Wrapper header/footer lines
    that never started with `{"type":"Feature"` are NOT yielded — they're not
    features and not malformed, just envelope. This means `source_features_read`
    counts every yielded tuple."""
    with open(path) as f:
        for ln, raw in enumerate(f, start=1):
            line = raw.strip().rstrip(",")
            if not line:
                continue
            if not line.startswith('{"type":"Feature"'):
                continue
            try:
                yield ln, json.loads(line)
            except json.JSONDecodeError:
                yield ln, None


def capture_year(props):
    """Parse MS 'capture_dates_range' like '1/25/2019-1/2/2022' → latest year.
    Fallback DEFAULT_VINTAGE if absent / unparseable."""
    rng = (props or {}).get("capture_dates_range") or ""
    years = []
    for tok in rng.replace("-", " ").replace("/", " ").split():
        if tok.isdigit() and 1900 < int(tok) < 2100:
            years.append(int(tok))
    return max(years) if years else DEFAULT_VINTAGE


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--geojson", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    src = Path(args.geojson)
    dst = Path(args.out)
    if not src.exists():
        print(f"ERROR: source GeoJSON not found: {src}", file=sys.stderr)
        sys.exit(2)
    dst.parent.mkdir(parents=True, exist_ok=True)

    source_features_read = 0
    polygons_written = 0
    polygons_written_coerced_from_mp = 0  # sub-count of polygons_written (not a separate gate term)
    non_polygon_type_skipped = 0
    multi_ring_skipped = 0
    malformed_skipped = 0
    skip_log = []

    t0 = time.time()
    with open(dst, "w") as fo:
        fo.write("geom\tstate_code\tsource\tvintage_year\n")
        for line_no, feat in stream_features(src):
            source_features_read += 1
            if feat is None:
                malformed_skipped += 1
                if len(skip_log) < SAMPLE_SKIP_LOG_LIMIT:
                    skip_log.append(f"L{line_no}: json-decode-failed")
                continue
            geom_raw = feat.get("geometry")
            if not geom_raw:
                non_polygon_type_skipped += 1
                if len(skip_log) < SAMPLE_SKIP_LOG_LIMIT:
                    skip_log.append(f"L{line_no}: no geometry field")
                continue
            gtype = geom_raw.get("type")

            if gtype == "Polygon":
                pass  # happy path — proceed to shapely parse below
            elif gtype == "MultiPolygon":
                # Option A coercion: single-ring MP → Polygon; multi-ring → own counter.
                coords = geom_raw.get("coordinates") or []
                if len(coords) == 1:
                    geom_raw = {"type": "Polygon", "coordinates": coords[0]}
                    polygons_written_coerced_from_mp += 1
                else:
                    multi_ring_skipped += 1
                    if len(skip_log) < SAMPLE_SKIP_LOG_LIMIT:
                        skip_log.append(
                            f"L{line_no}: multipolygon rings={len(coords)} (skipped — "
                            f"schema is geometry(Polygon))"
                        )
                    continue
            else:
                non_polygon_type_skipped += 1
                if len(skip_log) < SAMPLE_SKIP_LOG_LIMIT:
                    skip_log.append(f"L{line_no}: unsupported type={gtype!r}")
                continue

            try:
                g = shape(geom_raw)
                ewkb_hex = wkb.dumps(g, hex=True, srid=4326)
            except Exception as e:
                malformed_skipped += 1
                if len(skip_log) < SAMPLE_SKIP_LOG_LIMIT:
                    skip_log.append(f"L{line_no}: shapely-failed {type(e).__name__}")
                continue
            vy = capture_year(feat.get("properties"))
            fo.write(f"{ewkb_hex}\t{STATE_CODE}\t{SOURCE_TAG}\t{vy}\n")
            polygons_written += 1

            if polygons_written and polygons_written % 500_000 == 0:
                elapsed = time.time() - t0
                rate = polygons_written / elapsed if elapsed else 0
                print(
                    f"  progress: read={source_features_read:,} "
                    f"written={polygons_written:,} rate={rate:,.0f}/s "
                    f"elapsed={elapsed:.0f}s",
                    flush=True,
                )

    elapsed = time.time() - t0
    print()
    print(f"  source_features_read          = {source_features_read:,}")
    print(f"  polygons_written              = {polygons_written:,}")
    print(f"    (of which coerced from MP)  = {polygons_written_coerced_from_mp:,}")
    print(f"  non_polygon_type_skipped      = {non_polygon_type_skipped:,}")
    print(f"  multi_ring_skipped            = {multi_ring_skipped:,}")
    print(f"  malformed_skipped             = {malformed_skipped:,}")
    print(f"  elapsed                       = {elapsed:.1f}s")
    print(f"  output                        = {dst} ({dst.stat().st_size/1e9:.2f} GB)")
    print()
    if skip_log:
        print("  sample skipped (first 20, for eyeballing):", file=sys.stderr)
        for s in skip_log:
            print(f"    {s}", file=sys.stderr)
        print(file=sys.stderr)

    # === Gate 1: prep-stage reconciliation (5 counters) ===
    gate_lhs = source_features_read
    gate_rhs = (
        polygons_written
        + non_polygon_type_skipped
        + multi_ring_skipped
        + malformed_skipped
    )
    if gate_lhs != gate_rhs:
        print(
            f"FAILURE: prep reconciliation mismatch. "
            f"read={gate_lhs:,} != written+skipped={gate_rhs:,} "
            f"(gap={gate_lhs-gate_rhs:+,})",
            file=sys.stderr,
        )
        sys.exit(1)
    print(
        f"SUCCESS: prep gate passed. "
        f"{gate_lhs:,} read = {polygons_written:,} written "
        f"+ {non_polygon_type_skipped:,} non-polygon "
        f"+ {multi_ring_skipped:,} multi-ring "
        f"+ {malformed_skipped:,} malformed"
    )


if __name__ == "__main__":
    main()
