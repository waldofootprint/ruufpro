// Public freshness probe for the daily IEM LSR ingest cron.
// Returns when the last ingest happened so an external observer (scheduled
// remote agent) can verify the cron is firing without needing DB credentials.
//
// Read-only metadata, no PII — safe to expose unauthenticated.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("storm_events")
    .select("ingested_at")
    .order("ingested_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json(
      { error: error.message, fresh: false },
      { status: 500 }
    );
  }

  const last = data?.[0]?.ingested_at ?? null;
  const now = Date.now();
  const hoursAgo = last
    ? (now - new Date(last).getTime()) / (60 * 60 * 1000)
    : null;

  return NextResponse.json({
    last_ingested_at: last,
    hours_ago: hoursAgo,
    fresh: hoursAgo !== null && hoursAgo <= 26,
    cron_path: "/api/cron/ingest-iem-lsr",
    cron_schedule_utc: "30 6 * * *",
    expected_max_hours_between_runs: 26,
  });
}
