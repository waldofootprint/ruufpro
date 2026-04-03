import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("business_metrics")
    .select("*")
    .order("metric_key", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { metric_key, metric_value } = await req.json();
  if (!metric_key) return NextResponse.json({ error: "Missing metric_key" }, { status: 400 });

  const { data, error } = await supabase
    .from("business_metrics")
    .update({ metric_value, updated_at: new Date().toISOString() })
    .eq("metric_key", metric_key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
