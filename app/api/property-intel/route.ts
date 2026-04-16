// Property Intelligence endpoint — fetches property data for a lead's address.
// Click-to-fetch pattern: contractor clicks "Get Property Intel" on a lead card,
// which calls this endpoint. Data is cached so repeat lookups are free.
//
// Uses 2 RentCast API calls per new lookup (records + AVM).
// Free tier: 50 calls/month = 25 property lookups.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";
import { lookupProperty } from "@/lib/rentcast-api";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { lead_id, address } = body;

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    // Lookup property (cache-first)
    const { data, fromCache } = await lookupProperty(address);

    // Link to lead if lead_id provided
    if (lead_id && data.id && data.id !== "uncached") {
      await supabase
        .from("leads")
        .update({ property_data_id: data.id })
        .eq("id", lead_id);
    }

    return NextResponse.json({
      ...data,
      from_cache: fromCache,
    });
  } catch (err: any) {
    console.error("Property intel error:", err);

    // Distinguish between "no data found" and API errors
    if (err.message?.includes("No property data found")) {
      return NextResponse.json(
        { error: "No property data found for this address. This may be a new construction or rural property." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to fetch property data" },
      { status: 500 }
    );
  }
}
