import { NextResponse } from "next/server";
import { buildRoofSceneFromTrace } from "@/lib/roof-3d-from-trace";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim();
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const origin = new URL(req.url).origin;
  const traceResp = await fetch(`${origin}/api/postcard/roof-trace?address=${encodeURIComponent(address)}`, {
    cache: "no-store",
  });
  const traceData = await traceResp.json();
  if (!traceResp.ok || !traceData.trace) {
    return NextResponse.json({ error: "trace_failed", traceData }, { status: 502 });
  }
  const scene = buildRoofSceneFromTrace(traceData.trace, address);
  return NextResponse.json({ trace: traceData.trace, scene });
}
