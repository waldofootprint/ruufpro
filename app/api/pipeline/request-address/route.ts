import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "crypto";

import { normalizeAddressLine } from "@/lib/property-pipeline/address.mjs";

function hashAddress(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* read-only */
          }
        },
      },
    }
  );
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, service_area_zips")
    .eq("user_id", user.id)
    .single();
  if (!contractor)
    return NextResponse.json(
      { error: "Contractor profile not found" },
      { status: 404 }
    );

  const body = await request.json().catch(() => ({}));
  const address: string = body?.address ?? "";
  if (!address.trim())
    return NextResponse.json({ error: "Address required." }, { status: 400 });

  const normalized = normalizeAddressLine(address);
  const hash = hashAddress(normalized);

  // Find the candidate in the universe.
  const { data: candidate, error: lookupErr } = await supabase
    .from("property_pipeline_candidates")
    .select("id, address_raw, city, zip, status, requested_at")
    .eq("address_hash", hash)
    .maybeSingle();
  if (lookupErr)
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });

  if (!candidate) {
    return NextResponse.json(
      {
        error:
          "Couldn't find that address in Manatee County records. Either it's outside the universe (not a single-family home) or it had a recent re-roof permit on file.",
      },
      { status: 404 }
    );
  }

  // Service-area gate.
  const zips = (contractor.service_area_zips ?? []) as string[];
  if (zips.length > 0 && !zips.includes(candidate.zip)) {
    return NextResponse.json(
      {
        error: `That address is in ${candidate.zip}, outside your service area. Add the ZIP in Settings → Service Area first.`,
      },
      { status: 400 }
    );
  }

  if (candidate.status !== "active") {
    return NextResponse.json(
      {
        error: "That address is no longer active in the queue.",
      },
      { status: 410 }
    );
  }

  // Bump priority.
  const { data: updated, error: updateErr } = await supabase
    .from("property_pipeline_candidates")
    .update({ requested_at: new Date().toISOString() })
    .eq("id", candidate.id)
    .select("id, address_raw, city, zip, requested_at")
    .single();
  if (updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    candidate: updated,
    message: `Queued ${updated.address_raw} ahead of the rest.`,
  });
}
