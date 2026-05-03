// M1.7 Mode B telemetry — 7-day refusal-rate roll-up.
// Numerator: widget_events rows with event_type='mode_b_fired'.
// Denominator: numerator + 'estimate_returned' (every attempt that reached the
// API past validation logs one of the two).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!contractor) return NextResponse.json({ error: "Contractor not found" }, { status: 404 });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: fires }, { count: returned }] = await Promise.all([
      supabase
        .from("widget_events")
        .select("*", { count: "exact", head: true })
        .eq("contractor_id", contractor.id)
        .eq("event_type", "mode_b_fired")
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("widget_events")
        .select("*", { count: "exact", head: true })
        .eq("contractor_id", contractor.id)
        .eq("event_type", "estimate_returned")
        .gte("created_at", sevenDaysAgo),
    ]);

    const firesN = fires || 0;
    const returnedN = returned || 0;
    const totalAttempts = firesN + returnedN;
    const ratePct = totalAttempts > 0
      ? Math.round((firesN / totalAttempts) * 1000) / 10
      : 0;

    return NextResponse.json({
      fires_7d: firesN,
      total_attempts_7d: totalAttempts,
      rate_pct: ratePct,
    });
  } catch (err) {
    console.error("Mode B rate API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
