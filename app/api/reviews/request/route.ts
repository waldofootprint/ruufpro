// Trigger a review request SMS to a homeowner after job completion.
// Protected: requires authenticated contractor. Validates lead ownership.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Cookie-aware client for auth check
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
            } catch {
              // Safe to ignore in read-only context
            }
          },
        },
      }
    );

    // Verify authenticated user
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required" },
        { status: 400 }
      );
    }

    // Service role client for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up the contractor for this user
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, business_name, google_review_url")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor profile not found" },
        { status: 404 }
      );
    }

    // Look up the lead and verify it belongs to this contractor
    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone, contractor_id")
      .eq("id", leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!lead.phone) {
      return NextResponse.json(
        { error: "Lead has no phone number on file" },
        { status: 400 }
      );
    }

    if (!contractor.google_review_url) {
      return NextResponse.json(
        { error: "No Google review URL configured. Set it in your dashboard settings." },
        { status: 400 }
      );
    }

    // Emit event to Inngest — handles review SMS with retry + monitoring
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({
      name: "sms/review.requested",
      data: {
        contractorId: contractor.id,
        leadId: lead.id,
      },
    });

    return NextResponse.json({ success: true, queued: true });
  } catch (err) {
    console.error("Review request endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to send review request" },
      { status: 500 }
    );
  }
}
