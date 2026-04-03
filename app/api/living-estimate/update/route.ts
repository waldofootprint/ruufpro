// Update homeowner selections on a living estimate.
// Called from the interactive estimate page when they select a material or toggle add-ons.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const { share_token, selected_material, selected_addons } = body;

    if (!share_token) {
      return NextResponse.json({ error: "share_token required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (selected_material !== undefined) updateData.selected_material = selected_material;
    if (selected_addons !== undefined) updateData.selected_addons = selected_addons;

    const { error } = await supabase
      .from("living_estimates")
      .update(updateData)
      .eq("share_token", share_token);

    if (error) {
      console.error("Living estimate update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Living estimate update error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
