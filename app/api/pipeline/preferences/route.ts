import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    .select("id, pipeline_auto_approve, pipeline_daily_cap")
    .eq("user_id", user.id)
    .single();
  if (!contractor)
    return { error: "Contractor profile not found", status: 404 as const };

  return { supabase, contractor };
}

export async function GET() {
  const ctx = await getContractor();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  return NextResponse.json({
    auto_approve: ctx.contractor.pipeline_auto_approve ?? false,
    daily_cap: ctx.contractor.pipeline_daily_cap ?? 5,
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getContractor();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json().catch(() => ({}));
  const updates: { pipeline_auto_approve?: boolean; pipeline_daily_cap?: number } = {};

  if (typeof body.auto_approve === "boolean") {
    updates.pipeline_auto_approve = body.auto_approve;
  }
  if (typeof body.daily_cap === "number") {
    if (body.daily_cap < 1 || body.daily_cap > 50) {
      return NextResponse.json(
        { error: "Daily cap must be between 1 and 50." },
        { status: 400 }
      );
    }
    updates.pipeline_daily_cap = Math.round(body.daily_cap);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from("contractors")
    .update(updates)
    .eq("id", ctx.contractor.id)
    .select("pipeline_auto_approve, pipeline_daily_cap")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    auto_approve: data.pipeline_auto_approve,
    daily_cap: data.pipeline_daily_cap,
  });
}
