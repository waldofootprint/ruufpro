import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("command_advisor")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // For "note" type, replace existing note (only one active at a time)
  if (body.type === "note") {
    await supabase.from("command_advisor").delete().eq("type", "note");
  }

  const { data, error } = await supabase
    .from("command_advisor")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
