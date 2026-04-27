import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim();
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const key = process.env.GOOGLE_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });
  }

  const zoom = searchParams.get("zoom") ?? "20";
  const size = searchParams.get("size") ?? "640x640";
  const scale = searchParams.get("scale") ?? "2";

  const url =
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${encodeURIComponent(address)}` +
    `&zoom=${zoom}&size=${size}&maptype=satellite&scale=${scale}&key=${key}`;

  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: "google static maps failed", status: upstream.status, body: text.slice(0, 400) },
      { status: 502 }
    );
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
