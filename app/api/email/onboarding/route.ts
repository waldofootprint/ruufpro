// Cron endpoint — processes pending onboarding + upsell emails.
// Runs daily via Vercel Cron.
// Also handles scheduling upsell sequence for contractors 14+ days in.

import { NextRequest, NextResponse } from "next/server";
import { processPendingEmails, scheduleUpsellSequence } from "@/lib/email-sequences";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  // 1. Check for contractors who finished onboarding 14+ days ago
  //    and haven't had upsell sequence scheduled yet.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: needsUpsell } = await supabase
    .from("contractors")
    .select("id, tier, created_at")
    .lte("created_at", fourteenDaysAgo)
    .eq("tier", "free");

  if (needsUpsell) {
    for (const contractor of needsUpsell) {
      // Check if upsell already scheduled
      const { count } = await supabase
        .from("email_sequence_events")
        .select("*", { count: "exact", head: true })
        .eq("contractor_id", contractor.id)
        .eq("sequence", "upsell");

      if (!count || count === 0) {
        await scheduleUpsellSequence(contractor.id);
      }
    }
  }

  // 2. Process all pending emails (both onboarding + upsell)
  const result = await processPendingEmails();

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    upsellScheduled: needsUpsell?.length || 0,
  });
}
