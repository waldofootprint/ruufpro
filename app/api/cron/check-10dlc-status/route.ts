// Daily cron job — checks all pending 10DLC registrations and advances
// them to the next step if approved. Backup for webhooks in case they miss.
// Configured in vercel.json to run daily at 9am ET.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verify this is coming from Vercel Cron (not a random request).
  // If CRON_SECRET is not set, reject ALL requests — fail closed.
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { checkAllPendingRegistrations } = await import("@/lib/twilio-10dlc");
    await checkAllPendingRegistrations();

    return NextResponse.json({ ok: true, checked: new Date().toISOString() });
  } catch (err: any) {
    console.error("10DLC status cron error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
