// Living Estimate API — create and fetch interactive proposals.
//
// POST: Create a living estimate from widget results. Returns share URL.
// GET:  Fetch a living estimate by share token. Public, no auth.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const {
      contractor_id, lead_id,
      homeowner_name, homeowner_email, homeowner_phone, homeowner_address,
      roof_area_sqft, pitch_degrees, num_segments, is_satellite,
      estimates,
    } = body;

    if (!contractor_id || !homeowner_name || !estimates) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate a 12-char URL-safe share token
    const share_token = nanoid(12);

    // Load contractor's active add-ons
    const { data: addons } = await supabase
      .from("estimate_addons")
      .select("id, name, description, price, image_url")
      .eq("contractor_id", contractor_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    // Default to cheapest material
    const selected_material = estimates[0]?.material || "asphalt";

    const { data: living, error: insertErr } = await supabase
      .from("living_estimates")
      .insert({
        contractor_id,
        lead_id: lead_id || null,
        share_token,
        homeowner_name,
        homeowner_email: homeowner_email || null,
        homeowner_phone: homeowner_phone || null,
        homeowner_address: homeowner_address || null,
        roof_area_sqft: roof_area_sqft || null,
        pitch_degrees: pitch_degrees || null,
        num_segments: num_segments || null,
        is_satellite: is_satellite ?? true,
        estimates,
        available_addons: addons || [],
        selected_material,
        status: "sent",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select("id, share_token")
      .single();

    if (insertErr) {
      console.error("Living estimate insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create living estimate" }, { status: 500 });
    }

    // Link the living estimate to the lead
    if (lead_id && living) {
      await supabase
        .from("leads")
        .update({ living_estimate_id: living.id })
        .eq("id", lead_id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";
    const estimateUrl = `${baseUrl}/estimate/${share_token}`;

    return NextResponse.json({
      id: living?.id,
      share_token,
      url: estimateUrl,
    });
  } catch (err) {
    console.error("Living estimate create error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("living_estimates")
    .select("*, contractors(business_name, phone, city, state, license_number, is_insured, years_in_business, gaf_master_elite, owens_corning_preferred, certainteed_select, logo_url)")
    .eq("share_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Mark as viewed on first access
  if (data.status === "sent" && !data.viewed_at) {
    await supabase
      .from("living_estimates")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return NextResponse.json(data);
}
