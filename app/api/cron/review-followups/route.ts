// Daily cron: sends email follow-up for review requests that were sent via SMS
// 3+ days ago but never clicked. Protected by CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find review requests: SMS sent 3+ days ago, not clicked, no email follow-up yet
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingFollowups, error } = await supabase
    .from("review_requests")
    .select("id")
    .eq("status", "sms_sent")
    .is("clicked_at", null)
    .is("email_followup_sent_at", null)
    .lt("sent_at", threeDaysAgo)
    .limit(50);

  if (error) {
    console.error("Review followup query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pendingFollowups || pendingFollowups.length === 0) {
    return NextResponse.json({ message: "No follow-ups needed", count: 0 });
  }

  const { scheduleReviewEmailFollowup } = await import("@/lib/sms-workflows");

  let sent = 0;
  let failed = 0;

  for (const request of pendingFollowups) {
    const result = await scheduleReviewEmailFollowup(request.id);
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`Follow-up failed for ${request.id}:`, result.error);
    }
  }

  console.log(`Review follow-ups: ${sent} sent, ${failed} failed out of ${pendingFollowups.length}`);
  return NextResponse.json({ sent, failed, total: pendingFollowups.length });
}
