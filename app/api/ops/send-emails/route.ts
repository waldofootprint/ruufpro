// Batch cold email outreach — adds prospects to Instantly campaign.
// POST body: { batch_id?: string, prospect_ids?: string[], campaign_id?: string }
// Only sends to prospects with outreach_method = 'cold_email' and owner_email present.
// Falls back to INSTANTLY_DEFAULT_CAMPAIGN_ID env var if campaign_id not provided.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addLeadsToCampaign } from "@/lib/instantly";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { batch_id, prospect_ids } = body as {
    batch_id?: string;
    prospect_ids?: string[];
    campaign_id?: string;
  };

  const campaign_id = body.campaign_id || process.env.INSTANTLY_DEFAULT_CAMPAIGN_ID;

  if (!campaign_id) {
    return NextResponse.json({ error: "No campaign_id provided and INSTANTLY_DEFAULT_CAMPAIGN_ID not set" }, { status: 400 });
  }

  if (!batch_id && !prospect_ids?.length) {
    return NextResponse.json({ error: "Provide batch_id or prospect_ids" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find qualifying prospects: outreach_approved, has email, cold_email method
  let query = supabase
    .from("prospect_pipeline")
    .select("id, business_name, owner_name, owner_email, phone, their_website_url, city, state, preview_site_url")
    .eq("stage", "outreach_approved")
    .not("owner_email", "is", null);

  if (batch_id) {
    query = query.eq("batch_id", batch_id);
  } else if (prospect_ids?.length) {
    query = query.in("id", prospect_ids);
  }

  const { data: prospects, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to cold_email method (or no method set + no form)
  const emailProspects = (prospects || []).filter((p) => {
    return p.owner_email;
  });

  if (emailProspects.length === 0) {
    return NextResponse.json({
      queued: 0,
      skipped_no_email: (prospects || []).length,
      message: "No prospects have email addresses for cold outreach",
    });
  }

  // Build Instantly leads with custom variables for personalization
  const leads = emailProspects.map((p) => {
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
        preview_url: p.preview_site_url || "",
        claim_url: p.preview_site_url
          ? p.preview_site_url.replace("/site/", "/claim/")
          : "",
      },
    };
  });

  // Add to Instantly campaign
  const result = await addLeadsToCampaign(campaign_id, leads);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Update pipeline: mark as sent + set outreach_method
  const now = new Date().toISOString();
  const ids = emailProspects.map((p) => p.id);

  await supabase
    .from("prospect_pipeline")
    .update({
      stage: "sent",
      stage_entered_at: now,
      outreach_method: "cold_email",
      sent_at: now,
      email_sequence_id: campaign_id,
    })
    .in("id", ids);

  return NextResponse.json({
    queued: result.added,
    campaign_id,
    skipped_no_email: (prospects || []).length - emailProspects.length,
  });
}
