#!/usr/bin/env python3
"""
Stream MS Footprints GeoJSON into PostGIS building_footprints table.

MS GeoJSON format: one FeatureCollection, ~6.2M features for FL. Streams line-by-line
so memory stays bounded. Inserts in batches via executemany.

Requires DATABASE_URL (direct Postgres connection to Supabase project).

Usage:
  export DATABASE_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres"
  python3 scripts/phase_b/ms_load.py --geojson .cache/ms_footprints/Florida.geojson --batch 5000
"""
import argparse, json, os, sys, time
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("pip install psycopg2-binary", file=sys.stderr); sys.exit(1)


def stream_features(path: Path):
    """MS FL GeoJSON is a FeatureCollection w/ 'features' array. Stream ijson if available,
    fall back to line-iteration on the format MS actually ships (newline-delimited per feature)."""
    with open(path) as f:
        first = f.read(256).lstrip()
        f.seek(0)
        if first.startswith('{"type":"FeatureCollection"'):
            # MS ships one-feature-per-line inside the array. Hacky but avoids loading 1.5GB.
            started = False
            for line in f:
                line = line.strip().rstrip(',')
                if not started:
                    if line.startswith('{"type":"Feature"'):
                        started = True
                    else:
                        continue
                if not line.startswith('{"type":"Feature"'):
                    if line in ('', ']', ']}'): continue
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue
        else:
            # Line-delimited GeoJSON (ndjson)
            for line in f:
                line = line.strip()
                if not line: continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue


def load(geojson_path: Path, batch_size: int, state: str, vintage: int):
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    cur = conn.cursor()

    sql = (
        "insert into building_footprints (geom, state_code, source, vintage_year) "
        "values %s"
    )

    batch, total, skipped = [], 0, 0
    t0 = time.time()
    for feat in stream_features(geojson_path):
        geom = feat.get("geometry")
        if not geom or geom.get("type") != "Polygon":
            skipped += 1; continue
        # Store as GeoJSON string — psycopg2 lets us use ST_GeomFromGeoJSON in the values clause.
        batch.append((json.dumps(geom), state, "microsoft_us_building_footprints", vintage))
        if len(batch) >= batch_size:
            _flush(cur, sql, batch)
            conn.commit()
            total += len(batch); batch = []
            if total % (batch_size * 10) == 0:
                rate = total / (time.time() - t0)
                print(f"  loaded {total:>9,}  @ {rate:,.0f} rows/s")

    if batch:
        _flush(cur, sql, batch)
        conn.commit()
        total += len(batch)

    cur.close(); conn.close()
    print(f"[done] inserted {total:,} polygons, skipped {skipped:,} non-polygon features")


def _flush(cur, sql, batch):
    # ST_GeomFromGeoJSON applied in template so DB does the parse.
    execute_values(
        cur, sql, batch,
        template="(ST_GeomFromGeoJSON(%s), %s, %s, %s)",
        page_size=len(batch),
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--geojson", required=True)
    ap.add_argument("--batch", type=int, default=5000)
    ap.add_argument("--state", default="FL")
    ap.add_argument("--vintage", type=int, default=2018)
    args = ap.parse_args()
    load(Path(args.geojson), args.batch, args.state, args.vintage)
