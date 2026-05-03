// Coverage check (calculator superiority plan M1.6).
// Called by V4 estimate widget after homeowner picks an address. If the
// roofer has set service_zips and coverage_check_enabled is true, we
// compare the address ZIP against that list before letting the homeowner
// burn through 8 funnel questions.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { contractor_id, zip } = await request.json();

    if (!contractor_id) {
      return NextResponse.json({ error: "contractor_id required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabase
      .from("estimate_settings")
      .select("service_zips, coverage_check_enabled")
      .eq("contractor_id", contractor_id)
      .single();

    // No settings, no service zips, or check disabled → always in zone.
    if (!settings || !settings.coverage_check_enabled || !settings.service_zips || settings.service_zips.length === 0) {
      return NextResponse.json({ in_zone: true, enforced: false });
    }

    // No zip resolved (Places API didn't return one) → fail open. Don't punish
    // homeowner for a Google API gap. Roofer can still triage out-of-zone leads.
    if (!zip) {
      return NextResponse.json({ in_zone: true, enforced: false });
    }

    const normalized = String(zip).trim().slice(0, 5);
    const inZone = settings.service_zips.some((z: string) => String(z).trim().slice(0, 5) === normalized);

    return NextResponse.json({ in_zone: inZone, enforced: true });
  } catch (err) {
    console.error("Coverage check failed:", err);
    // Fail open on errors — don't block legitimate homeowners.
    return NextResponse.json({ in_zone: true, enforced: false });
  }
}
