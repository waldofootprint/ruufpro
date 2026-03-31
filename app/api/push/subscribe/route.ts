// Save a push notification subscription for a contractor's device.
// Called when the roofer enables push notifications in the dashboard.
// Protected: requires auth — only the contractor who owns this account can subscribe.

import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthSupabase();

    // Verify the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contractor_id, subscription } = await request.json();

    if (!contractor_id || !subscription?.endpoint) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Verify this user owns the contractor account
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("id", contractor_id)
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("push_subscriptions").upsert({
      contractor_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    if (error) {
      console.error("Push subscribe upsert error:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
