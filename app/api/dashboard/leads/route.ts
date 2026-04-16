// Lead update API for Copilot Lead Console.
// Handles status pills, action log, notes, and lead scoring.
// Auth via Supabase session cookies (same as other dashboard routes).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAuthedContractor(cookieStore: ReturnType<typeof cookies>) {
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
  if (!user) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return contractor ? { supabase, contractorId: contractor.id } : null;
}

// PATCH — update a lead's copilot data (pills, actions, notes, score)
export async function PATCH(request: NextRequest) {
  const cookieStore = cookies();
  const auth = await getAuthedContractor(cookieStore);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { leadId, action, data } = body;

  if (!leadId || !action) {
    return NextResponse.json({ error: "leadId and action required" }, { status: 400 });
  }

  // Verify lead belongs to this contractor
  const { data: lead } = await auth.supabase
    .from("leads")
    .select("id, contractor_id, copilot_status_pills, copilot_action_log, notes")
    .eq("id", leadId)
    .eq("contractor_id", auth.contractorId)
    .single();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  switch (action) {
    case "toggle_pill": {
      // Toggle a status pill on/off (manual milestones only)
      const pill = data?.pill;
      if (!pill) return NextResponse.json({ error: "pill required" }, { status: 400 });

      const currentPills: string[] = lead.copilot_status_pills || [];
      const newPills = currentPills.includes(pill)
        ? currentPills.filter((p: string) => p !== pill)
        : [...currentPills, pill];

      const { error } = await auth.supabase
        .from("leads")
        .update({ copilot_status_pills: newPills })
        .eq("id", leadId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ pills: newPills });
    }

    case "log_action": {
      // Log a texted/called/emailed action (does NOT change lead status)
      const actionType = data?.actionType;
      if (!actionType) return NextResponse.json({ error: "actionType required" }, { status: 400 });

      const currentLog: Array<{ action: string; timestamp: string }> = lead.copilot_action_log || [];
      const newLog = [
        ...currentLog,
        { action: actionType, timestamp: new Date().toISOString() },
      ];

      const { error } = await auth.supabase
        .from("leads")
        .update({ copilot_action_log: newLog })
        .eq("id", leadId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ log: newLog });
    }

    case "send_email": {
      // Send email to homeowner via Resend — trackable delivery + reply detection
      const { subject, body, leadEmail } = data || {};
      if (!leadEmail || !body) {
        return NextResponse.json({ error: "leadEmail and body required" }, { status: 400 });
      }

      // Get contractor info for the "from" address
      const { data: contractor } = await auth.supabase
        .from("contractors")
        .select("email, business_name, owner_first_name")
        .eq("id", auth.contractorId)
        .single();

      if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 500 });

      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const fromName = contractor.owner_first_name
          ? `${contractor.owner_first_name} at ${contractor.business_name}`
          : contractor.business_name;

        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: `${fromName} <leads@ruufpro.com>`,
          replyTo: contractor.email,
          to: leadEmail,
          subject: subject || `Following up on your roofing estimate`,
          text: body,
        });

        if (emailError) {
          return NextResponse.json({ error: emailError.message }, { status: 500 });
        }

        // Log the action on the lead
        const currentLog: Array<{ action: string; timestamp: string; meta?: Record<string, string> }> =
          lead.copilot_action_log || [];
        const newLog = [
          ...currentLog,
          {
            action: "Emailed",
            timestamp: new Date().toISOString(),
            meta: { resend_id: emailResult?.id || "", subject: subject || "" },
          },
        ];

        await auth.supabase
          .from("leads")
          .update({ copilot_action_log: newLog })
          .eq("id", leadId);

        return NextResponse.json({ sent: true, resend_id: emailResult?.id, log: newLog });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Email send failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    case "save_notes": {
      const notes = data?.notes ?? "";
      const { error } = await auth.supabase
        .from("leads")
        .update({ notes })
        .eq("id", leadId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ notes });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
