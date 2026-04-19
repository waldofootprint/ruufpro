// Pre-warm RentCast property cache. The estimate widget calls this when a
// homeowner picks an address from the Places dropdown — fires the RentCast
// fetch in the background while they answer the remaining questions. By the
// time they submit, the cache is warm and /api/estimate's guardrail can
// compare satellite-measured roof area against property records.
//
// Cost: ~$0.05/address, cached forever. Fire-and-forget — response is not
// awaited, endpoint returns immediately.

import { NextRequest, NextResponse } from "next/server";
import { getCachedProperty, fetchPropertyData } from "@/lib/rentcast-api";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address || typeof address !== "string" || address.length < 10) {
      return NextResponse.json({ error: "address required" }, { status: 400 });
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
