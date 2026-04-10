// Send a test lead to a connected CRM to verify the integration works
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: NextRequest) {
  const { contractorId, provider } = await req.json();

  if (!contractorId || !provider) {
    return NextResponse.json({ error: "Missing contractorId or provider" }, { status: 400 });
  }

  // Send a test lead event — the crmDirectPush function will pick it up
  await inngest.send({
    name: "sms/lead.created",
    data: {
      contractorId,
      leadName: "Test Lead (RuufPro)",
      leadPhone: "(555) 000-0000",
      leadEmail: "test@ruufpro.com",
      leadAddress: "123 Test Street, Tampa, FL 33601",
      leadMessage: "This is a test lead from RuufPro to verify your CRM connection.",
      source: "estimate_widget",
      timeline: "1_3_months",
      financingInterest: "no",
      estimateLow: 8500,
      estimateHigh: 12000,
      estimateMaterial: "Asphalt Shingles",
      estimateRoofSqft: 2100,
      // Flag so other functions can skip if needed
      isTest: true,
    },
  });

  return NextResponse.json({ success: true, message: "Test lead sent" });
}
