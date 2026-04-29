// Dismiss a review push prompt. Inserts a 'skipped' row in review_requests so
// follow-up emails don't fire and future push re-prompts dedupe.
// Idempotent: skipping an already-skipped/sent lead is a no-op.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId } = (await request.json()) as { leadId?: string };
    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, google_review_url")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, contractor_id")
      .eq("id", leadId)
      .single();

    if (!lead || lead.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Idempotent: if a row already exists, leave it alone.
    const { data: existing } = await supabase
      .from("review_requests")
      .select("id, status")
      .eq("lead_id", leadId)
      .eq("contractor_id", contractor.id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyExists: true, status: existing.status });
    }

    const { randomUUID } = await import("crypto");
    const { error } = await supabase.from("review_requests").insert({
      lead_id: leadId,
      contractor_id: contractor.id,
      status: "skipped",
      channel: "sms",
      google_review_url: contractor.google_review_url || "",
      tracking_token: randomUUID(),
    });

    if (error) {
      console.error("Skip insert error:", error);
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Review skip endpoint error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
