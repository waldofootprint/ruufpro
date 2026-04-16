// Batch review request — send review request emails to multiple completed leads at once.
// Used by dashboard "Send to All" button and Copilot sendReviewRequests tool.
// Cap: 20 per batch. Duplicate-safe (skips already-requested leads).

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
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch { /* read-only */ }
          },
        },
      }
    );

    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadIds } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "leadIds array required" }, { status: 400 });
    }

    if (leadIds.length > 20) {
      return NextResponse.json({ error: "Maximum 20 leads per batch" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, google_review_url, review_email_delay")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    if (!contractor.google_review_url) {
      return NextResponse.json({ error: "No Google review URL configured" }, { status: 400 });
    }

    // Fetch leads that belong to this contractor and are completed/won
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, email, status")
      .eq("contractor_id", contractor.id)
      .in("id", leadIds)
      .in("status", ["completed", "won"]);

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: "No eligible leads found" }, { status: 400 });
    }

    // Check which leads already have review requests (duplicate prevention)
    const { data: existingRequests } = await supabase
      .from("review_requests")
      .select("lead_id")
      .eq("contractor_id", contractor.id)
      .in("lead_id", leads.map(l => l.id));

    const alreadyRequested = new Set((existingRequests || []).map(r => r.lead_id));

    // Filter to leads that have email and haven't been requested
    const eligible = leads.filter(l => l.email && !alreadyRequested.has(l.id));
    const skipped = leads.length - eligible.length;

    // Emit Inngest events for each eligible lead
    const { inngest } = await import("@/lib/inngest/client");
    const errors: string[] = [];
    let queued = 0;

    for (const lead of eligible) {
      try {
        await inngest.send({
          name: "sms/review.requested",
          data: {
            contractorId: contractor.id,
            leadId: lead.id,
            delay: contractor.review_email_delay || "immediate",
          },
        });
        queued++;
      } catch (err: any) {
        errors.push(`${lead.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ queued, skipped, errors });
  } catch (err) {
    console.error("Batch review request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
