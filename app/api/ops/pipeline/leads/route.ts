// Pipeline Leads API — returns individual leads for a batch (used when expanding a batch row).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const batchId = req.nextUrl.searchParams.get("batch_id");
  if (!batchId) return NextResponse.json({ error: "batch_id required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Join pipeline with contractors to get business info
  const { data, error } = await supabase
    .from("prospect_pipeline")
    .select(`
      id,
      contractor_id,
      batch_id,
      stage,
      stage_entered_at,
      owner_name,
      owner_email,
      preview_site_url,
      their_website_url,
      emails_sent_count,
      reply_category,
      reply_text,
      draft_response,
      draft_status,
      scraped_at,
      enriched_at,
      site_built_at,
      site_approved_at,
      sent_at,
      replied_at,
      contractors (
        business_name,
        city,
        state,
        phone,
        google_rating,
        google_reviews_count
      )
    `)
    .eq("batch_id", batchId)
    .order("stage_entered_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten contractor data into each row
  const leads = (data || []).map((row: any) => ({
    id: row.id,
    contractor_id: row.contractor_id,
    batch_id: row.batch_id,
    stage: row.stage,
    stage_entered_at: row.stage_entered_at,
    business_name: row.contractors?.business_name || "Unknown",
    city: row.contractors?.city || "",
    state: row.contractors?.state || "",
    phone: row.contractors?.phone || null,
    rating: row.contractors?.google_rating || null,
    reviews_count: row.contractors?.google_reviews_count || null,
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
  }));

  return NextResponse.json(leads);
}
