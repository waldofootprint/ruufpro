#!/usr/bin/env python3
"""
Verify Overpass circuit-breaker opens after CIRCUIT_FAIL_THRESHOLD (=2) failures,
stays open until cooldown (300s), and record_success() resets state.

Uses monkey-patched urlopen to simulate failures — no real Overpass traffic.

Stop condition: all assertions pass.

Requires DATABASE_URL (breaker state persists in footprint_source_health table).

Usage:
  export DATABASE_URL="..."
  python3 scripts/phase_b/test_overpass_breaker.py
"""
import os, sys
from pathlib import Path
from urllib.error import URLError

sys.path.insert(0, str(Path(__file__).parent))
import footprint_lookup as fl


def _reset_breaker():
    conn = fl._pg_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "update footprint_source_health set consecutive_failures=0, "
                "circuit_opened_at=null, last_failure_at=null, last_success_at=null "
                "where source='overpass'"
            )
            conn.commit()
    finally:
        conn.close()


def _set_opened_at_past(seconds_ago: int):
    conn = fl._pg_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "update footprint_source_health set circuit_opened_at = now() - (%s || ' seconds')::interval "
                "where source='overpass'",
                (str(seconds_ago),),
            )
            conn.commit()
    finally:
        conn.close()


class _FakeURLError(URLError):
    def __init__(self): super().__init__("simulated network fail")


def main():
    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL not set — skipping (db-dependent test)"); sys.exit(0)

    import urllib.request as ur
    orig = ur.urlopen
    _reset_breaker()
    failures = []
    calls_made = [0]

    def fake_urlopen(*a, **kw):
        calls_made[0] += 1
        raise _FakeURLError()

    try:
        ur.urlopen = fake_urlopen

        # 1st failure — breaker stays closed, request hits network
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "closed", f"1st call: {state}"
        print(f"  ✅ 1st failure → closed, calls={calls_made[0]}")

        # 2nd failure — breaker transitions to open at end of this call
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "closed", f"2nd call: {state}"
        print(f"  ✅ 2nd failure → closed→open recorded, calls={calls_made[0]}")

        # 3rd call — breaker OPEN, short-circuits, no network call
        calls_before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "open", f"3rd call: {state}"
        assert calls_made[0] == calls_before, f"network was called while open: {calls_made[0]} vs {calls_before}"
        print(f"  ✅ 3rd call → open, short-circuited (no network call)")

        # Advance time past cooldown — half-open probe allowed
        _set_opened_at_past(fl.CIRCUIT_COOLDOWN_SEC + 10)
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert state == "half_open", f"post-cooldown: {state}"
        print(f"  ✅ post-cooldown → half_open probe allowed")

        # Simulate success — breaker closes, counter resets
        br = fl._CircuitBreaker()
        br.record_success()
        allowed, state2 = br.allow()
        assert allowed and state2 == "closed", f"post-success: allowed={allowed} state={state2}"
        print(f"  ✅ record_success → closed, counter reset")

        print()
        print(f"  all 5 assertions passed")
        sys.exit(0)
    finally:
        ur.urlopen = orig
        _reset_breaker()


if __name__ == "__main__":
    main()
