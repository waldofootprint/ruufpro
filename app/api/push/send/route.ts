// Send push notification to all of a contractor's subscribed devices.
// Internal-only: called by /api/notify when a new lead comes in.
// Protected by X-Internal-Secret header to prevent external abuse.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function POST(request: NextRequest) {
  const INTERNAL_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  webpush.setVapidDetails(
    "mailto:support@ruufpro.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  try {
    // Only allow internal calls from our own server
    const secret = request.headers.get("x-internal-secret");
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { contractor_id, title, body, url } = await request.json();

    if (!contractor_id) {
      return NextResponse.json({ error: "contractor_id required" }, { status: 400 });
    }

    // Get all push subscriptions for this contractor
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("contractor_id", contractor_id);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, reason: "no subscriptions" });
    }

    const payload = JSON.stringify({
      title: title || "New Lead — RuufPro",
      body: body || "You have a new lead. Tap to view.",
      url: url || "/dashboard",
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        // If subscription is expired/invalid, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
        console.error("Push send error:", err.statusCode || err.message);
      }
    }

    return NextResponse.json({ sent });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
