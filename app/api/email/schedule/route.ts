// Schedule onboarding email sequence for a newly published contractor.
// Called from the client after handlePublish succeeds.

import { NextRequest, NextResponse } from "next/server";
import { scheduleOnboardingSequence } from "@/lib/email-sequences";

export async function POST(req: NextRequest) {
  try {
    const { contractorId } = await req.json();

    if (!contractorId) {
      return NextResponse.json({ error: "Missing contractorId" }, { status: 400 });
    }

    await scheduleOnboardingSequence(contractorId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to schedule onboarding emails:", err);
    return NextResponse.json({ error: "Failed to schedule emails" }, { status: 500 });
  }
}
