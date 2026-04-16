// Look up roof data for a lead's address.
// Cache-first: checks roof_data_cache (free). If miss, calls Google Solar API.
// Leads from the estimate widget already have cached data — this is a free lookup.
// New addresses cost 1 Google Solar API call (~$0.01).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

async function getAuthedContractor(cookieStore: ReturnType<typeof cookies>) {
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* read-only */ }
        },
      },
    }
  );

  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return contractor ? { supabase, contractorId: contractor.id } : null;
}

function hashAddress(address: string): string {
  const normalized = address.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const auth = await getAuthedContractor(cookieStore);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  // 1. Check cache first (free)
  const addressHash = hashAddress(address);
  const { data: cached } = await auth.supabase
    .from("roof_data_cache")
    .select("roof_area_sqft, pitch_degrees, num_segments, segment_data")
    .eq("address_hash", addressHash)
    .single();

  if (cached) {
    return NextResponse.json({
      roofAreaSqft: cached.roof_area_sqft,
      pitchDegrees: cached.pitch_degrees || 0,
      numSegments: cached.num_segments || 0,
      segments: cached.segment_data || [],
      fromCache: true,
    });
  }

  // 2. Cache miss — call Google Solar API
  try {
    const { getRoofData } = await import("@/lib/solar-api");
    const result = await getRoofData(address);

    if (!result.data) {
      return NextResponse.json({
        error: "No roof data available for this address",
        roofAreaSqft: null,
      }, { status: 404 });
    }

    return NextResponse.json({
      roofAreaSqft: result.data.roofAreaSqft,
      pitchDegrees: result.data.pitchDegrees,
      numSegments: result.data.numSegments,
      segments: result.data.segments,
      fromCache: false,
    });
  } catch (err: unknown) {
    console.error("Roof intel error:", err);
    return NextResponse.json({ error: "Failed to fetch roof data" }, { status: 500 });
  }
}
