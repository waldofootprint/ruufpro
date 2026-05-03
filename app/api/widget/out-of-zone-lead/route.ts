// Out-of-zone lead capture (calculator superiority plan M1.6).
// Called when a homeowner whose ZIP is outside the roofer's service area
// hands over their email so the roofer can follow up if/when coverage expands.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { contractor_id, email, address, zip } = await request.json();

    if (!contractor_id || !email) {
      return NextResponse.json({ error: "contractor_id and email required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("leads").insert({
      contractor_id,
      email,
      address: address || null,
      source: "estimate_widget",
      status: "out_of_zone",
      notes: zip ? `Out of service area (ZIP ${zip})` : "Out of service area",
    });

    if (error) {
      console.error("Out-of-zone lead insert failed:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Out-of-zone lead failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
