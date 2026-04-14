// Batch form detection — fires Inngest events to detect contact forms on prospect websites.
// POST body: { batch_id?: string, prospect_ids?: string[] }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;
  const body = await req.json();
  const { batch_id, prospect_ids } = body as {
    batch_id?: string;
    prospect_ids?: string[];
  };

  if (!batch_id && !prospect_ids?.length) {
    return NextResponse.json({ error: "Provide batch_id or prospect_ids" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find prospects that need form detection
  let query = supabase
    .from("prospect_pipeline")
    .select("id")
    .not("their_website_url", "is", null)
    .is("form_detected_at", null);

  if (batch_id) {
    query = query.eq("batch_id", batch_id);
  } else if (prospect_ids?.length) {
    query = query.in("id", prospect_ids);
  }

  const { data: prospects, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!prospects?.length) {
    return NextResponse.json({ queued: 0, message: "No prospects need form detection" });
  }

  // Fire Inngest events
  await inngest.send(
    prospects.map((p) => ({
      name: "ops/form.detect" as const,
      data: { prospectId: p.id },
    }))
  );

  return NextResponse.json({ queued: prospects.length });
}
