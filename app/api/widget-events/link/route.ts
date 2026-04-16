// Widget Events Link API — backfill lead_id on widget_events after lead creation.
// Called once when the estimate widget form is submitted and a lead is created.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { session_fp, contractor_id, lead_id } = await request.json();

    if (!session_fp || !contractor_id || !lead_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from("widget_events")
      .update({ lead_id })
      .eq("session_fp", session_fp)
      .eq("contractor_id", contractor_id)
      .is("lead_id", null);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
