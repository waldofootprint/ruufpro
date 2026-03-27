// Save a push notification subscription for a contractor's device.
// Called when the roofer enables push notifications in the dashboard.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { contractor_id, subscription } = await request.json();

    if (!contractor_id || !subscription?.endpoint) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    await supabase.from("push_subscriptions").upsert({
      contractor_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
