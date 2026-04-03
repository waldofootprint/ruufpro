import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  let query = supabase
    .from("progress_log")
    .select("*")
    .order("logged_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (date) {
    query = query.eq("logged_date", date);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("progress_log")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
