#!/usr/bin/env python3
"""
Pure-logic verification of the Overpass circuit-breaker state machine.

The DB-persistence layer (psycopg2 → footprint_source_health) is MOCKED with
an in-memory dict, so this runs without DATABASE_URL. What's under test:
the CLOSED → OPEN → cooldown-gate → HALF_OPEN → CLOSED cycle and the assertion
that a retry inside the 5-min cooldown window short-circuits (no network call).

An end-to-end integration variant (real DB) can run later once DATABASE_URL
is exposed — see test_overpass_breaker.py. The logic here is the same; this
test just swaps the persistence substrate.

Usage:
  python3 scripts/phase_b/test_overpass_breaker_mock.py
"""
from __future__ import annotations
import sys, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import URLError

sys.path.insert(0, str(Path(__file__).parent))
import footprint_lookup as fl


# ------------------------------------------------------------------------
# In-memory stand-in for footprint_source_health
# ------------------------------------------------------------------------

class MockState:
    def __init__(self):
        self.consecutive_failures = 0
        self.circuit_opened_at = None  # tz-aware datetime or None
        self.last_failure_at = None
        self.last_success_at = None


MOCK = MockState()


def mock_read_state(self):
    return MOCK.consecutive_failures, MOCK.circuit_opened_at


def mock_record_failure(self):
    MOCK.consecutive_failures += 1
    MOCK.last_failure_at = datetime.now(timezone.utc)
    if MOCK.consecutive_failures >= fl.CIRCUIT_FAIL_THRESHOLD and MOCK.circuit_opened_at is None:
        MOCK.circuit_opened_at = datetime.now(timezone.utc)


def mock_record_success(self):
    MOCK.consecutive_failures = 0
    MOCK.circuit_opened_at = None
    MOCK.last_success_at = datetime.now(timezone.utc)


def fast_forward_past_cooldown(extra_seconds: int = 10):
    assert MOCK.circuit_opened_at is not None
    MOCK.circuit_opened_at = (
        datetime.now(timezone.utc)
        - timedelta(seconds=fl.CIRCUIT_COOLDOWN_SEC + extra_seconds)
    )


# ------------------------------------------------------------------------
# Fake network
# ------------------------------------------------------------------------

class _FakeURLError(URLError):
    def __init__(self): super().__init__("simulated network fail")


def main():
    # Monkey-patch persistence to in-memory MOCK
    fl._CircuitBreaker._read_state = mock_read_state
    fl._CircuitBreaker.record_failure = mock_record_failure
    fl._CircuitBreaker.record_success = mock_record_success

    # Monkey-patch urlopen on the footprint_lookup module (it imported the name directly,
    # so patching urllib.request.urlopen would miss that reference).
    orig_urlopen = fl.urlopen
    calls_made = [0]

    def fake_urlopen(*_a, **_kw):
        calls_made[0] += 1
        raise _FakeURLError()

    try:
        fl.urlopen = fake_urlopen

        # --- Step 1: CLOSED, fail #1 — network IS called, state stays closed
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "closed", f"step1: state={state}"
        assert calls_made[0] == before + 1, "step1: expected 1 network call"
        assert MOCK.consecutive_failures == 1, f"step1: failures={MOCK.consecutive_failures}"
        print(f"  ✅ step1  CLOSED + fail → state=closed, failures=1, network_called=yes")

        # --- Step 2: CLOSED, fail #2 — network called, threshold met, opened_at stamped
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert geom is None and state == "closed", f"step2: state={state}"
        assert calls_made[0] == before + 1, "step2: expected 1 network call"
        assert MOCK.consecutive_failures == 2, f"step2: failures={MOCK.consecutive_failures}"
        assert MOCK.circuit_opened_at is not None, "step2: expected circuit to be opened"
        print(f"  ✅ step2  CLOSED + fail → threshold reached, circuit_opened_at stamped")

        # --- Step 3: OPEN + retry inside cooldown — MUST short-circuit (no network call)
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert state == "open", f"step3: expected state=open, got {state}"
        assert calls_made[0] == before, (
            f"step3 COOLDOWN VIOLATION: network was called while breaker open "
            f"({calls_made[0]} vs {before}). Cooldown gate is broken."
        )
        print(f"  ✅ step3  OPEN + retry inside cooldown → SHORT-CIRCUITED (no network call)")

        # --- Step 4: Fast-forward past 300s cooldown → retry becomes HALF_OPEN probe
        fast_forward_past_cooldown()
        before = calls_made[0]
        geom, state = fl.overpass_lookup(30.33, -81.65)
        assert state == "half_open", f"step4: expected half_open, got {state}"
        assert calls_made[0] == before + 1, "step4: half_open probe should call network"
        print(f"  ✅ step4  cooldown elapsed → HALF_OPEN probe allowed, network_called=yes")

        # --- Step 5: record_success() → counter resets, CLOSED
        br = fl._CircuitBreaker()
        br.record_success()
        allowed, state2 = br.allow()
        assert allowed and state2 == "closed", f"step5: allowed={allowed} state={state2}"
        assert MOCK.consecutive_failures == 0, "step5: counter should reset"
        assert MOCK.circuit_opened_at is None, "step5: opened_at should clear"
        print(f"  ✅ step5  probe success → CLOSED, failure counter reset")

        print()
        print(f"  full cycle verified: CLOSED → OPEN → cooldown-blocked retry → HALF_OPEN → CLOSED")
        print(f"  5 assertions passed")
        sys.exit(0)
    finally:
        fl.urlopen = orig_urlopen


if __name__ == "__main__":
    main()
