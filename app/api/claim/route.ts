// Claim API — temporarily closed while signups are disabled.
// Hard-block so even a direct supabase.auth.signUp call can't link a contractor.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Signups are temporarily closed." },
    { status: 503 }
  );
}
