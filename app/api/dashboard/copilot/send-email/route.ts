// Send a follow-up email to a lead from the dashboard Copilot strip.
// Uses Resend. From = noreply@ruufpro.com, reply-to = contractor.email
// so homeowner replies route to the roofer's own inbox.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const MAX_EMAILS_PER_CONTRACTOR_DAY = 100;
const DAY_MS = 86_400_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isRateLimitedDb(supabase: any, key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at) < now) {
      await supabase
        .from("rate_limits")
        .upsert({ key, count: 1, reset_at: resetAt.toISOString() }, { onConflict: "key" });
      return false;
    }

    const newCount = existing.count + 1;
    await supabase
      .from("rate_limits")
      .update({ count: newCount, updated_at: now.toISOString() })
      .eq("key", key);
    return newCount > max;
  } catch {
    return false;
  }
}

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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, business_name, email, owner_first_name")
      .eq("user_id", user.id)
      .single();

    if (!contractor) return NextResponse.json({ error: "Contractor profile not found" }, { status: 404 });
    if (!contractor.email) {
      return NextResponse.json(
        { error: "No contractor email on file. Set it in Settings so replies can reach you." },
        { status: 400 }
      );
    }

    if (await isRateLimitedDb(supabase, `copilot-send-email:${contractor.id}`, MAX_EMAILS_PER_CONTRACTOR_DAY, DAY_MS)) {
      return NextResponse.json(
        { error: "Daily email limit reached", limit: MAX_EMAILS_PER_CONTRACTOR_DAY },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { leadId, subject, body: messageBody } = body as {
      leadId?: string;
      subject?: string;
      body?: string;
    };

    if (!leadId || !messageBody?.trim()) {
      return NextResponse.json({ error: "leadId and body are required" }, { status: 400 });
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, email, contractor_id")
      .eq("id", leadId)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.contractor_id !== contractor.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!lead.email) return NextResponse.json({ error: "Lead has no email on file" }, { status: 400 });

    const finalSubject = subject?.trim() || `Following up — ${contractor.business_name}`;
    const signature = contractor.owner_first_name
      ? `${contractor.owner_first_name} · ${contractor.business_name}`
      : contractor.business_name;

    const escapedBody = messageBody
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.6;">${escapedBody}</div>
        <p style="margin-top: 24px; font-size: 14px; color: #374151;">— ${signature}</p>
      </div>
    `;
    const plainText = `${messageBody}\n\n— ${signature}`;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${contractor.business_name} <noreply@ruufpro.com>`,
      to: lead.email,
      replyTo: contractor.email,
      subject: finalSubject,
      html,
      text: plainText,
    });

    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-email route error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
