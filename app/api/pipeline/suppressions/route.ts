import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "crypto";

import { normalizeAddressLine } from "@/lib/property-pipeline/address.mjs";

function hashAddress(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

async function getContractor() {
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
  if (!user) return { error: "Unauthorized", status: 401 as const };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!contractor)
    return { error: "Contractor profile not found", status: 404 as const };

  return { supabase, contractorId: contractor.id as string };
}

export async function GET() {
  const ctx = await getContractor();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data, error } = await ctx.supabase
    .from("mail_suppressions")
    .select("id, address_hash, source, reason, suppressed_at")
    .or(`contractor_id.eq.${ctx.contractorId},contractor_id.is.null`)
    .order("suppressed_at", { ascending: false })
    .limit(200);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Try to resolve the human-readable address by joining against the candidates
  // we know about. (mail_suppressions stores hash only.)
  const hashes = (data ?? []).map((s) => s.address_hash);
  const { data: cands } = hashes.length
    ? await ctx.supabase
        .from("property_pipeline_candidates")
        .select("address_hash, address_raw, city, zip")
        .in("address_hash", hashes)
    : { data: [] as { address_hash: string; address_raw: string; city: string; zip: string }[] };

  const addrByHash = new Map(
    (cands ?? []).map((c) => [c.address_hash, c])
  );

  return NextResponse.json({
    suppressions: (data ?? []).map((s) => {
      const match = addrByHash.get(s.address_hash);
      return {
        id: s.id,
        address: match
          ? `${match.address_raw}, ${match.city} ${match.zip}`
          : null,
        source: s.source,
        reason: s.reason,
        suppressed_at: s.suppressed_at,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getContractor();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json().catch(() => ({}));
  const address: string = body?.address ?? "";
  const reason: string | null = body?.reason ?? null;

  if (!address.trim()) {
    return NextResponse.json(
      { error: "Address required." },
      { status: 400 }
    );
  }

  const normalized = normalizeAddressLine(address);
  if (normalized.length < 5) {
    return NextResponse.json(
      { error: "That address looks too short to be valid." },
      { status: 400 }
    );
  }
  const hash = hashAddress(normalized);

  const { data, error } = await ctx.supabase
    .from("mail_suppressions")
    .insert({
      address_hash: hash,
      contractor_id: ctx.contractorId,
      source: "manual",
      reason: reason ?? null,
    })
    .select("id, address_hash, source, reason, suppressed_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already on your block list." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    suppression: {
      id: data.id,
      address,
      source: data.source,
      reason: data.reason,
      suppressed_at: data.suppressed_at,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getContractor();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Only allow deleting own (non-global) entries.
  const { error } = await ctx.supabase
    .from("mail_suppressions")
    .delete()
    .eq("id", id)
    .eq("contractor_id", ctx.contractorId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
