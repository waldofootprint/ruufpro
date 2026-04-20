#!/usr/bin/env python3
"""
Benchmark MS Footprints lookup latency across 22 geo-stratified FL addresses.

Stop condition (Phase B scoping Section 5): p95 ≤ 100 ms.

=== Timing boundary (documented) ===
  START TIMER:  immediately before `ms_lookup(lat, lng, conn=reused_conn)` Python call
  END TIMER:    immediately after that call returns the parsed GeoJSON dict (or None)

  Measured in-band: psycopg2 `cur.execute()` (PostGIS GIST `<->` + `ST_DWithin`), `cur.fetchone()`,
  JSONB → Python dict decode.
  NOT measured: TCP + TLS handshake (one-time outside the loop; prod uses pgbouncer/pool
                so this matches steady-state cost).

  Two passes per address. Pass 1 = warmup (primes plan cache). Pass 2 = recorded.
  Connection is OPENED ONCE before the loop and REUSED across all addresses.

Output: .tmp/phase_b/bench-ms-<ts>.json with commit hash in header.

Usage:
  export DATABASE_URL="..."
  python3 scripts/phase_b/bench_ms_lookup.py
"""
import json, os, statistics, subprocess, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from footprint_lookup import ms_lookup, _pg_conn

HERE = Path(__file__).parent
ADDRESSES = json.loads((HERE / "bench_addresses.json").read_text())["addresses"]


def bench():
    # Open connection ONCE — TCP+TLS handshake happens here, outside the timing loop.
    # In prod, pgbouncer/pool amortizes the handshake across many requests, so this
    # measurement matches steady-state prod latency (not cold-start).
    print("  opening reused psycopg2 connection (handshake excluded from timing)...")
    conn_t0 = time.perf_counter()
    conn = _pg_conn()
    conn_ms = (time.perf_counter() - conn_t0) * 1000
    print(f"  handshake: {conn_ms:.1f} ms  (measured for context, NOT in p95)")
    print()

    results = []
    try:
        for a in ADDRESSES:
            # Two passes: warmup (pass 0) + measured (pass 1).
            for pass_i in range(2):
                # === TIMING BOUNDARY START ===
                t0 = time.perf_counter()
                try:
                    geom = ms_lookup(a["lat"], a["lng"], conn=conn)
                    err = None
                except Exception as e:
                    geom = None
                    err = str(e)
                dt_ms = (time.perf_counter() - t0) * 1000
                # === TIMING BOUNDARY END ===

                if pass_i == 1:  # record only measured pass
                    results.append({
                        "label": a["label"],
                        "city": a["city"],
                        "lat": a["lat"], "lng": a["lng"],
                        "hit": geom is not None,
                        "latency_ms": dt_ms,
                        "error": err,
                    })
                    hit_str = "HIT " if geom else "miss"
                    suffix = f"  ERR={err}" if err else ""
                    print(f"  {a['label']:6} {a['city']:14} {hit_str}  {dt_ms:6.1f} ms{suffix}")
    finally:
        conn.close()

    latencies = [r["latency_ms"] for r in results]
    hits = sum(1 for r in results if r["hit"])
    summary = {
        "n": len(results),
        "hits": hits,
        "misses": len(results) - hits,
        "hit_rate": hits / len(results) if results else 0,
        "handshake_ms_excluded": conn_ms,
        "p50": statistics.median(latencies) if latencies else 0,
        "p95": sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0,
        "p99": sorted(latencies)[int(0.99 * len(latencies))] if latencies else 0,
        "max": max(latencies) if latencies else 0,
        "timing_boundary": "from ms_lookup() call to parsed GeoJSON return; connection reused; handshake excluded",
    }
    print()
    print(f"  n={summary['n']}  hit_rate={summary['hit_rate']:.1%}  "
          f"p50={summary['p50']:.1f}ms  p95={summary['p95']:.1f}ms  "
          f"p99={summary['p99']:.1f}ms  max={summary['max']:.1f}ms")
    print(f"  STOP CONDITION (p95 ≤ 100ms, pooled-conn boundary): "
          f"{'✅ PASS' if summary['p95'] <= 100 else '❌ FAIL'}")

    try:
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    except Exception:
        commit = "unknown"

    report = {
        "commit": commit,
        "timestamp": int(time.time()),
        "summary": summary,
        "results": results,
    }
    out_dir = Path(".tmp/phase_b"); out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"bench-ms-{int(time.time())}.json"
    out_path.write_text(json.dumps(report, indent=2))
    print(f"  report: {out_path}  (commit {commit[:7]})")
    return summary


if __name__ == "__main__":
    s = bench()
    sys.exit(0 if s["p95"] <= 100 else 1)
