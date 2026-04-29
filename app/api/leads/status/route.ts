// Update a lead's status. Server-side path so we can fan out side effects
// (currently: review.push-prompt event when status flips to won/completed).
// Auth-protected; verifies lead belongs to caller's contractor.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const REVIEWABLE = new Set(["won", "completed"]);

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

    const { leadId, status } = (await request.json()) as {
      leadId?: string;
      status?: string;
    };

    if (!leadId || !status) {
      return NextResponse.json(
        { error: "leadId and status required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, review_email_delay")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, status, contractor_id")
      .eq("id", leadId)
      .single();

    if (!lead || lead.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prevStatus = lead.status;

    const { error: updateErr } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", leadId)
      .eq("contractor_id", contractor.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Update failed" },
        { status: 500 }
      );
    }

    // Fire review prompt push when transitioning into a reviewable state.
    // Skip if already reviewable (avoids re-firing on won → completed).
    if (REVIEWABLE.has(status) && !REVIEWABLE.has(prevStatus || "")) {
      try {
        const { inngest } = await import("@/lib/inngest/client");
        await inngest.send({
          name: "review.push-prompt",
          data: {
            contractorId: contractor.id,
            leadId,
            delay: contractor.review_email_delay || "immediate",
            origin: request.nextUrl.origin,
          },
        });
      } catch (err) {
        console.error("review.push-prompt emit failed:", err);
        // Don't fail the status update if the event fails — best-effort.
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead status update error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
