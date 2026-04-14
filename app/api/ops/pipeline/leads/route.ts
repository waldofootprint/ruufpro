// Pipeline Leads API — returns individual leads for a batch (used when expanding a batch row).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Auth is handled by the /ops layout (admin email check).
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batch_id");
  if (!batchId) return NextResponse.json({ error: "batch_id required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch pipeline rows — business info is stored directly on prospect_pipeline
  // (prospects don't have a contractors record until they sign up)
  const { data, error } = await supabase
    .from("prospect_pipeline")
    .select("*")
    .eq("batch_id", batchId)
    .order("stage_entered_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map rows — use direct columns, fall back to contractor join for legacy rows
  const leads = (data || []).map((row: any) => ({
    id: row.id,
    contractor_id: row.contractor_id,
    batch_id: row.batch_id,
    stage: row.stage,
    stage_entered_at: row.stage_entered_at,
    business_name: row.business_name || "Unknown",
    city: row.city || "",
    state: row.state || "",
    phone: row.phone || null,
    rating: row.rating || null,
    reviews_count: row.reviews_count || null,
    owner_name: row.owner_name,
    owner_email: row.owner_email,
    preview_site_url: row.preview_site_url,
    their_website_url: row.their_website_url,
    emails_sent_count: row.emails_sent_count || 0,
    reply_category: row.reply_category,
    reply_text: row.reply_text,
    draft_response: row.draft_response,
    draft_status: row.draft_status,
    scraped_at: row.scraped_at,
    enriched_at: row.enriched_at,
    site_built_at: row.site_built_at,
    site_approved_at: row.site_approved_at,
    sent_at: row.sent_at,
    replied_at: row.replied_at,
    contact_form_url: row.contact_form_url,
    form_field_mapping: row.form_field_mapping,
    has_captcha: row.has_captcha,
    form_detected_at: row.form_detected_at,
    outreach_method: row.outreach_method,
    form_submitted_at: row.form_submitted_at,
    form_submission_status: row.form_submission_status,
    form_submission_error: row.form_submission_error,
    form_submission_attempts: row.form_submission_attempts,
  }));

  return NextResponse.json(leads);
}
