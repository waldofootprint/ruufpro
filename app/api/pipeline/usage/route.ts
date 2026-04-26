import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getMonthlyUsage,
  OVERAGE_COST_CENTS,
} from "@/lib/property-pipeline/bundle-usage";

export async function GET() {
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!contractor) {
    return NextResponse.json(
      { error: "Contractor profile not found" },
      { status: 404 }
    );
  }

  const usage = await getMonthlyUsage(supabase, contractor.id);
  return NextResponse.json({
    used: usage.used,
    bundled: usage.bundled,
    remaining: usage.remaining,
    is_overage: usage.isOverage,
    next_card_cost_cents: usage.isOverage ? OVERAGE_COST_CENTS : 0,
  });
}
