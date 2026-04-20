#!/usr/bin/env python3
"""
Verify full Overpass circuit-breaker cycle:

  CLOSED → fail → CLOSED(failures=1)
         → fail → CLOSED(failures=2, opened_at=now)       [threshold reached]
  OPEN   → retry attempt → SHORT-CIRCUITED (no network)   [cooldown gate]
         → wait past 300s cooldown
  HALF_OPEN → probe allowed
            → success → CLOSED(failures=0)

The cooldown gate is the critical behavior — asserts that a retry attempt during
the 5-min window does NOT call the network (no `urlopen` increment).

Uses monkey-patched urlopen to simulate failures; no real Overpass traffic.
`_set_opened_at_past()` fast-forwards the DB timestamp rather than sleeping 5 min.

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
    calls_made = [0]

    def fake_urlopen(*_a, **_kw):
        calls_made[0] += 1
        raise _FakeURLError()

    try:
        ur.urlopen = fake_urlopen

        # --- Step 1: CLOSED, fail #1 — network IS called, state stays closed
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "closed", f"step1: state={state}"
        assert calls_made[0] == before + 1, "step1: expected 1 network call"
        print(f"  ✅ step1  CLOSED + fail → state=closed, network_called=yes (calls={calls_made[0]})")

        # --- Step 2: CLOSED, fail #2 — network IS called; threshold met, opened_at stamped for next call
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "closed", f"step2: state={state}"
        assert calls_made[0] == before + 1, "step2: expected 1 network call"
        print(f"  ✅ step2  CLOSED + fail → threshold reached (calls={calls_made[0]}, circuit now opened)")

        # --- Step 3: OPEN + retry attempt inside cooldown window — MUST short-circuit (no network call)
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert state == "open", f"step3: expected state=open, got {state}"
        assert calls_made[0] == before, (
            f"step3 COOLDOWN VIOLATION: network was called while breaker open "
            f"({calls_made[0]} vs {before}). Cooldown gate is broken."
        )
        print(f"  ✅ step3  OPEN + retry inside cooldown → SHORT-CIRCUITED, network_called=no (calls unchanged={calls_made[0]})")

        # --- Step 4: Fast-forward past 300s cooldown — retry becomes HALF_OPEN probe
        _set_opened_at_past(fl.CIRCUIT_COOLDOWN_SEC + 10)
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert state == "half_open", f"step4: expected half_open, got {state}"
        assert calls_made[0] == before + 1, "step4: half_open probe should call network"
        print(f"  ✅ step4  cooldown elapsed → HALF_OPEN probe allowed, network_called=yes (calls={calls_made[0]})")

        # --- Step 5: record_success() on a probe that succeeded — counter resets, state returns to CLOSED
        br = fl._CircuitBreaker()
        br.record_success()
        allowed, state2 = br.allow()
        assert allowed and state2 == "closed", f"step5: allowed={allowed} state={state2}"
        print(f"  ✅ step5  probe success → CLOSED, failure counter reset")

        print()
        print(f"  full cycle verified: CLOSED → OPEN → cooldown-blocked retry → HALF_OPEN → CLOSED")
        print(f"  5 assertions passed")
        sys.exit(0)
    finally:
        ur.urlopen = orig
        _reset_breaker()


if __name__ == "__main__":
    main()
