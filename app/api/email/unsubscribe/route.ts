// Unsubscribe endpoint — CAN-SPAM compliance.
// GET /api/email/unsubscribe?cid=<contractor_id>
// Shows confirmation page + records unsubscribe.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");

  if (!cid) {
    return new NextResponse("Missing contractor ID", { status: 400 });
  }

  const supabase = createServerSupabase();

  // Record unsubscribe (upsert so clicking twice doesn't error)
  await supabase
    .from("email_unsubscribes")
    .upsert(
      { contractor_id: cid, unsubscribed_at: new Date().toISOString() },
      { onConflict: "contractor_id" }
    );

  // Return a simple HTML confirmation
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFC;">
  <div style="text-align:center;max-width:400px;padding:24px;">
    <h1 style="font-size:24px;font-weight:700;color:#0F1B2D;margin-bottom:8px;">You've been unsubscribed</h1>
    <p style="font-size:15px;color:#64748B;line-height:1.6;">
      You won't receive any more emails from RuufPro.
      Your website and dashboard are still active — nothing changes there.
    </p>
    <a href="/dashboard" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#0F1B2D;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      Go to Dashboard
    </a>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
