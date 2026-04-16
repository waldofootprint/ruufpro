// Combined approve + send — approves outreach gate and sends in one action.
// POST body: { batch_id, approved_ids[], rejected_ids[] }
//
// Flow:
// 1. Advance approved leads: site_approved → outreach_approved → sent
// 2. Add cold_email leads to Instantly campaign
// 3. Queue form leads for submission via Inngest
// 4. Mark rejected leads as unsubscribed
// 5. Update gate record

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addLeadsToCampaign } from "@/lib/instantly";
import { inngest } from "@/lib/inngest/client";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const { batch_id, approved_ids, rejected_ids } = body as {
    batch_id: string;
    approved_ids: string[];
    rejected_ids: string[];
  };

  if (!batch_id) {
    return NextResponse.json({ error: "batch_id required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();
  let emailed = 0;
  let formsQueued = 0;
  let rejected = 0;

  // 1. Handle rejections — move to unsubscribed
  if (rejected_ids?.length > 0) {
    await supabase
      .from("prospect_pipeline")
      .update({ stage: "unsubscribed", stage_entered_at: now })
      .in("id", rejected_ids);
    rejected = rejected_ids.length;
  }

  // 2. Fetch approved leads with their data
  if (!approved_ids?.length) {
    return NextResponse.json({ emailed: 0, forms_queued: 0, rejected });
  }

  const { data: leads, error } = await supabase
    .from("prospect_pipeline")
    .select("id, business_name, owner_name, owner_email, phone, city, state, their_website_url, preview_site_url, contact_form_url, has_captcha, outreach_method")
    .in("id", approved_ids);

  if (error || !leads) {
    return NextResponse.json({ error: error?.message || "No leads found" }, { status: 500 });
  }

  // Split by outreach method
  const emailLeads = leads.filter(l => {
    const method = l.outreach_method || (l.contact_form_url ? "form" : "cold_email");
    return method === "cold_email" && l.owner_email;
  });

  const formLeads = leads.filter(l => {
    const method = l.outreach_method || (l.contact_form_url ? "form" : "cold_email");
    return method === "form" && l.contact_form_url && !l.has_captcha;
  });

  // 3. Send cold emails via Instantly
  const campaignId = process.env.INSTANTLY_DEFAULT_CAMPAIGN_ID;

  if (emailLeads.length > 0 && campaignId) {
    const instantlyLeads = emailLeads.map(p => {
      const nameParts = (p.owner_name || "").split(" ");
      return {
        email: p.owner_email!,
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        company_name: p.business_name || "",
        phone: p.phone || "",
        website: p.their_website_url || "",
        custom_variables: {
          city: p.city || "",
          state: p.state || "FL",
          preview_url: p.preview_site_url
            ? `https://ruufpro.com${p.preview_site_url}`
            : "",
          claim_url: p.preview_site_url
            ? `https://ruufpro.com${p.preview_site_url.replace("/site/", "/claim/")}`
            : "",
        },
      };
    });

    const result = await addLeadsToCampaign(campaignId, instantlyLeads);
    if (result.success) {
      emailed = result.added;
    }

    // Update email leads to sent
    await supabase
      .from("prospect_pipeline")
      .update({
        stage: "sent",
        stage_entered_at: now,
        outreach_method: "cold_email",
        sent_at: now,
        outreach_approved_at: now,
        email_sequence_id: campaignId,
      })
      .in("id", emailLeads.map(l => l.id));
  } else if (emailLeads.length > 0 && !campaignId) {
    // No campaign ID — just advance to outreach_approved so they're not stuck
    await supabase
      .from("prospect_pipeline")
      .update({
        stage: "outreach_approved",
        stage_entered_at: now,
        outreach_method: "cold_email",
        outreach_approved_at: now,
      })
      .in("id", emailLeads.map(l => l.id));
    emailed = -1; // Signal: approved but not sent (no campaign ID)
  }

  // 4. Queue form submissions via Inngest
  if (formLeads.length > 0) {
    // Advance to outreach_approved first
    await supabase
      .from("prospect_pipeline")
      .update({
        stage: "outreach_approved",
        stage_entered_at: now,
        outreach_method: "form",
        outreach_approved_at: now,
      })
      .in("id", formLeads.map(l => l.id));

    // Fire staggered Inngest events for form submission
    const events = formLeads.map((p, i) => ({
      name: "ops/form.submit" as const,
      data: { prospectId: p.id },
      ...(i > 0 ? { ts: Date.now() + i * 30000 } : {}),
    }));

    await inngest.send(events);
    formsQueued = formLeads.length;
  }

  // 5. Update gate record
  await supabase
    .from("pipeline_gates")
    .update({
      status: "approved",
      items_approved: approved_ids.length,
      items_rejected: rejected,
      items_pending: 0,
      closed_at: now,
    })
    .eq("batch_id", batch_id)
    .eq("gate_type", "outreach_approval")
    .eq("status", "pending");

  return NextResponse.json({
    emailed: emailed === -1 ? 0 : emailed,
    forms_queued: formsQueued,
    rejected,
    no_campaign_id: emailed === -1,
    message: emailed === -1
      ? `Approved ${emailLeads.length} email leads but INSTANTLY_DEFAULT_CAMPAIGN_ID not set — leads at outreach_approved, send manually`
      : undefined,
  });
}
