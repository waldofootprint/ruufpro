import { NextResponse } from "next/server";
export async function GET() {
  // Auth handled by /ops layout (client-side admin email check).
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
