import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET — Claude checks for unacknowledged pings
// Returns pings + any workflow steps that changed since last check
export async function GET(req: NextRequest) {
  const supabase = getAdminSupabase();
  const since = req.nextUrl.searchParams.get("since"); // ISO timestamp

  // Get unacknowledged pings
  const { data: pings, error: pingErr } = await supabase
    .from("claude_pings")
    .select("*")
    .eq("acknowledged", false)
    .order("created_at", { ascending: false });

  if (pingErr) {
    // Table might not exist yet — return empty
    if (pingErr.code === "42P01") return NextResponse.json({ pings: [], changes: [] });
    return NextResponse.json({ error: pingErr.message }, { status: 500 });
  }

  // Also get recently changed workflow steps (last 24h or since param)
  const cutoff = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: changes } = await supabase
    .from("workflow_step_status")
    .select("*")
    .gt("updated_at", cutoff)
    .neq("status", "pending")
    .order("updated_at", { ascending: false });

  return NextResponse.json({ pings: pings || [], changes: changes || [] });
}

// POST — Hannah sends a ping (manual button or auto from workflow action)
export async function POST(req: NextRequest) {
  const supabase = getAdminSupabase();
  const body = await req.json();

  const { data, error } = await supabase
    .from("claude_pings")
    .insert({
      source: body.source || "manual",
      message: body.message || null,
      workflow_id: body.workflow_id || null,
      step_id: body.step_id || null,
      action: body.action || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — Claude acknowledges pings after reading them
export async function PATCH(req: NextRequest) {
  const supabase = getAdminSupabase();
  const { pingIds } = await req.json();

  if (!pingIds || !Array.isArray(pingIds)) {
    return NextResponse.json({ error: "pingIds array required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("claude_pings")
    .update({ acknowledged: true })
    .in("id", pingIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ acknowledged: pingIds.length });
}
