import { NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

// Lightweight health check for ops settings page.
// Returns Twilio balance + Inngest failure count (24h).

export async function GET() {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result: {
    twilio_balance: string | null;
    inngest_failures_24h: number | null;
  } = {
    twilio_balance: null,
    inngest_failures_24h: null,
  };

  // ── Twilio balance (5s timeout) ──────────────────────────────────
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    const balance = await client.balance.fetch();
    result.twilio_balance = balance.balance;
  } catch (err) {
    console.error("[ops/health] Twilio balance fetch failed:", err);
  }

  return NextResponse.json(result);
}
