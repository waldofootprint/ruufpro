// Cron: clean up expired scrape previews + empty abandoned batches.
// Runs every 6 hours. Vercel cron schedule: "0 */6 * * *"

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Mark expired unconsumed previews as consumed
  const { data: expired, error: expErr } = await supabase
    .from("scrape_preview_cache")
    .update({ consumed: true })
    .eq("consumed", false)
    .lt("expires_at", new Date().toISOString())
    .select("id");

  // 2. Delete empty batches older than 2 hours with no leads
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: deleted, error: delErr } = await supabase
    .from("prospect_batches")
    .delete()
    .eq("lead_count", 0)
    .eq("scrape_status", "pending")
    .lt("created_at", twoHoursAgo)
    .select("id");

  return NextResponse.json({
    expired_previews: expired?.length ?? 0,
    deleted_batches: deleted?.length ?? 0,
    errors: [expErr?.message, delErr?.message].filter(Boolean),
  });
}
