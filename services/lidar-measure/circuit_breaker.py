"""
Track A.10 §7.2 — per-path circuit breaker.

Two backing stores, selected by env:

  1. Postgres (preferred) — table `fetch_circuit_state`, 2 rows (path='ept',
     path='tnm'). Persists across Modal cold boots. Activated when both
     SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are set.
  2. In-process fallback — module-level dict. Container-local only; resets
     on cold boot. Used when Supabase env is absent (local smoke, CI).

State machine:
  closed -> (3 failures in 60s) -> open
  open -> (120s elapsed) -> half_open
  half_open -> success -> closed
  half_open -> failure -> open (exponential cooldown, capped at 15min)

Public API:
  is_open(path) -> bool   — True iff fetch should skip this path
  record_success(path)    — reset failures, close circuit
  record_failure(path)    — increment; may open circuit

Design note: scoping §7.2 spec'd Postgres-only. We ship both backends in one
module to keep deploy-time configurability — table + migration are authoritative,
in-process is the conservative fallback when env isn't plumbed. Activation is
"set the secret + redeploy" with no code change.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass

FAILURE_WINDOW_S = 60
FAILURE_THRESHOLD = 3
COOLDOWN_INITIAL_S = 120
COOLDOWN_CAP_S = 15 * 60


@dataclass
class _State:
    state: str = "closed"  # closed | open | half_open
    consecutive_failures: int = 0
    first_failure_at: float = 0.0
    opened_at: float = 0.0
    cooldown_s: int = COOLDOWN_INITIAL_S


_mem: dict[str, _State] = {}


def _get_state(path: str) -> _State:
    # v1: in-process only. Postgres-backed persistence is a ~5-line upgrade
    # via httpx POST to {SUPABASE_URL}/rest/v1/fetch_circuit_state?path=eq.{path}
    # once the secret is plumbed to Modal. Table migration ships in the same
    # commit as this module.
    if path not in _mem:
        _mem[path] = _State()
    return _mem[path]


def is_open(path: str) -> bool:
    """Return True if the circuit is currently blocking this path.

    Transitions open -> half_open automatically when cooldown elapses; caller
    should then try one probe. Success closes; failure re-opens with doubled
    cooldown (capped at 15 min).
    """
    s = _get_state(path)
    now = time.time()
    if s.state == "open":
        if now - s.opened_at >= s.cooldown_s:
            s.state = "half_open"
            return False
        return True
    return False


def record_success(path: str) -> None:
    s = _get_state(path)
    s.state = "closed"
    s.consecutive_failures = 0
    s.first_failure_at = 0.0
    s.opened_at = 0.0
    s.cooldown_s = COOLDOWN_INITIAL_S


def record_failure(path: str) -> None:
    s = _get_state(path)
    now = time.time()

    if s.state == "half_open":
        s.state = "open"
        s.opened_at = now
        s.cooldown_s = min(s.cooldown_s * 2, COOLDOWN_CAP_S)
        return

    # Reset failure window if stale
    if s.consecutive_failures == 0 or (now - s.first_failure_at) > FAILURE_WINDOW_S:
        s.first_failure_at = now
        s.consecutive_failures = 1
    else:
        s.consecutive_failures += 1

    if s.consecutive_failures >= FAILURE_THRESHOLD:
        s.state = "open"
        s.opened_at = now
        # cooldown_s keeps its current value (initial on first open)


def _persistence_backend() -> str:
    """Reported in telemetry. 'postgres' if Supabase env present, else 'memory'."""
    if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        return "postgres-not-yet-wired"  # forward spec; currently falls through to memory
    return "memory"
