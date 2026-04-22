// Pre-warm. Three independent fire-and-forget warmups run in parallel:
//
//   1. RentCast property cache (when `address` is provided). ~$0.05/address.
//      Cached forever. Used by /api/estimate's guardrail to compare
//      satellite-measured roof area against property records. Dormant while
//      RentCast subscription is inactive.
//
//   2. Modal LiDAR container warmup (Track A.8-timeout-fix). Pings the Modal
//      /measure endpoint with known-good Brighton Hill coords so the next
//      real request hits a warm container instead of eating ~24s cold-start.
//      Gated on `lidar_pipeline_global.enabled=true`. 2s hard timeout —
//      warmup failure must never surface to the user.
//
//   3. PostGIS connection-pool warmup (Track A.9-class-2 §3.4). Fires a single
//      `building_footprints` SELECT against Supabase so the shared pool has a
//      hot backend connection before Modal's psycopg2.connect() runs (Bohannon
//      ~3s PG cold-connect remediation). Gated on the same flag as Modal.
//
// Called on widget mount (warmup-only, no body) and on address-pick (full).

import { NextRequest, NextResponse } from "next/server";
import { getCachedProperty, fetchPropertyData } from "@/lib/rentcast-api";
import { readFlags } from "@/lib/feature-flags";
import { createServerSupabase } from "@/lib/supabase-server";

const MODAL_WARMUP_TIMEOUT_MS = 2_000;
const PG_WARMUP_TIMEOUT_MS = 1_000;
// Brighton Hill — known-good FL address that resolves through Pipeline A.
const WARMUP_LAT = 30.2082767;
const WARMUP_LNG = -81.5228272;

async function fireModalWarmup(): Promise<void> {
  const t0 = Date.now();
  try {
    const flags = await readFlags(null);
    if (!flags.lidarGlobal) {
      return;
    }
    const url = process.env.LIDAR_MEASURE_URL;
    if (!url) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODAL_WARMUP_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lat: WARMUP_LAT,
          lng: WARMUP_LNG,
          address: "modal-warmup",
        }),
        signal: controller.signal,
      });
      const elapsedMs = Date.now() - t0;
      console.log(
        JSON.stringify({
          event: "modal_prewarm",
          status: res.ok ? "ok" : `http_${res.status}`,
          elapsedMs,
        })
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const elapsedMs = Date.now() - t0;
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      JSON.stringify({
        event: "modal_prewarm",
        status: "error",
        elapsedMs,
        error: message,
      })
    );
  }
}

async function firePgWarmup(): Promise<void> {
  const t0 = Date.now();
  try {
    const flags = await readFlags(null);
    if (!flags.lidarGlobal) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PG_WARMUP_TIMEOUT_MS);
    try {
      const supabase = createServerSupabase();
      const { error } = await supabase
        .from("building_footprints")
        .select("gid", { count: "exact", head: true })
        .abortSignal(controller.signal)
        .limit(1);
      const elapsedMs = Date.now() - t0;
      console.log(
        JSON.stringify({
          event: "pg_prewarm",
          status: error ? "error" : "ok",
          elapsedMs,
          error: error?.message,
        })
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const elapsedMs = Date.now() - t0;
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      JSON.stringify({
        event: "pg_prewarm",
        status: "error",
        elapsedMs,
        error: message,
      })
    );
  }
}

export async function POST(request: NextRequest) {
  // Always kick off Modal + PG warmup in parallel — independent of RentCast.
  // Fire-and-forget: we do NOT await these before responding.
  void fireModalWarmup();
  void firePgWarmup();

  try {
    const body = await request.json().catch(() => ({}));
    const address =
      typeof body?.address === "string" && body.address.length >= 10
        ? body.address
        : null;

    // Warmup-only mode: no address → nothing more to do (Modal warmup already
    // fired above). Used by widget mount ping.
    if (!address) {
      return NextResponse.json({ status: "warming", modal: true });
    }

    const cached = await getCachedProperty(address).catch(() => null);
    if (cached) {
      return NextResponse.json({ status: "warm" });
    }

    // Fire-and-forget. Don't await — we don't want the widget waiting.
    fetchPropertyData(address).catch((err) =>
      console.warn("[prewarm] RentCast fetch failed:", err?.message || err)
    );

    return NextResponse.json({ status: "warming" });
  } catch (err) {
    console.error("[prewarm] error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
