"""
Track A.10 §7.1 — fetch dispatcher.

Implements the decision tree:

  1. (L2 cache not implemented yet — forward spec per scoping §6.1)
  2. EPT primary (if circuit CLOSED)
  3. TNM secondary (if circuit CLOSED)
  4. Exhausted -> outcome passed to harness for Solar tertiary routing

Public API:
    dispatch(lat, lng, output_laz, *, debug_skip_ept, debug_skip_tnm)
      -> DispatchResult

Pipeline A source is NOT edited. This module produces a LAZ file on disk; the
caller (app.py) hands that file to Pipeline A's subprocess unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

# Flat imports — Modal mounts services/lidar-measure/ at /root (on sys.path),
# and local development runs from the same dir. No package __init__.
import circuit_breaker as cb  # noqa: E402
import ept_fetch  # noqa: E402


@dataclass
class DispatchResult:
    outcome: str
    # fetch_path in {ept, tnm, ept->tnm, ept_circuit_open->tnm, failed, debug_skip}
    fetch_path: str
    collection_id: str | None = None
    laz_path: Path | None = None
    debug: dict | None = None


def dispatch(
    lat: float,
    lng: float,
    output_laz: Path,
    *,
    debug_skip_ept: bool = False,
    debug_skip_tnm: bool = False,
    tnm_fetcher=None,
) -> DispatchResult:
    """Run the §7.1 decision tree.

    `tnm_fetcher(lat, lng, output_laz) -> (outcome, url|None)` is injected to
    keep app.py's existing TNM logic authoritative (no duplication). Caller
    passes a closure that wraps app.py::_fetch_tnm_laz_url + _download_laz.

    `debug_skip_ept` / `debug_skip_tnm` satisfy §9 Gate 1 + Gate 2: the smoke
    client sets one of these to deliberately render that path unreachable at
    the dispatch layer. Env-var at image level was the original scoping;
    request-body toggle is functionally equivalent + reproducible + auditable
    in Modal logs (documented deviation — see close report §3).
    """
    # ---- Step 2: EPT primary ----
    ept_attempted = False
    ept_fp = "ept"
    if debug_skip_ept:
        ept_fp = "debug_skip_ept"
    elif cb.is_open("ept"):
        ept_fp = "ept_circuit_open"
    else:
        ept_attempted = True
        res = ept_fetch.fetch_parcel_slice(lat, lng, output_laz)
        if res.outcome == "ok":
            cb.record_success("ept")
            return DispatchResult(
                outcome="ok",
                fetch_path="ept",
                collection_id=res.collection_id,
                laz_path=output_laz,
                debug={"ept_point_count": res.point_count},
            )
        if res.outcome == "ept_error":
            cb.record_failure("ept")
        # 'no_catalog_match' and 'ept_empty_coverage_gap' are non-errors for
        # the circuit breaker — genuine coverage gaps, not infrastructure fail.
        # Fall through to TNM.
        ept_fp = f"ept_{res.outcome}"

    # ---- Step 3: TNM secondary ----
    if debug_skip_tnm:
        return DispatchResult(
            outcome="no_footprint_lidar" if not ept_attempted else "laz_download_failed",
            fetch_path=f"{ept_fp}->debug_skip_tnm",
            debug={"ept_attempted": ept_attempted},
        )

    if cb.is_open("tnm"):
        return DispatchResult(
            outcome="tnm_5xx_or_timeout",
            fetch_path=f"{ept_fp}->tnm_circuit_open",
        )

    if tnm_fetcher is None:
        raise RuntimeError("fetch_dispatch: tnm_fetcher must be provided by app.py")

    tnm_outcome = tnm_fetcher(lat, lng, output_laz)
    # tnm_fetcher is expected to return a string outcome matching the harness
    # contract: 'ok' | 'tnm_5xx_or_timeout' | 'laz_download_failed'
    # | 'no_footprint_lidar'
    if tnm_outcome == "ok":
        cb.record_success("tnm")
        return DispatchResult(
            outcome="ok",
            fetch_path=f"{ept_fp}->tnm",
            laz_path=output_laz,
        )

    if tnm_outcome in ("tnm_5xx_or_timeout", "laz_download_failed"):
        cb.record_failure("tnm")

    return DispatchResult(
        outcome=tnm_outcome,
        fetch_path=f"{ept_fp}->tnm_{tnm_outcome}",
    )
