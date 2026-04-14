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

  // Pass through all columns directly — no manual mapping needed.
  // New columns added via migrations automatically appear.
  return NextResponse.json(data || []);
}
