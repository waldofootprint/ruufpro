import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasResendKey: !!process.env.RESEND_API_KEY,
    keyPrefix: process.env.RESEND_API_KEY?.substring(0, 6) || "missing",
  });
}
