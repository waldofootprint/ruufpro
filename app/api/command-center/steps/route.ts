import { NextRequest, NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";
import type { PlayStep } from "@/lib/command-center";

// PATCH: Toggle a step's done status within a play
export async function PATCH(req: NextRequest) {
  const supabase = createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { playId, stepIndex, done } = await req.json();
  if (!playId || stepIndex === undefined) {
    return NextResponse.json({ error: "Missing playId or stepIndex" }, { status: 400 });
  }

  // Fetch current steps
  const { data: play, error: fetchErr } = await supabase
    .from("command_plays")
    .select("steps")
    .eq("id", playId)
    .single();

  if (fetchErr || !play) {
    return NextResponse.json({ error: "Play not found" }, { status: 404 });
  }

  const steps = (play.steps as PlayStep[]) || [];
  if (stepIndex < 0 || stepIndex >= steps.length) {
    return NextResponse.json({ error: "Invalid step index" }, { status: 400 });
  }

  steps[stepIndex].done = done;

  const { data, error } = await supabase
    .from("command_plays")
    .update({ steps })
    .eq("id", playId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
