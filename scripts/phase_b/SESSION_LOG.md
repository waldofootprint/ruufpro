# Phase B — Session Log

Running log of Phase B sessions (BJ → BQ) with commit hash, stop-condition state at close, and carry-forward items. Each entry authored at session close per freeze-code-before-reports.

---

## BJ — 2026-04-20 — Footprint stack shipped, load BLOCKED on Supabase quota

**Commits:** `18a3228` (initial footprint stack) → `ef6610e` (advisor-review fixes) → (this handoff commit)
**Session scope:** scoping Section 1 + 1a — footprint source + build-year routing
**Close status:** BJ does NOT clear its full stop-condition gate. Code ships. Benches do not run on a dataset with silent gaps.

### Stop-condition state

| # | Condition | State | Evidence |
|---|---|---|---|
| 1 | MS lookup p95 ≤100ms on 22 FL addrs | ❌ BLOCKED | Load halted mid-stream — prod Supabase DB is 329% over free-tier quota, writes server-side throttled |
| 2 | Self-derive unit test on tiles 1-5 | ❌ pending | `.tmp/calculator-bench/tile*.laz` not present (disposable artifacts) |
| 3 | Overpass circuit-breaker forced-failure verified | 🟢 done | `test_overpass_breaker_mock.py` 5/5: CLOSED → fail → CLOSED → fail → OPEN → cooldown-blocked retry short-circuits → fast-forward past 300s → HALF_OPEN probe → success → CLOSED |
| 4 | 396d owner named | 🟢 done | Hannah. Brief: `decisions/396d-ridge-hip-valley-options.md` (vault) with 4-col spec (cost / time-to-resolve / confidence contribution / scope-impact) |

### Blocker — Supabase free-tier quota exceeded

Database 329% over quota. Write path throttled server-side across ALL connection shapes (management API, psycopg2, supabase-js). Observed symptoms this session:

- Load throughput held at ~5,000 rows/s for ~18 min (to ~5.2M rows) then collapsed to <50 rows/s
- Batch HTTP requests timed out at 180s despite previous success
- Supabase dashboard Connection String page metadata fetch paused (same throttled DB)

**Load cannot proceed until quota is resolved.** BK opens with the architecture question below, not a load retry.

### Architecture question for BK open

`building_footprints` is ~2-5 GB. Does that belong in prod Supabase at all, even after a tier upgrade? Options to weigh in `decisions/phase-b-building-footprints-storage.md`:

| # | Option | Fit | Cost | Trade-off |
|---|---|---|---|---|
| A | Prod Supabase (post-tier-upgrade) | existing code works | Supabase Pro $25/mo+ | couples reference + transactional data |
| B | Separate Supabase project (geospatial) | RPC abstraction carries | 2nd Supabase bill | 1 extra DB connection in /api/estimate |
| C | Local file + rtree on long-lived worker | cheapest, fastest | $0 storage | Vercel serverless fs is per-invocation — needs worker or object-store |
| D | SpatiaLite + SQLite bundled in function | zero external dep | function size budget | may not fit Vercel cap |
| E | External managed PG (Neon / Crunchy) | same shape as B | cheaper per-GB | another infra piece |

Do NOT start any load work until this decision lands.

### Root-cause post-mortem — silent-skip loader bug (durable lesson)

`scripts/phase_b/ms_load_api.py::_flush` caught HTTP/URL/Timeout/OS errors, logged `[err]`, returned `(0, True)`, discarded the 10k-row batch. **No retry. No abort threshold. Caller did not requeue.**

Evidence from the live log:

```
inserted=5,000,000  read=5,000,000  rate=4,703 rows/s  elapsed=1063s
...
inserted=5,400,000  read=5,420,000  rate=383 rows/s  elapsed=14094s
```

`read` (features consumed from the GeoJSON stream) outpaced `inserted` by 20k once throttling started. That gap = two dropped 10k batches, silently.

**Why it's dangerous:** MS FL feature stream is geographically interleaved, so skipped batches produce scattered silent gaps across the state, not a visible regional cut. A bench run would have looked superficially OK with a mildly-depressed hit rate, and the missing hits would have masqueraded as MS coverage gaps rather than loader bugs.

**Fix requirements before this loader is reused in any shape:**

