// Business event notifications — lightweight endpoint for client-side events.
// Called fire-and-forget from onboarding after signup.

import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";
import { notifySlack } from "@/lib/slack-notify";

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can trigger notifications
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event, data } = await req.json();

  if (event === "signup") {
    await notifySlack({
      type: "new_signup",
      businessName: data.businessName || "Unknown",
      email: user.email || "no email",
      city: data.city || "",
      state: data.state || "",
    });
  }

  return NextResponse.json({ ok: true });
}
