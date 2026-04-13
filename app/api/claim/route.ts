// Claim API — links a newly signed-up user to an existing contractor record.
// Called from /claim/[slug] after auth signup.
// Sets user_id, starts 14-day Pro trial, notifies Slack.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";
import { PRO_FLAGS } from "@/lib/stripe";
import { notifySlack } from "@/lib/slack-notify";

export async function POST(req: NextRequest) {
  // Auth check — user must be logged in (just signed up)
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractorId, slug } = await req.json();
  if (!contractorId || !slug) {
    return NextResponse.json({ error: "Missing contractorId or slug" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify contractor exists and hasn't been claimed
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, user_id, email")
    .eq("id", contractorId)
    .single();

  if (!contractor) {
    return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  }

  if (contractor.user_id) {
    return NextResponse.json({ error: "This site has already been claimed" }, { status: 400 });
  }

  // Link user to contractor + start 14-day Pro trial
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("contractors")
    .update({
      user_id: user.id,
      email: user.email || contractor.email,
      trial_ends_at: trialEndsAt,
      ...PRO_FLAGS,
    })
    .eq("id", contractorId);

  // Notify Slack
  notifySlack({
    type: "site_claimed",
    businessName: contractor.business_name,
    email: user.email || "",
    slug,
  }).catch(() => {});

  // Schedule onboarding emails (fire-and-forget)
  fetch(`${req.nextUrl.origin}/api/email/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractorId }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, trialEndsAt });
}