1. Per-batch retry with exponential backoff (1 / 2 / 4 / 8 / 16 s), N=5.
2. Abort after N batch failures (default) OR dead-letter failed batches + non-zero exit.
3. End-of-run reconciliation: `read_features == inserted + non_polygon_skipped`, non-zero exit on mismatch.
4. Pass/fail banner — SUCCESS only on matched reconciliation.

**Proposed new hard rule:** *Bulk loaders must reconcile read vs inserted and exit non-zero on mismatch.* Candidate for `feedback_bulk_loader_reconcile.md`.

**Why I didn't catch it earlier:** I wrote the except block to continue-on-error so a transient glitch wouldn't abort a 20-min load. That part was reasonable. What was NOT reasonable: no retry, no abort threshold, and no post-load reconciliation. Unbounded silent skipping in a pipeline whose correctness depends on completeness is a design error. It's my job to write loaders that fail loud, not Hannah's.

### Code shipped this session

**Committed in `18a3228`:**
- `supabase/079_building_footprints.sql` (applied to prod: postgis 3.3.7, `building_footprints`, `footprint_source_health`, `footprint_cache`, `footprint_lookup()`)
- `scripts/phase_b/ms_download.py` — MS Azure blob download
- `scripts/phase_b/ms_load.py` — psycopg2 direct loader (designed path; no DB password this session so unused)
- `scripts/phase_b/footprint_lookup.py` — `resolve()` chain + DB-backed circuit breaker
- `scripts/phase_b/build_year_router.py` — build-year routing
- `scripts/phase_b/bench_ms_lookup.py` + `bench_addresses.json` — 22-addr geo-stratified bench
- `scripts/phase_b/test_selfderive.py`, `test_overpass_breaker.py`
- `scripts/phase_b/README.md`

**Committed in `ef6610e`:**
- Tile 4 (Tall Pines, Pinellas 2018 QL2) added to self-derive test
- `ms_lookup(conn=...)` + pooled-conn bench path with inline timing-boundary comments
- Breaker test with explicit 5-step cooldown-gate output
- `overpass_lookup()` exception path bug fix: was hardcoded `"closed"`, now returns the state granted by `allow()` (matters for HALF_OPEN probe failures)
- `decisions/396d-ridge-hip-valley-options.md` side-by-side table restructured to exact 4-column spec

**Committed in this handoff commit:**
- `scripts/phase_b/ms_load_api.py` — management API loader **with the silent-skip bug**; kept for the post-mortem reproducibility; DO NOT USE without the fix list above
- `scripts/phase_b/bench_ms_lookup_rpc.py` — PostgREST RPC bench variant (pre-built, not exercised this session)
- `scripts/phase_b/test_overpass_breaker_mock.py` — pure-logic breaker test (monkey-patches persistence to in-memory dict) — this is what closed stop-condition #3
- This `SESSION_LOG.md`

### BK opening sequence

1. **Storage decision doc** → `decisions/phase-b-building-footprints-storage.md`. Pick from A-E (or propose F). No load work before this lands.
2. **Patch or replace `ms_load_api.py`** per the post-mortem fix list. If answer to #1 is "not Supabase anymore," this loader may be irrelevant — replace with the tool suited to the chosen substrate.
3. **Re-run the full MS FL load** with fail-loud reconciliation. Single pass, gated on `read == inserted + non_polygon_skipped`.
4. **Run 22-addr bench** per `bench_ms_lookup_rpc.py` (or substrate-appropriate equivalent). Report header carries BK's commit hash.
5. **LAZ re-fetch** for self-derive test — optional BK judgment call, not on critical path.

BK's original scope (TNM client + L2 cache per scoping Section 2) sequences AFTER 1-4.

### Hard rules carried

- Freeze-before-reports: this log carries `18a3228` + `ef6610e` + the handoff-commit hash for its own closing record.
- No-fix-loop: BJ is NOT retrying the load. BK opens on architecture, not Round 2.
- Ship bar unchanged: sqft + pitch + segments + ridge/hip/valley + perimeter.

### .mcp.json

Token rotated this session via Edit only (hard rule: never overwrite). New token lives in `.mcp.json` only — not committed (`.mcp.json` is gitignored although tracked historically; this session's change is NOT staged), not echoed in logs, not in this file.
