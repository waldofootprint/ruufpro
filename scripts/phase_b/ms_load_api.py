#!/usr/bin/env python3
"""
Load MS Footprints into building_footprints via Supabase management API
(HTTP query endpoint). Used when DATABASE_URL is not available.

Each batch = one multi-row INSERT with inline ST_GeomFromGeoJSON() calls.
Batch size tuned to stay under payload limits (~5MB) and query timeout.

Requires SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in env.

Usage:
  export SUPABASE_ACCESS_TOKEN="sbp_..."
  export SUPABASE_PROJECT_REF="comcpamnxjtldlnnudqc"
  python3 scripts/phase_b/ms_load_api.py --geojson .cache/ms_footprints/Florida.geojson --batch 500
"""
import argparse, json, os, sys, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def stream_features(path: Path):
    """MS ships newline-delimited features inside a FeatureCollection array."""
    with open(path) as f:
        first = f.read(256).lstrip()
        f.seek(0)
        started = False
        for line in f:
            line = line.strip().rstrip(',')
            if not line: continue
            if not started:
                if line.startswith('{"type":"Feature"'):
                    started = True
                else:
                    continue
            if not line.startswith('{"type":"Feature"'):
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def post_query(sql: str, token: str, ref: str, timeout: int = 120) -> dict:
    url = f"https://api.supabase.com/v1/projects/{ref}/database/query"
    req = Request(url, method="POST", data=json.dumps({"query": sql}).encode())
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    # Cloudflare WAF blocks default python-urllib UA with error 1010. Use a browser UA.
    req.add_header("User-Agent", "Mozilla/5.0 (compatible; RuufPro-BJ/1.0)")
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def _capture_year(props: dict) -> str:
    """Parse MS 'capture_dates_range' like '1/25/2019-1/2/2022' → latest year as int, or NULL."""
    rng = (props or {}).get("capture_dates_range") or ""
    years = []
    for tok in rng.replace("-", " ").replace("/", " ").split():
        if tok.isdigit() and 1900 < int(tok) < 2100:
            years.append(int(tok))
    return str(max(years)) if years else "NULL"


def build_insert(batch: list[dict], state: str, vintage: int) -> str:
    """Build one multi-row INSERT. Each row uses ST_GeomFromGeoJSON with a single-quoted JSON literal
    (single quotes doubled for escaping). Dollar-quoting triggered a 403 at the Supabase API edge."""
    values = []
    for feat in batch:
        geom = feat.get("geometry")
        if not geom or geom.get("type") != "Polygon": continue
        geom_json = json.dumps(geom, separators=(',', ':')).replace("'", "''")
        cy = _capture_year(feat.get("properties") or {})
        values.append(
            f"(ST_GeomFromGeoJSON('{geom_json}'), "
            f"'{state}', 'microsoft_us_building_footprints', {vintage}, {cy})"
        )
    if not values:
        return ""
    return (
        "insert into building_footprints (geom, state_code, source, vintage_year, capture_year) values "
        + ",\n".join(values)
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--geojson", required=True)
    ap.add_argument("--batch", type=int, default=500)
    ap.add_argument("--state", default="FL")
    ap.add_argument("--vintage", type=int, default=2018)
    ap.add_argument("--truncate-first", action="store_true")
    ap.add_argument("--skip", type=int, default=0, help="skip first N features (resume)")
    args = ap.parse_args()

    token = os.environ["SUPABASE_ACCESS_TOKEN"]
    ref = os.environ["SUPABASE_PROJECT_REF"]

    if args.truncate_first:
        print("[trunc] truncating building_footprints...")
        post_query("truncate building_footprints;", token, ref)

    # Count current rows as baseline (for idempotent resume)
    baseline = post_query("select count(*) as n from building_footprints;", token, ref)
    baseline_n = baseline[0]["n"] if baseline else 0
    print(f"[baseline] building_footprints currently has {baseline_n:,} rows")

    path = Path(args.geojson)
    total_read, total_inserted, total_skipped, total_errors = 0, 0, 0, 0
    batch = []
    t0 = time.time()

    for feat in stream_features(path):
        total_read += 1
        if total_read <= args.skip:
            continue
        geom = feat.get("geometry")
        if not geom or geom.get("type") != "Polygon":
            total_skipped += 1; continue
        batch.append(feat)
        if len(batch) >= args.batch:
            inserted, err = _flush(batch, token, ref, args.state, args.vintage)
            total_inserted += inserted
            if err: total_errors += 1
            batch = []
            if total_inserted % (args.batch * 20) == 0:
                elapsed = time.time() - t0
                rate = total_inserted / elapsed if elapsed else 0
                print(f"  inserted={total_inserted:>9,}  read={total_read:>9,}  "
                      f"rate={rate:,.0f} rows/s  elapsed={elapsed:.0f}s")

    if batch:
        inserted, err = _flush(batch, token, ref, args.state, args.vintage)
        total_inserted += inserted
        if err: total_errors += 1

    elapsed = time.time() - t0
    final = post_query("select count(*) as n from building_footprints;", token, ref)
    final_n = final[0]["n"] if final else 0
    print()
    print(f"[done] read={total_read:,} inserted={total_inserted:,} skipped_nonpolygon={total_skipped:,} "
          f"batch_errors={total_errors:,} elapsed={elapsed:.0f}s")
    print(f"[final] building_footprints now has {final_n:,} rows (delta={final_n - baseline_n:+,})")


def _flush(batch, token, ref, state, vintage):
    sql = build_insert(batch, state, vintage)
    if not sql: return 0, False
    try:
        post_query(sql, token, ref, timeout=180)
        return len(batch), False
    except (HTTPError, URLError, TimeoutError, OSError) as e:
        body = ""
        if isinstance(e, HTTPError):
            try: body = e.read().decode()[:300]
            except Exception: pass
        print(f"  [err] batch failed ({len(batch)} rows): {e} {body}", file=sys.stderr)
        return 0, True


if __name__ == "__main__":
    main()
