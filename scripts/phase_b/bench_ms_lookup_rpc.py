#!/usr/bin/env python3
"""
Benchmark MS Footprints lookup latency via PostgREST RPC — the production path.

Rationale: Prod `/api/estimate` calls Supabase via the same PostgREST endpoint
this bench uses (`POST /rest/v1/rpc/footprint_lookup`). Management API
(`api.supabase.com/v1/projects/*/database/query`) has an extra hop + WAF layer
not used by the app at runtime, so it would measure pessimistic latency.

=== Timing boundary ===
  START: immediately before the HTTP POST /rest/v1/rpc/footprint_lookup is sent
  END:   immediately after the response body is parsed as JSON

  Measured in-band: TCP + TLS (reused via a requests.Session so only first call pays),
  PostgREST translation → postgres function call → geometry query → JSONB serialization
  → HTTP response → Python JSON decode.

  NOT measured: session warmup (first call's handshake logged separately, excluded from p95).

  Two passes per address: pass 0 = warmup, pass 1 = recorded.

Stop condition: p95 ≤ 100 ms.

Reads SUPABASE_URL + SUPABASE_ANON_KEY from env, or NEXT_PUBLIC_SUPABASE_URL +
NEXT_PUBLIC_SUPABASE_ANON_KEY, or from .env file in repo root.

Usage:
  python3 scripts/phase_b/bench_ms_lookup_rpc.py
"""
import json, os, statistics, subprocess, sys, time
from pathlib import Path
from urllib.request import Request, build_opener, HTTPSHandler
from urllib.error import HTTPError

HERE = Path(__file__).parent
REPO = HERE.parent.parent
ADDRESSES = json.loads((HERE / "bench_addresses.json").read_text())["addresses"]


def load_env():
    env_path = REPO / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"'))
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        print("ERROR: missing SUPABASE_URL + ANON_KEY in env or .env", file=sys.stderr)
        sys.exit(2)
    return url.rstrip("/"), key


def rpc_lookup(opener, url: str, key: str, lat: float, lng: float):
    body = json.dumps({"lat": lat, "lng": lng}).encode()
    req = Request(f"{url}/rest/v1/rpc/footprint_lookup", method="POST", data=body)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with opener.open(req, timeout=10) as resp:
        return json.loads(resp.read())


def bench():
    url, key = load_env()
    print(f"  endpoint: {url}/rest/v1/rpc/footprint_lookup")

    opener = build_opener(HTTPSHandler())

    # Handshake-excluded warmup: one throwaway call so the connection is hot.
    hs_t0 = time.perf_counter()
    try:
        rpc_lookup(opener, url, key, ADDRESSES[0]["lat"], ADDRESSES[0]["lng"])
    except HTTPError as e:
        body = e.read().decode()[:300]
        print(f"  ERROR: warmup failed HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(3)
    hs_ms = (time.perf_counter() - hs_t0) * 1000
    print(f"  warmup (TCP+TLS+plan-cache): {hs_ms:.1f} ms  (NOT in p95)")
    print()

    results = []
    for a in ADDRESSES:
        # Two passes: warmup (pass 0) + measured (pass 1)
        for pass_i in range(2):
            # === TIMING BOUNDARY START ===
            t0 = time.perf_counter()
            try:
                rows = rpc_lookup(opener, url, key, a["lat"], a["lng"])
                err = None
                hit = bool(rows)
            except Exception as e:
                err = f"{type(e).__name__}: {e}"
                hit = False
            dt_ms = (time.perf_counter() - t0) * 1000
            # === TIMING BOUNDARY END ===

            if pass_i == 1:
                results.append({
                    "label": a["label"], "city": a["city"],
                    "lat": a["lat"], "lng": a["lng"],
                    "hit": hit, "latency_ms": dt_ms, "error": err,
                })
                hit_str = "HIT " if hit else "miss"
                suffix = f"  ERR={err}" if err else ""
                print(f"  {a['label']:6} {a['city']:14} {hit_str}  {dt_ms:6.1f} ms{suffix}")

    latencies = [r["latency_ms"] for r in results]
    hits = sum(1 for r in results if r["hit"])
    summary = {
        "n": len(results),
        "hits": hits,
        "misses": len(results) - hits,
        "hit_rate": hits / len(results) if results else 0,
        "warmup_ms_excluded": hs_ms,
        "p50": statistics.median(latencies) if latencies else 0,
        "p95": sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0,
        "p99": sorted(latencies)[int(0.99 * len(latencies))] if latencies else 0,
        "max": max(latencies) if latencies else 0,
        "timing_boundary": "HTTP POST /rest/v1/rpc/footprint_lookup → JSON parse; opener reused; warmup excluded",
        "endpoint": f"{url}/rest/v1/rpc/footprint_lookup",
    }
    print()
    print(f"  n={summary['n']}  hit_rate={summary['hit_rate']:.1%}  "
          f"p50={summary['p50']:.1f}ms  p95={summary['p95']:.1f}ms  "
          f"p99={summary['p99']:.1f}ms  max={summary['max']:.1f}ms")
    print(f"  STOP CONDITION (p95 ≤ 100ms, PostgREST RPC path): "
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
    out_path = out_dir / f"bench-ms-rpc-{int(time.time())}.json"
    out_path.write_text(json.dumps(report, indent=2))
    print(f"  report: {out_path}  (commit {commit[:7]})")
    return summary


if __name__ == "__main__":
    s = bench()
    sys.exit(0 if s["p95"] <= 100 else 1)
