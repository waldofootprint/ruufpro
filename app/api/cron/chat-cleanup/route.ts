// Cron: delete chat conversations older than 90 days.
// Fulfills the privacy policy promise: "Chat conversations with Riley
// are retained for up to 90 days, after which they are automatically deleted."
// Vercel cron schedule: "0 8 * * *" (8 UTC = 4am ET)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data, error } = await supabase
    .from("chat_conversations")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) {
    console.error("Chat cleanup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deleted = data?.length ?? 0;
  console.log(`Chat cleanup: deleted ${deleted} conversations older than 90 days`);

  return NextResponse.json({ deleted });
}
