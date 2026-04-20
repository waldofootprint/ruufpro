#!/usr/bin/env python3
"""
Benchmark MS Footprints lookup latency across 22 geo-stratified FL addresses.

Stop condition (Phase B scoping Section 5): p95 ≤ 100 ms.

Output: prints per-address latency + count of hits/misses, p50/p95/p99.
Writes a timestamped JSON report to .tmp/phase_b/bench-<ts>.json.

Usage:
  export DATABASE_URL="..."
  python3 scripts/phase_b/bench_ms_lookup.py
"""
import json, os, statistics, subprocess, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from footprint_lookup import ms_lookup

HERE = Path(__file__).parent
ADDRESSES = json.loads((HERE / "bench_addresses.json").read_text())["addresses"]


def bench():
    results = []
    for a in ADDRESSES:
        # Two passes per address: warmup + measured.
        for pass_i in range(2):
            t0 = time.perf_counter()
            try:
                geom = ms_lookup(a["lat"], a["lng"])
                err = None
            except Exception as e:
                geom = None; err = str(e)
            dt_ms = (time.perf_counter() - t0) * 1000
            if pass_i == 1:  # only record measured pass
                results.append({
                    "label": a["label"],
                    "city": a["city"],
                    "lat": a["lat"], "lng": a["lng"],
                    "hit": geom is not None,
                    "latency_ms": dt_ms,
                    "error": err,
                })
                hit_str = "HIT " if geom else "miss"
                print(f"  {a['label']:6} {a['city']:14} {hit_str}  {dt_ms:6.1f} ms" + (f"  ERR={err}" if err else ""))
    latencies = [r["latency_ms"] for r in results]
    hits = sum(1 for r in results if r["hit"])
    summary = {
        "n": len(results),
        "hits": hits,
        "misses": len(results) - hits,
        "hit_rate": hits / len(results) if results else 0,
        "p50": statistics.median(latencies) if latencies else 0,
        "p95": sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0,
        "p99": sorted(latencies)[int(0.99 * len(latencies))] if latencies else 0,
        "max": max(latencies) if latencies else 0,
    }
    print()
    print(f"  n={summary['n']}  hit_rate={summary['hit_rate']:.1%}  p50={summary['p50']:.1f}ms  p95={summary['p95']:.1f}ms  p99={summary['p99']:.1f}ms  max={summary['max']:.1f}ms")
    print(f"  STOP CONDITION (p95 ≤ 100ms): {'✅ PASS' if summary['p95'] <= 100 else '❌ FAIL'}")

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
    print(f"  report: {out_path}")
    return summary


if __name__ == "__main__":
    s = bench()
    sys.exit(0 if s["p95"] <= 100 else 1)
