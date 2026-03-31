// View tracking endpoint for prospect preview pages.
// Called from ProspectBanner client component on page load.
// Inserts a row into prospect_views for follow-up intelligence.

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
    const { slug, site_id } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    // Hash the IP for privacy (don't store raw IPs)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    const userAgent = request.headers.get("user-agent") || null;
    const referrer = request.headers.get("referer") || null;

    await supabase.from("prospect_views").insert({
      site_id: site_id || null,
      slug,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer: referrer,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Preview track error:", err);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
