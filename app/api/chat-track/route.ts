// View tracking endpoint for Riley standalone chat pages.
// Called from StandaloneChatWrapper on page load.
// Mirrors app/api/preview-track/route.ts pattern.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { contractor_id, identifier } = await request.json();

    if (!contractor_id || !identifier) {
      return NextResponse.json({ error: "contractor_id and identifier required" }, { status: 400 });
    }

    // Hash the IP for privacy (don't store raw IPs)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    const userAgent = request.headers.get("user-agent") || null;
    const referrer = request.headers.get("referer") || null;

    await supabase.from("chat_page_views").insert({
      contractor_id,
      identifier,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer: referrer,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Chat track error:", err);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
