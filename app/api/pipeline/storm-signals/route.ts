// Returns most-recent storm event per county within last STORM_WINDOW_DAYS.
// Consumed by the Property Pipeline dashboard tab to render the ⛈️ tag.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const STORM_WINDOW_DAYS = 90;

export async function GET() {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date(
    Date.now() - STORM_WINDOW_DAYS * 86_400_000
  ).toISOString();

  const { data, error } = await supabase
    .from("storm_events")
    .select("county, valid_at, typecode, magnitude, city")
    .gte("valid_at", since)
    .order("valid_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byCounty: Record<string, {
    valid_at: string;
    typecode: string;
    magnitude: number | null;
    city: string | null;
    count: number;
  }> = {};

  for (const r of data ?? []) {
    const key = (r.county || "").toLowerCase();
    if (!key) continue;
    if (!byCounty[key]) {
      byCounty[key] = {
        valid_at: r.valid_at,
        typecode: r.typecode,
        magnitude: r.magnitude,
        city: r.city,
        count: 1,
      };
    } else {
      byCounty[key].count++;
    }
  }

  return NextResponse.json({
    window_days: STORM_WINDOW_DAYS,
    counties: byCounty,
  });
}
