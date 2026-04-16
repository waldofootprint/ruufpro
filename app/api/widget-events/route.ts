// Widget Events API — public, no-auth POST for recording widget/estimate page views.
// Fire-and-forget from client side. Used by estimate widget + living estimate page.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_TYPES = [
  "widget_view",
  "living_estimate_view",
  "material_switch",
  "price_adjustment",
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractor_id, session_fp, event_type, page, metadata, lead_id } =
      body;

    if (!contractor_id || !session_fp || !event_type || !page) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from("widget_events").insert({
      contractor_id,
      session_fp,
      event_type,
      page,
      metadata: metadata || {},
      lead_id: lead_id || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
